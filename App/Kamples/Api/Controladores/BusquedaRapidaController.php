<?php

/**
 * BusquedaRapidaController — Endpoint para el dropdown de búsqueda rápida.
 *
 * GET  /busqueda/rapida?q=...  — Busca en canciones, samples, relaciones y usuarios.
 *
 * Retorna resultados agrupados por tipo, limitados para rendimiento
 * (max 5 por categoría). Endpoint público (no requiere auth).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\Repositories\CancionesRepository;
use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Api\Helpers\NormalizadorCancion;
use App\Kamples\Api\Helpers\NormalizadorSample;
use App\Kamples\Api\Helpers\UsuarioHelper;
use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\UsuariosExtEnums;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\ArtistasMusicalesCols;
use App\Config\Schema\_generated\RelacionesSampleCols;
use App\Helpers\UrlHelper;
use App\Kamples\Database\Repositories\BaseRepository;
use App\Kamples\KamplesLogger;

class BusquedaRapidaController
{
    private const LIMITE_POR_TIPO = 5;

    public static function registrarRutas(string $namespace): void
    {
        \register_rest_route($namespace, '/busqueda/rapida', [
            'methods'             => 'GET',
            'callback'            => [self::class, 'buscar'],
            'permission_callback' => '__return_true',
            'args'                => [
                'q' => [
                    'type'              => 'string',
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * GET /busqueda/rapida?q=texto
     *
     * Ejecuta búsquedas en paralelo conceptual (secuencial en PHP,
     * pero cada query es ligera con LIMIT 5).
     */
    public static function buscar(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
            $q = trim((string) $request->get_param('q'));

            if (mb_strlen($q) < 2) {
                return new \WP_REST_Response([
                    'canciones'  => [],
                    'samples'    => [],
                    'sampleos'   => [],
                    'usuarios'   => [],
                ], 200);
            }

            $limite = self::LIMITE_POR_TIPO;

            $canciones = self::buscarCanciones($q, $limite);
            $samples   = self::buscarSamples($q, $limite);
            $sampleos  = self::buscarSampleos($q, $limite);
            $usuarios  = self::buscarUsuarios($q, $limite);

            return new \WP_REST_Response([
                'canciones'  => $canciones,
                'samples'    => $samples,
                'sampleos'   => $sampleos,
                'usuarios'   => $usuarios,
            ], 200);
        } catch (\Throwable $e) {
            KamplesLogger::error('BusquedaRapida: error en búsqueda', [
                'query'   => $request->get_param('q') ?? '',
                'error'   => $e->getMessage(),
            ]);

            return new \WP_REST_Response([
                'message' => 'Error interno al buscar.',
            ], 500);
        }
    }

    /**
     * Canciones — fulltext search (titulo + artista + album).
     * Reutiliza CancionesRepository::buscarTexto que ya tiene to_tsvector.
     */
    private static function buscarCanciones(string $q, int $limite): array
    {
        $rows = CancionesRepository::buscarTexto($q, $limite);
        return array_map(function (array $row): array {
            $norm = NormalizadorCancion::cancion($row);
            /* Solo campos necesarios para el dropdown */
            return [
                'id'             => $norm['id'],
                'titulo'         => $norm['titulo'],
                'slug'           => $norm['slug'],
                'artistaNombre'  => $norm['artistaNombre'],
                'imagenUrl'      => $norm['imagenUrl'],
                'totalSampleada' => $norm['totalSampleada'],
            ];
        }, $rows);
    }

    /**
     * Samples — ILIKE en titulo con estado activo.
     * JOIN con usuarios_ext para mostrar info del creador.
     */
    private static function buscarSamples(string $q, int $limite): array
    {
        $ts = SamplesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        $rows = BaseRepository::consultar(
            "SELECT s." . SamplesCols::ID
            . ", s." . SamplesCols::TITULO
            . ", s." . SamplesCols::SLUG
            . ", s." . SamplesCols::IMAGEN_URL
            . ", s." . SamplesCols::TOTAL_LIKES
            . ", s." . SamplesCols::CREADOR_ID
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . ", u." . UsuariosExtCols::AVATAR_URL
            . ", u." . UsuariosExtCols::WP_USER_ID . " AS creador_wp_user_id"
            . " FROM {$ts} s"
            . " LEFT JOIN {$tu} u ON s." . SamplesCols::CREADOR_ID . " = u." . UsuariosExtCols::ID
            . " WHERE s." . SamplesCols::ESTADO . " = :estado"
            . " AND s." . SamplesCols::TITULO . " ILIKE :busqueda"
            . " ORDER BY s." . SamplesCols::TOTAL_LIKES . " DESC, s." . SamplesCols::ID . " DESC"
            . " LIMIT :limite",
            [
                'estado'   => SamplesEnums::ESTADO_ACTIVO,
                'busqueda' => '%' . $q . '%',
                'limite'   => $limite,
            ]
        );

        return array_map(function (array $row): array {
            return [
                'id'        => (int) $row[SamplesCols::ID],
                'titulo'    => $row[SamplesCols::TITULO] ?? '',
                'slug'      => $row[SamplesCols::SLUG] ?? '',
                'imagenUrl' => NormalizadorSample::rutaAUrl($row[SamplesCols::IMAGEN_URL] ?? ''),
                'creador'   => [
                    'username'      => $row[UsuariosExtCols::USERNAME] ?? '',
                    'nombreVisible' => $row[UsuariosExtCols::NOMBRE_VISIBLE] ?? $row[UsuariosExtCols::USERNAME] ?? '',
                    'avatarUrl'     => UsuarioHelper::resolverAvatarUrl(
                        $row[UsuariosExtCols::AVATAR_URL] ?? null,
                        isset($row['creador_wp_user_id']) ? (int) $row['creador_wp_user_id'] : null
                    ),
                ],
            ];
        }, $rows);
    }

    /**
     * Sampleos (relaciones) — busca relaciones donde fuente o destino coincida.
     * JOIN con canciones + artistas para titulo y artista de ambos lados.
     */
    private static function buscarSampleos(string $q, int $limite): array
    {
        $tr = RelacionesSampleCols::TABLA;
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        $rows = BaseRepository::consultar(
            "SELECT r." . RelacionesSampleCols::ID . " AS relacion_id"
            . ", cf." . CancionesCols::TITULO . " AS fuente_titulo"
            . ", cf." . CancionesCols::SLUG . " AS fuente_slug"
            . ", cf." . CancionesCols::IMAGEN_URL . " AS fuente_imagen"
            . ", af.nombre AS fuente_artista"
            . ", cd." . CancionesCols::TITULO . " AS destino_titulo"
            . ", cd." . CancionesCols::SLUG . " AS destino_slug"
            . ", cd." . CancionesCols::IMAGEN_URL . " AS destino_imagen"
            . ", ad.nombre AS destino_artista"
            . " FROM {$tr} r"
            . " JOIN {$tc} cf ON r." . RelacionesSampleCols::CANCION_FUENTE_ID . " = cf.id"
            . " JOIN {$tc} cd ON r." . RelacionesSampleCols::CANCION_DESTINO_ID . " = cd.id"
            . " JOIN {$ta} af ON cf." . CancionesCols::ARTISTA_ID . " = af.id"
            . " JOIN {$ta} ad ON cd." . CancionesCols::ARTISTA_ID . " = ad.id"
            . " WHERE cf." . CancionesCols::TITULO . " ILIKE :busqueda"
            . " OR cd." . CancionesCols::TITULO . " ILIKE :busqueda"
            . " OR af.nombre ILIKE :busqueda"
            . " OR ad.nombre ILIKE :busqueda"
            . " ORDER BY r." . RelacionesSampleCols::VOTOS_TOTAL . " DESC, r." . RelacionesSampleCols::ID . " DESC"
            . " LIMIT :limite",
            [
                'busqueda' => '%' . $q . '%',
                'limite'   => $limite,
            ]
        );

        return array_map(function (array $row): array {
            return [
                'id' => (int) $row['relacion_id'],
                'fuente' => [
                    'titulo'    => $row['fuente_titulo'] ?? '',
                    'slug'      => $row['fuente_slug'] ?? '',
                    'imagenUrl' => UrlHelper::normalizar($row['fuente_imagen'] ?? null),
                    'artista'   => $row['fuente_artista'] ?? '',
                ],
                'destino' => [
                    'titulo'    => $row['destino_titulo'] ?? '',
                    'slug'      => $row['destino_slug'] ?? '',
                    'imagenUrl' => UrlHelper::normalizar($row['destino_imagen'] ?? null),
                    'artista'   => $row['destino_artista'] ?? '',
                ],
            ];
        }, $rows);
    }

    /**
     * Usuarios — ILIKE en username y nombre_visible con estado activo.
     */
    private static function buscarUsuarios(string $q, int $limite): array
    {
        $tu = UsuariosExtCols::TABLA;

        $rows = BaseRepository::consultar(
            "SELECT " . UsuariosExtCols::ID
            . ", " . UsuariosExtCols::USERNAME
            . ", " . UsuariosExtCols::NOMBRE_VISIBLE
            . ", " . UsuariosExtCols::AVATAR_URL
            . ", " . UsuariosExtCols::VERIFICADO
            . ", " . UsuariosExtCols::WP_USER_ID
            . ", " . UsuariosExtCols::TOTAL_SEGUIDORES
            . " FROM {$tu}"
            . " WHERE " . UsuariosExtCols::ESTADO . " = :estado"
            . " AND (" . UsuariosExtCols::USERNAME . " ILIKE :busqueda"
            . " OR " . UsuariosExtCols::NOMBRE_VISIBLE . " ILIKE :busqueda)"
            . " ORDER BY " . UsuariosExtCols::TOTAL_SEGUIDORES . " DESC"
            . " LIMIT :limite",
            [
                'estado'   => UsuariosExtEnums::ESTADO_ACTIVO,
                'busqueda' => '%' . $q . '%',
                'limite'   => $limite,
            ]
        );

        return array_map(function (array $row): array {
            return [
                'id'              => (int) $row[UsuariosExtCols::ID],
                'username'        => $row[UsuariosExtCols::USERNAME] ?? '',
                'nombreVisible'   => $row[UsuariosExtCols::NOMBRE_VISIBLE] ?? $row[UsuariosExtCols::USERNAME] ?? '',
                'avatarUrl'       => UsuarioHelper::resolverAvatarUrl(
                    $row[UsuariosExtCols::AVATAR_URL] ?? null,
                    isset($row[UsuariosExtCols::WP_USER_ID]) ? (int) $row[UsuariosExtCols::WP_USER_ID] : null
                ),
                'verificado'      => (bool) ($row[UsuariosExtCols::VERIFICADO] ?? false),
                'totalSeguidores' => (int) ($row[UsuariosExtCols::TOTAL_SEGUIDORES] ?? 0),
            ];
        }, $rows);
    }
}
