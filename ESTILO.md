# Guía de estilo — Huecas

Documento vivo. Cualquier pantalla nueva se mide contra esto antes de darse
por terminada.

> **Ojo:** Huecas y Pambamesa son proyectos distintos. Pambamesa es el
> álbum coleccionable estilo Little Alchemy; Huecas es este sim de hueca
> en el Ecuador del 2000. Comparten motor de iconos y algunas ideas de
> interacción, pero **no comparten paleta ni pantallas**. Si estás
> copiando algo de allá, léelo aquí primero.

---

## 1. La idea en una frase

**Estás cocinando en el mesón de tu abuela, visto desde arriba.** Lo que
tienes está sobre el mesón, no dentro de un cajón: se agarra, se arrastra
y se suelta en la mesa. Los botones son el último recurso, no el primero.

---

## 2. Referencias

Guardadas en `referencias/`. La familia visual es la de los juegos de
cocina contemplativos tipo *Venba*: plano cenital, pintado a mano, cálido
y saturado, con todo apoyado sobre la encimera.

| Archivo | Qué tomamos de ahí |
|---|---|
| `ref-encimera-cenital.webp` | **La referencia madre.** Plano cenital: la olla al centro sobre la hornilla oscura, los cuencos regados alrededor, el recetario a un lado. Nada está "en un panel": todo descansa sobre la mesa, y hay una mano que agarra las cosas. |
| `ref-hornilla-vapor.webp` | La hornilla como objeto oscuro real, con el calor tiñendo el metal alrededor. El único punto oscuro de la escena, y por eso atrae la mirada. |
| `ref-plato-terminado.jpeg` | El momento de servir: el plato terminado es lo más saturado de la pantalla, y la escena habla desde la olla, no desde una barra de sistema. |
| `ref-mesa-servida.webp` | La paleta de la comida: corales, morados profundos, dorados. La mesa es el fondo; la comida es la estrella. |
| `ref-recetario-sobre-la-escena.jpeg` | El recetario: papel real puesto encima de la escena, dibujos a mano alzada, texto escrito a mano con **palabras clave en color**. No es una tabla de datos, es el cuaderno de alguien. |

**Ojo con la diferencia clave:** en las referencias el mundo llega ya
coloreado. En Huecas **no**, porque el color es la recompensa (§2b). La
referencia manda en la *forma* (cenital, objetos con peso, hornilla
oscura, papel encima); la regla de boceto→color manda en el *color*.

---

## 2b. La regla que lo sostiene todo: boceto → color

Es el corazón del GDD (§3.2) y **manda sobre cualquier decisión visual**.

El mundo empieza dibujado a lápiz. Cada paso que descifras cocinando le
devuelve la acuarela a ese ingrediente, esa técnica y esa página.

Para que eso siga funcionando:

> **El mundo es cálido; el papel sigue siendo papel; lo no descubierto se
> queda en lápiz sobre el papel.**

- La **encimera** (`#stage`) es barro cocido cálido: es el mundo, está vivo.
- El **papel** (fichas, cuaderno, carta, hojas) es crema, nunca blanco
  clínico. Ahí es donde se lee el lápiz.
- Lo **no descubierto** lleva `.boceto`: gris, sin saturación, apagado.
- Al descubrirse entra `.paint-in`: la acuarela regresa con animación.

**Prohibido:** saturar de entrada todo lo que aún no se ha descubierto. Si
todo llega ya coloreado, no queda color que devolver y el juego pierde su
razón de ser.

---

## 3. Paleta

```
  la encimera (el mundo)
--mesa        #dca88c   barro cocido, fondo dominante
--mesa-clara  #ebc3a8   donde pega la luz de la ventana
--mesa-honda  #bf8869   sombra al fondo

  papel (fichas, cuaderno, la carta de la abuela)
--page        #fdf7ec   crema cálida — NUNCA #ffffff
--page-2      #f7efe0
--ivory       #fbf5e9
--mist        #ece2d0
--hueca       #f6ecdb   la zona del comensal, al otro lado del mostrador

  tinta
--ink         #2f2b25
--ink-2       #8c857a

  acentos (identidad de Huecas, no se tocan)
--rojo        #c8442c   el rojo de la abuela: acciones y acentos
--verde       #5f7f56
--azul        #5d6b83   metal de los utensilios
--oro         #c9982f   monedas y celebración
```

**Regla de saturación:** la comida ya descubierta es lo más saturado de la
pantalla. Si un ingrediente en color se pierde contra el mesón, el mesón
está muy fuerte — no el ingrediente muy débil.

---

## 4. Tipografía

- **Títulos y nombres de plato:** `Lora`, la calidez de un libro impreso.
- **Voz de la abuela, acertijos, anotaciones:** `Caveat`. Se usa para todo
  lo que *alguien escribió a mano*, nunca para lo que *el sistema informa*.
- **Datos secos** (precios, cantidades): `Lora` pequeño, nunca a mano.

---

## 5. Interacción — la regla principal

> **Si es un objeto, se toca o se arrastra. Si es una decisión, se
> confirma con un botón.**

### Lo que se arrastra
- Ingredientes y preparaciones del mesón → a la mesa.
- Utensilios del mesón → sobre lo que hay en la mesa. Soltar el utensilio
  **ejecuta el paso**: ya dijiste lo que querías hacer.

La mesa perdona: acepta lo que se suelte hasta ~30 px fuera de su borde.
Apuntar fino no es parte del reto.

### Lo que se toca
- Un objeto del mesón: un toque lo manda a la mesa. **El arrastre nunca es
  obligatorio** — hay quien juega con una mano, o con lector de pantalla
  (por eso cada objeto es `role="button"` y responde a Enter/Espacio).
- La mesa: si tiene algo, lo devuelve.

### Lo que sigue siendo botón
- Comprar en la lona (gastar plata es una decisión).
- Servir un plato, guardar, cerrar un modal.
- Avanzar una escena.

### Ayudas que reemplazan instrucciones
- Lo que pide el paso actual **brilla solo** (`.objeto.sugerido`, sobre
  `stepNeeds()`). Nadie debería tener que leer para saber qué agarrar.
- La guía (`#coach`) vive **en el flujo**, entre la mesa y el mesón —
  nunca flotando encima de lo que te está pidiendo que agarres.

### Prohibido
- Un botón cuyo único trabajo es abrir el cajón donde están las cosas. Las
  cosas ya deben estar sobre el mesón.
- Listas de texto donde podría haber objetos dibujados.
- **Animar el elemento que se toca.** Si algo flota, lo que se mueve es el
  dibujo de adentro, nunca el área táctil: un blanco móvil se falla.
- `justify-content: flex-end` en un contenedor con `overflow` — recorta el
  principio de la lista y lo deja inalcanzable.

---

## 6. Física y peso

Nada aparece de golpe ni se mueve en línea recta.

- **Aterrizar** un objeto: `cubic-bezier(.3, 1.6, .4, 1)`, rebota como algo
  que cae sobre madera.
- **Levantar** (mientras se arrastra): el fantasma sube de escala (~1.14) y
  la sombra crece y se difumina.
- **Rechazo**: sacudida horizontal corta (`.shake`), nunca un modal de error.
- Todo objeto sobre el mesón lleva **sombra elíptica difusa** debajo. Sin
  ella, un objeto cenital se ve pegado como sticker.

---

## 7. Sonido y vibración

| Gesto | Sonido | Vibración |
|---|---|---|
| Levantar un objeto | `tab` | 8 ms |
| Soltarlo en la mesa | `place` | 12 ms |
| Paso descifrado | `seal` / celebración | 20 ms |
| Combinación que no va | `fail` | 60 ms |

---

## 8. Texto

- Español ecuatoriano, cálido, sin tecnicismos de juego.
- Nunca "combinar elementos": es **pelar**, **hervir**, **majar**, **freír**.
- Los errores no regañan. *"Esos dos no se llevan"*, no *"Combinación inválida"*.
- El sistema informa corto (toast); la abuela y el cuaderno hablan en `Caveat`.

---

## 9. Dónde vive cada cosa

| Pantalla | Qué es | Piezas clave |
|---|---|---|
| Portada | La página del cuaderno sobre el mesón | `.cover-*` |
| Cocina | Comensal arriba, mesa al centro, tu mesón abajo | `.cocina`, `.mesa`, `#slot-0`, `#encimera`, `.repisa`, `.objeto` |
| Mercado | La lona donde se compra | `#screen-mercado` |
| Cuaderno / Receta | Las páginas de la abuela | `#screen-shelf`, `#screen-receta` |

Los modales (`carta`, `escena`, `celebra`, `arriendo`, `cierre`, `despensa`)
son siempre **papel**: son páginas del cuaderno, no ventanas de sistema.

### Todo lo que no es la cocina se apoya en algo

La cocina es el único sitio donde el contenido vive directamente sobre la
encimera, porque ahí la encimera *es* el escenario. En las demás pantallas
el contenido va sobre una superficie:

| Pantalla | Su superficie |
|---|---|
| Cuaderno / Receta | `.hoja` — papel crema con margen rojo punteado |
| Mercado | `.mercado-wrap::before` — la lona tendida, con su toldo y festón |

**Nunca dejes texto flotando sobre la encimera.** Sin superficie se lee
como interfaz pegada encima de la escena, no como algo que está ahí.

Y los cantos de repisa (`.market-grid::after`, `.shelf-grid::after`) son
**madera**, no barras blancas: sobre papel blanco no se notaba, sobre la
encimera cálida una barra blanca se lee como un error de render.

---

## 10. Lista de verificación antes de dar algo por terminado

- [ ] ¿Lo no descubierto sigue en boceto, y el color vuelve al descifrarlo?
- [ ] ¿Se puede hacer arrastrando o tocando, en vez de con un botón?
- [ ] ¿Los objetos tienen sombra y se ven apoyados sobre el mesón?
- [ ] ¿Hay algún botón que solo abre un cajón? (quitarlo)
- [ ] ¿La comida descubierta es lo más saturado de la pantalla?
- [ ] ¿El movimiento tiene rebote, o es lineal y seco?
- [ ] ¿Funciona igual con un solo toque, sin arrastrar? ¿Y con teclado?
- [ ] ¿El área que se toca se queda quieta?
- [ ] ¿Se alcanza todo sin que el scroll recorte nada? (probar en 360×640)
- [ ] ¿El texto suena a persona o a sistema?
