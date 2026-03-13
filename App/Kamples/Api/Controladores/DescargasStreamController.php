<?php

/**
 * DescargasStreamController — Streaming seguro de archivos via PHP.
 *
 * GET /descargas/stream — Stream con token HMAC firmado temporal (C202).
 *
 * @package Kamples
 */

namespace App\Kamples\Api\Controladores;

use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Kamples\KamplesLogger;
use App\Kamples\Auth\AuthMiddleware;

class DescargasStreamController
{
    /**
     * C202: Generar firma HMAC para tokens de descarga temporales.
     * Usado también por DescargasController::descargar() para crear tokens.
     * SEC-C2: AUTH_SALT obligatorio — sin fallback hardcodeado.
     */
    public static function generarFirmaDescarga(int $sampleId, int $userId, int $expira): string
    {
        if (!\defined('AUTH_SALT') || \AUTH_SALT === '') {
            KamplesLogger::critical('DescargasStream: AUTH_SALT no configurado — descargas deshabilitadas');
            throw new \RuntimeException('Configuracion de seguridad incompleta');
        }
        return \hash_hmac('sha256', "{$sampleId}:{$userId}:{$expira}", \AUTH_SALT);
    }

    /**
     * C202: GET /descargas/stream — Stream seguro de archivos via PHP.
     * Valida token firmado, verifica expiración y sirve con readfile().
     */
    public static function streamDescarga(\WP_REST_Request $request): \WP_REST_Response
    {
        try {
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

        /* QQ120: Verificar que la cuenta del usuario sigue activa (ban/suspension) */
        $cuentaResp = AuthMiddleware::verificarCuentaActiva($userId);
        if ($cuentaResp) {
            return $cuentaResp;
        }

        /* Obtener ruta del archivo */
        $sample = SamplesRepository::buscarRutaDescarga($sampleId);

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
        } catch (\Throwable $e) {
            KamplesLogger::error('Error en DescargasStreamController::streamDescarga', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return new \WP_REST_Response([
                'code' => 'error_interno',
                'message' => 'Error al descargar el archivo',
            ], 500);
        }
    }
}
