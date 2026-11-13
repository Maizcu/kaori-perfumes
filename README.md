# Kaori · Tema de Shopify

Tienda de perfumes y velas de inspiración japonesa, desarrollada para la prueba técnica de Shopify Developer.

- **Tienda:** https://kaori-perfumes-xuau8ztt.myshopify.com (la contraseña va en el correo de entrega)
- **App del descuento:** [kaori-ritual](https://github.com/Maizcu/kaori-app.git), con la Shopify Function que aplica el descuento del ritual
- **Diseño:** presentación adjunta en la entrega

## Punto de partida

El tema parte de **Dawn 15.5.0** (`shopify theme init`). Elegí Dawn porque es el tema de referencia de Shopify para Online Store 2.0, ya resuelve bien la accesibilidad y el rendimiento, y me permitía centrarme en lo propio reutilizando su carrito, su formulario de producto, el selector de variantes y los filtros de colección.

La regla que he seguido es que lo nuevo va en archivos nuevos y en los archivos de Dawn solo toco lo imprescindible (están listados más abajo). Así el tema base se puede seguir actualizando sin rehacer el trabajo.

Para arrancarlo en local:

```
shopify theme dev --store kaori-perfumes-xuau8ztt
```

Los productos usan metafields y metaobjects (ver [Datos de producto](#datos-de-producto)). Sin ellos las secciones se muestran, pero sin la información enriquecida.

## Requisitos de la prueba

| Requisito | Dónde está |
| --- | --- |
| Home con secciones propias, settings y blocks | `templates/index.json`: Hero, Descubre tu aroma (un bloque por perfume), Promo del ritual (un bloque por paso), Velas destacadas y Nuestra historia son secciones propias. La colección destacada es la de Dawn. |
| Página de colección | `templates/collection.json` con 6 productos de ejemplo. Banner con la última palabra del título en cursiva, tarjeta promocional del ritual dentro de la cuadrícula y tarjetas con familia olfativa, formato y badges. Filtros y orden de Dawn. |
| Ficha de producto con datos enriquecidos | `main-product` con bloques propios: pirámide olfativa con intensidad, duración y momento de uso, nombre en japonés, frase y botón al ritual. Debajo, la sección "Combina con". Las velas usan una plantilla alternativa (`product.vela.json`). |
| Funcionalidad personalizada | Selector de packs "Crea tu ritual" con descuento por Shopify Function. Como extras: barra de envío gratis progresiva, cross-selling en el carrito y badges dinámicos. |
| JavaScript y DOM | `assets/ritual.js` (`<ritual-form>` y `<ritual-builder>`) y `assets/scent-explorer.js` (`<scent-explorer>`). |
| Responsive y accesibilidad | Ver [Accesibilidad y responsive](#accesibilidad-y-responsive). |

Además hay una página "Nuestra historia" (`page.historia.json`) montada con cinco secciones propias.

## Funcionalidad propia: Crea tu ritual

El cliente elige 2 perfumes y 1 vela y se lleva un 15 % de descuento en esas tres piezas. Está en `/pages/crea-tu-ritual`, que usa la plantilla `page.ritual.json` con la sección `ritual-builder`.

**Selector (`sections/ritual-builder.liquid` y `snippets/ritual-option.liquid`)**

- Hay dos grupos de opciones con su límite (`data-max="2"` para perfumes y `data-max="1"` para la vela). Las opciones son checkboxes nativos ocultos visualmente dentro de su `label`, así funcionan con teclado y lector de pantalla sin trucos de ARIA.
- El resumen se actualiza al momento: huecos del ritual, subtotal, ahorro y total. El botón está desactivado hasta completar el ritual y los mensajes se anuncian con `aria-live`.
- Las colecciones de perfumes y velas, el porcentaje mostrado y todos los textos se configuran desde el editor.

**Añadir al carrito (`assets/ritual.js`)**

- Una sola petición a `/cart/add.js` con las tres variantes y la propiedad `_ritual`. El guion bajo hace que no se muestre al cliente.
- Después refresco el cart drawer de Dawn con la Section Rendering API (`getSectionsToRender` y `renderContents`) y lo abro, igual que hace el formulario de producto de Dawn.
- La sección "Combina con" de la ficha (`product-ritual`) reutiliza la misma clase base (`RitualForm`) para añadir el producto junto a sus combinaciones como ritual.

**Descuento (Shopify Function en la app `kaori-ritual`)**

- La Function `cart.lines.discounts.generate.run` solo tiene en cuenta las líneas con `_ritual`, cuenta cuántos rituales completos hay (2 perfumes + 1 vela) y aplica el 15 % solo a esas unidades. Lo que sobre se cobra a precio normal.
- **Por qué una Function:** los descuentos automáticos nativos no permiten expresar "exactamente 2 de un tipo y 1 de otro". Un "compra X y llévate Y" solo se acerca, y Flow no puede crear descuentos por carrito. La Function es exacta, se ejecuta en Shopify (carrito y checkout), no depende del tema y se puede testear.
- **Por qué la propiedad `_ritual`:** el descuento debe aplicarse solo al comprar desde el ritual. Sin ella, cualquier carrito con 2 perfumes y una vela se lo llevaría, incluidas variantes de 100 ml.

## Otras funcionalidades

- **Carrito.** Es el drawer de Dawn adaptado (`snippets/cart-drawer.liquid` y `assets/kaori-cart-drawer.css`):
  - barra de envío gratis progresiva, con el umbral en los ajustes del tema;
  - producto sugerido configurable (cross-selling), que se oculta si ya está en el carrito y se añade con el `product-form` de Dawn;
  - he quitado el enlace "Ver carrito" para que el flujo sea drawer → checkout.
- **Badges dinámicos** en las tarjetas (`snippets/card-badge.liquid`): agotado, oferta, nuevo (etiqueta `nuevo`) y últimas unidades (5 o menos).
- **Descubre tu aroma** (`sections/scent-explorer.liquid`):
  - pestañas accesibles (`role="tab"` y `role="tabpanel"`, flechas del teclado);
  - avance automático con una animación CSS que se pausa con hover o foco y respeta `prefers-reduced-motion`;
  - escucha `shopify:block:select` para que, al seleccionar un perfume en el editor, la pestaña se abra y se pare.
- **Nuestra historia:** `legend-hero`, `legend-chapter`, `legend-promise`, `legend-principles` y `legend-cta`. Los capítulos pueden listar los ingredientes (metaobject) de una colección.
- **Etiqueta "-15 %"** en el enlace del menú que lleva al ritual, configurable desde la cabecera.

## Datos de producto

| Campo | Tipo | Dónde se usa |
| --- | --- | --- |
| `custom.familia` | Referencia al metaobject Familia olfativa (nombre, color) | Tarjeta y ficha |
| `custom.ingrediente` | Referencia al metaobject Ingrediente (nombre japonés, imagen, leyenda) | Ficha y Nuestra historia |
| `custom.notas_salida`, `custom.notas_corazon`, `custom.notas_fondo` | Texto | Pirámide olfativa |
| `custom.intensidad` | Número del 1 al 5 | Medidor de intensidad |
| `custom.duracion`, `custom.momento` | Texto | Bloque de notas |
| `custom.formato` | Texto | Tarjeta y selector del ritual |
| `custom.frase` | Texto | Ficha |
| `custom.combina_con` | Lista de productos | "Combina con" |
| `custom.color` | Color | Fondo de Descubre tu aroma |

La familia olfativa y el ingrediente son metaobjects porque los comparten varios productos y tienen más de un campo: se editan en un solo sitio. El resto son metafields porque son propios de cada producto.

## Decisiones técnicas

- **CSS.** `assets/kaori.css` es la capa global: variables de color, la fuente japonesa, el botón `.pill` y los ajustes sobre Dawn. Cada sección propia carga su propio CSS con `stylesheet_tag`, así solo pesa donde se usa. Uso los mismos puntos de corte que Dawn (750 y 990 px).
- **Fuente japonesa autoalojada.** Es un subconjunto de Noto Serif JP con solo los caracteres que usa la web: 16 KB en woff2, con licencia OFL. Así no dependo de las fuentes del sistema (en Windows los caracteres salían con otra forma) ni de peticiones a Google Fonts.
- **JavaScript.** Custom elements por componente, cargados con `defer` y sin dependencias. Reutilizo lo que Dawn ya expone: `fetchConfig`, `routes` y la API del `cart-drawer`.
- **Snippets con `render` y parámetros explícitos:** `card-badge`, `scent-notes`, `ritual-option`, `product-ritual-item` y `enso`.
- **Textos.** Los fijos de la interfaz están en `locales/es.json` y `locales/en.default.json`; los que cambia el comerciante, en los ajustes de cada sección. Las etiquetas de los schemas de mis secciones están en español directamente, porque la tienda es de un solo idioma.
- **Precios.** Sin decimales cuando son enteros (`money_without_trailing_zeros`) en toda la tienda, como en el diseño.
- **Plantillas alternativas:** `product.vela`, `page.historia` y `page.ritual`.
- **Calidad.** Theme Check da los mismos avisos que un Dawn 15.5.0 limpio, sin ninguno nuevo, y mis archivos están formateados con Prettier (`.prettierrc.json` de Dawn).

### Archivos de Dawn modificados

| Archivo | Cambio |
| --- | --- |
| `layout/theme.liquid` | Carga `kaori.css` |
| `sections/header.liquid`, `snippets/header-dropdown-menu.liquid` | Etiqueta "-15 %" en un enlace del menú |
| `sections/cart-icon-bubble.liquid` | Texto del icono del carrito |
| `sections/footer.liquid` | Newsletter con el botón del tema y sin "Powered by" |
| `sections/featured-collection.liquid` | Enlace a la colección junto al título |
| `sections/main-collection-banner.liquid` | Última palabra del título en cursiva |
| `sections/main-collection-product-grid.liquid` | Tarjeta promocional dentro de la cuadrícula |
| `sections/main-product.liquid` | Bloques `scent_notes` y `button`, nombre en japonés y frase |
| `snippets/card-product.liquid` | Familia y formato, badges en `card-badge` |
| `snippets/cart-drawer.liquid` | Envío gratis, producto sugerido y nuevo diseño |
| `snippets/price.liquid` | Precios sin decimales cuando son enteros |
| `config/settings_schema.json` | Ajustes del producto sugerido y del umbral de envío gratis |
| `locales/es.json`, `locales/en.default.json` | Textos nuevos |

## Accesibilidad y responsive

- HTML semántico: un `h1` por página, listas ordenadas y listas de definición donde el contenido lo es (principios, notas olfativas, totales del ritual).
- Controles nativos siempre que se puede (checkboxes, botones, enlaces) y estados de foco visibles con `:focus-visible`.
- `aria-live` en contadores y mensajes del ritual, `aria-busy` en el botón mientras se añade al carrito y pestañas con sus roles y navegación con flechas.
- Textos en japonés con `lang="ja"`. Los puramente decorativos llevan `aria-hidden`.
- Texto alternativo en las imágenes de producto y `alt` vacío en las decorativas.
- `prefers-reduced-motion` desactiva el carrusel de Nuestra historia en móvil y el avance automático de Descubre tu aroma.
- En móvil:
  - el menú pasa al cajón por debajo de 1200 px;
  - el pie muestra los enlaces en dos columnas;
  - la galería de Nuestra historia pasa a fundido entre imágenes;
  - la tarjeta promocional ocupa todo el ancho.

  Está revisado a 390 px.

## Limitaciones conocidas

- **El 15 % está definido en varios sitios:** la Function, los ajustes de `ritual-builder` y `product-ritual`, y algunos textos. Si cambia, hay que tocarlos todos.
- **Tipos de producto:** la Function distingue perfumes y velas por el tipo de producto (`Eau de parfum` y `Vela`). Renombrarlos rompe el descuento.
- **Variante de 50 ml:** el ritual usa siempre la primera variante de cada producto y asume que es la de 50 ml.
- **La propiedad `_ritual` la pone el navegador:** alguien con conocimientos podría añadirla a mano a otras líneas.
- **El umbral de envío gratis** está en los ajustes del tema, en la tarifa de envío del admin y en un texto de `es.json`. Hay que mantenerlos iguales.
- **Precios a mano:** los de la promo del ritual de la home están escritos en los ajustes de la sección.
- **Imagen de ambiente:** Descubre tu aroma usa la quinta imagen de cada producto, así que depende del orden de la galería.
- **Fuente del cuerpo:** `kaori.css` fija la del diseño, por lo que el ajuste de fuente del cuerpo del editor no tiene efecto.
- **Badges:** "nuevo" depende de una etiqueta y el límite de "últimas unidades" (5) está fijo en el código.
- **Recomendaciones:** Shopify no recomienda productos que ya están en el carrito, así que "También te gustará" puede mostrar menos productos. Es el comportamiento nativo.

## Posibles mejoras

- **Porcentaje único:** guardar el porcentaje en un metafield del propio descuento, que la Function lo lea de ahí y que el tema lo muestre, con una extensión de admin para editarlo.
- **Variantes en el ritual:** permitir elegir la variante y que la Function valide el formato por un metafield de la variante en vez de por posición.
- **Identificar perfumes y velas** por un metafield en lugar del tipo de producto.
- **Theme blocks:** migrar los bloques repetidos a theme blocks (`blocks/`).
- **Tests de extremo a extremo:** del ritual y del carrito con Playwright, y Lighthouse CI en GitHub Actions.
- **Idioma:** traducción completa al inglés con Translate & Adapt.
- **Imagen de ambiente:** sacarla de un metafield en vez de la posición en la galería.

## Uso de IA

- **ChatGPT:** generación de las imágenes de producto y de los recursos visuales.
- **Claude:** asistente durante el desarrollo, para la generación y revisión de código.

Las decisiones técnicas, la revisión del código y las pruebas en la tienda son mías.
