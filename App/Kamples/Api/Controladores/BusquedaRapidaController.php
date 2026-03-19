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
use App\Config\Schema\_generated\ColeccionesCols;
use App\Helpers\UrlHelper;
use App\Kamples\Database\Repositories\BaseRepository;
use App\Kamples\KamplesLogger;
use App\Kamples\Services\ServicioCache;

class BusquedaRapidaController
{
    private const LIMITE_POR_TIPO = 5;
    private const CACHE_TTL = 21600; /* 6 horas */
    private const CACHE_PREFIX = 'kamples_busq_rapida_';

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
                    'canciones'   => [],
                    'samples'     => [],
                    'sampleos'    => [],
                    'usuarios'    => [],
                    'colecciones' => [],
                    'todos'       => [],
                ], 200);
            }

            $limite = self::LIMITE_POR_TIPO;
            $qLower = mb_strtolower($q);

            /* [183A-93] Cache Redis 6h — búsquedas populares se repiten mucho.
             * Resultados toleran datos ligeramente stale (no necesitan real-time). */
            $claveCache = self::CACHE_PREFIX . md5($qLower);
            $cacheado = ServicioCache::obtener($claveCache);

            if ($cacheado !== false) {
                $datos = json_decode($cacheado, true);
                if (is_array($datos)) {
                    return new \WP_REST_Response($datos, 200);
                }
            }

            $canciones   = self::buscarCanciones($q, $limite);
            $samples     = self::buscarSamples($q, $limite);
            $sampleos    = self::buscarSampleos($q, $limite);
            $usuarios    = self::buscarUsuarios($q, $limite);
            $colecciones = self::buscarColecciones($q, $limite);

            /* Lista unificada ordenada por relevancia del match */
            $todos = self::unificarResultados($qLower, $canciones, $samples, $sampleos, $usuarios, $colecciones);

            $resultado = [
                'canciones'   => $canciones,
                'samples'     => $samples,
                'sampleos'    => $sampleos,
                'usuarios'    => $usuarios,
                'colecciones' => $colecciones,
                'todos'       => $todos,
            ];

            ServicioCache::guardar($claveCache, json_encode($resultado), self::CACHE_TTL);

            return new \WP_REST_Response($resultado, 200);
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
            . " AND " . UsuariosExtCols::ES_SEED . " = false"
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

    /**
     * Colecciones — ILIKE en nombre y descripcion, solo públicas con al menos 1 sample.
     */
    private static function buscarColecciones(string $q, int $limite): array
    {
        $tc = ColeccionesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;

        $rows = BaseRepository::consultar(
            "SELECT c." . ColeccionesCols::ID
            . ", c." . ColeccionesCols::NOMBRE
            . ", c." . ColeccionesCols::SLUG
            . ", c." . ColeccionesCols::PORTADA_URL
            . ", c." . ColeccionesCols::TOTAL_SAMPLES
            . ", u." . UsuariosExtCols::USERNAME
            . ", u." . UsuariosExtCols::NOMBRE_VISIBLE
            . " FROM {$tc} c"
            . " LEFT JOIN {$tu} u ON c." . ColeccionesCols::USUARIO_ID . " = u." . UsuariosExtCols::ID
            . " WHERE c." . ColeccionesCols::PUBLICA . " = true"
            . " AND c." . ColeccionesCols::TOTAL_SAMPLES . " > 0"
            . " AND (c." . ColeccionesCols::NOMBRE . " ILIKE :busqueda"
            . " OR c." . ColeccionesCols::DESCRIPCION . " ILIKE :busqueda)"
            . " ORDER BY c." . ColeccionesCols::TOTAL_SAMPLES . " DESC, c." . ColeccionesCols::ID . " DESC"
            . " LIMIT :limite",
            [
                'busqueda' => '%' . $q . '%',
                'limite'   => $limite,
            ]
        );

        return array_map(function (array $row): array {
            return [
                'id'           => (int) $row[ColeccionesCols::ID],
                'nombre'       => $row[ColeccionesCols::NOMBRE] ?? '',
                'slug'         => $row[ColeccionesCols::SLUG] ?? '',
                'portadaUrl'   => UrlHelper::normalizar($row[ColeccionesCols::PORTADA_URL] ?? null),
                'totalSamples' => (int) ($row[ColeccionesCols::TOTAL_SAMPLES] ?? 0),
                'creador'      => $row[UsuariosExtCols::NOMBRE_VISIBLE] ?? $row[UsuariosExtCols::USERNAME] ?? '',
            ];
        }, $rows);
    }

    /**
     * Unifica resultados de todos los tipos en una lista plana ordenada por relevancia.
     *
     * Score: coincidencia exacta al inicio > contiene > posición del match.
     * Intercala tipos para diversidad cuando scores son iguales.
     */
    private static function unificarResultados(
        string $qLower,
        array $canciones,
        array $samples,
        array $sampleos,
        array $usuarios,
        array $colecciones
    ): array {
        $todos = [];

        foreach ($canciones as $i => $c) {
            $textoMatch = mb_strtolower($c['titulo'] . ' ' . ($c['artistaNombre'] ?? ''));
            $todos[] = [
                'tipo'  => 'cancion',
                'score' => self::calcularScore($qLower, $textoMatch, $i),
                'datos' => $c,
            ];
        }

        foreach ($samples as $i => $s) {
            $textoMatch = mb_strtolower($s['titulo']);
            $todos[] = [
                'tipo'  => 'sample',
                'score' => self::calcularScore($qLower, $textoMatch, $i),
                'datos' => $s,
            ];
        }

        foreach ($sampleos as $i => $rel) {
            $textoMatch = mb_strtolower(
                $rel['fuente']['titulo'] . ' ' . $rel['fuente']['artista']
                . ' ' . $rel['destino']['titulo'] . ' ' . $rel['destino']['artista']
            );
            $todos[] = [
                'tipo'  => 'sampleo',
                'score' => self::calcularScore($qLower, $textoMatch, $i),
                'datos' => $rel,
            ];
        }

        foreach ($usuarios as $i => $u) {
            $textoMatch = mb_strtolower($u['username'] . ' ' . $u['nombreVisible']);
            $todos[] = [
                'tipo'  => 'usuario',
                'score' => self::calcularScore($qLower, $textoMatch, $i),
                'datos' => $u,
            ];
        }

        foreach ($colecciones as $i => $col) {
            $textoMatch = mb_strtolower($col['nombre']);
            $todos[] = [
                'tipo'  => 'coleccion',
                'score' => self::calcularScore($qLower, $textoMatch, $i),
                'datos' => $col,
            ];
        }

        /* Ordenar por score descendente — los más relevantes primero */
        usort($todos, static function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        return array_slice($todos, 0, 12);
    }

    /**
     * Calcula score de relevancia para un resultado.
     *
     * - Match exacto: 100
     * - Empieza con la query: 80
     * - Contiene la query: 60
     * - Cuanto antes en su grupo (orden del backend), más score
     */
    private static function calcularScore(string $query, string $texto, int $posicion): float
    {
        $base = 0;

        if ($texto === $query) {
            $base = 100;
        } elseif (mb_strpos($texto, $query) === 0) {
            $base = 80;
        } elseif (mb_strpos($texto, $query) !== false) {
            $base = 60;
        } else {
            $base = 40;
        }

        /* Posición dentro de su grupo (máx 5 items) — penalizar resultados más bajos */
        $penalizacionPosicion = $posicion * 2;

        return $base - $penalizacionPosicion;
    }
}
