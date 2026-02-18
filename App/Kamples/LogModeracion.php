<?php

/**
 * LogModeracion — Logger dedicado al canal de moderación.
 *
 * Enruta automáticamente todos los logs al archivo kamples-moderacion-YYYY-MM-DD.log.
 * Cubre: ServicioModeracionIA, ServicioAntiSpam, ServicioBan, moderación en controladores.
 *
 * Uso: importar `use App\Kamples\LogModeracion as KamplesLogger;` en vez del logger base.
 *
 * @package Kamples
 */

namespace App\Kamples;

class LogModeracion
{
    public static function debug(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::debug($mensaje, $contexto, 'moderacion');
    }

    public static function info(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::info($mensaje, $contexto, 'moderacion');
    }

    public static function warning(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::warning($mensaje, $contexto, 'moderacion');
    }

    public static function error(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::error($mensaje, $contexto, 'moderacion');
    }

    public static function critical(string $mensaje, array $contexto = []): void
    {
        KamplesLogger::critical($mensaje, $contexto, 'moderacion');
    }
}
