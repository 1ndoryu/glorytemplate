<?php

/**
 * Endpoints REST API para gestión de clientes y pagos (solo admin).
 *
 * [2003A-3] Tab de administración donde el admin ve todos los centros
 * con su estado de suscripción, datos de contacto y acciones.
 *
 * [2003A-15] Añadidos métodos para editar usuario, cambiar plan,
 * bloquear acceso y eliminar cuenta completa.
 *
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Api\Traits\ConCallbackSeguro;
use Glory\App\Database\Repositories\CapSuscripcionesRepository;

class CapClientesEndpoints
{
    use ConCallbackSeguro;

    /**
     * GET /cap/v1/admin/clientes
     * Lista todos los centros con su suscripción más reciente.
     */
    public function listarClientes(\WP_REST_Request $request): \WP_REST_Response
    {
        $limite = absint($request->get_param('limite') ?? 50);
        $offset = absint($request->get_param('offset') ?? 0);

        $suscripciones = CapSuscripcionesRepository::listarTodosConCentro($limite, $offset);
        $total = CapSuscripcionesRepository::contarTodos();

        /* Enriquecer con datos del usuario WP (nombre de login, email WP, bloqueo) */
        $clientes = array_map(function ($registro) {
            $wpUser = !empty($registro['user_id'])
                ? get_userdata((int) $registro['user_id'])
                : null;

            $registro['wp_user_login'] = $wpUser ? $wpUser->user_login : '';
            $registro['wp_user_email'] = $wpUser ? $wpUser->user_email : '';
            $registro['wp_display_name'] = $wpUser ? $wpUser->display_name : '';
            /* [2003A-15] Estado de bloqueo de acceso */
            $registro['acceso_bloqueado'] = $wpUser
                ? (get_user_meta($wpUser->ID, 'cap_acceso_bloqueado', true) === '1')
                : false;

            return $registro;
        }, $suscripciones);

        return new \WP_REST_Response([
            'clientes' => $clientes,
            'total' => $total,
        ]);
    }

    /**
     * [2003A-15] PUT /cap/v1/admin/clientes/{userId}/usuario
     * Actualiza nombre, email y/o contraseña de un usuario.
     * El admin puede hacerlo sin conocer la contraseña actual.
     */
    public function actualizarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = (int) $request->get_param('userId');
        $datos = $request->get_json_params();
        $cambios = ['ID' => $userId];

        if (!get_userdata($userId)) {
            return new \WP_REST_Response(['error' => 'Usuario no encontrado.'], 404);
        }

        if (isset($datos['nombre'])) {
            $nombre = sanitize_text_field($datos['nombre']);
            if (empty($nombre)) {
                return new \WP_REST_Response(['error' => 'El nombre no puede estar vacío.'], 400);
            }
            $cambios['display_name'] = $nombre;
        }

        if (isset($datos['email'])) {
            $email = sanitize_email($datos['email']);
            if (!is_email($email)) {
                return new \WP_REST_Response(['error' => 'El email no es válido.'], 400);
            }
            $existente = email_exists($email);
            if ($existente && (int) $existente !== $userId) {
                return new \WP_REST_Response(['error' => 'Ese email ya está en uso.'], 400);
            }
            $cambios['user_email'] = $email;
        }

        if (!empty($datos['contrasenaNueva'])) {
            if (mb_strlen($datos['contrasenaNueva']) < 8) {
                return new \WP_REST_Response(['error' => 'La contraseña debe tener al menos 8 caracteres.'], 400);
            }
            $cambios['user_pass'] = $datos['contrasenaNueva'];
        }

        if (count($cambios) <= 1) {
            return new \WP_REST_Response(['error' => 'No se especificaron cambios.'], 400);
        }

        $resultado = wp_update_user($cambios);
        if (is_wp_error($resultado)) {
            error_log('[CAP Clientes] Error actualizando usuario ' . $userId . ': ' . $resultado->get_error_message());
            return new \WP_REST_Response(['error' => $resultado->get_error_message()], 500);
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Usuario actualizado correctamente.']);
    }

    /**
     * [2003A-15] PUT /cap/v1/admin/clientes/{centroId}/plan
     * Activa o desactiva el plan de un centro (cambia estado de suscripción).
     */
    public function cambiarEstadoPlan(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $centroId = (int) $request->get_param('centroId');
        $accion = sanitize_key($request->get_param('accion') ?? '');

        if (!in_array($accion, ['activar', 'desactivar'], true)) {
            return new \WP_REST_Response(['error' => 'Acción inválida. Usa "activar" o "desactivar".'], 400);
        }

        $tabla = $wpdb->prefix . 'cap_suscripciones';
        $nuevoEstado = $accion === 'activar' ? 'activa' : 'cancelada';

        $resultado = $wpdb->update(
            $tabla,
            ['estado' => $nuevoEstado, 'updated_at' => current_time('mysql')],
            ['centro_id' => $centroId],
            ['%s', '%s'],
            ['%d']
        );

        if ($resultado === false) {
            error_log('[CAP Clientes] Error cambiando plan del centro ' . $centroId . ': ' . $wpdb->last_error);
            return new \WP_REST_Response(['error' => 'Error al actualizar el plan.'], 500);
        }

        $etiqueta = $accion === 'activar' ? 'activado' : 'desactivado';
        return new \WP_REST_Response(['ok' => true, 'mensaje' => "Plan {$etiqueta} correctamente."]);
    }

    /**
     * [2003A-15] PUT /cap/v1/admin/clientes/{userId}/acceso
     * Bloquea o desbloquea el acceso al dashboard CAP de un usuario.
     */
    public function cambiarAcceso(\WP_REST_Request $request): \WP_REST_Response
    {
        $userId = (int) $request->get_param('userId');
        $datos = $request->get_json_params();

        if (!isset($datos['bloqueado'])) {
            return new \WP_REST_Response(['error' => 'Campo bloqueado requerido.'], 400);
        }

        if (!get_userdata($userId)) {
            return new \WP_REST_Response(['error' => 'Usuario no encontrado.'], 404);
        }

        $bloqueado = (bool) $datos['bloqueado'];
        update_user_meta($userId, 'cap_acceso_bloqueado', $bloqueado ? '1' : '0');

        $etiqueta = $bloqueado ? 'bloqueado' : 'desbloqueado';
        return new \WP_REST_Response(['ok' => true, 'mensaje' => "Acceso {$etiqueta} correctamente."]);
    }

    /**
     * [2003A-15] POST /cap/v1/admin/clientes/{userId}/eliminar
     * Elimina el usuario y todos sus datos CAP asociados en cascada.
     * Orden: asistencia → disponibilidad → alumnos → clases → config → suscripciones → centros → usuario WP.
     *
     * [2003A-15fix2] No se aborta si el usuario WP no existe: puede ser un centro huérfano
     * (datos CAP sin usuario WP asociado, por ejemplo de demo o borrado manual).
     * Se limpian los datos CAP y se intenta borrar el usuario WP si existe.
     */
    public function eliminarUsuario(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $userId = (int) $request->get_param('userId');

        $pref = $wpdb->prefix . 'cap_';
        $centroId = (int) $wpdb->get_var(
            $wpdb->prepare("SELECT id FROM {$pref}centros WHERE user_id = %d LIMIT 1", $userId)
        );

        if ($centroId > 0) {
            /* Asistencia (depende de clases del centro) */
            $wpdb->query($wpdb->prepare(
                "DELETE a FROM {$pref}asistencia a INNER JOIN {$pref}clases c ON a.clase_id = c.id WHERE c.centro_id = %d",
                $centroId
            ));
            /* Disponibilidad (depende de alumnos del centro) */
            $wpdb->query($wpdb->prepare(
                "DELETE d FROM {$pref}disponibilidad d INNER JOIN {$pref}alumnos al ON d.alumno_id = al.id WHERE al.centro_id = %d",
                $centroId
            ));
            /* Alumnos */
            $resAlumnos = $wpdb->delete("{$pref}alumnos", ['centro_id' => $centroId], ['%d']);
            if ($resAlumnos === false) {
                error_log("[CAP Clientes] Error eliminando alumnos del centro {$centroId}: " . $wpdb->last_error);
            }
            /* Clases */
            $resClases = $wpdb->delete("{$pref}clases", ['centro_id' => $centroId], ['%d']);
            if ($resClases === false) {
                error_log("[CAP Clientes] Error eliminando clases del centro {$centroId}: " . $wpdb->last_error);
            }
            /* Configuración */
            $resConfig = $wpdb->delete("{$pref}configuracion", ['centro_id' => $centroId], ['%d']);
            if ($resConfig === false) {
                error_log("[CAP Clientes] Error eliminando config del centro {$centroId}: " . $wpdb->last_error);
            }
            /* Suscripciones */
            $resSus = $wpdb->delete("{$pref}suscripciones", ['centro_id' => $centroId], ['%d']);
            if ($resSus === false) {
                error_log("[CAP Clientes] Error eliminando suscripciones del centro {$centroId}: " . $wpdb->last_error);
            }
            /* Problemas reportados */
            $resProbs = $wpdb->delete("{$pref}problemas", ['user_id' => $userId], ['%d']);
            if ($resProbs === false) {
                error_log("[CAP Clientes] Error eliminando problemas del usuario {$userId}: " . $wpdb->last_error);
            }
            /* Centro */
            $resCentro = $wpdb->delete("{$pref}centros", ['id' => $centroId], ['%d']);
            if ($resCentro === false) {
                error_log("[CAP Clientes] Error eliminando centro {$centroId}: " . $wpdb->last_error);
            }
        }

        /* Eliminar usuario de WordPress (solo si existe) */
        $wpUser = get_userdata($userId);
        if ($wpUser) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
            $ok = wp_delete_user($userId);
            if (!$ok) {
                error_log('[CAP Clientes] wp_delete_user falló para userId=' . $userId);
                return new \WP_REST_Response(['error' => 'No se pudo eliminar el usuario de WordPress.'], 500);
            }
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Usuario y todos sus datos eliminados correctamente.']);
    }
}
