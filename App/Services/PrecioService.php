<?php

namespace App\Services;

use Glory\Manager\OpcionManager;

/**
 * Motor de precios por temporada.
 *
 * Calcula el precio por noche según la fecha, el vehículo y la temporada.
 * Las temporadas y multiplicadores se leen de OpcionManager (wp_options).
 */
class PrecioService
{
    /**
     * Calcula el precio total de una reserva desglosado por noche.
     *
     * @param float  $precioBase   Precio base por noche del vehículo.
     * @param string $fechaInicio  Fecha de inicio (Y-m-d).
     * @param string $fechaFin     Fecha de fin (Y-m-d).
     * @return array{noches: int, total: float, precioMedio: float, desglose: array, temporadaPrincipal: string}
     */
    public static function calcularReserva(float $precioBase, string $fechaInicio, string $fechaFin): array
    {
        $inicio = new \DateTime($fechaInicio);
        $fin    = new \DateTime($fechaFin);

        if ($fin <= $inicio) {
            return [
                'noches'             => 0,
                'total'              => 0,
                'precioMedio'        => 0,
                'desglose'           => [],
                'temporadaPrincipal' => 'baja',
            ];
        }

        $desglose    = [];
        $total       = 0;
        $temporadas  = [];
        $actual      = clone $inicio;

        while ($actual < $fin) {
            $fecha         = $actual->format('Y-m-d');
            $temporada     = self::determinarTemporada($actual);
            $multiplicador = self::obtenerMultiplicador($temporada);
            $precioNoche   = round($precioBase * $multiplicador, 2);

            $desglose[] = [
                'fecha'         => $fecha,
                'temporada'     => $temporada,
                'multiplicador' => $multiplicador,
                'precio'        => $precioNoche,
            ];

            $total += $precioNoche;
            $temporadas[$temporada] = ($temporadas[$temporada] ?? 0) + 1;

            $actual->modify('+1 day');
        }

        $noches = count($desglose);

        // Temporada principal = la que más noches tenga
        arsort($temporadas);
        $temporadaPrincipal = array_key_first($temporadas) ?: 'baja';

        return [
            'noches'             => $noches,
            'total'              => round($total, 2),
            'precioMedio'        => $noches > 0 ? round($total / $noches, 2) : 0,
            'desglose'           => $desglose,
            'temporadaPrincipal' => $temporadaPrincipal,
        ];
    }

    /**
     * Determina la temporada para una fecha dada.
     */
    public static function determinarTemporada(\DateTime $fecha): string
    {
        $mmdd = $fecha->format('m-d');

        // Primero: comprobar fechas especiales
        $especiales = self::obtenerFechasEspeciales();
        foreach ($especiales as $rango) {
            if (self::fechaEnRango($mmdd, $rango['inicio'], $rango['fin'])) {
                return 'especial';
            }
        }

        // Temporada alta
        $altaInicio = OpcionManager::get('cresta_temporada_alta_inicio', '06-15');
        $altaFin    = OpcionManager::get('cresta_temporada_alta_fin', '10-31');
        if (self::fechaEnRango($mmdd, $altaInicio, $altaFin)) {
            return 'alta';
        }

        // Temporada media
        $mediaInicio = OpcionManager::get('cresta_temporada_media_inicio', '04-01');
        $mediaFin    = OpcionManager::get('cresta_temporada_media_fin', '06-14');
        if (self::fechaEnRango($mmdd, $mediaInicio, $mediaFin)) {
            return 'media';
        }

        // Default: temporada baja
        return 'baja';
    }

    /**
     * Obtiene el multiplicador para una temporada.
     */
    public static function obtenerMultiplicador(string $temporada): float
    {
        return match ($temporada) {
            'especial' => (float) OpcionManager::get('cresta_multiplicador_especial', '2.0'),
            'alta'     => (float) OpcionManager::get('cresta_multiplicador_alta', '1.6'),
            'media'    => (float) OpcionManager::get('cresta_multiplicador_media', '1.3'),
            default    => 1.0,
        };
    }

    /**
     * Comprueba si una fecha MM-DD está dentro de un rango (soporta cruces de año).
     */
    private static function fechaEnRango(string $mmdd, string $inicio, string $fin): bool
    {
        if ($inicio <= $fin) {
            return $mmdd >= $inicio && $mmdd <= $fin;
        }
        // Cruce de año (ej: 12-23 a 01-02)
        return $mmdd >= $inicio || $mmdd <= $fin;
    }

    /**
     * Lee las fechas especiales del OpcionManager.
     *
     * @return array<array{inicio: string, fin: string, nombre: string}>
     */
    private static function obtenerFechasEspeciales(): array
    {
        $json = OpcionManager::get('cresta_fechas_especiales', '[]');
        $datos = json_decode($json, true);
        return is_array($datos) ? $datos : [];
    }

    /**
     * Genera tabla de precios para un vehículo (para mostrar al cliente).
     *
     * @param float $precioBase Precio base del vehículo.
     * @return array<string, array{temporada: string, multiplicador: float, precioNoche: float}>
     */
    public static function tablaPreciosVehiculo(float $precioBase): array
    {
        $temporadas = ['baja', 'media', 'alta', 'especial'];
        $tabla = [];

        foreach ($temporadas as $temp) {
            $mult = self::obtenerMultiplicador($temp);
            $tabla[$temp] = [
                'temporada'    => $temp,
                'multiplicador'=> $mult,
                'precioNoche'  => round($precioBase * $mult, 2),
            ];
        }

        return $tabla;
    }
}
