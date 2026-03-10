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
use App\Kamples\Auth\UsuarioHelper;

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
     * GET /artistas/{slug} — Detalle artista con canciones.
     */
    public static function detalleArtista(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $slug = (string) $request->get_param('slug');
            $artista = ArtistasMusicalesRepository::buscarPorSlug($slug);

            if (!$artista) {
                return new \WP_REST_Response(['ok' => false, 'error' => 'Artista no encontrado'], 404);
            }

            $canciones = CancionesArtistasRepository::cancionesDeArtista((int) $artista['id']);

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => [
                    'artista'   => NormalizadorCancion::artista($artista),
                    'canciones' => \array_map([NormalizadorCancion::class, 'cancion'], $canciones),
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

            return new \WP_REST_Response([
                'ok'   => true,
                'data' => NormalizadorCancion::relacion($relacion),
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
}

