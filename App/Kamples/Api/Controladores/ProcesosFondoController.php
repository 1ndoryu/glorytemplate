<?php

/*
 * Controller: ProcesosFondoController
 * Endpoints admin para gestionar procesos de fondo (scraping, extraccion, seed).
 * Delega toda la logica a GestorProcesosFondo (SRP).
 *
 * GET  /admin/procesos           — Estado de todos los procesos
 * GET  /admin/procesos/{nombre}  — Estado de un proceso especifico
 * POST /admin/procesos/{nombre}/start — Iniciar proceso
 * POST /admin/procesos/{nombre}/stop  — Detener proceso
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\GestorProcesosFondo;
use App\Kamples\KamplesLogger;

class ProcesosFondoController
{
    /* Nombres validos de proceso (whitelist) */
    private const NOMBRES_VALIDOS = ['scraping', 'extraccion', 'seed'];

    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        \register_rest_route($namespace, '/admin/procesos', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listarTodos'],
            'permission_callback' => $admin,
        ]);

        \register_rest_route($namespace, '/admin/procesos/(?P<nombre>[a-z_]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estado'],
            'permission_callback' => $admin,
            'args'                => self::argsNombre(),
        ]);

        \register_rest_route($namespace, '/admin/procesos/(?P<nombre>[a-z_]+)/start', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'iniciar'],
            'permission_callback' => $admin,
            'args'                => \array_merge(self::argsNombre(), [
                'limit' => [
                    'type'    => 'integer',
                    'default' => 0,
                    'minimum' => 0,
                    'maximum' => 500,
                ],
            ]),
        ]);

        \register_rest_route($namespace, '/admin/procesos/(?P<nombre>[a-z_]+)/stop', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'detener'],
            'permission_callback' => $admin,
            'args'                => self::argsNombre(),
        ]);

        \register_rest_route($namespace, '/admin/procesos/cookies', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'actualizarCookies'],
            'permission_callback' => $admin,
            'args'                => [
                'tipo' => [
                    'type'              => 'string',
                    'required'          => false,
                    'default'           => 'youtube',
                    'sanitize_callback' => 'sanitize_key',
                    'validate_callback' => static function (string $v): bool {
                        return \in_array($v, ['youtube', 'soundcloud'], true);
                    },
                ],
            ],
        ]);

        \register_rest_route($namespace, '/admin/procesos/cookies', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'infoCookies'],
            'permission_callback' => $admin,
        ]);

        /* [183A-68] Benchmark del algoritmo de recomendacion — ejecuta el CLI y devuelve texto */
        \register_rest_route($namespace, '/admin/procesos/benchmark', [
            'methods'             => 'POST',
            'callback'            => [self::class, 'ejecutarBenchmark'],
            'permission_callback' => $admin,
            'args'                => [
                'userId' => [
                    'type'    => 'integer',
                    'default' => 1,
                    'minimum' => 1,
                ],
                'perPage' => [
                    'type'    => 'integer',
                    'default' => 30,
                    'minimum' => 5,
                    'maximum' => 100,
                ],
            ],
        ]);
    }

    public static function listarTodos(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            return new \WP_REST_Response([
                'ok'       => true,
                'procesos' => GestorProcesosFondo::estadoTodos(),
                'cookies'  => GestorProcesosFondo::infoCookiesTodas(),
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error listando procesos', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function estado(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $nombre = $request->get_param('nombre');
            return new \WP_REST_Response([
                'ok'      => true,
                'proceso' => GestorProcesosFondo::estadoProceso($nombre),
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error obteniendo estado', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function iniciar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $nombre = $request->get_param('nombre');
            $limit  = (int) $request->get_param('limit');

            $opciones = [];
            if ($limit > 0) {
                $opciones['limit'] = $limit;
            }

            $resultado = GestorProcesosFondo::iniciar($nombre, $opciones);

            $status = ($resultado['ok'] ?? false) ? 200 : 409;
            return new \WP_REST_Response($resultado, $status);
        } catch (\InvalidArgumentException $e) {
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error iniciando proceso', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    public static function detener(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $nombre   = $request->get_param('nombre');
            $resultado = GestorProcesosFondo::detener($nombre);

            return new \WP_REST_Response($resultado, 200);
        } catch (\InvalidArgumentException $e) {
            return new \WP_REST_Response(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error deteniendo proceso', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * Actualiza cookies del scraper para autenticacion yt-dlp.
     * Recibe contenido como texto plano en el body y tipo de plataforma.
     * POST /admin/procesos/cookies
     */
    public static function actualizarCookies(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $contenido = $request->get_param('contenido');
            $tipo      = $request->get_param('tipo') ?? 'youtube';

            if (!\is_string($contenido) || \trim($contenido) === '') {
                return new \WP_REST_Response([
                    'ok' => false, 'error' => 'Contenido de cookies vacio.',
                ], 400);
            }

            /* Validar formato basico Netscape cookies.txt (lineas con campos tab-separated) */
            $lineas = \explode("\n", $contenido);
            $lineasValidas = 0;
            foreach ($lineas as $linea) {
                $limpia = \trim($linea);
                if ($limpia === '' || \str_starts_with($limpia, '#')) {
                    continue;
                }
                $campos = \explode("\t", $limpia);
                if (\count($campos) >= 7) {
                    $lineasValidas++;
                }
            }

            if ($lineasValidas < 1) {
                return new \WP_REST_Response([
                    'ok'    => false,
                    'error' => 'Formato invalido: se esperan cookies en formato Netscape (tab-separated, min 7 campos por linea).',
                ], 400);
            }

            $resultado = GestorProcesosFondo::guardarCookies($contenido, $tipo);

            return new \WP_REST_Response($resultado, $resultado['ok'] ? 200 : 500);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error actualizando cookies', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * GET /admin/procesos/cookies — Info de todos los archivos de cookies.
     */
    public static function infoCookies(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            return new \WP_REST_Response([
                'ok'      => true,
                'cookies' => GestorProcesosFondo::infoCookiesTodas(),
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Procesos] Error obteniendo info cookies', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno.'], 500);
        }
    }

    /**
     * [183A-68] POST /admin/procesos/benchmark — Ejecuta benchmarkAlgoritmo.php y devuelve output.
     * Usa proc_open para capturar stdout+stderr con timeout de 150s.
     * Solo admin puede ejecutar.
     */
    public static function ejecutarBenchmark(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId  = (int) ($request->get_param('userId')  ?? 1);
            $perPage = (int) ($request->get_param('perPage') ?? 30);

            $phpBin   = \PHP_BINARY;
            $script   = \realpath(\dirname(__DIR__, 2) . '/Cli/benchmarkAlgoritmo.php');

            if ($script === false || !\is_file($script)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Script de benchmark no encontrado.'], 500);
            }

            /* Sanitizar argumentos para evitar inyeccion de shell */
            $cmd = \escapeshellarg($phpBin) . ' ' . \escapeshellarg($script)
                 . ' ' . (int) $userId . ' ' . (int) $perPage;

            $descriptors = [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ];

            /* Los dos argumentos ya pasan por escapeshellarg() arriba — seguro contra inyeccion */
            $proc = \proc_open($cmd, $descriptors, $pipes, null, null); /* sentinel-disable shell-injection */
            if (!\is_resource($proc)) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No se pudo iniciar el proceso.'], 500);
            }

            \fclose($pipes[0]);
            \stream_set_timeout($pipes[1], 150);
            \stream_set_timeout($pipes[2], 150);

            $stdout = \stream_get_contents($pipes[1]);
            $stderr = \stream_get_contents($pipes[2]);

            \fclose($pipes[1]);
            \fclose($pipes[2]);

            $exitCode = \proc_close($proc);

            if ($exitCode !== 0) {
                KamplesLogger::warning('[Benchmark] Proceso termino con codigo ' . $exitCode, [
                    'stderr' => \substr((string) $stderr, 0, 500),
                ]);
            }

            return new \WP_REST_Response([
                'ok'       => $exitCode === 0,
                'output'   => (string) $stdout,
                'stderr'   => $exitCode !== 0 ? \substr((string) $stderr, 0, 1000) : '',
                'exitCode' => $exitCode,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('[Benchmark] Error ejecutando benchmark', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno: ' . $e->getMessage()], 500);
        }
    }

    private static function argsNombre(): array
    {
        return [
            'nombre' => [
                'type'              => 'string',
                'required'          => true,
                'sanitize_callback' => 'sanitize_key',
                'validate_callback' => static function (string $v): bool {
                    return \in_array($v, self::NOMBRES_VALIDOS, true);
                },
            ],
        ];
    }
}
