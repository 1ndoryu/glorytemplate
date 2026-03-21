<?php

/**
 * Endpoints REST API para gestión de clientes y pagos (solo admin).
 *
 * [2003A-3] Tab de administración donde el admin ve todos los centros
 * con su estado de suscripción, datos de contacto y acciones.
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

        /* Enriquecer con datos del usuario WP (nombre de login, email WP) */
        $clientes = array_map(function ($registro) {
            $wpUser = !empty($registro['user_id'])
                ? get_userdata((int) $registro['user_id'])
                : null;

            $registro['wp_user_login'] = $wpUser ? $wpUser->user_login : '';
            $registro['wp_user_email'] = $wpUser ? $wpUser->user_email : '';
            $registro['wp_display_name'] = $wpUser ? $wpUser->display_name : '';

            return $registro;
        }, $suscripciones);

        return new \WP_REST_Response([
            'clientes' => $clientes,
            'total' => $total,
        ]);
    }
}
