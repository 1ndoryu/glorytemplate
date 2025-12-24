<?php

/**
 * Mensajes API Controller
 *
 * Maneja los endpoints REST para el sistema de timeline (chat + historial)
 *
 * Endpoints:
 * - GET /wp-json/glory/v1/mensajes/{tipo}/{id} -> Obtener timeline (marca como leído)
 * - POST /wp-json/glory/v1/mensajes -> Enviar mensaje
 * - POST /wp-json/glory/v1/mensajes/marcar-leido -> Marcar mensajes como leídos
 * - GET /wp-json/glory/v1/mensajes/no-leidos/{tipo}/{id} -> Contar no leídos de un elemento
 * - POST /wp-json/glory/v1/mensajes/no-leidos-masivo -> Contar no leídos de múltiples elementos
 *
 * @package App\Api
 */

namespace App\Api;

use App\Database\Schema;
use App\Repository\MensajesRepository;

class MensajesApiController
{
    public static function register(): void
    {
        add_action('rest_api_init', [self::class, 'registrarRutas']);
    }

    public static function registrarRutas(): void
    {
        $namespace = 'glory/v1';

        /* Obtener timeline de un elemento */
        register_rest_route($namespace, '/mensajes/(?P<tipo>[a-z]+)/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'obtenerTimeline'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipo' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito'],
                    'description' => 'Tipo de elemento'
                ],
                'id' => [
                    'required' => true,
                    'type' => 'integer',
                    'description' => 'ID del elemento'
                ],
                'limite' => [
                    'type' => 'integer',
                    'default' => 50,
                    'minimum' => 1,
                    'maximum' => 100
                ],
                'offset' => [
                    'type' => 'integer',
                    'default' => 0,
                    'minimum' => 0
                ]
            ]
        ]);

        /* Enviar mensaje */
        register_rest_route($namespace, '/mensajes', [
            'methods' => 'POST',
            'callback' => [self::class, 'enviarMensaje'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipoElemento' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito'],
                    'description' => 'Tipo de elemento'
                ],
                'elementoId' => [
                    'required' => true,
                    'type' => 'integer',
                    'description' => 'ID del elemento'
                ],
                'contenido' => [
                    'required' => true,
                    'type' => 'string',
                    'minLength' => 1,
                    'maxLength' => 2000,
                    'sanitize_callback' => 'sanitize_textarea_field',
                    'description' => 'Contenido del mensaje'
                ]
            ]
        ]);

        /* Contar mensajes (para badge) */
        register_rest_route($namespace, '/mensajes/contar/(?P<tipo>[a-z]+)/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'contarMensajes'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipo' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ],
                'id' => [
                    'required' => true,
                    'type' => 'integer'
                ]
            ]
        ]);

        /* Marcar mensajes como leídos */
        register_rest_route($namespace, '/mensajes/marcar-leido', [
            'methods' => 'POST',
            'callback' => [self::class, 'marcarComoLeido'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipoElemento' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ],
                'elementoId' => [
                    'required' => true,
                    'type' => 'integer'
                ]
            ]
        ]);

        /* Contar mensajes no leídos de un elemento */
        register_rest_route($namespace, '/mensajes/no-leidos/(?P<tipo>[a-z]+)/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [self::class, 'contarNoLeidos'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipo' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ],
                'id' => [
                    'required' => true,
                    'type' => 'integer'
                ]
            ]
        ]);

        /* Contar no leídos de múltiples elementos (para badges en lista) */
        register_rest_route($namespace, '/mensajes/no-leidos-masivo', [
            'methods' => 'POST',
            'callback' => [self::class, 'contarNoLeidosMasivo'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipoElemento' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ],
                'elementoIds' => [
                    'required' => true,
                    'type' => 'array',
                    'items' => ['type' => 'integer']
                ]
            ]
        ]);

        /* 
         * Registrar evento del sistema (historial)
         * Usado por el frontend para registrar cambios automáticamente
         */
        register_rest_route($namespace, '/mensajes/evento', [
            'methods' => 'POST',
            'callback' => [self::class, 'registrarEvento'],
            'permission_callback' => [self::class, 'verificarPermisos'],
            'args' => [
                'tipoElemento' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['tarea', 'proyecto', 'habito']
                ],
                'elementoId' => [
                    'required' => true,
                    'type' => 'integer'
                ],
                'accion' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['creado', 'editado', 'completado', 'reabierto', 'asignado', 'desasignado', 'adjunto_agregado', 'adjunto_eliminado', 'prioridad', 'urgencia', 'fecha_limite', 'participante_agregado', 'participante_removido', 'compartido', 'descripcion', 'nombre']
                ],
                'detalle' => [
                    'type' => 'string',
                    'default' => null,
                    'sanitize_callback' => 'sanitize_text_field'
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
     * Obtiene el timeline de un elemento
     */
    public static function obtenerTimeline(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipo = $request->get_param('tipo');
        $elementoId = (int)$request->get_param('id');
        $limite = (int)$request->get_param('limite');
        $offset = (int)$request->get_param('offset');

        /* Verificar acceso al elemento */
        if (!self::tieneAccesoAElemento($userId, $tipo, $elementoId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No tienes acceso a este elemento'
            ], 403);
        }

        try {
            /* Asegurar que la tabla existe (migracion automatica) */
            Schema::ensureTableExists('mensajes');

            $repo = new MensajesRepository($userId);
            $mensajes = $repo->obtenerTimeline($tipo, $elementoId, $limite, $offset);
            $total = $repo->contarMensajes($tipo, $elementoId);

            /* Obtener avatares de usuarios */
            $mensajes = array_map(function ($mensaje) {
                $mensaje['avatar'] = get_avatar_url($mensaje['usuarioId'], ['size' => 40]);
                return $mensaje;
            }, $mensajes);

            /* Marcar como leído automáticamente al ver el timeline */
            $repo->marcarComoLeido($tipo, $elementoId);

            return new \WP_REST_Response([
                'success' => true,
                'mensajes' => $mensajes,
                'total' => $total,
                'limite' => $limite,
                'offset' => $offset
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Envia un mensaje de usuario
     */
    public static function enviarMensaje(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipoElemento = $request->get_param('tipoElemento');
        $elementoId = (int)$request->get_param('elementoId');
        $contenido = $request->get_param('contenido');

        /* Verificar acceso al elemento */
        if (!self::tieneAccesoAElemento($userId, $tipoElemento, $elementoId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No tienes acceso a este elemento'
            ], 403);
        }

        /* Validar contenido */
        if (empty(trim($contenido))) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'El mensaje no puede estar vacio'
            ], 400);
        }

        try {
            /* Asegurar que la tabla existe */
            Schema::ensureTableExists('mensajes');

            $repo = new MensajesRepository($userId);
            $mensaje = $repo->enviarMensaje($tipoElemento, $elementoId, $contenido);

            if (!$mensaje) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Error al enviar el mensaje'
                ], 500);
            }

            /* Agregar avatar */
            $mensaje['avatar'] = get_avatar_url($userId, ['size' => 40]);

            /* Notificar a los otros participantes del elemento */
            self::notificarParticipantes($userId, $tipoElemento, $elementoId, $contenido);

            return new \WP_REST_Response([
                'success' => true,
                'mensaje' => $mensaje
            ], 201);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cuenta los mensajes de un elemento
     */
    public static function contarMensajes(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipo = $request->get_param('tipo');
        $elementoId = (int)$request->get_param('id');

        if (!self::tieneAccesoAElemento($userId, $tipo, $elementoId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No tienes acceso a este elemento'
            ], 403);
        }

        try {
            Schema::ensureTableExists('mensajes');

            $repo = new MensajesRepository($userId);
            $total = $repo->contarMensajes($tipo, $elementoId);

            return new \WP_REST_Response([
                'success' => true,
                'total' => $total
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marca los mensajes de un elemento como leídos
     */
    public static function marcarComoLeido(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipoElemento = $request->get_param('tipoElemento');
        $elementoId = (int)$request->get_param('elementoId');

        if (!self::tieneAccesoAElemento($userId, $tipoElemento, $elementoId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No tienes acceso a este elemento'
            ], 403);
        }

        try {
            Schema::ensureTableExists('mensajes_leidos');

            $repo = new MensajesRepository($userId);
            $repo->marcarComoLeido($tipoElemento, $elementoId);

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
     * Cuenta los mensajes no leídos de un elemento
     */
    public static function contarNoLeidos(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipo = $request->get_param('tipo');
        $elementoId = (int)$request->get_param('id');

        if (!self::tieneAccesoAElemento($userId, $tipo, $elementoId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No tienes acceso a este elemento'
            ], 403);
        }

        try {
            Schema::ensureTableExists('mensajes_leidos');

            $repo = new MensajesRepository($userId);
            $noLeidos = $repo->contarNoLeidos($tipo, $elementoId);

            return new \WP_REST_Response([
                'success' => true,
                'noLeidos' => $noLeidos
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cuenta mensajes no leídos de múltiples elementos (para badges en lista)
     */
    public static function contarNoLeidosMasivo(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipoElemento = $request->get_param('tipoElemento');
        $elementoIds = $request->get_param('elementoIds');

        if (!is_array($elementoIds) || empty($elementoIds)) {
            return new \WP_REST_Response([
                'success' => true,
                'noLeidos' => []
            ], 200);
        }

        /* Filtrar solo IDs a los que tiene acceso */
        $idsConAcceso = array_filter($elementoIds, function ($id) use ($userId, $tipoElemento) {
            return self::tieneAccesoAElemento($userId, $tipoElemento, (int)$id);
        });

        if (empty($idsConAcceso)) {
            return new \WP_REST_Response([
                'success' => true,
                'noLeidos' => []
            ], 200);
        }

        try {
            Schema::ensureTableExists('mensajes_leidos');

            $repo = new MensajesRepository($userId);
            $noLeidos = $repo->contarNoLeidosMasivo($tipoElemento, array_map('intval', $idsConAcceso));

            return new \WP_REST_Response([
                'success' => true,
                'noLeidos' => $noLeidos
            ], 200);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registra un evento del sistema (historial de cambios)
     */
    public static function registrarEvento(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = get_current_user_id();
        $tipoElemento = $request->get_param('tipoElemento');
        $elementoId = (int)$request->get_param('elementoId');
        $accion = $request->get_param('accion');
        $detalle = $request->get_param('detalle');

        if (!self::tieneAccesoAElemento($userId, $tipoElemento, $elementoId)) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'No tienes acceso a este elemento'
            ], 403);
        }

        try {
            Schema::ensureTableExists('mensajes');

            $resultado = \App\Services\MensajesService::registrarEvento(
                $tipoElemento,
                $elementoId,
                $userId,
                $accion,
                $detalle
            );

            if (!$resultado) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Error al registrar evento'
                ], 500);
            }

            return new \WP_REST_Response([
                'success' => true
            ], 201);
        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verifica si el usuario tiene acceso a un elemento
     * (es propietario o tiene el elemento compartido con el)
     */
    private static function tieneAccesoAElemento(int $userId, string $tipo, int $elementoId): bool
    {
        global $wpdb;

        /* Mapear tipo a tabla */
        $tablas = [
            'tarea' => 'glory_tareas',
            'proyecto' => 'glory_proyectos',
            'habito' => 'glory_habitos'
        ];

        if (!isset($tablas[$tipo])) {
            return false;
        }

        $tableName = $wpdb->prefix . $tablas[$tipo];
        $campoId = 'id_local';

        /* Verificar si es propietario */
        $esPropietario = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $tableName WHERE user_id = %d AND $campoId = %d AND deleted_at IS NULL",
            $userId,
            $elementoId
        ));

        if ($esPropietario) {
            return true;
        }

        /* Verificar si esta compartido con el usuario */
        $tablaCompartidos = $wpdb->prefix . 'glory_compartidos';
        $estaCompartido = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $tablaCompartidos WHERE tipo = %s AND elemento_id = %d AND usuario_id = %d",
            $tipo,
            $elementoId,
            $userId
        ));

        return (bool)$estaCompartido;
    }

    /**
     * Notifica a los participantes de un elemento cuando se envia un mensaje
     * Excluye al usuario que envia el mensaje
     */
    private static function notificarParticipantes(
        int $usuarioOrigenId,
        string $tipoElemento,
        int $elementoId,
        string $contenido
    ): void {
        global $wpdb;

        /* Obtener nombre del elemento */
        $tablas = [
            'tarea' => 'glory_tareas',
            'proyecto' => 'glory_proyectos',
            'habito' => 'glory_habitos'
        ];
        $camposNombre = [
            'tarea' => 'texto',
            'proyecto' => 'nombre',
            'habito' => 'nombre'
        ];

        if (!isset($tablas[$tipoElemento])) {
            return;
        }

        $tableName = $wpdb->prefix . $tablas[$tipoElemento];
        $campoNombre = $camposNombre[$tipoElemento];

        /* Obtener el propietario y nombre del elemento */
        $elemento = $wpdb->get_row($wpdb->prepare(
            "SELECT user_id, $campoNombre as nombre FROM $tableName WHERE id_local = %d AND deleted_at IS NULL",
            $elementoId
        ));

        if (!$elemento) {
            return;
        }

        $propietarioId = (int)$elemento->user_id;
        $elementoNombre = $elemento->nombre;

        /* Obtener participantes del elemento compartido */
        $tablaCompartidos = $wpdb->prefix . 'glory_compartidos';
        $participantes = $wpdb->get_col($wpdb->prepare(
            "SELECT usuario_id FROM $tablaCompartidos WHERE tipo = %s AND elemento_id = %d",
            $tipoElemento,
            $elementoId
        ));

        /* Agregar propietario a la lista si no esta */
        if (!in_array($propietarioId, $participantes)) {
            $participantes[] = $propietarioId;
        }

        /* Si no hay participantes ademas del que envia, salir */
        $participantes = array_filter($participantes, fn($id) => (int)$id !== $usuarioOrigenId);

        if (empty($participantes)) {
            return;
        }

        /* Crear notificacion para cada participante */
        $notificacionesService = new \App\Services\NotificacionesService();

        foreach ($participantes as $participanteId) {
            $notificacionesService->notificarMensajeChat(
                (int)$participanteId,
                $usuarioOrigenId,
                $tipoElemento,
                $elementoId,
                $elementoNombre,
                $contenido
            );
        }
    }
}

MensajesApiController::register();
