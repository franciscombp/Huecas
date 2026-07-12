# Huecas — saberes y sabores

Juego web cozy 2D de cocina ecuatoriana. Cada **cuaderno** es el recetario
incompleto de un plato emblemático de una ciudad; el jugador lo recupera
**paso a paso**, combinando ingredientes y utensilios en la cocina.

Jugable en: https://franciscombp.github.io/Huecas/

## Cómo correrlo localmente

Sin build ni dependencias: abrir `index.html` en un navegador, o servir la carpeta:

```bash
npx serve .        # o: python3 -m http.server
```

Escritorio (drag & drop) y móvil (tocar coloca en la mesa; tocar de nuevo retira).

## Cómo se juega

1. Empiezas con **El cuaderno del bolón** (Guayaquil) en la estantería.
2. La página de la receta muestra los pasos en orden: los hechos quedan
   escritos, el actual está marcado con "estás aquí" (se ve un ingrediente
   y el otro oculto), y los futuros aparecen manchados e ilegibles.
3. En la **cocina**, el banner "el cuaderno dice…" repite la pista del paso
   actual. Combinas dos cosas de la despensa; acertar escribe el paso y
   premia con **fichas**. Puedes pagar 1 ficha para **revelar** el
   ingrediente oculto del paso actual.
4. Con fichas compras en la **lona del mercado** los cuadernos de otras
   ciudades (El levantamuertos, Tardes de choclo, La plancha de Ambato,
   Semana Santa) e ingredientes especiales (chicharrón, bacalao).
   Cada cuaderno trae de regalo sus ingredientes básicos.
5. Completar el último paso de un cuaderno celebra el **plato recuperado**.
   Los objetos sin pasos pendientes se marcan con ✓ y se atenúan en la
   despensa, para no reintentar combinaciones ya hechas.

El progreso se guarda en `localStorage` (clave `huecas_save_v2`).

## Arquitectura

HTML/CSS/JS vanilla, sin backend.

| Archivo | Rol |
|---|---|
| `index.html` | Pantallas: portada, estantería, página de receta, cocina, mercado, modales |
| `styles.css` | Escenarios (estantería de madera, cocina, lona), papel, sellos, HUD y tabbar de juego |
| `data.js` | **Todo el contenido**: nodos (`ITEMS`), cuadernos con pasos (`CUADERNOS`), extras de tienda, economía y microcopy |
| `app.js` | Estado, render de pantallas, combinación, revelado, celebraciones, persistencia |

### Escalar el contenido

Añadir un plato nuevo = añadir un cuaderno a `CUADERNOS` (título, ciudad,
color de portada, costo, `grants` y su lista de `steps`), sus nodos nuevos a
`ITEMS`, y su id a `CUADERNO_ORDER`. Estantería, mercado, página de receta,
guía de cocina, pistas y economía se generan solos a partir de esos datos.

La economía está validada por simulación (`sim2.js` en el historial de la
sesión): todos los órdenes de compra de cuadernos terminan el juego, incluso
si el jugador paga por revelar cada paso.
