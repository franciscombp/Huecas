/* ============================================================
   Huecas — saberes y sabores (v3)
   app.js — Inventario consumible, cocina libre, venta.
   ============================================================ */

const SAVE_KEY = 'huecas_save_v3';

/* ---------- Recetario aplanado ---------- */

const ALL_STEPS = [];
CUADERNO_ORDER.forEach(cid => {
  CUADERNOS[cid].steps.forEach(step => ALL_STEPS.push({ ...step, cuaderno: cid }));
});

function findStep(x, y) {
  return ALL_STEPS.find(s => (s.a === x && s.b === y) || (s.a === y && s.b === x));
}

const isTool = (id) => ITEMS[id].type === 'tool';

/* ---------- Estado ---------- */

let state = null;

function newState() {
  const s = {
    coins: INITIAL_COINS,
    owned: ['bolon'],
    inv: {},            /* id -> cantidad (ingredientes, preps, platos, mezclas) */
    tools: [],          /* utensilios permanentes */
    discovered: [],     /* pasos/resultados ya registrados en los cuadernos */
    techniques: [],
    revealed: [],
    dishesDone: [],
  };
  grantBasket(s, CUADERNOS.bolon.grants);
  return s;
}

function grantBasket(s, ids) {
  ids.forEach(id => {
    if (isTool(id)) { if (!s.tools.includes(id)) s.tools.push(id); }
    else s.inv[id] = (s.inv[id] || 0) + 1;
  });
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* memoria */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.inv || !Array.isArray(s.owned)) return null;
    return { ...newState(), ...s };
  } catch (e) { return null; }
}

const knows = (resultId) => state.discovered.includes(resultId);
const owns = (cid) => state.owned.includes(cid);
const count = (id) => isTool(id) ? (state.tools.includes(id) ? 1 : 0) : (state.inv[id] || 0);

function addItem(id, n = 1) {
  if (isTool(id)) { if (!state.tools.includes(id)) state.tools.push(id); return; }
  state.inv[id] = (state.inv[id] || 0) + n;
  if (state.inv[id] <= 0) delete state.inv[id];
}

const mainSteps = (cid) => CUADERNOS[cid].steps.filter(s => !s.variant);
const isComplete = (cid) => mainSteps(cid).every(s => knows(s.result));
const stepsDone = (cid) => mainSteps(cid).filter(s => knows(s.result)).length;

/* Ingredientes que aparecen en la lona: los que usan tus cuadernos. */
function marketIngredients() {
  const ids = new Set();
  ALL_STEPS.filter(s => owns(s.cuaderno)).forEach(s => {
    [s.a, s.b].forEach(id => { if (ITEMS[id].type === 'ingredient') ids.add(id); });
  });
  return [...ids].sort((x, y) => (ITEMS[x].price - ITEMS[y].price) || ITEMS[x].name.localeCompare(ITEMS[y].name));
}

/* ---------- Utilidades ---------- */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function buzz(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

/* ---------- Navegación ---------- */

const SCREENS = ['cover', 'shelf', 'receta', 'cocina', 'mercado'];
let currentScreen = 'cover';
let recetaOpen = null;

function show(screen) {
  currentScreen = screen;
  SCREENS.forEach(s => $('#screen-' + s).classList.toggle('active', s === screen));
  const inGame = screen !== 'cover';
  $('#tabbar').classList.toggle('hidden', !inGame);
  $('#hud').classList.toggle('hidden', !inGame);
  const tabOf = { shelf: 'shelf', receta: 'shelf', cocina: 'cocina', mercado: 'mercado' };
  $$('#tabbar .tab-btn').forEach(b => b.classList.toggle('current', b.dataset.screen === tabOf[screen]));
  if (screen === 'shelf') renderShelf();
  if (screen === 'receta') renderReceta();
  if (screen === 'cocina') renderCocina();
  if (screen === 'mercado') renderMercado();
  window.scrollTo(0, 0);
}

function openReceta(cid) { recetaOpen = cid; show('receta'); }

/* ---------- Fichas ---------- */

function renderCoins() { $$('.coin-count').forEach(n => { n.textContent = state.coins; }); }

function addCoins(n) {
  state.coins += n;
  renderCoins();
  if (n > 0) {
    const chip = $('#hud');
    chip.classList.remove('pulse');
    void chip.offsetWidth;
    chip.classList.add('pulse');
  }
}

/* Anti-atasco: si no puedes comprar, vender ni combinar, la vecina ayuda. */
function checkRescue() {
  const cheapest = Math.min(...marketIngredients().map(id => ITEMS[id].price));
  if (state.coins >= cheapest) return;
  const sellable = Object.keys(state.inv).some(id => ITEMS[id].sell);
  if (sellable) return;
  const combinable = Object.keys(state.inv).filter(id => count(id) > 0);
  const pool = [...combinable, ...state.tools];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const s = findStep(pool[i], pool[j]);
      if (s && owns(s.cuaderno)) {
        if (pool[i] === pool[j] && count(pool[i]) < 2) continue;
        return; /* aún hay una jugada válida */
      }
    }
  }
  addCoins(RESCUE_COINS);
  save();
  toast(MICROCOPY.rescue, 'seal');
}

/* ---------- Toasts ---------- */

let toastTimer = null;
function toast(msg, tone = 'ink') {
  const t = $('#toast');
  t.textContent = msg;
  t.dataset.tone = tone;
  t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 2400);
}

/* ============================================================
   ESTANTERÍA
   ============================================================ */

function renderShelf() {
  const rack = $('#shelf-books');
  rack.innerHTML = '';
  CUADERNO_ORDER.forEach(cid => {
    const c = CUADERNOS[cid];
    const owned = owns(cid);
    const done = owned && isComplete(cid);
    const total = mainSteps(cid).length;

    const book = el('button', 'book' + (owned ? '' : ' locked') + (done ? ' done' : ''));
    book.type = 'button';
    book.style.setProperty('--accent', c.accent);
    book.innerHTML = owned ? `
      <span class="book-icon">${iconOf(done ? c.dish : 'cuaderno')}</span>
      <span class="book-title">${c.title}</span>
      <span class="book-city">${c.city}</span>
      <span class="book-progress">${done
        ? '<span class="stamp-mini">completo ★</span>'
        : '●'.repeat(stepsDone(cid)) + '○'.repeat(total - stepsDone(cid))}</span>
    ` : `
      <span class="book-icon dim">${iconOf('cuaderno')}</span>
      <span class="book-title">¿${c.title}?</span>
      <span class="book-city">${c.city}</span>
      <span class="book-progress"><span class="price-tag">${c.cost} fichas en la lona</span></span>
    `;
    book.addEventListener('click', () => {
      if (owned) openReceta(cid);
      else { show('mercado'); toast('Ese cuaderno se consigue en la lona.', 'soft'); }
    });
    rack.appendChild(book);
  });

  const done = CUADERNO_ORDER.filter(cid => owns(cid) && isComplete(cid)).length;
  $('#shelf-progress').textContent = `${done} de ${CUADERNO_ORDER.length} platos recuperados`;
}

/* ============================================================
   PÁGINA DE RECETA — acertijos, no instrucciones
   ============================================================ */

function pairIcons(step) {
  return `
    <span class="mini-item">${iconOf(step.a)}<small>${ITEMS[step.a].name}</small></span>
    <span class="op">+</span>
    <span class="mini-item">${iconOf(step.b)}<small>${ITEMS[step.b].name}</small></span>
    <span class="op">→</span>
    <span class="mini-item">${iconOf(step.result)}<small>${ITEMS[step.result].name}</small></span>`;
}

function renderReceta() {
  const cid = recetaOpen || state.owned[0];
  recetaOpen = cid;
  const c = CUADERNOS[cid];
  const complete = isComplete(cid);

  $('#receta-title').textContent = c.title;
  $('#receta-city').textContent = `${c.city} · ${c.region}`;
  $('#receta-dish-icon').innerHTML = iconOf(complete ? c.dish : 'cuaderno');
  $('#receta-intro').textContent = c.intro;
  $('#receta-stamp').style.display = complete ? '' : 'none';

  const list = $('#receta-steps');
  list.innerHTML = '';
  let firstPending = true;

  c.steps.forEach((step, i) => {
    const done = knows(step.result);
    const revealed = state.revealed.includes(step.result);
    const row = el('div', 'step'
      + (done ? ' done' : '')
      + (!done && firstPending && !step.variant ? ' current' : '')
      + (step.variant ? ' variant' : ''));
    if (!done && !step.variant && firstPending) firstPending = false;

    if (done) {
      row.innerHTML = `
        <span class="step-num">${step.variant ? '✳' : i + 1}</span>
        <div class="step-body">
          <p class="step-line hand">${step.line}</p>
          <div class="step-icons">${pairIcons(step)}</div>
        </div>
        <span class="step-check">✓</span>`;
    } else {
      row.innerHTML = `
        <span class="step-num">${step.variant ? '✳' : i + 1}</span>
        <div class="step-body">
          <p class="step-hint hand">“${step.hint}”</p>
          ${revealed ? `<div class="step-icons">${pairIcons(step)}</div>` : `
          <button type="button" class="btn-ghost small reveal">Espiar la página <small>${REVEAL_COST} fichas</small></button>`}
        </div>`;
      const rev = row.querySelector('.reveal');
      if (rev) rev.addEventListener('click', () => {
        if (state.coins < REVEAL_COST) { toast(MICROCOPY.noCoins, 'soft'); return; }
        addCoins(-REVEAL_COST);
        state.revealed.push(step.result);
        save();
        renderReceta();
      });
    }
    list.appendChild(row);
  });

  $('#receta-progress').textContent = complete
    ? 'Receta recuperada. Puedes cocinarla de memoria y venderla en la lona.'
    : `${stepsDone(cid)} de ${mainSteps(cid).length} pasos recuperados`;
  $('#receta-cook').style.display = '';
}

/* ============================================================
   COCINA — combinación libre con inventario
   ============================================================ */

const slots = [null, null];
let combining = false;

function renderCocina() {
  renderInventory();
  renderSlots();
  renderRiddle();
}

/* inventario arriba: lo disponible, con cantidades */
function renderInventory() {
  const strip = $('#inventory');
  strip.innerHTML = '';
  const order = { ingredient: 0, prep: 1, dish: 2, junk: 3 };
  const ids = [
    ...state.tools,
    ...Object.keys(state.inv).sort((x, y) =>
      (order[ITEMS[x].type] - order[ITEMS[y].type]) || ITEMS[x].name.localeCompare(ITEMS[y].name)),
  ];
  if (!ids.length) {
    strip.appendChild(el('p', 'inv-empty hand', 'La despensa está vacía. Pasa por la lona.'));
    return;
  }
  ids.forEach(id => {
    const inSlots = slots.filter(s => s === id).length;
    const avail = isTool(id) ? 1 : count(id) - inSlots;
    const card = itemCard(id);
    if (!isTool(id)) card.append(el('span', 'badge', String(count(id))));
    if (avail <= 0 && !isTool(id)) card.classList.add('spent');
    card.draggable = avail > 0 || isTool(id);
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'copy';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('click', () => placeInSlot(id));
    strip.appendChild(card);
  });
}

function renderSlots() {
  [0, 1].forEach(i => {
    const zone = $('#slot-' + i);
    zone.innerHTML = '';
    zone.classList.toggle('filled', !!slots[i]);
    if (slots[i]) {
      const card = itemCard(slots[i]);
      card.tabIndex = -1;
      zone.appendChild(card);
    } else {
      zone.appendChild(el('span', 'slot-hint hand', i === 0 ? 'algo…' : '…con algo'));
    }
  });
}

function itemCard(id) {
  const item = ITEMS[id];
  const card = el('button', 'item-card type-' + item.type);
  card.type = 'button';
  card.dataset.id = id;
  card.innerHTML = `<span class="icon">${iconOf(id)}</span><span class="name">${item.name}</span>`;
  card.setAttribute('aria-label', `${item.name}, ${TYPES[item.type].label}`);
  return card;
}

/* nota sutil: el acertijo pendiente del cuaderno más avanzado */
function renderRiddle() {
  const note = $('#cocina-riddle');
  const pending = state.owned
    .map(cid => CUADERNOS[cid].steps.find(s => !knows(s.result) && !s.variant))
    .filter(Boolean);
  if (!pending.length) {
    note.innerHTML = state.owned.length === CUADERNO_ORDER.length
      ? `<span class="hand">${MICROCOPY.allDone}</span>`
      : '<span class="hand">Todo recuperado por aquí. La lona tiene más cuadernos.</span>';
    return;
  }
  const step = pending[0];
  note.innerHTML = `<span class="riddle-label">el cuaderno murmura…</span> <span class="hand">“${step.hint}”</span>`;
}

function placeInSlot(id, index = null) {
  if (combining) return;
  const inSlots = slots.filter(s => s === id).length;
  if (!isTool(id) && count(id) - inSlots <= 0) { toast('No te queda más. La lona tiene.', 'soft'); return; }
  if (isTool(id) && slots.includes(id)) { toast('Ese ya está en la mesa.', 'soft'); return; }
  let i = index;
  if (i === null) i = slots[0] === null ? 0 : slots[1] === null ? 1 : null;
  if (i === null) { toast('La mesa está llena. Toca algo para retirarlo.'); return; }
  slots[i] = id;
  renderCocina();
  if (slots[0] && slots[1]) setTimeout(attemptCombine, 420);
}

function attemptCombine() {
  if (!slots[0] || !slots[1] || combining) return;
  combining = true;
  const [x, y] = slots;
  const step = findStep(x, y);
  const valid = step && owns(step.cuaderno);
  const surface = $('#cocina-surface');

  const finish = () => {
    slots[0] = slots[1] = null;
    combining = false;
    renderCocina();
    checkRescue();
    save();
  };

  /* dos utensilios: nada que hacer, nada que perder */
  if (isTool(x) && isTool(y)) {
    surface.classList.add('shake');
    toast(MICROCOPY.toolsClank, 'soft');
    buzz(40);
    setTimeout(() => { surface.classList.remove('shake'); slots[0] = slots[1] = null; combining = false; renderCocina(); }, 450);
    return;
  }

  if (!valid) {
    /* se arruina: lo que no es utensilio se pierde en una mezcla rara */
    [x, y].forEach(id => { if (!isTool(id)) addItem(id, -1); });
    addItem('mezcla_rara', 1);
    surface.classList.add('shake');
    toast(pick(MICROCOPY.junk), 'soft');
    buzz(80);
    setTimeout(() => { surface.classList.remove('shake'); finish(); }, 500);
    return;
  }

  /* combinación correcta: consume y produce */
  [x, y].forEach(id => { if (!isTool(id)) addItem(id, -1); });
  addItem(step.result, 1);
  surface.classList.add('success');
  buzz([30, 40, 60]);
  setTimeout(() => {
    surface.classList.remove('success');
    if (!knows(step.result)) {
      slots[0] = slots[1] = null;
      combining = false;
      discoverStep(step);
      checkRescue();
    } else {
      floaty(`+1 ${ITEMS[step.result].name}`);
      toast(MICROCOPY.crafted, 'seal');
      finish();
    }
  }, 620);
}

/* textito flotante al re-cocinar */
function floaty(text) {
  const f = el('span', 'floaty hand', text);
  $('#cocina-surface').appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

/* ---------- Descubrimiento ---------- */

function discoverStep(step) {
  state.discovered.push(step.result);
  const item = ITEMS[step.result];

  let reward = item.type === 'dish'
    ? (item.meta ? REWARDS.dishMeta : item.variant ? REWARDS.dishVariant : REWARDS.dish)
    : REWARDS.step;

  let newTech = null;
  if (step.tech && !state.techniques.includes(step.tech)) {
    state.techniques.push(step.tech);
    newTech = step.tech;
    reward += REWARDS.technique;
  }
  addCoins(reward);
  save();

  if (item.type === 'dish') {
    if (!state.dishesDone.includes(step.result)) state.dishesDone.push(step.result);
    save();
    showCelebration(step, reward);
  } else {
    showPaso(step, reward, newTech);
  }
}

function showPaso(step, reward, newTech) {
  $('#paso-icon').innerHTML = iconOf(step.result);
  $('#paso-name').textContent = ITEMS[step.result].name;
  $('#paso-line').textContent = step.line;
  $('#paso-tech').innerHTML = newTech
    ? `Saber registrado: <span class="tech-chip">${iconOf(newTech)}</span> <em>${ITEMS[newTech].name}</em>` : '';
  $('#paso-reward').textContent = `+${reward} fichas`;
  $('#modal-paso').classList.add('open');
}

function closePaso() {
  $('#modal-paso').classList.remove('open');
  if (currentScreen === 'cocina') renderCocina();
  if (currentScreen === 'receta') renderReceta();
}

let celebratedCuaderno = null;
function showCelebration(step, reward) {
  celebratedCuaderno = step.cuaderno;
  const c = CUADERNOS[step.cuaderno];
  const item = ITEMS[step.result];
  $('#celebra-icon').innerHTML = iconOf(step.result);
  $('#celebra-name').textContent = item.name;
  $('#celebra-city').textContent = `${c.city} · ${c.region}`;
  $('#celebra-line').textContent = step.line;
  $('#celebra-reward').textContent = `+${reward} fichas`;
  $('#celebra-sell').textContent = item.sell
    ? `La caserita lo compra a ${item.sell} fichas. Cocínalo de memoria y vende.` : '';
  const confetti = $('#confetti');
  confetti.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const p = el('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.setProperty('--tone', ['#9dbd8a', '#d9a0b0', '#93a7c4', '#e0b45c'][i % 4]);
    confetti.appendChild(p);
  }
  $('#modal-celebra').classList.add('open');
}

function closeCelebration() {
  $('#modal-celebra').classList.remove('open');
  openReceta(celebratedCuaderno || state.owned[0]);
}

/* ============================================================
   MERCADO — comprar cuadernos e ingredientes, vender platos
   ============================================================ */

function renderMercado() {
  /* cuadernos */
  const grid = $('#market-books');
  const pendientes = CUADERNO_ORDER.filter(cid => !owns(cid));
  $('#market-books-section').style.display = pendientes.length ? '' : 'none';
  grid.innerHTML = '';
  pendientes.forEach(cid => {
    const c = CUADERNOS[cid];
    const card = el('div', 'market-book');
    card.style.setProperty('--accent', c.accent);
    card.innerHTML = `
      <span class="mb-icon">${iconOf('cuaderno')}</span>
      <span class="mb-title">${c.title}</span>
      <span class="mb-city">${c.city}</span>
      <span class="mb-blurb hand">“${c.blurb}”</span>
      <button type="button" class="price buy-btn">${c.cost} fichas</button>`;
    card.querySelector('.buy-btn').addEventListener('click', () => buyCuaderno(cid, card));
    grid.appendChild(card);
  });

  /* ingredientes */
  const ing = $('#market-ingredients');
  ing.innerHTML = '';
  marketIngredients().forEach(id => {
    const item = ITEMS[id];
    const card = el('button', 'market-item');
    card.type = 'button';
    card.innerHTML = `
      <span class="icon">${iconOf(id)}</span>
      <span class="name">${item.name}${count(id) ? ` <small class="have">×${count(id)}</small>` : ''}</span>
      <span class="price tag">${item.price} ${item.price === 1 ? 'ficha' : 'fichas'}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < item.price) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-item.price);
      addItem(id, 1);
      save();
      buzz(25);
      renderMercado();
    });
    ing.appendChild(card);
  });

  /* venta */
  const sell = $('#market-sell');
  sell.innerHTML = '';
  const sellables = Object.keys(state.inv).filter(id => ITEMS[id].sell && count(id) > 0);
  if (!sellables.length) {
    sell.appendChild(el('p', 'sell-empty hand', 'Cocina algo rico y la caserita te lo compra.'));
  } else {
    sellables.forEach(id => {
      const item = ITEMS[id];
      const card = el('button', 'market-item sellable');
      card.type = 'button';
      card.innerHTML = `
        <span class="icon">${iconOf(id)}</span>
        <span class="name">${item.name} <small class="have">×${count(id)}</small></span>
        <span class="price tag sell-tag">vender +${item.sell}</span>`;
      card.addEventListener('click', () => {
        addItem(id, -1);
        addCoins(item.sell);
        save();
        buzz(25);
        toast(MICROCOPY.sold, 'seal');
        renderMercado();
      });
      sell.appendChild(card);
    });
  }
}

function buyCuaderno(cid, card) {
  const c = CUADERNOS[cid];
  if (state.coins < c.cost) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
  addCoins(-c.cost);
  state.owned.push(cid);
  grantBasket(state, c.grants);
  save();
  toast('La caserita te fía la primera canasta.', 'seal');
  openReceta(cid);
}

function shakeCard(card) {
  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 450);
}

/* ============================================================
   ARRANQUE
   ============================================================ */

function bindEvents() {
  $('#btn-continue').addEventListener('click', () => show('shelf'));
  $('#btn-new').addEventListener('click', () => {
    const fresh = !load();
    if (fresh || confirm('¿Empezar un recetario nuevo? El actual se perderá.')) {
      state = newState();
      save();
      renderCoins();
      show('shelf');
    }
  });

  $$('#tabbar .tab-btn').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.screen)));
  $('#receta-back').addEventListener('click', () => show('shelf'));
  $('#receta-cook').addEventListener('click', () => show('cocina'));
  $('#btn-cover').addEventListener('click', () => show('cover'));

  [0, 1].forEach(i => {
    const zone = $('#slot-' + i);
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      if (id && ITEMS[id]) placeInSlot(id, i);
    });
    zone.addEventListener('click', () => {
      if (!combining && slots[i]) { slots[i] = null; renderCocina(); }
    });
  });

  $('#paso-close').addEventListener('click', closePaso);
  $('#modal-paso').addEventListener('click', (e) => { if (e.target === $('#modal-paso')) closePaso(); });
  $('#celebra-close').addEventListener('click', closeCelebration);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closePaso(); if ($('#modal-celebra').classList.contains('open')) closeCelebration(); }
  });
}

function init() {
  const saved = load();
  state = saved || newState();
  $('#btn-continue').textContent = saved ? 'Continuar' : 'Abrir el recetario';
  $$('[data-icon]').forEach(n => { n.innerHTML = iconOf(n.dataset.icon); });
  bindEvents();
  renderCoins();
  show('cover');
}

document.addEventListener('DOMContentLoaded', init);
