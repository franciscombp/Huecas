/* ============================================================
   Huecas — saberes y sabores (v3)
   data.js — Todo el contenido del juego.
   Economía de inventario: los ingredientes se compran y se
   consumen al cocinar; los platos se venden. Los cuadernos
   registran lo descubierto y dan acertijos, no instrucciones.
   ============================================================ */

const TYPES = {
  ingredient: { label: 'Ingrediente' },
  tool:       { label: 'Utensilio' },
  technique:  { label: 'Técnica' },
  prep:       { label: 'Preparación' },
  dish:       { label: 'Plato' },
  junk:       { label: 'Mezcla' },
};

/* ---------- Nodos ----------
   price: costo en la lona (solo ingredientes).
   sell: lo que paga la caserita (platos y mezclas raras). */
const ITEMS = {
  /* Ingredientes */
  verde:         { name: 'Verde',         type: 'ingredient', price: 1,
                   note: 'Plátano macho, aún firme. En la costa, el día empieza aquí.' },
  queso:         { name: 'Queso',         type: 'ingredient', price: 1,
                   note: 'Fresco, de mesa o de hoja. Se asoma en casi todas las páginas.' },
  chicharron:    { name: 'Chicharrón',    type: 'ingredient', price: 2,
                   note: 'Crocante de cerdo. Un lujo de todos los días.' },
  pescado:       { name: 'Pescado',       type: 'ingredient', price: 2,
                   note: 'Albacora, picudo, lo que traiga la marea de madrugada.' },
  yuca:          { name: 'Yuca',          type: 'ingredient', price: 1,
                   note: 'Raíz paciente. No se apura y no perdona el apuro.' },
  cebolla:       { name: 'Cebolla',       type: 'ingredient', price: 1,
                   note: 'Colorada, para curtir. Llora quien la corta.' },
  limon:         { name: 'Limón',         type: 'ingredient', price: 1,
                   note: 'Sutil y ácido. Cocina sin fuego.' },
  maiz:          { name: 'Choclo',        type: 'ingredient', price: 1,
                   note: 'Maíz tierno de la sierra. Dulce cuando quiere.' },
  papa:          { name: 'Papa',          type: 'ingredient', price: 1,
                   note: 'De páramo. Hay más variedades que apellidos.' },
  leche:         { name: 'Leche',         type: 'ingredient', price: 1,
                   note: 'De la hacienda o del cartón, según la casa.' },
  zapallo:       { name: 'Zapallo',       type: 'ingredient', price: 2,
                   note: 'Dulce y enorme. Uno solo alcanza para todos los vecinos.' },
  granos_mixtos: { name: 'Granos mixtos', type: 'ingredient', price: 3,
                   note: 'Doce granos, o los que haya. La Semana Santa los junta.' },
  bacalao:       { name: 'Bacalao',       type: 'ingredient', price: 4,
                   note: 'Salado y viajero. Llega una sola vez al año, y se nota.' },
  hoja:          { name: 'Hoja',          type: 'ingredient', price: 1,
                   note: 'De choclo o de achira. Envuelve, perfuma y guarda.' },

  /* Utensilios (permanentes, no se consumen) */
  pilon:  { name: 'Pilón',  type: 'tool', note: 'Madera gastada por generaciones de majar.' },
  olla:   { name: 'Olla',   type: 'tool', note: 'Donde las cosas empiezan a ser comida.' },
  sarten: { name: 'Sartén', type: 'tool', note: 'Curada con uso. No se presta.' },
  tabla:  { name: 'Tabla',  type: 'tool', note: 'Cada cicatriz fue un almuerzo.' },

  /* Técnicas (saberes, se registran solas) */
  hervir:   { name: 'Hervir',   type: 'technique', note: 'El agua hace la mitad del trabajo.' },
  majar:    { name: 'Majar',    type: 'technique', note: 'Aplastar con ritmo, sin deshacer.' },
  curtir:   { name: 'Curtir',   type: 'technique', note: 'El ácido cocina en frío.' },
  envolver: { name: 'Envolver', type: 'technique', note: 'La hoja guarda el vapor y el secreto.' },
  dorar:    { name: 'Dorar',    type: 'technique', note: 'El fuego firma al final.' },
  mezclar:  { name: 'Mezclar',  type: 'technique', note: 'Unir sin apurar.' },

  /* Preparaciones (se consumen al usarlas) */
  verde_cocido:     { name: 'Verde cocido',        type: 'prep' },
  verde_majado:     { name: 'Verde majado',        type: 'prep' },
  masa_bolon:       { name: 'Masa de bolón',       type: 'prep' },
  curtido:          { name: 'Curtido',             type: 'prep' },
  yuca_cocida:      { name: 'Yuca cocida',         type: 'prep' },
  caldo_pescado:    { name: 'Caldo de pescado',    type: 'prep' },
  base_encebollado: { name: 'Base de encebollado', type: 'prep' },
  maiz_preparado:   { name: 'Choclo molido',       type: 'prep' },
  mezcla_humita:    { name: 'Mezcla de humita',    type: 'prep' },
  humita_envuelta:  { name: 'Humita envuelta',     type: 'prep' },
  papa_cocida:      { name: 'Papa cocida',         type: 'prep' },
  masa_llapingacho: { name: 'Masa de llapingacho', type: 'prep' },
  base_espesa:      { name: 'Base espesa',         type: 'prep' },
  crema_base:       { name: 'Crema base',          type: 'prep' },
  base_fanesca:     { name: 'Base de fanesca',     type: 'prep' },

  /* Platos (se venden) */
  bolon:       { name: 'Bolón de verde', type: 'dish', sell: 4 },
  bolon_mixto: { name: 'Bolón mixto',    type: 'dish', sell: 6, variant: true },
  encebollado: { name: 'Encebollado',    type: 'dish', sell: 8 },
  humita:      { name: 'Humita',         type: 'dish', sell: 6 },
  llapingacho: { name: 'Llapingacho',    type: 'dish', sell: 6 },
  fanesca:     { name: 'Fanesca',        type: 'dish', sell: 16, meta: true },

  /* Cuando una combinación sale mal */
  mezcla_rara: { name: 'Mezcla rara', type: 'junk', sell: 1,
                 note: 'Nadie sabe qué es. La caserita la compra para las gallinas.' },
};

/* ---------- Cuadernos ----------
   steps: cada paso tiene un acertijo (`hint`) en vez de
   instrucción; `line` es la frase que queda escrita al lograrlo.
   grants: primera canasta de regalo al comprar el cuaderno. */
const CUADERNOS = {
  bolon: {
    dish: 'bolon',
    title: 'El cuaderno del bolón',
    city: 'Guayaquil', region: 'Costa',
    cost: 0,
    accent: '#9dbd8a',
    blurb: 'el desayuno de la abuela',
    intro: 'La primera página huele a domingo. Alguien anotó este desayuno con prisa y cariño, y el tiempo le borró la mitad.',
    grants: ['olla', 'pilon', 'sarten', 'verde', 'verde', 'queso', 'queso'],
    steps: [
      { a: 'verde',        b: 'olla',       result: 'verde_cocido', tech: 'hervir',
        hint: 'Lo que el racimo dio, el agua caliente lo ablanda.',
        line: 'El verde, aún terco, se rinde en agua hirviendo.' },
      { a: 'verde_cocido', b: 'pilon',      result: 'verde_majado', tech: 'majar',
        hint: 'Ya blando, pide golpes de madera vieja.',
        line: 'Golpe a golpe en el pilón, sin deshacerlo.' },
      { a: 'verde_majado', b: 'queso',      result: 'masa_bolon',   tech: 'mezclar',
        hint: 'Al majado le falta un compañero blanco y salado.',
        line: 'Con queso desmenuzado, se amasa a mano.' },
      { a: 'masa_bolon',   b: 'sarten',     result: 'bolon',        tech: 'dorar',
        hint: 'La bola quiere fuego que la dore.',
        line: 'Una bola dorada en la sartén. Así amanece Guayaquil.' },
      { a: 'masa_bolon',   b: 'chicharron', result: 'bolon_mixto',  variant: true,
        hint: 'Hay quien le esconde cerdo crocante adentro.',
        line: 'Y con chicharrón de la lona, mejor todavía.' },
    ],
  },

  encebollado: {
    dish: 'encebollado',
    title: 'El levantamuertos',
    city: 'Guayaquil', region: 'Puerto',
    cost: 8,
    accent: '#93a7c4',
    blurb: 'para amanecer el puerto',
    intro: 'Estas páginas saben a madrugada de puerto. La receta está regada en pedazos, como después de una noche larga.',
    grants: ['cebolla', 'limon', 'yuca', 'pescado'],
    steps: [
      { a: 'cebolla',          b: 'limon',       result: 'curtido', tech: 'curtir',
        hint: 'La colorada llora hasta que el ácido la calma.',
        line: 'La cebolla se curte en limón mientras todo lo demás hierve.' },
      { a: 'yuca',             b: 'olla',        result: 'yuca_cocida',
        hint: 'La raíz paciente, al agua.',
        line: 'La yuca, paciente, se ablanda sin quejarse.' },
      { a: 'pescado',          b: 'olla',        result: 'caldo_pescado',
        hint: 'El mar entero cabe en una olla.',
        line: 'La albacora suelta el mar entero en la olla.' },
      { a: 'caldo_pescado',    b: 'yuca_cocida', result: 'base_encebollado', tech: 'mezclar',
        hint: 'Junta lo que salió del mar con lo que salió de la tierra.',
        line: 'Caldo y yuca se encuentran sin apuro.' },
      { a: 'base_encebollado', b: 'curtido',     result: 'encebollado',
        hint: 'Corónalo con lo que dejaste curtiendo.',
        line: 'Corona de curtido. Levanta hasta muertos.' },
    ],
  },

  humita: {
    dish: 'humita',
    title: 'Tardes de choclo',
    city: 'Cuenca', region: 'Sierra',
    cost: 8,
    accent: '#e0b45c',
    blurb: 'huele a domingo en la sierra',
    intro: 'Un cuaderno de letra fina, con manchas de café. Las humitas de esta casa se envolvían entre tres generaciones.',
    grants: ['tabla', 'maiz', 'hoja'],
    steps: [
      { a: 'maiz',            b: 'tabla', result: 'maiz_preparado', tech: 'mezclar',
        hint: 'El dulce de la sierra se muele donde marcan los cuchillos viejos.',
        line: 'El choclo se desgrana y se muele sobre la tabla.' },
      { a: 'maiz_preparado',  b: 'queso', result: 'mezcla_humita',
        hint: 'Lo dulce molido busca lo blanco y salado.',
        line: 'Con queso, la mezcla ya huele a media tarde.' },
      { a: 'mezcla_humita',   b: 'hoja',  result: 'humita_envuelta', tech: 'envolver',
        hint: 'Se viste con su propia ropa.',
        line: 'Su propia hoja la envuelve y le guarda el secreto.' },
      { a: 'humita_envuelta', b: 'olla',  result: 'humita', tech: 'hervir',
        hint: 'Vapor y paciencia, nada más.',
        line: 'Al vapor, sin apuro. Con café, mejor.' },
    ],
  },

  llapingacho: {
    dish: 'llapingacho',
    title: 'La plancha de Ambato',
    city: 'Ambato', region: 'Sierra',
    cost: 8,
    accent: '#d9a0b0',
    blurb: 'doraditas, con corazón de queso',
    intro: 'Páginas brillosas de manteca. Quien escribió esto atendía una plancha en el mercado y no tenía tiempo de terminar frases.',
    grants: ['papa', 'papa'],
    steps: [
      { a: 'papa',             b: 'olla',   result: 'papa_cocida', tech: 'hervir',
        hint: 'La del páramo se ablanda en agua.',
        line: 'La papa del páramo se cocina dócil.' },
      { a: 'papa_cocida',      b: 'queso',  result: 'masa_llapingacho', tech: 'majar',
        hint: 'Májala con su amigo blanco de siempre.',
        line: 'Se maja con queso y se forman tortillas a mano.' },
      { a: 'masa_llapingacho', b: 'sarten', result: 'llapingacho', tech: 'dorar',
        hint: 'A la plancha hasta que cante.',
        line: 'En la plancha hasta que doren y canten.' },
    ],
  },

  fanesca: {
    dish: 'fanesca',
    title: 'El cuaderno de Semana Santa',
    city: 'Quito', region: 'Sierra',
    cost: 15,
    accent: '#c98a5b',
    blurb: 'doce granos, una vez al año',
    intro: 'El cuaderno más gastado de todos. Se abre una vez al año y toda la familia cabe en esta receta.',
    grants: ['granos_mixtos', 'leche', 'zapallo'],
    steps: [
      { a: 'granos_mixtos', b: 'olla',    result: 'base_espesa', tech: 'hervir',
        hint: 'Los doce se juntan en agua lenta.',
        line: 'Los doce granos se rinden lentamente. Esto va para largo.' },
      { a: 'base_espesa',   b: 'leche',   result: 'crema_base', tech: 'mezclar',
        hint: 'Suavízala con lo que da la vaca.',
        line: 'La leche redondea lo que los granos empezaron.' },
      { a: 'crema_base',    b: 'zapallo', result: 'base_fanesca',
        hint: 'Lo dorado y dulce del huerto la espesa.',
        line: 'El zapallo la vuelve dorada y dulce.' },
      { a: 'base_fanesca',  b: 'bacalao', result: 'fanesca',
        hint: 'Falta el viajero salado. Búscalo en la lona.',
        line: 'Y el viajero salado la corona, una vez al año.' },
    ],
  },
};

const CUADERNO_ORDER = ['bolon', 'encebollado', 'humita', 'llapingacho', 'fanesca'];

/* ---------- Economía ---------- */
const REWARDS = { step: 2, technique: 1, dish: 6, dishVariant: 4, dishMeta: 12 };
const REVEAL_COST = 2;   /* ver la combinación exacta de un paso */
const INITIAL_COINS = 10;
const RESCUE_COINS = 3;  /* la vecina ayuda si te quedas sin nada */

/* ---------- Microcopy ---------- */
const MICROCOPY = {
  junk: [
    'Eso no era. Quedó una mezcla rara.',
    'Mmm... mejor no probarla.',
    'La página no decía eso. Mezcla rara.',
    'A las gallinas les va a encantar.',
  ],
  crafted: 'Otra vez, de memoria.',
  bought: 'En la lona siempre aparece algo útil.',
  sold: 'La caserita paga sin regatear.',
  noCoins: 'Faltan fichas. Vende algo o descubre un paso.',
  rescue: 'La vecina dejó unas fichas en la puerta. Buena gente.',
  allDone: 'El recetario respira completo. Por ahora.',
  toolsClank: 'Dos utensilios solo hacen ruido.',
};
