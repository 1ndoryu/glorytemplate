<?php

namespace App\Repository\WhatsApp;

final class WhatsAppOutboundRepository
{
    private static function table(): string
    {
        global $wpdb;
        return $wpdb->prefix . 'glory_whatsapp_outbound_alerts';
    }

    public static function enqueue(string $key, string $event, array $payload, string $message): void
    {
        global $wpdb;
        $table = self::table();
        $result = $wpdb->query($wpdb->prepare(
            "INSERT INTO {$table} (idempotency_key,event_type,payload,rendered_message,status,attempts,available_at,created_at,updated_at)
             VALUES (%s,%s,%s,%s,'pending',0,UTC_TIMESTAMP(),UTC_TIMESTAMP(),UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE idempotency_key = VALUES(idempotency_key)",
            $key,
            $event,
            wp_json_encode($payload),
            $message
        ));
        if ($result === false) {
            throw new \RuntimeException('No se pudo persistir la alerta');
        }
    }

    public static function claimOne(): ?array
    {
        global $wpdb;
        $table = self::table();
        $wpdb->query('START TRANSACTION');
        try {
            /* SQL estática sin input de usuario (no hay placeholders): prepare() pasa la consulta intacta. */
            $row = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT * FROM {$table}
                     WHERE (status='pending' AND available_at <= UTC_TIMESTAMP())
                        OR (status='processing' AND locked_until < UTC_TIMESTAMP())
                     ORDER BY available_at,id LIMIT 1 FOR UPDATE SKIP LOCKED"
                ),
                ARRAY_A
            );
            if (!$row) {
                $wpdb->query('COMMIT');
                return null;
            }
            $updated = $wpdb->query($wpdb->prepare(
                "UPDATE {$table} SET status='processing',attempts=attempts+1,
                 locked_until=UTC_TIMESTAMP()+INTERVAL 180 SECOND,updated_at=UTC_TIMESTAMP() WHERE id=%d",
                (int)$row['id']
            ));
            if ($updated !== 1) {
                throw new \RuntimeException('No se pudo reclamar la alerta');
            }
            $wpdb->query('COMMIT');
            $row['attempts'] = (int)$row['attempts'] + 1;
            return $row;
        } catch (\Throwable $error) {
            $wpdb->query('ROLLBACK');
            throw $error;
        }
    }

    public static function markSent(int $id): void
    {
        global $wpdb;
        $wpdb->update(self::table(), ['status' => 'sent', 'sent_at' => gmdate('Y-m-d H:i:s'), 'locked_until' => null, 'updated_at' => gmdate('Y-m-d H:i:s')], ['id' => $id]);
    }

    public static function markFailure(int $id, int $attempt, string $error): void
    {
        global $wpdb;
        $backoff = [5, 30, 120, 600, 1800];
        $dead = $attempt >= count($backoff);
        $available = gmdate('Y-m-d H:i:s', time() + ($backoff[min(max($attempt - 1, 0), 4)]));
        $wpdb->update(self::table(), [
            'status' => $dead ? 'dead' : 'pending',
            'available_at' => $available,
            'locked_until' => null,
            'last_error' => mb_substr($error, 0, 500),
            'updated_at' => gmdate('Y-m-d H:i:s'),
        ], ['id' => $id]);
    }
}
