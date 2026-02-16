<?php

/**
 * LogAlgoritmo — Logger dedicado al canal algoritmo.
 *
 * Enruta automáticamente todos los logs al archivo kamples-algoritmo-YYYY-MM-DD.log.
 * Cubre: MotorRecomendacion, PlanificadorAlgoritmo, GeneradorEmbeddings.
 *
 * Uso: importar `use App\Kamples\LogAlgoritmo as KamplesLogger;` en vez del logger base.
 * Así todas las llamadas existentes (KamplesLogger::info, etc.) van al canal algoritmo
 * sin modificar cada invocación individual.
 *
 * @package Kamples
 */

namespace App\Kamples;

class LogAlgoritmo
{
    public static function debug(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::debug($mensaje, $contexto, 'algoritmo');
    }

    public static function info(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::info($mensaje, $contexto, 'algoritmo');
    }

    public static function warning(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::warning($mensaje, $contexto, 'algoritmo');
    }

    public static function error(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::error($mensaje, $contexto, 'algoritmo');
    }

    public static function critical(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::critical($mensaje, $contexto, 'algoritmo');
    }
}
