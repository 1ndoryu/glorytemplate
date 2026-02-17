<?php

/**
 * Validador — Limites y validaciones centralizadas de contenido.
 *
 * Centraliza las reglas de tamaño, formato y limites para todas las entidades.
 * Nunca confiar solo en validaciones del frontend.
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Helpers;

class Validador
{
    /* Limites de longitud de texto */
    public const MAX_COMENTARIO = 2000;
    public const MAX_PUBLICACION = 5000;
    public const MAX_MENSAJE = 5000;
    public const MAX_BIO = 500;
    public const MAX_NOMBRE_VISIBLE = 100;
    public const MAX_TITULO_SAMPLE = 200;
    public const MAX_DESCRIPCION_SAMPLE = 2000;
    public const MAX_USERNAME = 30;
    public const MIN_USERNAME = 3;
    public const MIN_PASSWORD = 6;
    public const MAX_PASSWORD = 128;

    /* Limites de tags */
    public const MAX_TAGS_CANTIDAD = 20;
    public const MAX_TAG_LONGITUD = 50;
    public const MIN_TAGS = 2;

    /* Limites de imagenes por publicacion */
    public const MAX_IMAGENES_PUBLICACION = 10;

    /* Limites de colecciones */
    public const MAX_NOMBRE_COLECCION = 100;
    public const MAX_DESCRIPCION_COLECCION = 500;

    /**
     * Valida un texto contra un limite maximo de longitud.
     *
     * @param string $texto Texto a validar
     * @param int $maximo Longitud maxima permitida
     * @param string $campo Nombre del campo para el mensaje de error
     * @return string|null null si es valido, mensaje de error si excede
     */
    public static function validarLongitud(string $texto, int $maximo, string $campo): ?string
    {
        if (mb_strlen($texto) > $maximo) {
            return "{$campo} excede el límite de {$maximo} caracteres.";
        }
        return null;
    }

    /**
     * Valida un texto requerido contra longitud minima y maxima.
     */
    public static function validarTextoRequerido(string $texto, int $minimo, int $maximo, string $campo): ?string
    {
        $longitud = mb_strlen($texto);
        if ($longitud < $minimo) {
            return "{$campo} debe tener al menos {$minimo} caracteres.";
        }
        if ($longitud > $maximo) {
            return "{$campo} excede el límite de {$maximo} caracteres.";
        }
        return null;
    }

    /**
     * Valida un array de tags.
     */
    public static function validarTags(array $tags): ?string
    {
        if (count($tags) < self::MIN_TAGS) {
            return 'Se requieren al menos ' . self::MIN_TAGS . ' tags.';
        }
        if (count($tags) > self::MAX_TAGS_CANTIDAD) {
            return 'Máximo ' . self::MAX_TAGS_CANTIDAD . ' tags permitidos.';
        }
        foreach ($tags as $tag) {
            if (mb_strlen($tag) > self::MAX_TAG_LONGITUD) {
                return "El tag \"{$tag}\" excede los " . self::MAX_TAG_LONGITUD . ' caracteres.';
            }
        }
        return null;
    }

    /**
     * Valida un array de URLs de imagenes.
     */
    public static function validarImagenesUrls(array $imagenes): ?string
    {
        if (count($imagenes) > self::MAX_IMAGENES_PUBLICACION) {
            return 'Máximo ' . self::MAX_IMAGENES_PUBLICACION . ' imágenes por publicación.';
        }
        foreach ($imagenes as $url) {
            if (!\filter_var($url, \FILTER_VALIDATE_URL)) {
                return 'Una de las URLs de imagen no es válida.';
            }
        }
        return null;
    }

    /**
     * Valida username para registro.
     */
    public static function validarUsername(string $username): ?string
    {
        $longitud = mb_strlen($username);
        if ($longitud < self::MIN_USERNAME) {
            return 'El nombre de usuario debe tener al menos ' . self::MIN_USERNAME . ' caracteres.';
        }
        if ($longitud > self::MAX_USERNAME) {
            return 'El nombre de usuario no puede exceder ' . self::MAX_USERNAME . ' caracteres.';
        }
        /* Solo alfanuméricos, guiones y guiones bajos */
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
            return 'El nombre de usuario solo puede contener letras, números, guiones y guiones bajos.';
        }
        return null;
    }

    /**
     * Devuelve WP_REST_Response 400 con el error, o null si todo es valido.
     * Atajo para uso rapido en controladores.
     */
    public static function respuestaError(string $mensaje): \WP_REST_Response
    {
        return new \WP_REST_Response([
            'code'    => 'validacion_fallida',
            'message' => $mensaje,
        ], 400);
    }
}
