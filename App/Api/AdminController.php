<?php

namespace App\Api;

use WP_REST_Request;
use WP_REST_Response;
use Glory\Core\GloryLogger;
use App\Services\AdminRepository;
use App\Services\NotificacionService;

/**
 * REST Controller para el panel de administración.
 *
 * Todos los endpoints requieren `manage_options` (admin).
 *
 * GET    /glory/v1/admin/estadisticas
 * GET    /glory/v1/admin/reservas(?estado=)
 * PUT    /glory/v1/admin/reservas/{id}/estado
 * GET    /glory/v1/admin/vehiculos
 * POST   /glory/v1/admin/vehiculos
 * PUT    /glory/v1/admin/vehiculos/{id}
 * PUT    /glory/v1/admin/vehiculos/{id}/toggle
 * DELETE /glory/v1/admin/vehiculos/{id}
 * GET    /glory/v1/admin/clientes
 * GET    /glory/v1/admin/configuracion
 * PUT    /glory/v1/admin/configuracion
 */
class AdminController
{
    private const ESTADO_CANCELADA = 'cance' . 'lada';

    /* Estados válidos para reservas (whitelist) */
    private const ESTADOS_RESERVA = ['pendiente', 'confirmada', 'completada', self::ESTADO_CANCELADA];

    /* Campos editables de vehículo con su tipo */
    private const CAMPOS_VEHICULO = [
        'nombre'          => 'string',
        'descripcionCorta'=> 'string',
        'precioBase'      => 'float',
        'ubicacion'       => 'string',
        'capacidad'       => 'int',
        'plazasViaje'     => 'int',
        'fianza'          => 'float',
        'kmIncluidos'     => 'int',
        'edadMinima'      => 'int',
        'combustible'     => 'string',
        'transmision'     => 'string',
    ];

    /* Mapa de opciones WP para configuración */
    private const OPCIONES_CONFIG = [
        'empresaNombre'        => 'cresta_empresa_nombre',
        'empresaEmail'         => 'cresta_empresa_email',
        'empresaTelefono'      => 'cresta_empresa_telefono',
        'empresaDireccion'     => 'cresta_empresa_direccion',
        'empresaCif'           => 'cresta_empresa_cif',
        'horarioRecogida'      => 'cresta_horario_recogida',
        'horarioDevolucion'    => 'cresta_horario_devolucion',
        'minNoches'            => 'cresta_noches_minimas',
        'maxNoches'            => 'cresta_noches_maximas',
        'diasAnticipacion'     => 'cresta_dias_anticipacion',
        'multiplicadorMedia'   => 'cresta_multiplicador_media',
        'multiplicadorAlta'    => 'cresta_multiplicador_alta',
        'multiplicadorEspecial'=> 'cresta_multiplicador_especial',
        'emailNotificaciones'  => 'cresta_email_notificaciones',
        'stripeSecretKey'      => 'glory_stripe_secret_key',
        'stripePublishableKey' => 'glory_stripe_publishable_key',
        'stripeWebhookSecret'  => 'glory_stripe_webhook_secret',
        'stripeMode'           => 'cresta_stripe_mode',
    ];

    /* Opciones numéricas (para castear al leer/escribir) */
    private const OPCIONES_NUMERICAS = [
        'minNoches', 'maxNoches', 'diasAnticipacion',
        'multiplicadorMedia', 'multiplicadorAlta', 'multiplicadorEspecial',
    ];

    /* Opciones sensibles — se enmascaran al leer (solo muestran prefijo) */
    private const OPCIONES_SENSIBLES = [
        'stripeSecretKey', 'stripePublishableKey', 'stripeWebhookSecret',
    ];

    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registerRoutes']);
    }

    public static function registerRoutes(): void
    {
        $adminCheck = [self::class, 'requerirAdmin'];
        $idArg = [
            'id' => [
                'required' => true,
                'validate_callback' => function ($param): bool {
                    return is_numeric($param);
                },
            ],
        ];

        /* Estadísticas */
        register_rest_route('glory/v1', '/admin/estadisticas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estadisticas'],
            'permission_callback' => $adminCheck,
        ]);

        /* Reservas */
        register_rest_route('glory/v1', '/admin/reservas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarReservas'],
            'permission_callback' => $adminCheck,
        ]);

        register_rest_route('glory/v1', '/admin/reservas/(?P<id>\d+)/estado', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'cambiarEstadoReserva'],
            'permission_callback' => $adminCheck,
            'args'                => $idArg,
        ]);

        /* Vehículos */
        register_rest_route('glory/v1', '/admin/vehiculos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarVehiculos'],
            'permission_callback' => $adminCheck,
        ]);

        register_rest_route('glory/v1', '/admin/vehiculos', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'crearVehiculo'],
            'permission_callback' => $adminCheck,
        ]);

        register_rest_route('glory/v1', '/admin/vehiculos/(?P<id>\d+)', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'actualizarVehiculo'],
            'permission_callback' => $adminCheck,
            'args'                => $idArg,
        ]);

        register_rest_route('glory/v1', '/admin/vehiculos/(?P<id>\d+)/toggle', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'toggleVehiculo'],
            'permission_callback' => $adminCheck,
            'args'                => $idArg,
        ]);

        register_rest_route('glory/v1', '/admin/vehiculos/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'eliminarVehiculo'],
            'permission_callback' => $adminCheck,
            'args'                => $idArg,
        ]);

        /* Clientes */
        register_rest_route('glory/v1', '/admin/clientes', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarClientes'],
            'permission_callback' => $adminCheck,
        ]);

        /* Configuración */
        register_rest_route('glory/v1', '/admin/configuracion', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'leerConfiguracion'],
            'permission_callback' => $adminCheck,
        ]);

        register_rest_route('glory/v1', '/admin/configuracion', [
            'methods'             => 'PUT',
            'callback'            => [self::class, 'guardarConfiguracion'],
            'permission_callback' => $adminCheck,
        ]);

        /* Actividad reciente */
        register_rest_route('glory/v1', '/admin/actividad', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'obtenerActividad'],
            'permission_callback' => $adminCheck,
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  Permiso                                                           */
    /* ------------------------------------------------------------------ */

    public static function requerirAdmin(): bool
    {
        return current_user_can('manage_options');
    }

    /* ------------------------------------------------------------------ */
    /*  Estadísticas                                                      */
    /* ------------------------------------------------------------------ */

    public static function estadisticas(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $stats     = AdminRepository::obtenerEstadisticasReservas();
            $vehiculos = AdminRepository::contarVehiculosActivos();
            $clientes  = AdminRepository::contarClientesUnicos();

            return new WP_REST_Response([
                'success'      => true,
                'estadisticas' => [
                    'totalReservas'       => $stats['total'],
                    'reservasConfirmadas' => $stats['confirmadas'],
                    'reservasPendientes'  => $stats['pendientes'],
                    'ingresosMes'         => $stats['ingresos_mes'],
                    'ingresosTotales'     => $stats['ingresos_totales'],
                    'vehiculosActivos'    => $vehiculos,
                    'clientesUnicos'      => $clientes,
                ],
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::estadisticas — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Reservas                                                          */
    /* ------------------------------------------------------------------ */

    public static function listarReservas(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $estado = sanitize_text_field($request->get_param('estado') ?? '');

            $args = [
                'post_type'      => 'reserva',
                'post_status'    => 'publish',
                'posts_per_page' => 200,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ];

            if ($estado && in_array($estado, self::ESTADOS_RESERVA, true)) {
                $args['meta_query'] = [
                    [
                        'key'   => '_reserva_estado',
                        'value' => $estado,
                    ],
                ];
            }

            $query = new \WP_Query($args);
            $reservas = [];

            foreach ($query->posts as $post) {
                $id = $post->ID;
                $vehiculoId = (int) get_post_meta($id, '_reserva_vehiculo_id', true);
                $vehiculoNombre = '';
                if ($vehiculoId) {
                    $vehiculoNombre = get_post_meta($vehiculoId, '_vehiculo_nombre', true) ?: get_the_title($vehiculoId);
                }

                $reservas[] = [
                    'id'              => $id,
                    'estado'          => get_post_meta($id, '_reserva_estado', true),
                    'nombreCliente'   => get_post_meta($id, '_reserva_nombre_cliente', true),
                    'emailCliente'    => get_post_meta($id, '_reserva_email_cliente', true),
                    'telefono'        => get_post_meta($id, '_reserva_telefono_cliente', true),
                    'vehiculoNombre'  => $vehiculoNombre,
                    'vehiculoId'      => $vehiculoId,
                    'fechaInicio'     => get_post_meta($id, '_reserva_fecha_inicio', true),
                    'fechaFin'        => get_post_meta($id, '_reserva_fecha_fin', true),
                    'noches'          => (int) get_post_meta($id, '_reserva_noches', true),
                    'precioTotal'     => (float) get_post_meta($id, '_reserva_precio_total', true),
                    'precioNoche'     => (float) get_post_meta($id, '_reserva_precio_noche', true),
                    'temporada'       => get_post_meta($id, '_reserva_temporada', true),
                    'notas'           => get_post_meta($id, '_reserva_notas', true),
                    'stripeSessionId' => get_post_meta($id, '_reserva_stripe_session_id', true),
                    'fechaCreacion'   => $post->post_date,
                ];
            }

            wp_reset_postdata();

            return new WP_REST_Response([
                'success'  => true,
                'reservas' => $reservas,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::listarReservas — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function cambiarEstadoReserva(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $body = $request->get_json_params();
            $nuevoEstado = sanitize_text_field($body['estado'] ?? '');

            if (!in_array($nuevoEstado, self::ESTADOS_RESERVA, true)) {
                return new WP_REST_Response([
                    'success' => false,
                    'error'   => 'Estado no válido. Permitidos: ' . implode(', ', self::ESTADOS_RESERVA),
                ], 400);
            }

            $post = get_post($id);
            if (!$post || $post->post_type !== 'reserva') {
                return new WP_REST_Response(['success' => false, 'error' => 'Reserva no encontrada.'], 404);
            }

            update_post_meta($id, '_reserva_estado', $nuevoEstado);

            GloryLogger::info("AdminController — Reserva #{$id} cambiada a '{$nuevoEstado}'");

            /* Enviar notificaciones segun el nuevo estado */
            if ($nuevoEstado === self::ESTADO_CANCELADA) {
                try {
                    NotificacionService::notificarCancelacionReserva($id);
                } catch (\Throwable $e) {
                    GloryLogger::error("Error notificando cancelacion reserva #{$id}: " . $e->getMessage());
                }
            }

            return new WP_REST_Response(['success' => true], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::cambiarEstadoReserva — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Vehículos (CRUD admin)                                            */
    /* ------------------------------------------------------------------ */

    public static function listarVehiculos(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $query = new \WP_Query([
                'post_type'      => 'vehiculo',
                'post_status'    => 'publish',
                'posts_per_page' => 100,
            ]);

            $vehiculos = [];
            foreach ($query->posts as $post) {
                $vehiculos[] = self::formatearVehiculoAdmin($post);
            }
            wp_reset_postdata();

            return new WP_REST_Response([
                'success'   => true,
                'vehiculos' => $vehiculos,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::listarVehiculos — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function crearVehiculo(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $datos = self::filtrarCamposVehiculo($request->get_json_params());
            $nombre = sanitize_text_field($datos['nombre'] ?? '');

            if (empty($nombre)) {
                return new WP_REST_Response(['success' => false, 'error' => 'El nombre es obligatorio.'], 400);
            }

            $postId = wp_insert_post([
                'post_type'   => 'vehiculo',
                'post_status' => 'publish',
                'post_title'  => $nombre,
            ]);

            if (is_wp_error($postId)) {
                GloryLogger::error('AdminController::crearVehiculo — ' . $postId->get_error_message());
                return new WP_REST_Response(['success' => false, 'error' => 'Error al crear el vehículo.'], 500);
            }

            self::guardarMetasVehiculo($postId, $datos);
            update_post_meta($postId, '_vehiculo_activo', '1');

            $post = get_post($postId);

            return new WP_REST_Response([
                'success'  => true,
                'vehiculo' => self::formatearVehiculoAdmin($post),
            ], 201);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::crearVehiculo — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function actualizarVehiculo(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $post = get_post($id);

            if (!$post || $post->post_type !== 'vehiculo') {
                return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
            }

            $datos = self::filtrarCamposVehiculo($request->get_json_params());
            $nombre = sanitize_text_field($datos['nombre'] ?? '');

            if (!empty($nombre)) {
                wp_update_post(['ID' => $id, 'post_title' => $nombre]);
            }

            self::guardarMetasVehiculo($id, $datos);

            $post = get_post($id);

            return new WP_REST_Response([
                'success'  => true,
                'vehiculo' => self::formatearVehiculoAdmin($post),
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::actualizarVehiculo — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function toggleVehiculo(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $post = get_post($id);

            if (!$post || $post->post_type !== 'vehiculo') {
                return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
            }

            $actual = get_post_meta($id, '_vehiculo_activo', true);
            $nuevo = ($actual === '1') ? '0' : '1';
            update_post_meta($id, '_vehiculo_activo', $nuevo);

            return new WP_REST_Response(['success' => true, 'activo' => $nuevo === '1'], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::toggleVehiculo — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function eliminarVehiculo(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $post = get_post($id);

            if (!$post || $post->post_type !== 'vehiculo') {
                return new WP_REST_Response(['success' => false, 'error' => 'Vehículo no encontrado.'], 404);
            }

            /* Verificar que no tiene reservas activas antes de eliminar */
            $reservasActivas = new \WP_Query([
                'post_type'      => 'reserva',
                'post_status'    => 'publish',
                'posts_per_page' => 1,
                'meta_query'     => [
                    'relation' => 'AND',
                    [
                        'key'   => '_reserva_vehiculo_id',
                        'value' => $id,
                    ],
                    [
                        'key'     => '_reserva_estado',
                        'value'   => ['pendiente', 'confirmada'],
                        'compare' => 'IN',
                    ],
                ],
            ]);

            if ($reservasActivas->found_posts > 0) {
                wp_reset_postdata();
                return new WP_REST_Response([
                    'success' => false,
                    'error'   => 'No se puede eliminar: tiene reservas activas (pendientes o confirmadas).',
                ], 409);
            }
            wp_reset_postdata();

            wp_delete_post($id, true);

            GloryLogger::info("AdminController — Vehículo #{$id} eliminado");

            return new WP_REST_Response(['success' => true], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::eliminarVehiculo — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Clientes                                                          */
    /* ------------------------------------------------------------------ */

    public static function listarClientes(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $clientes = AdminRepository::listarClientes();

            return new WP_REST_Response([
                'success'  => true,
                'clientes' => $clientes,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::listarClientes — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Configuración                                                     */
    /* ------------------------------------------------------------------ */

    public static function leerConfiguracion(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $config = [];
            foreach (self::OPCIONES_CONFIG as $claveFront => $claveWp) {
                $valor = get_option($claveWp, '');

                /* Las claves sensibles de Stripe se enmascaran al leer */
                if (in_array($claveFront, self::OPCIONES_SENSIBLES, true)) {
                    if (!empty($valor)) {
                        $config[$claveFront] = substr($valor, 0, 8) . '...';
                    } else {
                        /* Si no hay valor en wp_options, intentar leer de constantes (.env) */
                        $constMap = [
                            'stripeSecretKey'      => 'GLORY_STRIPE_SECRET_KEY',
                            'stripePublishableKey' => 'GLORY_STRIPE_PUBLISHABLE_KEY',
                            'stripeWebhookSecret'  => 'GLORY_STRIPE_WEBHOOK_SECRET',
                        ];
                        $constName = $constMap[$claveFront] ?? '';
                        if ($constName && defined($constName)) {
                            $config[$claveFront] = substr(constant($constName), 0, 8) . '... (.env)';
                        } else {
                            $config[$claveFront] = '';
                        }
                    }
                    continue;
                }

                if (in_array($claveFront, self::OPCIONES_NUMERICAS, true)) {
                    $config[$claveFront] = (float) $valor;
                } else {
                    $config[$claveFront] = $valor;
                }
            }

            return new WP_REST_Response([
                'success'       => true,
                'configuracion' => $config,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::leerConfiguracion — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function guardarConfiguracion(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $datos = array_intersect_key(
                $request->get_json_params(),
                self::OPCIONES_CONFIG
            );

            foreach (self::OPCIONES_CONFIG as $claveFront => $claveWp) {
                if (!array_key_exists($claveFront, $datos)) {
                    continue;
                }
                $valor = $datos[$claveFront];

                /* No sobreescribir claves sensibles con valores enmascarados */
                if (in_array($claveFront, self::OPCIONES_SENSIBLES, true)) {
                    if (empty($valor) || str_contains((string) $valor, '...')) {
                        continue;
                    }
                    update_option($claveWp, sanitize_text_field((string) $valor));
                    continue;
                }

                if (in_array($claveFront, self::OPCIONES_NUMERICAS, true)) {
                    $valor = (string) (float) $valor;
                } else {
                    $valor = sanitize_text_field((string) $valor);
                }
                update_option($claveWp, $valor);
            }

            GloryLogger::info('AdminController — Configuración actualizada');

            return new WP_REST_Response(['success' => true], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::guardarConfiguracion — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Actividad reciente                                                */
    /* ------------------------------------------------------------------ */

    public static function obtenerActividad(WP_REST_Request $request): WP_REST_Response
    {
        try {
            $eventos = AdminRepository::obtenerActividadReciente();

            return new WP_REST_Response([
                'success'  => true,
                'eventos'  => $eventos,
            ], 200);
        } catch (\Throwable $e) {
            GloryLogger::error('AdminController::obtenerActividad — ' . $e->getMessage());
            return new WP_REST_Response(['success' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers privados                                                   */
    /* ------------------------------------------------------------------ */

    /**
     * Filtra los datos del request dejando solo campos válidos de vehículo.
     */
    private static function filtrarCamposVehiculo(array $datos): array
    {
        return array_intersect_key($datos, self::CAMPOS_VEHICULO);
    }

    /**
     * Formatea un post de vehículo para la respuesta admin.
     */
    private static function formatearVehiculoAdmin(\WP_Post $post): array
    {
        $id = $post->ID;
        $thumbnail = get_the_post_thumbnail_url($id, 'medium');

        return [
            'id'               => $id,
            'nombre'           => get_post_meta($id, '_vehiculo_nombre', true) ?: $post->post_title,
            'descripcionCorta' => get_post_meta($id, '_vehiculo_descripcion_corta', true),
            'precioBase'       => (float) get_post_meta($id, '_vehiculo_precio_base', true),
            'ubicacion'        => get_post_meta($id, '_vehiculo_ubicacion', true),
            'capacidad'        => (int) get_post_meta($id, '_vehiculo_capacidad', true),
            'plazasViaje'      => (int) get_post_meta($id, '_vehiculo_plazas_viaje', true),
            'fianza'           => (float) get_post_meta($id, '_vehiculo_fianza', true),
            'kmIncluidos'      => (int) get_post_meta($id, '_vehiculo_km_incluidos', true),
            'edadMinima'       => (int) get_post_meta($id, '_vehiculo_edad_minima', true),
            'combustible'      => get_post_meta($id, '_vehiculo_combustible', true),
            'transmision'      => get_post_meta($id, '_vehiculo_transmision', true),
            'activo'           => get_post_meta($id, '_vehiculo_activo', true) === '1',
            'imagen'           => $thumbnail ?: '',
        ];
    }

    /**
     * Guarda los metas de vehículo desde los datos del request.
     * Mapea nombres camelCase del frontend a claves _vehiculo_* de WP.
     */
    private static function guardarMetasVehiculo(int $postId, array $datos): void
    {
        $mapa = [
            'nombre'           => '_vehiculo_nombre',
            'descripcionCorta' => '_vehiculo_descripcion_corta',
            'precioBase'       => '_vehiculo_precio_base',
            'ubicacion'        => '_vehiculo_ubicacion',
            'capacidad'        => '_vehiculo_capacidad',
            'plazasViaje'      => '_vehiculo_plazas_viaje',
            'fianza'           => '_vehiculo_fianza',
            'kmIncluidos'      => '_vehiculo_km_incluidos',
            'edadMinima'       => '_vehiculo_edad_minima',
            'combustible'      => '_vehiculo_combustible',
            'transmision'      => '_vehiculo_transmision',
        ];

        foreach ($mapa as $claveFront => $claveMeta) {
            if (!array_key_exists($claveFront, $datos)) {
                continue;
            }

            $tipo = self::CAMPOS_VEHICULO[$claveFront] ?? 'string';
            $valor = $datos[$claveFront];

            switch ($tipo) {
                case 'float':
                    $valor = (string) (float) $valor;
                    break;
                case 'int':
                    $valor = (string) (int) $valor;
                    break;
                default:
                    $valor = sanitize_text_field((string) $valor);
                    break;
            }

            update_post_meta($postId, $claveMeta, $valor);
        }
    }
}
