/* ============================================================
   Huecas — saberes y sabores (v2)
   app.js — Estado, pantallas e interacción.
   ============================================================ */

const SAVE_KEY = 'huecas_save_v2';

/* ---------- Recetario aplanado ---------- */

/* Todas las combinaciones válidas, derivadas de los cuadernos. */
const ALL_STEPS = [];
CUADERNO_ORDER.forEach(cid => {
  CUADERNOS[cid].steps.forEach(step => ALL_STEPS.push({ ...step, cuaderno: cid }));
});

function findStep(x, y) {
  return ALL_STEPS.find(s => (s.a === x && s.b === y) || (s.a === y && s.b === x));
}

/* ---------- Estado ---------- */

let state = null;

function newState() {
  return {
    coins: INITIAL_COINS,
    owned: ['bolon'],
    discovered: [...CUADERNOS.bolon.grants],
    revealed: [],          /* pasos cuyo ingrediente oculto fue revelado */
    dishesDone: [],
    active: 'bolon',       /* cuaderno activo en la cocina */
  };
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* memoria */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!Array.isArray(s.discovered) || !Array.isArray(s.owned)) return null;
    return { ...newState(), ...s };
  } catch (e) { return null; }
}

const has = (id) => state.discovered.includes(id);
const owns = (cid) => state.owned.includes(cid);

/* Pasos obligatorios de un cuaderno. */
const mainSteps = (cid) => CUADERNOS[cid].steps.filter(s => !s.variant);

/* Primer paso obligatorio sin descubrir, o null si el plato está completo. */
function currentStep(cid) {
  return mainSteps(cid).find(s => !has(s.result)) || null;
}

const isComplete = (cid) => currentStep(cid) === null;

function stepsDone(cid) {
  return mainSteps(cid).filter(s => has(s.result)).length;
}

/* ¿Le queda a este objeto algún paso pendiente en los cuadernos comprados? */
function isExhausted(id) {
  return !ALL_STEPS.some(s =>
    owns(s.cuaderno) && !has(s.result) && (s.a === id || s.b === id));
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
let recetaOpen = null; /* cuaderno mostrado en la pantalla de receta */

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

function openReceta(cid) {
  recetaOpen = cid;
  if (owns(cid) && !isComplete(cid)) { state.active = cid; save(); }
  show('receta');
}

/* ---------- Fichas ---------- */

function renderCoins() {
  $$('.coin-count').forEach(n => { n.textContent = state.coins; });
}

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
   ESTANTERÍA — selección de cuadernos, tipo "level select"
   ============================================================ */

function renderShelf() {
  const rack = $('#shelf-books');
  rack.innerHTML = '';
  CUADERNO_ORDER.forEach(cid => {
    const c = CUADERNOS[cid];
    const owned = owns(cid);
    const done = owned && isComplete(cid);
    const total = mainSteps(cid).length;
    const doneN = owned ? stepsDone(cid) : 0;

    const book = el('button', 'book' + (owned ? '' : ' locked') + (done ? ' done' : ''));
    book.type = 'button';
    book.style.setProperty('--cover', c.cover);
    book.innerHTML = owned ? `
      <span class="book-icon">${ITEMS[c.dish].icon}</span>
      <span class="book-title">${c.title}</span>
      <span class="book-city">${c.city}</span>
      <span class="book-progress">${done
        ? '<span class="stamp-mini">completo</span>'
        : '●'.repeat(doneN) + '○'.repeat(total - doneN)}</span>
    ` : `
      <span class="book-icon dim">📓</span>
      <span class="book-title">¿ ${c.title} ?</span>
      <span class="book-city">${c.city}</span>
      <span class="book-progress"><span class="price-tag">${c.cost} fichas en la lona</span></span>
    `;
    book.addEventListener('click', () => {
      if (owned) openReceta(cid);
      else { show('mercado'); toast('Ese cuaderno se consigue en la lona.', 'soft'); }
    });
    rack.appendChild(book);
  });

  const total = CUADERNO_ORDER.length;
  const done = CUADERNO_ORDER.filter(cid => owns(cid) && isComplete(cid)).length;
  $('#shelf-progress').textContent = `${done} de ${total} platos recuperados`;
}

/* ============================================================
   PÁGINA DE RECETA — la guía secuencial del cuaderno
   ============================================================ */

function stepIcons(step, revealed) {
  const a = ITEMS[step.a];
  const b = ITEMS[step.b];
  const r = ITEMS[step.result];
  const known = has(step.result);
  const showB = known || revealed;
  return `
    <span class="mini-item" title="${a.name}">${a.icon}<small>${a.name}</small></span>
    <span class="op">+</span>
    <span class="mini-item ${showB ? '' : 'unknown'}" title="${showB ? b.name : '¿?'}">
      ${showB ? b.icon : '?'}<small>${showB ? b.name : '¿qué será?'}</small></span>
    <span class="op">→</span>
    <span class="mini-item ${known ? '' : 'unknown'}">${known ? r.icon : '¿?'}<small>${known ? r.name : '…'}</small></span>
  `;
}

function renderReceta() {
  const cid = recetaOpen || state.active;
  recetaOpen = cid;
  const c = CUADERNOS[cid];
  const complete = isComplete(cid);
  const cur = currentStep(cid);

  $('#receta-title').textContent = c.title;
  $('#receta-city').textContent = `${c.city} · ${c.region}`;
  $('#receta-dish-icon').textContent = complete ? ITEMS[c.dish].icon : '📓';
  $('#receta-intro').textContent = c.intro;
  $('#receta-stamp').style.display = complete ? '' : 'none';

  const list = $('#receta-steps');
  list.innerHTML = '';
  let reachedCurrent = false;

  c.steps.forEach((step, i) => {
    const done = has(step.result);
    const isCur = cur && step.result === cur.result;
    if (isCur) reachedCurrent = true;
    const future = !done && !isCur && !step.variant;
    const revealed = state.revealed.includes(step.result);

    const row = el('div', 'step'
      + (done ? ' done' : '')
      + (isCur ? ' current' : '')
      + (future ? ' future' : '')
      + (step.variant ? ' variant' : ''));

    if (done) {
      row.innerHTML = `
        <span class="step-num">${step.variant ? '✳' : i + 1}</span>
        <div class="step-body">
          <p class="step-line hand">${step.line}</p>
          <div class="step-icons">${stepIcons(step, true)}</div>
        </div>
        <span class="step-check">✓</span>`;
    } else if (isCur || step.variant) {
      row.innerHTML = `
        <span class="step-num">${step.variant ? '✳' : i + 1}</span>
        <div class="step-body">
          <p class="step-line hand faded">${step.variant ? 'Variante — ' : ''}La página apenas se lee…</p>
          <div class="step-icons">${stepIcons(step, revealed)}</div>
          ${step.shopNote && !revealed ? `<p class="step-shopnote">${step.shopNote}</p>` : ''}
          ${isCur ? `<div class="step-actions">
            <button type="button" class="btn-chunky small go-cook">Ir a la cocina</button>
            ${!revealed ? `<button type="button" class="btn-ghost small reveal">Revelar <small>${REVEAL_COST} ficha</small></button>` : ''}
          </div>` : ''}
        </div>`;
      if (isCur) {
        row.querySelector('.go-cook').addEventListener('click', () => { state.active = cid; save(); show('cocina'); });
        const rev = row.querySelector('.reveal');
        if (rev) rev.addEventListener('click', () => revealStep(step));
      }
    } else {
      /* pasos futuros: manchados, ilegibles — la secuencia guía */
      row.innerHTML = `
        <span class="step-num">${i + 1}</span>
        <div class="step-body"><p class="step-line smudge">✕ ✕ ✕ — todavía no se distingue</p></div>`;
    }
    list.appendChild(row);
  });

  const n = mainSteps(cid).length;
  $('#receta-progress').textContent = complete
    ? 'Receta recuperada por completo.'
    : `Paso ${stepsDone(cid) + 1} de ${n}`;
}

function revealStep(step) {
  if (state.coins < REVEAL_COST) { toast(MICROCOPY.noCoins, 'soft'); return; }
  addCoins(-REVEAL_COST);
  state.revealed.push(step.result);
  save();
  renderReceta();
}

/* ============================================================
   COCINA — la mesa de trabajo con guía del cuaderno activo
   ============================================================ */

const slots = [null, null];
let combining = false;

function renderCocina() {
  renderBanner();
  renderSlots();
  renderTray();
}

/* Banner de guía: el paso actual del cuaderno activo. */
function renderBanner() {
  /* si el activo ya está completo, pasa al siguiente pendiente */
  if (isComplete(state.active)) {
    const next = CUADERNO_ORDER.find(cid => owns(cid) && !isComplete(cid));
    if (next) state.active = next;
  }
  const chips = $('#cocina-chips');
  chips.innerHTML = '';
  state.owned.forEach(cid => {
    const c = CUADERNOS[cid];
    const b = el('button', 'chip-book' + (cid === state.active ? ' current' : '') + (isComplete(cid) ? ' done' : ''),
      `${ITEMS[c.dish].icon} <span>${ITEMS[c.dish].name}</span>${isComplete(cid) ? ' ✓' : ''}`);
    b.type = 'button';
    b.addEventListener('click', () => { state.active = cid; save(); renderCocina(); });
    chips.appendChild(b);
  });

  const cur = currentStep(state.active);
  const guide = $('#cocina-guide');
  if (!cur) {
    guide.innerHTML = state.owned.every(isComplete) && state.owned.length === CUADERNO_ORDER.length
      ? `<p class="guide-line hand">${MICROCOPY.allDone}</p>`
      : `<p class="guide-line hand">Este plato ya está completo. Elige otro cuaderno o visita la lona.</p>`;
    return;
  }
  const revealed = state.revealed.includes(cur.result);
  guide.innerHTML = `
    <p class="guide-label">El cuaderno dice…</p>
    <div class="step-icons">${stepIcons(cur, revealed)}</div>
    ${cur.shopNote && !revealed && !has(cur.b) ? `<p class="step-shopnote">${cur.shopNote}</p>` : ''}
  `;
}

function renderSlots() {
  [0, 1].forEach(i => {
    const zone = $('#slot-' + i);
    zone.innerHTML = '';
    zone.classList.toggle('filled', !!slots[i]);
    if (slots[i]) {
      const card = itemCard(slots[i]);
      card.addEventListener('click', () => { if (!combining) { slots[i] = null; renderSlots(); } });
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
  card.innerHTML = `<span class="icon">${item.icon}</span><span class="name">${item.name}</span>`;
  card.setAttribute('aria-label', `${item.name}, ${TYPES[item.type].label}`);
  return card;
}

function renderTray() {
  const tray = $('#tray');
  tray.innerHTML = '';
  const order = { ingredient: 0, tool: 1, prep: 2 };
  state.discovered
    .filter(id => ITEMS[id].type in order)
    .sort((x, y) => (order[ITEMS[x].type] - order[ITEMS[y].type]) || ITEMS[x].name.localeCompare(ITEMS[y].name))
    .forEach(id => {
      const card = itemCard(id);
      if (isExhausted(id)) {
        card.classList.add('exhausted');
        card.title = 'Ya cumplió sus pasos, por ahora';
      }
      card.draggable = true;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'copy';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => placeInSlot(id));
      tray.appendChild(card);
    });
}

function placeInSlot(id, index = null) {
  if (combining) return;
  let i = index;
  if (i === null) i = slots[0] === null ? 0 : slots[1] === null ? 1 : null;
  if (i === null) { toast('La mesa está llena. Toca un objeto para retirarlo.'); return; }
  slots[i] = id;
  renderSlots();
  if (slots[0] && slots[1]) setTimeout(attemptCombine, 380);
}

function attemptCombine() {
  if (!slots[0] || !slots[1] || combining) return;
  combining = true;
  const step = findStep(slots[0], slots[1]);
  const surface = $('#cocina-surface');

  const clear = () => { slots[0] = slots[1] = null; combining = false; renderCocina(); };

  if (!step) {
    surface.classList.add('shake');
    toast(pick(MICROCOPY.fail), 'soft');
    buzz(60);
    setTimeout(() => { surface.classList.remove('shake'); combining = false; }, 450);
    return;
  }
  if (has(step.result)) {
    toast(MICROCOPY.known, 'soft');
    clear();
    return;
  }

  surface.classList.add('success');
  buzz([30, 40, 60]);
  setTimeout(() => {
    surface.classList.remove('success');
    slots[0] = slots[1] = null;
    combining = false;
    discoverStep(step);
  }, 620);
}

/* ---------- Descubrimiento de un paso ---------- */

function discoverStep(step) {
  const item = ITEMS[step.result];
  state.discovered.push(step.result);

  let reward = item.type === 'dish'
    ? (item.meta ? REWARDS.dishMeta : item.variant ? REWARDS.dishVariant : REWARDS.dish)
    : REWARDS.step;

  let newTech = null;
  if (step.tech && !has(step.tech)) {
    state.discovered.push(step.tech);
    newTech = step.tech;
    reward += REWARDS.technique;
  }

  addCoins(reward);

  if (item.type === 'dish') {
    if (!state.dishesDone.includes(step.result)) state.dishesDone.push(step.result);
    save();
    showCelebration(step, reward);
  } else {
    save();
    showPaso(step, reward, newTech);
  }
}

/* Nota rápida de paso registrado. */
function showPaso(step, reward, newTech) {
  const item = ITEMS[step.result];
  $('#paso-icon').textContent = item.icon;
  $('#paso-name').textContent = item.name;
  $('#paso-line').textContent = step.line;
  $('#paso-tech').innerHTML = newTech
    ? `Saber registrado: <em>${ITEMS[newTech].icon} ${ITEMS[newTech].name}</em>` : '';
  $('#paso-reward').textContent = `+${reward} fichas`;
  $('#modal-paso').classList.add('open');
}

function closePaso() {
  $('#modal-paso').classList.remove('open');
  if (currentScreen === 'cocina') renderCocina();
  if (currentScreen === 'receta') renderReceta();
}

/* Celebración de plato completo. */
let celebratedCuaderno = null;
function showCelebration(step, reward) {
  celebratedCuaderno = step.cuaderno;
  const c = CUADERNOS[step.cuaderno];
  const item = ITEMS[step.result];
  $('#celebra-icon').textContent = item.icon;
  $('#celebra-name').textContent = item.name;
  $('#celebra-city').textContent = `${c.city} · ${c.region}`;
  $('#celebra-line').textContent = step.line;
  $('#celebra-reward').textContent = `+${reward} fichas`;
  const confetti = $('#confetti');
  confetti.innerHTML = '';
  for (let i = 0; i < 26; i++) {
    const p = el('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.setProperty('--tone', ['#7d9b76', '#c17a58', '#4d5f80', '#e0b45c'][i % 4]);
    confetti.appendChild(p);
  }
  $('#modal-celebra').classList.add('open');
}

function closeCelebration() {
  $('#modal-celebra').classList.remove('open');
  /* al cerrar, muestra la página de la receta ya completa */
  openReceta(celebratedCuaderno || state.active);
}

/* ============================================================
   MERCADO
   ============================================================ */

function renderMercado() {
  /* cuadernos */
  const grid = $('#market-books');
  grid.innerHTML = '';
  CUADERNO_ORDER.filter(cid => CUADERNOS[cid].cost > 0).forEach(cid => {
    const c = CUADERNOS[cid];
    const owned = owns(cid);
    const card = el('div', 'market-book' + (owned ? ' owned' : ''));
    card.style.setProperty('--cover', c.cover);
    card.innerHTML = `
      <span class="mb-icon">${owned ? ITEMS[c.dish].icon : '📓'}</span>
      <span class="mb-title">${c.title}</span>
      <span class="mb-city">${c.city}</span>
      <span class="mb-blurb hand">“${c.blurb}”</span>
      ${owned
        ? '<span class="price sold">ya es tuyo</span>'
        : `<button type="button" class="price buy-btn">${c.cost} fichas</button>`}
    `;
    if (!owned) card.querySelector('.buy-btn').addEventListener('click', () => buyCuaderno(cid, card));
    grid.appendChild(card);
  });

  /* despensa */
  const extras = $('#market-extras');
  extras.innerHTML = '';
  SHOP_EXTRAS.forEach(({ id, cost, blurb }) => {
    const item = ITEMS[id];
    const owned = has(id);
    const card = el('div', 'market-item' + (owned ? ' owned' : ''));
    card.innerHTML = `
      <span class="icon">${item.icon}</span>
      <span class="name">${item.name}</span>
      <span class="blurb hand">“${blurb}”</span>
      ${owned
        ? '<span class="price sold">ya es tuyo</span>'
        : `<button type="button" class="price buy-btn">${cost} ${cost === 1 ? 'ficha' : 'fichas'}</button>`}
    `;
    if (!owned) {
      card.querySelector('.buy-btn').addEventListener('click', () => {
        if (state.coins < cost) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
        addCoins(-cost);
        state.discovered.push(id);
        save();
        toast(MICROCOPY.bought, 'seal');
        renderMercado();
      });
    }
    extras.appendChild(card);
  });
}

function buyCuaderno(cid, card) {
  const c = CUADERNOS[cid];
  if (state.coins < c.cost) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
  addCoins(-c.cost);
  state.owned.push(cid);
  c.grants.forEach(id => { if (!has(id)) state.discovered.push(id); });
  state.active = cid;
  save();
  toast('La caserita te fía lo básico. Buen provecho.', 'seal');
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
  bindEvents();
  renderCoins();
  show('cover');
}

document.addEventListener('DOMContentLoaded', init);
