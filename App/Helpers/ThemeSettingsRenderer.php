<?php

/**
 * ThemeSettingsRenderer
 * 
 * Genera un bloque <style> en el <head> con los Theme Settings guardados por GBN.
 * 
 * ARQUITECTURA (ADR-001):
 * - GBN es SOLO la UI para editar los Theme Settings
 * - El TEMA aplica los estilos generando un <style> en el <head>
 * - Usa selectores :where() para especificidad 0, permitiendo override del desarrollador
 * - El sitio funciona IDENTICAMENTE con o sin GBN activo
 * 
 * @since Refactor Transparencia CSS - Diciembre 2025
 */

// Hook para generar los estilos en el head
add_action('wp_head', 'gloryRenderThemeSettingsStyles', 5);

/**
 * Genera el bloque <style> con los Theme Settings guardados
 * 
 * Flujo:
 * 1. Lee gbn_theme_settings de wp_options
 * 2. Genera CSS con selectores :where() para especificidad 0
 * 3. Solo emite valores que el usuario explicitamente guardo (no defaults)
 */
function gloryRenderThemeSettingsStyles(): void
{
    $settings = get_option('gbn_theme_settings', []);

    // Si no hay settings guardados, no emitir nada
    if (empty($settings)) {
        return;
    }

    $css = '';

    // 1. Tipografia (text settings)
    if (!empty($settings['text'])) {
        $css .= gloryRenderTypographyStyles($settings['text']);
    }

    // 2. Colores
    if (!empty($settings['colors'])) {
        $css .= gloryRenderColorStyles($settings['colors']);
    }

    // 3. Componentes (principal, secundario, etc.)
    if (!empty($settings['components'])) {
        $css .= gloryRenderComponentStyles($settings['components']);
    }

    // 4. Pagina (page settings globales)
    if (!empty($settings['pages'])) {
        $css .= gloryRenderPageStyles($settings['pages']);
    }

    // Solo emitir si hay CSS generado
    if (!empty(trim($css))) {
        echo "\n<!-- Glory Theme Settings (generado por el tema, no por GBN) -->\n";
        echo '<style id="glory-theme-settings">' . "\n";
        echo $css;
        echo "</style>\n";
    }
}

/**
 * Genera CSS para tipografia (h1-h6, p)
 * Usa :where() para especificidad 0
 */
function gloryRenderTypographyStyles(array $textSettings): string
{
    $css = '';
    $tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

    foreach ($tags as $tag) {
        if (empty($textSettings[$tag])) {
            continue;
        }

        $styles = [];
        $s = $textSettings[$tag];

        if (!empty($s['color'])) {
            $styles[] = 'color: ' . esc_attr($s['color']);
        }
        if (!empty($s['size'])) {
            $styles[] = 'font-size: ' . gloryToCssValue($s['size']);
        }
        if (!empty($s['font']) && $s['font'] !== 'System') {
            $styles[] = 'font-family: ' . esc_attr($s['font']);
        }
        if (!empty($s['lineHeight'])) {
            $styles[] = 'line-height: ' . esc_attr($s['lineHeight']);
        }
        if (!empty($s['letterSpacing'])) {
            $styles[] = 'letter-spacing: ' . gloryToCssValue($s['letterSpacing']);
        }
        if (!empty($s['transform'])) {
            $styles[] = 'text-transform: ' . esc_attr($s['transform']);
        }

        if (!empty($styles)) {
            // Usar :where() para especificidad 0
            $css .= ':where(' . $tag . ') { ' . implode('; ', $styles) . '; }' . "\n";
        }
    }

    return $css;
}

/**
 * Genera CSS variables para colores del tema
 */
function gloryRenderColorStyles(array $colors): string
{
    $css = '';
    $vars = [];

    if (!empty($colors['primary'])) {
        $vars[] = '--gbn-primary: ' . esc_attr($colors['primary']);
    }
    if (!empty($colors['secondary'])) {
        $vars[] = '--gbn-secondary: ' . esc_attr($colors['secondary']);
    }
    if (!empty($colors['accent'])) {
        $vars[] = '--gbn-accent: ' . esc_attr($colors['accent']);
    }
    if (!empty($colors['background'])) {
        $vars[] = '--gbn-bg: ' . esc_attr($colors['background']);
    }

    // Custom colors
    if (!empty($colors['custom']) && is_array($colors['custom'])) {
        foreach ($colors['custom'] as $i => $color) {
            if (!empty($color['value'])) {
                $vars[] = '--gbn-custom-' . $i . ': ' . esc_attr($color['value']);
            }
        }
    }

    if (!empty($vars)) {
        $css .= ':root { ' . implode('; ', $vars) . '; }' . "\n";
    }

    return $css;
}

/**
 * Genera CSS variables para componentes (principal, secundario)
 * 
 * IMPORTANTE: Solo emitimos propiedades que tienen sentido como "defaults globales".
 * Propiedades de contenido (texto, url) o posicionamiento especifico (top, left) 
 * son propiedades de INSTANCIA, no de defaults.
 */
function gloryRenderComponentStyles(array $components): string
{
    $css = '';

    // Propiedades explicitamente ignoradas (contenido, posicionamiento, etc.)
    $ignoredProperties = [
        // Contenido - no es estilo
        'texto',
        'text',
        'url',
        'src',
        'alt',
        'label',
        'placeholder',
        'name',
        'tag',
        'target',
        'method',
        'options',
        'rows',
        'type',
        'copyrightText',
        'successMessage',
        'errorMessage',
        'loadingText',
        'linkText',
        'linkUrl',
        'menuSource',
        'menuLocation',
        'menuId',
        'logoMode',
        'fieldType',
        'dateFormat',
        'wordLimit',
        'imageSize',
        'avatarSize',
        'separator',
        'postType',
        'postsPerPage',
        'orderBy',
        'order',
        'status',
        'offset',
        'categoryFilter',
        'isFixed',
        'showScrollEffect',
        'scrolledClass',
        'backdropBlur',
        'zIndex',
        'mobileBreakpoint',
        'mobileAnimation',
        'linkBehavior',
        'menuDepth',
        'filter',
        'objectFit',
        'layoutPattern',
        // Posicionamiento absoluto - es de instancia, no de default
        'position',
        'top',
        'right',
        'bottom',
        'left',
        // Dimensiones absolutas - generalmente son especificas
        'width',
        'height',
        'ancho',
        // Interaccion y transiciones
        'cursor',
        'transition',
        'transform',
        'hoverEffect',
        // Flags booleanos
        'hasBorder',
        'hasSubmenu',
        'isActive',
        'required',
        'honeypot',
        'ajaxSubmit',
        'showSocialLinks',
        'showLinks',
        'pagination',
        'loadMore',
    ];

    foreach ($components as $role => $config) {
        if (empty($config) || !is_array($config)) {
            continue;
        }

        // Ignorar propiedades internas
        if ($role === '__sync' || str_starts_with($role, '_')) {
            continue;
        }

        $vars = [];
        $prefix = '--gbn-' . esc_attr($role);

        foreach ($config as $key => $value) {
            // Ignorar propiedades internas y responsive
            if ($key === '__sync' || $key === '_responsive' || str_starts_with($key, '_')) {
                continue;
            }

            // Ignorar propiedades en la lista de ignorados
            if (in_array($key, $ignoredProperties, true)) {
                continue;
            }

            // Manejar propiedades de spacing (padding, margin)
            if (($key === 'padding' || $key === 'margin') && is_array($value)) {
                $map = ['superior' => 'top', 'derecha' => 'right', 'inferior' => 'bottom', 'izquierda' => 'left'];
                foreach ($map as $es => $en) {
                    if (!empty($value[$es]) && gloryIsValidCssValue($value[$es])) {
                        $vars[] = $prefix . '-' . $key . '-' . $en . ': ' . gloryToCssValue($value[$es]);
                    }
                }
                continue;
            }

            // Ignorar valores vacios o arrays no manejados
            if ($value === '' || $value === null || is_array($value)) {
                continue;
            }

            // Ignorar valores que claramente son defaults invalidos
            if (!gloryIsValidCssValue($value)) {
                continue;
            }

            // Convertir camelCase a kebab-case
            $kebabKey = strtolower(preg_replace('/([a-z0-9])([A-Z])/', '$1-$2', $key));

            // Mapeo especial
            if ($key === 'maxAncho') $kebabKey = 'max-width';
            if ($key === 'fondo') $kebabKey = 'background';
            if ($key === 'layout') $kebabKey = 'display';
            if ($key === 'gridColumns') $kebabKey = 'grid-columns';

            // gridColumns es unitless
            if ($key === 'gridColumns') {
                $vars[] = $prefix . '-' . $kebabKey . ': ' . esc_attr($value);
            } else {
                $vars[] = $prefix . '-' . $kebabKey . ': ' . gloryToCssValue($value);
            }
        }

        if (!empty($vars)) {
            $css .= ':root { ' . implode('; ', $vars) . '; }' . "\n";
        }
    }

    return $css;
}

/**
 * Valida si un valor CSS es valido para un default global
 * Filtra valores que claramente son placeholders o invalidos
 */
function gloryIsValidCssValue($value): bool
{
    if ($value === null || $value === '') {
        return false;
    }

    if (is_string($value)) {
        // URLs o paths - no son valores de estilo
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, '/')) {
            return false;
        }
        // Valores placeholder tipicos
        if (in_array($value, ['_self', '_blank', 'POST', 'GET', 'text', 'email', 'tel'], true)) {
            return false;
        }
        // Valores con saltos de linea (opciones de select, etc)
        if (str_contains($value, "\n")) {
            return false;
        }
        // Valores muy largos (probablemente texto de contenido)
        if (strlen($value) > 100) {
            return false;
        }

        // Valores que son defaults tipicos de CSS - no vale la pena guardarlos
        $defaultValues = [
            // Display defaults
            'block',
            'inline',
            'inline-block',
            // Flex defaults
            'row',
            'nowrap',
            'normal',
            'stretch',
            'flex-start',
            // Size defaults  
            'none',
            'auto',
            '0px',
            '0',
            '0%',
            // Position defaults
            'static',
            'relative',
            // Border defaults
            'solid',
            'none',
            // Misc defaults
            'start',
            'visible',
            'scroll',
            'repeat',
        ];
        if (in_array($value, $defaultValues, true)) {
            return false;
        }

        // Valores que son variaciones de defaults
        if (preg_match('/^(0|0px|0%|auto|none|normal|inherit|initial|unset)$/', $value)) {
            return false;
        }

        // Valores como "0% 0%" o "auto auto"
        if (preg_match('/^(0%\s+0%|auto\s+auto|0px\s+0px)$/', trim($value))) {
            return false;
        }
    }

    // Valores numericos que son 0 o 1 (defaults tipicos)
    if (is_numeric($value)) {
        $num = (float)$value;
        if ($num === 0.0) {
            return false;
        }
        // opacity: 1 es default
        if ($num === 1.0) {
            return false;
        }
    }

    return true;
}

/**
 * Genera CSS para page settings
 */
function gloryRenderPageStyles(array $pages): string
{
    $css = '';
    $vars = [];

    if (!empty($pages['background'])) {
        $vars[] = '--gbn-page-bg: ' . esc_attr($pages['background']);
    }
    if (!empty($pages['maxAncho'])) {
        $vars[] = '--gbn-page-max-width: ' . gloryToCssValue($pages['maxAncho']);
    }

    // Padding
    if (!empty($pages['padding'])) {
        $p = $pages['padding'];
        if (is_array($p)) {
            if (!empty($p['superior'])) $vars[] = '--gbn-page-pt: ' . gloryToCssValue($p['superior']);
            if (!empty($p['derecha'])) $vars[] = '--gbn-page-pr: ' . gloryToCssValue($p['derecha']);
            if (!empty($p['inferior'])) $vars[] = '--gbn-page-pb: ' . gloryToCssValue($p['inferior']);
            if (!empty($p['izquierda'])) $vars[] = '--gbn-page-pl: ' . gloryToCssValue($p['izquierda']);
        } else {
            $vars[] = '--gbn-page-pt: ' . gloryToCssValue($p);
            $vars[] = '--gbn-page-pr: ' . gloryToCssValue($p);
            $vars[] = '--gbn-page-pb: ' . gloryToCssValue($p);
            $vars[] = '--gbn-page-pl: ' . gloryToCssValue($p);
        }
    }

    if (!empty($vars)) {
        $css .= ':root { ' . implode('; ', $vars) . '; }' . "\n";
    }

    return $css;
}

/**
 * Convierte un valor a CSS con unidad si es necesario
 * 
 * FIX: Validar que el valor no sea un array antes de convertir
 */
function gloryToCssValue($value, string $defaultUnit = 'px'): string
{
    // FIX: Ignorar arrays - no son valores CSS validos
    // Esto puede ocurrir con propiedades anidadas no manejadas
    if (is_array($value)) {
        return '';
    }

    if ($value === null || $value === '') {
        return '';
    }

    // Si ya tiene unidad o no es numerico, retornar tal cual
    if (!is_numeric($value)) {
        return esc_attr((string)$value);
    }

    // Si es numerico, agregar unidad
    return esc_attr($value) . $defaultUnit;
}
