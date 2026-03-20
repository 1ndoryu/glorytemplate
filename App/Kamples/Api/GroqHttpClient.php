<?php
/* sentinel-disable-file limite-lineas — Cliente HTTP central compartido por 3 servicios IA, concentra cURL, rotación de keys y estado rate limit */

/**
 * GroqHttpClient — Cliente HTTP compartido para APIs de Groq
 *
 * Centraliza peticiones cURL JSON y multipart usadas por
 * ServicioIA, ServicioImagenIA y ServicioModeracionIA.
 * Elimina duplicación de código HTTP entre los 3 servicios (A10).
 *
 * C356: Agregados metodos tipados (*Tipada) que retornan ResultadoGroq
 * con deteccion explicita de rate limit (HTTP 429) para encolar en cola IA.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\KamplesLogger;

class GroqHttpClient
{
    private const TIMEOUT = 30;
    private const CONNECT_TIMEOUT = 8;

    /* C356: Codigo HTTP que indica rate limit de Groq */
    private const HTTP_RATE_LIMIT = 429;

    /*
     * C356: Estado de rate limit a nivel de request PHP.
     * Se setea automaticamente al recibir 429 en cualquier peticion.
     * Los callers de alto nivel (PipelineAudio, ServicioModeracionIA) consultan
     * fueRateLimited() despues de sus llamadas IA para decidir si encolar.
     * En el ciclo de vida PHP (single-request), esto es seguro y predecible.
     */
    private static bool $rateLimitDetectado = false;
    private static float $retryAfterSegundos = 0.0;

    /*
     * Cuota de rate limit capturada de los headers x-ratelimit-* de Groq.
     * Se actualiza en cada petición exitosa o fallida (429).
     * Formato: [limitRequests, remainingRequests, limitTokens, remainingTokens, resetRequests, resetTokens]
     *
     * @var array{limitRequests: int, remainingRequests: int, limitTokens: int, remainingTokens: int, resetRequests: string, resetTokens: string}|null
     */
    private static ?array $ultimaCuota = null;

    /**
     * C356: Indica si se detecto rate limit (429) durante el request actual.
     */
    public static function fueRateLimited(): bool
    {
        return self::$rateLimitDetectado;
    }

    /**
     * C356: Tiempo de espera sugerido por Groq antes de reintentar.
     */
    public static function obtenerRetryAfterSegundos(): float
    {
        return self::$retryAfterSegundos;
    }

    /**
     * C356: Resetea el estado de rate limit.
     * Llamar al inicio de cada operacion de alto nivel para no arrastrar estado previo.
     */
    public static function resetearEstadoRateLimit(): void
    {
        self::$rateLimitDetectado = false;
        self::$retryAfterSegundos = 0.0;
    }

    /**
     * Cuota de rate limit capturada de los headers de la última petición a Groq.
     * Retorna null si aún no se ha hecho ninguna petición en este request PHP.
     *
     * @return array{limitRequests: int, remainingRequests: int, limitTokens: int, remainingTokens: int, resetRequests: string, resetTokens: string}|null
     */
    public static function obtenerUltimaCuota(): ?array
    {
        return self::$ultimaCuota;
    }

    /**
     * C356: Resultado tipado para peticiones Groq.
     * Permite a los callers distinguir entre exito, error generico y rate limit.
     *
     * @return array{ok: bool, body: string|null, esRateLimit: bool, retryAfter: float, httpCode: int, error: string|null}
     */
    private static function resultadoOk(string $body, int $httpCode = 200): array
    {
        return [
            'ok' => true,
            'body' => $body,
            'esRateLimit' => false,
            'retryAfter' => 0.0,
            'httpCode' => $httpCode,
            'error' => null,
        ];
    }

    /**
     * @return array{ok: bool, body: string|null, esRateLimit: bool, retryAfter: float, httpCode: int, error: string|null}
     */
    private static function resultadoError(string $error, int $httpCode = 0, bool $esRateLimit = false, float $retryAfter = 0.0): array
    {
        return [
            'ok' => false,
            'body' => null,
            'esRateLimit' => $esRateLimit,
            'retryAfter' => $retryAfter,
            'httpCode' => $httpCode,
            'error' => $error,
        ];
    }

    /**
     * POST JSON genérica a la API de Groq.
     * Retorna body como string o null si falla.
     *
     * @param string $url URL completa del endpoint
     * @param array $payload Datos a enviar como JSON
     * @param array $headers Headers HTTP adicionales
     * @param string $etiqueta Identificador para logs
     * @param int $timeout Timeout personalizado (0 = default 30s)
     * @param int|null &$httpCodeOut Código HTTP de salida
     * @param float|null &$retryAfterOut Tiempo de retry sugerido por Groq
     * @param string|null &$curlErrorOut Error de cURL si falla
     * @return string|null Body de respuesta o null
     */
    public static function peticionCurl(
        string $url,
        array $payload,
        array $headers,
        string $etiqueta,
        int $timeout = 0,
        ?int &$httpCodeOut = null,
        ?float &$retryAfterOut = null,
        ?string &$curlErrorOut = null
    ): ?string {
        $resultado = self::peticionCurlTipada($url, $payload, $headers, $etiqueta, $timeout);

        $httpCodeOut = $resultado['httpCode'];
        $retryAfterOut = $resultado['retryAfter'];
        $curlErrorOut = $resultado['error'];

        return $resultado['body'];
    }

    /**
     * C356: POST JSON tipada — retorna ResultadoGroq en vez de string|null.
     * Permite a los callers detectar rate limit (429) para encolar en cola IA.
     *
     * @return array{ok: bool, body: string|null, esRateLimit: bool, retryAfter: float, httpCode: int, error: string|null}
     */
    public static function peticionCurlTipada(
        string $url,
        array $payload,
        array $headers,
        string $etiqueta,
        int $timeout = 0
    ): array {
        $json = \json_encode($payload);
        $ch = null;

        try {
            $ch = \curl_init($url);

            if ($ch === false) {
                KamplesLogger::error("GroqHttpClient: curl_init() falló ({$etiqueta})");
                return self::resultadoError('curl_init failed');
            }

            /* Capturar headers de respuesta para x-ratelimit-* */
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
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $json,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
                CURLOPT_TIMEOUT        => $timeout > 0 ? $timeout : self::TIMEOUT,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_HEADERFUNCTION => $headerCallback,
            ]);

            $respuesta = \curl_exec($ch);
            $httpCode  = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = \curl_error($ch);
            \curl_close($ch);
            $ch = null;

            if ($curlError) {
                KamplesLogger::error("GroqHttpClient: cURL error ({$etiqueta})", ['error' => $curlError]);
                return self::resultadoError($curlError);
            }

            /* Actualizar cuota desde headers x-ratelimit-* (presentes en toda respuesta, no solo 429) */
            if (!empty($headersCapturados)) {
                self::$ultimaCuota = [
                    'limitRequests' => (int) ($headersCapturados['x-ratelimit-limit-requests'] ?? 0),
                    'remainingRequests' => (int) ($headersCapturados['x-ratelimit-remaining-requests'] ?? 0),
                    'limitTokens' => (int) ($headersCapturados['x-ratelimit-limit-tokens'] ?? 0),
                    'remainingTokens' => (int) ($headersCapturados['x-ratelimit-remaining-tokens'] ?? 0),
                    'resetRequests' => $headersCapturados['x-ratelimit-reset-requests'] ?? '',
                    'resetTokens' => $headersCapturados['x-ratelimit-reset-tokens'] ?? '',
                ];
            }

            if ($httpCode !== 200) {
                $respuestaTexto = \is_string($respuesta) ? $respuesta : '';
                $retryAfter = self::extraerRetryAfter($respuestaTexto);
                $esRateLimit = ($httpCode === self::HTTP_RATE_LIMIT);

                /* C356: Propagar rate limit al estado estatico del request */
                if ($esRateLimit) {
                    self::$rateLimitDetectado = true;
                    self::$retryAfterSegundos = \max(self::$retryAfterSegundos, $retryAfter);
                }

                $nivelLog = $esRateLimit ? 'warning' : 'error';
                KamplesLogger::$nivelLog("GroqHttpClient: HTTP {$httpCode} ({$etiqueta})", [
                    'respuesta' => \mb_substr($respuestaTexto, 0, 1000),
                    'retryAfterSugerido' => $retryAfter,
                    'esRateLimit' => $esRateLimit,
                    'url' => \preg_replace('/key=[^&]+/', 'key=***', $url),
                ]);

                return self::resultadoError(
                    "HTTP {$httpCode}: " . \mb_substr($respuestaTexto, 0, 500),
                    $httpCode,
                    $esRateLimit,
                    $retryAfter
                );
            }

            return self::resultadoOk($respuesta, $httpCode);
        } catch (\Throwable $e) {
            KamplesLogger::error("GroqHttpClient: excepción inesperada ({$etiqueta})", ['error' => $e->getMessage()]);
            return self::resultadoError($e->getMessage());
        } finally {
            if ($ch !== null) {
                \curl_close($ch);
            }
        }
    }

    /**
     * POST multipart/form-data para endpoints de audio (Groq Whisper STT).
     * Mantiene firma original por compatibilidad.
     */
    public static function peticionCurlMultipart(
        string $url,
        array $campos,
        string $campoArchivo,
        \CURLFile $archivo,
        array $headers,
        string $etiqueta,
        int $timeout = 0
    ): ?string {
        $resultado = self::peticionCurlMultipartTipada($url, $campos, $campoArchivo, $archivo, $headers, $etiqueta, $timeout);
        return $resultado['body'];
    }

    /**
     * C356: POST multipart tipada — retorna ResultadoGroq.
     * Usada por ServicioIA para Whisper STT con deteccion de rate limit.
     *
     * @return array{ok: bool, body: string|null, esRateLimit: bool, retryAfter: float, httpCode: int, error: string|null}
     */
    public static function peticionCurlMultipartTipada(
        string $url,
        array $campos,
        string $campoArchivo,
        \CURLFile $archivo,
        array $headers,
        string $etiqueta,
        int $timeout = 0
    ): array {
        $payload = $campos;
        $payload[$campoArchivo] = $archivo;
        $ch = null;

        try {
            $ch = \curl_init($url);

            if ($ch === false) {
                KamplesLogger::error("GroqHttpClient: curl_init() falló multipart ({$etiqueta})");
                return self::resultadoError('curl_init failed');
            }

            \curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => self::CONNECT_TIMEOUT,
                CURLOPT_TIMEOUT        => $timeout > 0 ? $timeout : self::TIMEOUT,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
            ]);

            $respuesta = \curl_exec($ch);
            $httpCode  = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = \curl_error($ch);
            \curl_close($ch);
            $ch = null;

            if ($curlError) {
                KamplesLogger::error("GroqHttpClient: cURL error ({$etiqueta})", ['error' => $curlError]);
                return self::resultadoError($curlError);
            }

            if ($httpCode !== 200) {
                $respuestaTexto = \is_string($respuesta) ? $respuesta : '';
                $retryAfter = self::extraerRetryAfter($respuestaTexto);
                $esRateLimit = ($httpCode === self::HTTP_RATE_LIMIT);

                /* C356: Propagar rate limit al estado estatico del request */
                if ($esRateLimit) {
                    self::$rateLimitDetectado = true;
                    self::$retryAfterSegundos = \max(self::$retryAfterSegundos, $retryAfter);
                }

                $nivelLog = $esRateLimit ? 'warning' : 'error';
                KamplesLogger::$nivelLog("GroqHttpClient: HTTP {$httpCode} multipart ({$etiqueta})", [
                    'respuesta' => \mb_substr($respuestaTexto, 0, 1000),
                    'retryAfter' => $retryAfter,
                    'esRateLimit' => $esRateLimit,
                    'url' => $url,
                ]);

                return self::resultadoError(
                    "HTTP {$httpCode}: " . \mb_substr($respuestaTexto, 0, 500),
                    $httpCode,
                    $esRateLimit,
                    $retryAfter
                );
            }

            return self::resultadoOk(\is_string($respuesta) ? $respuesta : '', $httpCode);
        } catch (\Throwable $e) {
            KamplesLogger::error("GroqHttpClient: excepción inesperada multipart ({$etiqueta})", ['error' => $e->getMessage()]);
            return self::resultadoError($e->getMessage());
        } finally {
            if ($ch !== null) {
                \curl_close($ch);
            }
        }
    }

    /**
     * Extrae segundos de retry desde mensaje de error API Groq.
     * Ej: "Please retry in 23.71s."
     */
    public static function extraerRetryAfter(string $respuestaRaw): float
    {
        if ($respuestaRaw === '') {
            return 0.0;
        }

        if (\preg_match('/Please retry in\s*([0-9]+(?:\.[0-9]+)?)s\.?/i', $respuestaRaw, $match)) {
            return (float) $match[1];
        }

        return 0.0;
    }

    /**
     * Obtiene API key de Groq desde variables de entorno.
     * Soporta $_ENV, getenv() y constante PHP (wp-config / .env loader).
     *
     * [193A-43] Cuando se pide 'GROQ_API', rota entre las 3 keys disponibles
     * (GROQ_API, GROQ_API_2, GROQ_API_3) para distribuir rate limits.
     * Misma key durante todo el proceso PHP (cache estático), rota al final
     * del cron via rotarApiKey().
     *
     * @param string $nombre Nombre de la variable (default: GROQ_API)
     * @return string|null
     */
    public static function obtenerApiKey(string $nombre = 'GROQ_API'): ?string
    {
        /* [193A-43] Rotación entre múltiples keys Groq */
        if ($nombre === 'GROQ_API') {
            return self::obtenerApiKeyRotada();
        }

        return self::resolverEnvVar($nombre);
    }

    /**
     * [193A-43] Rota entre todas las keys Groq disponibles.
     * Cache estático dentro del mismo proceso PHP: todas las llamadas
     * en una ejecución de cron usan la misma key.
     */
    private static ?string $keyRotadaCache = null;

    private static function obtenerApiKeyRotada(): ?string
    {
        if (self::$keyRotadaCache !== null) {
            return self::$keyRotadaCache;
        }

        $keys = self::obtenerTodasLasKeysGroq();
        if (empty($keys)) {
            return null;
        }

        $indice = (int) get_transient('kmpl_groq_key_index');
        $keySeleccionada = $keys[$indice % \count($keys)];
        self::$keyRotadaCache = $keySeleccionada;

        KamplesLogger::info('GroqHttpClient: Key rotada seleccionada', [
            'indice' => $indice % \count($keys),
            'totalKeys' => \count($keys),
            'preview' => \substr($keySeleccionada, 0, 12) . '***',
        ]);

        return $keySeleccionada;
    }

    /**
     * [193A-43] Avanza el índice de rotación para la próxima ejecución.
     * Llamar al final de cada ciclo de cron o tras completar moderación inline.
     */
    public static function rotarApiKey(): void
    {
        $keys = self::obtenerTodasLasKeysGroq();
        if (\count($keys) <= 1) {
            return;
        }

        $indice = (int) get_transient('kmpl_groq_key_index');
        $nuevoIndice = ($indice + 1) % \count($keys);
        set_transient('kmpl_groq_key_index', $nuevoIndice, DAY_IN_SECONDS);
        self::$keyRotadaCache = null;

        KamplesLogger::info('GroqHttpClient: Key rotada para próxima ejecución', [
            'anterior' => $indice,
            'nuevo' => $nuevoIndice,
        ]);
    }

    /**
     * [193A-43] Obtiene todas las keys Groq válidas de las env vars.
     * Usa GROQ_API_1, GROQ_API_2, GROQ_API_3 (cargadas desde .env) para
     * evitar conflicto con la var Docker GROQ_API (createImmutable no overridea).
     * Si no hay keys numeradas, cae en GROQ_API legacy como último recurso.
     * @return string[]
     */
    private static function obtenerTodasLasKeysGroq(): array
    {
        $nombres = ['GROQ_API_1', 'GROQ_API_2', 'GROQ_API_3'];
        $keys = [];

        foreach ($nombres as $nombre) {
            $key = self::resolverEnvVar($nombre);
            if ($key !== null && \str_starts_with($key, 'gsk_')) {
                $keys[] = $key;
            }
        }

        /* Fallback: si no hay keys numeradas, usar GROQ_API legacy (Docker env var) */
        if (empty($keys)) {
            $legacy = self::resolverEnvVar('GROQ_API');
            if ($legacy !== null && \str_starts_with($legacy, 'gsk_')) {
                $keys[] = $legacy;
            }
        }

        return $keys;
    }

    /**
     * Resuelve una variable de entorno por nombre.
     * Busca en $_ENV, getenv() y constantes PHP (wp-config).
     */
    private static function resolverEnvVar(string $nombre): ?string
    {
        $key = $_ENV[$nombre] ?? getenv($nombre) ?: null;

        if (!$key || $key === '') {
            if (\defined($nombre)) {
                $key = \constant($nombre);
            }
        }

        if (!$key || $key === '') {
            return null;
        }

        return $key;
    }
}
