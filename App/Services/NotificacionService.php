<?php

namespace App\Services;

use Glory\Core\GloryLogger;
use Glory\Manager\OpcionManager;

/**
 * Servicio de notificaciones por email.
 *
 * Envía emails al admin y al cliente para reservas.
 * Usa wp_mail() de WordPress.
 */
class NotificacionService
{
    /**
     * Obtiene el email de destino para notificaciones al admin/propietario.
     *
     * Prioridad: cresta_email_notificaciones > cresta_empresa_email > admin_email de WP.
     */
    private static function obtenerEmailAdmin(): string
    {
        $emailNotificaciones = OpcionManager::get('cresta_email_notificaciones', '');
        if (!empty($emailNotificaciones) && is_email($emailNotificaciones)) {
            return $emailNotificaciones;
        }

        return OpcionManager::get('cresta_empresa_email', get_option('admin_email'));
    }

    /**
     * Construye los headers comunes para emails salientes.
     *
     * @param string $replyTo Email opcional de Reply-To (ej: email del cliente)
     */
    private static function construirHeaders(string $replyTo = ''): array
    {
        $empresa = OpcionManager::get('cresta_empresa_nombre', 'Cresta Campers');
        $fromEmail = OpcionManager::get('cresta_empresa_email', get_option('admin_email'));

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            "From: {$empresa} <{$fromEmail}>",
        ];

        if (!empty($replyTo) && is_email($replyTo)) {
            $headers[] = "Reply-To: {$replyTo}";
        }

        return $headers;
    }

    /**
     * Envía email de confirmación de reserva al cliente.
     */
    public static function confirmarReservaCliente(int $reservaId): void
    {
        $meta = self::obtenerMetaReserva($reservaId);
        if (!$meta) {
            GloryLogger::error("NotificacionService: No se pudo obtener meta de reserva #{$reservaId}");
            return;
        }

        $vehiculo = get_post($meta['_reserva_vehiculo_id']);
        $nombreVehiculo = $vehiculo ? $vehiculo->post_title : 'Vehículo';
        $empresa = OpcionManager::get('cresta_empresa_nombre', 'Cresta Campers');
        $horarioRecogida  = OpcionManager::get('cresta_horario_recogida', '16:00');
        $horarioDevolucion = OpcionManager::get('cresta_horario_devolucion', '10:00');

        $asunto = "Reserva confirmada - {$empresa} (#{$reservaId})";

        $mensaje = self::plantillaEmail([
            'titulo'    => 'Reserva confirmada',
            'contenido' => "
                <p>Hola <strong>{$meta['_reserva_nombre_cliente']}</strong>,</p>
                <p>Tu reserva ha sido confirmada. Aquí tienes los detalles:</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Vehiculo</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$nombreVehiculo}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Recogida</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_fecha_inicio']} a las {$horarioRecogida}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Devolucion</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_fecha_fin']} a las {$horarioDevolucion}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Noches</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_noches']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Total</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;font-size:18px;'>{$meta['_reserva_precio_total']} EUR</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>N. Reserva</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>#{$reservaId}</td></tr>
                </table>
                <p style='margin-top:20px;'>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            ",
            'empresa' => $empresa,
        ]);

        $adminEmail = self::obtenerEmailAdmin();
        $headers = self::construirHeaders($adminEmail);

        $enviado = wp_mail($meta['_reserva_email_cliente'], $asunto, $mensaje, $headers);

        if (!$enviado) {
            GloryLogger::error("NotificacionService: Fallo al enviar confirmacion a {$meta['_reserva_email_cliente']}");
        }
    }

    /**
     * Envía notificación de reserva confirmada (pagada) al admin.
     */
    public static function notificarAdminNuevaReserva(int $reservaId): void
    {
        $meta = self::obtenerMetaReserva($reservaId);
        if (!$meta) {
            return;
        }

        $vehiculo = get_post($meta['_reserva_vehiculo_id']);
        $nombreVehiculo = $vehiculo ? $vehiculo->post_title : 'Vehículo';
        $empresa = OpcionManager::get('cresta_empresa_nombre', 'Cresta Campers');

        $asunto = "Reserva confirmada #{$reservaId} - {$meta['_reserva_nombre_cliente']}";

        $mensaje = self::plantillaEmail([
            'titulo'    => 'Reserva confirmada y pagada',
            'contenido' => "
                <p>Se ha confirmado el pago de una reserva:</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Cliente</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_nombre_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Email</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_email_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Telefono</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_telefono_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Vehiculo</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$nombreVehiculo}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Fechas</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_fecha_inicio']} a {$meta['_reserva_fecha_fin']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Noches</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_noches']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Total</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;font-size:18px;'>{$meta['_reserva_precio_total']} EUR</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Temporada</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_temporada']}</td></tr>
                </table>
                <p><a href='" . admin_url("post.php?post={$reservaId}&action=edit") . "' style='background:#2d6a4f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;'>Ver en admin</a></p>
            ",
            'empresa' => $empresa,
        ]);

        $headers = self::construirHeaders($meta['_reserva_email_cliente']);
        $adminEmail = self::obtenerEmailAdmin();

        $enviado = wp_mail($adminEmail, $asunto, $mensaje, $headers);
        if (!$enviado) {
            GloryLogger::error("NotificacionService: Fallo al enviar notificacion admin para reserva #{$reservaId}");
        }
    }

    /**
     * Notifica al admin que se ha creado una nueva reserva pendiente de pago.
     *
     * Se llama desde ReservaController justo despues de crear la reserva
     * y la sesion de Stripe Checkout, antes de que el cliente pague.
     */
    public static function notificarAdminReservaPendiente(int $reservaId): void
    {
        $meta = self::obtenerMetaReserva($reservaId);
        if (!$meta) {
            return;
        }

        $vehiculo = get_post($meta['_reserva_vehiculo_id']);
        $nombreVehiculo = $vehiculo ? $vehiculo->post_title : 'Vehículo';
        $empresa = OpcionManager::get('cresta_empresa_nombre', 'Cresta Campers');

        $asunto = "Nueva reserva pendiente #{$reservaId} - {$meta['_reserva_nombre_cliente']}";

        $mensaje = self::plantillaEmail([
            'titulo'    => 'Nueva reserva pendiente de pago',
            'contenido' => "
                <p>Un cliente ha iniciado una reserva y esta en proceso de pago:</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Cliente</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_nombre_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Email</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_email_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Telefono</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_telefono_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Vehiculo</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$nombreVehiculo}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Fechas</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_fecha_inicio']} a {$meta['_reserva_fecha_fin']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Total</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_precio_total']} EUR</td></tr>
                </table>
                <p style='color:#888;font-size:13px;'>Recibiras otra notificacion cuando el pago se confirme.</p>
            ",
            'empresa' => $empresa,
        ]);

        $headers = self::construirHeaders($meta['_reserva_email_cliente']);
        $adminEmail = self::obtenerEmailAdmin();

        $enviado = wp_mail($adminEmail, $asunto, $mensaje, $headers);
        if (!$enviado) {
            GloryLogger::error("NotificacionService: Fallo al enviar notificacion pendiente para reserva #{$reservaId}");
        }
    }

    /**
     * Notifica la cancelacion de una reserva al admin y al cliente.
     *
     * Se llama desde AdminController::cambiarEstadoReserva cuando
     * el estado cambia a "cancelada".
     */
    public static function notificarCancelacionReserva(int $reservaId): void
    {
        $meta = self::obtenerMetaReserva($reservaId);
        if (!$meta) {
            return;
        }

        $vehiculo = get_post($meta['_reserva_vehiculo_id']);
        $nombreVehiculo = $vehiculo ? $vehiculo->post_title : 'Vehículo';
        $empresa = OpcionManager::get('cresta_empresa_nombre', 'Cresta Campers');

        /* Notificar al admin */
        $asuntoAdmin = "Reserva cancelada #{$reservaId} - {$meta['_reserva_nombre_cliente']}";
        $mensajeAdmin = self::plantillaEmail([
            'titulo'    => 'Reserva cancelada',
            'contenido' => "
                <p>La siguiente reserva ha sido cancelada:</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Cliente</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_nombre_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Vehiculo</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$nombreVehiculo}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Fechas</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_fecha_inicio']} a {$meta['_reserva_fecha_fin']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Total</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_precio_total']} EUR</td></tr>
                </table>
            ",
            'empresa' => $empresa,
        ]);

        $headersAdmin = self::construirHeaders($meta['_reserva_email_cliente']);
        $adminEmail = self::obtenerEmailAdmin();
        $enviadoAdmin = wp_mail($adminEmail, $asuntoAdmin, $mensajeAdmin, $headersAdmin);
        if (!$enviadoAdmin) {
            GloryLogger::error("NotificacionService: Fallo al enviar cancelacion admin para reserva #{$reservaId}");
        }

        /* Notificar al cliente */
        $asuntoCliente = "Tu reserva ha sido cancelada - {$empresa} (#{$reservaId})";
        $mensajeCliente = self::plantillaEmail([
            'titulo'    => 'Reserva cancelada',
            'contenido' => "
                <p>Hola <strong>{$meta['_reserva_nombre_cliente']}</strong>,</p>
                <p>Tu reserva para <strong>{$nombreVehiculo}</strong> del {$meta['_reserva_fecha_inicio']} al {$meta['_reserva_fecha_fin']} ha sido cancelada.</p>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            ",
            'empresa' => $empresa,
        ]);

        $headersCliente = self::construirHeaders($adminEmail);
        $enviadoCliente = wp_mail($meta['_reserva_email_cliente'], $asuntoCliente, $mensajeCliente, $headersCliente);
        if (!$enviadoCliente) {
            GloryLogger::error("NotificacionService: Fallo al enviar cancelacion cliente para reserva #{$reservaId}");
        }
    }

    /**
     * Obtiene todos los meta de una reserva.
     *
     * @return array|null
     */
    private static function obtenerMetaReserva(int $reservaId): ?array
    {
        $post = get_post($reservaId);
        if (!$post || $post->post_type !== 'reserva') {
            return null;
        }

        $campos = [
            '_reserva_vehiculo_id',
            '_reserva_fecha_inicio',
            '_reserva_fecha_fin',
            '_reserva_noches',
            '_reserva_precio_noche',
            '_reserva_precio_total',
            '_reserva_estado',
            '_reserva_nombre_cliente',
            '_reserva_email_cliente',
            '_reserva_telefono_cliente',
            '_reserva_stripe_session_id',
            '_reserva_stripe_payment_intent',
            '_reserva_notas',
            '_reserva_temporada',
        ];

        $meta = [];
        foreach ($campos as $campo) {
            $meta[$campo] = get_post_meta($reservaId, $campo, true);
        }

        return $meta;
    }

    /**
     * Genera HTML de email con plantilla.
     */
    private static function plantillaEmail(array $datos): string
    {
        $empresa = $datos['empresa'] ?? 'Cresta Campers';
        $titulo  = $datos['titulo'] ?? '';
        $body    = $datos['contenido'] ?? '';

        return "
        <!DOCTYPE html>
        <html>
        <head><meta charset='UTF-8'></head>
        <body style='margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f5f5f5;'>
            <div style='max-width:600px;margin:0 auto;background:#ffffff;'>
                <div style='background:#2d6a4f;padding:30px;text-align:center;'>
                    <h1 style='color:#ffffff;margin:0;font-size:24px;'>{$empresa}</h1>
                </div>
                <div style='padding:30px;'>
                    <h2 style='color:#2d6a4f;margin-top:0;'>{$titulo}</h2>
                    {$body}
                </div>
                <div style='background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#999;'>
                    <p>{$empresa} — Alquiler de furgonetas camper</p>
                </div>
            </div>
        </body>
        </html>";
    }
}
