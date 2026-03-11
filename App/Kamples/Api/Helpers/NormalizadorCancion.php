<?php

/**
 * NormalizadorCancion — Helpers de normalización para la API de canciones.
 *
 * Convierte las filas BD (snake_case de PostgreSQL) al formato camelCase
 * que consume el frontend React. Sigue el patrón de NormalizadorSample.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

use App\Config\Schema\_generated\LikesEnums;

class NormalizadorCancion
{
    /*
     * Aliases SQL usados en sqlSelectFeed (no son columnas reales).
     * Se inyectan como subqueries correlacionadas cuando hay usuario autenticado.
     */
    public const ALIAS_REACCION_USUARIO = 'reaccion_usuario';

    /**
     * Normaliza una fila de 'canciones' + joins opcionales de artista.
     * Incluye: artista_nombre, artista_slug (JOIN con artistas_musicales).
     */
    public static function cancion(array $row): array
    {
        return [
            'id'               => (int) ($row['id'] ?? 0),
            'titulo'           => $row['titulo'] ?? '',
            'slug'             => $row['slug'] ?? '',
            'artistaId'        => (int) ($row['artista_id'] ?? 0),
            'album'            => $row['album'] ?? null,
            'sello'            => $row['sello'] ?? null,
            'anio'             => isset($row['anio']) ? (int) $row['anio'] : null,
            'duracionSegundos' => isset($row['duracion_segundos']) ? (int) $row['duracion_segundos'] : null,
            'genero'           => $row['genero'] ?? null,
            'youtubeId'        => $row['youtube_id'] ?? null,
            'spotifyId'        => $row['spotify_id'] ?? null,
            'imagenUrl'        => self::sanitizarUrlExterna($row['imagen_url'] ?? null),
            'whosampledUrl'    => $row['whosampled_url'] ?? null,
            'bpm'              => isset($row['bpm']) ? (int) $row['bpm'] : null,
            'tonalidad'        => $row['tonalidad'] ?? null,
            'metadata'         => $row['metadata'] ?? [],
            'totalSampleada'   => (int) ($row['total_sampleada'] ?? 0),
            'totalSamplea'     => (int) ($row['total_samplea'] ?? 0),
            'creadoAt'         => $row['created_at'] ?? '',
            'actualizadoAt'    => $row['updated_at'] ?? '',
            /* Campos opcionales de JOIN con artistas_musicales */
            'artistaNombre'    => $row['artista_nombre'] ?? null,
            'artistaSlug'      => $row['artista_slug'] ?? null,
            /* Campos opcionales de liked (subquery correlacionada en feed) */
            'totalLikes'       => (int) ($row['total_likes'] ?? 0),
            'liked'            => !empty($row[self::ALIAS_REACCION_USUARIO])
                && \in_array($row[self::ALIAS_REACCION_USUARIO], [LikesEnums::REACCION_LIKE, LikesEnums::REACCION_ENCANTA], true),
            'reaccion'         => $row[self::ALIAS_REACCION_USUARIO] ?? null,
        ];
    }

    /**
     * Normaliza una fila de 'artistas_musicales' a camelCase.
     */
    public static function artista(array $row): array
    {
        return [
            'id'             => (int) ($row['id'] ?? 0),
            'nombre'         => $row['nombre'] ?? '',
            'slug'           => $row['slug'] ?? '',
            'imagenUrl'      => $row['imagen_url'] ?? null,
            'whosampledSlug' => $row['whosampled_slug'] ?? null,
            'metadata'       => $row['metadata'] ?? [],
            'totalCanciones' => (int) ($row['total_canciones'] ?? 0),
            'creadoAt'       => $row['created_at'] ?? '',
        ];
    }

    /**
     * Normaliza un artista con rol (JOIN de canciones_artistas).
     */
    public static function artistaConRol(array $row): array
    {
        return [
            'artistaId' => (int) ($row['artista_id'] ?? 0),
            'nombre'    => $row['nombre'] ?? '',
            'slug'      => $row['slug'] ?? '',
            'rol'       => $row['rol'] ?? 'principal',
        ];
    }

    /**
     * Normaliza una fila de 'relaciones_sample' con joins de canciones/artistas.
     * El campo 'timings_*' puede venir como JSON string o ya como array PHP.
     */
    public static function relacion(array $row): array
    {
        return [
            'id'               => (int) ($row['id'] ?? 0),
            'cancionDestinoId' => (int) ($row['cancion_destino_id'] ?? 0),
            'cancionFuenteId'  => (int) ($row['cancion_fuente_id'] ?? 0),
            'whosampledId'     => isset($row['whosampled_id']) ? (int) $row['whosampled_id'] : null,
            'tipoRelacion'     => $row['tipo_relacion'] ?? 'sample',
            'tipoElemento'     => $row['tipo_elemento'] ?? null,
            'timingsDestino'   => self::decodeTimings($row['timings_destino'] ?? '[]'),
            'timingsFuente'    => self::decodeTimings($row['timings_fuente'] ?? '[]'),
            'apareceEnTodo'    => (bool) ($row['aparece_en_todo'] ?? false),
            'sampleId'         => isset($row['sample_id']) ? (int) $row['sample_id'] : null,
            'votosTotal'       => (int) ($row['votos_total'] ?? 0),
            'votosPromedio'    => (float) ($row['votos_promedio'] ?? 0),
            'fuente'           => $row['fuente'] ?? 'scraping',
            'verificada'       => (bool) ($row['verificada'] ?? false),
            'creadoAt'         => $row['created_at'] ?? '',
            /* Campos opcionales de JOIN */
            'cancionTitulo'    => $row['cancion_titulo'] ?? null,
            'cancionSlug'      => $row['cancion_slug'] ?? null,
            'artistaNombre'    => $row['artista_nombre'] ?? null,
            'artistaSlug'      => $row['artista_slug'] ?? null,
            'cancionAnio'      => isset($row['cancion_anio']) ? (int) $row['cancion_anio'] : null,
            'cancionImagenUrl' => $row['cancion_imagen_url'] ?? null,
        ];
    }

    /**
     * Normaliza una fila de estadísticasPorTipo.
     * SQL retorna alias 'tipo', frontend espera 'tipoRelacion'.
     */
    public static function estadisticaTipo(array $row): array
    {
        return [
            'tipoRelacion' => $row['tipo'] ?? '',
            'total'        => (int) ($row['total'] ?? 0),
        ];
    }

    /**
     * Normaliza una relación con detalle completo de ambas canciones.
     * Usada por la vista de detalle de sampleo (/sampleo/{id}).
     */
    public static function relacionCompleta(array $row): array
    {
        return [
            'id'               => (int) ($row['id'] ?? 0),
            'cancionDestinoId' => (int) ($row['cancion_destino_id'] ?? 0),
            'cancionFuenteId'  => (int) ($row['cancion_fuente_id'] ?? 0),
            'whosampledId'     => isset($row['whosampled_id']) ? (int) $row['whosampled_id'] : null,
            'tipoRelacion'     => $row['tipo_relacion'] ?? 'sample',
            'tipoElemento'     => $row['tipo_elemento'] ?? null,
            'timingsDestino'   => self::decodeTimings($row['timings_destino'] ?? '[]'),
            'timingsFuente'    => self::decodeTimings($row['timings_fuente'] ?? '[]'),
            'apareceEnTodo'    => (bool) ($row['aparece_en_todo'] ?? false),
            'sampleId'         => isset($row['sample_id']) ? (int) $row['sample_id'] : null,
            'votosTotal'       => (int) ($row['votos_total'] ?? 0),
            'votosPromedio'    => (float) ($row['votos_promedio'] ?? 0),
            'fuente'           => $row['fuente'] ?? 'scraping',
            'verificada'       => (bool) ($row['verificada'] ?? false),
            'creadoAt'         => $row['created_at'] ?? '',
            'totalLikes'       => (int) ($row['total_likes'] ?? 0),
            'totalComentarios' => (int) ($row['total_comentarios'] ?? 0),
            /* Canción fuente (sampleada) */
            'fuente_titulo'        => $row['fuente_titulo'] ?? null,
            'fuente_slug'          => $row['fuente_slug'] ?? null,
            'fuente_anio'          => isset($row['fuente_anio']) ? (int) $row['fuente_anio'] : null,
            'fuente_imagen'        => self::sanitizarUrlExterna($row['fuente_imagen'] ?? null),
            'fuente_youtubeId'     => $row['fuente_youtube_id'] ?? null,
            'fuente_spotifyId'     => $row['fuente_spotify_id'] ?? null,
            'fuente_album'         => $row['fuente_album'] ?? null,
            'fuente_genero'        => $row['fuente_genero'] ?? null,
            'fuente_artista'       => $row['fuente_artista'] ?? null,
            'fuente_artistaSlug'   => $row['fuente_artista_slug'] ?? null,
            /* Canción destino (que samplea) */
            'destino_titulo'       => $row['destino_titulo'] ?? null,
            'destino_slug'         => $row['destino_slug'] ?? null,
            'destino_anio'         => isset($row['destino_anio']) ? (int) $row['destino_anio'] : null,
            'destino_imagen'       => self::sanitizarUrlExterna($row['destino_imagen'] ?? null),
            'destino_youtubeId'    => $row['destino_youtube_id'] ?? null,
            'destino_spotifyId'    => $row['destino_spotify_id'] ?? null,
            'destino_album'        => $row['destino_album'] ?? null,
            'destino_genero'       => $row['destino_genero'] ?? null,
            'destino_artista'      => $row['destino_artista'] ?? null,
            'destino_artistaSlug'  => $row['destino_artista_slug'] ?? null,
            /* Contribuidor que propuso la relacion */
            'contribuidorId'       => isset($row['contribuidor_id']) ? (int) $row['contribuidor_id'] : null,
            'contribuidorUsername' => $row['contribuidor_username'] ?? null,
        ];
    }

    /**
     * Decodifica un campo de timings: puede ser array PHP o JSON string.
     * Verifica json_last_error() para detectar JSON corrupto sin enmascararlo.
     */
    private static function decodeTimings(mixed $valor): array
    {
        if (\is_array($valor)) {
            return $valor;
        }

        $decoded = \json_decode((string) $valor, true);

        if (\json_last_error() !== JSON_ERROR_NONE) {
            \error_log('[NormalizadorCancion] timings JSON corrupto: ' . $valor);
            return [];
        }

        return \is_array($decoded) ? $decoded : [];
    }

    /**
     * Solo permite URLs absolutas (http/https) como imágenes externas.
     * Rutas relativas (/static/...) provienen de HTML de prueba local y
     * causarían 500 en el servidor al intentar servir archivos inexistentes.
     */
    private static function sanitizarUrlExterna(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return null;
        }

        if (\str_starts_with($url, 'https://') || \str_starts_with($url, 'http://')) {
            return $url;
        }

        return null;
    }
}
