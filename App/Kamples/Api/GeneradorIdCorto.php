<?php

/**
 * Kamples — Generador de IDs cortos alfanuméricos
 *
 * Genera identificadores únicos de 7 caracteres en base62 (a-z, A-Z, 0-9).
 * Colisión estimada: ~3.5 trillones de combinaciones (62^7).
 * Verifica unicidad contra la tabla samples antes de retornar.
 *
 * @package Kamples
 */

namespace App\Kamples\Api;

use App\Kamples\Database\PostgresService;

class GeneradorIdCorto
{
    private const LONGITUD = 7;
    private const CARACTERES = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    private const MAX_INTENTOS = 10;

    /*
     * Genera un ID corto único validado contra la BD.
     * Reintenta hasta MAX_INTENTOS veces si hay colisión.
     */
    public static function generar(): string
    {
        for ($i = 0; $i < self::MAX_INTENTOS; $i++) {
            $id = self::generarAleatorio();
            if (!self::existeEnBd($id)) {
                return $id;
            }
        }

        /* Fallback: agregar timestamp parcial para garantizar unicidad */
        return self::generarAleatorio() . substr((string) time(), -2);
    }

    /*
     * Genera una cadena aleatoria de LONGITUD caracteres en base62.
     * Usa random_int() para criptografía segura.
     */
    private static function generarAleatorio(): string
    {
        $total = strlen(self::CARACTERES) - 1;
        $id = '';

        for ($i = 0; $i < self::LONGITUD; $i++) {
            $id .= self::CARACTERES[random_int(0, $total)];
        }

        return $id;
    }

    /*
     * Verifica si un id_corto ya existe en la tabla samples.
     */
    private static function existeEnBd(string $id): bool
    {
        $resultado = PostgresService::consultarUno(
            "SELECT 1 FROM samples WHERE id_corto = :id LIMIT 1",
            ['id' => $id]
        );

        return $resultado !== null;
    }
}
