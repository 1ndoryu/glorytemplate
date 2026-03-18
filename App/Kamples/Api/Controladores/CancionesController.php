<?php

/**
 * CancionesController — API REST para Canciones y Artistas.
 *
 * GET  /canciones                      — Listar canciones recientes
 * GET  /canciones/buscar               — Buscar canciones por texto
 * GET  /canciones/top                  — Canciones más sampleadas
 * GET  /canciones/feed                 — Feed paginado con ordenamiento
 * GET  /canciones/{slug}               — Detalle canción con relaciones
 * GET  /artistas/{slug}                — Detalle artista con canciones
 * GET  /artistas/top                   — Top artistas por canciones
 *
 * Endpoints de relaciones movidos a RelacionesController (SOLID split).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\ArtistasMusicalesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesArtistasRepository;
use App\Kamples\Api\Helpers\NormalizadorCancion;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;
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

        \register_rest_route($namespace, '/canciones/(?P<slug>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalle'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug' => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
            ],
        ]);

        \register_rest_route($namespace, '/artistas/top', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'topArtistas'],
            'permission_callback' => '__return_true',
            'args'                => [
                'limit' => ['type' => 'integer', 'default' => 50, 'minimum' => 1, 'maximum' => 100],
            ],
        ]);

        \register_rest_route($namespace, '/artistas/(?P<slug>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalleArtista'],
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
     * GET /artistas/{slug} — Detalle artista con canciones, relaciones y estadísticas.
     */
    public static function detalleArtista(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = (string) $request->get_param('slug');
            $artista = ArtistasMusicalesRepository::buscarPorSlug($slug);

            if (!$artista) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Artista no encontrado'], 404);
            }

            $artistaId = (int) $artista['id'];
            $canciones = CancionesArtistasRepository::cancionesDeArtista($artistaId);
            $cancionIds = \array_map(fn($c) => (int) $c['id'], $canciones);

            /* Relaciones donde canciones del artista son FUENTE (otros lo samplearon)
             * Se normaliza para que TablaRelaciones reciba los campos de la canción DESTINO
             * (quién sampleó al artista) en el formato canсion_titulo/artista_nombre. */
            $sampleadoPorRaw = RelacionesSampleRepository::relacionesDeCancionesFuente($cancionIds);
            $sampleadoPor = \array_map(
                fn(array $r) => self::_relacionBilateralAUnilateral($r, ColaExtraccionSamplesEnums::LADO_DESTINO),
                $sampleadoPorRaw
            );

            /* Relaciones donde canciones del artista son DESTINO (el artista sampleó)
             * Se normaliza mostrando la canción FUENTE (a quién sampleó). */
            $sampleaARaw = RelacionesSampleRepository::relacionesDeCancionesDestino($cancionIds);
            $sampleaA = \array_map(
                fn(array $r) => self::_relacionBilateralAUnilateral($r, ColaExtraccionSamplesEnums::LADO_FUENTE),
                $sampleaARaw
            );

            /* Géneros predominantes (top 5 por frecuencia) */
            $generos = CancionesRepository::generosPorArtista($artistaId, 5);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'artista'       => NormalizadorCancion::artista($artista),
                    'canciones'     => \array_map([NormalizadorCancion::class, 'cancion'], $canciones),
                    'sampleadoPor'  => \array_map([NormalizadorCancion::class, 'relacion'], $sampleadoPor),
                    'sampleaA'      => \array_map([NormalizadorCancion::class, 'relacion'], $sampleaA),
                    'estadisticas'  => [
                        'totalSampleadoPor' => \count($sampleadoPor),
                        'totalSampleaA'     => \count($sampleaA),
                        'generos'           => $generos,
                    ],
                ],
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::detalleArtista] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/secciones — Secciones estilo Spotify (QK18/QK22).
     * Retorna multiples secciones de canciones agrupadas con dedup entre ellas.
     */
    public static function secciones(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $porSeccion = (int) $request->get_param('por_seccion');
            $userId = UsuarioHelper::obtenerIdPg();

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

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $secciones,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::secciones] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /artistas/top — Top artistas por cantidad de canciones.
     */
    public static function topArtistas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $limit = (int) $request->get_param('limit');
            $artistas = ArtistasMusicalesRepository::topPorCanciones($limit);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => \array_map([NormalizadorCancion::class, 'artista'], $artistas),
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::topArtistas] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /*
     * Transforma una fila bilateral (fuente_/destino_) al formato unilateral
     * que espera NormalizadorCancion::relacion() (cancion_titulo, artista_nombre).
     * $lado indica qué lado mostrar: 'destino' o 'fuente'.
     */
    private static function _relacionBilateralAUnilateral(array $row, string $lado): array
    {
        $row['cancion_titulo']     = $row["{$lado}_titulo"] ?? null;
        $row['cancion_slug']       = $row["{$lado}_slug"] ?? null;
        $row['cancion_anio']       = $row["{$lado}_anio"] ?? null;
        $row['cancion_imagen_url'] = $row["{$lado}_imagen"] ?? null;
        $row['artista_nombre']     = $row["{$lado}_artista"] ?? null;
        $row['artista_slug']       = $row["{$lado}_artista_slug"] ?? null;

        return $row;
    }
}

