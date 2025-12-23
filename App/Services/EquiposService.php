<?php

/**
 * Servicio de Equipos
 *
 * Gestiona la lógica para el sistema de equipos (social):
 * - Enviar solicitudes de conexión por correo
 * - Listar compañeros activos
 * - Aceptar/rechazar solicitudes
 * - Gestionar solicitudes pendientes para usuarios no registrados
 *
 * @package App\Services
 */

namespace App\Services;

use App\Database\Schema;

class EquiposService
{
    private string $tabla;
    private NotificacionesService $notificaciones;

    public function __construct()
    {
        $this->tabla = Schema::getTableName('equipos');
        $this->notificaciones = new NotificacionesService();
    }

    /**
     * Envía una solicitud de conexión a otro usuario por correo
     * Si el usuario no existe, guarda como pendiente_registro
     *
     * @param int $usuarioId ID del usuario que envía la solicitud
     * @param string $email Correo del usuario destino
     * @return array Resultado de la operación
     */
    public function enviarSolicitud(int $usuarioId, string $email): array
    {
        global $wpdb;

        $email = sanitize_email($email);

        if (!is_email($email)) {
            return [
                'exito' => false,
                'mensaje' => 'El correo electrónico no es válido',
                'codigo' => 'email_invalido'
            ];
        }

        $usuarioActual = get_user_by('ID', $usuarioId);
        if (!$usuarioActual) {
            return [
                'exito' => false,
                'mensaje' => 'Usuario no encontrado',
                'codigo' => 'usuario_no_encontrado'
            ];
        }

        if (strtolower($usuarioActual->user_email) === strtolower($email)) {
            return [
                'exito' => false,
                'mensaje' => 'No puedes enviarte una solicitud a ti mismo',
                'codigo' => 'auto_solicitud'
            ];
        }

        $usuarioDestino = get_user_by('email', $email);

        if ($usuarioDestino) {
            $existente = $this->obtenerConexion($usuarioId, $usuarioDestino->ID);
            if ($existente) {
                return $this->manejarSolicitudExistente($existente);
            }

            $wpdb->insert($this->tabla, [
                'usuario_id' => $usuarioId,
                'companero_id' => $usuarioDestino->ID,
                'companero_email' => $email,
                'estado' => 'pendiente',
                'fecha_solicitud' => current_time('mysql')
            ]);

            $solicitudId = $wpdb->insert_id;

            /* Crear notificación para el destinatario */
            $this->notificaciones->notificarSolicitudEquipo(
                $usuarioDestino->ID,
                $usuarioId,
                $solicitudId
            );

            return [
                'exito' => true,
                'mensaje' => 'Solicitud enviada correctamente',
                'solicitud' => $this->formatearSolicitud(
                    $solicitudId,
                    $usuarioId,
                    $usuarioDestino->ID,
                    'pendiente',
                    current_time('mysql'),
                    null
                )
            ];
        }

        $pendiente = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} 
                WHERE usuario_id = %d AND companero_email = %s AND estado = 'pendiente_registro'",
                $usuarioId,
                $email
            )
        );

        if ($pendiente) {
            return [
                'exito' => false,
                'mensaje' => 'Ya tienes una solicitud pendiente para este correo',
                'codigo' => 'solicitud_pendiente'
            ];
        }

        $wpdb->insert($this->tabla, [
            'usuario_id' => $usuarioId,
            'companero_id' => null,
            'companero_email' => $email,
            'estado' => 'pendiente_registro',
            'fecha_solicitud' => current_time('mysql')
        ]);

        return [
            'exito' => true,
            'mensaje' => 'El usuario no está registrado. La solicitud se activará cuando se registre.',
            'solicitud' => $this->formatearSolicitud(
                $wpdb->insert_id,
                $usuarioId,
                null,
                'pendiente_registro',
                current_time('mysql'),
                null,
                $email
            )
        ];
    }

    /**
     * Obtiene todas las solicitudes y compañeros del usuario
     *
     * @param int $usuarioId ID del usuario
     * @return array Listas de recibidas, enviadas y compañeros
     */
    public function obtenerEquipo(int $usuarioId): array
    {
        global $wpdb;

        $recibidas = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} 
                WHERE companero_id = %d AND estado = 'pendiente'
                ORDER BY fecha_solicitud DESC",
                $usuarioId
            )
        );

        $enviadas = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} 
                WHERE usuario_id = %d AND estado IN ('pendiente', 'pendiente_registro')
                ORDER BY fecha_solicitud DESC",
                $usuarioId
            )
        );

        $companeros = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} 
                WHERE (usuario_id = %d OR companero_id = %d) AND estado = 'aceptada'
                ORDER BY fecha_respuesta DESC",
                $usuarioId,
                $usuarioId
            )
        );

        return [
            'recibidas' => array_map(fn($r) => $this->formatearSolicitudCompleta($r, $usuarioId), $recibidas),
            'enviadas' => array_map(fn($r) => $this->formatearSolicitudCompleta($r, $usuarioId), $enviadas),
            'companeros' => array_map(fn($r) => $this->formatearCompanero($r, $usuarioId), $companeros),
            'contadores' => [
                'recibidas' => count($recibidas),
                'enviadas' => count($enviadas),
                'companeros' => count($companeros)
            ]
        ];
    }

    /**
     * Responde a una solicitud (aceptar o rechazar)
     *
     * @param int $solicitudId ID de la solicitud
     * @param int $usuarioId ID del usuario que responde
     * @param string $accion 'aceptar' o 'rechazar'
     * @return array Resultado de la operación
     */
    public function responderSolicitud(int $solicitudId, int $usuarioId, string $accion): array
    {
        global $wpdb;

        $solicitud = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} WHERE id = %d",
                $solicitudId
            )
        );

        if (!$solicitud) {
            return [
                'exito' => false,
                'mensaje' => 'Solicitud no encontrada',
                'codigo' => 'solicitud_no_encontrada'
            ];
        }

        if ((int)$solicitud->companero_id !== $usuarioId) {
            return [
                'exito' => false,
                'mensaje' => 'No tienes permiso para responder a esta solicitud',
                'codigo' => 'sin_permiso'
            ];
        }

        if ($solicitud->estado !== 'pendiente') {
            return [
                'exito' => false,
                'mensaje' => 'Esta solicitud ya fue respondida',
                'codigo' => 'ya_respondida'
            ];
        }

        $nuevoEstado = $accion === 'aceptar' ? 'aceptada' : 'rechazada';

        $wpdb->update(
            $this->tabla,
            [
                'estado' => $nuevoEstado,
                'fecha_respuesta' => current_time('mysql')
            ],
            ['id' => $solicitudId]
        );

        /* Notificar al solicitante cuando se acepta la solicitud */
        if ($accion === 'aceptar') {
            $this->notificaciones->notificarSolicitudAceptada(
                (int)$solicitud->usuario_id,
                $usuarioId
            );
        }

        $mensaje = $accion === 'aceptar'
            ? 'Solicitud aceptada'
            : 'Solicitud rechazada';

        return [
            'exito' => true,
            'mensaje' => $mensaje,
            'estado' => $nuevoEstado
        ];
    }

    /**
     * Elimina una solicitud o conexión
     *
     * @param int $solicitudId ID de la solicitud
     * @param int $usuarioId ID del usuario que elimina
     * @return array Resultado de la operación
     */
    public function eliminarConexion(int $solicitudId, int $usuarioId): array
    {
        global $wpdb;

        $solicitud = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} WHERE id = %d",
                $solicitudId
            )
        );

        if (!$solicitud) {
            return [
                'exito' => false,
                'mensaje' => 'Conexión no encontrada',
                'codigo' => 'no_encontrada'
            ];
        }

        $esParticipante = (int)$solicitud->usuario_id === $usuarioId
            || (int)$solicitud->companero_id === $usuarioId;

        if (!$esParticipante) {
            return [
                'exito' => false,
                'mensaje' => 'No tienes permiso para eliminar esta conexión',
                'codigo' => 'sin_permiso'
            ];
        }

        $wpdb->delete($this->tabla, ['id' => $solicitudId]);

        return [
            'exito' => true,
            'mensaje' => 'Conexión eliminada correctamente'
        ];
    }

    /**
     * Activa solicitudes pendientes cuando un usuario se registra
     * Llamar desde el hook de registro de usuario
     *
     * @param int $nuevoUsuarioId ID del nuevo usuario
     * @param string $email Correo del nuevo usuario
     * @return int Número de solicitudes activadas
     */
    public function activarSolicitudesPendientes(int $nuevoUsuarioId, string $email): int
    {
        global $wpdb;

        $pendientes = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} 
                WHERE companero_email = %s AND estado = 'pendiente_registro'",
                $email
            )
        );

        foreach ($pendientes as $solicitud) {
            $wpdb->update(
                $this->tabla,
                [
                    'companero_id' => $nuevoUsuarioId,
                    'estado' => 'pendiente'
                ],
                ['id' => $solicitud->id]
            );
        }

        return count($pendientes);
    }

    /**
     * Obtiene una conexión existente entre dos usuarios
     */
    private function obtenerConexion(int $userId1, int $userId2): ?object
    {
        global $wpdb;

        return $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$this->tabla} 
                WHERE (usuario_id = %d AND companero_id = %d)
                   OR (usuario_id = %d AND companero_id = %d)",
                $userId1,
                $userId2,
                $userId2,
                $userId1
            )
        );
    }

    /**
     * Maneja casos de solicitud existente
     */
    private function manejarSolicitudExistente(object $existente): array
    {
        $estado = $existente->estado;

        if ($estado === 'aceptada') {
            return [
                'exito' => false,
                'mensaje' => 'Ya estás conectado con este usuario',
                'codigo' => 'ya_conectados'
            ];
        }

        if ($estado === 'pendiente') {
            return [
                'exito' => false,
                'mensaje' => 'Ya existe una solicitud pendiente con este usuario',
                'codigo' => 'solicitud_pendiente'
            ];
        }

        if ($estado === 'rechazada') {
            return [
                'exito' => false,
                'mensaje' => 'Esta conexión fue rechazada anteriormente',
                'codigo' => 'rechazada'
            ];
        }

        return [
            'exito' => false,
            'mensaje' => 'Error desconocido',
            'codigo' => 'error_desconocido'
        ];
    }

    /**
     * Formatea una solicitud para la respuesta de API
     */
    private function formatearSolicitud(
        int $id,
        int $usuarioId,
        ?int $companeroId,
        string $estado,
        string $fechaSolicitud,
        ?string $fechaRespuesta,
        ?string $email = null
    ): array {
        return [
            'id' => $id,
            'usuarioId' => $usuarioId,
            'companeroId' => $companeroId,
            'email' => $email,
            'estado' => $estado,
            'fechaSolicitud' => $fechaSolicitud,
            'fechaRespuesta' => $fechaRespuesta
        ];
    }

    /**
     * Formatea solicitud completa con datos del usuario
     */
    private function formatearSolicitudCompleta(object $solicitud, int $miId): array
    {
        $otroId = (int)$solicitud->usuario_id === $miId
            ? $solicitud->companero_id
            : $solicitud->usuario_id;

        $datosUsuario = null;
        if ($otroId) {
            $user = get_user_by('ID', $otroId);
            if ($user) {
                $datosUsuario = [
                    'id' => (int)$user->ID,
                    'nombre' => $user->display_name,
                    'email' => $user->user_email,
                    'avatar' => get_avatar_url($user->ID, ['size' => 48])
                ];
            }
        }

        return [
            'id' => (int)$solicitud->id,
            'estado' => $solicitud->estado,
            'fechaSolicitud' => $solicitud->fecha_solicitud,
            'fechaRespuesta' => $solicitud->fecha_respuesta,
            'email' => $solicitud->companero_email,
            'usuario' => $datosUsuario,
            'esMia' => (int)$solicitud->usuario_id === $miId
        ];
    }

    /**
     * Formatea un compañero activo
     */
    private function formatearCompanero(object $conexion, int $miId): array
    {
        $companeroId = (int)$conexion->usuario_id === $miId
            ? (int)$conexion->companero_id
            : (int)$conexion->usuario_id;

        $user = get_user_by('ID', $companeroId);

        return [
            'id' => (int)$conexion->id,
            'companeroId' => $companeroId,
            'nombre' => $user ? $user->display_name : 'Usuario eliminado',
            'email' => $user ? $user->user_email : '',
            'avatar' => $user ? get_avatar_url($user->ID, ['size' => 48]) : '',
            'fechaConexion' => $conexion->fecha_respuesta
        ];
    }

    /**
     * Cuenta solicitudes pendientes para el contador del header
     *
     * @param int $usuarioId ID del usuario
     * @return int Número de solicitudes pendientes recibidas
     */
    public function contarSolicitudesPendientes(int $usuarioId): int
    {
        global $wpdb;

        return (int)$wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->tabla} 
                WHERE companero_id = %d AND estado = 'pendiente'",
                $usuarioId
            )
        );
    }
}
