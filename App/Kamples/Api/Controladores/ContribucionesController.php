<?php

/**
 * ContribucionesController — API REST de contribuciones comunitarias.
 *
 *   POST /contribuciones              — Crear nueva contribucion (auth requerida)
 *   GET  /contribuciones/mis          — Contribuciones del usuario autenticado
 *   GET  /admin/contribuciones        — Listar pendientes (admin)
 *   POST /admin/contribuciones/moderar — Aprobar o rechazar contribucion (admin)
 *   GET  /canciones/buscar            — Buscar canciones (para el BuscadorCanciones)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Database\Repositories\ContribucionesPendientesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Services\ContribucionesService;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\ContribucionesPendientesCols;
use App\Config\Schema\_generated\ContribucionesPendientesEnums;

class ContribucionesController
{
    public static function registrarRutas(string $namespace): void
    {
        $auth  = [AuthMiddleware::class, 'requerirAuth'];
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        /* Usuario autenticado: crear contribucion */
        \register_rest_route($namespace, '/contribuciones', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crear'],
            'permission_callback' => $auth,
            'args'                => [
                'cancion_destino_id'       => ['type' => 'integer', 'default' => null],
                'cancion_fuente_id'        => ['type' => 'integer', 'default' => null],
                'cancion_nueva_titulo'     => ['type' => 'string', 'default' => null, 'sanitize_callback' => 'sanitize_text_field'],
                'cancion_nueva_artista'    => ['type' => 'string', 'default' => null, 'sanitize_callback' => 'sanitize_text_field'],
                'cancion_nueva_youtube_url' => ['type' => 'string', 'default' => null, 'sanitize_callback' => 'esc_url_raw'],
                'cancion_nueva_lado'       => [
                    'type'              => 'string',
                    'default'           => null,
                    'validate_callback' => static fn($v) => $v === null || \in_array($v, ContribucionesPendientesEnums::TODOS_CANCION_NUEVA_LADO, true),
                ],
                'tipo_relacion' => [
                    'type'              => 'string',
                    'required'          => true,
                    'validate_callback' => static fn($v) => \in_array($v, ContribucionesPendientesEnums::TODOS_TIPO_RELACION, true),
                ],
                'tipo_elemento' => [
                    'type'    => 'string',
                    'default' => ContribucionesPendientesEnums::TIPO_ELEMENTO_MULTIPLE_ELEMENTS,
                    'validate_callback' => static fn($v) => \in_array($v, ContribucionesPendientesEnums::TODOS_TIPO_ELEMENTO, true),
                ],
            ],
        ]);

        /* Usuario autenticado: ver sus propias contribuciones */
        \register_rest_route($namespace, '/contribuciones/mis', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'mis'],
            'permission_callback' => $auth,
            'args'                => [
                'page'  => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
                'limit' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50],
            ],
        ]);

        /* Admin: listar contribuciones pendientes */
        \register_rest_route($namespace, '/admin/contribuciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarAdmin'],
            'permission_callback' => $admin,
            'args'                => [
                'page'  => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
                'limit' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50],
            ],
        ]);

        /* Admin: moderar (aprobar/rechazar) una contribucion */
        \register_rest_route($namespace, '/admin/contribuciones/moderar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'moderar'],
            'permission_callback' => $admin,
            'args'                => [
                'id'   => ['type' => 'integer', 'required' => true, 'minimum' => 1],
                'accion' => [
                    'type'              => 'string',
                    'required'          => true,
                    'validate_callback' => static fn($v) => \in_array($v, [
                        ContribucionesPendientesEnums::ESTADO_APROBADA,
                        ContribucionesPendientesEnums::ESTADO_RECHAZADA,
                    ], true),
                ],
                'nota' => ['type' => 'string', 'default' => null, 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        /* Busqueda de canciones (para BuscadorCanciones.tsx) */
        \register_rest_route($namespace, '/canciones/buscar', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'buscarCanciones'],
            'permission_callback' => '__return_true',
            'args'                => [
                'q'     => ['type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field'],
                'limit' => ['type' => 'integer', 'default' => 10, 'minimum' => 1, 'maximum' => 20],
            ],
        ]);
    }

    /**
     * POST /contribuciones — Crear contribucion pendiente.
     */
    public static function crear(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            $destinoId = $request->get_param('cancion_destino_id');
            $fuenteId  = $request->get_param('cancion_fuente_id');
            $nuevaTitulo = $request->get_param('cancion_nueva_titulo');

            /* Validacion: necesitamos ambas canciones o una existente + datos de nueva */
            $hayCancionNueva = !empty($nuevaTitulo);
            $hayAmbasExistentes = $destinoId && $fuenteId;

            if (!$hayAmbasExistentes && !$hayCancionNueva) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Faltan datos de canciones.'], 422);
            }

            /* Verificar duplicado en contribuciones pendientes */
            if ($destinoId && $fuenteId) {
                $tipoRelacion = $request->get_param('tipo_relacion');
                if (ContribucionesPendientesRepository::existeDuplicado((int) $destinoId, (int) $fuenteId, $tipoRelacion)) {
                    return new \WP_REST_Response(['ok' => false, 'error' => 'Ya existe una contribucion pendiente para esta relacion.'], 409);
                }

                /* Verificar si ya existe la relacion en relaciones_sample */
                if (RelacionesSampleRepository::existe([
                    'cancion_destino_id' => (int) $destinoId,
                    'cancion_fuente_id'  => (int) $fuenteId,
                    'tipo_relacion'      => $tipoRelacion,
                ])) {
                    return new \WP_REST_Response(['ok' => false, 'error' => 'Esta relacion ya esta registrada.'], 409);
                }
            }

            $id = ContribucionesPendientesRepository::crear([
                'contribuidor_id'          => $kamId,
                'cancion_destino_id'       => $destinoId ? (int) $destinoId : null,
                'cancion_fuente_id'        => $fuenteId  ? (int) $fuenteId  : null,
                'cancion_nueva_titulo'     => $request->get_param('cancion_nueva_titulo'),
                'cancion_nueva_artista'    => $request->get_param('cancion_nueva_artista'),
                'cancion_nueva_youtube_url' => $request->get_param('cancion_nueva_youtube_url'),
                'cancion_nueva_lado'       => $request->get_param('cancion_nueva_lado'),
                'tipo_relacion'            => $request->get_param('tipo_relacion'),
                'tipo_elemento'            => $request->get_param('tipo_elemento'),
            ]);

            if (!$id) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo guardar la contribucion.'], 500);
            }

            return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::crear error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * GET /contribuciones/mis — Contribuciones del usuario autenticado.
     */
    public static function mis(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            $page   = max(1, (int) $request->get_param('page'));
            $limit  = min(50, max(1, (int) $request->get_param('limit')));
            $offset = ($page - 1) * $limit;

            $items = ContribucionesPendientesRepository::misContribuciones($kamId, $limit, $offset);

            return new \WP_REST_Response(['ok' => true, 'items' => $items], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::mis error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * GET /admin/contribuciones — Panel admin: contribuciones pendientes.
     */
    public static function listarAdmin(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $page   = max(1, (int) $request->get_param('page'));
            $limit  = min(50, max(1, (int) $request->get_param('limit')));
            $offset = ($page - 1) * $limit;

            $items = ContribucionesPendientesRepository::listarPendientes($limit, $offset);
            $total = ContribucionesPendientesRepository::contarPendientes();

            return new \WP_REST_Response([
                'ok'    => true,
                'items' => $items,
                'total' => $total,
                'page'  => $page,
                'limit' => $limit,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::listarAdmin error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * POST /admin/contribuciones/moderar — Aprobar o rechazar contribucion.
     */
    public static function moderar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            $contribucionId = (int) $request->get_param('id');
            $accion         = $request->get_param('accion');
            $nota           = $request->get_param('nota');

            $contribucion = ContribucionesPendientesRepository::buscarPorId($contribucionId);
            if (!$contribucion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Contribucion no encontrada.'], 404);
            }

            if ($contribucion[ContribucionesPendientesCols::ESTADO] !== ContribucionesPendientesEnums::ESTADO_PENDIENTE) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Esta contribucion ya fue moderada.'], 409);
            }

            if ($accion === ContribucionesPendientesEnums::ESTADO_APROBADA) {
                $resultado = ContribucionesService::aprobar($contribucion, $kamId, $nota);
                if (!$resultado['ok']) {
                    return new \WP_REST_Response(['ok' => false, 'error' => $resultado['error']], 422);
                }
                return new \WP_REST_Response(['ok' => true, 'relacion_id' => $resultado['relacion_id'] ?? null], 200);
            }

            /* Rechazar */
            $ok = ContribucionesPendientesRepository::moderar($contribucionId, $accion, $kamId, $nota);
            return new \WP_REST_Response(['ok' => $ok], $ok ? 200 : 500);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::moderar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * GET /canciones/buscar?q=... — Buscar canciones (endpoint publico para BuscadorCanciones).
     */
    public static function buscarCanciones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $query  = \trim((string) $request->get_param('q'));
            $limit  = min(20, max(1, (int) $request->get_param('limit')));

            if (\mb_strlen($query) < 2) {
                return new \WP_REST_Response(['ok' => true, 'items' => []], 200);
            }

            $items = CancionesRepository::buscarPorTexto($query, $limit);

            return new \WP_REST_Response(['ok' => true, 'items' => $items], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::buscarCanciones error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }
}
