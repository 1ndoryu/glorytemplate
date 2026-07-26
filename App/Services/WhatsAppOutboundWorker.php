<?php

namespace App\Services;

use App\Repository\WhatsApp\WhatsAppOutboundRepository;

final class WhatsAppOutboundWorker
{
    private const LOCK_NAME = 'glory_whatsapp_outbound_worker';

    public static function runCron(): void
    {
        global $wpdb;
        /* [267A-8] Systemd y WP-Cron comparten este lock de conexion para que
         * nunca compitan dos procesos wacli sobre el mismo store. */
        $acquired = $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 0)', self::LOCK_NAME));
        if ($acquired === null) {
            throw new \RuntimeException('No se pudo consultar el lock del worker WhatsApp');
        }
        if ((string)$acquired !== '1') {
            return;
        }

        try {
            for ($processed = 0; $processed < 3; $processed++) {
                $row = null;
                try {
                    $row = WhatsAppOutboundRepository::claimOne();
                    if ($row === null) {
                        return;
                    }
                    (new WacliService())->enviarTexto(null, (string)$row['rendered_message']);
                    WhatsAppOutboundRepository::markSent((int)$row['id']);
                } catch (\Throwable $error) {
                    if (isset($row['id'], $row['attempts'])) {
                        WhatsAppOutboundRepository::markFailure(
                            (int)$row['id'],
                            (int)$row['attempts'],
                            $error->getMessage()
                        );
                    }
                    error_log('[WhatsAppOutboundWorker] Fallo de entrega: ' . $error->getMessage());
                    return;
                }
            }
        } finally {
            $released = $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', self::LOCK_NAME));
            if ((string)$released !== '1') {
                error_log('[WhatsAppOutboundWorker] No se pudo liberar el lock asesor');
            }
        }
    }
}
