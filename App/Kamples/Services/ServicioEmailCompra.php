<?php

/**
 * ServicioEmailCompra — Envía email de confirmación tras comprar un sample.
 *
 * Incluye enlace directo a /descargas/?compra=exito para que el usuario
 * pueda descargar el sample adquirido.
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\Database\Repositories\UsuariosExtRepository;
use App\Kamples\Database\Repositories\SamplesRepository;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\SamplesCols;
use App\Kamples\KamplesLogger;

class ServicioEmailCompra
{
    /**
     * Envía email de confirmación de compra al comprador.
     * Incluye nombre del sample, precio y enlace a /descargas/ para descargarlo.
     */
    public static function enviarConfirmacionCompra(int $compradorId, int $sampleId, float $precio): bool
    {
        $comprador = UsuariosExtRepository::buscarPorId($compradorId);
        if (!$comprador) {
            KamplesLogger::warning('Email compra: comprador no encontrado', ['id' => $compradorId]);
            return false;
        }

        $email = $comprador[UsuariosExtCols::EMAIL] ?? '';
        if (empty($email)) {
            KamplesLogger::warning('Email compra: comprador sin email', ['id' => $compradorId]);
            return false;
        }

        $sample = SamplesRepository::buscarParaDescarga($sampleId);
        if (!$sample) {
            KamplesLogger::warning('Email compra: sample no encontrado', ['id' => $sampleId]);
            return false;
        }

        $nombreUsuario = $comprador[UsuariosExtCols::NOMBRE_VISIBLE]
            ?? $comprador[UsuariosExtCols::USERNAME]
            ?? 'Usuario';
        $tituloSample = $sample[SamplesCols::TITULO] ?? 'Sample';
        $precioFormato = '$' . number_format($precio, 2);
        $siteUrl = \home_url();
        $enlaceDescargas = $siteUrl . '/descargas/';

        $asunto = "Compra confirmada: {$tituloSample}";

        $cuerpo = self::construirHtmlEmail($nombreUsuario, $tituloSample, $precioFormato, $enlaceDescargas, $siteUrl);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: Kamples <noreply@' . \wp_parse_url($siteUrl, \PHP_URL_HOST) . '>',
        ];

        $enviado = \wp_mail($email, $asunto, $cuerpo, $headers);

        if (!$enviado) {
            KamplesLogger::error('Email compra: wp_mail falló', [
                'email' => $email, 'sampleId' => $sampleId,
            ]);
        } else {
            KamplesLogger::info('Email compra enviado', [
                'email' => $email, 'sampleId' => $sampleId,
            ]);
        }

        return $enviado;
    }

    /**
     * Construye el HTML del email de confirmacion de compra.
     * Diseño minimalista y compatible con clientes de correo.
     */
    private static function construirHtmlEmail(
        string $nombre,
        string $tituloSample,
        string $precio,
        string $enlaceDescargas,
        string $siteUrl
    ): string {
        $enlaceDescargasEscapado = \esc_url($enlaceDescargas);
        $siteUrlEscapado = \esc_url($siteUrl);
        $nombreEscapado = \esc_html($nombre);
        $tituloEscapado = \esc_html($tituloSample);
        $precioEscapado = \esc_html($precio);

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1a1a2e;padding:24px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;">Kamples</h1>
    </td></tr>
    <tr><td style="padding:32px 24px;">
        <p style="margin:0 0 16px;color:#333;font-size:16px;">Hola {$nombreEscapado},</p>
        <p style="margin:0 0 16px;color:#333;font-size:16px;">Tu compra se ha completado exitosamente.</p>
        <table width="100%" cellpadding="12" cellspacing="0" style="background:#f8f9fa;border-radius:6px;margin:0 0 24px;">
            <tr>
                <td style="color:#666;font-size:14px;">Sample</td>
                <td style="color:#333;font-size:14px;font-weight:bold;text-align:right;">{$tituloEscapado}</td>
            </tr>
            <tr>
                <td style="color:#666;font-size:14px;border-top:1px solid #e9ecef;">Precio</td>
                <td style="color:#333;font-size:14px;font-weight:bold;text-align:right;border-top:1px solid #e9ecef;">{$precioEscapado}</td>
            </tr>
        </table>
        <p style="margin:0 0 24px;color:#333;font-size:16px;">Ya puedes descargar tu sample desde la seccion "Comprados" en tu biblioteca:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
                <a href="{$enlaceDescargasEscapado}" style="display:inline-block;background:#4a665b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
                    Ir a Mis Descargas
                </a>
            </td></tr>
        </table>
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #e9ecef;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">
            <a href="{$siteUrlEscapado}" style="color:#999;text-decoration:none;">Kamples</a>
        </p>
    </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
HTML;
    }
}
