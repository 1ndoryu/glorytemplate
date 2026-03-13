<?php

/**
 * UrlHelper — Normalización de URLs internas del sitio.
 *
 * Cuando el dominio del sitio cambia (ej: de sslip.io a kamples.com),
 * las URLs absolutas almacenadas en BD quedan obsoletas. Esta clase
 * centraliza la normalización para que cualquier URL interna
 * devuelva siempre el dominio actual del sitio.
 *
 * @package App\Helpers
 */

namespace App\Helpers;

class UrlHelper
{
    /*
     * Dominios internos históricos conocidos que deben reemplazarse.
     * Si el sitio migra de dominio nuevamente, agregar el viejo aquí.
     */
    private const DOMINIOS_LEGACY = [
        'wordpress-mo4so4440c488g8woow4cow0.66.94.100.241.sslip.io',
    ];

    /* Patrón de ruta interna que indica URL del sitio (uploads, themes, etc.) */
    private const PATRON_RUTA_INTERNA = '/wp-content/';

    /*
     * Normaliza una URL interna para usar el dominio actual del sitio.
     *
     * Si la URL contiene un dominio legacy y una ruta interna de WordPress,
     * reemplaza scheme+host por el home_url() actual. Si la URL es externa
     * (Gravatar, Google, etc.), la retorna sin modificar.
     *
     * @param string|null $url URL a normalizar
     * @return string|null URL normalizada o null si la entrada era null
     */
    public static function normalizar(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return $url;
        }

        /* Solo normalizar URLs que contienen rutas internas de WP */
        if (strpos($url, self::PATRON_RUTA_INTERNA) === false) {
            return $url;
        }

        $parsedUrl = parse_url($url);
        if (!isset($parsedUrl['host'])) {
            return $url;
        }

        $hostActual = parse_url(home_url(), PHP_URL_HOST);
        if ($parsedUrl['host'] === $hostActual) {
            /* Asegurar HTTPS si el sitio actual usa HTTPS */
            if (is_ssl() && strpos($url, 'http://') === 0) {
                return 'https://' . substr($url, 7);
            }
            return $url;
        }

        /* Verificar si es un dominio legacy conocido */
        $esLegacy = in_array($parsedUrl['host'], self::DOMINIOS_LEGACY, true);
        if (!$esLegacy) {
            return $url;
        }

        /* Reconstruir URL con el dominio actual */
        $scheme = is_ssl() ? 'https' : 'http';
        $path = $parsedUrl['path'] ?? '';
        $query = isset($parsedUrl['query']) ? '?' . $parsedUrl['query'] : '';
        $fragment = isset($parsedUrl['fragment']) ? '#' . $parsedUrl['fragment'] : '';

        return "{$scheme}://{$hostActual}{$path}{$query}{$fragment}";
    }

    /*
     * Normaliza múltiples URLs (para arrays de imágenes, etc.).
     *
     * @param array|null $urls Array de URLs
     * @return array|null Array normalizado o null
     */
    public static function normalizarArray(?array $urls): ?array
    {
        if ($urls === null) {
            return null;
        }

        return array_map([self::class, 'normalizar'], $urls);
    }

    /*
     * Normaliza URLs dentro de un string JSON (para campos JSONB con URLs embebidas).
     * Reemplaza todas las ocurrencias de dominios legacy por el actual.
     *
     * @param string|null $json String JSON con posibles URLs legacy
     * @return string|null JSON con URLs normalizadas
     */
    public static function normalizarJson(?string $json): ?string
    {
        if ($json === null || $json === '') {
            return $json;
        }

        $hostActual = parse_url(home_url(), PHP_URL_HOST);
        $scheme = is_ssl() ? 'https' : 'http';

        $resultado = $json;
        foreach (self::DOMINIOS_LEGACY as $legacy) {
            $resultado = str_replace(
                ["https://{$legacy}", "http://{$legacy}"],
                ["{$scheme}://{$hostActual}", "{$scheme}://{$hostActual}"],
                $resultado
            );
        }

        return $resultado;
    }
}
