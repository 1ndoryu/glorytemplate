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
 * Opt-1 (QK17): Cache en WP transient (30 min). El perfil se invalida solo
 * cuando PlanificadorAlgoritmo dispara recalculo rapido o preciso, no en
 * cada cache miss del feed. Unifica 7 queries en 2 via perfilCompletoParaAlgoritmo.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;

class PerfilUsuario
{
    private const CACHE_PREFIX = 'kamples_perfil_usr_';
    private const CACHE_TTL = 1800; /* 30 minutos */

    /**
     * Construye el perfil de preferencias del usuario.
     * Usa cache WP transient para evitar 7 queries en cada cache miss del feed.
     * La CTE unificada reduce a 2 roundtrips (perfil base + creadores favoritos).
     */
    public static function construir(int $userId): array
    {
        /* Intentar leer de cache */
        $cacheKey = self::CACHE_PREFIX . $userId;
        $cached = \get_transient($cacheKey);
        if ($cached !== false && \is_array($cached)) {
            return $cached;
        }

        /* Cargar generos declarados del onboarding (siempre, independiente de interacciones) */
        $generosDeclarados = self::obtenerGenerosDeclarados($userId);

        /* Query unificada: 7 queries → 1 CTE (interacciones + bpm + key + escala + tipo) */
        $datos = UsuariosExtRepository::perfilCompletoParaAlgoritmo($userId);

        if ($datos['interacciones'] === 0) {
            $resultado = ['interacciones' => 0, 'userId' => $userId, 'generosDeclarados' => $generosDeclarados];
            \set_transient($cacheKey, $resultado, self::CACHE_TTL);
            return $resultado;
        }

        /* Creadores favoritos: query separada (3 UNION ALL, estructura diferente a la CTE base) */
        $creadoresFav = UsuariosExtRepository::obtenerCreadoresFavoritos($userId);

        $resultado = [
            'interacciones'     => $datos['interacciones'],
            'userId'            => $userId,
            'bpmProm'           => $datos['bpmProm'] ?? 0,
            'keyFav'            => $datos['keyFav'],
            'escalaFav'         => $datos['escalaFav'],
            'tipoFav'           => $datos['tipoFav'],
            'creadoresFav'      => $creadoresFav,
            'generosDeclarados' => $generosDeclarados,
        ];

        \set_transient($cacheKey, $resultado, self::CACHE_TTL);
        return $resultado;
    }

    /**
     * Invalida el cache del perfil de un usuario.
     * Llamar desde PlanificadorAlgoritmo al disparar recalculo rapido o preciso.
     */
    public static function invalidarCache(int $userId): void
    {
        \delete_transient(self::CACHE_PREFIX . $userId);
    }

    /**
     * Obtiene los top 5 creadores con más interacciones positivas del usuario.
     * Combina likes (encanta=2, like=1) + reproducciones + descargas.
     */
    public static function obtenerCreadoresFavoritos(int $userId): array
    {
        return UsuariosExtRepository::obtenerCreadoresFavoritos($userId);
    }

    /**
     * Carga los generos declarados por el usuario en onboarding.
     * Retorna array de strings (generos en minuscula) o vacio.
     */
    private static function obtenerGenerosDeclarados(int $userId): array
    {
        $raw = UsuariosExtRepository::obtenerCampo($userId, UsuariosExtCols::GENEROS_FAVORITOS);
        if (!$raw || !is_string($raw)) return [];
        $decoded = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) return [];
        return array_values($decoded);
    }
}
