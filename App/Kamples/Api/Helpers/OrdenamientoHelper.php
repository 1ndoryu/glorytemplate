<?php

/**
 * OrdenamientoHelper — Resolución centralizada de ORDER BY para listados de samples.
 *
 * Cada endpoint de listado (favoritos, descargas, coleccionados, colecciones)
 * usa una cláusula ORDER BY distinta para "recientes" (la fecha viene de tablas
 * diferentes). Este helper normaliza las opciones compartidas (nombre, populares, bpm)
 * y delega "recientes"/"posicion" al caller que conoce su contexto.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

use App\Config\Schema\_generated\SamplesCols;

class OrdenamientoHelper
{
    const ORDEN_RECIENTES = 'recientes';
    const ORDEN_NOMBRE = 'nombre';
    const ORDEN_POPULARES = 'populares';
    const ORDEN_BPM = 'bpm';
    const ORDEN_POSICION = 'posicion';

    /** Opciones válidas para whitelist */
    private const VALIDOS = [
        self::ORDEN_RECIENTES,
        self::ORDEN_NOMBRE,
        self::ORDEN_POPULARES,
        self::ORDEN_BPM,
        self::ORDEN_POSICION,
    ];

    /**
     * Sanitiza el valor de ordenamiento contra whitelist.
     * Retorna el valor saneado o el default si es inválido.
     */
    public static function sanitizar(string $orden, string $default = self::ORDEN_RECIENTES): string
    {
        $orden = \strtolower(\trim($orden));
        return \in_array($orden, self::VALIDOS, true) ? $orden : $default;
    }

    /**
     * Construye la cláusula ORDER BY.
     *
     * @param string $orden Valor saneado (usar sanitizar() antes)
     * @param string $clausulaRecientes ORDER BY específica para 'recientes' (varía por contexto)
     * @param string|null $clausulaPosicion ORDER BY específica para 'posicion' (solo colecciones)
     */
    public static function construirOrderBy(
        string $orden,
        string $clausulaRecientes,
        ?string $clausulaPosicion = null
    ): string {
        $titulo = 's.' . SamplesCols::TITULO;
        $likes = 's.' . SamplesCols::TOTAL_LIKES;
        $descargas = 's.' . SamplesCols::TOTAL_DESCARGAS;
        $bpm = 's.' . SamplesCols::BPM;

        switch ($orden) {
            case self::ORDEN_NOMBRE:
                return "{$titulo} ASC NULLS LAST";

            case self::ORDEN_POPULARES:
                return "({$likes} + {$descargas}) DESC";

            case self::ORDEN_BPM:
                return "{$bpm} ASC NULLS LAST";

            case self::ORDEN_POSICION:
                return $clausulaPosicion ?? $clausulaRecientes;

            default:
                return $clausulaRecientes;
        }
    }
}
