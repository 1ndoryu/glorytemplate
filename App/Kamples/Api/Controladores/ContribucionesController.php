<?php

/**
 * ContribucionesController — API REST de contribuciones comunitarias.
 *
 *   POST   /contribuciones                — Crear nueva contribucion (auth requerida)
 *   GET    /contribuciones/mis            — Contribuciones del usuario autenticado
 *   PUT    /contribuciones/{id}           — Editar contribucion propia pendiente
 *   DELETE /contribuciones/{id}           — Eliminar contribucion propia pendiente
 *   POST   /contribuciones/edicion        — Proponer edicion a relacion existente
 *   POST   /contribuciones/eliminacion    — Proponer eliminacion de relacion existente
 *   GET    /admin/contribuciones          — Listar pendientes (admin)
 *   POST   /admin/contribuciones/moderar  — Aprobar o rechazar contribucion (admin)
 *   PUT    /admin/contribuciones/{id}     — Editar cualquier contribucion (admin)
 *   DELETE /admin/contribuciones/{id}     — Eliminar cualquier contribucion (admin)
 *   PUT    /admin/relaciones/{id}         — Editar relacion directamente (admin)
 *   DELETE /admin/relaciones/{id}         — Eliminar relacion directamente (admin)
 *   GET    /canciones/buscar              — Buscar canciones (para el BuscadorCanciones)
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\Api\Helpers\RateLimiter;
use App\Kamples\Services\ServicioBan;
use App\Kamples\Database\Repositories\ContribucionesPendientesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Services\ContribucionesService;
use App\Kamples\KamplesLogger;
use App\Config\Schema\_generated\ContribucionesPendientesCols;
use App\Config\Schema\_generated\ContribucionesPendientesEnums;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Config\Schema\_generated\RelacionesSampleEnums;

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
                'timing_fuente'  => ['type' => 'integer', 'default' => null, 'minimum' => 0],
                'timing_destino' => ['type' => 'integer', 'default' => null, 'minimum' => 0],
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

        /* L6.1c: Editar contribucion propia pendiente */
        \register_rest_route($namespace, '/contribuciones/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'actualizar'],
                'permission_callback' => $auth,
                'args'                => [
                    'id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'eliminarPropia'],
                'permission_callback' => $auth,
                'args'                => [
                    'id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                ],
            ],
        ]);

        /* L6.2a: Proponer edicion a relacion existente */
        \register_rest_route($namespace, '/contribuciones/edicion', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'proponerEdicion'],
            'permission_callback' => $auth,
            'args'                => [
                'relacion_id'     => ['type' => 'integer', 'required' => true, 'minimum' => 1],
                'cambios'         => ['type' => 'object', 'required' => true],
            ],
        ]);

        /* L6.2a: Proponer eliminacion de relacion existente */
        \register_rest_route($namespace, '/contribuciones/eliminacion', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'proponerEliminacion'],
            'permission_callback' => $auth,
            'args'                => [
                'relacion_id' => ['type' => 'integer', 'required' => true, 'minimum' => 1],
                'razon'       => ['type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_textarea_field'],
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

        /* L6.4a: Admin CRUD de contribuciones (PUT/DELETE por ID) */
        \register_rest_route($namespace, '/admin/contribuciones/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'actualizarAdmin'],
                'permission_callback' => $admin,
                'args'                => [
                    'id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'eliminarAdmin'],
                'permission_callback' => $admin,
                'args'                => [
                    'id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                ],
            ],
        ]);

        /* L6.4b: Admin CRUD de relaciones (PUT/DELETE por ID) */
        \register_rest_route($namespace, '/admin/relaciones/(?P<id>\d+)', [
            [
                'methods'             => 'PUT',
                'callback'            => [self::class, 'actualizarRelacionAdmin'],
                'permission_callback' => $admin,
                'args'                => [
                    'id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                ],
            ],
            [
                'methods'             => 'DELETE',
                'callback'            => [self::class, 'eliminarRelacionAdmin'],
                'permission_callback' => $admin,
                'args'                => [
                    'id' => ['required' => true, 'type' => 'integer', 'minimum' => 1],
                ],
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

            /* QQ10: Rate limit — 20 contribuciones por hora */
            $limitResp = RateLimiter::verificarUsuario($kamId, 'crear_contribucion', 20, 3600);
            if ($limitResp) return $limitResp;

            /* QQ10: Verificar ban activo */
            $ban = ServicioBan::verificarBan($kamId);
            if ($ban) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Cuenta temporalmente suspendida.'], 403);
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

            /* Construir cambios_propuestos con timings si se proporcionan */
            $cambiosPropuestos = null;
            $timingFuente  = $request->get_param('timing_fuente');
            $timingDestino = $request->get_param('timing_destino');
            if ($timingFuente !== null || $timingDestino !== null) {
                $datos = [];
                if ($timingFuente !== null)  $datos['timings_fuente']  = [(int) $timingFuente];
                if ($timingDestino !== null) $datos['timings_destino'] = [(int) $timingDestino];
                $cambiosPropuestos = \wp_json_encode($datos);
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
                'cambios_propuestos'       => $cambiosPropuestos,
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

            $items = ContribucionesPendientesRepository::listarPendientesAdmin($limit, $offset);
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
                /* Determinar tipo de contribucion y delegar al service correspondiente */
                $tipoContribucion = $contribucion[ContribucionesPendientesCols::TIPO_CONTRIBUCION]
                    ?? ContribucionesPendientesEnums::TIPO_CONTRIBUCION_NUEVA;

                if ($tipoContribucion === ContribucionesPendientesEnums::TIPO_CONTRIBUCION_EDICION) {
                    $resultado = ContribucionesService::aplicarEdicion($contribucion, $kamId, $nota);
                } elseif ($tipoContribucion === ContribucionesPendientesEnums::TIPO_CONTRIBUCION_ELIMINACION) {
                    $resultado = ContribucionesService::aplicarEliminacion($contribucion, $kamId, $nota);
                } else {
                    $resultado = ContribucionesService::aprobar($contribucion, $kamId, $nota);
                }

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

            $items = CancionesRepository::buscarTexto($query, $limit);

            return new \WP_REST_Response(['ok' => true, 'items' => $items], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::buscarCanciones error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * PUT /contribuciones/{id} — Editar contribucion propia pendiente (L6.1c).
     * Solo el contribuidor original puede editar, y solo si estado='pendiente'.
     */
    public static function actualizar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            /* QQ10: Rate limit ediciones — 20 por hora */
            $limitResp = RateLimiter::verificarUsuario($kamId, 'editar_contribucion', 20, 3600);
            if ($limitResp) return $limitResp;

            $id = (int) $request->get_param('id');
            $body = $request->get_json_params();

            /* Sanitizar campos editables */
            $datosActualizados = [];
            $camposSanitizar = [
                'cancion_nueva_titulo'   => 'sanitize_text_field',
                'cancion_nueva_artista'  => 'sanitize_text_field',
                'cancion_nueva_youtube_url' => 'esc_url_raw',
            ];

            foreach ($camposSanitizar as $campo => $sanitizer) {
                if (isset($body[$campo])) {
                    $datosActualizados[$campo] = $sanitizer($body[$campo]);
                }
            }

            /* Campos con whitelist de valores validos */
            if (isset($body['tipo_relacion']) && \in_array($body['tipo_relacion'], ContribucionesPendientesEnums::TODOS_TIPO_RELACION, true)) {
                $datosActualizados['tipo_relacion'] = $body['tipo_relacion'];
            }
            if (isset($body['tipo_elemento']) && \in_array($body['tipo_elemento'], ContribucionesPendientesEnums::TODOS_TIPO_ELEMENTO, true)) {
                $datosActualizados['tipo_elemento'] = $body['tipo_elemento'];
            }
            if (isset($body['cancion_nueva_lado']) && \in_array($body['cancion_nueva_lado'], ContribucionesPendientesEnums::TODOS_CANCION_NUEVA_LADO, true)) {
                $datosActualizados['cancion_nueva_lado'] = $body['cancion_nueva_lado'];
            }
            if (isset($body['cancion_destino_id'])) {
                $datosActualizados['cancion_destino_id'] = (int) $body['cancion_destino_id'] ?: null;
            }
            if (isset($body['cancion_fuente_id'])) {
                $datosActualizados['cancion_fuente_id'] = (int) $body['cancion_fuente_id'] ?: null;
            }

            if (empty($datosActualizados)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se enviaron campos para actualizar.'], 422);
            }

            $ok = ContribucionesPendientesRepository::actualizarPendiente($id, $kamId, $datosActualizados);
            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo actualizar. Verifica que la contribucion sea tuya y este pendiente.'], 403);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::actualizar error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * DELETE /contribuciones/{id} — Eliminar contribucion propia pendiente (L6.1c).
     */
    public static function eliminarPropia(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            $id = (int) $request->get_param('id');

            $ok = ContribucionesPendientesRepository::eliminarPendiente($id, $kamId);
            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo eliminar. Verifica que la contribucion sea tuya y este pendiente.'], 403);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::eliminarPropia error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * POST /contribuciones/edicion — Proponer edicion a relacion existente (L6.2a).
     * Cualquier usuario autenticado puede sugerir cambios a cualquier relacion.
     */
    public static function proponerEdicion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            /* QQ10: Rate limit — 10 propuestas de edición por hora */
            $limitResp = RateLimiter::verificarUsuario($kamId, 'proponer_edicion', 10, 3600);
            if ($limitResp) return $limitResp;

            /* QQ10: Verificar ban activo */
            $ban = ServicioBan::verificarBan($kamId);
            if ($ban) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Cuenta temporalmente suspendida.'], 403);
            }

            $relacionId = (int) $request->get_param('relacion_id');
            $cambiosRaw = $request->get_param('cambios');

            /* Verificar que la relacion existe */
            $relacion = RelacionesSampleRepository::buscarPorId($relacionId);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relacion no encontrada.'], 404);
            }

            /* Verificar duplicado: misma relacion, mismo usuario, pendiente */
            if (ContribucionesPendientesRepository::existeEdicionPendiente($relacionId, $kamId)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Ya tienes una edicion pendiente para esta relacion.'], 409);
            }

            /* Validar y sanitizar cambios propuestos */
            $cambiosValidos = [];
            if (isset($cambiosRaw['tipo_relacion']) && \in_array($cambiosRaw['tipo_relacion'], ContribucionesPendientesEnums::TODOS_TIPO_RELACION, true)) {
                $cambiosValidos['tipo_relacion'] = $cambiosRaw['tipo_relacion'];
            }
            if (isset($cambiosRaw['tipo_elemento']) && \in_array($cambiosRaw['tipo_elemento'], ContribucionesPendientesEnums::TODOS_TIPO_ELEMENTO, true)) {
                $cambiosValidos['tipo_elemento'] = $cambiosRaw['tipo_elemento'];
            }
            if (isset($cambiosRaw['razon']) && \is_string($cambiosRaw['razon'])) {
                $cambiosValidos['razon'] = \sanitize_textarea_field($cambiosRaw['razon']);
            }

            if (empty($cambiosValidos)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se enviaron cambios validos.'], 422);
            }

            $id = ContribucionesPendientesRepository::crearEdicion($kamId, $relacionId, $cambiosValidos);
            if (!$id) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo crear la propuesta de edicion.'], 500);
            }

            return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::proponerEdicion error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * POST /contribuciones/eliminacion — Proponer eliminacion de relacion existente (L6.2a).
     */
    public static function proponerEliminacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $kamId = UsuarioHelper::obtenerIdPg();
            if (!$kamId) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Usuario no encontrado.'], 401);
            }

            /* QQ10: Rate limit — 10 propuestas de eliminación por hora */
            $limitResp = RateLimiter::verificarUsuario($kamId, 'proponer_eliminacion', 10, 3600);
            if ($limitResp) return $limitResp;

            /* QQ10: Verificar ban activo */
            $ban = ServicioBan::verificarBan($kamId);
            if ($ban) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Cuenta temporalmente suspendida.'], 403);
            }

            $relacionId = (int) $request->get_param('relacion_id');
            $razon      = \trim((string) $request->get_param('razon'));

            if (\mb_strlen($razon) < 10) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'La razon debe tener al menos 10 caracteres.'], 422);
            }

            /* Verificar que la relacion existe */
            $relacion = RelacionesSampleRepository::buscarPorId($relacionId);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relacion no encontrada.'], 404);
            }

            /* Verificar duplicado */
            if (ContribucionesPendientesRepository::existeEdicionPendiente($relacionId, $kamId)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Ya tienes una propuesta pendiente para esta relacion.'], 409);
            }

            $id = ContribucionesPendientesRepository::crearEliminacion($kamId, $relacionId, $razon);
            if (!$id) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo crear la propuesta de eliminacion.'], 500);
            }

            return new \WP_REST_Response(['ok' => true, 'id' => $id], 201);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::proponerEliminacion error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * PUT /admin/contribuciones/{id} — Admin: editar cualquier contribucion (L6.4a).
     */
    public static function actualizarAdmin(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id   = (int) $request->get_param('id');
            $body = $request->get_json_params();

            $datosActualizados = [];

            /* Sanitizar campos editables por admin */
            $camposSanitizar = [
                'cancion_nueva_titulo'   => 'sanitize_text_field',
                'cancion_nueva_artista'  => 'sanitize_text_field',
                'cancion_nueva_youtube_url' => 'esc_url_raw',
                'moderador_nota'         => 'sanitize_textarea_field',
            ];

            foreach ($camposSanitizar as $campo => $sanitizer) {
                if (isset($body[$campo])) {
                    $datosActualizados[$campo] = $sanitizer($body[$campo]);
                }
            }

            if (isset($body['tipo_relacion']) && \in_array($body['tipo_relacion'], ContribucionesPendientesEnums::TODOS_TIPO_RELACION, true)) {
                $datosActualizados['tipo_relacion'] = $body['tipo_relacion'];
            }
            if (isset($body['tipo_elemento']) && \in_array($body['tipo_elemento'], ContribucionesPendientesEnums::TODOS_TIPO_ELEMENTO, true)) {
                $datosActualizados['tipo_elemento'] = $body['tipo_elemento'];
            }
            if (isset($body['estado']) && \in_array($body['estado'], ContribucionesPendientesEnums::TODOS_ESTADO, true)) {
                $datosActualizados['estado'] = $body['estado'];
            }

            if (empty($datosActualizados)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se enviaron campos para actualizar.'], 422);
            }

            $ok = ContribucionesPendientesRepository::actualizarAdmin($id, $datosActualizados);
            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Contribucion no encontrada.'], 404);
            }

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::actualizarAdmin error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * DELETE /admin/contribuciones/{id} — Admin: eliminar cualquier contribucion (L6.4a).
     */
    public static function eliminarAdmin(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');

            $ok = ContribucionesPendientesRepository::eliminarAdmin($id);
            if (!$ok) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Contribucion no encontrada.'], 404);
            }

            KamplesLogger::info('Admin: contribucion eliminada', ['id' => $id]);
            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::eliminarAdmin error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * PUT /admin/relaciones/{id} — Admin: editar relacion directamente (L6.4b).
     */
    public static function actualizarRelacionAdmin(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id   = (int) $request->get_param('id');
            $body = $request->get_json_params();

            $relacion = RelacionesSampleRepository::buscarPorId($id);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relacion no encontrada.'], 404);
            }

            $datosActualizados = [];

            if (isset($body['tipo_relacion']) && \in_array($body['tipo_relacion'], RelacionesSampleEnums::TODOS_TIPO_RELACION, true)) {
                $datosActualizados[RelacionesSampleCols::TIPO_RELACION] = $body['tipo_relacion'];
            }
            if (isset($body['tipo_elemento']) && \in_array($body['tipo_elemento'], RelacionesSampleEnums::TODOS_TIPO_ELEMENTO, true)) {
                $datosActualizados[RelacionesSampleCols::TIPO_ELEMENTO] = $body['tipo_elemento'];
            }
            if (isset($body['verificada'])) {
                $datosActualizados[RelacionesSampleCols::VERIFICADA] = (bool) $body['verificada'];
            }

            if (empty($datosActualizados)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se enviaron campos para actualizar.'], 422);
            }

            RelacionesSampleRepository::actualizarPorId($id, $datosActualizados);
            KamplesLogger::info('Admin: relacion actualizada', ['id' => $id, 'campos' => \array_keys($datosActualizados)]);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::actualizarRelacionAdmin error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * DELETE /admin/relaciones/{id} — Admin: eliminar relacion directamente (L6.4b).
     */
    public static function eliminarRelacionAdmin(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');

            $relacion = RelacionesSampleRepository::buscarPorId($id);
            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relacion no encontrada.'], 404);
            }

            RelacionesSampleRepository::eliminarPorId($id);
            KamplesLogger::info('Admin: relacion eliminada', ['id' => $id]);

            return new \WP_REST_Response(['ok' => true], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ContribucionesController::eliminarRelacionAdmin error', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }
}
