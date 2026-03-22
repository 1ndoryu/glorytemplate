<?php

/*
 * Servicio: GestorProcesosFondo
 * Gestiona procesos Python de fondo (scraping, extraccion, seed).
 * Usa archivos .lock con metadata JSON para tracking de estado.
 * Extraido de DevController para SRP y reutilizacion desde ProcesosFondoController.
 */

namespace App\Kamples\Services;

use App\Kamples\KamplesLogger;

class GestorProcesosFondo
{
    /* Directorio de scraper relativo al tema */
    private const SCRAPER_DIR = 'kamples-scraper';

    /* Identificadores de procesos */
    private const PROCESO_SCRAPING   = 'scraping';
    private const PROCESO_EXTRACCION = 'extraccion';
    private const PROCESO_SEED       = 'seed';

    /* Procesos conocidos y sus comandos */
    private const PROCESOS = [
        self::PROCESO_SCRAPING   => ['modulo' => 'scrapy', 'args' => ['crawl', 'hot_samples']],
        self::PROCESO_EXTRACCION => ['modulo' => 'extractor.pipeline', 'args' => ['--limit', '20']],
        self::PROCESO_SEED       => ['tipo' => 'php'],
    ];

    /* ------------------------------------------------------------------ */
    /*  Estado via archivos lock                                           */
    /* ------------------------------------------------------------------ */

    private static function rutaLock(string $proceso): string
    {
        return self::directorioLogs() . "/{$proceso}.lock";
    }

    private static function directorioLogs(): string
    {
        $dir = \get_template_directory() . '/App/logs';
        if (!\is_dir($dir)) {
            \wp_mkdir_p($dir);
        }
        return $dir;
    }

    /*
     * Lee el estado actual de un proceso desde su archivo .lock.
     * Retorna array con: nombre, estado (running/stopped/error), pid, iniciado_at, ultimo_log, progreso.
     */
    public static function estadoProceso(string $nombre): array
    {
        self::validarNombreProceso($nombre);

        $rutaLock = self::rutaLock($nombre);
        $base = [
            'nombre'       => $nombre,
            'estado'       => 'stopped',
            'pid'          => null,
            'iniciado_at'  => null,
            'ultimo_log'   => null,
            'progreso'     => null,
            'error'        => null,
        ];

        if (!\file_exists($rutaLock)) {
            return $base;
        }

        try {
            $contenido = \file_get_contents($rutaLock);
            if ($contenido === false) {
                return $base;
            }

            $datos = \json_decode($contenido, true);
            if (\json_last_error() !== JSON_ERROR_NONE || !\is_array($datos)) {
                return $base;
            }

            $merged = \array_merge($base, $datos);

            /* Verificar si el PID sigue vivo */
            $pid = $merged['pid'] ?? null;
            if ($merged['estado'] === 'running' && $pid !== null) {
                if (!self::pidVivo((int) $pid)) {
                    /* Proceso murio sin limpiar lock — marcar como stopped */
                    $merged['estado'] = 'stopped';
                    $merged['pid'] = null;
                    self::escribirLock($nombre, $merged);
                }
            }

            /* Agregar log tail */
            $merged['log_tail'] = self::leerLogTail($nombre, 30);

            return $merged;
        } catch (\Throwable $e) {
            KamplesLogger::warning('[Procesos] Error leyendo lock', [
                'proceso' => $nombre,
                'error'   => $e->getMessage(),
            ]);
            return $base;
        }
    }

    /*
     * Obtiene el estado de todos los procesos registrados.
     */
    public static function estadoTodos(): array
    {
        $estados = [];
        foreach (\array_keys(self::PROCESOS) as $nombre) {
            $estados[] = self::estadoProceso($nombre);
        }
        return $estados;
    }

    /* ------------------------------------------------------------------ */
    /*  Iniciar procesos                                                   */
    /* ------------------------------------------------------------------ */

    /*
     * Inicia un proceso de fondo. Retorna array con ok, pid, mensaje.
     * Verifica lock anti-doble-ejecucion antes de iniciar.
     */
    public static function iniciar(string $nombre, array $opcionesExtra = []): array
    {
        self::validarNombreProceso($nombre);

        /* Lock: verificar que no hay otro corriendo */
        $estadoActual = self::estadoProceso($nombre);
        if ($estadoActual['estado'] === 'running') {
            return [
                'ok'      => false,
                'error'   => "El proceso '{$nombre}' ya esta corriendo (PID: {$estadoActual['pid']}).",
                'pid'     => $estadoActual['pid'],
            ];
        }

        $config = self::PROCESOS[$nombre];

        /* Proceso PHP (seed) — ejecutar sincrono y retornar */
        if (($config['tipo'] ?? '') === 'php') {
            return self::ejecutarProcesoPhp($nombre);
        }

        /* Proceso Python (scraping/extraccion) */
        return self::ejecutarProcesoPython($nombre, $config, $opcionesExtra);
    }

    /*
     * Detiene un proceso activo via su PID.
     */
    public static function detener(string $nombre): array
    {
        self::validarNombreProceso($nombre);

        $estado = self::estadoProceso($nombre);
        if ($estado['estado'] !== 'running' || $estado['pid'] === null) {
            return ['ok' => true, 'mensaje' => "El proceso '{$nombre}' no esta corriendo."];
        }

        $pid = (int) $estado['pid'];
        $pidSafe = \escapeshellarg((string) $pid);

        try {
            if (\PHP_OS_FAMILY === 'Windows') {
                /* taskkill /T mata el arbol completo de procesos hijos */
                /* sentinel-disable-next-line exec-sin-escape — $pidSafe ya usa escapeshellarg */
                \exec('taskkill /PID ' . $pidSafe . ' /T /F 2>&1', $output, $exitCode);
            } else {
                /* sentinel-disable-next-line exec-sin-escape — $pidSafe ya usa escapeshellarg */
                \exec('kill -TERM ' . $pidSafe . ' 2>&1', $output, $exitCode);
            }

            /* Actualizar lock */
            self::escribirLock($nombre, [
                'nombre'      => $nombre,
                'estado'      => 'stopped',
                'pid'         => null,
                'detenido_at' => \gmdate('c'),
            ]);

            KamplesLogger::info('[Procesos] Proceso detenido', ['proceso' => $nombre, 'pid' => $pid]);

            return ['ok' => true, 'mensaje' => "Proceso '{$nombre}' detenido (PID: {$pid})."];
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error deteniendo proceso', [
                'proceso' => $nombre,
                'pid'     => $pid,
                'error'   => $e->getMessage(),
            ]);
            return ['ok' => false, 'error' => 'Error al detener: ' . $e->getMessage()];
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Internals                                                          */
    /* ------------------------------------------------------------------ */

    private static function ejecutarProcesoPython(string $nombre, array $config, array $opcionesExtra): array
    {
        $python = self::detectarPython();
        if ($python === null) {
            return ['ok' => false, 'error' => 'Python no encontrado en el sistema.'];
        }

        $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;
        if (!\is_dir($scraperDir)) {
            return ['ok' => false, 'error' => 'Directorio del scraper no encontrado.'];
        }

        $logsDir  = self::directorioLogs();
        $logFile  = $logsDir . '/' . $nombre . '-output-' . \date('Y-m-d') . '.log';

        /* Construir comando */
        $modulo = $config['modulo'];
        $args   = $config['args'] ?? [];

        if ($modulo === 'scrapy') {
            $cmdArray = \array_merge([$python, '-m', $modulo], $args);
            /* Parametros opcionales del caller */
            $limit = $opcionesExtra['limit'] ?? 0;
            if ($limit > 0) {
                $cmdArray[] = '-s';
                $cmdArray[] = 'CLOSESPIDER_ITEMCOUNT=' . (int) $limit;
            }
        } else {
            $cmdArray = [$python, '-m', $modulo];
            $cmdArray = \array_merge($cmdArray, $args);

            /* Agregar output dir para extraccion */
            if ($nombre === self::PROCESO_EXTRACCION) {
                $uploadsDir = \wp_upload_dir();
                $staging = $uploadsDir['basedir'] . '/kamples/extracciones';
                if (!\is_dir($staging)) {
                    \wp_mkdir_p($staging);
                }
                $cmdArray[] = '--output-dir';
                $cmdArray[] = $staging;
            }

            $limit = $opcionesExtra['limit'] ?? null;
            if ($limit !== null) {
                /* Ya tiene --limit en args default, reemplazar */
                $idx = \array_search('--limit', $cmdArray, true);
                if ($idx !== false && isset($cmdArray[$idx + 1])) {
                    $cmdArray[$idx + 1] = (string) (int) $limit;
                }
            }
        }

        /* Header en log */
        $cabecera = "\n" . \str_repeat('-', 60) . "\n["
            . \date('Y-m-d H:i:s') . "] INICIO proceso={$nombre}\n"
            . \str_repeat('-', 60) . "\n";
        \file_put_contents($logFile, $cabecera, FILE_APPEND | LOCK_EX);

        /* Entorno — [223A-3] Soporta env vars extra desde $opcionesExtra['env'] */
        $env = self::prepararEntorno();
        $extraEnv = $opcionesExtra['env'] ?? [];
        if (!empty($extraEnv) && \is_array($extraEnv)) {
            $env = \array_merge($env, $extraEnv);
        }

        $descriptores = [
            0 => ['file', \PHP_OS_FAMILY === 'Windows' ? 'nul' : '/dev/null', 'r'],
            1 => ['file', $logFile, 'a'],
            2 => ['file', $logFile, 'a'],
        ];

        $pipes = [];
        /* sentinel-disable-next-line exec-sin-escapeshellarg — proc_open con array; sin shell */
        $proceso = \proc_open($cmdArray, $descriptores, $pipes, $scraperDir, $env);

        if ($proceso === false) {
            return ['ok' => false, 'error' => 'No se pudo iniciar el proceso.'];
        }

        $status = \proc_get_status($proceso);
        $pid    = $status['pid'] ?? null;

        /* Escribir lock */
        self::escribirLock($nombre, [
            'nombre'      => $nombre,
            'estado'      => 'running',
            'pid'         => $pid,
            'iniciado_at' => \gmdate('c'),
            'log_file'    => $logFile,
        ]);

        KamplesLogger::info('[Procesos] Proceso Python iniciado', [
            'proceso' => $nombre,
            'pid'     => $pid,
            'cmd'     => $cmdArray,
        ]);

        return [
            'ok'      => true,
            'pid'     => $pid,
            'mensaje' => "Proceso '{$nombre}' iniciado.",
            'log'     => \basename($logFile),
        ];
    }

    private static function ejecutarProcesoPhp(string $nombre): array
    {
        self::escribirLock($nombre, [
            'nombre'      => $nombre,
            'estado'      => 'running',
            'pid'         => \getmypid(),
            'iniciado_at' => \gmdate('c'),
        ]);

        try {
            $resultado = [];

            if ($nombre === self::PROCESO_SEED) {
                $cantNecesarios = SeedUsuarios::calcularCantidadNecesaria();
                if ($cantNecesarios > 0) {
                    $resultado['usuarios_generados'] = SeedUsuarios::generarUsuarios($cantNecesarios);
                }
                $resultado['relaciones'] = SeedUsuarios::atribuirRelaciones();
                $resultado['samples']    = SeedUsuarios::atribuirSamples();
            }

            self::escribirLock($nombre, [
                'nombre'       => $nombre,
                'estado'       => 'stopped',
                'pid'          => null,
                'terminado_at' => \gmdate('c'),
                'resultado'    => $resultado,
            ]);

            KamplesLogger::info('[Procesos] Proceso PHP completado', [
                'proceso'   => $nombre,
                'resultado' => $resultado,
            ]);

            return ['ok' => true, 'mensaje' => "Proceso '{$nombre}' completado.", 'resultado' => $resultado];
        } catch (\Throwable $e) {
            self::escribirLock($nombre, [
                'nombre'       => $nombre,
                'estado'       => 'error',
                'pid'          => null,
                'terminado_at' => \gmdate('c'),
                'error'        => $e->getMessage(),
            ]);

            KamplesLogger::error('[Procesos] Error en proceso PHP', [
                'proceso' => $nombre,
                'error'   => $e->getMessage(),
            ]);

            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Utilidades                                                         */
    /* ------------------------------------------------------------------ */

    private static function escribirLock(string $nombre, array $datos): void
    {
        $json = \json_encode($datos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            return;
        }
        $resultado = \file_put_contents(self::rutaLock($nombre), $json, LOCK_EX);
        if ($resultado === false) {
            KamplesLogger::warning('[Procesos] Fallo al escribir lock file', ['proceso' => $nombre]);
        }
    }

    private static function pidVivo(int $pid): bool
    {
        if ($pid <= 0) {
            return false;
        }

        if (\PHP_OS_FAMILY === 'Windows') {
            /* tasklist /FI espera comillas dobles internas; escapeshellarg las duplica y rompe el query.
               PID ya es int validado (>0) por parametro de type hint, seguro concatenar directamente. */
            $pidInt = (int) $pid;
            \exec('tasklist /FI "PID eq ' . $pidInt . '" /NH 2>&1', $output);
            foreach ($output as $linea) {
                if (\str_contains($linea, (string) $pid)) {
                    return true;
                }
            }
            return false;
        }

        /* Linux/Mac: signal 0 verifica existencia sin matar */
        if (\function_exists('posix_kill')) {
            /* sentinel-disable-next-line undefined-function — guardado con function_exists */
            return \posix_kill($pid, 0);
        }

        /* Fallback si posix no esta disponible */
        $pidSafe = \escapeshellarg((string) $pid);
        \exec('kill -0 ' . $pidSafe . ' 2>&1', $out, $code);
        return $code === 0;
    }

    /*
     * Lee las ultimas N lineas del log del proceso.
     */
    private static function leerLogTail(string $nombre, int $lineas = 30): string
    {
        $logFile = self::directorioLogs() . '/' . $nombre . '-output-' . \date('Y-m-d') . '.log';

        /* Fallback: scraper usa prefijo distinto */
        if ($nombre === self::PROCESO_SCRAPING && !\file_exists($logFile)) {
            $logFile = self::directorioLogs() . '/scraper-output-' . \date('Y-m-d') . '.log';
        }

        if (!\file_exists($logFile)) {
            return '';
        }

        try {
            /* Leer ultimas N lineas sin cargar todo el archivo */
            $fp = \fopen($logFile, 'rb');
            if ($fp === false) {
                return '';
            }

            \fseek($fp, 0, SEEK_END);
            $pos = \ftell($fp);
            $buffer = '';
            $contadorLineas = 0;

            while ($pos > 0 && $contadorLineas < $lineas + 1) {
                $pos--;
                \fseek($fp, $pos);
                $char = \fgetc($fp);
                if ($char === "\n") {
                    $contadorLineas++;
                }
                $buffer = $char . $buffer;
            }

            \fclose($fp);

            return \trim($buffer);
        } catch (\Throwable $e) {
            return '';
        }
    }

    private static function validarNombreProceso(string $nombre): void
    {
        if (!isset(self::PROCESOS[$nombre])) {
            throw new \InvalidArgumentException("Proceso desconocido: '{$nombre}'. Validos: " . \implode(', ', \array_keys(self::PROCESOS)));
        }
    }

    /*
     * Prepara variables de entorno para procesos Python.
     * Inyecta USERPROFILE si falta (comun en servidores web Windows).
     */
    private static function prepararEntorno(): array
    {
        $env = \getenv() ?: [];

        if (\PHP_OS_FAMILY !== 'Windows') {
            return $env;
        }

        if (!empty($env['USERPROFILE']) && \is_dir((string) $env['USERPROFILE'])) {
            return $env;
        }

        $excluidos = ['Public', 'Default', 'All Users', 'Default User'];
        $perfiles  = \is_dir('C:\\Users') ? (\glob('C:\\Users\\*', GLOB_ONLYDIR) ?: []) : [];
        foreach ($perfiles as $perfil) {
            $nombrePerfil = \basename($perfil);
            if (!\in_array($nombrePerfil, $excluidos, true) && \is_dir($perfil)) {
                $env['USERPROFILE'] = $perfil;
                $env['HOMEDRIVE']   = 'C:';
                $env['HOMEPATH']    = '\\Users\\' . $nombrePerfil;
                $env['HOME']        = $perfil;
                break;
            }
        }

        return $env;
    }

    /*
     * Detecta Python disponible en el sistema.
     * Prioridad: KAMPLES_PYTHON_PATH > virtualenv scraper > PATH del sistema.
     */
    private static function detectarPython(): ?string
    {
        /* Constante en wp-config.php */
        if (\defined('KAMPLES_PYTHON_PATH') && \constant('KAMPLES_PYTHON_PATH') !== '') {
            $ruta = (string) \constant('KAMPLES_PYTHON_PATH');
            if (self::verificarPython($ruta)) {
                return $ruta;
            }
        }

        /* Virtualenv del scraper */
        $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;
        $esWindows  = \PHP_OS_FAMILY === 'Windows';
        $rutaVenv   = $scraperDir . ($esWindows ? '\\.venv\\Scripts\\python.exe' : '/.venv/bin/python');

        if (self::verificarPython($rutaVenv)) {
            return $rutaVenv;
        }

        /* PATH del sistema */
        $localizador = $esWindows ? 'where' : 'which';
        $nulo        = $esWindows ? '2>nul' : '2>/dev/null';

        foreach (['python3', 'python', 'py'] as $candidato) {
            $salida = \shell_exec($localizador . ' ' . \escapeshellarg($candidato) . ' ' . $nulo);
            if ($salida === null || \trim($salida) === '') {
                continue;
            }
            foreach (\explode(\PHP_EOL, $salida) as $linea) {
                $ruta = \trim($linea);
                if (self::verificarPython($ruta)) {
                    return $ruta;
                }
            }
        }

        return null;
    }

    private static function verificarPython(string $ruta): bool
    {
        if ($ruta === '' || !\file_exists($ruta)) {
            return false;
        }
        if (\stripos($ruta, 'WindowsApps') !== false) {
            return false;
        }
        $salida = \shell_exec(\escapeshellarg($ruta) . ' --version 2>&1');
        return $salida !== null && \stripos(\trim($salida), 'Python') === 0;
    }

    /* ------------------------------------------------------------------ */
    /*  Cookies yt-dlp (por plataforma)                                    */
    /* ------------------------------------------------------------------ */

    /** Tipos de cookies soportados — whitelist para evitar path traversal */
    private const TIPOS_COOKIES_VALIDOS = ['youtube', 'soundcloud'];

    /**
     * Resuelve el nombre de archivo de cookies segun el tipo de plataforma.
     * Para youtube mantiene retrocompatibilidad: cookies_youtube.txt (preferido) o cookies.txt (legacy).
     */
    private static function resolverNombreCookies(string $tipo): string
    {
        return match ($tipo) {
            'youtube'    => 'cookies_youtube.txt',
            'soundcloud' => 'cookies_soundcloud.txt',
            default      => throw new \InvalidArgumentException("Tipo de cookies invalido: {$tipo}"),
        };
    }

    /**
     * Guarda contenido cookies para yt-dlp en el directorio del scraper.
     * Hace backup del archivo anterior si existe.
     *
     * @param string $contenido Texto completo en formato Netscape cookies.txt
     * @param string $tipo      Plataforma: 'youtube' | 'soundcloud'
     * @return array{ok: bool, mensaje?: string, error?: string, backup?: string}
     */
    public static function guardarCookies(string $contenido, string $tipo = 'youtube'): array
    {
        if (!\in_array($tipo, self::TIPOS_COOKIES_VALIDOS, true)) {
            return ['ok' => false, 'error' => 'Tipo de cookies invalido.'];
        }

        $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;
        $archivo = self::resolverNombreCookies($tipo);
        $rutaCookies = $scraperDir . '/' . $archivo;

        try {
            /* Backup si existe archivo previo */
            $backup = null;
            if (\file_exists($rutaCookies)) {
                $backup = $rutaCookies . '.bak.' . \date('Ymd_His');
                $copiado = \copy($rutaCookies, $backup);
                if (!$copiado) {
                    KamplesLogger::warning("[Procesos] No se pudo crear backup de {$archivo}");
                    $backup = null;
                }
            }

            /* Asegurar header Netscape si no lo tiene */
            $contenidoFinal = $contenido;
            if (\strpos($contenidoFinal, '# Netscape HTTP Cookie File') === false) {
                $contenidoFinal = "# Netscape HTTP Cookie File\n# https://curl.haxx.se/rfc/cookie_spec.html\n\n" . $contenidoFinal;
            }

            $resultado = \file_put_contents($rutaCookies, $contenidoFinal, LOCK_EX);
            if ($resultado === false) {
                return ['ok' => false, 'error' => "No se pudo escribir {$archivo} — verificar permisos del directorio."];
            }

            KamplesLogger::info("[Procesos] {$archivo} actualizado", [
                'bytes'  => $resultado,
                'backup' => $backup,
                'tipo'   => $tipo,
            ]);

            $respuesta = [
                'ok'      => true,
                'mensaje' => "Cookies {$tipo} actualizadas correctamente ({$resultado} bytes).",
            ];
            if ($backup !== null) {
                $respuesta['backup'] = \basename($backup);
            }

            return $respuesta;
        } catch (\Throwable $e) {
            KamplesLogger::error("[Procesos] Error guardando {$archivo}", ['error' => $e->getMessage()]);
            return ['ok' => false, 'error' => 'Error al guardar cookies: ' . $e->getMessage()];
        }
    }

    /**
     * Obtiene metadata de un archivo de cookies (existencia, tamano, fecha).
     *
     * @param string $tipo Plataforma: 'youtube' | 'soundcloud'
     * @return array{existe: bool, tamano?: int, modificado?: string}
     */
    public static function infoCookies(string $tipo = 'youtube'): array
    {
        if (!\in_array($tipo, self::TIPOS_COOKIES_VALIDOS, true)) {
            return ['existe' => false];
        }

        $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;
        $archivo = self::resolverNombreCookies($tipo);
        $rutaCookies = $scraperDir . '/' . $archivo;

        /* Retrocompatibilidad: si no existe cookies_youtube.txt, probar cookies.txt legacy */
        if ($tipo === 'youtube' && !\file_exists($rutaCookies)) {
            $rutaLegacy = $scraperDir . '/cookies.txt';
            if (\file_exists($rutaLegacy)) {
                $rutaCookies = $rutaLegacy;
            }
        }

        if (!\file_exists($rutaCookies)) {
            return ['existe' => false];
        }

        return [
            'existe'     => true,
            'tamano'     => \filesize($rutaCookies) ?: 0,
            'modificado' => \gmdate('c', \filemtime($rutaCookies) ?: 0),
        ];
    }

    /**
     * Info combinada de todas las plataformas de cookies. Usado por listarTodos().
     *
     * @return array<string, array{existe: bool, tamano?: int, modificado?: string}>
     */
    public static function infoCookiesTodas(): array
    {
        $resultado = [];
        foreach (self::TIPOS_COOKIES_VALIDOS as $tipo) {
            $resultado[$tipo] = self::infoCookies($tipo);
        }
        return $resultado;
    }
}
