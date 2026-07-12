/* ============================================================
   Huecas — saberes y sabores (v4)
   app.js — Tu hueca: cocina, clientes, arriendo y reglas.
   ============================================================ */

const SAVE_KEY = 'huecas_save_v4';

/* ---------- Recetario aplanado + reglas ---------- */

const ALL_STEPS = [];
CUADERNO_ORDER.forEach(cid => {
  CUADERNOS[cid].steps.forEach(step => ALL_STEPS.push({ ...step, cuaderno: cid }));
});

const pairMatch = (r, x, y) => (r.a === x && r.b === y) || (r.a === y && r.b === x);
const findStep = (x, y) => ALL_STEPS.find(s => pairMatch(s, x, y));
const findRule = (x, y) => RULES.find(r => pairMatch(r, x, y));

const isTool = (id) => ITEMS[id].type === 'tool';
const isDone = (id) => ['dish', 'junk'].includes(ITEMS[id].type);

/* ---------- Sucres (año 2000: todo en miles) ---------- */

const S = (n) => String(n * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ---------- Estado ---------- */

let state = null;

function newState() {
  const s = {
    coins: INITIAL_COINS,
    owned: ['bolon'],
    inv: {},
    tools: [],
    toolWear: {},        /* id -> usos restantes */
    discovered: [],
    techniques: [],
    revealed: [],
    dishesDone: [],
    active: 'bolon',
    rating: HUECA.startRating,
    served: 0, missed: 0,
    sinceRent: 0,        /* clientes desde el último arriendo */
    fiado: false,        /* si el dueño ya te fió una vez */
    timesClosed: 0,
    actions: 0, nextSpawn: HUECA.spawnMin,
  };
  grantBasket(s, CUADERNOS.bolon.grants);
  return s;
}

function grantBasket(s, ids) {
  ids.forEach(id => {
    if (isTool(id)) {
      if (!s.tools.includes(id)) {
        s.tools.push(id);
        if (ITEMS[id].wear) s.toolWear[id] = ITEMS[id].wear;
      }
    } else s.inv[id] = (s.inv[id] || 0) + 1;
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

const knows = (id) => state.discovered.includes(id);
const owns = (cid) => state.owned.includes(cid);
const count = (id) => isTool(id) ? (state.tools.includes(id) ? 1 : 0) : (state.inv[id] || 0);
const isDull = (id) => ITEMS[id].wear && (state.toolWear[id] ?? ITEMS[id].wear) <= 0;

function addItem(id, n = 1) {
  if (isTool(id)) {
    if (!state.tools.includes(id)) {
      state.tools.push(id);
      if (ITEMS[id].wear) state.toolWear[id] = ITEMS[id].wear;
    }
    return;
  }
  state.inv[id] = (state.inv[id] || 0) + n;
  if (state.inv[id] <= 0) delete state.inv[id];
}

function wearTool(id) {
  if (!ITEMS[id].wear) return;
  state.toolWear[id] = (state.toolWear[id] ?? ITEMS[id].wear) - 1;
}

const mainSteps = (cid) => CUADERNOS[cid].steps.filter(s => !s.variant);
const isComplete = (cid) => mainSteps(cid).every(s => knows(s.result));
const stepsDone = (cid) => mainSteps(cid).filter(s => knows(s.result)).length;

function marketIngredients() {
  const ids = new Set();
  ALL_STEPS.filter(s => owns(s.cuaderno)).forEach(s => {
    [s.a, s.b].forEach(id => { if (ITEMS[id].type === 'ingredient') ids.add(id); });
  });
  return [...ids].sort((x, y) => (ITEMS[x].price - ITEMS[y].price) || ITEMS[x].name.localeCompare(ITEMS[y].name));
}

function marketTools() {
  const ids = new Set();
  ALL_STEPS.filter(s => owns(s.cuaderno)).forEach(s => {
    [s.a, s.b].forEach(id => { if (isTool(id) && ITEMS[id].buyable && !state.tools.includes(id)) ids.add(id); });
  });
  return [...ids];
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
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
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
  $('#ticket').classList.toggle('offscreen', !inGame || !customer);
  const tabOf = { shelf: 'shelf', receta: 'shelf', cocina: 'cocina', mercado: 'mercado' };
  $$('#tabbar .tab-btn').forEach(b => b.classList.toggle('current', b.dataset.screen === tabOf[screen]));
  if (screen === 'shelf') renderShelf();
  if (screen === 'receta') renderReceta();
  if (screen === 'cocina') renderCocina();
  if (screen === 'mercado') renderMercado();
  window.scrollTo(0, 0);
}

function openReceta(cid) { recetaOpen = cid; show('receta'); }

function goCook(cid) {
  state.active = cid;
  save();
  show('cocina');
}

/* ---------- HUD: sucres y fama ---------- */

function renderHud() {
  $('#hud-coins').textContent = 'S/ ' + S(state.coins);
  $('#hud-rating').textContent = state.rating;
}

function addCoins(n) {
  state.coins += n;
  renderHud();
  if (n > 0) {
    const chip = $('#hud');
    chip.classList.remove('pulse');
    void chip.offsetWidth;
    chip.classList.add('pulse');
  }
}

function checkRescue() {
  const ing = marketIngredients();
  const cheapest = ing.length ? Math.min(...ing.map(id => ITEMS[id].price)) : 1;
  if (state.coins >= cheapest) return;
  if (Object.keys(state.inv).some(id => ITEMS[id].sell)) return;
  const pool = [...Object.keys(state.inv).filter(id => count(id) > 0), ...state.tools.filter(t => !isDull(t))];
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const s = findStep(pool[i], pool[j]);
      if (s && owns(s.cuaderno)) return;
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
  toastTimer = setTimeout(() => t.classList.remove('visible'), 2600);
}

/* ============================================================
   LA HUECA — clientes y arriendo
   ============================================================ */

let customer = null;      /* { name, icon, dish, deadline } */
let customerTimer = null;

/* cada acción del jugador acerca al próximo cliente */
function tickAction() {
  state.actions += 1;
  if (!customer && state.actions >= state.nextSpawn && state.dishesDone.length) {
    spawnCustomer();
  }
  save();
}

function spawnCustomer() {
  const who = pick(CLIENTES);
  const dish = pick(state.dishesDone.filter(d => !ITEMS[d].creative));
  if (!dish) return;
  customer = { ...who, dish, deadline: Date.now() + HUECA.patienceMs };
  state.actions = 0;
  state.nextSpawn = rand(HUECA.spawnMin, HUECA.spawnMax);
  renderTicket();
  buzz([40, 60, 40]);
  clearInterval(customerTimer);
  customerTimer = setInterval(() => {
    if (!customer) { clearInterval(customerTimer); return; }
    const left = customer.deadline - Date.now();
    if (left <= 0) resolveCustomer(false);
    else $('#ticket-time').textContent = Math.ceil(left / 1000) + 's';
  }, 1000);
}

function renderTicket() {
  const t = $('#ticket');
  if (!customer) { t.classList.add('offscreen'); return; }
  $('#ticket-avatar').innerHTML = iconOf(customer.icon);
  $('#ticket-text').innerHTML =
    `<strong>${customer.name}</strong> quiere <em>${ITEMS[customer.dish].name}</em>`;
  $('#ticket-time').textContent = Math.ceil((customer.deadline - Date.now()) / 1000) + 's';
  const serveBtn = $('#ticket-serve');
  serveBtn.disabled = count(customer.dish) < 1;
  serveBtn.innerHTML = count(customer.dish) < 1
    ? 'No hay listo' : `Servir <small>+S/ ${S(customerPay(customer.dish))}</small>`;
  t.classList.remove('offscreen');
}

function customerPay(dish) {
  return ITEMS[dish].sell + Math.floor(state.rating / 4); /* la fama paga */
}

function resolveCustomer(served) {
  clearInterval(customerTimer);
  const c = customer;
  customer = null;
  renderTicket();
  if (served) {
    addItem(c.dish, -1);
    const tip = rand(0, HUECA.tipMax);
    addCoins(customerPay(c.dish) + tip);
    state.rating = Math.min(HUECA.maxRating, state.rating + 1);
    state.served += 1;
    toast(`${MICROCOPY.served}${tip ? ` Propina: S/ ${S(tip)}.` : ''}`, 'seal');
    buzz([30, 40, 60]);
  } else {
    state.rating = Math.max(0, state.rating - 1);
    state.missed += 1;
    toast(MICROCOPY.missed, 'soft');
    buzz(90);
  }
  state.sinceRent += 1;
  renderHud();
  save();
  if (currentScreen === 'cocina') renderCocina();
  if (currentScreen === 'mercado') renderMercado();
  if (state.sinceRent >= HUECA.rentEvery) setTimeout(showRent, 900);
}

/* ---------- Arriendo ---------- */

function showRent() {
  state.sinceRent = 0;
  const m = $('#modal-arriendo');
  $('#arriendo-text').textContent =
    `Don Aurelio pasa por el arriendo: S/ ${S(HUECA.rent)}.`;
  const payBtn = $('#arriendo-pay');
  const canPay = state.coins >= HUECA.rent;
  const canFiar = !canPay && !state.fiado && state.rating >= 7;
  payBtn.textContent = canPay ? `Pagar S/ ${S(HUECA.rent)}`
    : canFiar ? 'Pedir que te fíe' : 'No me alcanza…';
  payBtn.dataset.mode = canPay ? 'pay' : canFiar ? 'fiar' : 'close';
  $('#arriendo-note').textContent = canPay
    ? 'La hueca sigue abierta un mes más.'
    : canFiar
      ? 'Con tu fama, don Aurelio puede esperar. Solo esta vez.'
      : 'Sin sucres y sin fama, don Aurelio no perdona.';
  m.classList.add('open');
  save();
}

function resolveRent() {
  const mode = $('#arriendo-pay').dataset.mode;
  $('#modal-arriendo').classList.remove('open');
  if (mode === 'pay') {
    addCoins(-HUECA.rent);
    toast('Arriendo pagado. Un mes más de hueca.', 'seal');
    save();
  } else if (mode === 'fiar') {
    state.fiado = true;
    toast('Don Aurelio anota en su libreta y se va sin sonreír.', 'soft');
    save();
  } else {
    closeHueca();
  }
}

/* ---------- Cierre y reapertura ---------- */

function closeHueca() {
  state.timesClosed += 1;
  $('#cierre-veces').textContent = state.timesClosed > 1
    ? `Ya van ${state.timesClosed} veces. El barrio te sigue queriendo.` : '';
  $('#modal-cierre').classList.add('open');
  save();
}

function reopenHueca() {
  /* se pierden inventario y sucres; quedan recetas, técnicas y utensilios */
  state.inv = {};
  state.coins = INITIAL_COINS;
  state.rating = HUECA.startRating;
  state.sinceRent = 0;
  state.fiado = false;
  state.actions = 0;
  state.tools.forEach(t => { if (ITEMS[t].wear) state.toolWear[t] = ITEMS[t].wear; });
  customer = null;
  renderTicket();
  save();
  renderHud();
  $('#modal-cierre').classList.remove('open');
  toast('La hueca vuelve a abrir. Las recetas nunca se fueron.', 'seal');
  show('cocina');
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
      <span class="book-progress"><span class="price-tag">S/ ${S(c.cost)} en la lona</span></span>
    `;
    book.addEventListener('click', () => {
      if (owned) openReceta(cid);
      else { show('mercado'); toast('Ese cuaderno se consigue en la lona.', 'soft'); }
    });
    rack.appendChild(book);
  });

  const done = CUADERNO_ORDER.filter(cid => owns(cid) && isComplete(cid)).length;
  $('#shelf-progress').textContent = `${done} de ${CUADERNO_ORDER.length} platos recuperados · ${state.served} clientes servidos`;
}

/* ============================================================
   PÁGINA DE RECETA
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
  const cid = recetaOpen || state.active;
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
          ${step.shopNote ? `<p class="step-shopnote">${step.shopNote}</p>` : ''}
          ${revealed ? `<div class="step-icons">${pairIcons(step)}</div>` : ''}
          <div class="step-actions">
            <button type="button" class="btn-main small try-btn">Intentar</button>
            ${!revealed ? `<button type="button" class="btn-ghost small reveal">Espiar <small>S/ ${S(REVEAL_COST)}</small></button>` : ''}
          </div>
        </div>`;
      row.querySelector('.try-btn').addEventListener('click', () => goCook(cid));
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
    ? 'Receta recuperada. Cocínala de memoria: la clientela la pide.'
    : `${stepsDone(cid)} de ${mainSteps(cid).length} pasos recuperados`;
}

/* ============================================================
   COCINA
   ============================================================ */

const slots = [null, null];
let combining = false;

function renderCocina() {
  renderChips();
  renderInventory();
  renderSlots();
  renderRiddle();
}

/* selector de recetario activo */
function renderChips() {
  const chips = $('#cocina-chips');
  chips.innerHTML = '';
  state.owned.forEach(cid => {
    const c = CUADERNOS[cid];
    const b = el('button', 'chip-book' + (cid === state.active ? ' current' : '') + (isComplete(cid) ? ' done' : ''));
    b.type = 'button';
    b.innerHTML = `<span class="chip-icon">${iconOf(c.dish)}</span><span>${ITEMS[c.dish].name}</span>${isComplete(cid) ? ' ✓' : ''}`;
    b.addEventListener('click', () => { state.active = cid; save(); renderCocina(); });
    chips.appendChild(b);
  });
}

/* despensa por secciones */
function renderInventory() {
  const put = (sel, ids, badge = true) => {
    const box = $(sel);
    box.innerHTML = '';
    if (!ids.length) { box.appendChild(el('span', 'inv-none hand', '—')); return; }
    ids.forEach(id => {
      const card = itemCard(id);
      const inSlots = slots.filter(s => s === id).length;
      if (badge && !isTool(id)) card.append(el('span', 'badge', String(count(id))));
      if (!isTool(id) && count(id) - inSlots <= 0) card.classList.add('spent');
      if (isTool(id) && ITEMS[id].wear) {
        const left = state.toolWear[id] ?? ITEMS[id].wear;
        card.append(el('span', 'wear' + (left <= 0 ? ' dull' : left <= 2 ? ' low' : ''),
          left <= 0 ? 'sin filo' : '▮'.repeat(left)));
        if (left <= 0) card.classList.add('dull-tool');
      }
      card.draggable = true;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', id);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => placeInSlot(id));
      box.appendChild(card);
    });
  };

  put('#inv-tools', state.tools);
  put('#inv-ingredients', Object.keys(state.inv)
    .filter(id => ITEMS[id].type === 'ingredient')
    .sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)));
  put('#inv-preps', Object.keys(state.inv)
    .filter(id => ITEMS[id].type === 'prep')
    .sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)));
  const done = Object.keys(state.inv).filter(id => isDone(id));
  $('#inv-done-wrap').style.display = done.length ? '' : 'none';
  put('#inv-done', done.sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)));
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

function renderRiddle() {
  const note = $('#cocina-riddle');
  const step = CUADERNOS[state.active].steps.find(s => !knows(s.result) && !s.variant);
  if (!step) {
    note.innerHTML = `<span class="hand">${ITEMS[CUADERNOS[state.active].dish].name}: recuperado. Cocina de memoria y vende.</span>`;
    return;
  }
  note.innerHTML = `<span class="riddle-label">el cuaderno murmura…</span> <span class="hand">“${step.hint}”</span>`;
}

function placeInSlot(id, index = null) {
  if (combining) return;
  if (isTool(id) && isDull(id)) { toast(MICROCOPY.dullKnife, 'soft'); return; }
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

/* --- El motor: paso canon → regla → bloqueo → mezcla rara --- */

function attemptCombine() {
  if (!slots[0] || !slots[1] || combining) return;
  combining = true;
  const [x, y] = slots;
  const surface = $('#cocina-surface');

  const consume = () => [x, y].forEach(id => {
    if (isTool(id)) wearTool(id);
    else addItem(id, -1);
  });
  const finish = () => {
    slots[0] = slots[1] = null;
    combining = false;
    renderCocina();
    tickAction();
    checkRescue();
    save();
  };
  const reject = (msg) => {
    surface.classList.add('shake');
    toast(msg, 'soft');
    buzz(50);
    setTimeout(() => { surface.classList.remove('shake'); slots[0] = slots[1] = null; combining = false; renderCocina(); }, 450);
  };

  /* 1. paso canon de un cuaderno tuyo */
  const step = findStep(x, y);
  if (step && owns(step.cuaderno)) {
    consume();
    addItem(step.result, 1);
    surface.classList.add('success');
    buzz([30, 40, 60]);
    setTimeout(() => {
      surface.classList.remove('success');
      if (!knows(step.result)) {
        slots[0] = slots[1] = null;
        combining = false;
        discover(step.result, step, 'canon');
        tickAction();
        checkRescue();
      } else {
        floaty(`+1 ${ITEMS[step.result].name}`);
        toast(MICROCOPY.crafted, 'seal');
        finish();
      }
    }, 620);
    return;
  }

  /* 2. reglas: inventos y fallos explícitos */
  const rule = findRule(x, y);
  if (rule) {
    consume();
    addItem(rule.result, 1);
    const ok = rule.kind === 'creative';
    surface.classList.add(ok ? 'success' : 'shake');
    buzz(ok ? [30, 40, 60] : 80);
    setTimeout(() => {
      surface.classList.remove('success', 'shake');
      if (ok && !knows(rule.result)) {
        slots[0] = slots[1] = null;
        combining = false;
        discover(rule.result, rule, 'creative');
        tickAction();
        checkRescue();
      } else {
        toast(rule.msg, ok ? 'seal' : 'soft');
        finish();
      }
    }, ok ? 620 : 500);
    return;
  }

  /* 3. cosas terminadas no vuelven a la mesa (salvo regla) */
  if (isDone(x) || isDone(y)) {
    reject(ITEMS[x].type === 'junk' || ITEMS[y].type === 'junk' ? MICROCOPY.junkOnMesa : MICROCOPY.dishOnMesa);
    return;
  }
  if (isTool(x) && isTool(y)) { reject(MICROCOPY.toolsClank); return; }

  /* 4. fallo genérico */
  consume();
  addItem('mezcla_rara', 1);
  surface.classList.add('shake');
  toast(pick(MICROCOPY.junk), 'soft');
  buzz(80);
  setTimeout(() => { surface.classList.remove('shake'); finish(); }, 500);
}

function floaty(text) {
  const f = el('span', 'floaty hand', text);
  $('#cocina-surface').appendChild(f);
  setTimeout(() => f.remove(), 1100);
}

/* ---------- Descubrimiento ---------- */

function discover(id, source, kind) {
  state.discovered.push(id);
  const item = ITEMS[id];

  let reward = kind === 'creative' ? REWARDS.creative
    : item.type === 'dish'
      ? (item.meta ? REWARDS.dishMeta : item.variant ? REWARDS.dishVariant : REWARDS.dish)
      : REWARDS.step;

  let newTech = null;
  if (source.tech && !state.techniques.includes(source.tech)) {
    state.techniques.push(source.tech);
    newTech = source.tech;
    reward += REWARDS.technique;
  }
  addCoins(reward);

  if (item.type === 'dish') {
    if (!state.dishesDone.includes(id)) state.dishesDone.push(id);
    save();
    showCelebration(id, source, reward, kind);
  } else {
    save();
    showPaso(id, source, reward, newTech);
  }
}

function showPaso(id, source, reward, newTech) {
  $('#paso-icon').innerHTML = iconOf(id);
  $('#paso-name').textContent = ITEMS[id].name;
  $('#paso-line').textContent = source.line || source.msg || '';
  $('#paso-tech').innerHTML = newTech
    ? `Saber registrado: <span class="tech-chip">${iconOf(newTech)}</span> <em>${ITEMS[newTech].name}</em>` : '';
  $('#paso-reward').textContent = `+S/ ${S(reward)}`;
  $('#modal-paso').classList.add('open');
}

function closePaso() {
  $('#modal-paso').classList.remove('open');
  if (currentScreen === 'cocina') renderCocina();
  if (currentScreen === 'receta') renderReceta();
}

let celebratedCuaderno = null;
function showCelebration(id, source, reward, kind) {
  celebratedCuaderno = source.cuaderno || null;
  const item = ITEMS[id];
  const c = source.cuaderno ? CUADERNOS[source.cuaderno] : null;
  $('#celebra-icon').innerHTML = iconOf(id);
  $('#celebra-stamp').innerHTML = kind === 'creative' ? 'invento<br>de la casa' : 'plato<br>recuperado';
  $('#celebra-name').textContent = item.name;
  $('#celebra-city').textContent = c ? `${c.city} · ${c.region}` : 'creación propia';
  $('#celebra-line').textContent = source.line || source.msg || '';
  $('#celebra-reward').textContent = `+S/ ${S(reward)}`;
  $('#celebra-sell').textContent = item.sell
    ? `Se vende a S/ ${S(item.sell)}. La clientela ya puede pedirlo.` : '';
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
  if (celebratedCuaderno) openReceta(celebratedCuaderno);
  else show('cocina');
}

/* ============================================================
   MERCADO
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
      <button type="button" class="price buy-btn">S/ ${S(c.cost)}</button>`;
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
      <span class="price tag">S/ ${S(item.price)}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < item.price) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-item.price);
      addItem(id, 1);
      tickAction();
      save();
      buzz(25);
      renderMercado();
    });
    ing.appendChild(card);
  });

  /* utensilios y servicios */
  const tools = $('#market-tools');
  tools.innerHTML = '';
  marketTools().forEach(id => {
    const item = ITEMS[id];
    const card = el('button', 'market-item');
    card.type = 'button';
    card.innerHTML = `
      <span class="icon">${iconOf(id)}</span>
      <span class="name">${item.name}</span>
      <span class="price tag">S/ ${S(item.price)}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < item.price) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-item.price);
      addItem(id, 1);
      tickAction();
      save();
      toast('Pesa, pero vale cada sucre.', 'seal');
      renderMercado();
    });
    tools.appendChild(card);
  });
  /* afilador */
  state.tools.filter(id => ITEMS[id].wear).forEach(id => {
    const left = state.toolWear[id] ?? ITEMS[id].wear;
    if (left >= ITEMS[id].wear) return;
    const cost = ITEMS[id].sharpenCost;
    const card = el('button', 'market-item service');
    card.type = 'button';
    card.innerHTML = `
      <span class="icon">${iconOf(id)}</span>
      <span class="name">Afilar ${ITEMS[id].name.toLowerCase()}${left <= 0 ? ' <small class="have">(sin filo)</small>' : ''}</span>
      <span class="price tag">S/ ${S(cost)}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < cost) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-cost);
      state.toolWear[id] = ITEMS[id].wear;
      save();
      toast('El afilador le devuelve el canto al cuchillo.', 'seal');
      renderMercado();
    });
    tools.appendChild(card);
  });
  $('#market-tools-section').style.display = tools.children.length ? '' : 'none';

  /* venta y basura */
  const sell = $('#market-sell');
  sell.innerHTML = '';
  const sellables = Object.keys(state.inv).filter(id => (ITEMS[id].sell || ITEMS[id].type === 'junk') && count(id) > 0);
  if (!sellables.length) {
    sell.appendChild(el('p', 'sell-empty hand', 'Cocina algo rico y la caserita te lo compra.'));
  } else {
    sellables.forEach(id => {
      const item = ITEMS[id];
      const worthless = !item.sell;
      const card = el('button', 'market-item sellable');
      card.type = 'button';
      card.innerHTML = `
        <span class="icon">${iconOf(id)}</span>
        <span class="name">${item.name} <small class="have">×${count(id)}</small></span>
        <span class="price tag ${worthless ? 'toss-tag' : 'sell-tag'}">${worthless ? 'ni los chanchitos: botar' : `vender +S/ ${S(item.sell)}`}</span>`;
      card.addEventListener('click', () => {
        addItem(id, -1);
        if (!worthless) { addCoins(item.sell); toast(MICROCOPY.sold, 'seal'); }
        else toast(MICROCOPY.tossed, 'soft');
        tickAction();
        save();
        buzz(25);
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
  state.active = cid;
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
    if (fresh || confirm('¿Empezar una hueca nueva? La actual se perderá.')) {
      state = newState();
      save();
      renderHud();
      show('shelf');
    }
  });

  $$('#tabbar .tab-btn').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.screen)));
  $('#receta-back').addEventListener('click', () => show('shelf'));
  $('#btn-cover').addEventListener('click', () => show('cover'));
  $('#quick-lona').addEventListener('click', () => show('mercado'));
  $('#quick-cocina').addEventListener('click', () => show('cocina'));

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

  $('#ticket-serve').addEventListener('click', () => { if (customer) resolveCustomer(true); });
  $('#ticket-miss').addEventListener('click', () => { if (customer) resolveCustomer(false); });
  $('#arriendo-pay').addEventListener('click', resolveRent);
  $('#cierre-reopen').addEventListener('click', reopenHueca);

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
  $('#btn-continue').textContent = saved ? 'Continuar' : 'Abrir la hueca';
  $$('[data-icon]').forEach(n => { n.innerHTML = iconOf(n.dataset.icon); });
  bindEvents();
  renderHud();
  show('cover');
}

document.addEventListener('DOMContentLoaded', init);
