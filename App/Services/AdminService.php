<?php

/**
 * Servicio de Administración
 *
 * Maneja la lógica para gestionar usuarios desde el panel de admin:
 * - Listar usuarios con filtros y paginación
 * - Obtener información detallada de usuario
 * - Activar/cancelar premium manualmente
 * - Extender trial
 *
 * @package App\Services
 */

namespace App\Services;

class AdminService
{
    /* 
     * Opciones de paginación por defecto 
     */
    private const POR_PAGINA_DEFECTO = 20;
    private const PAGINA_DEFECTO = 1;

    /* 
     * Meta keys utilizados 
     */
    private const META_SUSCRIPCION = 'glory_suscripcion';
    private const META_STRIPE_CUSTOMER = 'glory_stripe_customer_id';
    private const META_CIFRADO_ACTIVO = 'glory_cifrado_activo';
    private const META_ULTIMO_PAGO = 'glory_ultimo_pago';

    /**
     * Lista usuarios con filtros y paginación
     */
    public function listarUsuarios(array $filtros = []): array
    {
        $plan = $filtros['plan'] ?? 'todos';
        $busqueda = $filtros['busqueda'] ?? '';
        $ordenarPor = $filtros['ordenarPor'] ?? 'fechaRegistro';
        $orden = $filtros['orden'] ?? 'desc';
        $pagina = max(1, intval($filtros['pagina'] ?? self::PAGINA_DEFECTO));
        $porPagina = max(1, min(100, intval($filtros['porPagina'] ?? self::POR_PAGINA_DEFECTO)));

        /* Construir argumentos para WP_User_Query */
        $args = [
            'number' => $porPagina,
            'paged' => $pagina,
            'orderby' => $this->mapearOrdenamiento($ordenarPor),
            'order' => strtoupper($orden) === 'ASC' ? 'ASC' : 'DESC',
        ];

        /* Búsqueda por nombre o email */
        if (!empty($busqueda)) {
            $args['search'] = '*' . sanitize_text_field($busqueda) . '*';
            $args['search_columns'] = ['user_login', 'user_email', 'display_name'];
        }

        /* Filtrar por plan - requiere meta query */
        if ($plan !== 'todos') {
            $args['meta_query'] = $this->construirMetaQueryPlan($plan);
        }

        $query = new \WP_User_Query($args);
        $usuarios = $query->get_results();
        $total = $query->get_total();

        /* Formatear usuarios */
        $usuariosFormateados = array_map(
            fn($user) => $this->formatearUsuario($user),
            $usuarios
        );

        return [
            'usuarios' => $usuariosFormateados,
            'total' => $total,
            'paginacion' => [
                'pagina' => $pagina,
                'porPagina' => $porPagina,
                'totalPaginas' => ceil($total / $porPagina),
            ],
        ];
    }

    /**
     * Obtiene información detallada de un usuario
     */
    public function obtenerUsuario(int $userId): ?array
    {
        $user = get_user_by('ID', $userId);

        if ($user === false || !($user instanceof \WP_User)) {
            return null;
        }

        return $this->formatearUsuario($user, true);
    }

    /**
     * Activa premium manualmente para un usuario
     */
    public function activarPremium(int $userId, ?int $duracion = null): array
    {
        $suscripcionService = new SuscripcionService($userId);

        /* Si no se especifica duración, premium "ilimitado" (10 años) */
        $diasDuracion = $duracion ?? 3650;

        $resultado = $suscripcionService->activarPremium($diasDuracion);

        /* Registrar acción en logs */
        $this->registrarAccion($userId, 'activar_premium', [
            'duracion' => $diasDuracion,
            'admin_id' => get_current_user_id(),
        ]);

        return $resultado;
    }

    /**
     * Cancela premium y revierte a FREE
     */
    public function cancelarPremium(int $userId): array
    {
        $suscripcionService = new SuscripcionService($userId);
        $resultado = $suscripcionService->cancelar();

        /* Registrar acción en logs */
        $this->registrarAccion($userId, 'cancelar_premium', [
            'admin_id' => get_current_user_id(),
        ]);

        return $resultado;
    }

    /**
     * Extiende el trial de un usuario
     */
    public function extenderTrial(int $userId, int $dias): array
    {
        if ($dias <= 0 || $dias > 365) {
            return [
                'exito' => false,
                'mensaje' => 'La duración debe estar entre 1 y 365 días.',
            ];
        }

        $suscripcion = get_user_meta($userId, self::META_SUSCRIPCION, true);

        if (empty($suscripcion) || !is_array($suscripcion)) {
            return [
                'exito' => false,
                'mensaje' => 'El usuario no tiene suscripción.',
            ];
        }

        /* Calcular nueva fecha de expiración */
        if (!empty($suscripcion['fechaExpiracion'])) {
            $fechaBase = strtotime($suscripcion['fechaExpiracion']);
        } else {
            $fechaBase = current_time('timestamp');
        }

        $nuevaFecha = date('Y-m-d H:i:s', strtotime("+{$dias} days", $fechaBase));

        $suscripcion['fechaExpiracion'] = $nuevaFecha;
        $suscripcion['plan'] = SuscripcionService::PLAN_PREMIUM;
        $suscripcion['estado'] = SuscripcionService::ESTADO_TRIAL;

        update_user_meta($userId, self::META_SUSCRIPCION, $suscripcion);

        /* Registrar acción en logs */
        $this->registrarAccion($userId, 'extender_trial', [
            'dias' => $dias,
            'nueva_fecha' => $nuevaFecha,
            'admin_id' => get_current_user_id(),
        ]);

        return [
            'exito' => true,
            'mensaje' => "Trial extendido por {$dias} días hasta {$nuevaFecha}.",
            'suscripcion' => $suscripcion,
        ];
    }

    /**
     * Obtiene estadísticas de uso de un usuario
     */
    public function obtenerEstadisticasUsuario(int $userId): array
    {
        global $wpdb;

        $tablaHabitos = $wpdb->prefix . 'glory_habitos';
        $tablaTareas = $wpdb->prefix . 'glory_tareas';
        $tablaProyectos = $wpdb->prefix . 'glory_proyectos';

        /* Contar hábitos */
        $habitos = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaHabitos} WHERE user_id = %d",
            $userId
        ));

        /* Contar tareas */
        $tareas = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaTareas} WHERE user_id = %d",
            $userId
        ));

        /* Contar tareas completadas */
        $tareasCompletadas = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaTareas} WHERE user_id = %d AND completado = 1",
            $userId
        ));

        /* Contar proyectos */
        $proyectos = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$tablaProyectos} WHERE user_id = %d",
            $userId
        ));

        return [
            'habitos' => $habitos,
            'tareas' => $tareas,
            'proyectos' => $proyectos,
            'tareasCompletadas' => $tareasCompletadas,
        ];
    }

    /**
     * Formatea usuario para respuesta de API
     */
    private function formatearUsuario(\WP_User $user, bool $detallado = false): array
    {
        $suscripcion = get_user_meta($user->ID, self::META_SUSCRIPCION, true);
        $stripeCustomerId = get_user_meta($user->ID, self::META_STRIPE_CUSTOMER, true);
        $cifradoActivo = (bool) get_user_meta($user->ID, self::META_CIFRADO_ACTIVO, true);
        $ultimoPago = get_user_meta($user->ID, self::META_ULTIMO_PAGO, true);

        /* Valores por defecto para suscripción */
        if (empty($suscripcion) || !is_array($suscripcion)) {
            $suscripcion = [
                'plan' => SuscripcionService::PLAN_FREE,
                'estado' => SuscripcionService::ESTADO_ACTIVA,
                'fechaInicio' => null,
                'fechaExpiracion' => null,
                'trialUsado' => false,
            ];
        }

        /* Calcular días restantes */
        $diasRestantes = null;
        if (!empty($suscripcion['fechaExpiracion'])) {
            $ahora = current_time('timestamp');
            $expiracion = strtotime($suscripcion['fechaExpiracion']);
            $diasRestantes = max(0, ceil(($expiracion - $ahora) / 86400));
        }

        $datos = [
            'id' => $user->ID,
            'nombre' => $user->display_name,
            'email' => $user->user_email,
            'avatar' => get_avatar_url($user->ID, ['size' => 48]),
            'fechaRegistro' => $user->user_registered,
            'suscripcion' => [
                'plan' => $suscripcion['plan'] ?? SuscripcionService::PLAN_FREE,
                'estado' => $suscripcion['estado'] ?? SuscripcionService::ESTADO_ACTIVA,
                'fechaInicio' => $suscripcion['fechaInicio'] ?? null,
                'fechaExpiracion' => $suscripcion['fechaExpiracion'] ?? null,
                'diasRestantes' => $diasRestantes,
                'stripeCustomerId' => $stripeCustomerId ?: null,
                'ultimoPago' => $ultimoPago ?: null,
            ],
            'cifradoActivo' => $cifradoActivo,
        ];

        /* Añadir estadísticas si es detallado */
        if ($detallado) {
            $datos['estadisticas'] = $this->obtenerEstadisticasUsuario($user->ID);
        }

        return $datos;
    }

    /**
     * Mapea campo de ordenamiento a columna de WP_User_Query
     */
    private function mapearOrdenamiento(string $campo): string
    {
        $mapeados = [
            'nombre' => 'display_name',
            'fechaRegistro' => 'registered',
            'email' => 'email',
            'ultimoPago' => 'meta_value',
            'estado' => 'meta_value',
        ];

        return $mapeados[$campo] ?? 'registered';
    }

    /**
     * Construye meta_query para filtrar por plan
     */
    private function construirMetaQueryPlan(string $plan): array
    {
        switch ($plan) {
            case 'premium':
                return [
                    [
                        'key' => self::META_SUSCRIPCION,
                        'value' => '"plan";s:7:"premium"',
                        'compare' => 'LIKE',
                    ],
                    [
                        'key' => self::META_SUSCRIPCION,
                        'value' => '"estado";s:8:"expirada"',
                        'compare' => 'NOT LIKE',
                    ],
                    'relation' => 'AND',
                ];

            case 'trial':
                return [
                    [
                        'key' => self::META_SUSCRIPCION,
                        'value' => '"estado";s:5:"trial"',
                        'compare' => 'LIKE',
                    ],
                ];

            case 'free':
                return [
                    'relation' => 'OR',
                    [
                        'key' => self::META_SUSCRIPCION,
                        'value' => '"plan";s:4:"free"',
                        'compare' => 'LIKE',
                    ],
                    [
                        'key' => self::META_SUSCRIPCION,
                        'compare' => 'NOT EXISTS',
                    ],
                ];

            default:
                return [];
        }
    }

    /**
     * Registra acciones administrativas en logs
     */
    private function registrarAccion(int $userId, string $accion, array $datos = []): void
    {
        $log = [
            'timestamp' => current_time('mysql'),
            'admin_id' => get_current_user_id(),
            'user_id' => $userId,
            'accion' => $accion,
            'datos' => $datos,
        ];

        error_log('[AdminService] ' . json_encode($log));
    }

    /**
     * Obtiene resumen de estadísticas globales
     */
    public function obtenerResumenGlobal(): array
    {
        global $wpdb;

        $totalUsuarios = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->users}"
        );

        /* Contar usuarios premium activos */
        $premiumActivos = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->usermeta} 
             WHERE meta_key = %s 
             AND meta_value LIKE %s 
             AND meta_value NOT LIKE %s",
            self::META_SUSCRIPCION,
            '%"plan";s:7:"premium"%',
            '%"estado";s:8:"expirada"%'
        ));

        /* Contar usuarios en trial */
        $enTrial = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->usermeta} 
             WHERE meta_key = %s 
             AND meta_value LIKE %s",
            self::META_SUSCRIPCION,
            '%"estado";s:5:"trial"%'
        ));

        $usuariosFree = $totalUsuarios - $premiumActivos - $enTrial;

        return [
            'totalUsuarios' => $totalUsuarios,
            'premium' => $premiumActivos,
            'trial' => $enTrial,
            'free' => max(0, $usuariosFree),
        ];
    }
}
