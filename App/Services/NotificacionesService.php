<?php

/**
 * Servicio de Notificaciones
 *
 * Gestiona la lógica para el sistema de notificaciones in-app:
 * - Crear notificaciones de diferentes tipos
 * - Listar notificaciones con paginación
 * - Marcar como leídas (individual o todas)
 * - Eliminar notificaciones
 * - Contar no leídas para badge del header
 *
 * Tipos de notificación:
 * - solicitud_equipo: Nueva solicitud de compañero
 * - tarea_vence_hoy: Tarea con fecha límite hoy
 * - tarea_asignada: Te asignaron una tarea (futuro)
 * - tarea_removida: Te quitaron de una tarea (futuro)
 * - adjunto_agregado: Nuevo adjunto en tarea compartida (futuro)
 * - mensaje_chat: Nuevo mensaje en tarea/proyecto (futuro)
 * - habito_companero: Compañero cumplió hábito compartido (futuro)
 *
 * @package App\Services
 */

namespace App\Services;

use App\Database\Schema;

class NotificacionesService
{
    private string $tabla;

    /* Tipos de notificación válidos */
    public const TIPO_SOLICITUD_EQUIPO = 'solicitud_equipo';
    public const TIPO_SOLICITUD_ACEPTADA = 'solicitud_aceptada';
    public const TIPO_TAREA_VENCE_HOY = 'tarea_vence_hoy';
    public const TIPO_TAREA_ASIGNADA = 'tarea_asignada';
    public const TIPO_TAREA_REMOVIDA = 'tarea_removida';
    public const TIPO_ADJUNTO_AGREGADO = 'adjunto_agregado';
    public const TIPO_MENSAJE_CHAT = 'mensaje_chat';
    public const TIPO_HABITO_COMPANERO = 'habito_companero';

    /* Límites de paginación */
    private const POR_PAGINA_DEFAULT = 20;
    private const POR_PAGINA_MAX = 50;

    public function __construct()
    {
        $this->tabla = Schema::getTableName('notificaciones');
    }

    /**
     * Crea una nueva notificación para un usuario
     *
     * @param int $usuarioId ID del usuario destinatario
     * @param string $tipo Tipo de notificación
     * @param string $titulo Título corto de la notificación
     * @param string|null $contenido Contenido detallado (opcional)
     * @param array|null $datosExtra Datos adicionales en formato array
     * @return array Resultado con exito y datos de la notificación
     */
    public function crear(
        int $usuarioId,
        string $tipo,
        string $titulo,
        ?string $contenido = null,
        ?array $datosExtra = null
    ): array {
        global $wpdb;

        $tiposValidos = [
            self::TIPO_SOLICITUD_EQUIPO,
            self::TIPO_SOLICITUD_ACEPTADA,
            self::TIPO_TAREA_VENCE_HOY,
            self::TIPO_TAREA_ASIGNADA,
            self::TIPO_TAREA_REMOVIDA,
            self::TIPO_ADJUNTO_AGREGADO,
            self::TIPO_MENSAJE_CHAT,
            self::TIPO_HABITO_COMPANERO,
        ];

        if (!in_array($tipo, $tiposValidos)) {
            return [
                'exito' => false,
                'mensaje' => 'Tipo de notificación no válido',
                'codigo' => 'tipo_invalido'
            ];
        }

        $datos = [
            'usuario_id' => $usuarioId,
            'tipo' => $tipo,
            'titulo' => sanitize_text_field($titulo),
            'contenido' => $contenido ? wp_kses_post($contenido) : null,
            'datos_extra' => $datosExtra ? wp_json_encode($datosExtra) : null,
            'leida' => 0,
            'fecha_creacion' => current_time('mysql'),
        ];

        $wpdb->insert($this->tabla, $datos);

        if (!$wpdb->insert_id) {
            return [
                'exito' => false,
                'mensaje' => 'Error al crear notificación',
                'codigo' => 'error_bd'
            ];
        }

        return [
            'exito' => true,
            'mensaje' => 'Notificación creada',
            'notificacion' => $this->formatear(
                $wpdb->insert_id,
                $tipo,
                $titulo,
                $contenido,
                0,
                $datos['fecha_creacion'],
                null,
                $datosExtra
            )
        ];
    }

    /**
     * Obtiene las notificaciones de un usuario con paginación
     *
     * @param int $usuarioId ID del usuario
     * @param int $pagina Número de página (1-indexed)
     * @param int $porPagina Cantidad por página
     * @param bool|null $soloNoLeidas Filtrar solo no leídas
     * @return array Lista de notificaciones con paginación
     */
    public function listar(
        int $usuarioId,
        int $pagina = 1,
        int $porPagina = self::POR_PAGINA_DEFAULT,
        ?bool $soloNoLeidas = null
    ): array {
        global $wpdb;

        $porPagina = min(max($porPagina, 1), self::POR_PAGINA_MAX);
        $pagina = max($pagina, 1);
        $offset = ($pagina - 1) * $porPagina;

        $whereExtra = $soloNoLeidas ? 'AND leida = 0' : '';

        $total = (int)$wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tabla} 
                WHERE usuario_id = %d {$whereExtra}",
                $usuarioId
            )
        );

        $resultados = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla}
                WHERE usuario_id = %d {$whereExtra}
                ORDER BY fecha_creacion DESC
                LIMIT %d OFFSET %d",
                $usuarioId,
                $porPagina,
                $offset
            )
        );

        $notificaciones = array_map(
            fn($r) => $this->formatearDesdeDB($r),
            $resultados
        );

        return [
            'notificaciones' => $notificaciones,
            'total' => $total,
            'paginacion' => [
                'pagina' => $pagina,
                'porPagina' => $porPagina,
                'totalPaginas' => (int)ceil($total / $porPagina),
            ]
        ];
    }

    /**
     * Marca una notificación como leída
     *
     * @param int $notificacionId ID de la notificación
     * @param int $usuarioId ID del usuario (para verificar permisos)
     * @return array Resultado de la operación
     */
    public function marcarLeida(int $notificacionId, int $usuarioId): array
    {
        global $wpdb;

        $notificacion = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} WHERE id = %d",
                $notificacionId
            )
        );

        if (!$notificacion) {
            return [
                'exito' => false,
                'mensaje' => 'Notificación no encontrada',
                'codigo' => 'no_encontrada'
            ];
        }

        if ((int)$notificacion->usuario_id !== $usuarioId) {
            return [
                'exito' => false,
                'mensaje' => 'No tienes permiso para modificar esta notificación',
                'codigo' => 'sin_permiso'
            ];
        }

        if ($notificacion->leida) {
            return [
                'exito' => true,
                'mensaje' => 'La notificación ya estaba marcada como leída'
            ];
        }

        $wpdb->update(
            $this->tabla,
            [
                'leida' => 1,
                'fecha_lectura' => current_time('mysql')
            ],
            ['id' => $notificacionId]
        );

        return [
            'exito' => true,
            'mensaje' => 'Notificación marcada como leída'
        ];
    }

    /**
     * Marca todas las notificaciones del usuario como leídas
     *
     * @param int $usuarioId ID del usuario
     * @return array Resultado con cantidad de notificaciones marcadas
     */
    public function marcarTodasLeidas(int $usuarioId): array
    {
        global $wpdb;

        $cantidad = $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$this->tabla} 
                SET leida = 1, fecha_lectura = %s 
                WHERE usuario_id = %d AND leida = 0",
                current_time('mysql'),
                $usuarioId
            )
        );

        return [
            'exito' => true,
            'mensaje' => "Marcadas {$cantidad} notificaciones como leídas",
            'cantidad' => (int)$cantidad
        ];
    }

    /**
     * Elimina una notificación
     *
     * @param int $notificacionId ID de la notificación
     * @param int $usuarioId ID del usuario (para verificar permisos)
     * @return array Resultado de la operación
     */
    public function eliminar(int $notificacionId, int $usuarioId): array
    {
        global $wpdb;

        $notificacion = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} WHERE id = %d",
                $notificacionId
            )
        );

        if (!$notificacion) {
            return [
                'exito' => false,
                'mensaje' => 'Notificación no encontrada',
                'codigo' => 'no_encontrada'
            ];
        }

        if ((int)$notificacion->usuario_id !== $usuarioId) {
            return [
                'exito' => false,
                'mensaje' => 'No tienes permiso para eliminar esta notificación',
                'codigo' => 'sin_permiso'
            ];
        }

        $wpdb->delete($this->tabla, ['id' => $notificacionId]);

        return [
            'exito' => true,
            'mensaje' => 'Notificación eliminada'
        ];
    }

    /**
     * Cuenta las notificaciones no leídas para el badge del header
     *
     * @param int $usuarioId ID del usuario
     * @return int Cantidad de notificaciones no leídas
     */
    public function contarNoLeidas(int $usuarioId): int
    {
        global $wpdb;

        return (int)$wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tabla} 
                WHERE usuario_id = %d AND leida = 0",
                $usuarioId
            )
        );
    }

    /**
     * Crea notificación de solicitud de equipo recibida
     * Llamar desde EquiposService al recibir una solicitud
     *
     * @param int $usuarioDestinoId Usuario que recibe la solicitud
     * @param int $usuarioOrigenId Usuario que envía la solicitud
     * @param int $solicitudId ID de la solicitud
     * @return array Resultado de la operación
     */
    public function notificarSolicitudEquipo(
        int $usuarioDestinoId,
        int $usuarioOrigenId,
        int $solicitudId
    ): array {
        $usuarioOrigen = get_user_by('ID', $usuarioOrigenId);
        $nombreOrigen = $usuarioOrigen ? $usuarioOrigen->display_name : 'Usuario';

        return $this->crear(
            $usuarioDestinoId,
            self::TIPO_SOLICITUD_EQUIPO,
            "{$nombreOrigen} quiere unirse a tu equipo",
            "Has recibido una solicitud de conexión de {$nombreOrigen}.",
            [
                'solicitudId' => $solicitudId,
                'usuarioId' => $usuarioOrigenId,
                'usuarioNombre' => $nombreOrigen,
                'usuarioEmail' => $usuarioOrigen ? $usuarioOrigen->user_email : '',
                'usuarioAvatar' => $usuarioOrigen ? get_avatar_url($usuarioOrigenId, ['size' => 48]) : '',
            ]
        );
    }

    /**
     * Crea notificaciones de tareas que vencen hoy
     * Llamar desde un cron job diario
     *
     * @param int $usuarioId ID del usuario
     * @param array $tareas Lista de tareas que vencen hoy
     * @return int Cantidad de notificaciones creadas
     */
    public function notificarTareasVencenHoy(int $usuarioId, array $tareas): int
    {
        $creadas = 0;

        foreach ($tareas as $tarea) {
            $resultado = $this->crear(
                $usuarioId,
                self::TIPO_TAREA_VENCE_HOY,
                "Tarea vence hoy: {$tarea['texto']}",
                "La tarea \"{$tarea['texto']}\" tiene fecha límite hoy.",
                [
                    'tareaId' => $tarea['id'],
                    'tareaTexto' => $tarea['texto'],
                    'proyectoId' => $tarea['proyectoId'] ?? null,
                ]
            );

            if ($resultado['exito']) {
                $creadas++;
            }
        }

        return $creadas;
    }

    /**
     * Crea notificación cuando una solicitud de equipo es aceptada
     * Notifica al usuario que envió la solicitud original
     *
     * @param int $usuarioDestinoId Usuario que envió la solicitud (recibirá la notificación)
     * @param int $usuarioAceptoId Usuario que aceptó la solicitud
     * @return array Resultado de la operación
     */
    public function notificarSolicitudAceptada(
        int $usuarioDestinoId,
        int $usuarioAceptoId
    ): array {
        $usuarioAcepto = get_user_by('ID', $usuarioAceptoId);
        $nombreAcepto = $usuarioAcepto ? $usuarioAcepto->display_name : 'Usuario';

        return $this->crear(
            $usuarioDestinoId,
            self::TIPO_SOLICITUD_ACEPTADA,
            "{$nombreAcepto} aceptó tu solicitud",
            "¡Ahora {$nombreAcepto} es parte de tu equipo!",
            [
                'usuarioId' => $usuarioAceptoId,
                'usuarioNombre' => $nombreAcepto,
                'usuarioAvatar' => $usuarioAcepto ? get_avatar_url($usuarioAceptoId, ['size' => 48]) : '',
            ]
        );
    }

    /**
     * Formatea una notificación para la respuesta de API
     */
    private function formatear(
        int $id,
        string $tipo,
        string $titulo,
        ?string $contenido,
        int $leida,
        string $fechaCreacion,
        ?string $fechaLectura,
        ?array $datosExtra = null
    ): array {
        return [
            'id' => $id,
            'tipo' => $tipo,
            'titulo' => $titulo,
            'contenido' => $contenido,
            'leida' => (bool)$leida,
            'fechaCreacion' => $fechaCreacion,
            'fechaLectura' => $fechaLectura,
            'datosExtra' => $datosExtra,
        ];
    }

    /**
     * Formatea una notificación desde un objeto de base de datos
     */
    private function formatearDesdeDB(object $notificacion): array
    {
        $datosExtra = $notificacion->datos_extra
            ? json_decode($notificacion->datos_extra, true)
            : null;

        return $this->formatear(
            (int)$notificacion->id,
            $notificacion->tipo,
            $notificacion->titulo,
            $notificacion->contenido,
            (int)$notificacion->leida,
            $notificacion->fecha_creacion,
            $notificacion->fecha_lectura,
            $datosExtra
        );
    }
}
