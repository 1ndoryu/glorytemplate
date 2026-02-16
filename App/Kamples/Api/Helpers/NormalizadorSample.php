<?php

/**
 * NormalizadorSample — Transforma filas crudas de PostgreSQL a formato API.
 *
 * Convierte snake_case → camelCase, parsea arrays PG y JSONB,
 * y agrupa datos del creador en un sub-objeto.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

class NormalizadorSample
{
    /**
     * Convierte un string PostgreSQL array ({val1,val2,...}) a array PHP.
     * PDO no parsea automáticamente columnas text[] de Postgres.
     */
    public static function pgArrayToPhp(?string $pgArray): array
    {
        if ($pgArray === null || $pgArray === '' || $pgArray === '{}') return [];
        $inner = trim($pgArray, '{}');
        if ($inner === '') return [];
        return str_getcsv($inner);
    }

    /**
     * Convierte una ruta absoluta de filesystem a URL HTTP.
     * Ejemplo: C:\...\wp-content\uploads\kamples\1\... → http://glory.local/wp-content/uploads/kamples/1/...
     * Necesario porque PipelineAudio guarda rutas absolutas en BD.
     */
    public static function rutaAUrl(?string $rutaAbsoluta): string
    {
        if (!$rutaAbsoluta || $rutaAbsoluta === '') return '';

        /* Si ya es una URL HTTP, devolver tal cual */
        if (str_starts_with($rutaAbsoluta, 'http://') || str_starts_with($rutaAbsoluta, 'https://')) {
            return $rutaAbsoluta;
        }

        $uploadDir = \wp_upload_dir();
        $basedir = wp_normalize_path($uploadDir['basedir']);
        $baseurl = $uploadDir['baseurl'];
        $rutaNormalizada = wp_normalize_path($rutaAbsoluta);

        /* Reemplazar la parte del filesystem con la URL base */
        if (str_starts_with($rutaNormalizada, $basedir)) {
            $relativa = substr($rutaNormalizada, strlen($basedir));
            return $baseurl . $relativa;
        }

        /* Fallback: buscar wp-content/uploads en la ruta */
        $marcador = 'wp-content/uploads';
        $pos = strpos($rutaNormalizada, $marcador);
        if ($pos !== false) {
            $relativa = substr($rutaNormalizada, $pos + strlen($marcador));
            return $baseurl . $relativa;
        }

        return $rutaAbsoluta;
    }

    /**
     * Normaliza un sample para la respuesta JSON.
     * Convierte snake_case PG a camelCase, agrupa datos del creador como sub-objeto,
     * convierte tags text[] a array PHP y metadata JSONB a objeto.
     */
    public static function normalizar(array $row): array
    {
        /* tags: text[] PG -> array PHP */
        $tags = [];
        if (isset($row['tags']) && is_string($row['tags'])) {
            $tags = self::pgArrayToPhp($row['tags']);
        } elseif (isset($row['tags']) && is_array($row['tags'])) {
            $tags = $row['tags'];
        }

        /* metadata: JSONB PG -> objeto PHP */
        $metadata = null;
        if (isset($row['metadata']) && is_string($row['metadata'])) {
            $metadata = json_decode($row['metadata'], true);
        } elseif (isset($row['metadata']) && is_array($row['metadata'])) {
            $metadata = $row['metadata'];
        }

        /* Construir objeto creador si los campos existen */
        $creador = null;
        if (isset($row['creador_id']) || isset($row['username'])) {
            $creador = [
                'id'             => (int) ($row['creador_id'] ?? 0),
                'username'       => $row['username'] ?? '',
                'nombreVisible'  => $row['nombre_visible'] ?? $row['username'] ?? '',
                'avatarUrl'      => $row['avatar_url'] ?? null,
                'verificado'     => (bool) ($row['verificado'] ?? false),
            ];
        }

        return [
            'id'               => (int) ($row['id'] ?? 0),
            'titulo'           => $row['titulo'] ?? '',
            'slug'             => $row['slug'] ?? '',
            'idCorto'          => $row['id_corto'] ?? null,
            'descripcion'      => $row['descripcion'] ?? '',
            'bpm'              => isset($row['bpm']) ? (int) $row['bpm'] : null,
            'key'              => $row['key'] ?? null,
            'escala'           => $row['escala'] ?? null,
            'duracion'         => isset($row['duracion']) ? (float) $row['duracion'] : 0,
            'formato'          => $row['formato'] ?? null,
            'tamano'           => isset($row['tamano']) ? (int) $row['tamano'] : 0,
            'tags'             => $tags,
            'tipo'             => $row['tipo'] ?? 'one shot',
            'estado'           => $row['estado'] ?? 'procesando',
            'esPremium'        => (bool) ($row['es_premium'] ?? false),
            'precio'           => isset($row['precio']) ? (float) $row['precio'] : null,
            'metadata'         => $metadata,
            'rutaPreview'      => self::rutaAUrl($row['ruta_preview'] ?? ''),
            'rutaWaveform'     => self::rutaAUrl($row['ruta_waveform'] ?? ''),
            'rutaOriginal'     => self::rutaAUrl($row['ruta_original'] ?? ''),
            'rutaOptimizada'   => self::rutaAUrl($row['ruta_optimizada'] ?? ''),
            'imagenUrl'        => $row['imagen_url'] ?? null,
            'totalDescargas'   => (int) ($row['total_descargas'] ?? 0),
            'totalLikes'       => (int) ($row['total_likes'] ?? 0),
            'totalReproducciones' => (int) ($row['total_reproducciones'] ?? 0),
            'audioHash'        => $row['audio_hash'] ?? null,
            'creador'          => $creador,
            'liked'            => (bool) ($row['liked'] ?? false),
        ];
    }

    /**
     * Normaliza un array de samples.
     */
    public static function normalizarLista(array $samples): array
    {
        return array_map([self::class, 'normalizar'], $samples);
    }

    /**
     * SQL SELECT base para samples con join a usuario creador.
     * Evita duplicar esta query en cada controlador.
     */
    public static function sqlSelectSamples(?int $userId = null): string
    {
        /*
         * Si se pasa userId, incluimos subquery EXISTS para liked.
         * Es seguro inyectar directamente porque $userId es int (sin riesgo de SQL injection).
         */
        $likedExpr = $userId !== null
            ? "EXISTS(SELECT 1 FROM likes WHERE usuario_id = {$userId} AND tipo = 'sample' AND target_id = s.id)"
            : "FALSE";

        return "SELECT s.id, s.titulo, s.slug, s.id_corto, s.descripcion,
                       s.bpm, s.key, s.escala, s.duracion, s.formato, s.tamano,
                       s.tags, s.tipo, s.estado, s.es_premium, s.precio, s.metadata,
                       s.ruta_preview, s.ruta_waveform, s.ruta_original, s.ruta_optimizada,
                       s.imagen_url, s.total_descargas, s.total_likes, s.total_reproducciones,
                       s.audio_hash,
                       u.id as creador_id, u.username, u.nombre_visible,
                       u.avatar_url, u.verificado,
                       {$likedExpr} AS liked
                FROM samples s
                LEFT JOIN usuarios_ext u ON s.creador_id = u.id";
    }
}
