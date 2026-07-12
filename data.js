/* ============================================================
   Huecas — saberes y sabores (v4)
   data.js — Todo el contenido y las reglas del juego.

   CÓMO CRECE EL JUEGO (sin tocar app.js):
   - Un objeto nuevo → entrada en ITEMS (+ icono en icons.js).
   - Un plato nuevo  → cuaderno en CUADERNOS + CUADERNO_ORDER.
   - Una condición nueva (invento, fallo explícito, etc.)
     → una fila en RULES. El motor resuelve en este orden:
     paso canon → regla → bloqueo de terminados → mezcla rara.
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
   price: costo en la lona (ingredientes y utensilios comprables).
   sell: lo que pagan por él (platos y mezclas; 0 = ni los chanchitos).
   wear/sharpenCost: desgaste de utensilios (cuchillo).
   creative: plato inventado, no pertenece a ningún cuaderno. */
const ITEMS = {
  /* Ingredientes */
  verde:         { name: 'Verde',         type: 'ingredient', price: 1,
                   note: 'Plátano macho, aún firme. En la costa, el día empieza aquí.' },
  queso:         { name: 'Queso',         type: 'ingredient', price: 1,
                   note: 'Fresco, de mesa o de hoja.' },
  chicharron:    { name: 'Chicharrón',    type: 'ingredient', price: 2,
                   note: 'Crocante de cerdo. Un lujo de todos los días.' },
  pescado:       { name: 'Pescado',       type: 'ingredient', price: 2,
                   note: 'Albacora entera, como llega del muelle.' },
  yuca:          { name: 'Yuca',          type: 'ingredient', price: 1,
                   note: 'Raíz paciente. No perdona el apuro.' },
  cebolla:       { name: 'Cebolla',       type: 'ingredient', price: 1,
                   note: 'Colorada, para curtir.' },
  limon:         { name: 'Limón',         type: 'ingredient', price: 1,
                   note: 'Sutil y ácido. Cocina sin fuego.' },
  maiz:          { name: 'Choclo',        type: 'ingredient', price: 1,
                   note: 'Maíz tierno de la sierra.' },
  papa:          { name: 'Papa',          type: 'ingredient', price: 1,
                   note: 'De páramo. Más variedades que apellidos.' },
  leche:         { name: 'Leche',         type: 'ingredient', price: 1,
                   note: 'De la hacienda o del cartón.' },
  zapallo:       { name: 'Zapallo',       type: 'ingredient', price: 2,
                   note: 'Dulce y enorme.' },
  granos_mixtos: { name: 'Granos mixtos', type: 'ingredient', price: 3,
                   note: 'Doce granos, o los que haya.' },
  bacalao:       { name: 'Bacalao',       type: 'ingredient', price: 4,
                   note: 'Salado y viajero. Llega una vez al año.' },
  hoja:          { name: 'Hoja',          type: 'ingredient', price: 1,
                   note: 'De choclo o de achira. Envuelve y perfuma.' },

  /* Utensilios */
  cuchillo: { name: 'Cuchillo', type: 'tool', wear: 6, sharpenCost: 2,
              note: 'Corta y pela. Se desafila con el uso; el afilador pasa por la lona.' },
  pilon:    { name: 'Pilón',    type: 'tool', note: 'Madera gastada por generaciones de majar.' },
  olla:     { name: 'Olla',     type: 'tool', note: 'Donde las cosas empiezan a ser comida.' },
  sarten:   { name: 'Sartén',   type: 'tool', note: 'Curada con uso. No se presta.' },
  molino:   { name: 'Molino',   type: 'tool', price: 6, buyable: true,
              note: 'De manivela, pesado y fiel. Muele choclo como ninguno.' },

  /* Técnicas */
  pelar:    { name: 'Pelar',    type: 'technique', note: 'Quitar lo que sobra sin llevarse lo que importa.' },
  limpiar:  { name: 'Limpiar',  type: 'technique', note: 'Escamar, quitar piel y espinas. Se hace con calma y buen filo.' },
  hervir:   { name: 'Hervir',   type: 'technique', note: 'El agua hace la mitad del trabajo.' },
  majar:    { name: 'Majar',    type: 'technique', note: 'Aplastar con ritmo, sin deshacer.' },
  curtir:   { name: 'Curtir',   type: 'technique', note: 'El ácido cocina en frío.' },
  envolver: { name: 'Envolver', type: 'technique', note: 'La hoja guarda el vapor y el secreto.' },
  dorar:    { name: 'Dorar',    type: 'technique', note: 'El fuego firma al final.' },
  mezclar:  { name: 'Mezclar',  type: 'technique', note: 'Unir sin apurar.' },
  moler:    { name: 'Moler',    type: 'technique', note: 'Vuelta a vuelta, el grano se rinde.' },

  /* Preparaciones */
  verde_pelado:     { name: 'Verde pelado',        type: 'prep' },
  verde_cocido:     { name: 'Verde cocido',        type: 'prep' },
  verde_majado:     { name: 'Verde majado',        type: 'prep' },
  masa_bolon:       { name: 'Masa de bolón',       type: 'prep' },
  curtido:          { name: 'Curtido',             type: 'prep' },
  pescado_limpio:   { name: 'Pescado limpio',      type: 'prep' },
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

  /* Platos */
  bolon:       { name: 'Bolón de verde', type: 'dish', sell: 4 },
  bolon_mixto: { name: 'Bolón mixto',    type: 'dish', sell: 6, variant: true },
  encebollado: { name: 'Encebollado',    type: 'dish', sell: 8 },
  humita:      { name: 'Humita',         type: 'dish', sell: 6 },
  llapingacho: { name: 'Llapingacho',    type: 'dish', sell: 6 },
  fanesca:     { name: 'Fanesca',        type: 'dish', sell: 16, meta: true },

  /* Inventos de la casa (nacen de RULES creativas) */
  bolon_doble_queso: { name: 'Bolón doble queso', type: 'dish', sell: 5, creative: true,
                       note: 'No es lo estándar, pero nadie lo devuelve.' },
  humita_con_queso:  { name: 'Humita extra queso', type: 'dish', sell: 7, creative: true,
                       note: 'Invento de la casa. La clientela repite.' },

  /* Mezclas y desastres */
  mezcla_rara:     { name: 'Mezcla rara',     type: 'junk', sell: 1,
                     note: 'Nadie sabe qué es. La caserita la compra para los chanchitos.' },
  verde_amargo:    { name: 'Verde amargo',    type: 'junk', sell: 0,
                     note: 'Cocido con cáscara. Ni los chanchitos lo quieren.' },
  leche_cortada:   { name: 'Leche cortada',   type: 'junk', sell: 0,
                     note: 'El ácido la cortó al instante. A botar.' },
  hoja_chamuscada: { name: 'Hoja chamuscada', type: 'junk', sell: 0,
                     note: 'Humo y ceniza. Ni para envolver recuerdos.' },
};

/* ---------- Reglas extra (LA base administrable) ----------
   kind: 'fail' → error explícito con resultado y mensaje propios.
         'creative' → invento vendible fuera del recetario.
   Los insumos no-utensilio SIEMPRE se consumen al disparar una regla. */
const RULES = [
  { a: 'verde', b: 'olla', kind: 'fail', result: 'verde_amargo',
    msg: 'Se coció con cáscara: amargó y manchó la olla. Primero se pela.' },
  { a: 'verde', b: 'sarten', kind: 'fail', result: 'verde_amargo',
    msg: 'Con cáscara y a fuego vivo: quemado por fuera, crudo por dentro.' },
  { a: 'verde', b: 'pilon', kind: 'fail', result: 'mezcla_rara',
    msg: 'Majar un verde crudo y con cáscara... el pilón casi se raja.' },
  { a: 'leche', b: 'limon', kind: 'fail', result: 'leche_cortada',
    msg: 'El ácido cortó la leche al instante.' },
  { a: 'hoja', b: 'sarten', kind: 'fail', result: 'hoja_chamuscada',
    msg: 'La hoja se chamuscó en dos segundos.' },
  { a: 'pescado', b: 'sarten', kind: 'fail', result: 'mezcla_rara',
    msg: 'Entero y sin limpiar a la plancha: espinas, escamas y humo.' },
  { a: 'queso', b: 'sarten', kind: 'fail', result: 'mezcla_rara',
    msg: 'El queso solo se derritió y se pegó. Qué desperdicio.' },

  { a: 'masa_bolon', b: 'queso', kind: 'creative', result: 'bolon_doble_queso',
    msg: 'Doble queso no es lo estándar… pero nadie se queja.' },
  { a: 'bolon', b: 'queso', kind: 'creative', result: 'bolon_doble_queso',
    msg: 'Relleno otra vez, recién hecho. Invento de la casa.' },
  { a: 'humita', b: 'queso', kind: 'creative', result: 'humita_con_queso',
    msg: 'Más queso a la humita. La sierra aprueba.' },
];

/* ---------- Cuadernos ---------- */
const CUADERNOS = {
  bolon: {
    dish: 'bolon',
    title: 'El cuaderno del bolón',
    city: 'Guayaquil', region: 'Costa',
    cost: 0,
    accent: '#9dbd8a',
    blurb: 'el desayuno de la abuela',
    intro: 'La primera página huele a domingo. Alguien anotó este desayuno con prisa y cariño, y el tiempo le borró la mitad.',
    grants: ['cuchillo', 'olla', 'pilon', 'sarten', 'verde', 'verde', 'queso', 'queso'],
    steps: [
      { a: 'verde',        b: 'cuchillo',   result: 'verde_pelado', tech: 'pelar',
        hint: 'Todo empieza quitándole la cáscara al verde.',
        line: 'Pela los verdes y córtalos en trozos.' },
      { a: 'verde_pelado', b: 'olla',       result: 'verde_cocido', tech: 'hervir',
        hint: 'Los trozos pelados necesitan ablandarse.',
        line: 'Cocínalos en agua con sal hasta que estén blandos.' },
      { a: 'verde_cocido', b: 'pilon',      result: 'verde_majado', tech: 'majar',
        hint: 'Aún caliente, se vuelve masa a golpes.',
        line: 'Maja el verde caliente hasta formar una masa.' },
      { a: 'verde_majado', b: 'queso',      result: 'masa_bolon',   tech: 'mezclar',
        hint: 'A la masa le falta lo blanco y salado.',
        line: 'Amasa el verde con queso rallado hasta integrar.' },
      { a: 'masa_bolon',   b: 'sarten',     result: 'bolon',        tech: 'dorar',
        hint: 'Forma la bola y dale calor.',
        line: 'Forma bolas y dóralas en la sartén con un poco de aceite.' },
      { a: 'masa_bolon',   b: 'chicharron', result: 'bolon_mixto',  variant: true,
        hint: 'Hay quien le esconde chicharrón adentro.',
        line: 'Rellena la masa con chicharrón antes de dorar.' },
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
        hint: 'La cebolla en pluma pide un baño ácido.',
        line: 'Corta la cebolla en pluma y cúrtela en limón con sal.' },
      { a: 'pescado',          b: 'cuchillo',    result: 'pescado_limpio', tech: 'limpiar',
        hint: 'El pescado llega entero; hay que limpiarlo.',
        line: 'Limpia el pescado: quítale escamas, piel y espinas.' },
      { a: 'yuca',             b: 'olla',        result: 'yuca_cocida',
        hint: 'La yuca va aparte, al agua.',
        line: 'Cocina la yuca en agua con sal hasta que esté tierna.' },
      { a: 'pescado_limpio',   b: 'olla',        result: 'caldo_pescado',
        hint: 'Del pescado limpio sale el caldo.',
        line: 'Hierve el pescado limpio con cebolla y especias para el caldo.' },
      { a: 'caldo_pescado',    b: 'yuca_cocida', result: 'base_encebollado', tech: 'mezclar',
        hint: 'Une el mar con la tierra.',
        line: 'Junta el caldo con la yuca y el pescado desmenuzado.' },
      { a: 'base_encebollado', b: 'curtido',     result: 'encebollado',
        hint: 'Corónalo con el curtido y a servir.',
        line: 'Sírvelo caliente y corónalo con el curtido de cebolla.' },
    ],
  },

  humita: {
    dish: 'humita',
    title: 'Tardes de choclo',
    city: 'Cuenca', region: 'Sierra',
    cost: 8,
    accent: '#e0b45c',
    blurb: 'huele a domingo en la sierra',
    intro: 'Un cuaderno de letra fina, con manchas de café. El molino de esta casa se vendió hace años; la lona tiene uno.',
    grants: ['maiz', 'maiz', 'hoja'],
    steps: [
      { a: 'maiz',            b: 'molino', result: 'maiz_preparado', tech: 'moler',
        hint: 'El choclo tierno pasa por la manivela.',
        shopNote: 'El molino se compra en la lona, sección utensilios.',
        line: 'Muele el choclo tierno hasta obtener una masa.' },
      { a: 'maiz_preparado',  b: 'queso',  result: 'mezcla_humita',
        hint: 'A la masa de choclo, queso.',
        line: 'Mezcla la masa de choclo con queso, manteca y un toque de sal.' },
      { a: 'mezcla_humita',   b: 'hoja',   result: 'humita_envuelta', tech: 'envolver',
        hint: 'Cada humita va en su hoja.',
        line: 'Coloca la mezcla en la hoja de choclo y envuélvela bien.' },
      { a: 'humita_envuelta', b: 'olla',   result: 'humita', tech: 'hervir',
        hint: 'Al vapor, con paciencia.',
        line: 'Cocina las humitas al vapor unos 40 minutos.' },
    ],
  },

  llapingacho: {
    dish: 'llapingacho',
    title: 'La plancha de Ambato',
    city: 'Ambato', region: 'Sierra',
    cost: 8,
    accent: '#d9a0b0',
    blurb: 'doraditas, con corazón de queso',
    intro: 'Páginas brillosas de manteca. Quien escribió esto atendía una plancha en el mercado y no terminaba las frases.',
    grants: ['papa', 'papa'],
    steps: [
      { a: 'papa',             b: 'olla',   result: 'papa_cocida', tech: 'hervir',
        hint: 'La papa, primero al agua.',
        line: 'Cocina las papas en agua con sal hasta que ablanden.' },
      { a: 'papa_cocida',      b: 'queso',  result: 'masa_llapingacho', tech: 'majar',
        hint: 'Papa y queso hacen la masa.',
        line: 'Maja las papas y mézclalas con queso para la masa.' },
      { a: 'masa_llapingacho', b: 'sarten', result: 'llapingacho', tech: 'dorar',
        hint: 'Forma tortillas y a la plancha.',
        line: 'Forma tortillas rellenas de queso y dóralas en la plancha.' },
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
        hint: 'Los doce granos, cocidos con paciencia.',
        line: 'Cocina los granos y júntalos en una base espesa.' },
      { a: 'base_espesa',   b: 'leche',   result: 'crema_base', tech: 'mezclar',
        hint: 'Suavízala con leche.',
        line: 'Agrega leche y crema hasta suavizar la base.' },
      { a: 'crema_base',    b: 'zapallo', result: 'base_fanesca',
        hint: 'El zapallo la espesa y endulza.',
        line: 'Incorpora el zapallo cocido para dar cuerpo y dulzor.' },
      { a: 'base_fanesca',  b: 'bacalao', result: 'fanesca',
        hint: 'Falta el bacalao remojado. Búscalo en la lona.',
        line: 'Añade el bacalao desalado y sirve con sus acompañantes.' },
    ],
  },
};

const CUADERNO_ORDER = ['bolon', 'encebollado', 'humita', 'llapingacho', 'fanesca'];

/* ---------- La hueca: clientes y arriendo ---------- */
const CLIENTES = [
  { name: 'Doña Rosa',      icon: 'cliente_rosa' },
  { name: 'Don Jacinto',    icon: 'cliente_jacinto' },
  { name: 'La wawa Emilia', icon: 'cliente_wawa' },
  { name: 'Aníbal, el chofer', icon: 'cliente_chofer' },
];

const HUECA = {
  startRating: 5, maxRating: 10,
  rentEvery: 5,        /* cada cuántos clientes pasa el dueño */
  rent: 15,            /* en sucres (miles) */
  tipMax: 2,           /* propina máxima */
  /* la presión escala con los platos que ya dominas:
     más clientes, menos paciencia */
  pressure: [
    { dishes: 1, min: 7, max: 10, patience: 90 },
    { dishes: 2, min: 5, max: 8,  patience: 75 },
    { dishes: 4, min: 4, max: 6,  patience: 60 },
  ],
};

/* La autoridad de salubridad: 3 clientes seguidos sin servir
   y viene a revisar. Sin comida lista → clausura. */
const SALUBRIDAD = { missLimit: 3 };

/* Metas de largo plazo: la hueca nunca "se acaba". */
const MILESTONES = [
  { served: 10, title: 'Hueca de barrio',      reward: 5,
    note: 'Ya te conocen en la cuadra. Los taxistas recomiendan.' },
  { served: 25, title: 'Hueca famosa',         reward: 10,
    note: 'Vienen desde el otro lado del río. Hay fila los domingos.' },
  { served: 50, title: 'Leyenda de la ciudad', reward: 20,
    note: 'Salió en el periódico. La abuela estaría orgullosa.' },
  { served: 100, title: 'Patrimonio del sabor', reward: 50,
    note: 'Cien platos servidos. Esto ya es historia nacional.' },
];

/* ---------- Economía ---------- */
const REWARDS = { step: 2, technique: 1, dish: 6, dishVariant: 4, dishMeta: 12, creative: 3 };
const REVEAL_COST = 2;
const INITIAL_COINS = 10;
const RESCUE_COINS = 3;

/* ---------- Microcopy ---------- */
const MICROCOPY = {
  junk: [
    'Eso no era. Quedó una mezcla rara.',
    'Mmm... mejor no probarla.',
    'La página no decía eso. Mezcla rara.',
  ],
  noCombo: [
    'Así no combinan. Prepáralos primero.',
    'Todavía no. Prueba cocinarlos o cortarlos antes.',
    'Estos dos no se llevan… por ahora.',
  ],
  keepOnMesa: 'Lo dejaste servido en la mesa. Sigue desde ahí.',
  crafted: 'Otra vez, de memoria.',
  bought: 'En la lona siempre aparece algo útil.',
  sold: 'La caserita paga sin regatear.',
  tossed: 'A la basura, sin pena.',
  noCoins: 'Faltan sucres. Vende algo o atiende la hueca.',
  rescue: 'La vecina dejó unos sucres en la puerta. Buena gente.',
  allDone: 'El recetario respira completo. La hueca sigue abierta.',
  toolsClank: 'Dos utensilios solo hacen ruido.',
  dullKnife: 'El cuchillo no corta ni mantequilla. El afilador está en la lona.',
  served: '¡Servido caliente! La hueca suena a cucharas.',
  missed: 'Se fue con hambre. Eso se comenta en el barrio…',
  salubridadPass: 'Revisaron todo. Había comida lista: te dejan seguir.',
  salubridadClose: 'Llegó salubridad y no había ni un plato listo. Clausurada.',
  calmOn: 'Modo tranquilo: cocina y descubre sin apuros.',
  calmOff: 'Modo servicio: la clientela vuelve a llegar.',
  firstDish: 'Recuperaste tu primer plato. Ahora la clientela empezará a llegar…',
};
