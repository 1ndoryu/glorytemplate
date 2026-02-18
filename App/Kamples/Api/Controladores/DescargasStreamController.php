<?php

/**
 * DescargasStreamController — Streaming seguro de archivos via PHP.
 *
 * GET /descargas/stream — Stream con token HMAC firmado temporal (C202).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Kamples\Database\PostgresService;
use App\Config\Schema\_generated\SamplesCols;

class DescargasStreamController
{
    /**
     * C202: Generar firma HMAC para tokens de descarga temporales.
     * Usado también por DescargasController::descargar() para crear tokens.
     */
    public static function generarFirmaDescarga(int $sampleId, int $userId, int $expira): string
    {
        $secreto = \defined('AUTH_SALT') ? AUTH_SALT : 'kamples-descarga-segura-2026';
        return \hash_hmac('sha256', "{$sampleId}:{$userId}:{$expira}", $secreto);
    }

    /**
     * C202: GET /descargas/stream — Stream seguro de archivos via PHP.
     * Valida token firmado, verifica expiración y sirve con readfile().
     */
    public static function streamDescarga(\WP_REST_Request $request): \WP_REST_Response
    {
        $token = $request->get_param('token');
        if (!$token) {
            return new \WP_REST_Response(['code' => 'token_requerido'], 400);
        }

        $decoded = \base64_decode($token, true);
        if (!$decoded) {
            return new \WP_REST_Response(['code' => 'token_invalido'], 400);
        }

        $partes = \explode(':', $decoded);
        if (\count($partes) !== 4) {
            return new \WP_REST_Response(['code' => 'token_malformado'], 400);
        }

        [$sampleId, $userId, $expira, $firma] = $partes;
        $sampleId = (int) $sampleId;
        $userId = (int) $userId;
        $expira = (int) $expira;

        /* Verificar expiración */
        if (\time() > $expira) {
            return new \WP_REST_Response(['code' => 'token_expirado'], 403);
        }

        /* Verificar firma HMAC */
        $firmaEsperada = self::generarFirmaDescarga($sampleId, $userId, $expira);
        if (!\hash_equals($firmaEsperada, $firma)) {
            return new \WP_REST_Response(['code' => 'firma_invalida'], 403);
        }

        /* Obtener ruta del archivo */
        $sample = PostgresService::consultarUno(
            "SELECT ruta_original, ruta_optimizada, titulo FROM samples WHERE id = :id",
            ['id' => $sampleId]
        );

        if (!$sample) {
            return new \WP_REST_Response(['code' => 'sample_no_encontrado'], 404);
        }

        $rutaArchivo = $sample[SamplesCols::RUTA_ORIGINAL] ?? $sample[SamplesCols::RUTA_OPTIMIZADA] ?? '';
        if (!$rutaArchivo || !\file_exists($rutaArchivo)) {
            return new \WP_REST_Response(['code' => 'archivo_no_encontrado'], 404);
        }

        /* Stream del archivo via PHP — nunca exponer ruta real */
        $nombre = ($sample[SamplesCols::TITULO] ?? 'sample') . '.' . \pathinfo($rutaArchivo, PATHINFO_EXTENSION);
        $mime = wp_check_filetype($rutaArchivo)['type'] ?? 'application/octet-stream';
        $tamano = \filesize($rutaArchivo);

        \header('Content-Type: ' . $mime);
        \header('Content-Disposition: attachment; filename="' . sanitize_file_name($nombre) . '"');
        \header('Content-Length: ' . $tamano);
        \header('Cache-Control: no-store, no-cache, must-revalidate');
        \header('Pragma: no-cache');
        \header('X-Content-Type-Options: nosniff');
        readfile($rutaArchivo);
        exit;
    }
}
