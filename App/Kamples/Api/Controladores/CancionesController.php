<?php

/**
 * CancionesController — API REST para Canciones.
 *
 * GET  /canciones                      — Listar canciones recientes
 * GET  /canciones/buscar               — Buscar canciones por texto
 * GET  /canciones/top                  — Canciones más sampleadas
 * GET  /canciones/feed                 — Feed paginado con ordenamiento
 * GET  /canciones/secciones            — Secciones estilo Spotify
 * GET  /canciones/aleatorio            — Canción aleatoria con detalle completo
 * GET  /canciones/{slug}               — Detalle canción con relaciones
 *
 * Artistas movidos a ArtistasController [223A-4].
 * Endpoints de relaciones movidos a RelacionesController (SOLID split).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesArtistasRepository;
use App\Kamples\Api\Helpers\NormalizadorCancion;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Kamples\KamplesLogger;

class CancionesController
{
    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/canciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'listar'],
            'permission_callback' => '__return_true',
            'args'                => [
                'page'     => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
                'per_page' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        \register_rest_route($namespace, '/canciones/buscar', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'buscar'],
            'permission_callback' => '__return_true',
            'args'                => [
                'q'        => ['type' => 'string', 'required' => true, 'sanitize_callback' => 'sanitize_text_field'],
                'per_page' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        \register_rest_route($namespace, '/canciones/top', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'topSampleadas'],
            'permission_callback' => '__return_true',
            'args'                => [
                'limit' => ['type' => 'integer', 'default' => 50, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        /* C812: Feed paginado con ordenamiento inteligente/top/hot */
        \register_rest_route($namespace, '/canciones/feed', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'feed'],
            'permission_callback' => '__return_true',
            'args'                => [
                'orden'    => [
                    'type'              => 'string',
                    'default'           => 'inteligente',
                    'sanitize_callback' => 'sanitize_text_field',
                    'validate_callback' => static fn($v) => \in_array($v, ['inteligente', 'top_sampleados', 'hot'], true),
                ],
                'page'     => ['type' => 'integer', 'default' => 1, 'minimum' => 1],
                'per_page' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50],
            ],
        ]);

        /* QK18/QK22: Secciones estilo Spotify — multiples secciones en un request con dedup */
        \register_rest_route($namespace, '/canciones/secciones', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'secciones'],
            'permission_callback' => '__return_true',
            'args'                => [
                'por_seccion' => ['type' => 'integer', 'default' => 15, 'minimum' => 5, 'maximum' => 30],
            ],
        ]);

        /* [223A-4] Canción aleatoria con detalle completo para modal descubrimiento */
        \register_rest_route($namespace, '/canciones/aleatorio', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'aleatorio'],
            'permission_callback' => '__return_true',
        ]);

        \register_rest_route($namespace, '/canciones/(?P<slug>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalle'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

    }

    /**
     * GET /canciones — Canciones recientes con artista.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $pagina  = (int) $request->get_param('page');
            $perPage = (int) $request->get_param('per_page');
            $offset  = ($pagina - 1) * $perPage;

            $canciones = CancionesRepository::buscarTodos($perPage, $offset);
            $total     = CancionesRepository::contar();

            return new \WP_REST_Response([
                'ok'    => true,
                'data'  => \array_map([NormalizadorCancion::class, 'cancion'], $canciones),
                'total' => $total,
                'page'  => $pagina,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::listar] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/buscar?q=texto — Búsqueda fulltext.
     */
    public static function buscar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $query = (string) $request->get_param('q');
            $perPage = (int) $request->get_param('per_page');

            if (\strlen($query) < 2) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Búsqueda mínimo 2 caracteres'], 400);
            }

            $resultados = CancionesRepository::buscarTexto($query, $perPage);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => \array_map([NormalizadorCancion::class, 'cancion'], $resultados),
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::buscar] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/top — Canciones más sampleadas.
     */
    public static function topSampleadas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $limit = (int) $request->get_param('limit');
            $canciones = CancionesRepository::masSampleadas($limit);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => \array_map([NormalizadorCancion::class, 'cancion'], $canciones),
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::topSampleadas] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/feed — Feed paginado con 3 modos de ordenamiento (C812).
     */
    public static function feed(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $orden   = (string) $request->get_param('orden');
            $pagina  = (int) $request->get_param('page');
            $porPag  = (int) $request->get_param('per_page');

            /* Liked status per-user: endpoint publico pero si hay sesion, se incluye */
            $userId = UsuarioHelper::obtenerIdPg();

            $resultado = CancionesRepository::feed($orden, $pagina, $porPag, $userId);

            return new \WP_REST_Response([
                'ok'    => true,
                'data'  => \array_map([NormalizadorCancion::class, 'cancion'], $resultado['items']),
                'total' => $resultado['total'],
                'page'  => $pagina,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::feed] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /* [223A-4] GET /canciones/aleatorio — Canción aleatoria con detalle para modal descubrimiento.
     * Selecciona del top 2000 canciones (por total_sampleada + total_samplea) una al azar. */
    public static function aleatorio(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $userId  = UsuarioHelper::obtenerIdPg();
            $cancion = CancionesRepository::aleatorio($userId);

            if (!$cancion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'No hay canciones'], 404);
            }

            $cancionId = (int) $cancion['id'];
            $artistas    = CancionesArtistasRepository::artistasDeCancion($cancionId);
            $samplesDe   = RelacionesSampleRepository::samplesDe($cancionId);
            $sampleadaEn = RelacionesSampleRepository::sampleadaEn($cancionId);

            $normSamplesDe   = \array_map([NormalizadorCancion::class, 'relacion'], $samplesDe);
            $normSampleadaEn = \array_map([NormalizadorCancion::class, 'relacion'], $sampleadaEn);

            $dedup = static fn(array $rows): array =>
                \array_values(\array_intersect_key($rows, \array_unique(\array_column($rows, 'id'))));

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'cancion'     => NormalizadorCancion::cancion($cancion),
                    'artistas'    => \array_map([NormalizadorCancion::class, 'artistaConRol'], $artistas),
                    'samplesDe'   => $dedup($normSamplesDe),
                    'sampleadaEn' => $dedup($normSampleadaEn),
                ],
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::aleatorio] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/{slug} — Detalle canción con relaciones sample.
     *
     * [183A-58] Usa buscarPorSlugConUsuario para incluir reaccion_usuario (liked).
     * Retorna: canción, artistas (principal+featuring+producers),
     * samples que usa (samplesDe) y dónde fue sampleada (sampleadaEn).
     */
    public static function detalle(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = (string) $request->get_param('slug');
            $userId = UsuarioHelper::obtenerIdPg();
            $cancion = CancionesRepository::buscarPorSlugConUsuario($slug, $userId);

            if (!$cancion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Canción no encontrada'], 404);
            }

            $cancionId = (int) $cancion['id'];

            $artistas    = CancionesArtistasRepository::artistasDeCancion($cancionId);
            $samplesDe   = RelacionesSampleRepository::samplesDe($cancionId);
            $sampleadaEn = RelacionesSampleRepository::sampleadaEn($cancionId);

            $normSamplesDe   = \array_map([NormalizadorCancion::class, 'relacion'], $samplesDe);
            $normSampleadaEn = \array_map([NormalizadorCancion::class, 'relacion'], $sampleadaEn);

            /* Dedup defensivo por id: evita React key conflicts si la BD tiene duplicados */
            $dedup = static fn(array $rows): array =>
                \array_values(\array_intersect_key($rows, \array_unique(\array_column($rows, 'id'))));

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'cancion'     => NormalizadorCancion::cancion($cancion),
                    'artistas'    => \array_map([NormalizadorCancion::class, 'artistaConRol'], $artistas),
                    'samplesDe'   => $dedup($normSamplesDe),
                    'sampleadaEn' => $dedup($normSampleadaEn),
                ],
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::detalle] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/secciones — Secciones estilo Spotify (QK18/QK22).
     * Retorna multiples secciones de canciones agrupadas con dedup entre ellas.
     * [183A-31] Cache: 30min anon / 10min auth para evitar 8+ queries en serie por visita.
     */
    public static function secciones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $porSeccion = (int) $request->get_param('por_seccion');
            $userId = UsuarioHelper::obtenerIdPg();

            /* [183A-31] Cache por usuario (personalizado) o anonimo (compartido).
             * [183A-89] TTLs revisados: secciones cambian poco (nuevas canciones son raras),
             * no es relevante que esté actualizado siempre. El contenido de samples
             * en cada canción incluso se podría cachear 1 semana.
             * Auth: 1h (personalizado "Para Ti"), Anon: 24h (compartido, estático). */
            $claveCache = $userId
                ? "secciones_canciones_u{$userId}_ps{$porSeccion}"
                : "secciones_canciones_anon_ps{$porSeccion}";
            $ttl = $userId ? 3600 : 86400; /* 1h auth / 24h anon */

            $cached = \App\Kamples\Services\ServicioCache::obtener($claveCache);
            if ($cached !== false) {
                $decoded = \json_decode($cached, true);
                if (\json_last_error() === JSON_ERROR_NONE && \is_array($decoded)) {
                    return new \WP_REST_Response(['ok' => true, 'data' => $decoded]);
                }
                /* Cache corrupto — continuar sin cache y regenerar */
            }

            $seccionesRaw = CancionesRepository::secciones($porSeccion, $userId);

            $secciones = \array_map(static function (array $sec): array {
                $result = [
                    'tipo'   => $sec['tipo'],
                    'titulo' => $sec['titulo'],
                ];
                if (isset($sec['genero'])) {
                    $result['genero'] = $sec['genero'];
                }
                if (isset($sec['canciones'])) {
                    $result['canciones'] = \array_map([NormalizadorCancion::class, 'cancion'], $sec['canciones']);
                }
                if (isset($sec['artistas'])) {
                    $result['artistas'] = \array_map([NormalizadorCancion::class, 'artista'], $sec['artistas']);
                }
                return $result;
            }, $seccionesRaw);

            \App\Kamples\Services\ServicioCache::guardar($claveCache, \json_encode($secciones), $ttl);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $secciones,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::secciones] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

}

