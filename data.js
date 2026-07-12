/* ============================================================
   Huecas — saberes y sabores (v2)
   data.js — Todo el contenido del juego vive aquí.
   La unidad central es el CUADERNO: un recetario incompleto
   de un plato emblemático de una ciudad. Añadir un plato nuevo
   es añadir un cuaderno con sus pasos; la UI se genera sola.
   ============================================================ */

const TYPES = {
  ingredient: { label: 'Ingrediente' },
  tool:       { label: 'Utensilio' },
  technique:  { label: 'Técnica' },
  prep:       { label: 'Preparación' },
  dish:       { label: 'Plato' },
};

/* ---------- Nodos ---------- */
const ITEMS = {
  /* Ingredientes */
  verde:         { name: 'Verde',         type: 'ingredient', icon: '🍌',
                   note: 'Plátano macho, aún firme. En la costa, el día empieza aquí.' },
  queso:         { name: 'Queso',         type: 'ingredient', icon: '🧀',
                   note: 'Fresco, de mesa o de hoja. Se asoma en casi todas las páginas.' },
  chicharron:    { name: 'Chicharrón',    type: 'ingredient', icon: '🥓',
                   note: 'Crocante de cerdo. Un lujo de todos los días.' },
  pescado:       { name: 'Pescado',       type: 'ingredient', icon: '🐟',
                   note: 'Albacora, picudo, lo que traiga la marea de madrugada.' },
  yuca:          { name: 'Yuca',          type: 'ingredient', icon: '🍠',
                   note: 'Raíz paciente. No se apura y no perdona el apuro.' },
  cebolla:       { name: 'Cebolla',       type: 'ingredient', icon: '🧅',
                   note: 'Colorada, para curtir. Llora quien la corta.' },
  limon:         { name: 'Limón',         type: 'ingredient', icon: '🍋',
                   note: 'Sutil y ácido. Cocina sin fuego.' },
  maiz:          { name: 'Choclo',        type: 'ingredient', icon: '🌽',
                   note: 'Maíz tierno de la sierra. Dulce cuando quiere.' },
  papa:          { name: 'Papa',          type: 'ingredient', icon: '🥔',
                   note: 'De páramo. Hay más variedades que apellidos.' },
  leche:         { name: 'Leche',         type: 'ingredient', icon: '🥛',
                   note: 'De la hacienda o del cartón, según la casa.' },
  zapallo:       { name: 'Zapallo',       type: 'ingredient', icon: '🎃',
                   note: 'Dulce y enorme. Uno solo alcanza para todos los vecinos.' },
  granos_mixtos: { name: 'Granos mixtos', type: 'ingredient', icon: '🫘',
                   note: 'Doce granos, o los que haya. La Semana Santa los junta.' },
  bacalao:       { name: 'Bacalao',       type: 'ingredient', icon: '🐠',
                   note: 'Salado y viajero. Llega una sola vez al año, y se nota.' },
  hoja:          { name: 'Hoja',          type: 'ingredient', icon: '🍃',
                   note: 'De choclo o de achira. Envuelve, perfuma y guarda.' },

  /* Utensilios */
  pilon:    { name: 'Pilón',    type: 'tool', icon: '🪨',
              note: 'Madera gastada por generaciones de majar. Suena a casa.' },
  olla:     { name: 'Olla',     type: 'tool', icon: '🍲',
              note: 'Donde las cosas empiezan a ser comida.' },
  sarten:   { name: 'Sartén',   type: 'tool', icon: '🍳',
              note: 'Curada con uso. No se lava con jabón y no se presta.' },
  tabla:    { name: 'Tabla',    type: 'tool', icon: '🪵',
              note: 'Marcada de cortes viejos. Cada cicatriz fue un almuerzo.' },

  /* Técnicas */
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

  /* Preparaciones */
  verde_cocido:     { name: 'Verde cocido',        type: 'prep', icon: '🥘' },
  verde_majado:     { name: 'Verde majado',        type: 'prep', icon: '🥣' },
  masa_bolon:       { name: 'Masa de bolón',       type: 'prep', icon: '🫓' },
  curtido:          { name: 'Curtido',             type: 'prep', icon: '🥗' },
  yuca_cocida:      { name: 'Yuca cocida',         type: 'prep', icon: '🍚' },
  caldo_pescado:    { name: 'Caldo de pescado',    type: 'prep', icon: '🍥' },
  base_encebollado: { name: 'Base de encebollado', type: 'prep', icon: '🥘' },
  maiz_preparado:   { name: 'Choclo molido',       type: 'prep', icon: '🌾' },
  mezcla_humita:    { name: 'Mezcla de humita',    type: 'prep', icon: '🥧' },
  humita_envuelta:  { name: 'Humita envuelta',     type: 'prep', icon: '🍙' },
  papa_cocida:      { name: 'Papa cocida',         type: 'prep', icon: '🥚' },
  masa_llapingacho: { name: 'Masa de llapingacho', type: 'prep', icon: '🫓' },
  base_espesa:      { name: 'Base espesa',         type: 'prep', icon: '🍯' },
  crema_base:       { name: 'Crema base',          type: 'prep', icon: '🍶' },
  base_fanesca:     { name: 'Base de fanesca',     type: 'prep', icon: '🎃' },

  /* Platos */
  bolon:       { name: 'Bolón de verde', type: 'dish', icon: '🥟' },
  bolon_mixto: { name: 'Bolón mixto',    type: 'dish', icon: '🍢', variant: true },
  encebollado: { name: 'Encebollado',    type: 'dish', icon: '🍜' },
  humita:      { name: 'Humita',         type: 'dish', icon: '🫔' },
  llapingacho: { name: 'Llapingacho',    type: 'dish', icon: '🥞' },
  fanesca:     { name: 'Fanesca',        type: 'dish', icon: '🍲', meta: true },
};

/* ---------- Cuadernos ----------
   Cada cuaderno es una receta emblemática de una ciudad.
   steps: secuencia narrativa. `a` se muestra como pista;
   `b` queda oculto hasta descubrirlo o revelarlo.
   `line`: la frase manuscrita que aparece al completar el paso.
   `variant: true`: paso opcional, no bloquea el plato.
   grants: lo que la caserita te fía al comprar el cuaderno. */
const CUADERNOS = {
  bolon: {
    dish: 'bolon',
    title: 'El cuaderno del bolón',
    city: 'Guayaquil', region: 'Costa',
    cost: 0,
    cover: '#7d9b76',
    blurb: 'el desayuno de la abuela',
    intro: 'La primera página huele a domingo. Alguien anotó este desayuno con prisa y cariño, y el tiempo le borró la mitad.',
    grants: ['verde', 'olla', 'pilon', 'queso', 'sarten'],
    steps: [
      { a: 'verde',        b: 'olla',       result: 'verde_cocido', tech: 'hervir',
        line: 'El verde, aún terco, se rinde en agua hirviendo.' },
      { a: 'verde_cocido', b: 'pilon',      result: 'verde_majado', tech: 'majar',
        line: 'Golpe a golpe en el pilón, sin deshacerlo.' },
      { a: 'verde_majado', b: 'queso',      result: 'masa_bolon',   tech: 'mezclar',
        line: 'Con queso desmenuzado, se amasa a mano.' },
      { a: 'masa_bolon',   b: 'sarten',     result: 'bolon',        tech: 'dorar',
        line: 'Una bola dorada en la sartén. Así amanece Guayaquil.' },
      { a: 'masa_bolon',   b: 'chicharron', result: 'bolon_mixto',  variant: true,
        line: 'Y si hay chicharrón de la lona, mejor todavía.' },
    ],
  },

  encebollado: {
    dish: 'encebollado',
    title: 'El levantamuertos',
    city: 'Guayaquil', region: 'Puerto',
    cost: 6,
    cover: '#4d5f80',
    blurb: 'para amanecer el puerto',
    intro: 'Estas páginas saben a madrugada de puerto. La receta está regada en pedazos, como después de una noche larga.',
    grants: ['cebolla', 'limon', 'yuca', 'pescado'],
    steps: [
      { a: 'cebolla',          b: 'limon',       result: 'curtido', tech: 'curtir',
        line: 'La cebolla se curte en limón mientras todo lo demás hierve.' },
      { a: 'yuca',             b: 'olla',        result: 'yuca_cocida',
        line: 'La yuca, paciente, se ablanda sin quejarse.' },
      { a: 'pescado',          b: 'olla',        result: 'caldo_pescado',
        line: 'La albacora suelta el mar entero en la olla.' },
      { a: 'caldo_pescado',    b: 'yuca_cocida', result: 'base_encebollado', tech: 'mezclar',
        line: 'Caldo y yuca se encuentran sin apuro.' },
      { a: 'base_encebollado', b: 'curtido',     result: 'encebollado',
        line: 'Corona de curtido. Levanta hasta muertos.' },
    ],
  },

  humita: {
    dish: 'humita',
    title: 'Tardes de choclo',
    city: 'Cuenca', region: 'Sierra',
    cost: 6,
    cover: '#c17a58',
    blurb: 'huele a domingo en la sierra',
    intro: 'Un cuaderno de letra fina, con manchas de café. Las humitas de esta casa se envolvían entre tres generaciones.',
    grants: ['maiz', 'tabla', 'hoja'],
    steps: [
      { a: 'maiz',            b: 'tabla', result: 'maiz_preparado', tech: 'mezclar',
        line: 'El choclo se desgrana y se muele sobre la tabla.' },
      { a: 'maiz_preparado',  b: 'queso', result: 'mezcla_humita',
        line: 'Con queso, la mezcla ya huele a media tarde.' },
      { a: 'mezcla_humita',   b: 'hoja',  result: 'humita_envuelta', tech: 'envolver',
        line: 'Su propia hoja la envuelve y le guarda el secreto.' },
      { a: 'humita_envuelta', b: 'olla',  result: 'humita', tech: 'hervir',
        line: 'Al vapor, sin apuro. Con café, mejor.' },
    ],
  },

  llapingacho: {
    dish: 'llapingacho',
    title: 'La plancha de Ambato',
    city: 'Ambato', region: 'Sierra',
    cost: 6,
    cover: '#8a7090',
    blurb: 'doraditas, con corazón de queso',
    intro: 'Páginas brillosas de manteca. Quien escribió esto atendía una plancha en el mercado y no tenía tiempo de terminar frases.',
    grants: ['papa'],
    steps: [
      { a: 'papa',             b: 'olla',   result: 'papa_cocida', tech: 'hervir',
        line: 'La papa del páramo se cocina dócil.' },
      { a: 'papa_cocida',      b: 'queso',  result: 'masa_llapingacho', tech: 'majar',
        line: 'Se maja con queso y se forman tortillas a mano.' },
      { a: 'masa_llapingacho', b: 'sarten', result: 'llapingacho', tech: 'dorar',
        line: 'En la plancha hasta que doren y canten.' },
    ],
  },

  fanesca: {
    dish: 'fanesca',
    title: 'El cuaderno de Semana Santa',
    city: 'Quito', region: 'Sierra',
    cost: 9,
    cover: '#b0512f',
    blurb: 'doce granos, una vez al año',
    intro: 'El cuaderno más gastado de todos. Se abre una vez al año y toda la familia cabe en esta receta.',
    grants: ['granos_mixtos', 'leche', 'zapallo'],
    steps: [
      { a: 'granos_mixtos', b: 'olla',    result: 'base_espesa', tech: 'hervir',
        line: 'Los doce granos se rinden lentamente. Esto va para largo.' },
      { a: 'base_espesa',   b: 'leche',   result: 'crema_base', tech: 'mezclar',
        line: 'La leche redondea lo que los granos empezaron.' },
      { a: 'crema_base',    b: 'zapallo', result: 'base_fanesca',
        line: 'El zapallo la vuelve dorada y dulce.' },
      { a: 'base_fanesca',  b: 'bacalao', result: 'fanesca',
        line: 'Y el viajero salado la corona, una vez al año.',
        shopNote: 'El bacalao no viene con el cuaderno. Búscalo en la lona.' },
    ],
  },
};

/* Orden de los cuadernos en estantería y mercado. */
const CUADERNO_ORDER = ['bolon', 'encebollado', 'humita', 'llapingacho', 'fanesca'];

/* Ingredientes especiales que se venden sueltos en la lona. */
const SHOP_EXTRAS = [
  { id: 'chicharron', cost: 2, blurb: 'crocante de hoy, pa’l bolón mixto' },
  { id: 'bacalao',    cost: 3, blurb: 'llegó de lejos, caserita' },
];

/* ---------- Economía ---------- */
const REWARDS = { step: 2, technique: 1, dish: 6, dishVariant: 3, dishMeta: 10 };
const REVEAL_COST = 1;   /* revelar el ingrediente oculto del paso actual */
const INITIAL_COINS = 3;

/* ---------- Microcopy ---------- */
const MICROCOPY = {
  fail: [
    'Todavía no.',
    'Eso no es lo que dice la página.',
    'Casi. Mira el paso que sigue.',
    'La cocina pide paciencia.',
  ],
  known: 'Ese paso ya está escrito.',
  bought: 'En la lona siempre aparece algo útil.',
  noCoins: 'Faltan fichas. Los pasos completados premian.',
  allDone: 'El recetario respira completo. Por ahora.',
};
