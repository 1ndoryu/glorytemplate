<?php

namespace App\Handlers;

use Glory\Components\ContentRender;

// error_log("ContentAjaxHandler.php loaded");

class ContentAjaxHandler
{
    public static function register(): void
    {
        // error_log("ContentAjaxHandler::register called");
        add_action('wp_ajax_obtenerHtmlPost', [self::class, 'handle_get_post_html']);
        add_action('wp_ajax_nopriv_obtenerHtmlPost', [self::class, 'handle_get_post_html']);

        add_action('wp_ajax_obtenerHtmlLista', [self::class, 'handle_get_list_html']);
        add_action('wp_ajax_nopriv_obtenerHtmlLista', [self::class, 'handle_get_list_html']);
    }

    public static function handle_get_post_html(): void
    {
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $tipo = isset($_POST['tipo']) ? sanitize_text_field($_POST['tipo']) : 'post';

        if ($id <= 0) {
            wp_send_json_error(['message' => 'ID inválido']);
            return;
        }

        $callback = null;
        $includeFile = null;

        switch ($tipo) {
            case 'tarea':
                $callback = 'plantillaTarea';
                $includeFile = get_template_directory() . '/App/Templates/task/taskItem.php';
                break;
            default:
                $callback = [ContentRender::class, 'defaultTemplate'];
                break;
        }

        if ($includeFile && is_readable($includeFile)) {
            require_once $includeFile;
        }

        if (!is_callable($callback)) {
            wp_send_json_error(['message' => 'Plantilla no disponible para tipo: ' . $tipo]);
            return;
        }

        $the_post = get_post($id);
        if (!$the_post) {
            wp_send_json_error(['message' => 'Post no encontrado']);
            return;
        }

        global $post;
        $post = $the_post;
        setup_postdata($post);

        ob_start();
        $itemClass = ($tipo === 'tarea') ? 'tareaItem tarea-item' : 'glory-content-item';
        call_user_func($callback, $the_post, $itemClass);
        $html = ob_get_clean();

        wp_reset_postdata();

        // Enviar el HTML directamente como data para evitar data anidada innecesaria
        wp_send_json_success($html);
    }

    public static function handle_get_list_html(): void
    {
        // error_log("ContentAjaxHandler::handle_get_list_html called");

        // Recopilar todas las opciones posibles
        $options = $_POST;

        // Normalizar nombres de claves si es necesario (gbnDefaults usa camelCase o snake_case, ContentRenderCss espera snake_case mayormente)
        // Por ahora pasamos todo $_POST como args.

        $postType = isset($options['postType']) ? sanitize_text_field($options['postType']) : (isset($options['tipo']) ? sanitize_text_field($options['tipo']) : 'post');
        $plantilla = isset($options['plantilla']) ? sanitize_text_field($options['plantilla']) : null;
        $contenedor = isset($options['claseContenedor']) ? sanitize_text_field($options['claseContenedor']) : 'glory-content-list';
        $itemClass = isset($options['claseItem']) ? sanitize_text_field($options['claseItem']) : 'glory-content-item';
        $ppp = isset($options['publicacionesPorPagina']) ? intval($options['publicacionesPorPagina']) : 10;

        // Decodificar argumentos de consulta si vienen como JSON
        $argsJson = isset($options['argumentosConsulta']) ? wp_unslash($options['argumentosConsulta']) : '';
        $argumentosConsulta = [];
        if (!empty($argsJson)) {
            $decoded = json_decode($argsJson, true);
            if (is_array($decoded)) {
                $argumentosConsulta = $decoded;
            }
        }

        $callback = $plantilla;
        $includeFile = null;
        if (!$callback) {
            switch ($postType) {
                case 'tarea':
                    $callback = 'plantillaTarea';
                    $includeFile = get_template_directory() . '/App/Templates/task/taskItem.php';
                    $contenedor = $contenedor ?: 'listaTareas bloque';
                    $itemClass = $itemClass ?: 'tareaItem';
                    break;
                default:
                    $callback = [ContentRender::class, 'defaultTemplate'];
                    break;
            }
        } else {
            // 1. Try TemplateRegistry (registered via code)
            if (class_exists(\Glory\Utility\TemplateRegistry::class)) {
                $resolvedCallback = \Glory\Utility\TemplateRegistry::get($plantilla);
                if ($resolvedCallback) {
                    $callback = $resolvedCallback;
                }
            }

            // 2. Try TemplateManager (scans files)
            if (!$callback && class_exists(\Glory\Manager\TemplateManager::class)) {
                $resolvedCallback = \Glory\Manager\TemplateManager::getTemplateCallback($plantilla);
                if ($resolvedCallback) {
                    $callback = $resolvedCallback;
                }
            }
        }

        if ($includeFile && is_readable($includeFile)) {
            require_once $includeFile;
        }

        if (!is_callable($callback)) {
            wp_send_json_error(['message' => 'Plantilla no disponible']);
            return;
        }

        // Aplicar ordenamiento personalizado para 'tarea'
        if ($postType === 'tarea' && function_exists('ordenamientoTareas')) {
            $usuarioId = get_current_user_id();
            $argumentosConsulta = ordenamientoTareas($argumentosConsulta, $usuarioId, []);
        }

        // Generar CSS dinámico si la clase ContentRenderCss existe
        $css = '';
        if (class_exists(\Glory\Support\CSS\ContentRenderCss::class)) {
            // Generar un ID único para esta instancia si no viene uno
            $instanceId = isset($options['instanceId']) ? sanitize_key($options['instanceId']) : 'gbn-cr-' . uniqid();
            // Asegurar que la clase del contenedor incluya este ID para que el CSS aplique
            // NOTA: ContentRender::print usa 'instanceClass' para generar la clase única.
            // Debemos pasar este ID como 'instanceClass' para que coincidan.

            // Preparar argumentos para el builder de CSS
            // Mapear opciones de GBN a lo que espera ContentRenderCss si hay discrepancias
            $cssArgs = array_merge($options, [
                'display_mode' => $options['display_mode'] ?? 'flex',
                'flex_direction' => $options['flex_direction'] ?? 'row',
                'flex_wrap' => $options['flex_wrap'] ?? 'wrap',
                'gap' => $options['gap'] ?? '20px',
                'grid_columns' => $options['grid_columns'] ?? 4,
                'justify_content' => $options['justify_content'] ?? 'flex-start',
                'align_items' => $options['align_items'] ?? 'stretch',
                // Añadir más mapeos según sea necesario
            ]);

            $css = \Glory\Support\CSS\ContentRenderCss::build(
                $instanceId,
                $cssArgs,
                $cssArgs, // instanceConfig
                $options['interaccion_modo'] ?? 'normal'
            );

            if (!empty($css)) {
                $css = '<style>' . $css . '</style>';
            }
        }

        ob_start();
        ContentRender::print($postType, [
            'publicacionesPorPagina' => $ppp,
            'claseContenedor' => $contenedor,
            'claseItem' => $itemClass,
            'paginacion' => false,
            'plantillaCallback' => $callback,
            'argumentosConsulta' => $argumentosConsulta,
            'forzarSinCache' => true,
            // Pasar el ID de instancia para que ContentRender use la misma clase que usamos para el CSS
            'instanceClass' => $instanceId,
            // Pasar todas las opciones al render por si la plantilla las usa
            'imgSize' => $options['img_size'] ?? 'medium',
            'imgOptimize' => true, // Always optimize if showing
            'img_show' => isset($options['img_show']) ? filter_var($options['img_show'], FILTER_VALIDATE_BOOLEAN) : true,
            'title_show' => isset($options['title_show']) ? filter_var($options['title_show'], FILTER_VALIDATE_BOOLEAN) : true,
            // ... otros
        ] + $options); // Fusionar resto de opciones
        $html = ob_get_clean();

        // Enviar el HTML con el CSS prepuesto
        wp_send_json_success($css . $html);
    }
}
