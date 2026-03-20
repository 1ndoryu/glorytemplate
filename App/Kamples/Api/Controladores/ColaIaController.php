<?php

/**
 * ColaIaController — Endpoints admin para gestionar la cola de procesamiento IA.
 *
 * C356: Proporciona visibilidad y control sobre los items encolados
 * cuando Groq devuelve rate limit (429).
 *
 * Endpoints:
 *   GET    /admin/cola-ia              — Lista items con paginacion y filtros
 *   GET    /admin/cola-ia/estadisticas — Estadisticas agregadas
 *   POST   /admin/cola-ia/reintentar   — Reintentar un item especifico
 *   POST   /admin/cola-ia/reintentar-todos — Reintentar todos los items con error
 *   POST   /admin/cola-ia/procesar     — Forzar procesamiento inmediato del cron
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\ColaProcesamientoIaRepository;
use App\Config\Schema\_generated\ColaProcesamientoIaEnums;
use App\Kamples\Auth\AuthMiddleware;
use App\Kamples\Services\ProcesadorColaIA;
use App\Kamples\Api\GroqHttpClient;
use App\Kamples\KamplesLogger;

class ColaIaController
{
    /**
     * Registra las rutas REST para gestion de la cola IA.
     * Llamar desde KamplesController::registrar().
     */
    public static function registrarRutas(string $namespace): void
    {
        $admin = [AuthMiddleware::class, 'requerirAdmin'];

        /* Lista paginada de items en la cola */
        register_rest_route($namespace, '/admin/cola-ia', [
            'methods' => 'GET',
            'callback' => [self::class, 'listar'],
            'permission_callback' => $admin,
        ]);

        /* Estadisticas agregadas */
        register_rest_route($namespace, '/admin/cola-ia/estadisticas', [
            'methods' => 'GET',
            'callback' => [self::class, 'estadisticas'],
            'permission_callback' => $admin,
        ]);

        /* Reintentar un item especifico */
        register_rest_route($namespace, '/admin/cola-ia/reintentar', [
            'methods' => 'POST',
            'callback' => [self::class, 'reintentar'],
            'permission_callback' => $admin,
        ]);

        /* Reintentar todos los items con error */
        register_rest_route($namespace, '/admin/cola-ia/reintentar-todos', [
            'methods' => 'POST',
            'callback' => [self::class, 'reintentarTodos'],
            'permission_callback' => $admin,
        ]);

        /* Forzar procesamiento inmediato de la cola */
        register_rest_route($namespace, '/admin/cola-ia/procesar', [
            'methods' => 'POST',
            'callback' => [self::class, 'procesarAhora'],
            'permission_callback' => $admin,
        ]);

        /* Cuota de Groq (rate limits) */
        register_rest_route($namespace, '/admin/cola-ia/cuota-groq', [
            'methods' => 'GET',
            'callback' => [self::class, 'cuotaGroq'],
            'permission_callback' => $admin,
        ]);

        /* Estado de las API keys Groq configuradas */
        register_rest_route($namespace, '/admin/cola-ia/estado-keys', [
            'methods' => 'GET',
            'callback' => [self::class, 'estadoKeys'],
            'permission_callback' => $admin,
        ]);
    }

    /**
     * GET /admin/cola-ia?estado=pendiente&tipo=sample&pagina=1&limite=20
     * Lista items de la cola con filtros opcionales.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $estado = $request->get_param('estado');
            $tipo = $request->get_param('tipo');
            $pagina = \max(1, (int) ($request->get_param('pagina') ?? 1));
            $limite = \min(100, \max(5, (int) ($request->get_param('limite') ?? 20)));

            /* Validar filtros contra valores validos del schema */
            $estadosValidos = [
                ColaProcesamientoIaEnums::ESTADO_PENDIENTE,
                ColaProcesamientoIaEnums::ESTADO_PROCESANDO,
                ColaProcesamientoIaEnums::ESTADO_COMPLETADO,
                ColaProcesamientoIaEnums::ESTADO_ERROR_REINTENTO,
                ColaProcesamientoIaEnums::ESTADO_ERROR_FINAL,
            ];
            if ($estado && !\in_array($estado, $estadosValidos, true)) {
                return new \WP_REST_Response(['code' => 'filtro_invalido', 'message' => 'Estado no valido'], 400);
            }

            $tiposValidos = [
                ColaProcesamientoIaEnums::TIPO_SAMPLE,
                ColaProcesamientoIaEnums::TIPO_PUBLICACION,
                ColaProcesamientoIaEnums::TIPO_COMENTARIO,
            ];
            if ($tipo && !\in_array($tipo, $tiposValidos, true)) {
                return new \WP_REST_Response(['code' => 'filtro_invalido', 'message' => 'Tipo no valido'], 400);
            }

            $items = ColaProcesamientoIaRepository::listarItems(
                $pagina,
                $limite,
                $estado,
                $tipo,
                sanitize_text_field($request->get_param('busqueda') ?? ''),
                sanitize_text_field($request->get_param('sort_col') ?? ''),
                sanitize_text_field($request->get_param('sort_dir') ?? 'DESC')
            );

            return new \WP_REST_Response(['data' => $items], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::listar fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * GET /admin/cola-ia/estadisticas
     * Estadisticas agregadas: totales por estado, pendientes, errores, etc.
     */
    public static function estadisticas(): \WP_REST_Response
    {
        try {
            $stats = ColaProcesamientoIaRepository::obtenerEstadisticas();
            return new \WP_REST_Response(['data' => $stats], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::estadisticas fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/cola-ia/reintentar { id: number }
     * Fuerza reintento de un item especifico.
     */
    public static function reintentar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            if ($id <= 0) {
                return new \WP_REST_Response(['code' => 'id_requerido', 'message' => 'ID de item requerido'], 400);
            }

            $resultado = ColaProcesamientoIaRepository::forzarReintento($id);
            if (!$resultado) {
                return new \WP_REST_Response(['code' => 'no_encontrado', 'message' => 'Item no encontrado o no reintenible'], 404);
            }

            KamplesLogger::info('ColaIaController: Reintento forzado', ['itemId' => $id]);
            return new \WP_REST_Response(['ok' => true, 'message' => 'Item marcado para reintento'], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::reintentar fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/cola-ia/reintentar-todos
     * Fuerza reintento de todos los items con error (error_reintento + error_final).
     */
    public static function reintentarTodos(): \WP_REST_Response
    {
        try {
            $total = ColaProcesamientoIaRepository::forzarReintentarTodos();

            KamplesLogger::info('ColaIaController: Reintento masivo', ['total' => $total]);
            return new \WP_REST_Response([
                'ok' => true,
                'total' => $total,
                'message' => "{$total} items marcados para reintento",
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::reintentarTodos fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * POST /admin/cola-ia/procesar
     * Ejecuta el procesamiento de la cola inmediatamente (sin esperar cron).
     * Util para admin que quiere forzar el reproceso ahora.
     */
    public static function procesarAhora(): \WP_REST_Response
    {
        try {
            $resultado = ProcesadorColaIA::procesar();

            KamplesLogger::info('ColaIaController: Procesamiento manual ejecutado', $resultado);
            return new \WP_REST_Response([
                'ok' => true,
                'resultado' => $resultado,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::procesarAhora fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * GET /admin/cola-ia/cuota-groq
     * Consulta la cuota actual de Groq haciendo un GET ligero al endpoint de modelos.
     * Retorna headers x-ratelimit-* capturados por GroqHttpClient.
     */
    public static function cuotaGroq(): \WP_REST_Response
    {
        try {
            $apiKey = \defined('GROQ_API') ? \GROQ_API : (\getenv('GROQ_API') ?: '');
            if (empty($apiKey)) {
                return new \WP_REST_Response([
                    'ok' => false,
                    'error' => 'API key de Groq no configurada',
                ], 200);
            }

            /* GET ligero al endpoint de modelos para capturar headers de cuota */
            $ch = \curl_init('https://api.groq.com/openai/v1/models');
            if ($ch === false) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'curl_init failed'], 500);
            }

            $headersCapturados = [];
            $headerCallback = static function ($curl, string $linea) use (&$headersCapturados): int {
                $len = \strlen($linea);
                $partes = \explode(':', $linea, 2);
                if (\count($partes) === 2) {
                    $nombre = \strtolower(\trim($partes[0]));
                    $valor = \trim($partes[1]);
                    if (\str_starts_with($nombre, 'x-ratelimit-')) {
                        $headersCapturados[$nombre] = $valor;
                    }
                }
                return $len;
            };

            \curl_setopt_array($ch, [
                CURLOPT_HTTPHEADER     => ["Authorization: Bearer {$apiKey}"],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT        => 10,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_HEADERFUNCTION => $headerCallback,
            ]);

            $respuesta = \curl_exec($ch);
            $httpCode = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = \curl_error($ch);
            \curl_close($ch);

            if ($curlError) {
                return new \WP_REST_Response(['ok' => false, 'error' => $curlError], 200);
            }

            $cuota = [
                'limitRequests' => (int) ($headersCapturados['x-ratelimit-limit-requests'] ?? 0),
                'remainingRequests' => (int) ($headersCapturados['x-ratelimit-remaining-requests'] ?? 0),
                'limitTokens' => (int) ($headersCapturados['x-ratelimit-limit-tokens'] ?? 0),
                'remainingTokens' => (int) ($headersCapturados['x-ratelimit-remaining-tokens'] ?? 0),
                'resetRequests' => $headersCapturados['x-ratelimit-reset-requests'] ?? '',
                'resetTokens' => $headersCapturados['x-ratelimit-reset-tokens'] ?? '',
            ];

            return new \WP_REST_Response([
                'ok' => true,
                'cuota' => $cuota,
                'httpCode' => $httpCode,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::cuotaGroq fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }

    /**
     * GET /admin/cola-ia/estado-keys
     * Devuelve el estado de las API keys Groq configuradas (GROQ_API_1/2/3).
     * Permite verificar en el panel admin que las 3 keys están activas y cuál se usa ahora.
     */
    public static function estadoKeys(): \WP_REST_Response
    {
        try {
            $nombres = ['GROQ_API_1', 'GROQ_API_2', 'GROQ_API_3'];
            $keys = [];
            foreach ($nombres as $nombre) {
                $v = $_ENV[$nombre] ?? null;
                if ($v === null) {
                    $v = getenv($nombre) ?: null;
                }
                $ok = $v !== null && \str_starts_with($v, 'gsk_');
                $keys[] = [
                    'nombre'      => $nombre,
                    'configurada' => $ok,
                    'preview'     => $ok ? \substr($v, 0, 12) . '***' : null,
                ];
            }

            /* Verificar legacy GROQ_API (Docker env var) como fallback */
            $legacy = $_ENV['GROQ_API'] ?? null;
            if ($legacy === null) {
                $legacy = getenv('GROQ_API') ?: null;
            }
            $legacyOk = $legacy !== null && \str_starts_with($legacy, 'gsk_');

            $totalOk = \count(\array_filter($keys, static fn($k) => $k['configurada']));
            $indice = (int) get_transient('kmpl_groq_key_index');
            $ultimoAudio = (int) get_transient('kmpl_ia_ultimo_audio');
            $contadorDiario = (int) get_transient('kmpl_ia_daily_count');

            return new \WP_REST_Response([
                'ok'              => true,
                'keys'            => $keys,
                'legacy_groq_api' => [
                    'configurada' => $legacyOk,
                    'preview'     => $legacyOk ? \substr($legacy, 0, 12) . '***' : null,
                ],
                'indice_actual'       => $indice % \max(1, $totalOk),
                'total_configuradas'  => $totalOk,
                'ultimo_audio_ts'     => $ultimoAudio > 0 ? \date('Y-m-d H:i:s', $ultimoAudio) : null,
                'contador_diario'     => $contadorDiario,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('ColaIaController::estadoKeys fallo', ['error' => $e->getMessage()]);
            return new \WP_REST_Response(['code' => 'error_interno', 'message' => 'Error interno'], 500);
        }
    }
}
