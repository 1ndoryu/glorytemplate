<?php

/**
 * GeneradorEmbeddings — Genera vectores de características para similitud con pgvector.
 *
 * Convierte los metadatos de un sample (BPM, key, escala, tipo, duración,
 * tags) en un vector de 128 dimensiones que se puede indexar con HNSW
 * y comparar mediante distancia coseno.
 *
 * Composición del vector (128d):
 *   [0]      BPM normalizado (1d)
 *   [1-12]   Key musical one-hot (12d): C, C#, D, D#, E, F, F#, G, G#, A, A#, B
 *   [13-14]  Escala (2d): [major, minor]
 *   [15-19]  Tipo de sample one-hot (5d): loop, one_shot, vocal, fx, preset
 *   [20]     Duración normalizada log (1d)
 *   [21]     Es premium (1d)
 *   [22-127] Tags hasheados (106d) — cada tag mapea a una posición fija
 *
 * Fallback: si el sample no tiene tags, la zona 22-127 queda en ceros
 * y la similitud se basa solo en atributos musicales.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;
use App\Kamples\Api\Helpers\NormalizadorSample;

class GeneradorEmbeddings
{
    private const DIMENSION = 128;
    private const BPM_MAX = 300;
    private const DURACION_MAX = 600; /* 10 minutos */
    private const TAGS_OFFSET = 22;
    private const TAGS_SLOTS = 106; /* 128 - 22 = 106 posiciones para tags */

    /* Mapa de keys musicales a índices (0-11) */
    private const KEYS = [
        'C' => 0, 'C#' => 1, 'Db' => 1,
        'D' => 2, 'D#' => 3, 'Eb' => 3,
        'E' => 4,
        'F' => 5, 'F#' => 6, 'Gb' => 6,
        'G' => 7, 'G#' => 8, 'Ab' => 8,
        'A' => 9, 'A#' => 10, 'Bb' => 10,
        'B' => 11
    ];

    /* Mapa de tipos de sample a índices (0-4) */
    private const TIPOS = [
        'loop' => 0,
        'one_shot' => 1,
        'one shot' => 1,
        'oneshot' => 1,
        'vocal' => 2,
        'fx' => 3,
        'preset' => 4
    ];

    /**
     * Genera el vector de 128 dimensiones para un sample.
     *
     * @param array $sample Fila del sample con: bpm, key, escala, tipo, duracion, es_premium, tags
     * @return array Vector de 128 floats
     */
    public static function generar(array $sample): array
    {
        $vector = array_fill(0, self::DIMENSION, 0.0);

        /* [0] BPM normalizado entre 0 y 1 */
        $bpm = isset($sample['bpm']) ? (int) $sample['bpm'] : 0;
        $vector[0] = $bpm > 0 ? min(1.0, $bpm / self::BPM_MAX) : 0.0;

        /* [1-12] Key musical one-hot */
        $key = strtoupper(trim($sample['key'] ?? ''));
        if (isset(self::KEYS[$key])) {
            $vector[1 + self::KEYS[$key]] = 1.0;
        }

        /* [13-14] Escala: [major, minor] */
        $escala = strtolower(trim($sample['escala'] ?? ''));
        if ($escala === 'major' || $escala === 'mayor') {
            $vector[13] = 1.0;
        } elseif ($escala === 'minor' || $escala === 'menor') {
            $vector[14] = 1.0;
        } else {
            /* Sin escala definida: valor neutral */
            $vector[13] = 0.5;
            $vector[14] = 0.5;
        }

        /* [15-19] Tipo de sample one-hot */
        $tipo = strtolower(trim($sample['tipo'] ?? 'loop'));
        $tipoIdx = self::TIPOS[$tipo] ?? 0;
        $vector[15 + $tipoIdx] = 1.0;

        /* [20] Duración normalizada (escala logarítmica) */
        $duracion = isset($sample['duracion']) ? (float) $sample['duracion'] : 0;
        if ($duracion > 0) {
            $vector[20] = min(1.0, log(1 + $duracion) / log(1 + self::DURACION_MAX));
        }

        /* [21] Es premium */
        $vector[21] = !empty($sample['es_premium']) ? 1.0 : 0.0;

        /* [22-127] Tags hasheados a posiciones fijas con pesos */
        $tags = $sample['tags'] ?? [];
        if (is_string($tags)) {
            $tags = NormalizadorSample::pgArrayToPhp($tags);
        }

        if (!empty($tags)) {
            /* Cada tag produce un valor en una posición determinística */
            $pesoTag = 1.0 / max(1, count($tags));
            foreach ($tags as $tag) {
                $tag = strtolower(trim($tag));
                if ($tag === '') continue;
                /*
                 * Hash del tag a una posición fija (0 a TAGS_SLOTS-1).
                 * Se usa crc32 para distribución uniforme y determinista.
                 */
                $pos = abs(crc32($tag)) % self::TAGS_SLOTS;
                $vector[self::TAGS_OFFSET + $pos] += $pesoTag;
            }

            /* Limitar valores máximos de tags a 1.0 */
            for ($i = self::TAGS_OFFSET; $i < self::DIMENSION; $i++) {
                $vector[$i] = min(1.0, $vector[$i]);
            }
        }

        return $vector;
    }

    /**
     * Genera el vector y lo convierte a formato string de PostgreSQL.
     * Ejemplo: '[0.5,0,1,...,0]'
     */
    public static function generarString(array $sample): string
    {
        $vector = self::generar($sample);
        return '[' . implode(',', array_map(fn($v) => round($v, 6), $vector)) . ']';
    }

    /**
     * Genera y guarda el embedding de un sample en la base de datos.
     *
     * @return bool true si se actualizó correctamente
     */
    public static function guardarEmbedding(int $sampleId): bool
    {
        $sample = PostgresService::consultarUno(
            "SELECT bpm, key, escala, tipo, duracion, es_premium, tags FROM samples WHERE id = :id",
            ['id' => $sampleId]
        );

        if (!$sample) return false;

        $vectorStr = self::generarString($sample);

        PostgresService::ejecutar(
            "UPDATE samples SET embedding = :embedding::vector WHERE id = :id",
            ['embedding' => $vectorStr, 'id' => $sampleId]
        );

        return true;
    }

    /**
     * Genera embeddings para TODOS los samples que no tienen uno.
     * Ideal para ejecución inicial o batch.
     *
     * @return int Cantidad de samples actualizados
     */
    public static function generarTodos(): int
    {
        $samples = PostgresService::consultar(
            "SELECT id, bpm, key, escala, tipo, duracion, es_premium, tags
             FROM samples WHERE embedding IS NULL AND estado = 'activo'"
        );

        $actualizados = 0;
        foreach ($samples as $sample) {
            $vectorStr = self::generarString($sample);
            PostgresService::ejecutar(
                "UPDATE samples SET embedding = :embedding::vector WHERE id = :id",
                ['embedding' => $vectorStr, 'id' => (int) $sample['id']]
            );
            $actualizados++;
        }

        return $actualizados;
    }

    /**
     * Construye un vector de perfil de usuario basado en sus interacciones.
     * Promedia los embeddings de los samples que el usuario ha likeado,
     * reproducido y descargado, con pesos diferentes por tipo de interacción.
     *
     * @return array|null Vector de 128d o null si no hay datos
     */
    public static function perfilUsuario(int $userId): ?array
    {
        /*
         * Obtener embeddings de samples con los que el usuario interactuó.
         * Pesos: like=3, descarga=5, reproducción=1, reproducción completa=2
         */
        $sql = "SELECT s.embedding::text, tipo_interaccion, peso FROM (
                    SELECT target_id as sample_id, 'like' as tipo_interaccion, 3 as peso
                    FROM likes WHERE usuario_id = :userId AND tipo = 'sample'
                    UNION ALL
                    SELECT sample_id, 'descarga', 5
                    FROM descargas WHERE usuario_id = :userId
                    UNION ALL
                    SELECT sample_id,
                           CASE WHEN completa THEN 'reproduccion_completa' ELSE 'reproduccion' END,
                           CASE WHEN completa THEN 2 ELSE 1 END
                    FROM reproducciones WHERE usuario_id = :userId
                ) interacciones
                JOIN samples s ON s.id = interacciones.sample_id
                WHERE s.embedding IS NOT NULL";

        $rows = PostgresService::consultar($sql, ['userId' => $userId]);

        if (empty($rows)) return null;

        /* Promedio ponderado de todos los embeddings */
        $sumVector = array_fill(0, self::DIMENSION, 0.0);
        $pesoTotal = 0.0;

        foreach ($rows as $row) {
            $embStr = $row['embedding'] ?? '';
            $peso = (float) ($row['peso'] ?? 1);
            $emb = self::parsearVectorPg($embStr);
            if ($emb === null) continue;

            for ($i = 0; $i < self::DIMENSION; $i++) {
                $sumVector[$i] += $emb[$i] * $peso;
            }
            $pesoTotal += $peso;
        }

        if ($pesoTotal === 0.0) return null;

        /* Normalizar */
        $resultado = [];
        $norma = 0.0;
        for ($i = 0; $i < self::DIMENSION; $i++) {
            $resultado[$i] = $sumVector[$i] / $pesoTotal;
            $norma += $resultado[$i] ** 2;
        }

        /* Normalizar a magnitud 1 (unit vector para coseno) */
        $norma = sqrt($norma);
        if ($norma > 0) {
            for ($i = 0; $i < self::DIMENSION; $i++) {
                $resultado[$i] = $resultado[$i] / $norma;
            }
        }

        return $resultado;
    }

    /**
     * Convierte un string de vector PostgreSQL a array PHP.
     * Ejemplo: '[0.5,0,1]' → [0.5, 0.0, 1.0]
     */
    public static function parsearVectorPg(string $pgVector): ?array
    {
        $pgVector = trim($pgVector, '[] ');
        if ($pgVector === '') return null;
        return array_map('floatval', explode(',', $pgVector));
    }

    /**
     * Convierte un array PHP a string de vector PostgreSQL.
     */
    public static function vectorAString(array $vector): string
    {
        return '[' . implode(',', array_map(fn($v) => round($v, 6), $vector)) . ']';
    }
}
