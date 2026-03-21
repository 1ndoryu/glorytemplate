<?php

/**
 * [2003A-13] Endpoints REST para reportar problemas.
 * Admin: envía email a andoryyu@gmail.com.
 * No-admin: guarda en BD para que el admin lo revise.
 *
 * @package Glory\App\Api
 */

namespace Glory\App\Api;

use Glory\App\Api\Traits\ConCallbackSeguro;
use Glory\App\Services\CapService;

class CapProblemasEndpoints
{
    use ConCallbackSeguro;

    private const EMAIL_DESTINO = 'andoryyu@gmail.com';

    protected function obtenerEtiquetaLog(): string
    {
        return 'CAP Problemas';
    }

    /**
     * Crea un reporte de problema.
     * Admin: envía email directo.
     * No-admin: guarda en cap_problemas para revisión del admin.
     */
    public function crearReporte(\WP_REST_Request $request): \WP_REST_Response
    {
        $mensaje = sanitize_textarea_field($request->get_param('mensaje'));

        if (empty(trim($mensaje))) {
            return new \WP_REST_Response(['error' => 'El mensaje no puede estar vacío'], 400);
        }

        $user = wp_get_current_user();
        $esAdmin = in_array('administrator', $user->roles, true);

        if ($esAdmin) {
            return $this->enviarEmailAdmin($user, $mensaje);
        }

        return $this->guardarReporteEnBd($user, $mensaje);
    }

    /**
     * Lista todos los reportes de problemas (solo admin).
     */
    public function listarReportes(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_problemas';

        $reportes = $wpdb->get_results(
            "SELECT p.*, u.display_name as nombre_usuario, u.user_email as email_usuario
             FROM {$tabla} p
             LEFT JOIN {$wpdb->users} u ON p.user_id = u.ID
             ORDER BY p.created_at DESC",
            ARRAY_A
        );

        if ($reportes === null) {
            error_log('[CAP Problemas] Error al listar reportes: ' . $wpdb->last_error);
            return new \WP_REST_Response(['error' => 'Error al obtener reportes'], 500);
        }

        return new \WP_REST_Response($reportes);
    }

    /**
     * Marca un reporte como resuelto.
     */
    public function resolverReporte(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_problemas';
        $id = (int) $request->get_param('id');

        $resultado = $wpdb->update(
            $tabla,
            [
                'estado' => 'resuelto',
                'resuelto_at' => current_time('mysql'),
            ],
            ['id' => $id],
            ['%s', '%s'],
            ['%d']
        );

        if ($resultado === false) {
            error_log('[CAP Problemas] Error al resolver reporte ' . $id . ': ' . $wpdb->last_error);
            return new \WP_REST_Response(['error' => 'Error al actualizar el reporte'], 500);
        }

        if ($resultado === 0) {
            return new \WP_REST_Response(['error' => 'Reporte no encontrado'], 404);
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Reporte marcado como resuelto']);
    }

    /**
     * Elimina un reporte.
     */
    public function eliminarReporte(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_problemas';
        $id = (int) $request->get_param('id');

        $resultado = $wpdb->delete($tabla, ['id' => $id], ['%d']);

        if ($resultado === false) {
            error_log('[CAP Problemas] Error al eliminar reporte ' . $id . ': ' . $wpdb->last_error);
            return new \WP_REST_Response(['error' => 'Error al eliminar el reporte'], 500);
        }

        if ($resultado === 0) {
            return new \WP_REST_Response(['error' => 'Reporte no encontrado'], 404);
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Reporte eliminado']);
    }

    /**
     * Envía email directo para reporte de admin.
     */
    private function enviarEmailAdmin(\WP_User $user, string $mensaje): \WP_REST_Response
    {
        $sitio = get_bloginfo('name');
        $asunto = "[{$sitio}] Problema reportado por {$user->display_name}";
        $cuerpo = "Usuario: {$user->display_name} ({$user->user_email})\n";
        $cuerpo .= "Fecha: " . current_time('d/m/Y H:i') . "\n\n";
        $cuerpo .= "Mensaje:\n{$mensaje}";

        $enviado = wp_mail(self::EMAIL_DESTINO, $asunto, $cuerpo);

        if (!$enviado) {
            error_log('[CAP Problemas] Error al enviar email de reporte del admin');
            return new \WP_REST_Response(['error' => 'No se pudo enviar el email. Intenta de nuevo.'], 500);
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Email enviado correctamente']);
    }

    /**
     * Guarda reporte de usuario no-admin en la BD.
     */
    private function guardarReporteEnBd(\WP_User $user, string $mensaje): \WP_REST_Response
    {
        global $wpdb;
        $tabla = $wpdb->prefix . 'cap_problemas';

        $capService = CapService::getInstance();
        $centroId = $capService->getCentroIdActual();

        $resultado = $wpdb->insert(
            $tabla,
            [
                'user_id' => $user->ID,
                'centro_id' => $centroId ?: null,
                'mensaje' => $mensaje,
                'estado' => 'pendiente',
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%d', '%s', '%s', '%s']
        );

        if ($resultado === false) {
            error_log('[CAP Problemas] Error al guardar reporte: ' . $wpdb->last_error);
            return new \WP_REST_Response(['error' => 'Error al guardar el reporte'], 500);
        }

        return new \WP_REST_Response(['ok' => true, 'mensaje' => 'Reporte enviado. El administrador lo revisará.']);
    }
}
