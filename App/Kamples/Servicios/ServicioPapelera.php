<?php

/*
 * Servicio de papelera — soft-delete con TTL de 30 días.
 * QQ56: Samples y publicaciones van a papelera 30 días, luego purge definitivo + archivos.
 * QQ57: Los comentarios, mensajes y demás NO van a papelera (hard-delete directo).
 */

namespace App\Kamples\Servicios;

use App\Config\Schema\_generated\SamplesCols;
use App\Config\Schema\_generated\SamplesEnums;
use App\Config\Schema\_generated\PublicacionesCols;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\Database\Repositories\PublicacionesRepository;
use App\Kamples\Database\Repositories\ComentariosRepository;
use App\Kamples\Database\PostgresService;
use App\Kamples\KamplesLogger;

final class ServicioPapelera
{
    const DIAS_RETENCION = 30;

    /* Tipos soportados por la papelera */
    const TIPO_SAMPLE = 'sample';
    const TIPO_PUBLICACION = 'publicacion';

    /**
     * Envía un sample a la papelera (soft-delete sin eliminar archivos).
     */
    public static function enviarSample(int $sampleId): bool
    {
        try {
            $sql = "UPDATE samples SET estado = :estado, eliminado_en = NOW() WHERE id = :id AND estado != :estado";
            PostgresService::ejecutar($sql, [
                'estado' => SamplesEnums::ESTADO_ELIMINADO,
                'id' => $sampleId,
            ]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioPapelera: error enviando sample a papelera', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Envía una publicación a la papelera.
     */
    public static function enviarPublicacion(int $publicacionId): bool
    {
        try {
            $sql = "UPDATE publicaciones SET eliminado_en = NOW() WHERE id = :id AND eliminado_en IS NULL";
            PostgresService::ejecutar($sql, ['id' => $publicacionId]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioPapelera: error enviando publicación a papelera', [
                'publicacionId' => $publicacionId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Restaura un sample desde la papelera.
     */
    public static function restaurarSample(int $sampleId, int $userId): bool
    {
        try {
            $sql = "UPDATE samples SET estado = :estado, eliminado_en = NULL
                    WHERE id = :id AND creador_id = :userId AND estado = :estadoEliminado";
            PostgresService::ejecutar($sql, [
                'estado' => SamplesEnums::ESTADO_ACTIVO,
                'estadoEliminado' => SamplesEnums::ESTADO_ELIMINADO,
                'id' => $sampleId,
                'userId' => $userId,
            ]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioPapelera: error restaurando sample', [
                'sampleId' => $sampleId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Restaura una publicación desde la papelera.
     */
    public static function restaurarPublicacion(int $publicacionId, int $userId): bool
    {
        try {
            $sql = "UPDATE publicaciones SET eliminado_en = NULL
                    WHERE id = :id AND autor_id = :userId AND eliminado_en IS NOT NULL";
            PostgresService::ejecutar($sql, [
                'id' => $publicacionId,
                'userId' => $userId,
            ]);
            return true;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioPapelera: error restaurando publicación', [
                'publicacionId' => $publicacionId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Lista items en papelera de un usuario.
     * Retorna array unificado con tipo, id, titulo, fecha de eliminación.
     */
    public static function listar(int $userId): array
    {
        try {
            $items = [];

            /* Samples en papelera */
            $sqlSamples = "SELECT id, titulo, slug, imagen_url, eliminado_en, 'sample' AS tipo_item
                           FROM samples
                           WHERE creador_id = :userId AND estado = :estado AND eliminado_en IS NOT NULL
                           ORDER BY eliminado_en DESC";
            $samples = PostgresService::consultar($sqlSamples, [
                'userId' => $userId,
                'estado' => SamplesEnums::ESTADO_ELIMINADO,
            ]);

            foreach ($samples as $row) {
                $items[] = [
                    'tipo' => self::TIPO_SAMPLE,
                    'id' => (int) $row['id'],
                    'titulo' => $row['titulo'],
                    'slug' => $row['slug'],
                    'imagenUrl' => $row['imagen_url'],
                    'eliminadoEn' => $row['eliminado_en'],
                    'diasRestantes' => self::diasRestantes($row['eliminado_en']),
                ];
            }

            /* Publicaciones en papelera */
            $sqlPubs = "SELECT id, contenido, eliminado_en, 'publicacion' AS tipo_item
                        FROM publicaciones
                        WHERE autor_id = :userId AND eliminado_en IS NOT NULL
                        ORDER BY eliminado_en DESC";
            $pubs = PostgresService::consultar($sqlPubs, ['userId' => $userId]);

            foreach ($pubs as $row) {
                $titulo = mb_substr(strip_tags($row['contenido']), 0, 80);
                $items[] = [
                    'tipo' => self::TIPO_PUBLICACION,
                    'id' => (int) $row['id'],
                    'titulo' => $titulo ?: '(sin contenido)',
                    'slug' => null,
                    'imagenUrl' => null,
                    'eliminadoEn' => $row['eliminado_en'],
                    'diasRestantes' => self::diasRestantes($row['eliminado_en']),
                ];
            }

            /* Ordenar por fecha de eliminación descendente */
            usort($items, function ($a, $b) {
                return strcmp($b['eliminadoEn'], $a['eliminadoEn']);
            });

            return $items;
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioPapelera: error listando papelera', [
                'userId' => $userId,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Purga items expirados (>30 días) — elimina archivos + registros.
     * Diseñado para ejecutarse via cron o endpoint admin.
     *
     * @return array ['samples' => int, 'publicaciones' => int] totales eliminados
     */
    public static function purgarExpiradas(): array
    {
        $resultado = ['samples' => 0, 'publicaciones' => 0];

        try {
            /* Samples expirados: eliminar archivos + cascada completa */
            $sqlSamples = "SELECT id, ruta_original, ruta_optimizada, ruta_preview, ruta_waveform
                           FROM samples
                           WHERE estado = :estado
                             AND eliminado_en IS NOT NULL
                             AND eliminado_en < NOW() - INTERVAL '" . self::DIAS_RETENCION . " days'";
            $samplesExpirados = PostgresService::consultar($sqlSamples, [
                'estado' => SamplesEnums::ESTADO_ELIMINADO,
            ]);

            foreach ($samplesExpirados as $sample) {
                self::purgarSample($sample);
                $resultado['samples']++;
            }

            /* Publicaciones expiradas: eliminar media + cascada completa */
            $sqlPubs = "SELECT id, imagenes
                        FROM publicaciones
                        WHERE eliminado_en IS NOT NULL
                          AND eliminado_en < NOW() - INTERVAL '" . self::DIAS_RETENCION . " days'";
            $pubsExpiradas = PostgresService::consultar($sqlPubs, []);

            foreach ($pubsExpiradas as $pub) {
                self::purgarPublicacion($pub);
                $resultado['publicaciones']++;
            }

            if ($resultado['samples'] > 0 || $resultado['publicaciones'] > 0) {
                KamplesLogger::info('ServicioPapelera: purga completada', $resultado);
            }
        } catch (\Throwable $e) {
            KamplesLogger::error('ServicioPapelera: error en purga', [
                'error' => $e->getMessage(),
            ]);
        }

        return $resultado;
    }

    /**
     * Purga definitiva de un sample: archivos + comentarios media + cascada DB.
     */
    private static function purgarSample(array $sample): void
    {
        $sampleId = (int) $sample['id'];

        /* Eliminar archivos de audio del sample */
        foreach ([SamplesCols::RUTA_ORIGINAL, SamplesCols::RUTA_OPTIMIZADA, SamplesCols::RUTA_PREVIEW, SamplesCols::RUTA_WAVEFORM] as $campo) {
            if (!empty($sample[$campo])) {
                ServicioMedia::eliminarDesdeUrl($sample[$campo]);
            }
        }

        /* Eliminar media de comentarios asociados */
        ServicioMedia::limpiarMediaComentarios('sample', $sampleId);

        /* Cascada DB */
        SamplesRepository::eliminarConCascada($sampleId);
    }

    /**
     * Purga definitiva de una publicación: imágenes + comentarios media + cascada DB.
     */
    private static function purgarPublicacion(array $pub): void
    {
        $pubId = (int) $pub['id'];

        /* Eliminar imágenes de la publicación */
        if (!empty($pub['imagenes'])) {
            ServicioMedia::limpiarImagenesPublicacion($pub['imagenes']);
        }

        /* Eliminar media de comentarios asociados */
        ServicioMedia::limpiarMediaComentarios('publicacion', $pubId);

        /* Cascada DB: likes + comentarios + publicación */
        PublicacionesRepository::eliminarConCascada($pubId);
    }

    /**
     * Calcula días restantes antes de purga definitiva.
     */
    private static function diasRestantes(string $eliminadoEn): int
    {
        try {
            $fecha = new \DateTimeImmutable($eliminadoEn);
            $expira = $fecha->modify('+' . self::DIAS_RETENCION . ' days');
            $ahora = new \DateTimeImmutable();
            $diff = $ahora->diff($expira);

            return $diff->invert ? 0 : $diff->days;
        } catch (\Throwable) {
            return 0;
        }
    }
}
