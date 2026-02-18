<?php

/**
 * PerfilUsuario — Construye el perfil de preferencias de un usuario para recomendación.
 *
 * Extraído de MotorRecomendacion (A01 SOLID split).
 * Consulta interacciones (likes, reproducciones, descargas) para extraer:
 * - BPM promedio preferido
 * - Key musical más frecuente
 * - Tipo de sample favorito
 * - Top 5 creadores con más afinidad
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;

class PerfilUsuario
{
    /**
     * Construye el perfil de preferencias del usuario.
     * Extrae: BPM promedio, keys más usadas, géneros favoritos, tipo preferido.
     */
    public static function construir(int $userId): array
    {
        /* Contar interacciones totales */
        $interacciones = PostgresService::consultarUno(
            "SELECT
                (SELECT COUNT(*) FROM likes WHERE usuario_id = :userId AND tipo = 'sample') +
                (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId) +
                (SELECT COUNT(*) FROM descargas WHERE usuario_id = :userId) as total",
            ['userId' => $userId]
        );

        $total = (int) ($interacciones['total'] ?? 0);
        if ($total === 0) {
            return ['interacciones' => 0, 'userId' => $userId];
        }

        /* BPM promedio de samples likeados/reproducidos (excluye dislikes) */
        $bpmPref = PostgresService::consultarUno(
            "SELECT AVG(s.bpm)::int as bpm_prom
             FROM samples s
             WHERE s.bpm IS NOT NULL AND s.id IN (
                 SELECT target_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample' AND reaccion IN ('like', 'encanta')
                 UNION
                 SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
             )",
            ['userId' => $userId]
        );

        /* Key mas frecuente (excluye dislikes) */
        $keyPref = PostgresService::consultarUno(
            "SELECT s.key as key_fav, COUNT(*) as cnt
             FROM samples s
             WHERE s.key IS NOT NULL AND s.id IN (
                 SELECT target_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample' AND reaccion IN ('like', 'encanta')
                 UNION
                 SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
             )
             GROUP BY s.key ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId]
        );

        /* Tipo mas frecuente (excluye dislikes) */
        $tipoPref = PostgresService::consultarUno(
            "SELECT s.tipo as tipo_fav, COUNT(*) as cnt
             FROM samples s
             WHERE s.id IN (
                 SELECT target_id FROM likes WHERE usuario_id = :userId AND tipo = 'sample' AND reaccion IN ('like', 'encanta')
                 UNION
                 SELECT sample_id FROM reproducciones WHERE usuario_id = :userId
             )
             GROUP BY s.tipo ORDER BY cnt DESC LIMIT 1",
            ['userId' => $userId]
        );

        return [
            'interacciones' => $total,
            'userId' => $userId,
            'bpmProm' => (int) ($bpmPref['bpm_prom'] ?? 0),
            'keyFav' => $keyPref['key_fav'] ?? null,
            'tipoFav' => $tipoPref['tipo_fav'] ?? null,
            'creadoresFav' => self::obtenerCreadoresFavoritos($userId),
        ];
    }

    /**
     * Obtiene los top 5 creadores con más interacciones positivas del usuario.
     * Combina likes (encanta=2, like=1) + reproducciones + descargas.
     */
    public static function obtenerCreadoresFavoritos(int $userId): array
    {
        $resultado = PostgresService::consultar(
            "SELECT creador_id, SUM(score) as afinidad FROM (
                SELECT s.creador_id,
                       CASE WHEN l.reaccion = 'encanta' THEN 2.0 ELSE 1.0 END as score
                FROM likes l
                JOIN samples s ON l.target_id = s.id
                WHERE l.usuario_id = :userId AND l.tipo = 'sample' AND l.reaccion IN ('like', 'encanta')
                UNION ALL
                SELECT s.creador_id, 0.5 as score
                FROM reproducciones r
                JOIN samples s ON r.sample_id = s.id
                WHERE r.usuario_id = :userId
                UNION ALL
                SELECT s.creador_id, 1.5 as score
                FROM descargas d
                JOIN samples s ON d.sample_id = s.id
                WHERE d.usuario_id = :userId
            ) interacciones
            WHERE creador_id != :userId
            GROUP BY creador_id
            HAVING SUM(score) >= 2
            ORDER BY afinidad DESC
            LIMIT 5",
            ['userId' => $userId]
        );

        return \array_column($resultado, 'creador_id');
    }
}
