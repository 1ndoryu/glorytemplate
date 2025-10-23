# Glory Templates - Notas de implementación

## Contenido
- Responsive en controles (desktop/tablet/móvil)
- CSS por instancia y especificidad
- Plantilla `plantillaServicios` opciones propias

## Responsive en controles
- Para exponer opciones con el panel responsive nativo de Avada, añade `responsive` al parámetro:
  - `responsive: { state: 'large', default_value: false, additional_states: ['medium','small'] }`
- Los valores pueden llegar como:
  - Objeto `{ large, medium, small }` (preferido), o
  - Claves separadas `*_medium`, `*_small`.
- En el render, normaliza aceptando ambos formatos.

## CSS por instancia y especificidad
- Generamos un `style` inline por instancia con id `glory-cr-XXXX-css` y selectores limitados a la clase de instancia.
- Para evitar overrides globales, se usó `!important` en propiedades de dimensiones (width/height/min/max).
- Breakpoints:
  - Tablet: `@media (min-width: 768px) and (max-width: 979px)`
  - Móvil: `@media (max-width: 767px)`

## Plantilla `plantillaServicios` opciones propias
- Se añadieron 2 opciones responsive específicas de plantilla:
  - `servicio_contenido_width`
  - `servicio_contenido_max_width`
- Estas opciones controlan el ancho y ancho máximo del contenedor `.glory-cr__content`.
- Se integran en el CSS por instancia tanto en el shortcode principal como en el fallback del registrador.

## Consejos
- Evitar estilos inline (max-width fijos) que bloqueen las reglas responsive; si existen, retirarlos o sobrescribirlos con mayor especificidad.
- Confirmar en el DOM: la imagen debe tener clase `glory-cr__image` y estar dentro del contenedor con la clase de instancia `glory-cr-XXXX`.
# Estándar de plantillas Glory Content Render

Este estándar asegura que las plantillas personalizadas funcionen con las opciones por instancia del shortcode `glory_content_render` en Avada Builder.

## Reglas de clases CSS

- Contenedor de ítem (lo provee el render): `{$itemClass}`
- Dentro del ítem, usar clases genéricas:
  - `glory-cr__title` para el título del post
  - `glory-cr__image` para la imagen destacada
  - `glory-cr__stack` como contenedor vertical de título+imagen (habilita reordenar)

El shortcode inyecta además una clase única por instancia al contenedor: `glory-cr-{N}` y agrega `glory-cr-{N}__item` a cada ítem. El CSS inline se genera con esa clase única, por lo que no colisiona entre instancias.

Si tu plantilla necesita una clase propia para el ítem (p. ej. `mi-plantilla-item`), debes COMBINARLA con `{$itemClass}` que te pasa el render. No sustituyas `{$itemClass}`.

## Ejemplo mínimo de plantilla

```php
<?php
/**
 * @param WP_Post $post
 * @param string  $itemClass
 */
function plantillaEjemplo(\WP_Post $post, string $itemClass): void {
    $img = has_post_thumbnail($post) ? get_the_post_thumbnail_url($post, 'medium') : '';
?>
    <div class="<?php echo esc_attr($itemClass); ?>">
        <a href="<?php echo esc_url(get_permalink($post)); ?>">
            <h3 class="glory-cr__title"><?php echo esc_html(get_the_title($post)); ?></h3>
            <?php if ($img): ?>
                <img class="glory-cr__image" src="<?php echo esc_url($img); ?>" alt="<?php echo esc_attr(get_the_title($post)); ?>">
            <?php endif; ?>
        </a>
    </div>
<?php } ?>
```

### Combinar la clase propia de tu plantilla

```php
<?php
function plantillaEjemplo(\WP_Post $post, string $itemClass): void {
    $mergedItemClass = trim($itemClass . ' mi-plantilla-item');
?>
    <div class="<?php echo esc_attr($mergedItemClass); ?>">
        <!-- contenido -->
    </div>
<?php } ?>
```

### Registro en TemplateRegistry (aceptando $itemClass)

```php
use Glory\Utility\TemplateRegistry;

TemplateRegistry::register(
    'mi_plantilla',
    'Mi Plantilla',
    function (?\WP_Post $givenPost = null, string $itemClass = '') {
        $postToRender = $givenPost;
        if (!$postToRender) {
            global $post;
            $postToRender = ($post instanceof \WP_Post) ? $post : null;
        }
        if ($postToRender instanceof \WP_Post) {
            $mergedItemClass = trim(($itemClass !== '' ? $itemClass . ' ' : '') . 'mi-plantilla-item');
            plantillaEjemplo($postToRender, $mergedItemClass);
        }
    },
    ['post']
);
```

## Opciones soportadas por instancia

Layout del contenedor:
- `display_mode`: `flex` | `grid` | `block`
- `flex_direction`: `row` | `column`
- `flex_wrap`: `nowrap` | `wrap`
- `gap`: ej. `20px` (visible también con carrusel activo)
- `align_items`: ej. `flex-start`, `center`, `stretch` (visible también con carrusel activo)
- `justify_content`: ej. `flex-start`, `space-between` (visible también con carrusel activo)
- `grid_min_width`: ej. `250px` (para grid responsive tipo masonry simple)
- `grid_auto_fit`: `yes` (auto-fit) | `no` (auto-fill)
- `interaccion_modo`: `normal` | `carousel` | `toggle`
- `toggle_separator`: `yes` | `no` (requiere plantilla compatible)
- `toggle_separator_color`: color CSS (RGBA recomendado)
- `toggle_auto_open`: CSV con índices a expandir automáticamente

Imagen:
- `img_show`: `yes` | `no`
- `img_aspect_ratio`: ej. `1 / 1`, `16 / 9`
- `img_object_fit`: `cover` | `contain`
- `img_min_width`: ej. `200px`
- `img_height`: ej. `100%`, `auto`, `300px`
- `img_optimize`: `yes` | `no` (usa ImageUtility para optimizar la salida; por defecto `yes`)
- `img_quality`: entero `10–100` (calidad usada por ImageUtility; por defecto `60`)
- `img_size`: slug de tamaño WP (`thumbnail`, `medium`, `medium_large`, `large`, `full`, o cualquier tamaño registrado)

Título:
- `title_font_family`: nombre de la fuente
- `title_font_size`: ej. `18px`, `1.25rem`
- `title_font_weight`: ej. `400`, `600`, `bold`
- `title_text_transform`: `none` | `uppercase` | `capitalize`
- `title_position`: `top` | `bottom` (posición del título respecto a la imagen dentro de `.glory-cr__stack`)
- `internal_display_mode`: layout interno (`flex`, `grid`, `block`) o vacío para usar el default de la plantilla (solo si la plantilla lo soporta)
- `internal_flex_direction`, `internal_flex_wrap`, `internal_gap`, `internal_align_items`, `internal_justify_content`: sobreescriben el layout interno si la plantilla lo permite

## Opciones específicas por plantilla (dinámicas)

Las plantillas pueden declarar opciones propias para que aparezcan en el elemento “Glory Content Render” solo cuando esa plantilla esté seleccionada.

1) Declaración en el registro de la plantilla (5º argumento de `TemplateRegistry::register`):

```php
use Glory\Utility\TemplateRegistry;

TemplateRegistry::register(
    'plantilla_portafolio',
    'Plantilla de Portafolio',
    function (?\WP_Post $givenPost = null, string $itemClass = '') { /* ... */ },
    ['portafolio'],
    [
        'options' => [
            [
                'type'       => 'radio_button_set',
                'heading'    => __('Mostrar categorías', 'glory-ab'),
                'param_name' => 'portafolio_mostrar_categorias',
                'default'    => 'no',
                'value'      => [ 'yes' => __('Sí','glory-ab'), 'no' => __('No','glory-ab') ],
                'group'      => __('General', 'glory-ab'),
            ],
        ],
    ]
);
```

2) Inyección automática en el builder: el registrador del elemento agrega estas opciones dinámicamente y las condiciona a `template_id`, por lo que solo aparecen cuando se elige la plantilla correspondiente.

3) Consumo en la plantilla: el valor se expone vía `ContentRender::getCurrentOption()` con una clave que la integración define. En el caso de portafolio:

```php
$mostrarCategorias = (bool) \Glory\Components\ContentRender::getCurrentOption('portafolioMostrarCategorias', false);
```

Nota: La propagación desde `param_name` del builder hasta `ContentRender::setCurrentOption()` la realiza la integración del elemento. Si añades nuevas opciones para otras plantillas, es posible que debas mapear el parámetro (ej. `'mi_param'`) a la opción interna (ej. `'miOpcion'`) en `FusionSC_GloryContentRender.php`:

```php
$raw  = isset($this->args['mi_param']) ? (string) $this->args['mi_param'] : '';
$flag = ('yes' === $raw);
\Glory\Components\ContentRender::setCurrentOption('miOpcion', $flag);
```

4) Fallback opcional por clase (patrón práctico): si lo necesitas, puedes marcar los ítems desde la integración cuando la opción esté activa, concatenando una clase al `claseItem`, y leerla en la plantilla desde `$itemClass` para resolver condiciones sin depender de opciones globales:

```php
// (Integración) $config['claseItem'] .= ' mi-plantilla--flag-x';
// (Plantilla)
if (false !== strpos($itemClass, 'mi-plantilla--flag-x')) { /* ... */ }
```

### Consideraciones de estilo

- Si reutilizas `glory-cr__title` para metadatos (como categorías), recuerda que la opción “Mostrar título solo en hover” puede ocultar elementos con esa clase. Para evitarlo, considera una clase dedicada (ej. `portafolio-categorias`) o ajusta la configuración de hover.

## Notas
- Para desactivar la tipografía responsive de Avada en el título, se puede añadir la clase `noResponsiveFont` al `glory-cr__title` o su wrapper; la integración agrega `awb-responsive-type__disable` automáticamente.
- Mantén la estructura de clases consistente para que el CSS inline por instancia funcione en todas las plantillas. En particular, envuelve título e imagen dentro de `.glory-cr__stack` si quieres que `title_position` tenga efecto.
- El comportamiento “Mostrar título solo en hover” oculta el título por defecto y lo muestra cuando se hace hover en el contenedor del ítem (`{$itemClass}`) o, si fuese necesario, sobre el `selector_item` configurado en el elemento. Asegúrate de usar `glory-cr__title` en el título y `glory-cr__image` en la imagen para que las reglas apliquen.
- Con carrusel activo, los ítems usan `display:flex`, `flex-wrap: nowrap` y cada item `flex: 0 0 auto;`. Puedes controlar alineación con `justify_content`, `align_items` y el `gap` entre ítems.
- Con modo `toggle`, cada ítem debe exponer un contenedor con `data-glory-toggle-item="true"`, un trigger (`data-glory-toggle-trigger="true"`) y un contenedor de contenido (`data-glory-toggle-content="true"`). La plantilla puede declarar soporte de toggle al registrar la plantilla vía `TemplateRegistry::register(..., ['toggle' => true])`.
- Si una plantilla declara `internalLayout => true`, recibirá las opciones `internal_*` para ajustar el layout interno sin duplicar lógica CSS; el contenedor interno sugerido es `.glory-cr__internal`.
