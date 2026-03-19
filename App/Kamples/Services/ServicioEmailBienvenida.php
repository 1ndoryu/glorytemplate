<?php

/**
 * ServicioEmailBienvenida — Envía email de bienvenida tras registro.
 * [183A-84] Reutiliza patrón de ServicioEmailCompra (wp_mail + Brevo SMTP).
 *
 * @package Kamples
 */

namespace App\Kamples\Services;

use App\Kamples\KamplesLogger;

class ServicioEmailBienvenida
{
    /**
     * Envía email de bienvenida al usuario recién registrado.
     * No-blocking: si falla, loguea pero no interrumpe el registro.
     */
    public static function enviar(string $email, string $nombreUsuario): bool
    {
        if (empty($email)) {
            KamplesLogger::warning('Email bienvenida: email vacío');
            return false;
        }

        $siteUrl = \home_url();
        $asunto = '¡Bienvenido a Kamples!';
        $cuerpo = self::construirHtml($nombreUsuario, $siteUrl);

        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: Kamples <noreply@' . \wp_parse_url($siteUrl, \PHP_URL_HOST) . '>',
        ];

        $enviado = \wp_mail($email, $asunto, $cuerpo, $headers);

        if (!$enviado) {
            KamplesLogger::error('Email bienvenida: wp_mail falló', ['email' => $email]);
        } else {
            KamplesLogger::info('Email bienvenida enviado', ['email' => $email]);
        }

        return $enviado;
    }

    private static function construirHtml(string $nombre, string $siteUrl): string
    {
        $nombreEscapado = \esc_html($nombre);
        $siteUrlEscapado = \esc_url($siteUrl);

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
        <p style="margin:0 0 16px;color:#333;font-size:16px;">Tu cuenta en Kamples ha sido creada exitosamente. Ya puedes explorar, descargar y compartir samples con la comunidad.</p>
        <p style="margin:0 0 24px;color:#333;font-size:16px;">Empieza descubriendo samples ahora:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
                <a href="{$siteUrlEscapado}" style="display:inline-block;background:#4a665b;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:bold;">
                    Explorar Kamples
                </a>
            </td></tr>
        </table>
    </td></tr>
    <tr><td style="padding:16px 24px;border-top:1px solid #e9ecef;text-align:center;">
        <p style="margin:0;color:#999;font-size:12px;">
            <a href="{$siteUrlEscapado}" style="color:#999;text-decoration:none;">kamples.com</a>
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
