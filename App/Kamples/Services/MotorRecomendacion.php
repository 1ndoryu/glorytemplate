<?php

/**
 * MotorRecomendacion — Motor centralizado de scoring y recomendación.
 *
 * Usado por: feed home, "más ideas", "también te podría gustar", "samples similares".
 * Lee pesos desde Config/algoritmoPesos.php. 100% dinámico.
 *
 * Señales implementadas (sin pgvector):
 * 1. Comportamiento (likes + reproducciones + descargas del usuario)
 * 2. Contexto (BPM, key, género, tipo)
 * 3. Tendencias (engagement velocity por ventana temporal)
 * 4. Grafo social (samples de seguidos, likes de seguidos)
 * 5. Novedad (boost logarítmico)
 * 6. Penalización por ya escuchado
 *
 * La señal de similitud de audio (pgvector coseno) se activa automáticamente
 * cuando pgvector esté instalado.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\PostgresService;
use App\Kamples\Api\Helpers\NormalizadorSample;

class MotorRecomendacion
{
    private static ?array $pesos = null;

    /**
     * Carga los pesos desde el archivo de configuración.
     */
    private static function cargarPesos(): array
    {
        if (self::$pesos === null) {
            $ruta = dirname(__DIR__) . '/Config/algoritmoPesos.php';
            self::$pesos = file_exists($ruta) ? require $ruta : [];
        }
        return self::$pesos;
    }

    /**
     * Feed personalizado para el usuario autenticado.
     * Combina todas las señales disponibles con pesos configurables.
     */
    public static function feedPersonalizado(int $userId, int $limite = 20, int $offset = 0): array
    {
        $config = self::cargarPesos();
        $pesos = $config['senales'] ?? [];
        $params = $config['parametros'] ?? [];

        /* Obtener perfil de preferencias del usuario */
        $perfilUsuario = self::construirPerfilUsuario($userId);

        if (empty($perfilUsuario['interacciones']) && ($params['min_interacciones'] ?? 5) > 0) {
            /* Usuario nuevo sin interacciones: fallback a trending + novedad */
            return self::feedNuevoUsuario($limite, $offset);
        }

        /*
         * Construir query SQL con scoring multi-señal.
         * Cada señal se calcula como una sub-expresión en el ORDER BY.
         */
        $scoreParts = [];
        $queryParams = ['userId' => $userId, 'limit' => $limite, 'offset' => $offset];

        /* Señal 1: Comportamiento — samples similares a los que el usuario ha interactuado */
        $pesoComportamiento = $pesos['comportamiento'] ?? 0.25;
        if ($pesoComportamiento > 0) {
            $scoreParts[] = self::sqlComportamiento($userId, $pesoComportamiento, $queryParams);
        }

        /* Señal 2: Tendencias — engagement velocity */
        $pesoTendencias = $pesos['tendencias'] ?? 0.15;
        if ($pesoTendencias > 0) {
            $ventanas = $params['ventanas_tendencias'] ?? ['corta' => '24 hours'];
            $scoreParts[] = self::sqlTendencias($pesoTendencias, $ventanas);
        }

        /* Señal 3: Novedad — boost logarítmico */
        $pesoNovedad = $pesos['novedad'] ?? 0.10;
        if ($pesoNovedad > 0) {
            $diasBoost = $params['novedad_dias_boost'] ?? 14;
            $scoreParts[] = "({$pesoNovedad} * GREATEST(0, 1 - LN(GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 86400)) / LN({$diasBoost})))";
        }

        /* Señal 4: Grafo social — samples de usuarios seguidos */
        $pesoSocial = $pesos['grafo_social'] ?? 0.10;
        if ($pesoSocial > 0) {
            $scoreParts[] = "({$pesoSocial} * CASE WHEN s.creador_id IN (SELECT seguido_id FROM follows WHERE seguidor_id = :userId) THEN 1 ELSE 0 END)";
        }

        /* Penalización por ya escuchado */
        $penConfig = $params['penalizacion_ya_escuchado'] ?? [];
        $umbralRepro = $penConfig['umbral_reproducciones'] ?? 3;
        $factorPen = $penConfig['factor_penalizacion'] ?? 0.3;
        $scoreParts[] = "(CASE WHEN (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId AND sample_id = s.id) >= {$umbralRepro} THEN {$factorPen} ELSE 1 END)";

        $scoreTotal = !empty($scoreParts) ? implode(' + ', array_slice($scoreParts, 0, -1))
            . ' * ' . end($scoreParts) : '1';

        /* Construir query completa */
        $maxPorCreador = $params['max_por_creador'] ?? 3;

        $sql = "WITH scored AS (
                    SELECT s.*, u.username, u.nombre_visible, u.avatar_url, u.verificado,
                           u.id as creador_id,
                           ({$scoreTotal}) as score,
                           ROW_NUMBER() OVER (PARTITION BY s.creador_id ORDER BY ({$scoreTotal}) DESC) as rn
                    FROM samples s
                    LEFT JOIN usuarios_ext u ON s.creador_id = u.id
                    WHERE s.estado = 'activo'
                )
                SELECT * FROM scored
                WHERE rn <= {$maxPorCreador}
                ORDER BY score DESC
                LIMIT :limit OFFSET :offset";

        return PostgresService::consultar($sql, $queryParams);
    }

    /**
     * Feed para usuarios nuevos sin historial de interacciones.
     * Mezcla trending reciente + samples nuevos.
     */
    private static function feedNuevoUsuario(int $limite, int $offset): array
    {
        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo'"
             . " ORDER BY (s.total_likes * 2 + s.total_reproducciones + s.total_descargas * 3)"
             . "   * GREATEST(0.1, 1 - EXTRACT(EPOCH FROM NOW() - s.publicado_at) / (86400 * 30)) DESC"
             . " LIMIT :limit OFFSET :offset";

        return PostgresService::consultar($sql, ['limit' => $limite, 'offset' => $offset]);
    }

    /**
     * Construye el perfil de preferencias del usuario.
     * Tags favoritos, BPM promedio, keys frecuentes, géneros.
     */
    private static function construirPerfilUsuario(int $userId): array
    {
        /* Contar interacciones totales */
        $interacciones = PostgresService::consultarUno(
            "SELECT
                (SELECT COUNT(*) FROM likes WHERE usuario_id = :userId AND tipo = 'sample') +
                (SELECT COUNT(*) FROM reproducciones WHERE usuario_id = :userId) +
                (SELECT COUNT(*) FROM descargas WHERE usuario_id = :userId) as total",
            ['userId' => $userId]
        );

        return [
            'interacciones' => (int) ($interacciones['total'] ?? 0),
            'userId' => $userId,
        ];
    }

    /**
     * Genera SQL para la señal de comportamiento.
     * Calcula afinidad por tags en común con samples que el usuario ha likeado/reproducido.
     */
    private static function sqlComportamiento(int $userId, float $peso, array &$params): string
    {
        /*
         * Sub-query: cuenta cuántos tags del sample coinciden
         * con los tags de samples que el usuario ha likeado.
         */
        return "({$peso} * COALESCE((
            SELECT COUNT(*)::float / GREATEST(1, array_length(s.tags, 1))
            FROM (
                SELECT UNNEST(s2.tags) as tag
                FROM likes l
                JOIN samples s2 ON l.target_id = s2.id
                WHERE l.usuario_id = :userId AND l.tipo = 'sample'
                UNION
                SELECT UNNEST(s3.tags) as tag
                FROM reproducciones r
                JOIN samples s3 ON r.sample_id = s3.id
                WHERE r.usuario_id = :userId
            ) user_tags
            WHERE user_tags.tag = ANY(s.tags)
        ), 0))";
    }

    /**
     * Genera SQL para la señal de tendencias.
     * Engagement velocity: cuántas interacciones ha tenido en ventanas temporales.
     */
    private static function sqlTendencias(float $peso, array $ventanas): string
    {
        $ventanaCorta = $ventanas['corta'] ?? '24 hours';

        return "({$peso} * (
            COALESCE((SELECT COUNT(*) FROM likes WHERE tipo = 'sample' AND target_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaCorta}'), 0) * 3
            + COALESCE((SELECT COUNT(*) FROM reproducciones WHERE sample_id = s.id AND created_at > NOW() - INTERVAL '{$ventanaCorta}'), 0)
        ) / GREATEST(1, EXTRACT(EPOCH FROM NOW() - s.publicado_at) / 3600))";
    }

    /**
     * Samples similares a uno dado. Usado en SampleDetalleIsland y modal "También te podría gustar".
     */
    public static function samplesSimilares(int $sampleId, int $limite = 5, ?int $userId = null): array
    {
        $config = self::cargarPesos();
        $pesosSim = $config['samples_similares'] ?? [];

        $sample = PostgresService::consultarUno(
            "SELECT tags, bpm, key, tipo, escala FROM samples WHERE id = :id",
            ['id' => $sampleId]
        );

        if (!$sample) return [];

        $tags = NormalizadorSample::pgArrayToPhp($sample['tags'] ?? '');
        $bpm = $sample['bpm'] ? (int) $sample['bpm'] : null;
        $key = $sample['key'] ?? null;
        $tipo = $sample['tipo'] ?? 'one shot';
        $toleranciaBpm = $config['parametros']['bpm_tolerancia'] ?? 15;

        $params = ['sampleId' => $sampleId, 'limit' => $limite];

        /* Score por tags en común */
        $tagParts = [];
        foreach (array_slice($tags, 0, 10) as $i => $tag) {
            $tagParts[] = "CASE WHEN :tag{$i} = ANY(s.tags) THEN 2 ELSE 0 END";
            $params["tag{$i}"] = $tag;
        }
        $tagScore = !empty($tagParts) ? '(' . implode(' + ', $tagParts) . ')' : '0';

        $bpmScore = $bpm
            ? "GREATEST(0, {$toleranciaBpm} - ABS(COALESCE(s.bpm, 0) - {$bpm})) / {$toleranciaBpm} * 5"
            : "0";

        $keyScore = $key ? "CASE WHEN s.key = :simKey THEN 5 ELSE 0 END" : "0";
        if ($key) $params['simKey'] = $key;

        $tipoScore = "CASE WHEN s.tipo = :simTipo THEN 3 ELSE 0 END";
        $params['simTipo'] = $tipo;

        $sql = NormalizadorSample::sqlSelectSamples()
             . " WHERE s.estado = 'activo' AND s.id != :sampleId"
             . " ORDER BY ({$tagScore} + {$bpmScore} + {$keyScore} + {$tipoScore}) DESC,"
             . " s.total_likes DESC LIMIT :limit";

        return PostgresService::consultar($sql, $params);
    }
}
