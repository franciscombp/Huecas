/* ============================================================
   Huecas — illus.js
   Ilustraciones de ESCENA (fondos) y definiciones de acuarela.
   Estética GDD §3: tinta precisa + acuarela suelta + luz cálida.
   Se cargan como SVG inline; el motor las coloca de fondo.
   ============================================================ */

const INKD = '#3a352d';

/* Escena de cocina de la abuela: una ventana con luz de mañana,
   repisa con frascos, sartén colgada, azulejos. Va MUY suave de
   fondo (memoria de una cocina sobre la página). */
const SCENE_COCINA = `
<svg viewBox="0 0 390 620" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="sun" cx="78%" cy="16%" r="60%">
      <stop offset="0%" stop-color="#ffeab0" stop-opacity=".92"/>
      <stop offset="55%" stop-color="#f6d38a" stop-opacity=".28"/>
      <stop offset="100%" stop-color="#f6d38a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4e7cf"/>
      <stop offset="60%" stop-color="#efdbbb"/>
      <stop offset="100%" stop-color="#e7cfa6"/>
    </linearGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c79a63"/>
      <stop offset="100%" stop-color="#a5764a"/>
    </linearGradient>
  </defs>

  <rect width="390" height="620" fill="url(#wall)"/>

  <!-- azulejos costeños suaves abajo -->
  <g opacity=".5" stroke="#d8b98a" stroke-width="1.4" fill="none">
    <path d="M0 470 H390 M0 520 H390 M0 570 H390"/>
    <path d="M50 470 V620 M130 470 V620 M210 470 V620 M290 470 V620 M370 470 V620"/>
  </g>
  <g opacity=".28" fill="#cf8f6a">
    <circle cx="90" cy="495" r="3"/><circle cx="250" cy="545" r="3"/><circle cx="330" cy="495" r="3"/>
  </g>

  <!-- ventana con luz de mañana -->
  <g transform="translate(250 40)">
    <rect x="-6" y="-6" width="132" height="150" rx="8" fill="#b98a5a"/>
    <rect x="0" y="0" width="120" height="138" rx="4" fill="#cfe6f0"/>
    <path d="M0 138 L120 0 L120 60 L60 138 Z" fill="#fff" opacity=".35"/>
    <path d="M0 100 L60 0 L100 0 L0 130 Z" fill="#fff" opacity=".25"/>
    <line x1="60" y1="0" x2="60" y2="138" stroke="#b98a5a" stroke-width="5"/>
    <line x1="0" y1="69" x2="120" y2="69" stroke="#b98a5a" stroke-width="5"/>
    <!-- macetita -->
    <rect x="76" y="118" width="26" height="20" rx="3" fill="#c96f52"/>
    <path d="M82 118 Q80 100 74 96 M89 118 Q89 98 89 92 M96 118 Q98 102 104 100" stroke="#7f9c62" stroke-width="3.4" fill="none" stroke-linecap="round"/>
  </g>
  <!-- rayo de luz cálida -->
  <ellipse cx="300" cy="120" rx="240" ry="240" fill="url(#sun)"/>

  <!-- repisa de madera con frascos -->
  <g transform="translate(18 250)">
    <rect x="-18" y="70" width="150" height="12" rx="3" fill="url(#wood)"/>
    <rect x="-18" y="82" width="150" height="5" fill="#8a6240" opacity=".6"/>
    <!-- frascos -->
    <g stroke="${INKD}" stroke-width="2" stroke-opacity=".35">
      <rect x="6" y="30" width="26" height="40" rx="5" fill="#e7d9bf"/>
      <rect x="6" y="42" width="26" height="28" rx="3" fill="#c58b57"/>
      <rect x="6" y="24" width="26" height="8" rx="3" fill="#a5744c"/>
      <rect x="44" y="22" width="28" height="48" rx="5" fill="#e7d9bf"/>
      <rect x="44" y="40" width="28" height="30" rx="3" fill="#8fae7e"/>
      <rect x="44" y="16" width="28" height="8" rx="3" fill="#a5744c"/>
      <rect x="84" y="34" width="24" height="36" rx="5" fill="#e7d9bf"/>
      <rect x="84" y="48" width="24" height="22" rx="3" fill="#d98f4e"/>
      <rect x="84" y="28" width="24" height="8" rx="3" fill="#a5744c"/>
    </g>
  </g>

  <!-- sartén y cucharón colgados -->
  <g transform="translate(150 30)" stroke="${INKD}" stroke-width="2.4" stroke-opacity=".4" fill="none">
    <line x1="20" y1="0" x2="20" y2="34"/>
    <circle cx="20" cy="56" r="22" fill="#b6b1a6" stroke-opacity=".5"/>
    <line x1="42" y1="46" x2="66" y2="40" stroke-width="4"/>
    <line x1="-16" y1="0" x2="-16" y2="30"/>
    <ellipse cx="-16" cy="44" rx="11" ry="15" fill="#c79a63" stroke-opacity=".5"/>
    <line x1="-16" y1="59" x2="-16" y2="86" stroke-width="4"/>
  </g>
</svg>`;

/* filtro de acuarela reutilizable para íconos: leve desplazamiento
   orgánico + textura, para que no se vea vectorial-plano. */
const ILLUS_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="ink-edge" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1"/>
  </filter>
  <filter id="soft-drop" x="-30%" y="-30%" width="160%" height="170%">
    <feDropShadow dx="0" dy="2.2" stdDeviation="1.6" flood-color="#5a4a33" flood-opacity="0.28"/>
  </filter>
  <filter id="paper-grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="g"/>
    <feColorMatrix in="g" values="0 0 0 0 0.42  0 0 0 0 0.34  0 0 0 0 0.2  0 0 0 0.045 0"/>
    <feComposite operator="over" in2="SourceGraphic"/>
  </filter>
</svg>`;
