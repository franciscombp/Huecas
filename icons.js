/* ============================================================
   Huecas — icons.js
   Set propio de ilustraciones chubby / flat minimalista
   (inspiración Tsuki Odyssey): formas redondas, pastel,
   caritas tiernas. Todo SVG inline, sin dependencias.
   ============================================================ */

const INK = '#4a4038';

const _svg = (inner) =>
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;

/* carita kawaii: ojos, sonrisa y chapetes */
function face(x = 32, y = 34, s = 1, mood = 'happy') {
  const mouth = mood === 'dizzy'
    ? `<path d="M-4 5 Q-2 3 0 5 Q2 7 4 5" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    : mood === 'sleepy'
      ? `<path d="M-3 5 H3" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      : `<path d="M-3 4 Q0 6.6 3 4" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  const eyes = mood === 'dizzy'
    ? `<path d="M-9 -2 L-5 2 M-5 -2 L-9 2 M5 -2 L9 2 M9 -2 L5 2" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`
    : mood === 'sleepy'
      ? `<path d="M-9.5 0 Q-7 2.2 -4.5 0 M4.5 0 Q7 2.2 9.5 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
      : `<circle cx="-7" cy="0" r="2.2" fill="${INK}"/><circle cx="7" cy="0" r="2.2" fill="${INK}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${eyes}${mouth}
    <ellipse cx="-11.5" cy="4" rx="3" ry="1.9" fill="#f2a48d" opacity=".5"/>
    <ellipse cx="11.5" cy="4" rx="3" ry="1.9" fill="#f2a48d" opacity=".5"/></g>`;
}

/* vapor: dos volutas suaves */
const steam = (x = 32, y = 14) =>
  `<g stroke="#c9bda7" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85">
     <path d="M${x - 6} ${y + 6} Q${x - 9} ${y + 1} ${x - 6} ${y - 3}"/>
     <path d="M${x + 6} ${y + 8} Q${x + 3} ${y + 3} ${x + 6} ${y - 1}"/></g>`;

/* tazón chubby con contenido */
function bowl(content, { steamOn = false, extra = '', bowlFill = '#f6eed9' } = {}) {
  return `${steamOn ? steam(32, 16) : ''}
    <ellipse cx="32" cy="30" rx="21" ry="7" fill="${content}"/>
    ${extra}
    <path d="M11 30 Q11 50 32 50 Q53 50 53 30 Z" fill="${bowlFill}"/>
    <path d="M11 30 Q11 50 32 50 Q53 50 53 30" fill="none" stroke="#e2d5ba" stroke-width="2"/>
    <ellipse cx="32" cy="52" rx="9" ry="2.5" fill="#e2d5ba"/>`;
}

/* pelotita con carita */
const ball = (fill, dots = '', mood = 'happy') =>
  `<circle cx="32" cy="34" r="19" fill="${fill}"/>${dots}${face(32, 34, 1, mood)}`;

const ICONS = {};

/* ============ Ingredientes ============ */

ICONS.verde = _svg(`
  <rect x="25" y="12" width="13" height="38" rx="6.5" fill="#8fae7e" transform="rotate(-16 32 50)"/>
  <rect x="25" y="12" width="13" height="38" rx="6.5" fill="#8fae7e" transform="rotate(16 32 50)"/>
  <rect x="25" y="9" width="13" height="42" rx="6.5" fill="#9dbd8a"/>
  <rect x="28" y="6" width="7" height="7" rx="2.5" fill="#6f8a5f"/>
  ${face(31.5, 32, .85)}`);

ICONS.queso = _svg(`
  <path d="M9 45 L29 15 Q32 11 35 15 L55 45 Q57 50 51 50 H13 Q7 50 9 45 Z" fill="#f2d29b"/>
  <circle cx="24" cy="40" r="3.4" fill="#e0b96f"/>
  <circle cx="41" cy="36" r="2.6" fill="#e0b96f"/>
  <circle cx="33" cy="45" r="2.2" fill="#e0b96f"/>
  ${face(32, 30, .8)}`);

ICONS.chicharron = _svg(`
  <path d="M12 37 Q10 24 22 25 Q27 25 30 30 Q32 24 40 24 Q52 24 51 34 Q51 44 40 43 Q34 42 32 37 Q29 43 21 43 Q13 43 12 37 Z" fill="#c98a5b"/>
  <path d="M18 31 Q22 28 26 31 M36 30 Q40 27 44 30" stroke="#a5744c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  ${face(32, 36, .72)}`);

ICONS.pescado = _svg(`
  <path d="M50 32 L60 24 Q62 32 60 40 Z" fill="#7e94b5"/>
  <ellipse cx="30" cy="32" rx="21" ry="14" fill="#93a7c4"/>
  <path d="M12 32 Q20 40 34 42 Q20 44 13 38 Z" fill="#7e94b5" opacity=".7"/>
  <path d="M26 20 Q32 14 36 20 Q32 23 26 20 Z" fill="#7e94b5"/>
  <circle cx="20" cy="30" r="2.3" fill="${INK}"/>
  <path d="M15 36 Q17 38 19 36" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="24" cy="37" rx="2.6" ry="1.7" fill="#f2a48d" opacity=".5"/>`);

ICONS.yuca = _svg(`
  <path d="M18 12 Q13 32 22 48 Q27 55 34 50 Q42 44 44 28 Q45 16 38 12 Q28 7 18 12 Z" fill="#a5744c"/>
  <path d="M22 18 Q20 32 26 44 M31 15 Q30 30 35 42" stroke="#8a6240" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="24" cy="12" rx="7" ry="4" fill="#e8dcc0" transform="rotate(-12 24 12)"/>`);

ICONS.cebolla = _svg(`
  <path d="M28 12 Q32 5 36 12" stroke="#8fae7e" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="32" cy="34" r="17" fill="#c093b4"/>
  <path d="M25 20 Q20 32 25 46 M39 20 Q44 32 39 46" stroke="#a97a9d" stroke-width="2" fill="none" stroke-linecap="round"/>
  ${face(32, 34, .82)}`);

ICONS.limon = _svg(`
  <ellipse cx="46" cy="16" rx="7" ry="3.8" fill="#8fae7e" transform="rotate(-24 46 16)"/>
  <circle cx="32" cy="36" r="16" fill="#cfd98a"/>
  <circle cx="32" cy="36" r="16" fill="none" stroke="#b9c470" stroke-width="2"/>
  ${face(32, 36, .8)}`);

ICONS.maiz = _svg(`
  <path d="M12 40 Q8 24 20 14 Q17 32 22 46 Q16 46 12 40 Z" fill="#8fae7e"/>
  <path d="M52 40 Q56 24 44 14 Q47 32 42 46 Q48 46 52 40 Z" fill="#8fae7e"/>
  <ellipse cx="32" cy="32" rx="12" ry="20" fill="#f2d06b"/>
  <g fill="#e3b84e">
    <circle cx="27" cy="20" r="2"/><circle cx="37" cy="20" r="2"/>
    <circle cx="25" cy="28" r="2"/><circle cx="32" cy="26" r="2"/><circle cx="39" cy="28" r="2"/>
    <circle cx="27" cy="44" r="2"/><circle cx="37" cy="44" r="2"/>
  </g>
  ${face(32, 35, .72)}`);

ICONS.papa = _svg(`
  <ellipse cx="32" cy="34" rx="19" ry="15" fill="#c9a06c" transform="rotate(-8 32 34)"/>
  <circle cx="20" cy="28" r="1.7" fill="#a5744c"/>
  <circle cx="44" cy="30" r="1.7" fill="#a5744c"/>
  <circle cx="38" cy="44" r="1.7" fill="#a5744c"/>
  ${face(31, 34, .85)}`);

ICONS.leche = _svg(`
  <rect x="24" y="10" width="16" height="9" rx="3" fill="#93a7c4"/>
  <path d="M23 19 H41 L44 28 V48 Q44 53 39 53 H25 Q20 53 20 48 V28 Z" fill="#fdfbf4" stroke="#e2d5ba" stroke-width="2"/>
  <rect x="20" y="33" width="24" height="9" fill="#dce6f0"/>
  ${face(32, 37.5, .62)}`);

ICONS.zapallo = _svg(`
  <rect x="29.5" y="8" width="5" height="9" rx="2.4" fill="#8a6240"/>
  <ellipse cx="18" cy="36" rx="11" ry="15" fill="#d99a4e"/>
  <ellipse cx="46" cy="36" rx="11" ry="15" fill="#d99a4e"/>
  <ellipse cx="32" cy="36" rx="12" ry="17" fill="#e0a45c"/>
  ${face(32, 36, .85)}`);

ICONS.granos_mixtos = _svg(`
  <path d="M18 24 Q14 18 20 16 H44 Q50 18 46 24 Q54 34 50 45 Q47 54 32 54 Q17 54 14 45 Q10 34 18 24 Z" fill="#e8d9b8"/>
  <path d="M20 16 Q32 22 44 16" stroke="#c9b891" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="24" cy="36" rx="3.4" ry="2.4" fill="#b98aae"/>
  <ellipse cx="34" cy="32" rx="3.4" ry="2.4" fill="#8fae7e"/>
  <ellipse cx="41" cy="39" rx="3.4" ry="2.4" fill="#e0a45c"/>
  <ellipse cx="29" cy="44" rx="3.4" ry="2.4" fill="#a5744c"/>
  <ellipse cx="38" cy="47" rx="3.4" ry="2.4" fill="#c98a5b"/>`);

ICONS.bacalao = _svg(`
  <path d="M8 32 Q8 22 20 20 L48 18 Q52 24 52 32 Q52 40 48 46 L20 44 Q8 42 8 32 Z" fill="#d9cdb8"/>
  <path d="M50 26 L60 20 Q61 32 60 44 L50 38" fill="#c9bda3"/>
  <path d="M20 24 L28 40 M28 24 L36 40 M36 23 L44 39" stroke="#c2b498" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M14 28 Q16.5 30 19 28" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <path d="M14 36 H19" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`);

ICONS.hoja = _svg(`
  <path d="M32 8 Q52 18 50 36 Q48 52 32 56 Q16 52 14 36 Q12 18 32 8 Z" fill="#9dbd8a"/>
  <path d="M32 12 V52 M32 24 Q24 26 20 32 M32 24 Q40 26 44 32 M32 38 Q26 40 23 44 M32 38 Q38 40 41 44" stroke="#7d9b76" stroke-width="2" fill="none" stroke-linecap="round"/>`);

/* ============ Utensilios ============ */

ICONS.pilon = _svg(`
  <rect x="38" y="6" width="8" height="26" rx="4" fill="#8a6240" transform="rotate(24 42 19)"/>
  <path d="M14 30 H50 Q50 46 42 50 H22 Q14 46 14 30 Z" fill="#b08a5f"/>
  <ellipse cx="32" cy="30" rx="18" ry="5" fill="#8a6240"/>
  <rect x="24" y="50" width="16" height="5" rx="2.5" fill="#8a6240"/>`);

ICONS.olla = _svg(`
  <ellipse cx="32" cy="20" rx="19" ry="5.5" fill="#8d867a"/>
  <rect x="28.5" y="11" width="7" height="6" rx="3" fill="#6b655b"/>
  <path d="M13 22 Q13 50 32 50 Q51 50 51 22 Q42 26 32 26 Q22 26 13 22 Z" fill="#7a7469"/>
  <rect x="5" y="24" width="9" height="5" rx="2.5" fill="#6b655b"/>
  <rect x="50" y="24" width="9" height="5" rx="2.5" fill="#6b655b"/>
  ${face(32, 38, .78)}`);

ICONS.sarten = _svg(`
  <rect x="42" y="27" width="19" height="7" rx="3.5" fill="#8a6240"/>
  <circle cx="26" cy="32" r="19" fill="#7a7469"/>
  <circle cx="26" cy="32" r="13" fill="#8d867a"/>
  ${face(26, 33, .68)}`);

ICONS.tabla = _svg(`
  <rect x="16" y="10" width="32" height="44" rx="10" fill="#c9a06c"/>
  <circle cx="32" cy="17" r="3.2" fill="#f6eed9"/>
  <path d="M22 28 H42 M22 36 H42 M22 44 H38" stroke="#b08a5f" stroke-width="2" stroke-linecap="round"/>`);

/* ============ Técnicas (glifos sobre pastilla pastel) ============ */

function glyph(bg, inner) {
  return _svg(`<circle cx="32" cy="32" r="22" fill="${bg}"/>${inner}`);
}
ICONS.hervir = glyph('#dce6f0',
  `<g stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round">
     <path d="M24 42 Q21 35 24 29 Q27 24 24 19"/>
     <path d="M33 44 Q30 37 33 31 Q36 26 33 21"/>
     <path d="M42 42 Q39 35 42 29 Q45 24 42 19"/></g>`);
ICONS.majar = glyph('#e8d9b8',
  `<rect x="36" y="14" width="7" height="20" rx="3.5" fill="${INK}" transform="rotate(26 39 24)"/>
   <path d="M20 34 H46 Q46 45 39 48 H27 Q20 45 20 34 Z" fill="${INK}" opacity=".85"/>`);
ICONS.curtir = glyph('#f2d9e0',
  `<rect x="22" y="14" width="20" height="7" rx="3" fill="${INK}" opacity=".85"/>
   <path d="M23 21 H41 Q46 30 44 40 Q43 48 32 48 Q21 48 20 40 Q18 30 23 21 Z" fill="none" stroke="${INK}" stroke-width="2.6"/>
   <path d="M24 34 H40 M26 40 H38" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
ICONS.envolver = glyph('#dfe8d5',
  `<path d="M18 32 Q18 20 32 20 Q46 20 46 32 Q46 44 32 44 Q18 44 18 32 Z" fill="none" stroke="${INK}" stroke-width="2.6"/>
   <path d="M26 20 V44 M38 20 V44" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`);
ICONS.dorar = glyph('#f6dfc0',
  `<path d="M32 14 Q40 24 38 32 Q44 30 44 38 Q44 48 32 48 Q20 48 20 38 Q20 28 27 24 Q25 19 32 14 Z" fill="#e0a45c" stroke="${INK}" stroke-width="2"/>`);
ICONS.mezclar = glyph('#e4ddf0',
  `<path d="M32 18 Q45 18 45 30 Q45 41 34 41 Q25 41 25 33 Q25 26 32 26 Q37 26 37 31" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`);

/* ============ Preparaciones ============ */

ICONS.verde_cocido    = _svg(bowl('#b9c78a', { steamOn: true }));
ICONS.verde_majado    = _svg(bowl('#a8b877', { extra: `<ellipse cx="32" cy="27" rx="12" ry="6" fill="#b9c78a"/>` }));
ICONS.masa_bolon      = _svg(ball('#b9c78a', `<circle cx="24" cy="26" r="1.8" fill="#a3b26a"/><circle cx="41" cy="30" r="1.8" fill="#a3b26a"/><circle cx="36" cy="45" r="1.8" fill="#a3b26a"/>`));
ICONS.curtido = _svg(`
  <rect x="22" y="10" width="20" height="7" rx="3" fill="#8d867a"/>
  <path d="M22 17 H42 Q48 28 46 40 Q45 52 32 52 Q19 52 18 40 Q16 28 22 17 Z" fill="#f6e8ec" stroke="#e2d5ba" stroke-width="2"/>
  <path d="M22 30 Q32 26 42 30 M21 38 Q32 34 43 38 M23 45 Q32 42 41 45" stroke="#d9a0b0" stroke-width="3" fill="none" stroke-linecap="round"/>`);
ICONS.yuca_cocida     = _svg(bowl('#efe6d2', { steamOn: true, extra: `<ellipse cx="26" cy="28" rx="5" ry="2.6" fill="#fdfbf4"/><ellipse cx="38" cy="29" rx="5" ry="2.6" fill="#fdfbf4"/>` }));
ICONS.caldo_pescado   = _svg(bowl('#e8c9a0', { steamOn: true, extra: `<path d="M38 24 L45 20 Q46 25 44 28 Z" fill="#93a7c4"/>` }));
ICONS.base_encebollado= _svg(bowl('#dfb98a', { steamOn: true, extra: `<ellipse cx="27" cy="28" rx="4" ry="2.2" fill="#efe6d2"/><ellipse cx="38" cy="29" rx="4" ry="2.2" fill="#c9a06c"/>` }));
ICONS.maiz_preparado  = _svg(bowl('#f2d06b', { extra: `<circle cx="27" cy="28" r="1.6" fill="#e3b84e"/><circle cx="36" cy="27" r="1.6" fill="#e3b84e"/><circle cx="32" cy="31" r="1.6" fill="#e3b84e"/>` }));
ICONS.mezcla_humita   = _svg(bowl('#f2dc9b', { extra: `<path d="M24 28 Q32 24 40 28" stroke="#e3c46e" stroke-width="2.4" fill="none" stroke-linecap="round"/>` }));
ICONS.humita_envuelta = _svg(`
  <path d="M14 32 Q14 20 32 20 Q50 20 50 32 Q50 44 32 44 Q14 44 14 32 Z" fill="#a8b877"/>
  <path d="M14 32 Q10 26 12 20 Q18 22 20 27 M50 32 Q54 26 52 20 Q46 22 44 27" fill="#8fae7e"/>
  <path d="M26 21 V43 M38 21 V43" stroke="#8fae7e" stroke-width="2.4" stroke-linecap="round"/>
  ${face(32, 32, .68)}`);
ICONS.papa_cocida     = _svg(`${steam(32, 14)}<ellipse cx="32" cy="36" rx="17" ry="13.5" fill="#e3cf9f"/>${face(32, 36, .8)}`);
ICONS.masa_llapingacho= _svg(`
  <ellipse cx="32" cy="42" rx="18" ry="8" fill="#d9c48e"/>
  <ellipse cx="32" cy="32" rx="15" ry="7.5" fill="#e3cf9f"/>
  ${face(32, 32, .62)}`);
ICONS.base_espesa     = _svg(bowl('#c9a06c', { steamOn: true }));
ICONS.crema_base      = _svg(bowl('#efe0c8', { extra: `<path d="M24 28 Q32 25 40 28" stroke="#e0cfa8" stroke-width="2.6" fill="none" stroke-linecap="round"/>` }));
ICONS.base_fanesca    = _svg(bowl('#e0b45c', { steamOn: true, extra: `<circle cx="26" cy="28" r="1.8" fill="#c98a5b"/><circle cx="37" cy="29" r="1.8" fill="#8fae7e"/>` }));

/* ============ Platos ============ */

ICONS.bolon = _svg(`${steam(32, 12)}
  ${ball('#c9b06a', `<circle cx="23" cy="25" r="2" fill="#a89052"/><circle cx="42" cy="28" r="2" fill="#a89052"/><circle cx="37" cy="46" r="2" fill="#a89052"/><circle cx="24" cy="43" r="2" fill="#a89052"/>`)}`);

ICONS.bolon_mixto = _svg(`${steam(32, 12)}
  ${ball('#c9a05e', `<ellipse cx="23" cy="26" rx="3" ry="2" fill="#a5744c"/><ellipse cx="42" cy="29" rx="3" ry="2" fill="#a5744c"/><ellipse cx="36" cy="46" rx="3" ry="2" fill="#a5744c"/>`)}`);

ICONS.encebollado = _svg(`${steam(32, 12)}
  <ellipse cx="32" cy="28" rx="21" ry="7" fill="#e8c9a0"/>
  <path d="M40 22 L48 17 Q49 23 46 26 Z" fill="#93a7c4"/>
  <path d="M20 24 Q24 20 28 24 M27 22 Q31 18 35 22" stroke="#d9a0b0" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M11 28 Q11 48 32 48 Q53 48 53 28 Z" fill="#f6eed9"/>
  <path d="M11 28 Q11 48 32 48 Q53 48 53 28" fill="none" stroke="#e2d5ba" stroke-width="2"/>
  <ellipse cx="32" cy="50" rx="9" ry="2.5" fill="#e2d5ba"/>
  ${face(32, 38, .72)}`);

ICONS.humita = _svg(`
  <path d="M12 36 Q6 28 10 16 Q20 18 23 27 Z" fill="#9dbd8a"/>
  <path d="M52 36 Q58 28 54 16 Q44 18 41 27 Z" fill="#9dbd8a"/>
  <path d="M15 34 Q15 22 32 22 Q49 22 49 34 Q49 47 32 47 Q15 47 15 34 Z" fill="#f2d06b"/>
  <path d="M15 34 Q15 46 32 46" fill="none" stroke="#e3b84e" stroke-width="2"/>
  ${face(32, 34, .78)}`);

ICONS.llapingacho = _svg(`${steam(32, 12)}
  <ellipse cx="32" cy="44" rx="19" ry="8.5" fill="#d3a457"/>
  <ellipse cx="32" cy="43" rx="19" ry="8" fill="#e0b45c"/>
  <ellipse cx="32" cy="32" rx="15.5" ry="7.5" fill="#e8c684"/>
  <ellipse cx="32" cy="27.5" rx="8" ry="2.6" fill="#f6e2b0"/>
  ${face(32, 33, .66)}`);

ICONS.fanesca = _svg(`${steam(32, 10)}
  <ellipse cx="32" cy="26" rx="22" ry="7.5" fill="#e0b45c"/>
  <circle cx="22" cy="24" r="2.2" fill="#8fae7e"/>
  <circle cx="32" cy="26" r="2.2" fill="#c98a5b"/>
  <circle cx="42" cy="24" r="2.2" fill="#b98aae"/>
  <ellipse cx="36" cy="22" rx="4.5" ry="2" fill="#efe6d2"/>
  <path d="M9 26 Q9 50 32 50 Q55 50 55 26 Z" fill="#f6eed9"/>
  <path d="M9 26 Q9 50 32 50 Q55 50 55 26" fill="none" stroke="#e2d5ba" stroke-width="2"/>
  <ellipse cx="32" cy="52" rx="10" ry="2.5" fill="#e2d5ba"/>
  ${face(32, 38, .78)}`);

/* ============ Otros ============ */

ICONS.mezcla_rara = _svg(`
  <path d="M14 38 Q10 26 20 22 Q22 14 32 16 Q42 12 46 22 Q56 26 50 38 Q54 48 42 50 Q36 54 28 50 Q16 52 14 38 Z" fill="#9aa88f"/>
  <circle cx="22" cy="24" r="3" fill="#b3bfa6"/>
  <circle cx="44" cy="42" r="2.4" fill="#b3bfa6"/>
  <circle cx="40" cy="18" r="2" fill="#b3bfa6"/>
  ${face(32, 34, .9, 'dizzy')}`);

ICONS.ficha = _svg(`
  <circle cx="32" cy="32" r="17" fill="#e6c37a"/>
  <circle cx="32" cy="32" r="11.5" fill="none" stroke="#c9a052" stroke-width="2.4"/>
  <circle cx="32" cy="32" r="4" fill="#c9a052"/>`);

ICONS.cuaderno = _svg(`
  <rect x="14" y="10" width="36" height="44" rx="6" fill="#c9a06c"/>
  <rect x="14" y="10" width="8" height="44" rx="4" fill="#a5744c"/>
  <rect x="28" y="24" width="18" height="3.4" rx="1.7" fill="#f6eed9" opacity=".85"/>
  <rect x="28" y="32" width="14" height="3.4" rx="1.7" fill="#f6eed9" opacity=".6"/>
  ${face(35, 44, .55)}`);

/* iconos de pestañas */
ICONS.tab_libros = _svg(`
  <rect x="12" y="14" width="12" height="38" rx="3" fill="#9dbd8a"/>
  <rect x="26" y="10" width="12" height="42" rx="3" fill="#d9a0b0"/>
  <rect x="40" y="17" width="12" height="35" rx="3" fill="#93a7c4"/>`);
ICONS.tab_cocina = ICONS.olla;
ICONS.tab_mercado = _svg(`
  <path d="M14 26 H50 L46 50 Q45 54 40 54 H24 Q19 54 18 50 Z" fill="#c9a06c"/>
  <path d="M22 26 Q22 12 32 12 Q42 12 42 26" fill="none" stroke="#8a6240" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M22 34 H42 M24 42 H40" stroke="#b08a5f" stroke-width="2.4" stroke-linecap="round"/>`);

/* API pública */
function iconOf(id) {
  return ICONS[id] || ICONS.mezcla_rara;
}
