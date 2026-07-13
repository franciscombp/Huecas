/* ============================================================
   Huecas — saberes y sabores (v7)
   app.js — La hueca abierta: cola continua, servir, sobrevivir.
   ============================================================ */

const SAVE_KEY = 'huecas_save_v7';

/* ---------- Recetario aplanado + reglas ---------- */

const ALL_STEPS = [];
CUADERNO_ORDER.forEach(cid => {
  CUADERNOS[cid].steps.forEach(step => ALL_STEPS.push({ ...step, cuaderno: cid }));
});

const pairMatch = (r, x, y) => (r.a === x && r.b === y) || (r.a === y && r.b === x);
const findStep = (x, y) => ALL_STEPS.find(s => pairMatch(s, x, y));
const findRule = (x, y) => RULES.find(r => pairMatch(r, x, y));

const isTool = (id) => ITEMS[id].type === 'tool';
const isDish = (id) => ITEMS[id].type === 'dish';
const isDone = (id) => ['dish', 'junk'].includes(ITEMS[id].type);
const isHeat = (id) => id === 'olla' || id === 'sarten';

const S = (n) => String(n * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ---------- Estado ---------- */

let state = null;

function newState() {
  const s = {
    coins: INITIAL_COINS,
    owned: ['bolon'],
    inv: {},
    tools: [],
    toolWear: {},
    discovered: [],
    techniques: [],
    revealed: [],
    dishesDone: [],
    active: 'bolon',
    region: 'costa',
    regionsUnlocked: ['costa'],
    rating: HUECA.startRating,
    served: 0, missed: 0,
    consecutiveMisses: 0,
    sinceRent: 0, rentCycle: 0,
    fiado: false,
    timesClosed: 0,
    mode: 'servicio',
    milestonesHit: [],
    seenIntro: false,
    junkBorn: {},        /* id -> timestamp, para pudrir mezclas inútiles */
  };
  grantBasket(s, CUADERNOS.bolon.grants);
  return s;
}

function grantBasket(s, ids) {
  ids.forEach(id => {
    if (isTool(id)) {
      if (!s.tools.includes(id)) { s.tools.push(id); if (ITEMS[id].wear) s.toolWear[id] = ITEMS[id].wear; }
    } else s.inv[id] = (s.inv[id] || 0) + 1;
  });
}

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
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
const realDishes = () => state.dishesDone.filter(d => !ITEMS[d].creative);
const readyDishes = () => Object.keys(state.inv).filter(id => isDish(id) && count(id) > 0);

function addItem(id, n = 1) {
  if (isTool(id)) {
    if (!state.tools.includes(id)) { state.tools.push(id); if (ITEMS[id].wear) state.toolWear[id] = ITEMS[id].wear; }
    return;
  }
  const before = state.inv[id] || 0;
  state.inv[id] = before + n;
  if (state.inv[id] <= 0) { delete state.inv[id]; if (state.junkBorn) delete state.junkBorn[id]; }
  else if (ITEMS[id].rots && before <= 0) { state.junkBorn = state.junkBorn || {}; state.junkBorn[id] = Date.now(); }
}
function wearTool(id) { if (ITEMS[id].wear) state.toolWear[id] = (state.toolWear[id] ?? ITEMS[id].wear) - 1; }

const mainSteps = (cid) => CUADERNOS[cid].steps.filter(s => !s.variant);
const isComplete = (cid) => mainSteps(cid).every(s => knows(s.result));
const stepsDone = (cid) => mainSteps(cid).filter(s => knows(s.result)).length;
const regionCuadernos = (r) => CUADERNO_ORDER.filter(cid => CUADERNOS[cid].region === r);

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
function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
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
  $('#hud').classList.toggle('hidden', !inGame);
  $('#tabbar').classList.toggle('hidden', !inGame);
  const tabOf = { shelf: 'shelf', receta: 'shelf', cocina: 'cocina', mercado: 'mercado' };
  $$('#tabbar .tab-btn').forEach(b => b.classList.toggle('current', b.dataset.screen === tabOf[screen]));
  if (screen === 'shelf') renderShelf();
  if (screen === 'receta') renderReceta();
  if (screen === 'cocina') renderCocina();
  if (screen === 'mercado') renderMercado();
  window.scrollTo(0, 0);
}
function openReceta(cid) { recetaOpen = cid; show('receta'); }
function goCook(cid) { state.active = cid; save(); show('cocina'); }

/* ---------- HUD ---------- */

function heartsHtml(rating) {
  let out = '';
  for (let i = 0; i < 5; i++) {
    const v = rating - i * 2;
    out += `<span class="heart ${v >= 2 ? 'full' : v === 1 ? 'half' : 'empty'}">${iconOf('corazon')}</span>`;
  }
  return out;
}
function renderHud() {
  $('#hud-coins').textContent = 'S/ ' + S(state.coins);
  $('#hud-hearts').innerHTML = heartsHtml(state.rating);
  const modeBtn = $('#hud-mode');
  modeBtn.dataset.mode = state.mode;
  modeBtn.innerHTML = state.mode === 'servicio' ? '<span class="mode-dot on"></span>Servicio' : '<span class="mode-dot"></span>Tranquilo';
}
function addCoins(n) {
  state.coins += n;
  renderHud();
  if (n > 0) { const c = $('#hud-coins-pill'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); }
}

/* --- microinteracciones --- */
function bumpHearts(dir) {
  const h = $('#hud-hearts'); if (!h) return;
  h.classList.remove('bump', 'lose'); void h.offsetWidth;
  h.classList.add(dir < 0 ? 'lose' : 'bump');
  setTimeout(() => h.classList.remove('bump', 'lose'), 650);
}
/* corazón que sube desde la ficha del cliente servido */
function popServe(id) {
  const card = document.querySelector(`.client[data-id="${id}"]`);
  if (!card) return;
  const r = card.getBoundingClientRect();
  const b = el('span', 'serve-burst', iconOf('corazon'));
  b.style.left = (r.left + r.width / 2) + 'px';
  b.style.top = (r.top + r.height / 2) + 'px';
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 950);
}

function checkRescue() {
  const ing = marketIngredients();
  const cheapest = ing.length ? Math.min(...ing.map(id => ITEMS[id].price)) : 1;
  if (state.coins >= cheapest) return;
  if (Object.keys(state.inv).some(id => ITEMS[id].sell)) return;
  const pool = [...Object.keys(state.inv).filter(id => count(id) > 0), ...state.tools.filter(t => !isDull(t))];
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) { const s = findStep(pool[i], pool[j]); if (s && owns(s.cuaderno)) return; }
  addCoins(RESCUE_COINS); save(); toast(MICROCOPY.rescue, 'seal');
}

let toastTimer = null;
function toast(msg, tone = 'ink') {
  const t = $('#toast');
  t.textContent = msg; t.dataset.tone = tone; t.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('visible'), 2600);
}

/* ============================================================
   RELOJ DE LA HUECA — cola continua de clientes
   ============================================================ */

let queue = [];        /* [{ id, name, icon, dish, deadline, total }] */
let custId = 0;
let lastSpawn = 0;
let gameClock = null;

function modalOpen() { return !!$('.modal.open'); }

function pressureTier() {
  const n = realDishes().length;
  let tier = HUECA.pressure[0];
  for (const p of HUECA.pressure) if (n >= p.dishes) tier = p;
  return tier;
}

function startClock() {
  if (gameClock) return;
  lastSpawn = Date.now();
  gameClock = setInterval(clockTick, 250);
}
function stopClock() { clearInterval(gameClock); gameClock = null; }

function clockTick() {
  if (currentScreen === 'cover' || state.mode !== 'servicio' || modalOpen()) { lastSpawn = Date.now(); return; }
  const now = Date.now();
  /* pudrir mezclas inútiles que se quedaron en el mesón (aun sin platos) */
  if (state.junkBorn) {
    for (const id in state.junkBorn) {
      if ((state.inv[id] || 0) > 0 && now - state.junkBorn[id] > ROT_MS) {
        const q = state.inv[id];
        addItem(id, -q); addItem('podrido', q);
        toast(MICROCOPY.rotted, 'soft');
        if (currentScreen === 'cocina') renderDock();
        save();
      }
    }
  }
  if (!realDishes().length) return;
  /* expirar */
  let expired = false;
  for (const c of [...queue]) if (now >= c.deadline) { missCustomer(c.id, true); expired = true; }
  /* aparecer */
  const tier = pressureTier();
  if (queue.length < HUECA.queueMax && now - lastSpawn >= tier.spawnMs) spawnCustomer();
  if (!expired && currentScreen === 'cocina') updateQueueBars();
}

function pickDemandDish() {
  const dishes = realDishes();
  const weights = dishes.map(d => 1 + (ITEMS[d].sell || 0) * (state.rating / HUECA.maxRating) * 0.18);
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < dishes.length; i++) { r -= weights[i]; if (r <= 0) return dishes[i]; }
  return dishes[dishes.length - 1];
}

function spawnCustomer() {
  const dish = pickDemandDish();
  if (!dish) return;
  const who = pick(CLIENTES);
  const tier = pressureTier();
  queue.push({ id: ++custId, ...who, dish, deadline: Date.now() + tier.patience * 1000, total: tier.patience });
  lastSpawn = Date.now();
  buzz(30);
  if (currentScreen === 'cocina') renderQueue();
}

function updateQueueBars() {
  queue.forEach(c => {
    const bar = document.querySelector(`.client[data-id="${c.id}"] .cl-bar`);
    const card = document.querySelector(`.client[data-id="${c.id}"]`);
    if (!bar || !card) return;
    const frac = Math.max(0, (c.deadline - Date.now()) / (c.total * 1000));
    bar.style.transform = `scaleX(${frac})`;
    card.classList.toggle('urgent', frac < 0.35);
  });
}

function serveCustomer(id) {
  const idx = queue.findIndex(c => c.id === id);
  if (idx < 0) return;
  const c = queue[idx];
  if (count(c.dish) < 1) { toast('Todavía no tienes ese plato listo.', 'soft'); return; }
  addItem(c.dish, -1);
  const tip = rand(0, HUECA.tipMax);
  addCoins(customerPay(c.dish) + tip);
  state.rating = Math.min(HUECA.maxRating, state.rating + 1);
  state.served += 1;
  state.consecutiveMisses = 0;
  popServe(id);
  queue.splice(idx, 1);
  buzz([30, 40, 60]);
  bumpHearts(1);
  const gracias = c.thanks || MICROCOPY.servedQueue;
  toast(`${gracias}${tip ? ` Propina S/ ${S(tip)}.` : ''}`, 'seal');
  afterResolve();
}

function missCustomer(id, expired) {
  const idx = queue.findIndex(c => c.id === id);
  if (idx < 0) return;
  const c = queue[idx];
  queue.splice(idx, 1);
  state.rating = Math.max(0, state.rating - 1);
  state.missed += 1;
  state.consecutiveMisses += 1;
  buzz(90);
  bumpHearts(-1);
  if (expired) toast(c.left || MICROCOPY.missed, 'soft');
  afterResolve(true);
}

function afterResolve(missed) {
  state.sinceRent += 1;
  renderHud();
  save();
  /* sincroniza toda la cocina (mesa incluida) salvo si hay una cocción en curso:
     así el plato servido no queda fantasma en la mesa ni deja botones muertos */
  if (currentScreen === 'cocina') { if (combining) { renderQueue(); renderDock(); } else renderCocina(); }
  if (currentScreen === 'mercado') renderMercado();
  maybeUnlockRegion();
  if (missed && state.consecutiveMisses >= SALUBRIDAD.missLimit) { setTimeout(salubridadVisit, 700); return; }
  if (!missed && checkMilestone()) return;
  if (state.sinceRent >= HUECA.rentEvery) setTimeout(showRent, 800);
}

function customerPay(dish) { return ITEMS[dish].sell + Math.floor(state.rating / 4); }

/* ---------- Regiones ---------- */

function maybeUnlockRegion() {
  for (const r of REGION_ORDER) {
    const meta = REGIONS[r];
    if (!meta.unlock || state.regionsUnlocked.includes(r)) continue;
    if (realDishes().length >= meta.unlock.dishes) {
      state.regionsUnlocked.push(r);
      save();
      toast(MICROCOPY.regionUnlock, 'seal');
    }
  }
}

/* ---------- Salubridad ---------- */

function salubridadVisit() {
  state.consecutiveMisses = 0;
  const pass = readyDishes().length > 0;
  $('#salubridad-icon').innerHTML = iconOf(pass ? 'salubridad' : 'arriendo');
  $('#salubridad-title').textContent = 'Autoridad de salubridad';
  $('#salubridad-text').textContent = pass
    ? 'Tres clientes se fueron con hambre y llegó la inspección. Por suerte tenías un plato listo para mostrar.'
    : 'Tres clientes se fueron con hambre y llegó la inspección. No había ni un plato listo que mostrar.';
  const btn = $('#salubridad-ok');
  btn.textContent = pass ? 'Seguir abierta' : 'Cerrar la hueca';
  btn.dataset.pass = pass ? '1' : '0';
  $('#modal-salubridad').classList.add('open');
  save();
}
function resolveSalubridad() {
  const pass = $('#salubridad-ok').dataset.pass === '1';
  $('#modal-salubridad').classList.remove('open');
  if (pass) toast(MICROCOPY.salubridadPass, 'seal');
  else { toast(MICROCOPY.salubridadClose, 'soft'); closeHueca(); }
}

/* ---------- Milestones ---------- */

function checkMilestone() {
  const m = MILESTONES.find(m => state.served >= m.served && !state.milestonesHit.includes(m.served));
  if (!m) return false;
  state.milestonesHit.push(m.served);
  addCoins(m.reward); save();
  $('#milestone-icon').innerHTML = iconOf('corazon');
  $('#milestone-title').textContent = m.title;
  $('#milestone-served').textContent = `${m.served} clientes servidos`;
  $('#milestone-note').textContent = m.note;
  $('#milestone-reward').textContent = `+S/ ${S(m.reward)}`;
  $('#modal-milestone').classList.add('open');
  return true;
}

/* ---------- Arriendo escalado ---------- */

function currentRent() { return HUECA.rentBase + HUECA.rentStep * state.rentCycle; }

function showRent() {
  if (modalOpen()) { setTimeout(showRent, 800); return; }
  state.sinceRent = 0;
  const rent = currentRent();
  const canPay = state.coins >= rent;
  const canFiar = !canPay && !state.fiado && state.rating >= 7;
  $('#arriendo-text').textContent = `Don Aurelio pasa por el arriendo: S/ ${S(rent)}.`;
  const payBtn = $('#arriendo-pay');
  payBtn.textContent = canPay ? `Pagar S/ ${S(rent)}` : canFiar ? 'Pedir que te fíe' : 'No me alcanza…';
  payBtn.dataset.mode = canPay ? 'pay' : canFiar ? 'fiar' : 'close';
  $('#arriendo-note').textContent = canPay
    ? (state.rentCycle >= 1 ? 'Y cada mes sube. Ofrece platos más caros.' : 'La hueca sigue abierta un mes más.')
    : canFiar ? 'Con tu fama, don Aurelio puede esperar. Solo esta vez.'
      : 'Sin sucres y sin fama, don Aurelio no perdona.';
  $('#modal-arriendo').classList.add('open');
  save();
}
function resolveRent() {
  const mode = $('#arriendo-pay').dataset.mode;
  $('#modal-arriendo').classList.remove('open');
  if (mode === 'pay') { addCoins(-currentRent()); state.rentCycle += 1; toast('Arriendo pagado. Un mes más de hueca.', 'seal'); save(); }
  else if (mode === 'fiar') { state.fiado = true; toast('Don Aurelio anota en su libreta y se va sin sonreír.', 'soft'); save(); }
  else closeHueca();
}

/* ---------- Cierre / reapertura ---------- */

function closeHueca() {
  /* la clientela sigue en la fila; no se borra al cerrar */
  state.timesClosed += 1;
  $('#cierre-veces').textContent = state.timesClosed > 1 ? `Ya van ${state.timesClosed} veces. El barrio te sigue queriendo.` : '';
  $('#modal-cierre').classList.add('open');
  save();
}
function reopenHueca() {
  state.inv = {};
  state.coins = INITIAL_COINS;
  state.rating = HUECA.startRating;
  state.sinceRent = 0; state.rentCycle = 0;
  state.consecutiveMisses = 0; state.fiado = false;
  state.tools.forEach(t => { if (ITEMS[t].wear) state.toolWear[t] = ITEMS[t].wear; });
  /* la fila esperó la reapertura: les renovamos la paciencia */
  const tier = pressureTier();
  queue.forEach(c => { c.deadline = Date.now() + tier.patience * 1000; c.total = tier.patience; });
  lastSpawn = Date.now();
  save(); renderHud();
  $('#modal-cierre').classList.remove('open');
  toast('La hueca vuelve a abrir. Las recetas nunca se fueron.', 'seal');
  show('cocina');
}

/* ---------- Modo ---------- */

function toggleMode() {
  state.mode = state.mode === 'servicio' ? 'tranquilo' : 'servicio';
  if (state.mode === 'tranquilo') { queue = []; toast(MICROCOPY.calmOn, 'seal'); }
  else { lastSpawn = Date.now(); toast(MICROCOPY.calmOff, 'ink'); }
  renderHud(); save();
  if (currentScreen === 'cocina') renderCocina();
}

/* ============================================================
   ESTANTERÍA / RECETARIO
   ============================================================ */

function renderShelf() {
  const rack = $('#shelf-books');
  rack.innerHTML = '';
  REGION_ORDER.filter(r => state.regionsUnlocked.includes(r)).forEach(r => {
    const meta = REGIONS[r];
    rack.appendChild(el('h3', 'shelf-region hand', `${meta.name} <small>· ${meta.tagline}</small>`));
    const grid = el('div', 'shelf-grid');
    regionCuadernos(r).forEach(cid => grid.appendChild(bookCard(cid)));
    rack.appendChild(grid);
  });
  const locked = REGION_ORDER.filter(r => !state.regionsUnlocked.includes(r));
  if (locked.length) {
    const m = REGIONS[locked[0]];
    rack.appendChild(el('p', 'shelf-locked hand', `🔒 ${m.name}: domina ${m.unlock.dishes} platos costeños para abrirla.`));
  }
  const done = CUADERNO_ORDER.filter(cid => owns(cid) && isComplete(cid)).length;
  $('#shelf-recipes').textContent = `${done}/${CUADERNO_ORDER.length}`;
  $('#shelf-served').textContent = state.served;
  const next = MILESTONES.find(m => !state.milestonesHit.includes(m.served));
  $('#shelf-goal').textContent = next ? `Próxima meta: ${next.title} (${state.served}/${next.served})` : '¡Patrimonio del sabor!';
}

function bookCard(cid) {
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
    <span class="book-progress">${done ? '<span class="stamp-mini">completo ★</span>' : '<span class="dots">' + '●'.repeat(stepsDone(cid)) + '○'.repeat(total - stepsDone(cid)) + '</span>'}</span>
  ` : `
    <span class="book-icon dim">${iconOf('cuaderno')}</span>
    <span class="book-title">¿${c.title}?</span>
    <span class="book-city">${c.city}</span>
    <span class="book-progress"><span class="price-tag">S/ ${S(c.cost)}</span></span>`;
  book.addEventListener('click', () => { if (owned) openReceta(cid); else { show('mercado'); toast('Ese cuaderno se consigue en la lona.', 'soft'); } });
  return book;
}

function pairIcons(step) {
  return `
    <span class="mini-item">${iconOf(step.a)}<small>${ITEMS[step.a].name}</small></span>
    <span class="op">+</span>
    <span class="mini-item">${iconOf(step.b)}<small>${ITEMS[step.b].name}</small></span>
    <span class="op">→</span>
    <span class="mini-item res">${iconOf(step.result)}<small>${ITEMS[step.result].name}</small></span>`;
}

function renderReceta() {
  const cid = recetaOpen || state.active;
  recetaOpen = cid;
  const c = CUADERNOS[cid];
  const complete = isComplete(cid);
  $('#receta-title').textContent = c.title;
  $('#receta-city').textContent = `${c.city} · ${REGIONS[c.region].short}`;
  $('#receta-dish-icon').innerHTML = iconOf(complete ? c.dish : 'cuaderno');
  $('#receta-intro').textContent = c.intro;
  $('#receta-stamp').style.display = complete ? '' : 'none';
  const list = $('#receta-steps');
  list.innerHTML = '';
  let firstPending = true;
  c.steps.forEach((step, i) => {
    const done = knows(step.result);
    const revealed = state.revealed.includes(step.result);
    const isCurrent = !done && firstPending && !step.variant;
    const row = el('div', 'step' + (done ? ' done' : '') + (isCurrent ? ' current' : '') + (step.variant ? ' variant' : ''));
    if (!done && !step.variant && firstPending) firstPending = false;
    if (done) {
      row.innerHTML = `<span class="step-num">${step.variant ? '✳' : i + 1}</span>
        <div class="step-body"><p class="step-line hand">${step.line}</p><div class="step-icons">${pairIcons(step)}</div></div>
        <span class="step-check">✓</span>`;
    } else {
      row.innerHTML = `<span class="step-num">${step.variant ? '✳' : i + 1}</span>
        <div class="step-body">
          <p class="step-hint hand">“${step.hint}”</p>
          ${step.shopNote ? `<p class="step-shopnote">${step.shopNote}</p>` : ''}
          ${revealed ? `<div class="step-icons">${pairIcons(step)}</div>` : ''}
          <div class="step-actions">
            <button type="button" class="btn-main small try-btn">Intentar en la cocina</button>
            ${!revealed ? `<button type="button" class="btn-ghost small reveal">Espiar <small>S/ ${S(REVEAL_COST)}</small></button>` : ''}
          </div>
        </div>`;
      row.querySelector('.try-btn').addEventListener('click', () => goCook(cid));
      const rev = row.querySelector('.reveal');
      if (rev) rev.addEventListener('click', () => {
        if (state.coins < REVEAL_COST) { toast(MICROCOPY.noCoins, 'soft'); return; }
        addCoins(-REVEAL_COST); state.revealed.push(step.result); save(); renderReceta();
      });
    }
    list.appendChild(row);
  });
  $('#receta-progress').textContent = complete ? 'Receta recuperada. La clientela la pide.' : `${stepsDone(cid)} de ${mainSteps(cid).length} pasos`;
  $('#receta-cook-btn').onclick = () => goCook(cid);
}

/* ============================================================
   COCINA
   ============================================================ */

const slots = [null, null];
let combining = false;
let dockTab = 'ingredientes';

function renderCocina() {
  renderQueue();
  renderChips();
  renderSlots();
  renderMesaAction();
  renderRiddle();
  renderDock();
}

/* --- cola de clientes (estilo PvZ) --- */
function renderQueue() {
  const hueca = REGIONS[state.region];
  $('#kitchen-name').textContent = hueca.name;
  const strip = $('#kitchen-sub');
  if (!realDishes().length) { strip.textContent = 'Descubre tu primer plato para abrir'; strip.className = 'kitchen-sub calm'; }
  else if (state.mode === 'tranquilo') { strip.textContent = 'Modo tranquilo · sin clientes'; strip.className = 'kitchen-sub calm'; }
  else if (state.consecutiveMisses >= 1) { strip.textContent = `⚠ ${state.consecutiveMisses}/${SALUBRIDAD.missLimit} sin servir · ten un plato listo`; strip.className = 'kitchen-sub warn'; }
  else { strip.textContent = 'Servicio abierto'; strip.className = 'kitchen-sub on'; }

  const row = $('#queue');
  row.innerHTML = '';
  if (state.mode === 'tranquilo') { row.appendChild(el('span', 'queue-empty hand', 'Explora recetas con calma 🌙')); return; }
  /* asientos fijos: la fila no se colapsa aunque esté vacía */
  for (let i = 0; i < HUECA.queueMax; i++) {
    const c = queue[i];
    if (!c) {
      const seat = el('div', 'client seat');
      seat.innerHTML = `<span class="seat-mark">${i === 0 && !realDishes().length ? '' : '·'}</span>`;
      row.appendChild(seat);
      continue;
    }
    const have = count(c.dish) >= 1;
    const frac = Math.max(0, (c.deadline - Date.now()) / (c.total * 1000));
    const card = el('div', 'client' + (have ? ' ready' : ''));
    card.dataset.id = c.id;
    if (c.line) card.title = `${c.name}: “${c.line}”`;
    card.innerHTML = `
      <span class="cl-avatar">${iconOf(c.icon)}</span>
      <span class="cl-bubble" title="Pide ${ITEMS[c.dish].name}">${iconOf(c.dish)}</span>
      <span class="cl-name">${c.name}</span>
      <div class="cl-bar-wrap"><span class="cl-bar" style="transform:scaleX(${frac})"></span></div>
      <button type="button" class="cl-serve" ${have ? '' : 'disabled'}>${have ? 'Servir' : ITEMS[c.dish].name}</button>`;
    card.querySelector('.cl-serve').addEventListener('click', () => serveCustomer(c.id));
    row.appendChild(card);
  }
  if (!queue.length && !realDishes().length) {
    row.innerHTML = '';
    row.appendChild(el('span', 'queue-empty hand', 'Descubre tu primer plato y llegará la clientela'));
  }
}

/* --- selector de cuaderno activo --- */
function renderChips() {
  const chips = $('#cocina-chips');
  chips.innerHTML = '';
  state.owned.forEach(cid => {
    const c = CUADERNOS[cid];
    const b = el('button', 'chip-book' + (cid === state.active ? ' current' : ''));
    b.type = 'button';
    b.innerHTML = `<span class="chip-icon">${iconOf(isComplete(cid) ? c.dish : 'cuaderno')}</span><span>${ITEMS[c.dish].name}</span>`;
    b.addEventListener('click', () => { state.active = cid; save(); renderCocina(); });
    chips.appendChild(b);
  });
}

function itemCard(id) {
  const item = ITEMS[id];
  const card = el('button', 'item-card type-' + item.type);
  card.type = 'button'; card.dataset.id = id;
  card.innerHTML = `<span class="icon">${iconOf(id)}</span><span class="name">${item.name}</span>`;
  card.setAttribute('aria-label', `${item.name}, ${TYPES[item.type].label}`);
  return card;
}

function renderSlots() {
  [0, 1].forEach(i => { if (slots[i] && !isTool(slots[i]) && count(slots[i]) <= 0) slots[i] = null; });
  [0, 1].forEach(i => {
    const zone = $('#slot-' + i);
    zone.innerHTML = '';
    zone.classList.toggle('filled', !!slots[i]);
    if (slots[i]) { const card = itemCard(slots[i]); card.tabIndex = -1; zone.appendChild(card); }
    else zone.appendChild(el('span', 'slot-hint hand', i === 0 ? 'algo…' : '…con algo'));
  });
  $('#mesa-clear').style.display = (slots[0] || slots[1]) ? '' : 'none';
}

function verbOf(sr) {
  if (sr.tech) return { label: ITEMS[sr.tech].name, icon: sr.tech };
  const tool = [sr.a, sr.b].find(id => isTool(id));
  const map = { olla: 'hervir', sarten: 'dorar', pilon: 'majar', molino: 'moler', cuchillo: 'pelar', tabla: 'mezclar' };
  if (tool && map[tool]) return { label: ITEMS[map[tool]].name, icon: map[tool] };
  if (isDish(sr.result)) return { label: 'Servir', icon: 'mezclar' };
  return { label: 'Mezclar', icon: 'mezclar' };
}

function mishapFor(x, y) {
  const key = [x, y].sort().join('|');
  if (MISHAPS[key]) return MISHAPS[key];
  return { result: 'mezcla_rara', title: MISHAP_GENERIC.title, text: MISHAP_GENERIC.text(ITEMS[x].name.toLowerCase(), ITEMS[y].name.toLowerCase()) };
}

/* Devuelve la acción posible. Siempre "pasa algo" salvo dos utensilios. */
function actionFor(x, y) {
  const step = findStep(x, y);
  if (step && owns(step.cuaderno)) return { kind: 'step', source: step, result: step.result, good: true };
  const rule = findRule(x, y);
  if (rule) {
    if (rule.kind === 'creative') return { kind: 'creative', source: rule, result: rule.result, good: true };
    return { kind: 'fail', result: rule.result, good: false, full: { title: 'Eso no salió', text: rule.msg } };
  }
  if ((isDone(x) && isHeat(y)) || (isDone(y) && isHeat(x)))
    return { kind: 'burn', result: 'quemado', good: false, full: { title: 'Se quemó', text: MICROCOPY.burned } };
  if (isTool(x) && isTool(y)) return null;               /* dos utensilios: nada */
  const m = mishapFor(x, y);                              /* combinación rara: igual se hace, inútil */
  return { kind: 'weird', result: m.result, good: false, full: { title: m.title, text: m.text } };
}

/* habilidades ya aprendidas donde el 2º insumo es un utensilio tuyo:
   permite disparar la acción con solo el ingrediente en la mesa */
function learnedToolSteps(item) {
  if (isTool(item) || isDone(item)) return [];
  const seen = new Set();
  const out = [];
  for (const s of ALL_STEPS) {
    if (!owns(s.cuaderno) || !knows(s.result) || seen.has(s.result)) continue;
    let tool = null;
    if (s.a === item && isTool(s.b)) tool = s.b;
    else if (s.b === item && isTool(s.a)) tool = s.a;
    else continue;
    if (state.tools.includes(tool) && !isDull(tool)) { out.push({ step: s, tool }); seen.add(s.result); }
  }
  return out;
}

function actionBtn(cls, label, icon, onClick) {
  const btn = el('button', 'cook-btn' + cls, `<span class="cook-ic">${iconOf(icon)}</span> ${label}`);
  btn.type = 'button';
  btn.addEventListener('click', onClick);
  return btn;
}

function renderMesaAction() {
  const zone = $('#mesa-action');
  zone.innerHTML = '';
  if (combining) return;
  const [x, y] = slots;

  /* un solo objeto en la mesa */
  if (x && !y) {
    /* plato terminado: servir a quien lo pida o guardarlo (que no estorbe) */
    if (isDish(x)) {
      const wanted = queue.find(c => c.dish === x);
      if (wanted) zone.appendChild(actionBtn(' known', 'Servir', 'corazon', () => serveCustomer(wanted.id)));
      zone.appendChild(actionBtn(' guardar', 'Guardar', 'usar', clearMesa));
      return;
    }
    /* habilidad aprendida: acción con solo el ingrediente (el utensilio se usa solo) */
    const autos = learnedToolSteps(x);
    autos.forEach(({ step, tool }) => {
      const v = verbOf(step);
      zone.appendChild(actionBtn(' known', v.label, v.icon, () => performCook(x, tool)));
    });
    return;
  }

  if (!x || !y) return;
  const act = actionFor(x, y);
  if (!act) { zone.innerHTML = `<span class="mesa-nope">${MICROCOPY.toolsClank}</span>`; return; }
  /* verbo revelado solo si ya descubriste ese paso; si no, "Usar" (sin spoiler) */
  const known = act.good && knows(act.result);
  const v = known ? verbOf(act.source) : { label: 'Usar', icon: 'usar' };
  zone.appendChild(actionBtn(known ? ' known' : '', v.label, v.icon, () => performCook(x, y)));
}

function renderRiddle() {
  const note = $('#cocina-riddle');
  const step = CUADERNOS[state.active].steps.find(s => !knows(s.result) && !s.variant);
  if (!step) { note.innerHTML = `<span class="hand">✓ ${ITEMS[CUADERNOS[state.active].dish].name} recuperado. Cocínalo de memoria.</span>`; return; }
  note.innerHTML = `<span class="riddle-label">el cuaderno murmura…</span> <span class="hand">“${step.hint}”</span>`;
}

/* --- despensa con pestañas --- */
function renderDock() {
  $$('#dock-tabs .dock-tab').forEach(b => b.classList.toggle('current', b.dataset.tab === dockTab));
  const row = $('#dock-row');
  row.innerHTML = '';
  const addCard = (id, opts = {}) => {
    const card = itemCard(id);
    const inSlots = slots.filter(s => s === id).length;
    if (!isTool(id)) card.append(el('span', 'badge', String(count(id))));
    if (!isTool(id) && count(id) - inSlots <= 0 && !opts.action) card.classList.add('spent');
    if (isTool(id) && ITEMS[id].wear) {
      const left = state.toolWear[id] ?? ITEMS[id].wear;
      card.append(el('span', 'wear' + (left <= 0 ? ' dull' : left <= 2 ? ' low' : ''), left <= 0 ? '✕' : '▮'.repeat(left)));
      if (left <= 0) card.classList.add('dull-tool');
    }
    card.draggable = true;
    card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    if (opts.onClick) card.addEventListener('click', opts.onClick);
    else card.addEventListener('click', () => placeInSlot(id));
    row.appendChild(card);
    return card;
  };

  if (dockTab === 'utensilios') {
    if (!state.tools.length) row.appendChild(el('span', 'inv-none hand', '—'));
    state.tools.forEach(id => addCard(id));
  } else if (dockTab === 'ingredientes') {
    const ing = Object.keys(state.inv).filter(id => ITEMS[id].type === 'ingredient').sort((a, b) => ITEMS[a].name.localeCompare(ITEMS[b].name));
    const preps = Object.keys(state.inv).filter(id => ITEMS[id].type === 'prep').sort((a, b) => ITEMS[a].name.localeCompare(ITEMS[b].name));
    if (!ing.length && !preps.length) row.appendChild(el('span', 'inv-none hand', 'Pasa por la lona'));
    ing.forEach(id => addCard(id));
    preps.forEach(id => addCard(id));
  } else { /* listos: platos y desastres, con vender/servir */
    const done = Object.keys(state.inv).filter(id => isDone(id) && count(id) > 0);
    if (!done.length) { row.appendChild(el('span', 'inv-none hand', 'Aún nada listo. ¡A cocinar!')); }
    done.forEach(id => {
      const wrap = el('div', 'ready-card');
      const top = el('div', 'ready-top');
      const card = itemCard(id);
      card.append(el('span', 'badge ready-n', String(count(id))));
      card.draggable = true;
      card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); });
      card.addEventListener('click', () => placeInSlot(id));   /* colocar en mesa (recalentar / combos) */
      top.appendChild(card);
      wrap.appendChild(top);
      const acts = el('div', 'ready-actions');
      const worth = ITEMS[id].sell;
      const wanted = queue.find(c => c.dish === id);
      if (wanted) {
        const sv = el('button', 'ready-btn serve', 'Servir');
        sv.addEventListener('click', () => serveCustomer(wanted.id));
        acts.appendChild(sv);
      }
      const sell = el('button', 'ready-btn ' + (worth ? 'sell' : 'toss'), worth ? `S/ ${S(worth)}` : 'Botar');
      sell.title = worth ? `Vender por S/ ${S(worth)}` : 'Botar';
      sell.addEventListener('click', () => {
        addItem(id, -1);
        if (worth) { addCoins(worth); toast(MICROCOPY.sellFromKitchen, 'seal'); } else toast(MICROCOPY.tossed, 'soft');
        buzz(25); save(); renderCocina();
      });
      acts.appendChild(sell);
      wrap.appendChild(acts);
      row.appendChild(wrap);
    });
  }
  /* contador en la pestaña Listos */
  const nReady = Object.keys(state.inv).filter(id => isDone(id) && count(id) > 0).reduce((t, id) => t + count(id), 0);
  const badge = $('#dock-listos-badge');
  badge.textContent = nReady || '';
  badge.style.display = nReady ? '' : 'none';
}

function placeInSlot(id, index = null) {
  if (combining) return;
  if (isTool(id) && isDull(id)) { toast(MICROCOPY.dullKnife, 'soft'); return; }
  if (isTool(id) && slots.includes(id) && index === null) { slots[slots.indexOf(id)] = null; renderCocina(); return; }
  const inSlots = slots.filter(s => s === id).length;
  if (!isTool(id) && count(id) - inSlots <= 0) { toast('No te queda más. La lona tiene.', 'soft'); return; }
  let i = index;
  if (i === null) i = slots[0] === null ? 0 : slots[1] === null ? 1 : 1;
  slots[i] = id;
  renderCocina();
}
function clearMesa() { if (combining) return; slots[0] = slots[1] = null; renderCocina(); }

/* x = base que queda en la mesa; y = 2º insumo (puede venir de un botón
   de habilidad aprendida, sin estar colocado en una casilla). */
function performCook(x, y) {
  if (combining || !x || !y) return;
  const act = actionFor(x, y);
  if (!act) return;
  combining = true;
  const surface = $('#cocina-surface');
  $('#mesa-action').innerHTML = '';
  const consume = () => [x, y].forEach(id => { if (isTool(id)) wearTool(id); else addItem(id, -1); });

  if (act.good) {
    consume(); addItem(act.result, 1);
    surface.classList.add('success'); buzz([30, 40, 60]);
    setTimeout(() => {
      surface.classList.remove('success');
      slots[0] = act.result; slots[1] = null; combining = false;
      if (!knows(act.result)) discover(act.result, act.source, act.kind === 'step' ? 'canon' : 'creative');
      else { floaty(`+1 ${ITEMS[act.result].name}`); renderCocina(); }
      checkRescue(); save();
    }, 540);
    return;
  }
  /* percance: igual se hace algo inútil, y se explica a pantalla completa */
  consume(); addItem(act.result, 1);
  surface.classList.add('shake'); buzz(90);
  setTimeout(() => {
    surface.classList.remove('shake');
    slots[0] = slots[1] = null; combining = false;
    renderCocina(); checkRescue(); save();
    showMishap(act.result, act.full.title, act.full.text);
  }, 480);
}

function showMishap(id, title, text) {
  $('#mishap-icon').innerHTML = iconOf(id);
  $('#mishap-title').textContent = title;
  $('#mishap-text').textContent = text;
  const worth = ITEMS[id].sell;
  $('#mishap-keep').textContent = worth ? `Guardar (vale S/ ${S(worth)})` : 'Guardar igual';
  $('#mishap-toss').dataset.id = id;
  $('#modal-mishap').classList.add('open');
}
function tossMishap() {
  const id = $('#mishap-toss').dataset.id;
  if (count(id) > 0) addItem(id, -1);
  $('#modal-mishap').classList.remove('open');
  toast(MICROCOPY.tossed, 'soft');
  if (currentScreen === 'cocina') renderCocina();
  save();
}
function keepMishap() {
  $('#modal-mishap').classList.remove('open');
  if (currentScreen === 'cocina') renderCocina();
}

function floaty(text) { const f = el('span', 'floaty hand', text); $('#cocina-surface').appendChild(f); setTimeout(() => f.remove(), 1100); }

function discover(id, source, kind) {
  const wasFirstDish = isDish(id) && !realDishes().length && !ITEMS[id].creative;
  state.discovered.push(id);
  const item = ITEMS[id];
  let reward = kind === 'creative' ? REWARDS.creative
    : item.type === 'dish' ? (item.meta ? REWARDS.dishMeta : item.variant ? REWARDS.dishVariant : REWARDS.dish) : REWARDS.step;
  let newTech = null;
  if (source.tech && !state.techniques.includes(source.tech)) { state.techniques.push(source.tech); newTech = source.tech; reward += REWARDS.technique; }
  addCoins(reward);
  if (item.type === 'dish') {
    if (!state.dishesDone.includes(id)) state.dishesDone.push(id);
    state.firstDishPending = wasFirstDish;
    save(); maybeUnlockRegion();
    showCelebration(id, source, reward, kind);
  } else { save(); showPaso(id, source, reward, newTech); }
}

function showPaso(id, source, reward, newTech) {
  $('#paso-icon').innerHTML = iconOf(id);
  $('#paso-name').textContent = ITEMS[id].name;
  $('#paso-line').textContent = source.line || source.msg || '';
  $('#paso-tech').innerHTML = newTech ? `Saber registrado: <span class="tech-chip">${iconOf(newTech)}</span> <em>${ITEMS[newTech].name}</em>` : '';
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
  $('#celebra-city').textContent = c ? `${c.city} · ${REGIONS[c.region].short}` : 'creación propia';
  $('#celebra-line').textContent = source.line || source.msg || '';
  $('#celebra-reward').textContent = `+S/ ${S(reward)}`;
  $('#celebra-sell').textContent = item.sell ? `Se vende a S/ ${S(item.sell)}. La clientela ya puede pedirlo.` : '';
  const confetti = $('#confetti'); confetti.innerHTML = '';
  for (let i = 0; i < 24; i++) { const p = el('i'); p.style.left = Math.random() * 100 + '%'; p.style.animationDelay = Math.random() * 0.5 + 's'; p.style.setProperty('--tone', ['#9dbd8a', '#d9a0b0', '#93a7c4', '#e0b45c'][i % 4]); confetti.appendChild(p); }
  $('#modal-celebra').classList.add('open');
}
function closeCelebration() {
  $('#modal-celebra').classList.remove('open');
  if (state.firstDishPending) { state.firstDishPending = false; save(); toast(MICROCOPY.firstDish, 'seal'); lastSpawn = Date.now(); }
  if (celebratedCuaderno) openReceta(celebratedCuaderno); else show('cocina');
}

/* ============================================================
   MERCADO
   ============================================================ */

function renderMercado() {
  const grid = $('#market-books');
  const pendientes = REGION_ORDER.filter(r => state.regionsUnlocked.includes(r)).flatMap(regionCuadernos).filter(cid => !owns(cid));
  $('#market-books-section').style.display = pendientes.length ? '' : 'none';
  grid.innerHTML = '';
  pendientes.forEach(cid => {
    const c = CUADERNOS[cid];
    const card = el('div', 'market-book');
    card.style.setProperty('--accent', c.accent);
    card.innerHTML = `
      <span class="mb-icon">${iconOf('cuaderno')}</span>
      <span class="mb-title">${c.title}</span>
      <span class="mb-city">${c.city} · ${REGIONS[c.region].short}</span>
      <span class="mb-blurb hand">“${c.blurb}”</span>
      <button type="button" class="price buy-btn">S/ ${S(c.cost)}</button>`;
    card.querySelector('.buy-btn').addEventListener('click', () => buyCuaderno(cid, card));
    grid.appendChild(card);
  });

  const ing = $('#market-ingredients');
  ing.innerHTML = '';
  marketIngredients().forEach(id => {
    const item = ITEMS[id];
    const card = el('button', 'market-item');
    card.type = 'button';
    card.innerHTML = `<span class="icon">${iconOf(id)}</span><span class="name">${item.name}${count(id) ? ` <small class="have">×${count(id)}</small>` : ''}</span><span class="price tag">S/ ${S(item.price)}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < item.price) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-item.price); addItem(id, 1); save(); buzz(25); renderMercado();
    });
    ing.appendChild(card);
  });

  const tools = $('#market-tools');
  tools.innerHTML = '';
  marketTools().forEach(id => {
    const item = ITEMS[id];
    const card = el('button', 'market-item'); card.type = 'button';
    card.innerHTML = `<span class="icon">${iconOf(id)}</span><span class="name">${item.name}</span><span class="price tag">S/ ${S(item.price)}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < item.price) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-item.price); addItem(id, 1); save(); toast('Pesa, pero vale cada sucre.', 'seal'); renderMercado();
    });
    tools.appendChild(card);
  });
  state.tools.filter(id => ITEMS[id].wear).forEach(id => {
    const left = state.toolWear[id] ?? ITEMS[id].wear;
    if (left >= ITEMS[id].wear) return;
    const cost = ITEMS[id].sharpenCost;
    const card = el('button', 'market-item service'); card.type = 'button';
    card.innerHTML = `<span class="icon">${iconOf(id)}</span><span class="name">Afilar ${ITEMS[id].name.toLowerCase()}${left <= 0 ? ' <small class="have">(sin filo)</small>' : ''}</span><span class="price tag">S/ ${S(cost)}</span>`;
    card.addEventListener('click', () => {
      if (state.coins < cost) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
      addCoins(-cost); state.toolWear[id] = ITEMS[id].wear; save(); toast('El afilador le devuelve el canto al cuchillo.', 'seal'); renderMercado();
    });
    tools.appendChild(card);
  });
  $('#market-tools-section').style.display = tools.children.length ? '' : 'none';

  const sell = $('#market-sell');
  sell.innerHTML = '';
  const sellables = Object.keys(state.inv).filter(id => (ITEMS[id].sell || ITEMS[id].type === 'junk') && count(id) > 0);
  if (!sellables.length) sell.appendChild(el('p', 'sell-empty hand', 'Cocina algo rico y la caserita te lo compra.'));
  else sellables.forEach(id => {
    const item = ITEMS[id];
    const worthless = !item.sell;
    const card = el('button', 'market-item sellable'); card.type = 'button';
    card.innerHTML = `<span class="icon">${iconOf(id)}</span><span class="name">${item.name} <small class="have">×${count(id)}</small></span><span class="price tag ${worthless ? 'toss-tag' : 'sell-tag'}">${worthless ? 'botar' : `+S/ ${S(item.sell)}`}</span>`;
    card.addEventListener('click', () => {
      addItem(id, -1);
      if (!worthless) { addCoins(item.sell); toast(MICROCOPY.sold, 'seal'); } else toast(MICROCOPY.tossed, 'soft');
      save(); buzz(25); renderMercado();
    });
    sell.appendChild(card);
  });
}

function buyCuaderno(cid, card) {
  const c = CUADERNOS[cid];
  if (state.coins < c.cost) { toast(MICROCOPY.noCoins, 'soft'); shakeCard(card); return; }
  addCoins(-c.cost);
  state.owned.push(cid);
  grantBasket(state, c.grants);
  state.active = cid;
  if (c.region !== state.region && state.regionsUnlocked.includes(c.region)) state.region = c.region;
  save();
  toast('La caserita te fía la primera canasta.', 'seal');
  openReceta(cid);
}
function shakeCard(card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 450); }

/* ---------- Onboarding ---------- */
function maybeIntro() { if (!state.seenIntro) $('#modal-intro').classList.add('open'); }
function closeIntro() { state.seenIntro = true; save(); $('#modal-intro').classList.remove('open'); }

/* ============================================================
   ARRANQUE
   ============================================================ */

function bindEvents() {
  $('#btn-continue').addEventListener('click', () => { show('cocina'); maybeIntro(); });
  $('#btn-new').addEventListener('click', () => {
    const fresh = !load();
    if (fresh || confirm('¿Empezar una hueca nueva? La actual se perderá.')) {
      state = newState(); queue = []; save(); renderHud(); show('cocina'); maybeIntro();
    }
  });
  $$('#tabbar .tab-btn').forEach(b => b.addEventListener('click', () => show(b.dataset.screen)));
  $('#receta-back').addEventListener('click', () => show('shelf'));
  $('#hud-mode').addEventListener('click', toggleMode);
  $('#quick-lona').addEventListener('click', () => show('mercado'));
  $('#quick-cocina').addEventListener('click', () => show('cocina'));
  $('#mesa-clear').addEventListener('click', clearMesa);
  $$('#dock-tabs .dock-tab').forEach(b => b.addEventListener('click', () => { dockTab = b.dataset.tab; renderDock(); }));

  [0, 1].forEach(i => {
    const zone = $('#slot-' + i);
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('over'); const id = e.dataTransfer.getData('text/plain'); if (id && ITEMS[id]) placeInSlot(id, i); });
    zone.addEventListener('click', () => { if (!combining && slots[i]) { slots[i] = null; renderCocina(); } });
  });

  $('#arriendo-pay').addEventListener('click', resolveRent);
  $('#cierre-reopen').addEventListener('click', reopenHueca);
  $('#salubridad-ok').addEventListener('click', resolveSalubridad);
  $('#mishap-toss').addEventListener('click', tossMishap);
  $('#mishap-keep').addEventListener('click', keepMishap);
  $('#milestone-close').addEventListener('click', () => { $('#modal-milestone').classList.remove('open'); if (state.sinceRent >= HUECA.rentEvery) setTimeout(showRent, 400); });
  $('#intro-close').addEventListener('click', closeIntro);
  $('#paso-close').addEventListener('click', closePaso);
  $('#modal-paso').addEventListener('click', (e) => { if (e.target === $('#modal-paso')) closePaso(); });
  $('#celebra-close').addEventListener('click', closeCelebration);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePaso(); if ($('#modal-celebra').classList.contains('open')) closeCelebration(); } });
}

function init() {
  const saved = load();
  state = saved || newState();
  $('#btn-continue').style.display = saved ? '' : 'none';
  $('#btn-new').textContent = saved ? 'Hueca nueva' : 'Abrir la hueca';
  $$('[data-icon]').forEach(n => { n.innerHTML = iconOf(n.dataset.icon); });
  bindEvents();
  renderHud();
  show('cover');
  startClock();
}

document.addEventListener('DOMContentLoaded', init);
