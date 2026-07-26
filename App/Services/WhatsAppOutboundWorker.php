<?php

namespace App\Services;

use App\Repository\WhatsApp\WhatsAppOutboundRepository;

final class WhatsAppOutboundWorker
{
    public static function runCron(): void
    {
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
    }
}
