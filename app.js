/* ============================================================
   Huecas — saberes y sabores
   app.js — Estado, pantallas e interacción.
   ============================================================ */

const SAVE_KEY = 'huecas_save_v1';

/* ---------- Estado ---------- */

let state = null;

function newState() {
  return {
    coins: INITIAL.coins,
    discovered: [...INITIAL.discovered],
    completedPages: [],
    hintsUsed: 0,
    lastFind: null,
  };
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* modo incógnito, seguimos en memoria */ }
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!Array.isArray(s.discovered)) return null;
    return { ...newState(), ...s };
  } catch (e) { return null; }
}

const has = (id) => state.discovered.includes(id);

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

function findRecipe(x, y) {
  return RECIPES.find(r => (r.a === x && r.b === y) || (r.a === y && r.b === x));
}

/* Recetas aún no descubiertas donde ambos insumos ya se tienen. */
function reachableRecipes() {
  return RECIPES.filter(r => has(r.a) && has(r.b) && !has(r.result));
}

/* ¿En cuántas combinaciones pendientes participa este nodo? */
function opensPaths(id) {
  return RECIPES.filter(r => (r.a === id || r.b === id) && !has(r.result)).length;
}

/* ---------- Navegación ---------- */

const SCREENS = ['cover', 'notebook', 'mesa', 'mercado'];
let currentScreen = 'cover';

function show(screen) {
  currentScreen = screen;
  SCREENS.forEach(s => $('#screen-' + s).classList.toggle('active', s === screen));
  $('#topbar').classList.toggle('hidden', screen === 'cover');
  $$('#topbar .nav-btn').forEach(b => b.classList.toggle('current', b.dataset.screen === screen));
  if (screen === 'notebook') renderNotebook();
  if (screen === 'mesa') renderMesa();
  if (screen === 'mercado') renderMercado();
  window.scrollTo(0, 0);
}

/* ---------- Fichas (moneda) ---------- */

function renderCoins() {
  $$('.coin-count').forEach(n => { n.textContent = state.coins; });
}

function addCoins(n) {
  state.coins += n;
  renderCoins();
  const chip = $('#topbar .coins');
  if (chip && n > 0) {
    chip.classList.remove('pulse');
    void chip.offsetWidth; /* reinicia la animación */
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

/* ---------- Tarjetas de objeto ---------- */

function itemCard(id, { silhouette = false } = {}) {
  const item = ITEMS[id];
  const card = el('button', 'item-card type-' + item.type);
  card.type = 'button';
  card.dataset.id = id;
  if (silhouette) {
    card.classList.add('silhouette');
    const hint = item.lockedHint ? `<span class="locked-hint">${item.lockedHint}</span>` : '';
    card.innerHTML = `<span class="icon">${item.icon}</span><span class="name">?</span>${hint}`;
    card.setAttribute('aria-label', 'Página sin descubrir');
  } else {
    card.innerHTML = `<span class="icon">${item.icon}</span><span class="name">${item.name}</span>`;
    card.setAttribute('aria-label', `${item.name}, ${TYPES[item.type].label}`);
  }
  return card;
}

/* ============================================================
   CUADERNO
   ============================================================ */

let notebookTab = 'ingredient';

function renderNotebook() {
  /* pestañas */
  const tabs = $('#notebook-tabs');
  tabs.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const ids = Object.keys(ITEMS).filter(id => ITEMS[id].type === cat);
    const found = ids.filter(has).length;
    const b = el('button', 'tab' + (cat === notebookTab ? ' current' : ''),
      `${TYPES[cat].plural} <small>${found}/${ids.length}</small>`);
    b.type = 'button';
    b.addEventListener('click', () => { notebookTab = cat; renderNotebook(); });
    tabs.appendChild(b);
  });

  /* página izquierda: nota + progreso */
  const totalIds = Object.keys(ITEMS);
  const totalFound = totalIds.filter(has).length;
  $('#notebook-progress').textContent = `${totalFound} de ${totalIds.length} hallazgos`;
  const dishes = totalIds.filter(id => ITEMS[id].type === 'dish' && has(id));
  $('#notebook-dishes').textContent = dishes.length
    ? 'Platos recuperados: ' + dishes.map(id => ITEMS[id].name).join(', ') + '.'
    : 'Ningún plato recuperado todavía. La mesa espera.';
  const last = state.lastFind && ITEMS[state.lastFind];
  $('#notebook-last').textContent = last ? `Último hallazgo: ${last.name}.` : '';

  /* página derecha: colección de la categoría */
  const grid = $('#notebook-grid');
  grid.innerHTML = '';
  Object.keys(ITEMS)
    .filter(id => ITEMS[id].type === notebookTab)
    .forEach(id => {
      const card = itemCard(id, { silhouette: !has(id) });
      if (has(id)) card.addEventListener('click', () => showFicha(id));
      grid.appendChild(card);
    });
}

/* ============================================================
   MESA DE TRABAJO
   ============================================================ */

const slots = [null, null]; /* ids en las dos zonas de combinación */
let combining = false;

function renderMesa() {
  renderSlots();
  renderTray();
  renderHintButton();
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
      zone.appendChild(el('span', 'slot-hint', i === 0 ? 'algo…' : '…con algo'));
    }
  });
}

function renderTray() {
  const tray = $('#tray');
  tray.innerHTML = '';
  const order = { ingredient: 0, tool: 1, prep: 2, dish: 3, technique: 4 };
  state.discovered
    .filter(id => ITEMS[id].type !== 'technique') /* las técnicas se registran, no se arrastran */
    .sort((x, y) => (order[ITEMS[x].type] - order[ITEMS[y].type]) || ITEMS[x].name.localeCompare(ITEMS[y].name))
    .forEach(id => {
      const card = itemCard(id);
      card.draggable = true;
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'copy';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      /* modo táctil: tocar coloca en el primer espacio libre */
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
  const recipe = findRecipe(slots[0], slots[1]);
  const mesa = $('#mesa-surface');

  if (!recipe) {
    mesa.classList.add('shake');
    toast(pick(MICROCOPY.fail), 'soft');
    setTimeout(() => {
      mesa.classList.remove('shake');
      combining = false;
    }, 450);
    return;
  }

  if (has(recipe.result)) {
    toast(MICROCOPY.known, 'soft');
    slots[0] = slots[1] = null;
    renderSlots();
    combining = false;
    return;
  }

  /* ¡Hallazgo! */
  mesa.classList.add('success');
  setTimeout(() => {
    mesa.classList.remove('success');
    slots[0] = slots[1] = null;
    combining = false;
    discover(recipe.result, recipe.techniques || []);
    renderMesa();
  }, 620);
}

/* Registra un hallazgo por combinación: recompensas, técnicas y ficha. */
function discover(id, techniques = []) {
  const item = ITEMS[id];
  state.discovered.push(id);
  state.lastFind = id;

  let reward = item.type === 'dish'
    ? (item.meta ? REWARDS.dishMeta : REWARDS.dish)
    : (REWARDS[item.type] || 1);

  const newTechs = techniques.filter(t => !has(t));
  newTechs.forEach(t => {
    state.discovered.push(t);
    reward += REWARDS.technique;
  });

  reward += checkPageBonuses();
  addCoins(reward);
  save();
  showFicha(id, { isNew: true, reward, newTechs });
  if (item.meta) setTimeout(() => toast(MICROCOPY.metaDone, 'seal'), 800);
}

/* Bono por completar la página de una categoría. */
function checkPageBonuses() {
  let bonus = 0;
  CATEGORIES.forEach(cat => {
    if (state.completedPages.includes(cat)) return;
    const ids = Object.keys(ITEMS).filter(id => ITEMS[id].type === cat);
    if (ids.every(has)) {
      state.completedPages.push(cat);
      bonus += REWARDS.pageComplete;
      setTimeout(() => toast(MICROCOPY.pageComplete, 'seal'), 1600);
    }
  });
  return bonus;
}

/* ---------- Pistas ---------- */

function hintPrice() { return state.hintsUsed === 0 ? 0 : HINT_COST; }

function renderHintButton() {
  const b = $('#hint-btn');
  const price = hintPrice();
  b.innerHTML = price === 0 ? 'Pedir una pista <small>gratis</small>'
                            : `Pedir una pista <small>${price} fichas</small>`;
}

function giveHint() {
  const candidates = reachableRecipes();
  if (!candidates.length) { toast(MICROCOPY.noHints, 'soft'); return; }
  const price = hintPrice();
  if (state.coins < price) { toast(MICROCOPY.noCoins, 'soft'); return; }
  addCoins(-price);
  state.hintsUsed += 1;
  save();
  const r = pick(candidates);
  /* revela un insumo y solo el tipo del otro */
  const [known, veiled] = Math.random() < 0.5 ? [r.a, r.b] : [r.b, r.a];
  const typeLabel = TYPES[ITEMS[veiled].type].label.toLowerCase();
  const note = $('#hint-note');
  note.textContent =
    `${ITEMS[known].name} quiere encontrarse con... ${ITEMS[veiled].type === 'tool' ? 'un' : 'algún'} ${typeLabel}.`;
  note.classList.add('visible');
  renderHintButton();
  clearTimeout(giveHint._t);
  giveHint._t = setTimeout(() => $('#hint-note').classList.remove('visible'), 6000);
}

/* ============================================================
   MERCADO
   ============================================================ */

function renderMercado() {
  const grid = $('#market-grid');
  grid.innerHTML = '';
  SHOP.forEach(({ id, cost, blurb }) => {
    const item = ITEMS[id];
    const owned = has(id);
    const card = el('div', 'market-item type-' + item.type + (owned ? ' owned' : ''));
    card.innerHTML = `
      <span class="icon">${item.icon}</span>
      <span class="name">${item.name}</span>
      <span class="blurb">“${blurb}”</span>
      ${owned
        ? '<span class="price sold">ya es tuyo</span>'
        : `<button type="button" class="price buy-btn">${cost} ${cost === 1 ? 'ficha' : 'fichas'}</button>`}
    `;
    if (!owned) {
      card.querySelector('.buy-btn').addEventListener('click', () => buy(id, cost, card));
    }
    grid.appendChild(card);
  });
}

function buy(id, cost, card) {
  if (state.coins < cost) { toast(MICROCOPY.noCoins, 'soft'); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 450); return; }
  addCoins(-cost);
  state.discovered.push(id);
  state.lastFind = id;
  addCoins(checkPageBonuses());
  save();
  toast(MICROCOPY.bought, 'seal');
  renderMercado();
}

/* ============================================================
   FICHA DE HALLAZGO
   ============================================================ */

function showFicha(id, { isNew = false, reward = 0, newTechs = [] } = {}) {
  const item = ITEMS[id];
  $('#ficha-icon').textContent = item.icon;
  $('#ficha-name').textContent = item.name;
  const typeChip = $('#ficha-type');
  typeChip.textContent = TYPES[item.type].label;
  typeChip.style.setProperty('--chip', TYPES[item.type].color);
  $('#ficha-region').textContent = item.region || '';
  $('#ficha-region').style.display = item.region ? '' : 'none';
  $('#ficha-note').textContent = item.note;

  const paths = opensPaths(id);
  $('#ficha-paths').textContent = paths > 0
    ? `Participa en ${paths} ${paths === 1 ? 'combinación' : 'combinaciones'} aún por descubrir.`
    : 'Por ahora, descansa en su página.';

  const extras = $('#ficha-extras');
  extras.innerHTML = '';
  if (isNew && newTechs.length) {
    extras.appendChild(el('p', 'ficha-techs',
      'También se registró: ' + newTechs.map(t => `<em>${ITEMS[t].name}</em>`).join(', ') + '.'));
  }
  if (isNew && reward > 0) {
    extras.appendChild(el('p', 'ficha-reward', `+${reward} fichas`));
  }

  $('#ficha-stamp').style.display = isNew ? '' : 'none';
  const modal = $('#ficha');
  modal.classList.toggle('is-new', isNew);
  modal.classList.add('open');
}

function closeFicha() {
  $('#ficha').classList.remove('open');
  if (currentScreen === 'notebook') renderNotebook();
  if (currentScreen === 'mesa') renderMesa();
}

/* ============================================================
   ARRANQUE
   ============================================================ */

function bindEvents() {
  /* portada */
  $('#btn-continue').addEventListener('click', () => show('notebook'));
  $('#btn-new').addEventListener('click', () => {
    const fresh = !load();
    if (fresh || confirm('¿Empezar un cuaderno nuevo? El actual se perderá.')) {
      state = newState();
      save();
      renderCoins();
      show('notebook');
    }
  });

  /* navegación superior */
  $$('#topbar .nav-btn').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.screen)));
  $('#btn-cover').addEventListener('click', () => show('cover'));

  /* zonas de combinación: drag & drop */
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

  $('#hint-btn').addEventListener('click', giveHint);

  /* ficha */
  $('#ficha-close').addEventListener('click', closeFicha);
  $('#ficha').addEventListener('click', (e) => { if (e.target === $('#ficha')) closeFicha(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFicha(); });
}

function init() {
  const saved = load();
  state = saved || newState();
  $('#btn-continue').textContent = saved ? 'Continuar' : 'Abrir el cuaderno';
  bindEvents();
  renderCoins();
  show('cover');
}

document.addEventListener('DOMContentLoaded', init);
