<?php

namespace App\Kamples\Api\Helpers;

use App\Kamples\KamplesLogger;

class GroqVisionReferenciaResolver
{
    public static function resolver(string $referenciaImagen, string $etiquetaLog): ?string
    {
        $referenciaLimpia = \trim($referenciaImagen);
        if ($referenciaLimpia === '') {
            return null;
        }

        if (\str_starts_with($referenciaLimpia, 'data:image/')) {
            return $referenciaLimpia;
        }

        if (self::esUrlPublica($referenciaLimpia)) {
            return $referenciaLimpia;
        }

        $rutaLocal = self::resolverRutaLocal($referenciaLimpia);
        if ($rutaLocal === null) {
            KamplesLogger::warning($etiquetaLog . ': Imagen no accesible para Groq', [
                'referencia' => $referenciaLimpia,
            ]);
            return null;
        }

        return GroqVisionDataUrlBuilder::construir($rutaLocal, $etiquetaLog);
    }

    private static function esUrlPublica(string $referenciaImagen): bool
    {
        if (!\preg_match('/^https?:\/\//i', $referenciaImagen)) {
            return false;
        }

        $host = \parse_url($referenciaImagen, PHP_URL_HOST);
        if (!\is_string($host) || $host === '') {
            return false;
        }

        $host = \strtolower($host);
        if ($host === 'localhost' || \str_ends_with($host, '.local')) {
            return false;
        }

        if (\filter_var($host, FILTER_VALIDATE_IP) !== false) {
            return \filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false;
        }

        return true;
    }

    private static function resolverRutaLocal(string $referenciaImagen): ?string
    {
        if (self::pareceRutaLocal($referenciaImagen)) {
            $rutaNormalizada = \wp_normalize_path($referenciaImagen);
            return \is_file($rutaNormalizada) ? $rutaNormalizada : null;
        }

        if (!\preg_match('/^https?:\/\//i', $referenciaImagen)) {
            return null;
        }

        $uploadDir = \wp_upload_dir();
        $basedir = \wp_normalize_path((string) ($uploadDir['basedir'] ?? ''));
        $baseurl = \rtrim((string) ($uploadDir['baseurl'] ?? ''), '/');
        if ($basedir === '' || $baseurl === '') {
            return null;
        }

        if (\str_starts_with($referenciaImagen, $baseurl . '/')) {
            $relativa = \ltrim((string) \substr($referenciaImagen, \strlen($baseurl)), '/');
            $ruta = \wp_normalize_path($basedir . '/' . $relativa);
            return \is_file($ruta) ? $ruta : null;
        }

        $rutaUrl = \parse_url($referenciaImagen, PHP_URL_PATH);
        if (!\is_string($rutaUrl) || $rutaUrl === '') {
            return null;
        }

        $posicionMarcador = \strpos($rutaUrl, '/wp-content/uploads/');
        if ($posicionMarcador === false) {
            return null;
        }

        $relativa = \ltrim((string) \substr($rutaUrl, $posicionMarcador + 20), '/');
        $ruta = \wp_normalize_path($basedir . '/' . $relativa);
        return \is_file($ruta) ? $ruta : null;
    }

    private static function pareceRutaLocal(string $referenciaImagen): bool
    {
        return \preg_match('/^[a-zA-Z]:\\\\/', $referenciaImagen) === 1
            || \str_starts_with($referenciaImagen, '/')
            || \str_starts_with($referenciaImagen, '\\\\');
    }
}