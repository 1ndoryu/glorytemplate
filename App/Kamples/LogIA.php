<?php

/**
 * LogIA — Logger dedicado al canal IA.
 *
 * Enruta automáticamente todos los logs al archivo kamples-ia-YYYY-MM-DD.log.
 * Cubre: ServicioIA, PipelineAudio, AnalizadorAudio, subidas de audio.
 *
 * Uso: importar `use App\Kamples\LogIA as KamplesLogger;` en vez del logger base.
 * Así todas las llamadas existentes (KamplesLogger::info, etc.) van al canal IA
 * sin modificar cada invocación individual.
 *
 * @package Kamples
 */

namespace App\Kamples;

class LogIA
{
    public static function debug(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::debug($mensaje, $contexto, 'ia');
    }

    public static function info(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::info($mensaje, $contexto, 'ia');
    }

    public static function warning(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::warning($mensaje, $contexto, 'ia');
    }

    public static function error(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::error($mensaje, $contexto, 'ia');
    }

    public static function critical(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::critical($mensaje, $contexto, 'ia');
    }
}
