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
            'titulo'    => '¡Reserva confirmada!',
            'contenido' => "
                <p>Hola <strong>{$meta['_reserva_nombre_cliente']}</strong>,</p>
                <p>Tu reserva ha sido confirmada. Aquí tienes los detalles:</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Vehículo</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$nombreVehiculo}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Recogida</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_fecha_inicio']} a las {$horarioRecogida}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Devolución</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_fecha_fin']} a las {$horarioDevolucion}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Noches</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_noches']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Total</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;font-size:18px;'>{$meta['_reserva_precio_total']} €</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Nº Reserva</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>#{$reservaId}</td></tr>
                </table>
                <p style='margin-top:20px;'>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                <p>¡Nos vemos pronto! 🚐</p>
            ",
            'empresa' => $empresa,
        ]);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            "From: {$empresa} <" . OpcionManager::get('cresta_empresa_email', get_option('admin_email')) . ">",
        ];

        $enviado = wp_mail($meta['_reserva_email_cliente'], $asunto, $mensaje, $headers);

        if (!$enviado) {
            GloryLogger::error("NotificacionService: Fallo al enviar email a {$meta['_reserva_email_cliente']}");
        }
    }

    /**
     * Envía notificación de nueva reserva al admin.
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

        $asunto = "Nueva reserva confirmada #{$reservaId} - {$meta['_reserva_nombre_cliente']}";

        $mensaje = self::plantillaEmail([
            'titulo'    => 'Nueva reserva confirmada',
            'contenido' => "
                <p>Se ha confirmado una nueva reserva:</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Cliente</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$meta['_reserva_nombre_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Email</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_email_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Teléfono</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_telefono_cliente']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Vehículo</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;'>{$nombreVehiculo}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Fechas</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_fecha_inicio']} → {$meta['_reserva_fecha_fin']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Noches</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_noches']}</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Total</td><td style='padding:8px;border-bottom:1px solid #eee;font-weight:bold;font-size:18px;'>{$meta['_reserva_precio_total']} €</td></tr>
                    <tr><td style='padding:8px;border-bottom:1px solid #eee;color:#666;'>Temporada</td><td style='padding:8px;border-bottom:1px solid #eee;'>{$meta['_reserva_temporada']}</td></tr>
                </table>
                <p><a href='" . admin_url("post.php?post={$reservaId}&action=edit") . "' style='background:#2d6a4f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin-top:10px;'>Ver en admin</a></p>
            ",
            'empresa' => $empresa,
        ]);

        $headers = ['Content-Type: text/html; charset=UTF-8'];
        $adminEmail = OpcionManager::get('cresta_empresa_email', get_option('admin_email'));

        wp_mail($adminEmail, $asunto, $mensaje, $headers);
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
