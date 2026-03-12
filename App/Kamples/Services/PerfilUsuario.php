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

use App\Config\Schema\_generated\UsuariosExtCols;
use App\Kamples\Database\Repositories\UsuariosExtRepository;

class PerfilUsuario
{
    /**
     * Construye el perfil de preferencias del usuario.
     * Extrae: BPM promedio, keys más usadas, géneros favoritos, tipo preferido.
     * Incluye géneros declarados (onboarding) como señal suplementaria.
     */
    public static function construir(int $userId): array
    {
        /* Contar interacciones totales */
        $total = UsuariosExtRepository::contarInteracciones($userId);

        /* Cargar generos declarados del onboarding (siempre, independiente de interacciones) */
        $generosDeclarados = self::obtenerGenerosDeclarados($userId);

        if ($total === 0) {
            return ['interacciones' => 0, 'userId' => $userId, 'generosDeclarados' => $generosDeclarados];
        }

        return [
            'interacciones'     => $total,
            'userId'            => $userId,
            'bpmProm'           => UsuariosExtRepository::bpmPromedio($userId) ?? 0,
            'keyFav'            => UsuariosExtRepository::keyFavorita($userId),
            'escalaFav'         => UsuariosExtRepository::escalaFavorita($userId),
            'tipoFav'           => UsuariosExtRepository::tipoFavorito($userId),
            'creadoresFav'      => self::obtenerCreadoresFavoritos($userId),
            'generosDeclarados' => $generosDeclarados,
        ];
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
