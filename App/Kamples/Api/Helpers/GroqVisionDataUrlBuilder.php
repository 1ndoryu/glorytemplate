<?php

namespace App\Kamples\Api\Helpers;

use App\Kamples\KamplesLogger;

class GroqVisionDataUrlBuilder
{
    private const MAX_TAMANO_ARCHIVO_BYTES = 3000000;

    public static function construir(string $rutaArchivo, string $etiquetaLog): ?string
    {
        try {
            if (!\is_readable($rutaArchivo)) {
                KamplesLogger::warning($etiquetaLog . ': Imagen local no legible para Groq', ['ruta' => $rutaArchivo]);
                return null;
            }

            $tamano = \filesize($rutaArchivo);
            if (!\is_int($tamano) || $tamano <= 0) {
                KamplesLogger::warning($etiquetaLog . ': Imagen local vacía o sin tamaño válido', ['ruta' => $rutaArchivo]);
                return null;
            }

            if ($tamano > self::MAX_TAMANO_ARCHIVO_BYTES) {
                KamplesLogger::warning($etiquetaLog . ': Imagen local excede límite seguro para base64 Groq', [
                    'ruta' => $rutaArchivo,
                    'tamanoBytes' => $tamano,
                    'limiteBytes' => self::MAX_TAMANO_ARCHIVO_BYTES,
                ]);
                return null;
            }

            $contenido = \file_get_contents($rutaArchivo);
            if ($contenido === false) {
                KamplesLogger::error($etiquetaLog . ': Falló lectura de imagen local para Groq', ['ruta' => $rutaArchivo]);
                return null;
            }

            $mime = self::detectarMimeImagen($rutaArchivo);
            if (!\str_starts_with($mime, 'image/')) {
                KamplesLogger::warning($etiquetaLog . ': Archivo no es imagen compatible para Groq', [
                    'ruta' => $rutaArchivo,
                    'mime' => $mime,
                ]);
                return null;
            }

            return 'data:' . $mime . ';base64,' . \base64_encode($contenido);
        } catch (\Throwable $e) {
            KamplesLogger::error($etiquetaLog . ': Error preparando data URL para Groq', [
                'ruta' => $rutaArchivo,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private static function detectarMimeImagen(string $rutaArchivo): string
    {
        if (\function_exists('mime_content_type')) {
            $mime = \mime_content_type($rutaArchivo);
            if (\is_string($mime) && $mime !== '') {
                return $mime;
            }
        }

        $finfo = \finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            try {
                $mime = \finfo_file($finfo, $rutaArchivo);
                if (\is_string($mime) && $mime !== '') {
                    return $mime;
                }
            } finally {
                \finfo_close($finfo);
            }
        }

        return 'application/octet-stream';
    }
}