<?php

namespace App\Services;

use Glory\Core\GloryLogger;
use Glory\Manager\OpcionManager;
use Glory\Services\EventBus;

/**
 * Servicio de disponibilidad de vehículos.
 *
 * Comprueba si un vehículo está libre para un rango de fechas
 * consultando reservas existentes (confirmadas y pendientes recientes).
 * Todo vía wp_postmeta — sin tablas custom.
 */
class DisponibilidadService
{
    /**
     * Comprueba si un vehículo está disponible para un rango de fechas.
     *
     * @param int    $vehiculoId  ID del post del vehículo.
     * @param string $fechaInicio Fecha inicio (Y-m-d).
     * @param string $fechaFin    Fecha fin (Y-m-d).
     * @return array{disponible: bool, conflictos: array}
     */
    public static function verificar(int $vehiculoId, string $fechaInicio, string $fechaFin): array
    {
        // Validar que el vehículo existe y está activo
        $vehiculo = get_post($vehiculoId);
        if (!$vehiculo || $vehiculo->post_type !== 'vehiculo') {
            return ['disponible' => false, 'conflictos' => ['Vehículo no encontrado.']];
        }

        $activo = get_post_meta($vehiculoId, '_vehiculo_activo', true);
        if ($activo !== '1' && $activo !== true) {
            return ['disponible' => false, 'conflictos' => ['Vehículo no disponible actualmente.']];
        }

        // Validar fechas
        $inicio = \DateTime::createFromFormat('Y-m-d', $fechaInicio);
        $fin    = \DateTime::createFromFormat('Y-m-d', $fechaFin);

        if (!$inicio || !$fin || $fin <= $inicio) {
            return ['disponible' => false, 'conflictos' => ['Rango de fechas inválido.']];
        }

        // Validar reglas de negocio
        $reglas = self::validarReglas($inicio, $fin);
        if (!empty($reglas)) {
            return ['disponible' => false, 'conflictos' => $reglas];
        }

        // Buscar reservas que solapen
        $conflictos = self::buscarConflictos($vehiculoId, $fechaInicio, $fechaFin);

        return [
            'disponible' => empty($conflictos),
            'conflictos' => $conflictos,
        ];
    }

    /**
     * Valida reglas de negocio (mínimo noches, anticipación).
     *
     * @return string[] Lista de errores.
     */
    private static function validarReglas(\DateTime $inicio, \DateTime $fin): array
    {
        $errores = [];
        $hoy = new \DateTime('today');

        // Mínimo noches
        $noches  = (int) $inicio->diff($fin)->days;
        $minimas = (int) OpcionManager::get('cresta_noches_minimas', '2');
        if ($noches < $minimas) {
            $errores[] = "El mínimo de noches es {$minimas}. Has seleccionado {$noches}.";
        }

        // Días de antelación
        $anticipacion    = (int) OpcionManager::get('cresta_dias_anticipacion', '2');
        $diasHastaInicio = (int) $hoy->diff($inicio)->days;
        $esFuturo        = $inicio > $hoy;
        if (!$esFuturo || $diasHastaInicio < $anticipacion) {
            $errores[] = "Debes reservar con al menos {$anticipacion} días de antelación.";
        }

        return $errores;
    }

    /**
     * Busca reservas que conflicten con el rango dado.
     *
     * Considera reservas con estado 'confirmada' o 'pendiente' recientes (< 30 min).
     *
     * @return string[] Mensajes de conflicto.
     */
    private static function buscarConflictos(int $vehiculoId, string $fechaInicio, string $fechaFin): array
    {
        $conflictos = [];
        $limiteAntiguas = gmdate('Y-m-d H:i:s', time() - 1800); // 30 min atrás

        // Query: reservas de este vehículo que solapen
        $args = [
            'post_type'      => 'reserva',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => [
                'relation' => 'AND',
                [
                    'key'   => '_reserva_vehiculo_id',
                    'value' => $vehiculoId,
                    'type'  => 'NUMERIC',
                ],
                [
                    'key'     => '_reserva_fecha_inicio',
                    'value'   => $fechaFin,
                    'compare' => '<',
                    'type'    => 'DATE',
                ],
                [
                    'key'     => '_reserva_fecha_fin',
                    'value'   => $fechaInicio,
                    'compare' => '>',
                    'type'    => 'DATE',
                ],
                [
                    'relation' => 'OR',
                    [
                        'key'   => '_reserva_estado',
                        'value' => 'confirmada',
                    ],
                    [
                        // Pendientes recientes (menos de 30 min)
                        'key'   => '_reserva_estado',
                        'value' => 'pendiente',
                    ],
                ],
            ],
        ];

        $query = new \WP_Query($args);

        if ($query->have_posts()) {
            foreach ($query->posts as $reserva) {
                $estado = get_post_meta($reserva->ID, '_reserva_estado', true);

                // Si es pendiente, solo bloquea si es reciente
                if ($estado === 'pendiente') {
                    $fechaCreacion = $reserva->post_date_gmt;
                    if ($fechaCreacion < $limiteAntiguas) {
                        continue; // Pendiente antigua, ignorar
                    }
                }

                $rInicio = get_post_meta($reserva->ID, '_reserva_fecha_inicio', true);
                $rFin    = get_post_meta($reserva->ID, '_reserva_fecha_fin', true);
                $conflictos[] = "Fechas ocupadas del {$rInicio} al {$rFin}.";
            }
        }

        wp_reset_postdata();

        return $conflictos;
    }

    /**
     * Genera mapa de disponibilidad mensual para un vehículo.
     *
     * @param int $vehiculoId ID del vehículo.
     * @param int $mes        Mes (1-12).
     * @param int $anio       Año.
     * @return array<string, bool> Mapa fecha => disponible.
     */
    public static function calendarioMensual(int $vehiculoId, int $mes, int $anio): array
    {
        $primerDia  = new \DateTime("{$anio}-{$mes}-01");
        $ultimoDia  = (clone $primerDia)->modify('last day of this month');
        $calendario = [];

        // Obtener todas las reservas del mes
        $reservas = self::obtenerReservasMes($vehiculoId, $primerDia->format('Y-m-d'), $ultimoDia->format('Y-m-d'));

        // Generar mapa
        $dia = clone $primerDia;
        while ($dia <= $ultimoDia) {
            $fecha = $dia->format('Y-m-d');
            $calendario[$fecha] = !isset($reservas[$fecha]);
            $dia->modify('+1 day');
        }

        return $calendario;
    }

    /**
     * Obtiene días ocupados en un rango.
     *
     * @return array<string, true> Mapa de fechas ocupadas.
     */
    private static function obtenerReservasMes(int $vehiculoId, string $desde, string $hasta): array
    {
        $ocupados = [];
        $limiteAntiguas = gmdate('Y-m-d H:i:s', time() - 1800);

        $args = [
            'post_type'      => 'reserva',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => [
                'relation' => 'AND',
                [
                    'key'   => '_reserva_vehiculo_id',
                    'value' => $vehiculoId,
                    'type'  => 'NUMERIC',
                ],
                [
                    'key'     => '_reserva_fecha_inicio',
                    'value'   => $hasta,
                    'compare' => '<=',
                    'type'    => 'DATE',
                ],
                [
                    'key'     => '_reserva_fecha_fin',
                    'value'   => $desde,
                    'compare' => '>=',
                    'type'    => 'DATE',
                ],
                [
                    'relation' => 'OR',
                    [
                        'key'   => '_reserva_estado',
                        'value' => 'confirmada',
                    ],
                    [
                        'key'   => '_reserva_estado',
                        'value' => 'pendiente',
                    ],
                ],
            ],
        ];

        $query = new \WP_Query($args);

        foreach ($query->posts as $reserva) {
            $estado = get_post_meta($reserva->ID, '_reserva_estado', true);
            if ($estado === 'pendiente' && $reserva->post_date_gmt < $limiteAntiguas) {
                continue;
            }

            $rInicio = new \DateTime(get_post_meta($reserva->ID, '_reserva_fecha_inicio', true));
            $rFin    = new \DateTime(get_post_meta($reserva->ID, '_reserva_fecha_fin', true));
            $dia     = clone $rInicio;

            while ($dia < $rFin) {
                $ocupados[$dia->format('Y-m-d')] = true;
                $dia->modify('+1 day');
            }
        }

        wp_reset_postdata();

        return $ocupados;
    }

    /**
     * Emite evento de cambio de disponibilidad.
     */
    public static function emitirCambio(int $vehiculoId): void
    {
        EventBus::emit('disponibilidad', ['vehiculo_id' => $vehiculoId]);
    }
}
