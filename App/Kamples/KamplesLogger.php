<?php

/**
 * Kamples — Sistema de logging dedicado
 *
 * Escribe logs en archivos propios dentro de App/logs/ en vez del debug.log global.
 * Rotación automática por fecha (un archivo por día).
 * Formato: [YYYY-MM-DD HH:MM:SS] [NIVEL] Mensaje
 *
 * Canales disponibles:
 *   - '' (default): kamples-YYYY-MM-DD.log → General (BD, auth, controladores)
 *   - 'ia': kamples-ia-YYYY-MM-DD.log → IA, pipeline de audio, subida
 *   - 'algoritmo': kamples-algoritmo-YYYY-MM-DD.log → Motor de recomendación, planificador
 *
 * Auto-limpieza: elimina archivos de log con más de 7 días de antigüedad.
 * Usar LogIA o LogAlgoritmo como alias para enrutar automáticamente al canal.
 *
 * @package Kamples
 */

namespace App\Kamples;

class KamplesLogger
{
    private const DIRECTORIO_LOGS = 'App/logs';
    private const PREFIJO_ARCHIVO = 'kamples';
    private const MAX_CONTEXTO_CHARS = 2000;
    private const DIAS_RETENCION = 7;

    /* Canales válidos — cada uno escribe a su propio archivo */
    private const CANALES_VALIDOS = ['ia', 'algoritmo', 'moderacion'];

    /* Niveles de log */
    private const NIVEL_DEBUG    = 'DEBUG';
    private const NIVEL_INFO     = 'INFO';
    private const NIVEL_WARNING  = 'WARNING';
    private const NIVEL_ERROR    = 'ERROR';
    private const NIVEL_CRITICAL = 'CRITICAL';

    /* Cache del directorio de logs ya verificado */
    private static bool $directorioVerificado = false;

    /* Flag para ejecutar limpieza solo una vez por request */
    private static bool $limpiezaEjecutada = false;

    /*
     * Log de nivel DEBUG — detalles internos para depuración.
     * @param string $canal Canal opcional: 'ia', 'algoritmo' o '' (default)
     */
    public static function debug(string $mensaje, array $contexto = [], string $canal = ''): void
    {
        self::escribir(self::NIVEL_DEBUG, $mensaje, $contexto, $canal);
    }

    /*
     * Log de nivel INFO — operaciones normales.
     * @param string $canal Canal opcional: 'ia', 'algoritmo' o '' (default)
     */
    public static function info(string $mensaje, array $contexto = [], string $canal = ''): void
    {
        self::escribir(self::NIVEL_INFO, $mensaje, $contexto, $canal);
    }

    /*
     * Log de nivel WARNING — situaciones recuperables.
     * @param string $canal Canal opcional: 'ia', 'algoritmo' o '' (default)
     */
    public static function warning(string $mensaje, array $contexto = [], string $canal = ''): void
    {
        self::escribir(self::NIVEL_WARNING, $mensaje, $contexto, $canal);
    }

    /*
     * Log de nivel ERROR — fallos que afectan funcionalidad.
     * @param string $canal Canal opcional: 'ia', 'algoritmo' o '' (default)
     */
    public static function error(string $mensaje, array $contexto = [], string $canal = ''): void
    {
        self::escribir(self::NIVEL_ERROR, $mensaje, $contexto, $canal);
    }

    /*
     * Log de nivel CRITICAL — fallos graves del sistema.
     * @param string $canal Canal opcional: 'ia', 'algoritmo' o '' (default)
     */
    public static function critical(string $mensaje, array $contexto = [], string $canal = ''): void
    {
        self::escribir(self::NIVEL_CRITICAL, $mensaje, $contexto, $canal);
    }

    /*
     * Escribe una entrada de log al archivo del día.
     * Canal válido → archivo separado (kamples-{canal}-fecha.log).
     * Canal vacío → archivo default (kamples-fecha.log).
     */
    private static function escribir(string $nivel, string $mensaje, array $contexto, string $canal = ''): void
    {
        try {
            $directorio = self::obtenerDirectorioLogs();
            self::asegurarDirectorio($directorio);

            /* Limpieza periódica de logs viejos (una vez por request) */
            self::limpiarSiCorresponde($directorio);

            $fecha = date('Y-m-d');
            $sufijo = in_array($canal, self::CANALES_VALIDOS, true) ? "-{$canal}" : '';
            $archivo = $directorio . '/' . self::PREFIJO_ARCHIVO . $sufijo . '-' . $fecha . '.log';

            $timestamp = date('Y-m-d H:i:s');
            $linea = "[{$timestamp}] [{$nivel}] {$mensaje}";

            if (!empty($contexto)) {
                $contextoStr = self::formatearContexto($contexto);
                $linea .= " | {$contextoStr}";
            }

            $linea .= PHP_EOL;

            file_put_contents($archivo, $linea, FILE_APPEND | LOCK_EX);
        } catch (\Throwable $e) {
            /* Fallback a error_log SOLO si falla la escritura al archivo propio */
            error_log("[Kamples] {$nivel}: {$mensaje}");
            if (!empty($contexto)) {
                error_log("[Kamples] Contexto: " . json_encode($contexto, JSON_UNESCAPED_UNICODE));
            }
        }
    }

    /*
     * Evalúa si corresponde ejecutar la limpieza de logs (máx 1 vez al día).
     * Usa un archivo marker para no repetir la operación.
     */
    private static function limpiarSiCorresponde(string $directorio): void
    {
        if (self::$limpiezaEjecutada) return;
        self::$limpiezaEjecutada = true;

        $marker = $directorio . '/.last_cleanup';
        try {
            if (file_exists($marker)) {
                $contenidoMarker = file_get_contents($marker);
                if ($contenidoMarker !== false) {
                    $ultimaLimpieza = (int) $contenidoMarker;
                    if (time() - $ultimaLimpieza < 86400) return;
                }
            }

            self::limpiarLogsViejos($directorio);
            if (file_put_contents($marker, (string) time()) === false) {
                throw new \RuntimeException('No se pudo escribir marker de limpieza de logs');
            }
        } catch (\Throwable $e) {
            error_log('[KamplesLogger] Error en limpiarSiCorresponde: ' . $e->getMessage());
        }
    }

    /*
     * Elimina archivos de log con más de DIAS_RETENCION días.
     * Se puede invocar manualmente o se ejecuta automáticamente una vez al día.
     *
     * @return int Cantidad de archivos eliminados
     */
    public static function limpiarLogsViejos(?string $directorio = null): int
    {
        $directorio = $directorio ?? self::obtenerDirectorioLogs();
        $eliminados = 0;
        $umbral = time() - (self::DIAS_RETENCION * 86400);

        $archivos = glob($directorio . '/' . self::PREFIJO_ARCHIVO . '*.log');
        if (!$archivos) return 0;

        foreach ($archivos as $archivo) {
            if (filemtime($archivo) < $umbral) {
                try {
                    if (unlink($archivo)) {
                        $eliminados++;
                    }
                } catch (\Throwable $e) {
                    error_log('[KamplesLogger] Error eliminando log viejo: ' . $e->getMessage());
                }
            }
        }

        if ($eliminados > 0) {
            self::info("Logs: Limpieza automática — {$eliminados} archivo(s) eliminado(s)");
        }

        return $eliminados;
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
                if (!\wp_mkdir_p($directorio)) {
                    throw new \RuntimeException('No se pudo crear directorio de logs con wp_mkdir_p');
                }
            } else {
                if (!mkdir($directorio, 0755, true) && !is_dir($directorio)) {
                    throw new \RuntimeException('No se pudo crear directorio de logs con mkdir');
                }
            }

            /* Proteger con .htaccess para evitar acceso público */
            $htaccess = $directorio . '/.htaccess';
            if (!file_exists($htaccess)) {
                if (file_put_contents($htaccess, "Deny from all\n") === false) {
                    throw new \RuntimeException('No se pudo crear .htaccess en logs');
                }
            }

            /* Agregar index.php vacío como protección adicional */
            $index = $directorio . '/index.php';
            if (!file_exists($index)) {
                if (file_put_contents($index, "<?php // Silence is golden.\n") === false) {
                    throw new \RuntimeException('No se pudo crear index.php en logs');
                }
            }
        }

        self::$directorioVerificado = true;
    }
}
