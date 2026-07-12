# Huecas — saberes y sabores

Juego web cozy de cocina ecuatoriana, con estética de cuaderno de bocetos
minimalista e ilustraciones chubby propias (SVG inline, sin dependencias).
Cada **cuaderno** es el recetario incompleto de un plato emblemático de una
ciudad; se recupera experimentando en la cocina con un inventario que
**se gasta**.

Jugable en: https://franciscombp.github.io/Huecas/

## Cómo correrlo localmente

Sin build ni dependencias: abrir `index.html`, o servir la carpeta:

```bash
npx serve .        # o: python3 -m http.server
```

Escritorio (drag & drop) y móvil (tocar coloca; tocar la mesa retira).

## El bucle

1. Empiezas con **El cuaderno del bolón** (Guayaquil), unas fichas y una
   canasta básica. Los pasos del cuaderno son **acertijos**, no instrucciones
   ("Lo que el racimo dio, el agua caliente lo ablanda").
2. En la **cocina**, tu despensa está arriba con cantidades. Combinas dos
   cosas: si aciertas, **consumes los insumos** y ganas la preparación
   (y fichas si es un paso nuevo). Si fallas, los insumos se pierden en una
   **mezcla rara** (la caserita la compra para las gallinas a 1 ficha).
   Los utensilios nunca se gastan.
3. En la **lona del mercado** compras ingredientes sueltos, compras los
   cuadernos de otras ciudades, y **vendes** lo que cocinas: cada plato
   deja margen sobre sus ingredientes, así que puedes cocinar de memoria
   en serie para financiar el siguiente cuaderno.
4. Si te atascas: puedes "espiar la página" de un paso (2 fichas) para ver
   la combinación exacta, y si te quedas sin nada, la vecina deja fichas
   en la puerta (rescate automático anti-atasco).

El progreso se guarda en `localStorage` (clave `huecas_save_v3`).

## Arquitectura

HTML/CSS/JS vanilla, sin backend.

| Archivo | Rol |
|---|---|
| `icons.js` | Set de ilustraciones chubby flat (SVG inline con caritas), helpers `bowl`/`ball`/`face` |
| `data.js` | **Todo el contenido**: nodos con precios de compra/venta, cuadernos con pasos y acertijos, economía, microcopy |
| `app.js` | Inventario consumible, combinación libre, mezcla rara, venta, rescate, persistencia |
| `index.html` | Pantallas: portada, estantería, receta, cocina, mercado, modales |
| `styles.css` | Papel claro, tinta suave, tarjetas redondeadas, mucho aire |

### Escalar el contenido

Añadir un plato = un cuaderno nuevo en `CUADERNOS` (pasos con `hint` y
`line`), sus nodos en `ITEMS` (con `price` o `sell`), su icono en `icons.js`
y su id en `CUADERNO_ORDER`. El resto de la UI y la economía se generan solos.

La economía está validada por simulación: 144 escenarios (todos los órdenes
de compra × 0-2 fallos por paso × con/sin espiar) terminan el juego, y cada
plato vende por encima del costo de sus ingredientes.
