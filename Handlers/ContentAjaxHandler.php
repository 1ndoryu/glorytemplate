<?php

namespace App\Handlers;

use Glory\Components\ContentRender;

class ContentAjaxHandler
{
    public static function register(): void
    {
        add_action('wp_ajax_obtenerHtmlPost', [self::class, 'handle_get_post_html']);
        add_action('wp_ajax_nopriv_obtenerHtmlPost', [self::class, 'handle_get_post_html']);

        add_action('wp_ajax_obtenerHtmlLista', [self::class, 'handle_get_list_html']);
        add_action('wp_ajax_nopriv_obtenerHtmlLista', [self::class, 'handle_get_list_html']);
    }

    public static function handle_get_post_html(): void
    {
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        $tipo = isset($_POST['tipo']) ? sanitize_text_field($_POST['tipo']) : 'post';
        $plantilla = isset($_POST['plantilla']) ? sanitize_text_field($_POST['plantilla']) : '';

        if ($id <= 0) {
            wp_send_json_error(['message' => 'ID inválido']);
            return;
        }

        $callback = null;
        $includeFile = null;

        // Selección de plantilla/callback
        if ($plantilla === 'full') {
            $callback = [ContentRender::class, 'fullContentTemplate'];
        } else {
            switch ($tipo) {
                case 'tarea':
                    $callback = 'plantillaTarea';
                    $includeFile = get_template_directory() . '/App/Templates/task/taskItem.php';
                    break;
                default:
                    $callback = [ContentRender::class, 'defaultTemplate'];
                    break;
            }
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
        $postType = isset($_POST['postType']) ? sanitize_text_field($_POST['postType']) : (isset($_POST['tipo']) ? sanitize_text_field($_POST['tipo']) : 'post');
        $plantilla = isset($_POST['plantilla']) ? sanitize_text_field($_POST['plantilla']) : null;
        $contenedor = isset($_POST['claseContenedor']) ? sanitize_text_field($_POST['claseContenedor']) : 'glory-content-list';
        $itemClass = isset($_POST['claseItem']) ? sanitize_text_field($_POST['claseItem']) : 'glory-content-item';
        $ppp = isset($_POST['publicacionesPorPagina']) ? intval($_POST['publicacionesPorPagina']) : 10;
        $argsJson = isset($_POST['argumentosConsulta']) ? wp_unslash($_POST['argumentosConsulta']) : '';
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
        }

        if ($includeFile && is_readable($includeFile)) {
            require_once $includeFile;
        }

        if (!is_callable($callback)) {
            wp_send_json_error(['message' => 'Plantilla no disponible']);
            return;
        }

        // Aplicar ordenamiento personalizado para 'tarea' de forma agnóstica
        if ($postType === 'tarea' && function_exists('ordenamientoTareas')) {
            $usuarioId = get_current_user_id();
            $argumentosConsulta = ordenamientoTareas($argumentosConsulta, $usuarioId, []);
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
        ]);
        $html = ob_get_clean();

        // Enviar el HTML directamente como data para evitar data anidada innecesaria
        wp_send_json_success($html);
    }
}


