<?php

/**
 * DevController — Endpoints exclusivos para desarrollo y QA.
 *
 * IMPORTANTE: Todos los endpoints requieren permisos de administrador.
 * Este controlador NO se registra en producción (condición WP_DEBUG).
 *
 * DELETE  /dev/canciones       — Trunca todas las tablas del módulo Sample Discovery
 * POST    /dev/scraper/run     — Ejecuta el spider hot_samples en segundo plano
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\ColaExtraccionSamplesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\ScrapingLogRepository;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\PublicadorExtraccion;
use App\Config\Schema\_generated\ScrapingLogCols;
use App\Config\Schema\_generated\ScrapingLogEnums;

/* TO-DO: Extraer logica de scraper/Python (ejecutarScraper, procesarSiguienteDeCola,
 * detectarPython, verificarBinarioPython) a un servicio dedicado ScraperRunner
 * para cumplir el limite de 300 lineas. El controlador quedaria solo con registrarRutas
 * y callbacks delegando a servicios. */
class DevController
{
    /* Ruta relativa al directorio del scraper dentro del tema */
    private const SCRAPER_DIR = 'kamples-scraper';

    /* Spiders permitidos (whitelist estricta) */
    private const SPIDERS_PERMITIDOS = [
        ScrapingLogEnums::TIPO_PAGINA_HOT_SAMPLES,
        'browse_year',
        ScrapingLogEnums::TIPO_PAGINA_TRACK,
    ];

    /* Dominio permitido para el parámetro URL (solo WhoSampled) */
    private const URL_DOMINIO_PERMITIDO = 'whosampled.com';

    public static function registrarRutas(string $namespace): void
    {
        /* Solo registrar en entornos de desarrollo */
        if (!\defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        \register_rest_route($namespace, '/dev/canciones', [
            'methods'             => 'DELETE',
            'callback'            => [self::class, 'purgarCanciones'],
            'permission_callback' => $admin,
        ]);

        \register_rest_route($namespace, '/dev/scraper/cola', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'procesarSiguienteDeCola'],
            'permission_callback' => $admin,
        ]);

        \register_rest_route($namespace, '/dev/scraper/run', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'ejecutarScraper'],
            'permission_callback' => $admin,
            'args'                => [
                'spider' => [
                    'type'              => 'string',
                    'default'           => ScrapingLogEnums::TIPO_PAGINA_HOT_SAMPLES,
                    'sanitize_callback' => 'sanitize_key',
                    'validate_callback' => static function (string $v): bool {
                        return \in_array($v, self::SPIDERS_PERMITIDOS, true);
                    },
                ],
                'limit' => [
                    'type'    => 'integer',
                    'default' => 0,
                    'minimum' => 0,
                    'maximum' => 500,
                ],
                /* URL directa de WhoSampled para el spider 'track' */
                'url' => [
                    'type'              => 'string',
                    'default'           => '',
                    'sanitize_callback' => 'esc_url_raw',
                    'validate_callback' => static function (string $v): bool {
                        if ($v === '') {
                            return true;
                        }
                        $host = \parse_url($v, PHP_URL_HOST);
                        return \is_string($host) && \str_contains($host, self::URL_DOMINIO_PERMITIDO);
                    },
                ],
            ],
        ]);

        \register_rest_route($namespace, '/dev/recorte/generar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'generarRecorte'],
            'permission_callback' => $admin,
            'args'                => [
                'relacion_id' => [
                    'type'     => 'integer',
                    'required' => true,
                    'minimum'  => 1,
                ],
            ],
        ]);

        \register_rest_route($namespace, '/dev/extraccion/publicar', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'publicarExtracciones'],
            'permission_callback' => $admin,
            'args'                => [
                'limit' => [
                    'type'    => 'integer',
                    'default' => 10,
                    'minimum' => 1,
                    'maximum' => 50,
                ],
            ],
        ]);
    }

    /**
     * Delega el TRUNCATE en cascada al repositorio correspondiente.
     */
    public static function purgarCanciones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            CancionesRepository::purgarModulo();

            KamplesLogger::info('[DEV] Tablas Sample Discovery truncadas');

            return new \WP_REST_Response([
                'ok'      => true,
                'mensaje' => 'Tablas truncadas correctamente.',
                'tablas'  => [
                    'relaciones_sample',
                    'canciones_artistas',
                    'canciones',
                    'artistas_musicales',
                    'scraping_log',
                    'cola_extraccion_samples',
                ],
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[DEV] Error al truncar tablas', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error al truncar tablas.'], 500);
        }
    }

    /**
     * Toma la URL pendiente más antigua de scraping_log y lanza el spider adecuado.
     * Si la cola está vacía, retorna ok=true con cola_vacia=true.
     */
    public static function procesarSiguienteDeCola(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $pendiente = ScrapingLogRepository::pendienteUno();

            /* Cola vacía: caer en hot_samples como fuente de nuevos descubrimientos.
             * modoCola=true limita a 1 página para no correr indefinidamente. */
            if ($pendiente === null) {
                $urlRelativa = '/hot-samples/';
                $tipo        = ScrapingLogEnums::TIPO_PAGINA_HOT_SAMPLES;
                [$spider, $extraArgs] = self::_spiderParaTipo($tipo, '', true);
            } else {
                $urlRelativa = (string) ($pendiente[ScrapingLogCols::URL] ?? '');
                $tipo        = (string) ($pendiente[ScrapingLogCols::TIPO_PAGINA] ?? '');
                $urlCompleta = 'https://www.whosampled.com' . $urlRelativa;
                [$spider, $extraArgs] = self::_spiderParaTipo($tipo, $urlCompleta, true);
            }

            if ($spider === null) {
                KamplesLogger::warning('[DEV] Cola: tipo de página sin spider mapeado', ['tipo' => $tipo, 'url' => $urlRelativa], 'scraper');
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => "Tipo '{$tipo}' sin spider configurado. Revisa la tabla scraping_log.",
                ], 422);
            }

            $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;
            $python     = self::detectarPython();

            if ($python === null) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Python no encontrado.'], 500);
            }

            $logsAppDir = \get_template_directory() . '/App/logs';
            if (!\is_dir($logsAppDir)) {
                \wp_mkdir_p($logsAppDir);
            }
            $logOutput = $logsAppDir . '/scraper-output-' . date('Y-m-d') . '.log';

            $cmdArray = array_merge([$python, '-m', 'scrapy', 'crawl', $spider], $extraArgs);

            $cabecera = "\n" . str_repeat('-', 60) . "\n[" . date('Y-m-d H:i:s') . "] COLA spider={$spider} tipo={$tipo}\n" . str_repeat('-', 60) . "\n";
            file_put_contents($logOutput, $cabecera, FILE_APPEND | LOCK_EX);

            $env = \getenv() ?: [];
            if (empty($env['USERPROFILE']) || !\is_dir((string) $env['USERPROFILE'])) {
                $excluidos = ['Public', 'Default', 'All Users', 'Default User'];
                $perfiles  = \is_dir('C:\\Users') ? (\glob('C:\\Users\\*', GLOB_ONLYDIR) ?: []) : [];
                foreach ($perfiles as $perfil) {
                    $nombre = \basename($perfil);
                    if (!\in_array($nombre, $excluidos, true) && \is_dir($perfil)) {
                        $env['USERPROFILE'] = $perfil;
                        $env['HOMEDRIVE']   = 'C:';
                        $env['HOMEPATH']    = '\\Users\\' . $nombre;
                        $env['HOME']        = $perfil;
                        break;
                    }
                }
            }

            $descriptores = [
                0 => ['file', \PHP_OS_FAMILY === 'Windows' ? 'nul' : '/dev/null', 'r'],
                1 => ['file', $logOutput, 'a'],
                2 => ['file', $logOutput, 'a'],
            ];

            $pipes = [];
            /* sentinel-disable-next-line exec-sin-escapeshellarg — proc_open con array no pasa por shell */
            $proceso = \proc_open($cmdArray, $descriptores, $pipes, $scraperDir, $env);

            if ($proceso === false) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo iniciar el proceso del scraper.'], 500);
            }

            $estado = \proc_get_status($proceso);
            $pid    = $estado['pid'] ?? null;

            KamplesLogger::info('[DEV] Cola: spider iniciado', [
                'spider' => $spider,
                'tipo'   => $tipo,
                'url'    => $urlRelativa,
                'pid'    => $pid,
            ], 'scraper');

            return new \WP_REST_Response([
                'ok'      => true,
                'cola_vacia' => false,
                'mensaje' => "Procesando: [{$tipo}] {$urlRelativa}",
                'url'     => $urlRelativa,
                'tipo'    => $tipo,
                'spider'  => $spider,
                'pid'     => $pid,
            ], 200);

        } catch (\Throwable $e) {
            KamplesLogger::error('[DEV] Error al procesar cola', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mapea tipo_pagina de scraping_log al nombre del spider y argumentos extra.
     * Retorna [spider_name|null, extra_args_array].
     */
    /*
     * Mapea tipo_pagina a [spider, args].
     * IMPORTANTE: en modo cola (procesar 1), cada spider lleva DEPTH_LIMIT=0
     * para que no siga links mas alla de la URL dada. El caller agrega
     * CLOSESPIDER_ITEMCOUNT si necesita limitar items procesados.
     */
    private static function _spiderParaTipo(string $tipo, string $urlCompleta, bool $modoCola = false): array
    {
        $tiposTrack   = [
            ScrapingLogEnums::TIPO_PAGINA_TRACK,
            ScrapingLogEnums::TIPO_PAGINA_TRACK_SAMPLES,
            ScrapingLogEnums::TIPO_PAGINA_TRACK_SAMPLED,
        ];
        $tiposDetalle = [
            ScrapingLogEnums::TIPO_PAGINA_SAMPLE_DETAIL,
            ScrapingLogEnums::TIPO_PAGINA_COVER_DETAIL,
            ScrapingLogEnums::TIPO_PAGINA_REMIX_DETAIL,
        ];

        /* En modo cola: profundidad 0 para no seguir links adicionales */
        $depth = $modoCola ? '0' : '2';

        if (\in_array($tipo, $tiposTrack, true)) {
            return ['track', ['-a', 'start_url=' . $urlCompleta, '-s', 'DEPTH_LIMIT=' . $depth]];
        }
        if (\in_array($tipo, $tiposDetalle, true)) {
            return ['sample_detail', ['-a', 'urls=' . $urlCompleta, '-s', 'DEPTH_LIMIT=' . $depth]];
        }
        if ($tipo === ScrapingLogEnums::TIPO_PAGINA_ARTIST) {
            return ['artist', ['-a', 'start_url=' . $urlCompleta, '-s', 'DEPTH_LIMIT=' . $depth]];
        }
        if ($tipo === ScrapingLogEnums::TIPO_PAGINA_HOT_SAMPLES) {
            /* hot_samples como fallback: limitar a 1 pagina */
            return [ScrapingLogEnums::TIPO_PAGINA_HOT_SAMPLES, $modoCola ? ['-s', 'CLOSESPIDER_PAGECOUNT=1'] : []];
        }
        if ($tipo === ScrapingLogEnums::TIPO_PAGINA_BROWSE_YEAR) {
            return [ScrapingLogEnums::TIPO_PAGINA_BROWSE_YEAR, []];
        }

        return [null, []];
    }

    /**
     * Lanza el scraper de Scrapy en segundo plano via proc_open con array
     * (sin shell intermedio, evitando inyección de comandos).
     */
    public static function ejecutarScraper(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $spider = $request->get_param('spider');
            $limit  = (int) $request->get_param('limit');
            $url    = (string) $request->get_param('url');

            /* Si llega una URL, forzar el spider 'track' y validar dominio */
            if ($url !== '') {
                $host = \parse_url($url, PHP_URL_HOST);
                if (!\is_string($host) || !\str_contains($host, self::URL_DOMINIO_PERMITIDO)) {
                    return new \WP_REST_Response(['ok' => false, 'error' => 'URL no permitida. Solo URLs de WhoSampled.'], 400);
                }
                $spider = ScrapingLogEnums::TIPO_PAGINA_TRACK;
            }

            KamplesLogger::info('[DEV] Iniciando ejecución del scraper', [
                'spider' => $spider,
                'limit'  => $limit,
                'url'    => $url ?: null,
            ], 'scraper');

            /* Doble validación: solo spiders conocidos */
            if (!\in_array($spider, self::SPIDERS_PERMITIDOS, true)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Spider no permitido.'], 400);
            }

            $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;

            KamplesLogger::debug('[DEV] Verificando directorio del scraper', [
                'ruta'   => $scraperDir,
                'existe' => \is_dir($scraperDir),
            ], 'scraper');

            if (!\is_dir($scraperDir)) {
                KamplesLogger::error('[DEV] Directorio del scraper no encontrado', ['ruta' => $scraperDir], 'scraper');
                return new \WP_REST_Response(['ok' => false, 'error' => "Directorio del scraper no encontrado: {$scraperDir}"], 500);
            }

            $python = self::detectarPython();

            KamplesLogger::debug('[DEV] Resultado detección Python', [
                'encontrado' => $python !== null,
                'ruta'       => $python ?? 'null',
                'os'         => \PHP_OS_FAMILY,
            ], 'scraper');

            if ($python === null) {
                KamplesLogger::error('[DEV] Python no encontrado en el sistema', [
                    'os'          => \PHP_OS_FAMILY,
                    'server_path' => \getenv('PATH') ?: 'N/A',
                ], 'scraper');
                return new \WP_REST_Response(['ok' => false, 'error' => 'Python no encontrado. Revisa App/logs/kamples-scraper-*.log para diagnóstico.'], 500);
            }

            /* Log de scraper en App/logs/scraper-output-fecha.log */
            $logsAppDir = \get_template_directory() . '/App/logs';
            if (!\is_dir($logsAppDir)) {
                \wp_mkdir_p($logsAppDir);
            }
            $logOutput = $logsAppDir . '/scraper-output-' . date('Y-m-d') . '.log';

            /* Construir el comando como array (proc_open lo ejecuta sin shell).
             * Esto previene inyección de comandos: cada argumento se pasa directamente al OS. */
            $cmdArray = [$python, '-m', 'scrapy', 'crawl', $spider];
            if ($url !== '') {
                /* -a start_url pasa la URL directamente al spider track */
                $cmdArray[] = '-a';
                $cmdArray[] = 'start_url=' . $url;
                /* Limitar profundidad a 2 para tracks específicos: track → detalle.
                 * Sin límite, el spider sigue el grafo completo de samples/sampled. */
                $cmdArray[] = '-s';
                $cmdArray[] = 'DEPTH_LIMIT=2';
            }
            if ($limit > 0) {
                $cmdArray[] = '-s';
                $cmdArray[] = 'CLOSESPIDER_ITEMCOUNT=' . $limit;
            }

            KamplesLogger::info('[DEV] Ejecutando proc_open', [
                'cmd'        => $cmdArray,
                'cwd'        => $scraperDir,
                'log_output' => $logOutput,
            ], 'scraper');

            $separador = str_repeat('-', 60);
            $cabecera  = "\n{$separador}\n[" . date('Y-m-d H:i:s') . "] INICIO spider={$spider} limit={$limit}\n{$separador}\n";
            file_put_contents($logOutput, $cabecera, FILE_APPEND | LOCK_EX);

            /* Heredar el entorno del proceso actual e inyectar variables de
             * directorio home que faltan cuando PHP corre como proceso de servidor web.
             * Sin USERPROFILE/HOMEPATH, Scrapy falla en Path("~").expanduser(). */
            $env = \getenv() ?: [];
            if (empty($env['USERPROFILE']) || !\is_dir((string) $env['USERPROFILE'])) {
                $excluidos = ['Public', 'Default', 'All Users', 'Default User'];
                $perfiles  = \is_dir('C:\\Users') ? (\glob('C:\\Users\\*', GLOB_ONLYDIR) ?: []) : [];
                foreach ($perfiles as $perfil) {
                    $nombre = \basename($perfil);
                    if (!\in_array($nombre, $excluidos, true) && \is_dir($perfil)) {
                        $env['USERPROFILE'] = $perfil;
                        $env['HOMEDRIVE']   = 'C:';
                        $env['HOMEPATH']    = '\\Users\\' . $nombre;
                        $env['HOME']        = $perfil;
                        KamplesLogger::debug('[DEV] USERPROFILE inyectada en entorno del scraper', [
                            'USERPROFILE' => $perfil,
                        ], 'scraper');
                        break;
                    }
                }
            }

            $descriptores = [
                0 => ['file', \PHP_OS_FAMILY === 'Windows' ? 'nul' : '/dev/null', 'r'],
                1 => ['file', $logOutput, 'a'],
                2 => ['file', $logOutput, 'a'],
            ];

            $pipes   = [];
            /* sentinel-disable-next-line exec-sin-escapeshellarg — proc_open con array no pasa por shell; cada arg llega directo al OS sin interpolación */
            $proceso = \proc_open($cmdArray, $descriptores, $pipes, $scraperDir, $env);

            if ($proceso === false) {
                KamplesLogger::error('[DEV] proc_open devolvió false', [
                    'cmd' => $cmdArray,
                    'cwd' => $scraperDir,
                ], 'scraper');
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo iniciar el proceso del scraper. Revisa App/logs/kamples-scraper-*.log'], 500);
            }

            $estado = \proc_get_status($proceso);
            $pid    = $estado['pid'] ?? null;
            $vivo   = $estado['running'] ?? false;
            /* No llamamos proc_close() para no bloquear: el proceso corre en background */

            KamplesLogger::info('[DEV] Scraper iniciado', [
                'spider'     => $spider,
                'limit'      => $limit,
                'pid'        => $pid,
                'running'    => $vivo,
                'log_output' => 'App/logs/scraper-output-' . date('Y-m-d') . '.log',
            ], 'scraper');

            /* Log también en el canal general para visibilidad rápida */
            KamplesLogger::info('[DEV] Scraper iniciado', ['spider' => $spider, 'limit' => $limit, 'pid' => $pid]);

            return new \WP_REST_Response([
                'ok'      => true,
                'mensaje' => "Spider '{$spider}' iniciado en segundo plano.",
                'pid'     => $pid,
                'log'     => 'App/logs/scraper-output-' . date('Y-m-d') . '.log',
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[DEV] Excepción al ejecutar scraper', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ], 'scraper');
            KamplesLogger::error('[DEV] Error al ejecutar scraper', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Publica samples extraidos (estado='extraido') a traves del flujo estandar.
     * Delega en PublicadorExtraccion (SRP).
     * POST /dev/extraccion/publicar { limit?: int }
     */
    public static function publicarExtracciones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $limit = (int) ($request->get_param('limit') ?: 10);
            $resultado = \App\Kamples\Services\PublicadorExtraccion::publicarPendientes($limit);

            if ($resultado['publicados'] === 0 && $resultado['errores'] === 0) {
                return new \WP_REST_Response([
                    'ok' => true, 'mensaje' => 'Sin extracciones pendientes de publicar.', 'publicados' => 0,
                ], 200);
            }

            return new \WP_REST_Response([
                'ok'         => true,
                'publicados' => $resultado['publicados'],
                'errores'    => $resultado['errores'],
                'resultados' => \array_values($resultado['resultados']),
            ], 200);

        } catch (\Throwable $e) {
            KamplesLogger::error('[DEV] Error global en publicarExtracciones', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Staging dir donde Python guarda el audio extraido antes de publicar.
     * Separado de uploads finales para no mezclar archivos temporales con publicados.
     */
    private static function directorioStagingExtraccion(): string
    {
        $uploadsDir = \wp_upload_dir();
        $staging = $uploadsDir['basedir'] . '/kamples/extracciones';

        if (!\is_dir($staging)) {
            \wp_mkdir_p($staging);
        }

        return $staging;
    }

    /**
     * Encola extracción bilateral y lanza el pipeline Python para una relación.
     * POST /dev/recorte/generar { relacion_id: int }
     */
    public static function generarRecorte(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $relacionId = (int) $request->get_param('relacion_id');

            /* Verificar existencia de la relación con datos completos (youtube_id, spotify_id, timings) */
            $relacion = RelacionesSampleRepository::porRelacionId($relacionId);
            if ($relacion === null) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relación no encontrada.'], 404);
            }

            /* Encolar bilateral (fuente + destino) */
            $ids = ColaExtraccionSamplesRepository::encolarBilateral($relacion);

            if (empty($ids)) {
                return new \WP_REST_Response([
                    'ok'      => true,
                    'mensaje' => 'Ambos lados ya estaban encolados o sin fuente de audio.',
                    'encolados' => 0,
                ], 200);
            }

            /* Lanzar pipeline Python en background */
            $python = self::detectarPython();
            if ($python === null) {
                return new \WP_REST_Response([
                    'ok'      => true,
                    'mensaje' => 'Encolados ' . \count($ids) . ' lados, pero Python no disponible para ejecutar pipeline.',
                    'encolados' => \count($ids),
                    'cola_ids' => $ids,
                ], 200);
            }

            $scraperDir = \get_template_directory() . '/' . self::SCRAPER_DIR;
            $logsAppDir = \get_template_directory() . '/App/logs';
            if (!\is_dir($logsAppDir)) {
                \wp_mkdir_p($logsAppDir);
            }
            $logOutput = $logsAppDir . '/extractor-output-' . date('Y-m-d') . '.log';

            $cmdArray = [$python, '-m', 'extractor.pipeline', '--limit', (string) \count($ids), '--output-dir', self::directorioStagingExtraccion()];

            $cabecera = "\n" . str_repeat('-', 60) . "\n[" . date('Y-m-d H:i:s') . "] RECORTE relacion_id={$relacionId} encolados=" . \count($ids) . "\n" . str_repeat('-', 60) . "\n";
            file_put_contents($logOutput, $cabecera, FILE_APPEND | LOCK_EX);

            $env = \getenv() ?: [];
            if (empty($env['USERPROFILE']) || !\is_dir((string) $env['USERPROFILE'])) {
                $excluidos = ['Public', 'Default', 'All Users', 'Default User'];
                $perfiles  = \is_dir('C:\\Users') ? (\glob('C:\\Users\\*', GLOB_ONLYDIR) ?: []) : [];
                foreach ($perfiles as $perfil) {
                    $nombre = \basename($perfil);
                    if (!\in_array($nombre, $excluidos, true) && \is_dir($perfil)) {
                        $env['USERPROFILE'] = $perfil;
                        $env['HOMEDRIVE']   = 'C:';
                        $env['HOMEPATH']    = '\\Users\\' . $nombre;
                        $env['HOME']        = $perfil;
                        break;
                    }
                }
            }

            $descriptores = [
                0 => ['file', \PHP_OS_FAMILY === 'Windows' ? 'nul' : '/dev/null', 'r'],
                1 => ['file', $logOutput, 'a'],
                2 => ['file', $logOutput, 'a'],
            ];

            $pipes = [];
            /* sentinel-disable-next-line exec-sin-escapeshellarg — proc_open con array no pasa por shell */
            $proceso = \proc_open($cmdArray, $descriptores, $pipes, $scraperDir, $env);

            $pid = null;
            if ($proceso !== false) {
                $estado = \proc_get_status($proceso);
                $pid    = $estado['pid'] ?? null;
                /* No llamar proc_close — dejar que Python corra en background.
                 * WP Cron se encarga de publicar cuando el pipeline termine (~3min). */
            }

            /* Programar publicacion via WP Cron: se dispara 3 minutos despues
             * para dar tiempo a que Python descargue y corte el audio. */
            \wp_schedule_single_event(\time() + 180, 'kamples_publicar_extracciones', [\count($ids)]);

            KamplesLogger::info('[DEV] Recorte encolado + pipeline iniciado en background', [
                'relacion_id' => $relacionId,
                'encolados'   => \count($ids),
                'pid'         => $pid,
                'publicar_en' => date('H:i:s', \time() + 180),
            ]);

            return new \WP_REST_Response([
                'ok'        => true,
                'mensaje'   => 'Pipeline iniciado. Publicacion programada en ~3 minutos.',
                'encolados' => \count($ids),
                'pid'       => $pid,
                'log'       => 'App/logs/extractor-output-' . date('Y-m-d') . '.log',
            ], 200);

        } catch (\Throwable $e) {
            KamplesLogger::error('[DEV] Error al generar recorte', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Detecta el binario de Python disponible en el sistema.
     * Retorna la ruta absoluta del binario o null si no se encuentra.
     */
    /**
     * Verifica que un binario existe, NO es el stub del Microsoft Store,
     * y responde correctamente a --version.
     * Los stubs de WindowsApps no son Python real: existen en disco pero
     * al ejecutarse muestran "Python was not found; run without arguments..."
     */
    private static function verificarBinarioPython(string $ruta): bool
    {
        if ($ruta === '' || !\file_exists($ruta)) {
            return false;
        }

        /* Filtrar stubs del Microsoft Store — nunca son Python real */
        if (\stripos($ruta, 'WindowsApps') !== false) {
            KamplesLogger::debug('[DEV] Python stub de WindowsApps descartado', ['ruta' => $ruta], 'scraper');
            return false;
        }

        /* Verificar ejecución real: python --version debe devolver algo con "Python" */
        $salida = \shell_exec(\escapeshellarg($ruta) . ' --version 2>&1');
        $valido = $salida !== null && \stripos(\trim($salida), 'Python') === 0;

        KamplesLogger::debug('[DEV] Verificación binario Python', [
            'ruta'   => $ruta,
            'salida' => \trim($salida ?? '(null)'),
            'valido' => $valido,
        ], 'scraper');

        return $valido;
    }

    private static function detectarPython(): ?string
    {
        /* Escape hatch: constante definida en wp-config.php para entornos donde
         * la detección automática falla (PATH de PHP ≠ PATH del usuario).
         * Ejemplo: define('KAMPLES_PYTHON_PATH', 'C:\\ruta\\python.exe'); */
        if (\defined('KAMPLES_PYTHON_PATH') && \constant('KAMPLES_PYTHON_PATH') !== '') {
            $rutaConfig = (string) \constant('KAMPLES_PYTHON_PATH');
            KamplesLogger::debug('[DEV] Usando KAMPLES_PYTHON_PATH definida en wp-config', ['ruta' => $rutaConfig], 'scraper');
            if (self::verificarBinarioPython($rutaConfig)) {
                return $rutaConfig;
            }
            KamplesLogger::error('[DEV] KAMPLES_PYTHON_PATH definida pero binario no válido', ['ruta' => $rutaConfig], 'scraper');
        }

        /* Primera prioridad: virtualenv del propio scraper (tiene Scrapy instalado).
         * Es la opción correcta: garantiza que todas las dependencias están disponibles. */
        $scraperDir  = \get_template_directory() . '/' . self::SCRAPER_DIR;
        $esWindows   = \PHP_OS_FAMILY === 'Windows';
        $rutaVenvPython = $scraperDir . ($esWindows ? '\\.venv\\Scripts\\python.exe' : '/.venv/bin/python');

        if (self::verificarBinarioPython($rutaVenvPython)) {
            KamplesLogger::debug('[DEV] Usando Python del virtualenv del scraper', ['ruta' => $rutaVenvPython], 'scraper');
            return $rutaVenvPython;
        }

        KamplesLogger::debug('[DEV] Virtualenv no encontrado, usando detección del sistema', [
            'ruta_venv_probada' => $rutaVenvPython,
        ], 'scraper');

        $localizador = $esWindows ? 'where' : 'which';
        $nulo        = $esWindows ? '2>nul' : '2>/dev/null';

        foreach (['python3', 'python', 'py'] as $candidato) {
            $salida = \shell_exec($localizador . ' ' . \escapeshellarg($candidato) . ' ' . $nulo);
            if ($salida === null || \trim($salida) === '') {
                continue;
            }

            foreach (\explode(\PHP_EOL, $salida) as $linea) {
                $ruta = \trim($linea);
                if (self::verificarBinarioPython($ruta)) {
                    return $ruta;
                }
            }
        }

        /* Fallback Windows: escanear perfiles de usuario sin depender de USERPROFILE
         * (varía según el proceso que corre el servidor web) */
        if ($esWindows) {
            $versiones        = ['313', '312', '311', '310', '39', '38'];
            $candidatosFijos  = ['C:\\Python313\\python.exe', 'C:\\Python312\\python.exe', 'C:\\Python311\\python.exe', 'C:\\Python310\\python.exe'];

            $perfiles = \glob('C:\\Users\\*', GLOB_ONLYDIR);
            if (\is_array($perfiles)) {
                foreach ($perfiles as $perfil) {
                    foreach ($versiones as $ver) {
                        $candidatosFijos[] = $perfil . '\\AppData\\Local\\Programs\\Python\\Python' . $ver . '\\python.exe';
                    }
                }
            }

            foreach ($candidatosFijos as $ruta) {
                if (self::verificarBinarioPython($ruta)) {
                    return $ruta;
                }
            }
        }

        return null;
    }
}

