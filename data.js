/* ============================================================
   Huecas — saberes y sabores
   data.js — Todo el contenido del juego vive aquí.
   Añadir un ingrediente, receta o producto de mercado
   no requiere tocar la UI: solo estas estructuras.
   ============================================================ */

const TYPES = {
  ingredient: { label: 'Ingrediente', plural: 'Ingredientes', color: 'var(--verde)' },
  tool:       { label: 'Utensilio',   plural: 'Utensilios',   color: 'var(--terracota)' },
  technique:  { label: 'Técnica',     plural: 'Técnicas',     color: 'var(--tinta)' },
  prep:       { label: 'Preparación', plural: 'Preparaciones',color: 'var(--graphite)' },
  dish:       { label: 'Plato',       plural: 'Platos',       color: 'var(--morado)' },
};

/* Cada nodo: id, nombre, tipo, icono, nota cultural breve.
   `region` es decorativo (sello en la ficha). */
const ITEMS = {
  /* ---------- Ingredientes ---------- */
  verde:         { name: 'Verde',          type: 'ingredient', icon: '🍌', region: 'Costa',
                   note: 'Plátano macho, todavía firme. En la costa, el día empieza aquí.' },
  queso:         { name: 'Queso',          type: 'ingredient', icon: '🧀', region: 'Sierra',
                   note: 'Fresco, de mesa o de hoja. Se asoma en casi todas las páginas.' },
  chicharron:    { name: 'Chicharrón',     type: 'ingredient', icon: '🥓', region: 'Sierra',
                   note: 'Crocante de cerdo. Un lujo de todos los días.' },
  pescado:       { name: 'Pescado',        type: 'ingredient', icon: '🐟', region: 'Costa',
                   note: 'Albacora, picudo, lo que traiga la marea de madrugada.' },
  yuca:          { name: 'Yuca',           type: 'ingredient', icon: '🍠', region: 'Costa',
                   note: 'Raíz paciente. No se apura y no perdona el apuro.' },
  cebolla:       { name: 'Cebolla',        type: 'ingredient', icon: '🧅', region: 'Todo el país',
                   note: 'Colorada, para curtir. Llora quien la corta, agradece quien la come.' },
  limon:         { name: 'Limón',          type: 'ingredient', icon: '🍋', region: 'Costa',
                   note: 'Sutil y ácido. Cocina sin fuego.' },
  maiz:          { name: 'Choclo',         type: 'ingredient', icon: '🌽', region: 'Sierra',
                   note: 'Maíz tierno de la sierra. Dulce cuando quiere.' },
  papa:          { name: 'Papa',           type: 'ingredient', icon: '🥔', region: 'Sierra',
                   note: 'De páramo. Hay más variedades que apellidos.' },
  leche:         { name: 'Leche',          type: 'ingredient', icon: '🥛', region: 'Sierra',
                   note: 'De la hacienda o del cartón, según la casa.' },
  zapallo:       { name: 'Zapallo',        type: 'ingredient', icon: '🎃', region: 'Sierra',
                   note: 'Dulce y enorme. Uno solo alcanza para todos los vecinos.' },
  granos_mixtos: { name: 'Granos mixtos',  type: 'ingredient', icon: '🫘', region: 'Sierra',
                   note: 'Doce granos, o los que haya. La Semana Santa los junta.' },
  bacalao:       { name: 'Bacalao',        type: 'ingredient', icon: '🐠', region: 'De lejos',
                   note: 'Salado y viajero. Llega una sola vez al año, y se nota.' },

  /* ---------- Utensilios ---------- */
  pilon:    { name: 'Pilón',    type: 'tool', icon: '🪨', region: 'Costa',
              note: 'Madera gastada por generaciones de majar. Suena a casa.' },
  olla:     { name: 'Olla',     type: 'tool', icon: '🍲', region: 'Todo el país',
              note: 'Donde las cosas empiezan a ser comida.' },
  cuchillo: { name: 'Cuchillo', type: 'tool', icon: '🔪', region: 'Todo el país',
              note: 'Afilado en piedra, guardado con respeto.' },
  sarten:   { name: 'Sartén',   type: 'tool', icon: '🍳', region: 'Todo el país',
              note: 'Curada con uso. No se lava con jabón y no se presta.' },
  hoja:     { name: 'Hoja',     type: 'tool', icon: '🍃', region: 'Sierra',
              note: 'De choclo o de achira. Envuelve, perfuma y guarda.' },
  tabla:    { name: 'Tabla',    type: 'tool', icon: '🪵', region: 'Todo el país',
              note: 'Marcada de cortes viejos. Cada cicatriz fue un almuerzo.' },

  /* ---------- Técnicas ---------- */
  hervir:   { name: 'Hervir',   type: 'technique', icon: '♨️',
              note: 'El agua hace la mitad del trabajo. La paciencia, la otra mitad.' },
  majar:    { name: 'Majar',    type: 'technique', icon: '🤲',
              note: 'Aplastar con ritmo, sin deshacer. Se aprende con los oídos.' },
  curtir:   { name: 'Curtir',   type: 'technique', icon: '🫙',
              note: 'El ácido cocina en frío. Un saber de puerto.' },
  envolver: { name: 'Envolver', type: 'technique', icon: '🌿',
              note: 'La hoja guarda el vapor y el secreto.' },
  dorar:    { name: 'Dorar',    type: 'technique', icon: '🔥',
              note: 'El fuego firma al final, con letra dorada.' },
  mezclar:  { name: 'Mezclar',  type: 'technique', icon: '🌀',
              note: 'Unir sin apurar. Que nadie pierda su nombre en la mezcla.' },

  /* ---------- Preparaciones ---------- */
  verde_cocido:     { name: 'Verde cocido',       type: 'prep', icon: '🍌',
                      note: 'Suave por fuera, terco por dentro. Va por buen camino.' },
  verde_majado:     { name: 'Verde majado',       type: 'prep', icon: '🥣',
                      note: 'Golpe a golpe, el verde se vuelve masa y memoria.' },
  masa_bolon:       { name: 'Masa de bolón',      type: 'prep', icon: '🫓',
                      note: 'Verde y queso, amasados a mano. Ya casi es desayuno.' },
  curtido:          { name: 'Curtido simple',     type: 'prep', icon: '🥗',
                      note: 'Cebolla y limón, reposados. El toque que despierta todo.' },
  yuca_cocida:      { name: 'Yuca cocida',        type: 'prep', icon: '🍚',
                      note: 'Blanda y blanca. Aguanta caldos sin quejarse.' },
  caldo_pescado:    { name: 'Caldo de pescado',   type: 'prep', icon: '🍥',
                      note: 'El mar, concentrado en una olla.' },
  base_encebollado: { name: 'Base de encebollado',type: 'prep', icon: '🥘',
                      note: 'Caldo y yuca, juntos. Falta lo que lo hace célebre.' },
  maiz_preparado:   { name: 'Choclo preparado',   type: 'prep', icon: '🌾',
                      note: 'Desgranado y molido en la tabla. Huele a domingo.' },
  mezcla_humita:    { name: 'Mezcla de humita',   type: 'prep', icon: '🥧',
                      note: 'Choclo y queso, batidos. Pide una hoja a gritos.' },
  humita_envuelta:  { name: 'Humita envuelta',    type: 'prep', icon: '🍙',
                      note: 'Atada con su propia hoja. Lista para el vapor.' },
  papa_cocida:      { name: 'Papa cocida',        type: 'prep', icon: '🥚',
                      note: 'Tibia y dócil. Sueña con ser tortilla.' },
  masa_llapingacho: { name: 'Masa de llapingacho',type: 'prep', icon: '🫓',
                      note: 'Papa y queso, en tortitas. La plancha las espera.' },
  base_espesa:      { name: 'Base espesa',        type: 'prep', icon: '🍯',
                      note: 'Los granos se rinden lentamente. Esto va para largo.' },
  crema_base:       { name: 'Crema base',         type: 'prep', icon: '🍶',
                      note: 'La leche redondea lo que los granos empezaron.' },
  base_fanesca:     { name: 'Base de fanesca',    type: 'prep', icon: '🎃',
                      note: 'Zapallo, leche y granos. Solo falta el viajero salado.' },

  /* ---------- Platos ---------- */
  bolon:       { name: 'Bolón de verde', type: 'dish', icon: '🥟', region: 'Costa',
                 note: 'Verde majado con queso, dorado en sartén. Desayuno de manos generosas.' },
  bolon_mixto: { name: 'Bolón mixto',    type: 'dish', icon: '🍢', region: 'Costa', variant: true,
                 note: 'Con chicharrón adentro. Para días que piden más.' },
  encebollado: { name: 'Encebollado',    type: 'dish', icon: '🍜', region: 'Costa',
                 note: 'Caldo de pescado, yuca y curtido. Levanta muertos y amanece puertos.' },
  humita:      { name: 'Humita',         type: 'dish', icon: '🫔', region: 'Sierra',
                 note: 'Choclo tierno al vapor, en su propia hoja. Sabe a media tarde.' },
  llapingacho: { name: 'Llapingacho',    type: 'dish', icon: '🥞', region: 'Sierra',
                 note: 'Tortilla de papa con corazón de queso, dorada en plancha.' },
  fanesca:     { name: 'Fanesca',        type: 'dish', icon: '🍲', region: 'Todo el país', meta: true,
                 note: 'Doce granos, zapallo, leche y bacalao. Se cocina una vez al año y se recuerda los otros trescientos sesenta y cuatro días.',
                 lockedHint: 'Un plato espera a que todo converja.' },
};

/* Recetas: pares sin orden. `techniques` = saberes que se
   registran la primera vez que ocurre esa transformación. */
const RECIPES = [
  /* — Bolón — */
  { a: 'verde',         b: 'olla',       result: 'verde_cocido',   techniques: ['hervir'] },
  { a: 'verde_cocido',  b: 'pilon',      result: 'verde_majado',   techniques: ['majar'] },
  { a: 'verde_majado',  b: 'queso',      result: 'masa_bolon',     techniques: ['mezclar'] },
  { a: 'masa_bolon',    b: 'sarten',     result: 'bolon',          techniques: ['dorar'] },
  { a: 'masa_bolon',    b: 'chicharron', result: 'bolon_mixto' },

  /* — Encebollado — */
  { a: 'cebolla',           b: 'limon',       result: 'curtido',          techniques: ['curtir'] },
  { a: 'yuca',              b: 'olla',        result: 'yuca_cocida',      techniques: ['hervir'] },
  { a: 'pescado',           b: 'olla',        result: 'caldo_pescado',    techniques: ['hervir'] },
  { a: 'caldo_pescado',     b: 'yuca_cocida', result: 'base_encebollado', techniques: ['mezclar'] },
  { a: 'base_encebollado',  b: 'curtido',     result: 'encebollado' },

  /* — Humita — */
  { a: 'maiz',            b: 'tabla',    result: 'maiz_preparado', techniques: ['mezclar'] },
  { a: 'maiz',            b: 'cuchillo', result: 'maiz_preparado' },   /* ruta alterna */
  { a: 'maiz_preparado',  b: 'queso',    result: 'mezcla_humita',  techniques: ['mezclar'] },
  { a: 'mezcla_humita',   b: 'hoja',     result: 'humita_envuelta',techniques: ['envolver'] },
  { a: 'humita_envuelta', b: 'olla',     result: 'humita',         techniques: ['hervir'] },

  /* — Llapingacho — */
  { a: 'papa',             b: 'olla',   result: 'papa_cocida',      techniques: ['hervir'] },
  { a: 'papa_cocida',      b: 'queso',  result: 'masa_llapingacho', techniques: ['majar'] },
  { a: 'masa_llapingacho', b: 'sarten', result: 'llapingacho',      techniques: ['dorar'] },

  /* — Fanesca (meta) — */
  { a: 'granos_mixtos', b: 'olla',    result: 'base_espesa',  techniques: ['hervir'] },
  { a: 'base_espesa',   b: 'leche',   result: 'crema_base',   techniques: ['mezclar'] },
  { a: 'crema_base',    b: 'zapallo', result: 'base_fanesca' },
  { a: 'base_fanesca',  b: 'bacalao', result: 'fanesca' },
];

/* La lona del mercado. `blurb` es la microdescripción manuscrita. */
const SHOP = [
  { id: 'hoja',          cost: 1, blurb: 'recién cortadas, señito' },
  { id: 'yuca',          cost: 2, blurb: 'de la finca, sin engaño' },
  { id: 'chicharron',    cost: 2, blurb: 'crocante de hoy' },
  { id: 'tabla',         cost: 2, blurb: 'madera noble, dura años' },
  { id: 'leche',         cost: 2, blurb: 'ordeñada esta mañana' },
  { id: 'pescado',       cost: 3, blurb: 'fresquito, mírele el ojo' },
  { id: 'sarten',        cost: 3, blurb: 'ya viene curada' },
  { id: 'zapallo',       cost: 3, blurb: 'alcanza pa’ todos' },
  { id: 'granos_mixtos', cost: 5, blurb: 'los doce, contaditos' },
  { id: 'bacalao',       cost: 6, blurb: 'llegó de lejos, caserita' },
];

/* Estado inicial de un cuaderno nuevo. */
const INITIAL = {
  coins: 6,
  discovered: ['verde', 'queso', 'cebolla', 'limon', 'maiz', 'papa',
               'pilon', 'olla', 'cuchillo'],
};

/* Recompensas en fichas por tipo de hallazgo. */
const REWARDS = { prep: 1, technique: 1, dish: 4, dishMeta: 8, pageComplete: 2 };

const HINT_COST = 2; /* la primera pista es gratis */

const MICROCOPY = {
  fail: [
    'Todavía no.',
    'Algo falta aquí.',
    'Este sabor viene de más atrás.',
    'La cocina pide paciencia.',
    'Casi. La memoria no traiciona.',
  ],
  known: 'Ya está en el cuaderno.',
  discovered: 'Hallazgo registrado.',
  pageComplete: 'Página completa. El cuaderno respira.',
  bought: 'En la lona siempre aparece algo útil.',
  noCoins: 'Faltan fichas. El cuaderno sabrá premiarte.',
  noHints: 'Por ahora, el cuaderno guarda silencio.',
  metaDone: 'El cuaderno está en calma. Todo convergió.',
};

/* Orden de pestañas del cuaderno. */
const CATEGORIES = ['ingredient', 'tool', 'technique', 'prep', 'dish'];
