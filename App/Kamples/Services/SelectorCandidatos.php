<?php

/**
 * SelectorCandidatos — Etapa 1 del pipeline de feed para escalabilidad a 1M+ samples.
 *
 * En vez de evaluar TODOS los samples con scoring completo (O(N)),
 * pre-selecciona ~1000 candidatos via index scans rapidos (O(log N))
 * y luego el scoring se aplica solo sobre esos candidatos.
 *
 * 5 fuentes de candidatos:
 * 1. Trending recientes (14 dias, por engagement)
 * 2. Similares por embedding (ANN pgvector)
 * 3. De creadores seguidos
 * 4. Afinidad por tags del usuario
 * 5. Populares all-time
 *
 * Se activa cuando totalActivos > umbral_candidatos (default 5000).
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\FollowsCols;
use App\Config\Schema\_generated\LikesCols;
use App\Config\Schema\_generated\LikesEnums;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Services\ServicioCache;

class SelectorCandidatos
{
    private const CACHE_KEY_TOTAL = 'kamples_total_samples_activos';
    private const CACHE_TTL_TOTAL = 3600; /* 1 hora */

    /**
     * Cuenta samples activos. Cacheado en transient 1h.
     * Invalida al publicar/eliminar sample (llamar invalidarConteo()).
     */
    public static function contarActivos(): int
    {
        $cached = ServicioCache::obtener(self::CACHE_KEY_TOTAL);
        if ($cached !== false) {
            return (int) $cached;
        }

        $ts = SamplesCols::TABLA;
        $sEstado = SamplesCols::ESTADO;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;

        /* [193A-99] Parametrizar enum para evitar interpolación directa en SQL */
        $total = SamplesRepository::consultarValor(
            "SELECT COUNT(*) FROM {$ts} WHERE {$sEstado} = :estado",
            ['estado' => $eActivo]
        );

        $resultado = (int) ($total ?? 0);
        ServicioCache::guardar(self::CACHE_KEY_TOTAL, $resultado, self::CACHE_TTL_TOTAL);
        return $resultado;
    }

    /**
     * Invalida el conteo cacheado de samples activos.
     * Llamar al publicar o eliminar un sample.
     */
    public static function invalidarConteo(): void
    {
        ServicioCache::eliminar(self::CACHE_KEY_TOTAL);
    }

    /**
     * Genera el CTE SQL de candidatos para el pipeline de dos etapas.
     *
     * @param int $userId ID del usuario
     * @param array $perfilUsuario Perfil del usuario (de PerfilUsuario::construir)
     * @param array &$params Parametros PDO de la query principal
     * @param array $config Configuracion del algoritmo (algoritmoPesos.php)
     * @return string Fragmento SQL "candidatos AS (...)" para inyectar en el WITH
     */
    public static function seleccionar(int $userId, array $perfilUsuario, array &$params, array $config): string
    {
        $candidatosConfig = $config['candidatos'] ?? [];
        $maxTrending = (int) ($candidatosConfig['max_trending'] ?? 300);
        $maxEmbedding = (int) ($candidatosConfig['max_embedding'] ?? 200);
        $maxSeguidos = (int) ($candidatosConfig['max_seguidos'] ?? 200);
        $maxTags = (int) ($candidatosConfig['max_tags'] ?? 200);
        $maxPopulares = (int) ($candidatosConfig['max_populares'] ?? 100);
        $diasTrending = (int) ($candidatosConfig['dias_trending'] ?? 14);

        /* Whitelist para intervalo (seguridad: no interpolar directamente) */
        $intervaloDias = \in_array($diasTrending, [7, 14, 30, 60, 90], true) ? $diasTrending : 14;

        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $sEstado = SamplesCols::ESTADO;
        $sCreadorId = SamplesCols::CREADOR_ID;
        $sPubAt = SamplesCols::PUBLICADO_AT;
        $sTotLikes = SamplesCols::TOTAL_LIKES;
        $sTotRepro = SamplesCols::TOTAL_REPRODUCCIONES;
        $sTotDesc = SamplesCols::TOTAL_DESCARGAS;
        $sEmbed = SamplesCols::EMBEDDING;
        $sTags = SamplesCols::TAGS;
        $eActivo = SamplesEnums::ESTADO_ACTIVO;

        $tf = FollowsCols::TABLA;
        $fSeguidorId = FollowsCols::SEGUIDOR_ID;
        $fSeguidoId = FollowsCols::SEGUIDO_ID;

        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;

        /* [193A-99] Parametrizar enum y LIMITs — los valores vienen de constantes generadas
         * pero la buena práctica es no interpolar nunca directamente en SQL. */
        $params['candEstado'] = $eActivo;
        $params['candMaxTrending'] = $maxTrending;
        $params['candMaxEmbedding'] = $maxEmbedding;
        $params['candMaxSeguidos'] = $maxSeguidos;
        $params['candMaxTags'] = $maxTags;
        $params['candMaxPopulares'] = $maxPopulares;

        $partes = [];

        /* Fuente 1: Trending recientes (ultimos N dias, por engagement score) */
        /* @codeSentinel-ignore INTERVAL — $intervaloDias validado con whitelist linea 92 */
        $partes[] = "(SELECT s.{$sId} AS id
            FROM {$ts} s
            WHERE s.{$sEstado} = :candEstado
            AND s.{$sPubAt} > NOW() - INTERVAL '{$intervaloDias} days'
            ORDER BY (s.{$sTotLikes} * 2 + s.{$sTotRepro} + s.{$sTotDesc} * 3) DESC
            LIMIT :candMaxTrending)";

        /* Fuente 2: Similares por embedding (ANN search pgvector) */
        $perfilVector = $params['userProfileVector'] ?? null;
        if ($perfilVector !== null) {
            $partes[] = "(SELECT s.{$sId} AS id
                FROM {$ts} s
                WHERE s.{$sEstado} = :candEstado
                AND s.{$sEmbed} IS NOT NULL
                ORDER BY s.{$sEmbed} <=> :userProfileVector::vector
                LIMIT :candMaxEmbedding)";
        }

        /* Fuente 3: De creadores seguidos (ultimos por publicacion) */
        $partes[] = "(SELECT s.{$sId} AS id
            FROM {$ts} s
            WHERE s.{$sEstado} = :candEstado
            AND s.{$sCreadorId} IN (
                SELECT {$fSeguidoId} FROM {$tf} WHERE {$fSeguidorId} = :userId
            )
            ORDER BY s.{$sPubAt} DESC
            LIMIT :candMaxSeguidos)";

        /* Fuente 4: Afinidad por tags (overlap con top tags del usuario) */
        $topTags = self::obtenerTopTagsUsuario($userId, $perfilUsuario);
        if (!empty($topTags)) {
            $placeholders = [];
            foreach ($topTags as $i => $tag) {
                $key = "candidatoTag{$i}";
                $params[$key] = strtolower($tag);
                $placeholders[] = ":{$key}";
            }
            $listaTags = implode(', ', $placeholders);
            $partes[] = "(SELECT s.{$sId} AS id
                FROM {$ts} s
                WHERE s.{$sEstado} = :candEstado
                AND s.{$sTags} && ARRAY[{$listaTags}]::text[]
                ORDER BY s.{$sPubAt} DESC
                LIMIT :candMaxTags)";
        }

        /* Fuente 5: Populares all-time (por engagement global) */
        $partes[] = "(SELECT s.{$sId} AS id
            FROM {$ts} s
            WHERE s.{$sEstado} = :candEstado
            ORDER BY (s.{$sTotLikes} + s.{$sTotRepro} + s.{$sTotDesc}) DESC
            LIMIT :candMaxPopulares)";

        /* UNION elimina duplicados automaticamente */
        $unionSql = implode("\n            UNION\n            ", $partes);

        return "candidatos AS (\n            {$unionSql}\n        )";
    }

    /**
     * Obtiene los top N tags del usuario basandose en sus likes y generos declarados.
     * Usado para la fuente de candidatos por afinidad de tags.
     *
     * @return string[] Array de tags (lowercase, max 10)
     */
    private static function obtenerTopTagsUsuario(int $userId, array $perfilUsuario): array
    {
        $tags = [];

        /* Incluir generos declarados del onboarding */
        $generosDeclarados = $perfilUsuario['generosDeclarados'] ?? [];
        foreach ($generosDeclarados as $g) {
            $tags[] = strtolower(trim($g));
        }

        /* Obtener tags de los samples mas likeados del usuario (rapido, solo ARRAY_AGG) */
        $tl = LikesCols::TABLA;
        $lUid = LikesCols::USUARIO_ID;
        $lTipo = LikesCols::TIPO;
        $lTarget = LikesCols::TARGET_ID;
        $lReacc = LikesCols::REACCION;
        $ltSample = LikesEnums::TIPO_SAMPLE;
        $lrLike = LikesEnums::REACCION_LIKE;
        $lrEncanta = LikesEnums::REACCION_ENCANTA;
        $ts = SamplesCols::TABLA;
        $sId = SamplesCols::ID;
        $sTags = SamplesCols::TAGS;

        try {
            /* [193A-99] Parametrizar enums en query de tags del usuario */
            $resultado = SamplesRepository::consultarValor(
                "SELECT ARRAY_AGG(DISTINCT t ORDER BY t) FROM (
                    SELECT UNNEST(s.{$sTags}) AS t
                    FROM {$tl} l
                    JOIN {$ts} s ON l.{$lTarget} = s.{$sId}
                    WHERE l.{$lUid} = :userId
                    AND l.{$lTipo} = :tipoSample
                    AND l.{$lReacc} IN (:reacLike, :reacEncanta)
                    LIMIT 50
                ) sub
                LIMIT 1",
                [
                    'userId' => $userId,
                    'tipoSample' => $ltSample,
                    'reacLike' => $lrLike,
                    'reacEncanta' => $lrEncanta,
                ]
            );

            if (!empty($resultado) && $resultado !== '{}') {
                /* PG retorna array como {tag1,tag2,...} */
                $pgTags = trim($resultado, '{}');
                if ($pgTags !== '') {
                    foreach (explode(',', $pgTags) as $t) {
                        $tags[] = strtolower(trim($t, '" '));
                    }
                }
            }
        } catch (\Throwable $e) {
            /* Si falla la query de tags, continuar sin esta fuente */
        }

        /* Deduplicar y limitar a 10 */
        return array_slice(array_unique(array_filter($tags)), 0, 10);
    }
}
