<?php

/*
 * Servicio centralizado de gestión de medios.
 * Optimización de imágenes por contexto, limpieza de archivos media.
 * QQ56: calidad por contexto (publicación 70%, comentario 50%, mensaje 40%).
 */

namespace App\Kamples\Servicios;

use App\Kamples\KamplesLogger;
use App\Kamples\Database\PostgresService;

final class ServicioMedia
{
    /* Calidades por contexto — porcentaje de compresión JPEG/WebP */
    const CALIDAD_PUBLICACION = 70;
    const CALIDAD_COMENTARIO  = 50;
    const CALIDAD_MENSAJE     = 40;
    const CALIDAD_AVATAR      = 70;

    /* Dimensiones máximas por contexto (ancho × alto) */
    const DIMENSION_PUBLICACION = 1920;
    const DIMENSION_COMENTARIO  = 1280;
    const DIMENSION_MENSAJE     = 1024;
    const DIMENSION_AVATAR      = 400;

    /**
     * Optimiza una imagen en disco según el contexto de uso.
     * Soporta JPEG, PNG (convertido a JPEG), WebP.
     * Redimensiona si excede la dimensión máxima del contexto.
     *
     * @return bool true si la imagen fue optimizada
     */
    public static function optimizarImagen(string $ruta, int $calidad, int $dimensionMax = 1920): bool
    {
        if (!file_exists($ruta) || !is_readable($ruta)) {
            return false;
        }

        try {
            $info = getimagesize($ruta);
            if ($info === false) return false;

            $tipo = $info[2];
            $anchoOriginal = $info[0];
            $altoOriginal = $info[1];

            $imagen = self::crearImagenDesdeArchivo($ruta, $tipo);
            if ($imagen === null) return false;

            /* Redimensionar si excede dimensiones máximas */
            $nuevoAncho = $anchoOriginal;
            $nuevoAlto = $altoOriginal;
            $redimensionar = false;

            if ($anchoOriginal > $dimensionMax || $altoOriginal > $dimensionMax) {
                $ratio = min($dimensionMax / $anchoOriginal, $dimensionMax / $altoOriginal);
                $nuevoAncho = (int) round($anchoOriginal * $ratio);
                $nuevoAlto = (int) round($altoOriginal * $ratio);
                $redimensionar = true;
            }

            if ($redimensionar) {
                $nueva = imagecreatetruecolor($nuevoAncho, $nuevoAlto);
                if ($nueva === false) {
                    imagedestroy($imagen);
                    return false;
                }

                /* Preservar transparencia en PNG → convertir a fondo blanco para JPEG */
                $blanco = imagecolorallocate($nueva, 255, 255, 255);
                if ($blanco !== false) {
                    imagefill($nueva, 0, 0, $blanco);
                }

                imagecopyresampled($nueva, $imagen, 0, 0, 0, 0, $nuevoAncho, $nuevoAlto, $anchoOriginal, $altoOriginal);
                imagedestroy($imagen);
                $imagen = $nueva;
            }

            /* Guardar como JPEG optimizado (reemplaza el archivo original) */
            $resultado = imagejpeg($imagen, $ruta, $calidad);
            imagedestroy($imagen);

            return $resultado;
        } catch (\Throwable $e) {
            KamplesLogger::warning('ServicioMedia: error optimizando imagen', [
                'ruta' => $ruta,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Elimina un archivo dado su URL relativa o absoluta.
     * Convierte URLs HTTP a rutas de filesystem.
     *
     * @return bool true si el archivo fue eliminado o no existía
     */
    public static function eliminarDesdeUrl(?string $mediaUrl): bool
    {
        if (empty($mediaUrl)) return true;

        $ruta = self::urlARuta($mediaUrl);
        if ($ruta === null) return true;

        if (!file_exists($ruta)) return true;

        try {
            return unlink($ruta);
        } catch (\Throwable $e) {
            KamplesLogger::warning('ServicioMedia: error eliminando archivo', [
                'ruta' => $ruta,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Limpia todos los archivos media de comentarios asociados a un target.
     * Útil para cascada al eliminar sample/publicación.
     *
     * @param string $tipoTarget tipo del comentario ('sample', 'publicacion', etc.)
     * @param int $targetId ID del target
     * @return int cantidad de archivos eliminados
     */
    public static function limpiarMediaComentarios(string $tipoTarget, int $targetId): int
    {
        $eliminados = 0;
        try {
            $sql = "SELECT media_url FROM comentarios WHERE tipo = :tipo AND target_id = :target AND media_url IS NOT NULL";
            $rows = PostgresService::consultar($sql, [
                'tipo' => $tipoTarget,
                'target' => $targetId,
            ]);

            foreach ($rows as $row) {
                if (self::eliminarDesdeUrl($row['media_url'])) {
                    $eliminados++;
                }
            }
        } catch (\Throwable $e) {
            KamplesLogger::warning('ServicioMedia: error limpiando media comentarios', [
                'tipo' => $tipoTarget,
                'targetId' => $targetId,
                'error' => $e->getMessage(),
            ]);
        }

        return $eliminados;
    }

    /**
     * Limpia imágenes de una publicación (campo imagenes como PG array de URLs).
     */
    public static function limpiarImagenesPublicacion(?string $imagenesRaw): int
    {
        if (empty($imagenesRaw) || $imagenesRaw === '{}') return 0;

        $eliminados = 0;
        /* PG array format: {url1,url2} */
        $urls = self::parsePgArray($imagenesRaw);

        foreach ($urls as $url) {
            if (self::eliminarDesdeUrl($url)) {
                $eliminados++;
            }
        }

        return $eliminados;
    }

    /**
     * Convierte URL HTTP a ruta absoluta en filesystem.
     */
    private static function urlARuta(?string $url): ?string
    {
        if (empty($url)) return null;

        /* Ya es ruta absoluta */
        if (strpos($url, '/') === 0 || preg_match('/^[A-Z]:/i', $url)) {
            return $url;
        }

        /* URL HTTP → ruta de filesystem */
        $siteUrl = rtrim(get_site_url(), '/');
        if (strpos($url, $siteUrl) === 0) {
            $relativa = substr($url, strlen($siteUrl));
            return ABSPATH . ltrim($relativa, '/');
        }

        /* URL relativa comenzando con /wp-content/ */
        if (strpos($url, '/wp-content/') === 0) {
            return ABSPATH . ltrim($url, '/');
        }

        return null;
    }

    /**
     * Parsea un PG text[] array a PHP array.
     */
    private static function parsePgArray(string $raw): array
    {
        $raw = trim($raw, '{}');
        if (empty($raw)) return [];

        $items = [];
        $current = '';
        $inQuotes = false;

        for ($i = 0; $i < strlen($raw); $i++) {
            $char = $raw[$i];
            if ($char === '"') {
                $inQuotes = !$inQuotes;
            } elseif ($char === ',' && !$inQuotes) {
                $items[] = trim($current, '"');
                $current = '';
            } else {
                $current .= $char;
            }
        }

        if ($current !== '') {
            $items[] = trim($current, '"');
        }

        return array_filter($items);
    }

    /**
     * Crea un recurso GD desde archivo.
     */
    private static function crearImagenDesdeArchivo(string $ruta, int $tipo): ?\GdImage
    {
        switch ($tipo) {
            case IMAGETYPE_JPEG:
                $img = imagecreatefromjpeg($ruta);
                return $img !== false ? $img : null;
            case IMAGETYPE_PNG:
                $img = imagecreatefrompng($ruta);
                return $img !== false ? $img : null;
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    $img = imagecreatefromwebp($ruta);
                    return $img !== false ? $img : null;
                }
                return null;
            default:
                return null;
        }
    }
}
