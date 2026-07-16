# Huecas — El recetario de la abuela

**MVP de validación (motor + 3 recetas)** según el Game Design Document 2.0.

Tu abuela Delfina ha enfermado y te encarga su hueca en el Ecuador de los 90,
junto con su cuaderno de recetas escrito **en acertijos** y dibujado a mano.
El mundo empieza en **boceto blanco y negro**: cada paso que descifras
cocinando le devuelve el **color** (acuarela) a ingredientes, técnicas y
páginas — plato por plato.

Jugable en: https://franciscombp.github.io/Huecas/

## Arquitectura del motor (GDD §2)

**Todo el contenido vive en datos, no en código.** `recetario.js` contiene
`GAME_DATA` (esquema JSON del GDD: recetas → pasos → acertijo/acción/resultado,
ingredientes con costo de mercado, tarjetas con texto cultural) y un *adapter*
(`buildRecetario`) que lo traduce a las estructuras del motor. Agregar la
receta #4 o #20 es **trabajo de contenido**, no de reingeniería.

| Archivo | Rol |
|---|---|
| `recetario.js` | CONTENIDO: GAME_DATA (JSON del GDD) + adapter agnóstico |
| `data.js` | Tablas del motor: reglas, percances, clientes, visitas, BEATS narrativos |
| `app.js` | Motor: combinación, boceto→color, cola, beats, mercado |
| `icons.js` | Ilustraciones chubby SVG inline |
| `index.html` / `styles.css` | Página de recetario editorial ilustrado |

## Los tres beats del MVP (GDD §5)

1. **La herencia** — la carta de Delfina → la receta del bolón (5 pasos
   realistas con acertijo) → cada paso pinta de color lo que tocas → sirves
   el primer bolón y *corre la voz*.
2. **El comensal especial** — Don Segundo pide el bolón mixto (huevo frito y
   café pasado); se abre la página, compras lo que falta en el mercado, y
   mientras cocinas él comparte **memorias de la abuela**.
3. **Cierre de muestra** — con las páginas del MVP a color, guardas el
   cuaderno: «Continúa en la temporada completa…».

Sin arriendo, sin salubridad, sin metas de largo plazo en esta fase (GDD §8):
esos sistemas quedan dormidos en el motor, listos para la temporada completa.

## Navegación (GDD §4)

Sin barra de pestañas. **Botones flotantes dibujados**: la canasta (mercado)
y el cuaderno (recetas), con borde orgánico y flotación sutil. Las monedas y
la fama son anotaciones al margen, no HUD de videojuego.

## Cómo correrlo localmente

```bash
npx serve .        # o: python3 -m http.server
```

Escritorio (drag & drop) y móvil (tocar coloca; el ➕ de la mesa abre la
despensa). Guardado en `localStorage` (`huecas_save_v14`).
