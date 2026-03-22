<?php

/**
 * ArtistasController — API REST para Artistas Musicales.
 *
 * GET  /artistas/top           — Top artistas por cantidad de canciones
 * GET  /artistas/{slug}        — Detalle artista con canciones y relaciones
 *
 * [223A-4] Extraído de CancionesController para cumplir SRP y limite de lineas.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\ArtistasMusicalesRepository;
use App\Kamples\Database\Repositories\RelacionesSampleRepository;
use App\Kamples\Database\Repositories\CancionesArtistasRepository;
use App\Kamples\Api\Helpers\NormalizadorCancion;
use App\Config\Schema\_generated\ColaExtraccionSamplesEnums;

class ArtistasController
{
    public static function registrarRutas(string $namespace): void
    {
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
     * GET /artistas/{slug} — Detalle de artista con canciones y relaciones.
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
             * (quién sampleó al artista) en el formato cancion_titulo/artista_nombre. */
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
            \error_log('[ArtistasController::detalleArtista] ' . $e->getMessage());
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
            \error_log('[ArtistasController::topArtistas] ' . $e->getMessage());
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
