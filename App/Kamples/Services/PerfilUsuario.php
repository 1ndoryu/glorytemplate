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

use App\Kamples\Database\Repositories\UsuariosExtRepository;

class PerfilUsuario
{
    /**
     * Construye el perfil de preferencias del usuario.
     * Extrae: BPM promedio, keys más usadas, géneros favoritos, tipo preferido.
     */
    public static function construir(int $userId): array
    {
        /* Contar interacciones totales */
        $total = UsuariosExtRepository::contarInteracciones($userId);

        if ($total === 0) {
            return ['interacciones' => 0, 'userId' => $userId];
        }

        return [
            'interacciones' => $total,
            'userId'        => $userId,
            'bpmProm'       => UsuariosExtRepository::bpmPromedio($userId) ?? 0,
            'keyFav'        => UsuariosExtRepository::keyFavorita($userId),
            'tipoFav'       => UsuariosExtRepository::tipoFavorito($userId),
            'creadoresFav'  => self::obtenerCreadoresFavoritos($userId),
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
}
