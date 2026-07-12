/* ============================================================
   Huecas — saberes y sabores (v5)
   app.js — Tu hueca: descubrir, servir bajo presión y sobrevivir.
   ============================================================ */

const SAVE_KEY = 'huecas_save_v5';

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
    toolWear: {},
    discovered: [],
    techniques: [],
    revealed: [],
    dishesDone: [],
    active: 'bolon',
    rating: HUECA.startRating,
    served: 0, missed: 0,
    consecutiveMisses: 0,
    sinceRent: 0,
    fiado: false,
    timesClosed: 0,
    actions: 0, nextSpawn: 3,
    mode: 'servicio',          /* 'servicio' | 'tranquilo' */
    milestonesHit: [],
    seenIntro: false,
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
const realDishes = () => state.dishesDone.filter(d => !ITEMS[d].creative);
const hasReadyDish = () => Object.keys(state.inv).some(id => isDish(id) && count(id) > 0);

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
  $('#hud').classList.toggle('hidden', !inGame);
  $('#tabbar').classList.toggle('hidden', !inGame);
  $('#ticket').classList.toggle('offscreen', !inGame || !customer);
  const tabOf = { shelf: 'shelf', receta: 'shelf', cocina: 'cocina', mercado: 'mercado' };
  $$('#tabbar .tab-btn').forEach(b => b.classList.toggle('current', b.dataset.screen === tabOf[screen]));
  if (screen === 'shelf') renderShelf();
  if (screen === 'receta') renderReceta();
  if (screen === 'cocina') renderCocina();
  if (screen === 'mercado') renderMercado();
  $('#stage').scrollTo(0, 0);
  window.scrollTo(0, 0);
}

function openReceta(cid) { recetaOpen = cid; show('receta'); }

function goCook(cid) {
  state.active = cid;
  save();
  show('cocina');
}

/* ---------- HUD: sucres y fama ---------- */

function heartsHtml(rating) {
  /* 5 corazones, cada uno vale 2 de fama */
  let out = '';
  for (let i = 0; i < 5; i++) {
    const v = rating - i * 2;
    const cls = v >= 2 ? 'full' : v === 1 ? 'half' : 'empty';
    out += `<span class="heart ${cls}">${iconOf('corazon')}</span>`;
  }
  return out;
}

function renderHud() {
  $('#hud-coins').textContent = 'S/ ' + S(state.coins);
  $('#hud-hearts').innerHTML = heartsHtml(state.rating);
  const modeBtn = $('#hud-mode');
  modeBtn.dataset.mode = state.mode;
  modeBtn.innerHTML = state.mode === 'servicio'
    ? '<span class="mode-dot on"></span> Servicio'
    : '<span class="mode-dot"></span> Tranquilo';
}

function addCoins(n) {
  state.coins += n;
  renderHud();
  if (n > 0) {
    const chip = $('#hud-coins-pill');
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
   LA HUECA — clientes, presión, salubridad, arriendo
   ============================================================ */

let customer = null;
let customerTimer = null;

/* la presión sube con los platos que dominas */
function pressureTier() {
  const n = realDishes().length;
  let tier = HUECA.pressure[0];
  for (const p of HUECA.pressure) if (n >= p.dishes) tier = p;
  return tier;
}

/* cada acción acerca al próximo cliente (solo en servicio) */
function tickAction() {
  if (state.mode !== 'servicio' || !realDishes().length) return;
  state.actions += 1;
  if (!customer && state.actions >= state.nextSpawn) spawnCustomer();
  save();
}

function spawnCustomer() {
  if (state.mode !== 'servicio') return;
  const dish = pick(realDishes());
  if (!dish) return;
  const who = pick(CLIENTES);
  const tier = pressureTier();
  customer = { ...who, dish, deadline: Date.now() + tier.patience * 1000, total: tier.patience };
  state.actions = 0;
  state.nextSpawn = rand(tier.min, tier.max);
  renderTicket();
  buzz([40, 60, 40]);
  clearInterval(customerTimer);
  customerTimer = setInterval(() => {
    if (!customer) { clearInterval(customerTimer); return; }
    const left = customer.deadline - Date.now();
    if (left <= 0) resolveCustomer(false);
    else updateTicketTimer(left);
  }, 250);
}

function updateTicketTimer(left) {
  $('#ticket-time').textContent = Math.ceil(left / 1000) + 's';
  const frac = Math.max(0, left / (customer.total * 1000));
  $('#ticket-bar').style.transform = `scaleX(${frac})`;
  $('#ticket').classList.toggle('urgent', frac < 0.33);
}

function renderTicket() {
  const t = $('#ticket');
  if (!customer) { t.classList.add('offscreen'); return; }
  const have = count(customer.dish) >= 1;
  $('#ticket-avatar').innerHTML = iconOf(customer.icon);
  $('#ticket-dish').innerHTML = iconOf(customer.dish);
  $('#ticket-text').innerHTML =
    `<strong>${customer.name}</strong><br>quiere <em>${ITEMS[customer.dish].name}</em>`;
  updateTicketTimer(customer.deadline - Date.now());
  const serveBtn = $('#ticket-serve');
  serveBtn.disabled = !have;
  serveBtn.innerHTML = have ? `Servir <small>+S/ ${S(customerPay(customer.dish))}</small>` : 'No lo tienes';
  t.classList.remove('offscreen');
}

function customerPay(dish) {
  return ITEMS[dish].sell + Math.floor(state.rating / 4);
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
    state.consecutiveMisses = 0;
    toast(`${MICROCOPY.served}${tip ? ` Propina: S/ ${S(tip)}.` : ''}`, 'seal');
    buzz([30, 40, 60]);
    state.sinceRent += 1;
    renderHud();
    save();
    refreshGameScreens();
    if (checkMilestone()) return;
    if (state.sinceRent >= HUECA.rentEvery) { setTimeout(showRent, 1000); return; }
  } else {
    state.rating = Math.max(0, state.rating - 1);
    state.missed += 1;
    state.consecutiveMisses += 1;
    toast(MICROCOPY.missed, 'soft');
    buzz(90);
    state.sinceRent += 1;
    renderHud();
    save();
    refreshGameScreens();
    if (state.consecutiveMisses >= SALUBRIDAD.missLimit) { setTimeout(salubridadVisit, 1000); return; }
    if (state.sinceRent >= HUECA.rentEvery) { setTimeout(showRent, 1000); return; }
  }
}

function refreshGameScreens() {
  if (currentScreen === 'cocina') renderCocina();
  if (currentScreen === 'mercado') renderMercado();
  if (currentScreen === 'shelf') renderShelf();
}

/* ---------- Salubridad ---------- */

function salubridadVisit() {
  state.consecutiveMisses = 0;
  const pass = hasReadyDish();
  $('#salubridad-icon').innerHTML = iconOf(pass ? 'salubridad' : 'arriendo');
  $('#salubridad-title').textContent = 'Autoridad de salubridad';
  $('#salubridad-text').textContent = pass
    ? 'Tres clientes se fueron con hambre y llegó la inspección. Por suerte tenías un plato listo para mostrar.'
    : 'Tres clientes se fueron con hambre y llegó la inspección. No había ni un plato listo que mostrar.';
  const btn = $('#salubridad-ok');
  btn.textContent = pass ? MICROCOPY.salubridadPass.split(':')[0] + ': seguir' : 'Cerrar la hueca';
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
  addCoins(m.reward);
  save();
  $('#milestone-icon').innerHTML = iconOf('corazon');
  $('#milestone-title').textContent = m.title;
  $('#milestone-served').textContent = `${m.served} clientes servidos`;
  $('#milestone-note').textContent = m.note;
  $('#milestone-reward').textContent = `+S/ ${S(m.reward)}`;
  $('#modal-milestone').classList.add('open');
  return true;
}

/* ---------- Arriendo ---------- */

function showRent() {
  state.sinceRent = 0;
  const canPay = state.coins >= HUECA.rent;
  const canFiar = !canPay && !state.fiado && state.rating >= 7;
  $('#arriendo-text').textContent = `Don Aurelio pasa por el arriendo: S/ ${S(HUECA.rent)}.`;
  const payBtn = $('#arriendo-pay');
  payBtn.textContent = canPay ? `Pagar S/ ${S(HUECA.rent)}`
    : canFiar ? 'Pedir que te fíe' : 'No me alcanza…';
  payBtn.dataset.mode = canPay ? 'pay' : canFiar ? 'fiar' : 'close';
  $('#arriendo-note').textContent = canPay
    ? 'La hueca sigue abierta un mes más.'
    : canFiar ? 'Con tu fama, don Aurelio puede esperar. Solo esta vez.'
      : 'Sin sucres y sin fama, don Aurelio no perdona.';
  $('#modal-arriendo').classList.add('open');
  save();
}

function resolveRent() {
  const mode = $('#arriendo-pay').dataset.mode;
  $('#modal-arriendo').classList.remove('open');
  if (mode === 'pay') { addCoins(-HUECA.rent); toast('Arriendo pagado. Un mes más de hueca.', 'seal'); save(); }
  else if (mode === 'fiar') { state.fiado = true; toast('Don Aurelio anota en su libreta y se va sin sonreír.', 'soft'); save(); }
  else closeHueca();
}

/* ---------- Cierre y reapertura ---------- */

function closeHueca() {
  clearInterval(customerTimer);
  customer = null;
  renderTicket();
  state.timesClosed += 1;
  $('#cierre-veces').textContent = state.timesClosed > 1
    ? `Ya van ${state.timesClosed} veces. El barrio te sigue queriendo.` : '';
  $('#modal-cierre').classList.add('open');
  save();
}

function reopenHueca() {
  state.inv = {};
  state.coins = INITIAL_COINS;
  state.rating = HUECA.startRating;
  state.sinceRent = 0;
  state.consecutiveMisses = 0;
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

/* ---------- Modo tranquilo / servicio ---------- */

function toggleMode() {
  state.mode = state.mode === 'servicio' ? 'tranquilo' : 'servicio';
  if (state.mode === 'tranquilo') {
    clearInterval(customerTimer);
    customer = null;
    renderTicket();
    state.actions = 0;
    toast(MICROCOPY.calmOn, 'seal');
  } else {
    toast(MICROCOPY.calmOff, 'ink');
  }
  renderHud();
  save();
  refreshGameScreens();
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
        : '<span class="dots">' + '●'.repeat(stepsDone(cid)) + '○'.repeat(total - stepsDone(cid)) + '</span>'}</span>
    ` : `
      <span class="book-icon dim">${iconOf('cuaderno')}</span>
      <span class="book-title">¿${c.title}?</span>
      <span class="book-city">${c.city}</span>
      <span class="book-progress"><span class="price-tag">S/ ${S(c.cost)}</span></span>
    `;
    book.addEventListener('click', () => {
      if (owned) openReceta(cid);
      else { show('mercado'); toast('Ese cuaderno se consigue en la lona.', 'soft'); }
    });
    rack.appendChild(book);
  });

  const done = CUADERNO_ORDER.filter(cid => owns(cid) && isComplete(cid)).length;
  $('#shelf-recipes').textContent = `${done}/${CUADERNO_ORDER.length}`;
  $('#shelf-served').textContent = state.served;
  const next = MILESTONES.find(m => !state.milestonesHit.includes(m.served));
  $('#shelf-goal').textContent = next
    ? `Próxima meta: ${next.title} (${state.served}/${next.served} clientes)`
    : '¡Patrimonio del sabor alcanzado!';
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
    <span class="mini-item res">${iconOf(step.result)}<small>${ITEMS[step.result].name}</small></span>`;
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
    const isCurrent = !done && firstPending && !step.variant;
    const row = el('div', 'step' + (done ? ' done' : '') + (isCurrent ? ' current' : '') + (step.variant ? ' variant' : ''));
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
            <button type="button" class="btn-main small try-btn">Intentar en la cocina</button>
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
    : `${stepsDone(cid)} de ${mainSteps(cid).length} pasos`;
  $('#receta-cook-btn').onclick = () => goCook(cid);
}

/* ============================================================
   COCINA
   ============================================================ */

const slots = [null, null];
let combining = false;

function renderCocina() {
  renderServiceStrip();
  renderChips();
  renderInventory();
  renderSlots();
  renderRiddle();
}

/* franja de estado del servicio */
function renderServiceStrip() {
  const strip = $('#service-strip');
  if (!realDishes().length) {
    strip.className = 'service-strip calm';
    strip.innerHTML = `<span class="ss-dot"></span> Aún sin platos. Descubre tu primera receta.`;
    return;
  }
  if (state.mode === 'tranquilo') {
    strip.className = 'service-strip calm';
    strip.innerHTML = `<span class="ss-dot"></span> Modo tranquilo · sin clientes. Cocina con calma.`;
    return;
  }
  const miss = state.consecutiveMisses;
  if (miss >= 1) {
    strip.className = 'service-strip warn';
    strip.innerHTML = `⚠ ${miss}/${SALUBRIDAD.missLimit} clientes sin servir — ten un plato listo o vendrá salubridad.`;
  } else {
    strip.className = 'service-strip on';
    strip.innerHTML = `<span class="ss-dot on"></span> Servicio abierto · la clientela puede llegar.`;
  }
}

function renderChips() {
  const chips = $('#cocina-chips');
  chips.innerHTML = '';
  state.owned.forEach(cid => {
    const c = CUADERNOS[cid];
    const b = el('button', 'chip-book' + (cid === state.active ? ' current' : '') + (isComplete(cid) ? ' done' : ''));
    b.type = 'button';
    b.innerHTML = `<span class="chip-icon">${iconOf(isComplete(cid) ? c.dish : 'cuaderno')}</span><span>${ITEMS[c.dish].name}</span>`;
    b.addEventListener('click', () => { state.active = cid; save(); renderCocina(); });
    chips.appendChild(b);
  });
}

function renderInventory() {
  const put = (sel, ids, badge = true) => {
    const box = $(sel);
    box.innerHTML = '';
    if (!ids.length) { box.appendChild(el('span', 'inv-none', '—')); return; }
    ids.forEach(id => {
      const card = itemCard(id);
      const inSlots = slots.filter(s => s === id).length;
      if (badge && !isTool(id)) card.append(el('span', 'badge', String(count(id))));
      if (!isTool(id) && count(id) - inSlots <= 0) card.classList.add('spent');
      if (isTool(id) && ITEMS[id].wear) {
        const left = state.toolWear[id] ?? ITEMS[id].wear;
        card.append(el('span', 'wear' + (left <= 0 ? ' dull' : left <= 2 ? ' low' : ''),
          left <= 0 ? '✕' : '▮'.repeat(left)));
        if (left <= 0) card.classList.add('dull-tool');
      }
      card.draggable = true;
      card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); card.classList.add('dragging'); });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => placeInSlot(id));
      box.appendChild(card);
    });
  };

  put('#inv-tools', state.tools);
  put('#inv-ingredients', Object.keys(state.inv).filter(id => ITEMS[id].type === 'ingredient').sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)));
  put('#inv-preps', Object.keys(state.inv).filter(id => ITEMS[id].type === 'prep').sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)));
  const done = Object.keys(state.inv).filter(id => isDone(id));
  $('#inv-done-wrap').style.display = done.length ? '' : 'none';
  put('#inv-done', done.sort((x, y) => ITEMS[x].name.localeCompare(ITEMS[y].name)));
  $('#inv-preps-wrap').style.display =
    Object.keys(state.inv).some(id => ITEMS[id].type === 'prep') ? '' : 'none';
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
  $('#mesa-clear').style.visibility = (slots[0] || slots[1]) ? 'visible' : 'hidden';
}

function renderRiddle() {
  const note = $('#cocina-riddle');
  const step = CUADERNOS[state.active].steps.find(s => !knows(s.result) && !s.variant);
  if (!step) {
    note.innerHTML = `<span class="hand">✓ ${ITEMS[CUADERNOS[state.active].dish].name} recuperado. Cocínalo de memoria.</span>`;
    return;
  }
  note.innerHTML = `<span class="riddle-label">el cuaderno murmura…</span><br><span class="hand">“${step.hint}”</span>`;
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

function clearMesa() {
  if (combining) return;
  slots[0] = slots[1] = null;
  renderCocina();
}

/* --- El motor: paso canon → regla → bloqueo → mezcla rara --- */

function attemptCombine() {
  if (!slots[0] || !slots[1] || combining) return;
  combining = true;
  const [x, y] = slots;
  const surface = $('#cocina-surface');

  const consume = () => [x, y].forEach(id => { if (isTool(id)) wearTool(id); else addItem(id, -1); });
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

  const step = findStep(x, y);
  if (step && owns(step.cuaderno)) {
    consume();
    addItem(step.result, 1);
    surface.classList.add('success');
    buzz([30, 40, 60]);
    setTimeout(() => {
      surface.classList.remove('success');
      if (!knows(step.result)) { slots[0] = slots[1] = null; combining = false; discover(step.result, step, 'canon'); tickAction(); checkRescue(); }
      else { floaty(`+1 ${ITEMS[step.result].name}`); toast(MICROCOPY.crafted, 'seal'); finish(); }
    }, 620);
    return;
  }

  const rule = findRule(x, y);
  if (rule) {
    consume();
    addItem(rule.result, 1);
    const ok = rule.kind === 'creative';
    surface.classList.add(ok ? 'success' : 'shake');
    buzz(ok ? [30, 40, 60] : 80);
    setTimeout(() => {
      surface.classList.remove('success', 'shake');
      if (ok && !knows(rule.result)) { slots[0] = slots[1] = null; combining = false; discover(rule.result, rule, 'creative'); tickAction(); checkRescue(); }
      else { toast(rule.msg, ok ? 'seal' : 'soft'); finish(); }
    }, ok ? 620 : 500);
    return;
  }

  if (isDone(x) || isDone(y)) {
    reject(ITEMS[x].type === 'junk' || ITEMS[y].type === 'junk' ? MICROCOPY.junkOnMesa : MICROCOPY.dishOnMesa);
    return;
  }
  if (isTool(x) && isTool(y)) { reject(MICROCOPY.toolsClank); return; }

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
  const wasFirstDish = isDish(id) && !realDishes().length && !ITEMS[id].creative;
  state.discovered.push(id);
  const item = ITEMS[id];

  let reward = kind === 'creative' ? REWARDS.creative
    : item.type === 'dish' ? (item.meta ? REWARDS.dishMeta : item.variant ? REWARDS.dishVariant : REWARDS.dish)
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
    state.firstDishPending = wasFirstDish;
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
  $('#celebra-city').textContent = c ? `${c.city} · ${c.region}` : 'creación propia';
  $('#celebra-line').textContent = source.line || source.msg || '';
  $('#celebra-reward').textContent = `+S/ ${S(reward)}`;
  $('#celebra-sell').textContent = item.sell ? `Se vende a S/ ${S(item.sell)}. La clientela ya puede pedirlo.` : '';
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
  if (state.firstDishPending) {
    state.firstDishPending = false;
    save();
    toast(MICROCOPY.firstDish, 'seal');
  }
  if (celebratedCuaderno) openReceta(celebratedCuaderno);
  else show('cocina');
}

/* ============================================================
   MERCADO
   ============================================================ */

function renderMercado() {
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
      addCoins(-item.price); addItem(id, 1); tickAction(); save(); buzz(25); renderMercado();
    });
    ing.appendChild(card);
  });

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
      addCoins(-item.price); addItem(id, 1); tickAction(); save(); toast('Pesa, pero vale cada sucre.', 'seal'); renderMercado();
    });
    tools.appendChild(card);
  });
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
      addCoins(-cost); state.toolWear[id] = ITEMS[id].wear; save(); toast('El afilador le devuelve el canto al cuchillo.', 'seal'); renderMercado();
    });
    tools.appendChild(card);
  });
  $('#market-tools-section').style.display = tools.children.length ? '' : 'none';

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
        <span class="price tag ${worthless ? 'toss-tag' : 'sell-tag'}">${worthless ? 'botar' : `+S/ ${S(item.sell)}`}</span>`;
      card.addEventListener('click', () => {
        addItem(id, -1);
        if (!worthless) { addCoins(item.sell); toast(MICROCOPY.sold, 'seal'); }
        else toast(MICROCOPY.tossed, 'soft');
        tickAction(); save(); buzz(25); renderMercado();
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
   ONBOARDING
   ============================================================ */

function maybeIntro() {
  if (state.seenIntro) return;
  $('#modal-intro').classList.add('open');
}

function closeIntro() {
  state.seenIntro = true;
  save();
  $('#modal-intro').classList.remove('open');
}

/* ============================================================
   ARRANQUE
   ============================================================ */

function bindEvents() {
  $('#btn-continue').addEventListener('click', () => { show('cocina'); maybeIntro(); });
  $('#btn-new').addEventListener('click', () => {
    const fresh = !load();
    if (fresh || confirm('¿Empezar una hueca nueva? La actual se perderá.')) {
      state = newState();
      save();
      renderHud();
      show('cocina');
      maybeIntro();
    }
  });

  $$('#tabbar .tab-btn').forEach(b => b.addEventListener('click', () => show(b.dataset.screen)));
  $('#receta-back').addEventListener('click', () => show('shelf'));
  $('#hud-mode').addEventListener('click', toggleMode);
  $('#quick-lona').addEventListener('click', () => show('mercado'));
  $('#quick-cocina').addEventListener('click', () => show('cocina'));
  $('#mesa-clear').addEventListener('click', clearMesa);

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
    zone.addEventListener('click', () => { if (!combining && slots[i]) { slots[i] = null; renderCocina(); } });
  });

  $('#ticket-serve').addEventListener('click', () => { if (customer) resolveCustomer(true); });
  $('#ticket-miss').addEventListener('click', () => { if (customer) resolveCustomer(false); });
  $('#arriendo-pay').addEventListener('click', resolveRent);
  $('#cierre-reopen').addEventListener('click', reopenHueca);
  $('#salubridad-ok').addEventListener('click', resolveSalubridad);
  $('#milestone-close').addEventListener('click', () => {
    $('#modal-milestone').classList.remove('open');
    if (state.sinceRent >= HUECA.rentEvery) setTimeout(showRent, 400);
  });
  $('#intro-close').addEventListener('click', closeIntro);

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
  $('#btn-continue').style.display = saved ? '' : 'none';
  $('#btn-new').textContent = saved ? 'Hueca nueva' : 'Abrir la hueca';
  $$('[data-icon]').forEach(n => { n.innerHTML = iconOf(n.dataset.icon); });
  bindEvents();
  renderHud();
  show('cover');
}

document.addEventListener('DOMContentLoaded', init);
