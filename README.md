# Huecas — saberes y sabores

Prototipo jugable de un juego web cozy 2D de descubrimiento culinario ecuatoriano.
Un recetario heredado e incompleto que se reconstruye combinando ingredientes,
utensilios y saberes en una mesa de trabajo.

## Cómo correrlo

No hay build ni dependencias. Basta abrir `index.html` en un navegador,
o servir la carpeta:

```bash
npx serve .        # o: python3 -m http.server
```

Funciona en escritorio y móvil, con mouse (drag & drop) y touch
(tocar un objeto lo coloca en la mesa; tocar un espacio ocupado lo retira).

## Cómo se juega

1. Abre el cuaderno desde la portada.
2. En la **mesa de trabajo**, junta dos objetos. Si se reconocen, aparece un hallazgo nuevo.
3. Cada hallazgo se registra en el **cuaderno** y premia con **fichas**.
4. En la **lona del mercado** las fichas compran ingredientes y utensilios que abren nuevas ramas.
5. Meta visible: reconstruir los platos — Bolón, Encebollado, Humita, Llapingacho — y, al final, la **Fanesca**.

El progreso se guarda en `localStorage`. "Cuaderno nuevo" en la portada lo reinicia.

## Arquitectura

Todo es HTML/CSS/JS vanilla, sin backend.

| Archivo | Rol |
|---|---|
| `index.html` | Estructura de las cinco pantallas (portada, cuaderno, mesa, mercado, ficha) |
| `styles.css` | Dirección visual: papel envejecido, tinta, sellos, lona de mercado |
| `data.js` | **Todo el contenido**: nodos (`ITEMS`), recetas (`RECIPES`), tienda (`SHOP`), recompensas y microcopy |
| `app.js` | Estado del jugador, render de pantallas, combinación, pistas, persistencia |

### Escalar el contenido

El sistema es data-driven: para añadir un plato nuevo solo hay que
agregar sus nodos a `ITEMS`, sus pasos a `RECIPES` y, si algo se compra,
una entrada en `SHOP`. La UI (cuaderno, mesa, mercado, fichas, siluetas,
conteos por categoría y pistas) se genera sola a partir de esos datos.

Tipos de nodo: `ingredient`, `tool`, `technique`, `prep`, `dish`.
Las técnicas se registran automáticamente la primera vez que ocurre la
transformación que las enseña (campo `techniques` de la receta).
