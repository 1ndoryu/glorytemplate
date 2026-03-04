<?php

/**
 * Cron job para limpieza de reservas pendientes expiradas.
 *
 * Las reservas en estado "pendiente" que llevan más de 30 minutos
 * sin ser confirmadas vía Stripe se marcan como "cancelada".
 *
 * Registra un evento WP-Cron que se ejecuta cada 30 minutos.
 */

namespace App\Cron;

use Glory\Core\GloryLogger;
use Glory\Services\EventBus;

class LimpiarReservasPendientes
{
    private const HOOK = 'cresta_limpiar_reservas_pendientes';
    private const INTERVALO_MINUTOS = 30;

    /**
     * Registra el cron job.
     */
    public static function register(): void
    {
        // Registrar intervalo personalizado
        add_filter('cron_schedules', [self::class, 'agregarIntervalo']);

        // Programar evento si no existe
        add_action('init', [self::class, 'programar']);

        // Registrar callback
        add_action(self::HOOK, [self::class, 'ejecutar']);
    }

    /**
     * Agrega intervalo de 30 minutos al cron de WordPress.
     */
    public static function agregarIntervalo(array $schedules): array
    {
        $schedules['cada_30_minutos'] = [
            'interval' => self::INTERVALO_MINUTOS * 60,
            'display'  => 'Cada 30 minutos',
        ];

        return $schedules;
    }

    /**
     * Programa el evento cron si no está ya programado.
     */
    public static function programar(): void
    {
        if (!wp_next_scheduled(self::HOOK)) {
            wp_schedule_event(time(), 'cada_30_minutos', self::HOOK);
        }
    }

    /**
     * Ejecuta la limpieza: cancela reservas pendientes con más de 30 min.
     */
    public static function ejecutar(): void
    {
        $umbral = gmdate('Y-m-d H:i:s', time() - (self::INTERVALO_MINUTOS * 60));

        $query = new \WP_Query([
            'post_type'      => 'reserva',
            'post_status'    => 'publish',
            'posts_per_page' => 100,
            'meta_query'     => [
                [
                    'key'   => '_reserva_estado',
                    'value' => 'pendiente',
                ],
            ],
            'date_query' => [
                [
                    'before' => $umbral,
                ],
            ],
        ]);

        $canceladas = 0;

        foreach ($query->posts as $post) {
            update_post_meta($post->ID, '_reserva_estado', 'cancelada');
            $canceladas++;

            // Emitir evento para invalidar cache de disponibilidad
            if (class_exists(EventBus::class)) {
                EventBus::emit('disponibilidad', [
                    'vehiculo_id' => get_post_meta($post->ID, '_reserva_vehiculo_id', true),
                    'reserva_id'  => $post->ID,
                    'accion'      => 'expirada',
                ]);
            }
        }

        wp_reset_postdata();

        if ($canceladas > 0) {
            GloryLogger::info("Cron: {$canceladas} reservas pendientes expiradas marcadas como canceladas.");
        }
    }

    /**
     * Desprograma el cron (para usar al desactivar el tema).
     */
    public static function desprogramar(): void
    {
        $timestamp = wp_next_scheduled(self::HOOK);
        if ($timestamp) {
            wp_unschedule_event($timestamp, self::HOOK);
        }
    }
}

// Auto-registrar
LimpiarReservasPendientes::register();
