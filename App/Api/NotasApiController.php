<?php

/**
 * Notas API Controller
 *
 * Maneja los endpoints REST para el sistema de notas del Scratchpad
 *
 * Endpoints:
 * - GET /wp-json/glory/v1/notas -> Listar notas
 * - GET /wp-json/glory/v1/notas/{id} -> Obtener nota específica
 * - POST /wp-json/glory/v1/notas -> Guardar nueva nota
 * - PUT /wp-json/glory/v1/notas/{id} -> Actualizar nota
 * - DELETE /wp-json/glory/v1/notas/{id} -> Eliminar nota
 * - GET /wp-json/glory/v1/notas/buscar?q={query} -> Buscar notas
 *
 * @package App\Api
 */

namespace App\Api;

use App\Database\Schema;
use App\Repository\NotasRepository;

class NotasApiController
{
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registrarRutas']);
    }

    public static function registrarRutas(): void
    {
        /* Listar notas */
        register_rest_route('glory/v1', '/notas', [
            'methods' => 'GET',
            'callback' => [self::class, 'listarNotas'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'limite' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 50,
                    'sanitize_callback' => 'absint'
                ],
                'offset' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 0,
                    'sanitize_callback' => 'absint'
                ]
            ]
        ]);

        /* Obtener nota específica */
        register_rest_route('glory/v1', '/notas/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'obtenerNota'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ]
            ]
        ]);

        /* Guardar nueva nota */
        register_rest_route('glory/v1', '/notas', [
            'methods' => 'POST',
            'callback' => [self::class, 'guardarNota'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'contenido' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => function ($value) {
                        return wp_kses_post($value);
                    }
                ],
                'titulo' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field'
                ]
            ]
        ]);

        /* Actualizar nota */
        register_rest_route('glory/v1', '/notas/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [self::class, 'actualizarNota'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ],
                'contenido' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => function ($value) {
                        return wp_kses_post($value);
                    }
                ],
                'titulo' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field'
                ]
            ]
        ]);

        /* Eliminar nota */
        register_rest_route('glory/v1', '/notas/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [self::class, 'eliminarNota'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint'
                ]
            ]
        ]);

        /* Buscar notas */
        register_rest_route('glory/v1', '/notas/buscar', [
            'methods' => 'GET',
            'callback' => [self::class, 'buscarNotas'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'q' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field'
                ],
                'limite' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 20,
                    'sanitize_callback' => 'absint'
                ]
            ]
        ]);
    }

    /**
     * Verifica que el usuario este autenticado
     */
    public static function verificarPermisos(): bool
    {
        return is_user_logged_in();
    }

    /**
     * Lista las notas del usuario
     */
    public static function listarNotas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new NotasRepository($userId);

            $limite = $request->get_param('limite') ?: 50;
            $offset = $request->get_param('offset') ?: 0;

            $notas = $repo->listar($limite, $offset);
            $total = $repo->contar();

            return new \WP_REST_Response([
                'success' => true,
                'notas' => $notas,
                'total' => $total,
                'hayMas' => ($offset + count($notas)) < $total
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene una nota específica
     */
    public static function obtenerNota(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new NotasRepository($userId);

            $notaId = (int)$request->get_param('id');
            $nota = $repo->obtener($notaId);

            if (!$nota) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Nota no encontrada'
                ], 404);
            }

            return new \WP_REST_Response([
                'success' => true,
                'nota' => $nota
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guarda una nueva nota
     */
    public static function guardarNota(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new NotasRepository($userId);

            $contenido = $request->get_param('contenido');
            $titulo = $request->get_param('titulo');

            if (empty(trim($contenido))) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'El contenido no puede estar vacío'
                ], 400);
            }

            $nota = $repo->guardar($contenido, $titulo);

            if (!$nota) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Error al guardar la nota'
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true,
                'nota' => $nota
            ], 201);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualiza una nota existente
     */
    public static function actualizarNota(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new NotasRepository($userId);

            $notaId = (int)$request->get_param('id');
            $contenido = $request->get_param('contenido');
            $titulo = $request->get_param('titulo');

            if (empty(trim($contenido))) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'El contenido no puede estar vacío'
                ], 400);
            }

            $resultado = $repo->actualizar($notaId, $contenido, $titulo);

            if (!$resultado) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Nota no encontrada o error al actualizar'
                ], 404);
            }

            /* Obtener nota actualizada */
            $nota = $repo->obtener($notaId);

            return new \WP_REST_Response([
                'success' => true,
                'nota' => $nota
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Elimina una nota
     */
    public static function eliminarNota(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new NotasRepository($userId);

            $notaId = (int)$request->get_param('id');
            $resultado = $repo->eliminar($notaId);

            if (!$resultado) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Nota no encontrada o error al eliminar'
                ], 404);
            }

            return new \WP_REST_Response([
                'success' => true
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Busca notas por título o contenido
     */
    public static function buscarNotas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId = get_current_user_id();
            $repo = new NotasRepository($userId);

            $termino = $request->get_param('q');
            $limite = $request->get_param('limite') ?: 20;

            if (empty(trim($termino))) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'El término de búsqueda no puede estar vacío'
                ], 400);
            }

            $notas = $repo->buscar($termino, $limite);

            return new \WP_REST_Response([
                'success' => true,
                'notas' => $notas
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

NotasApiController::register();
