# Huecas — saberes y sabores

Juego web cozy: heredaste una **hueca** en el Ecuador del año 2000 (sí, se
paga en **sucres**) y un recetario incompleto. Recuperas recetas
experimentando, cocinas con un inventario que se gasta, atiendes a la
clientela del barrio y pagas el arriendo. Estética de cuaderno de bocetos
con ilustraciones chubby propias (SVG inline, sin dependencias).

Jugable en: https://franciscombp.github.io/Huecas/

## Cómo correrlo localmente

```bash
npx serve .        # o: python3 -m http.server
```

Escritorio (drag & drop) y móvil (tocar coloca; tocar la mesa retira).

## La cocina (v7)

La **cocina cabe en una pantalla, sin scroll**, estilo Plants vs Zombies:
arriba la **cola de clientes** (avatares con el plato que piden y una barra de
paciencia), en el centro la **mesa de trabajo**, y abajo la **despensa con
pestañas** (Utensilios · Ingredientes · Listos).

- Pones dos cosas en la mesa y pulsas la acción. Mientras **no has descubierto**
  ese paso el botón dice **“Usar”** (sin spoiler); una vez descubierto muestra
  el verbo (Pelar, Freír, Majar…). El resultado se queda en la mesa para encadenar.
- **Toda combinación hace algo.** Si mezclas cosas que no casan (plátano crudo
  con queso, verde con leche…) igual se hace, pero queda una **mezcla inútil**
  que solo estorba y **se pudre con el tiempo** si no la botas. El aviso es a
  **pantalla completa** con lógica realista, no un snackbar.
- Un **plato listo** se vende o se sirve desde la propia cocina (pestaña Listos).
  Si lo vuelves a poner al fuego, **se quema**.

## Huecas por región

Empiezas en la **hueca costeña** con el bolón. Su hermano el **tigrillo**
comparte la misma base (verde majado) pero lleva huevo y se vende más caro.
Al dominar 2 platos costeños se abre la **hueca serrana** (humita, llapingacho,
fanesca). El **arriendo sube cada mes**: con puro bolón no alcanza —hay que
aprender platos más caros o diversificar. (Validado: el bolón solo quiebra;
bolón + tigrillo sostiene la hueca.)

## El bucle

0. **Empieza suave**: solo tú, la mesa y el cuaderno del bolón. Un onboarding
   de tres pasos explica descubrir / atender / sobrevivir.
1. Los cuadernos dan **acertijos**, no instrucciones; cada paso tiene botón
   **Intentar** (te lleva a la cocina) y **Espiar** (paga por ver el par exacto).
2. En la cocina pones dos cosas en la mesa y pulsas el **botón de acción**
   con el verbo del recetario (pelar, hervir, majar, mezclar, dorar…). El
   **resultado se queda en la mesa** para encadenar el siguiente paso sin
   volver a la despensa. Los pasos están redactados como un **recetario real**
   simplificado, así que sirve también como recetario de verdad.
   Las recetas son realistas: el verde **se pela** antes de cocerse, el
   pescado se limpia, el choclo pasa por un **molino** que hay que comprar.
   El **cuchillo se desafila** con el uso; el afilador cobra en la lona.
3. **Toda combinación hace algo.** Errores con lógica realista: cocer el verde
   con cáscara da *verde amargo*; plátano crudo con queso, *engrudo*; el limón
   corta la leche. Lo inútil solo estorba y **se pudre** si no lo botas. El
   aviso es a **pantalla completa**.
4. Ser creativo paga: hay combinaciones **fuera del recetario** que
   producen inventos vendibles (bolón doble queso, humita extra queso).
5. Los platos listos se **venden o sirven desde la propia cocina** (pestaña
   Listos) o cuando un cliente los pide. Servir sube tu **fama** (paga mejor,
   con propina); dejar ir a alguien la baja. Recalentar un plato lo **quema**.
6. Cada 6 clientes, **don Aurelio pasa por el arriendo, que sube cada mes**
   (S/ 10.000, luego 16.000, 22.000…). Con buena fama te fía una vez; sin
   sucres y sin fama, **la hueca cierra** — pero recetas, técnicas y utensilios
   se quedan contigo para reabrir.
7. **La presión escala**: mientras más platos dominas, más seguido llegan
   los clientes y menos paciencia tienen (tabla `HUECA.pressure`).
8. **Salubridad**: si 3 clientes seguidos se van sin servir, llega la
   autoridad. Si tienes un plato listo que mostrar, pasas; si no, **clausura**.
   (Truco: guarda siempre un plato de reserva.)
9. **Metas de largo plazo** (`MILESTONES`): a los 10, 25, 50 y 100 clientes
   servidos subes de categoría (Hueca de barrio → Patrimonio del sabor) con
   premio en sucres — la hueca nunca "se termina".
10. **Modo tranquilo**: el botón Servicio/Tranquilo del HUD pausa la
    clientela, el arriendo y salubridad para solo descubrir recetas con calma.

Guardado en `localStorage` (`huecas_save_v7`).

## Arquitectura

HTML/CSS/JS vanilla, sin backend. **Todo el diseño del juego vive en
`data.js`**, pensado como base de datos administrable:

| Estructura | Qué controla |
|---|---|
| `ITEMS` | Cada nodo: precio de compra, precio de venta (0 = ni los chanchitos), desgaste de utensilios (`wear`, `sharpenCost`) |
| `CUADERNOS` | Recetas canon por ciudad: pasos con acertijo (`hint`), frase manuscrita (`line`), técnica y canasta de regalo |
| `RULES` | **La tabla extensible de condiciones**: `kind: 'fail'` (error explícito con resultado y mensaje propios) o `kind: 'creative'` (invento vendible). Se añaden filas sin tocar la lógica |
| `CLIENTES` / `HUECA` | Vecinos que piden platos, paciencia, frecuencia, arriendo y fama |
| `REWARDS` / precios | Toda la economía |

El motor (`app.js`) resuelve cada combinación en orden:
**paso canon → regla (invento/fallo) → sin interacción (no penaliza).**
La combinación se dispara con el botón de acción; nunca es automática.

| Archivo | Rol |
|---|---|
| `icons.js` | ~50 ilustraciones chubby flat con caritas (helpers `bowl`/`ball`/`face`/`head`) |
| `data.js` | Contenido y reglas (ver arriba) |
| `app.js` | Motor de combinación, inventario, clientes, arriendo, cierre/reapertura |
| `index.html` / `styles.css` | Pantallas y estética de cuaderno |

La economía está validada por simulación: 144 recorridos del recetario
(órdenes de compra × fallos × espiar) terminan bien, y atender la hueca
cubre el arriendo con fama media en todos los platos.
