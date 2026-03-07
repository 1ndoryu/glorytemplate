<?php

/**
 * JsonHelper — Decodificación segura de JSON con verificación de errores.
 *
 * Centraliza la verificación de json_last_error() para evitar que datos
 * corruptos se propaguen silenciosamente como null o array vacío.
 *
 * Uso:
 *   $data = JsonHelper::decode($string);           // null si error
 *   $data = JsonHelper::decodeOrDefault($str, []); // [] si error
 *
 * @package App\Helpers
 */

namespace App\Helpers;

class JsonHelper
{
    /**
     * Decodificar JSON con verificación de error.
     *
     * @return mixed Datos decodificados, o null si el JSON es inválido.
     */
    public static function decode(string $json, bool $assoc = true): mixed
    {
        $result = \json_decode($json, $assoc);

        if (\json_last_error() !== \JSON_ERROR_NONE) {
            \error_log(
                '[JsonHelper] json_decode error: ' . \json_last_error_msg()
                . ' — snippet: ' . \mb_substr($json, 0, 200)
            );
            return null;
        }

        return $result;
    }

    /**
     * Decodificar JSON con fallback explícito.
     * A diferencia de `?? $default`, detecta y registra errores reales
     * en lugar de enmascarar datos corruptos.
     *
     * @param mixed $default Valor a retornar si el JSON es inválido.
     * @return mixed Datos decodificados, o $default si el JSON es inválido.
     */
    public static function decodeOrDefault(string $json, mixed $default = [], bool $assoc = true): mixed
    {
        $result = \json_decode($json, $assoc);

        if (\json_last_error() !== \JSON_ERROR_NONE) {
            \error_log(
                '[JsonHelper] json_decode error: ' . \json_last_error_msg()
                . ' — snippet: ' . \mb_substr($json, 0, 200)
            );
            return $default;
        }

        return $result ?? $default;
    }
}
