<?php

/**
 * CancionesController — API REST para Sample Discovery.
 *
 * GET  /canciones                      — Listar canciones recientes
 * GET  /canciones/buscar               — Buscar canciones por texto
 * GET  /canciones/top                  — Canciones más sampleadas
 * GET  /canciones/{slug}               — Detalle canción con relaciones
 * GET  /artistas/{slug}                — Detalle artista con canciones
 * GET  /artistas/top                   — Top artistas por canciones
 * GET  /sample-discovery/estadisticas  — Estadísticas generales
 * GET  /sample-discovery/relacion/{id} — Relación vinculada a un sample de Kamples
 *
 * Todos los endpoints son públicos (información cultural abierta).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\ArtistasMusicalesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesArtistasRepository;
use App\Kamples\Database\Repositories\LikesRepository;
use App\Kamples\Api\Helpers\NormalizadorCancion;
use App\Config\Schema\_generated\LikesEnums;
use App\Kamples\Api\Helpers\UsuarioHelper;

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

        \register_rest_route($namespace, '/sample-discovery/estadisticas', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'estadisticas'],
            'permission_callback' => '__return_true',
        ]);

        \register_rest_route($namespace, '/sample-discovery/relacion/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'relacionPorSampleId'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
            ],
        ]);

        \register_rest_route($namespace, '/canciones/(?P<slug>[a-zA-Z0-9_-]+)/cadena', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'cadena'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug'        => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'profundidad' => ['type' => 'integer', 'default' => 5, 'minimum' => 1, 'maximum' => 10],
            ],
        ]);

        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'detalleRelacion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
            ],
        ]);

        /* Samples publicados vinculados a una relación de sampleo */
        \register_rest_route($namespace, '/relaciones/(?P<id>\d+)/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'samplesDeRelacion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer', 'validate_callback' => function($v) { return is_numeric($v) && (int)$v > 0; }],
            ],
        ]);

        /* Samples publicados extraídos de una canción concreta */
        \register_rest_route($namespace, '/canciones/(?P<slug>[a-zA-Z0-9_-]+)/samples', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'samplesDeCancion'],
            'permission_callback' => '__return_true',
            'args'                => [
                'slug'  => ['required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field'],
                'limit' => ['type' => 'integer', 'default' => 20, 'minimum' => 1, 'maximum' => 50],
            ],
        ]);
    }

    /**
     * GET /canciones — Canciones recientes con artista.
     */
    public static function listar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $perPage = (int) $request->get_param('per_page');
            $canciones = CancionesRepository::buscarRecientes($perPage);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => \array_map([NormalizadorCancion::class, 'cancion'], $canciones),
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
     * GET /canciones/{slug} — Detalle canción con relaciones sample.
     *
     * Retorna: canción, artistas (principal+featuring+producers),
     * samples que usa (samplesDe) y dónde fue sampleada (sampleadaEn).
     */
    public static function detalle(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = (string) $request->get_param('slug');
            $cancion = CancionesRepository::buscarPorSlug($slug);

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
                fn(array $r) => self::_relacionBilateralAUnilateral($r, 'destino'),
                $sampleadoPorRaw
            );

            /* Relaciones donde canciones del artista son DESTINO (el artista sampleó)
             * Se normaliza mostrando la canción FUENTE (a quién sampleó). */
            $sampleaARaw = RelacionesSampleRepository::relacionesDeCancionesDestino($cancionIds);
            $sampleaA = \array_map(
                fn(array $r) => self::_relacionBilateralAUnilateral($r, 'fuente'),
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

    /**
     * GET /sample-discovery/estadisticas — Stats generales del módulo.
     */
    public static function estadisticas(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $porTipo = RelacionesSampleRepository::estadisticasPorTipo();

            /* Normalizar: SQL retorna 'tipo', frontend espera 'tipoRelacion' */
            $relacionesPorTipo = \array_map([NormalizadorCancion::class, 'estadisticaTipo'], $porTipo);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'relacionesPorTipo' => $relacionesPorTipo,
                ],
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::estadisticas] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /sample-discovery/relacion/{id} — Relación vinculada a un sample de Kamples.
     *
     * Retorna info de canción fuente y destino si el sample tiene relación.
     */
    public static function relacionPorSampleId(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $sampleId = (int) $request->get_param('id');
            $relacion = RelacionesSampleRepository::porSampleId($sampleId);

            if (!$relacion) {
                return new \WP_REST_Response(['ok' => true, 'data' => null]);
            }

            $data = NormalizadorCancion::relacionCompleta($relacion);

            /* Determinar de qué lado se extrajo este sample */
            $esFuente  = ((int) ($relacion['sample_fuente_id'] ?? 0)) === $sampleId;
            $esDestino = ((int) ($relacion['sample_destino_id'] ?? 0)) === $sampleId;
            $data['ladoExtraccion'] = $esFuente ? 'fuente' : ($esDestino ? 'destino' : null);

            /* Enriquecer con relaciones adicionales de ambas canciones */
            $destinoId = (int) $relacion['cancion_destino_id'];
            $fuenteId  = (int) $relacion['cancion_fuente_id'];
            $relacionId = (int) $relacion['id'];

            $filtrar = fn(array $rels) => array_values(array_filter(
                $rels,
                fn($r) => (int) $r['id'] !== $relacionId
            ));

            $data['destinoSamplesDe']   = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::samplesDe($destinoId, 20)));
            $data['destinoSampleadaEn'] = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::sampleadaEn($destinoId, 20)));
            $data['fuenteSamplesDe']    = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::samplesDe($fuenteId, 20)));
            $data['fuenteSampleadaEn']  = array_map([NormalizadorCancion::class, 'relacion'], $filtrar(RelacionesSampleRepository::sampleadaEn($fuenteId, 20)));

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::relacionPorSampleId] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/{slug}/cadena — Cadena de samples (A sampleó B sampleó C...).
     *
     * Explora relaciones recursivas hasta profundidad configurada.
     */
    public static function cadena(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = (string) $request->get_param('slug');
            $profundidad = (int) $request->get_param('profundidad');
            $cancion = CancionesRepository::buscarPorSlug($slug);

            if (!$cancion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Canción no encontrada'], 404);
            }

            $cadena = RelacionesSampleRepository::cadena((int) $cancion['id'], $profundidad);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'cancion_raiz' => NormalizadorCancion::cancion($cancion),
                    'cadena'       => $cadena,
                ],
            ]);
        } catch (\Throwable $e) {
            \App\Kamples\KamplesLogger::error('[CancionesController::cadena] ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /relaciones/{id} — Detalle completo de una relación de sampleo.
     *
     * Retorna relación + info completa de canción fuente y destino (títulos,
     * artistas, imágenes, youtubeIds) + relaciones adicionales de ambas
     * canciones (otros samples, covers, remixes) para contexto enriquecido.
     */
    public static function detalleRelacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $id = (int) $request->get_param('id');
            $relacion = RelacionesSampleRepository::porRelacionId($id);

            if (!$relacion) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Relación no encontrada'], 404);
            }

            $destinoId = (int) $relacion['cancion_destino_id'];
            $fuenteId  = (int) $relacion['cancion_fuente_id'];

            /* Related songs: otras relaciones de cada canción (excluye la actual) */
            $destinoSamplesDe  = RelacionesSampleRepository::samplesDe($destinoId, 20);
            $destinoSampleadaEn = RelacionesSampleRepository::sampleadaEn($destinoId, 20);
            $fuenteSamplesDe   = RelacionesSampleRepository::samplesDe($fuenteId, 20);
            $fuenteSampleadaEn  = RelacionesSampleRepository::sampleadaEn($fuenteId, 20);

            /* Excluir la relación actual de los resultados */
            $filtrar = fn(array $rels) => array_values(array_filter(
                $rels,
                fn($r) => (int) $r['id'] !== $id
            ));

            $data = NormalizadorCancion::relacionCompleta($relacion);
            $data['destinoSamplesDe']   = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($destinoSamplesDe));
            $data['destinoSampleadaEn'] = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($destinoSampleadaEn));
            $data['fuenteSamplesDe']    = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($fuenteSamplesDe));
            $data['fuenteSampleadaEn']  = array_map([NormalizadorCancion::class, 'relacion'], $filtrar($fuenteSampleadaEn));

            /* Estado de like del usuario actual (si está autenticado) */
            $data['liked']    = false;
            $data['reaccion'] = null;

            $userId = UsuarioHelper::obtenerIdPg();
            if ($userId) {
                $reaccionUsuario = LikesRepository::obtenerReaccionUsuario($userId, LikesEnums::TIPO_RELACION, $id);
                if ($reaccionUsuario) {
                    $data['liked']    = true;
                    $data['reaccion'] = $reaccionUsuario;
                }
            }

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::detalleRelacion] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /relaciones/{id}/samples — Samples publicados de una relación.
     *
     * Retorna los samples activos vinculados via sample_fuente_id/sample_destino_id.
     */
    public static function samplesDeRelacion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $relacionId = (int) $request->get_param('id');
            $userId     = UsuarioHelper::obtenerIdPg();
            $filas      = \App\Kamples\Database\Repositories\SamplesRepository::buscarPorRelacionId($relacionId, $userId);
            $normalizados = \App\Kamples\Api\Helpers\NormalizadorSample::normalizarLista($filas);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $normalizados,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::samplesDeRelacion] ' . $e->getMessage());
            return new \WP_REST_Response(['ok' => false, 'error' => 'Error interno'], 500);
        }
    }

    /**
     * GET /canciones/{slug}/samples — Samples extraídos de una canción.
     *
     * Busca por cancion_origen_id del sample, identificando la canción via slug.
     */
    public static function samplesDeCancion(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug   = (string) $request->get_param('slug');
            $limit  = (int) $request->get_param('limit');
            $userId = UsuarioHelper::obtenerIdPg();

            $cancion = CancionesRepository::buscarPorSlug($slug);
            if (!$cancion) {
                return new \WP_REST_Response(['ok' => true, 'data' => []]);
            }

            $filas        = \App\Kamples\Database\Repositories\SamplesRepository::buscarPorCancionOrigenId((int) $cancion['id'], $userId, $limit);
            $normalizados = \App\Kamples\Api\Helpers\NormalizadorSample::normalizarLista($filas);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => $normalizados,
            ]);
        } catch (\Throwable $e) {
            \error_log('[CancionesController::samplesDeCancion] ' . $e->getMessage());
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

