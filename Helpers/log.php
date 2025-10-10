<?php

use Glory\Core\GloryLogger;

if (!function_exists('guardarLog')) {
    /**
     * Guarda un mensaje de log usando GloryLogger si existe, o error_log como fallback.
     * @param string $mensaje
     * @param string|int $nivel
     */
    function guardarLog($mensaje, $nivel = 'info')
    {
        try {
            if (class_exists('Glory\\Core\\GloryLogger')) {
                $nivel = strtolower((string) $nivel);
                switch ($nivel) {
                    case 'warning':
                    case 'warn':
                        GloryLogger::warning((string) $mensaje);
                        break;
                    case 'error':
                        GloryLogger::error((string) $mensaje);
                        break;
                    case 'critical':
                    case 'crit':
                        GloryLogger::critical((string) $mensaje);
                        break;
                    default:
                        GloryLogger::info((string) $mensaje);
                        break;
                }
            } else {
                error_log((string) $mensaje);
            }
        } catch (\Throwable $e) {
            error_log((string) $mensaje);
            error_log('guardarLog fallback: ' . $e->getMessage());
        }
    }
}

