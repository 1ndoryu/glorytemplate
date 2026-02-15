<?php

/**
 * Kamples — Sistema de logging dedicado
 *
 * Escribe logs en archivos propios dentro de App/logs/ en vez del debug.log global.
 * Rotación automática por fecha (un archivo por día).
 * Formato: [YYYY-MM-DD HH:MM:SS] [NIVEL] Mensaje
 *
 * Uso:
 *   KamplesLogger::info('Sample procesado correctamente');
 *   KamplesLogger::error('Fallo al conectar con Gemini', ['httpCode' => 429]);
 *   KamplesLogger::debug('Respuesta raw de la API', ['body' => $respuesta]);
 *
 * @package Kamples
 */

namespace App\Kamples;

class KamplesLogger
{
    private const DIRECTORIO_LOGS = 'App/logs';
    private const PREFIJO_ARCHIVO = 'kamples';
    private const MAX_CONTEXTO_CHARS = 2000;

    /* Niveles de log */
    private const NIVEL_DEBUG    = 'DEBUG';
    private const NIVEL_INFO     = 'INFO';
    private const NIVEL_WARNING  = 'WARNING';
    private const NIVEL_ERROR    = 'ERROR';
    private const NIVEL_CRITICAL = 'CRITICAL';

    /* Cache del directorio de logs ya verificado */
    private static bool $directorioVerificado = false;

    /*
     * Log de nivel DEBUG — detalles internos para depuración.
     * Incluye respuestas de API, payloads, rutas probadas, etc.
     */
    public static function debug(string $mensaje, array $contexto = []): void
    {
        self::escribir(self::NIVEL_DEBUG, $mensaje, $contexto);
    }

    /*
     * Log de nivel INFO — operaciones normales.
     * Pipeline iniciado, FFmpeg encontrado, IA completada, etc.
     */
    public static function info(string $mensaje, array $contexto = []): void
    {
        self::escribir(self::NIVEL_INFO, $mensaje, $contexto);
    }

    /*
     * Log de nivel WARNING — situaciones recuperables.
     * Modelo de IA no disponible (fallback activado), cache miss, etc.
     */
    public static function warning(string $mensaje, array $contexto = []): void
    {
        self::escribir(self::NIVEL_WARNING, $mensaje, $contexto);
    }

    /*
     * Log de nivel ERROR — fallos que afectan funcionalidad.
     * Pipeline falla, API retorna error, DB error, etc.
     */
    public static function error(string $mensaje, array $contexto = []): void
    {
        self::escribir(self::NIVEL_ERROR, $mensaje, $contexto);
    }

    /*
     * Log de nivel CRITICAL — fallos graves del sistema.
     * FFmpeg no encontrado, ninguna IA disponible, DB inaccesible, etc.
     */
    public static function critical(string $mensaje, array $contexto = []): void
    {
        self::escribir(self::NIVEL_CRITICAL, $mensaje, $contexto);
    }

    /*
     * Escribe una entrada de log al archivo del día.
     * Crea el directorio si no existe. Incluye contexto serializado si se proporciona.
     */
    private static function escribir(string $nivel, string $mensaje, array $contexto): void
    {
        try {
            $directorio = self::obtenerDirectorioLogs();
            self::asegurarDirectorio($directorio);

            $fecha = date('Y-m-d');
            $archivo = $directorio . '/' . self::PREFIJO_ARCHIVO . '-' . $fecha . '.log';

            $timestamp = date('Y-m-d H:i:s');
            $linea = "[{$timestamp}] [{$nivel}] {$mensaje}";

            if (!empty($contexto)) {
                $contextoStr = self::formatearContexto($contexto);
                $linea .= " | {$contextoStr}";
            }

            $linea .= PHP_EOL;

            file_put_contents($archivo, $linea, FILE_APPEND | LOCK_EX);
        } catch (\Throwable $e) {
            /* Fallback a error_log si falla la escritura al archivo propio */
            error_log("[Kamples] {$nivel}: {$mensaje}");
            if (!empty($contexto)) {
                error_log("[Kamples] Contexto: " . json_encode($contexto, JSON_UNESCAPED_UNICODE));
            }
        }
    }

    /*
     * Formatea el array de contexto a string legible.
     * Trunca valores largos para no llenar el archivo de logs.
     */
    private static function formatearContexto(array $contexto): string
    {
        $partes = [];
        foreach ($contexto as $clave => $valor) {
            if (is_array($valor)) {
                $str = json_encode($valor, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } elseif (is_bool($valor)) {
                $str = $valor ? 'true' : 'false';
            } elseif (is_null($valor)) {
                $str = 'null';
            } else {
                $str = (string) $valor;
            }

            /* Truncar valores excesivamente largos (ej: base64 de audio) */
            if (strlen($str) > self::MAX_CONTEXTO_CHARS) {
                $str = mb_substr($str, 0, self::MAX_CONTEXTO_CHARS) . '...[truncado]';
            }

            $partes[] = "{$clave}={$str}";
        }

        return implode(', ', $partes);
    }

    /*
     * Obtiene la ruta absoluta al directorio de logs.
     * Se ubica en el tema: wp-content/themes/glorytemplate/App/logs/
     */
    private static function obtenerDirectorioLogs(): string
    {
        return get_template_directory() . '/' . self::DIRECTORIO_LOGS;
    }

    /*
     * Crea el directorio de logs si no existe. Solo verifica una vez por request.
     */
    private static function asegurarDirectorio(string $directorio): void
    {
        if (self::$directorioVerificado) return;

        if (!is_dir($directorio)) {
            /* wp_mkdir_p crea directorios recursivamente */
            if (function_exists('wp_mkdir_p')) {
                \wp_mkdir_p($directorio);
            } else {
                mkdir($directorio, 0755, true);
            }

            /* Proteger con .htaccess para evitar acceso público */
            $htaccess = $directorio . '/.htaccess';
            if (!file_exists($htaccess)) {
                file_put_contents($htaccess, "Deny from all\n");
            }

            /* Agregar index.php vacío como protección adicional */
            $index = $directorio . '/index.php';
            if (!file_exists($index)) {
                file_put_contents($index, "<?php // Silence is golden.\n");
            }
        }

        self::$directorioVerificado = true;
    }
}
