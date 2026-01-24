<?php

namespace App\Api\Facturacion\Services;

use WP_Post;
use WP_User;

/**
 * Servicio encargado de formatear las respuestas de la API.
 * Separa la lógica de presentación de la lógica de negocio.
 */
class FacturacionFormatter
{
    public static function servicio(WP_Post $post): array
    {
        $autor = get_userdata($post->post_author);

        return [
            'id' => $post->ID,
            'titulo' => $post->post_title,
            'descripcion' => $post->post_content,
            'extracto' => wp_trim_words($post->post_content, 30),
            'precio' => (float) get_post_meta($post->ID, '_precio', true),
            'tiempoEntregaDias' => (int) get_post_meta($post->ID, '_tiempo_entrega_dias', true),
            'categoria' => get_post_meta($post->ID, '_categoria', true),
            'imagenDestacada' => get_the_post_thumbnail_url($post->ID, 'large'),
            'incluyeHostingMeses' => (int) get_post_meta($post->ID, '_incluye_hosting_meses', true),
            'incluyeDominio' => (bool) get_post_meta($post->ID, '_incluye_dominio', true),
            'activo' => (bool) get_post_meta($post->ID, '_activo', true),
            'proveedor' => [
                'id' => $post->post_author,
                'nombre' => $autor ? $autor->display_name : 'Desconocido',
                'avatar' => get_avatar_url($post->post_author, ['size' => 48]),
            ],
            'fechaCreacion' => $post->post_date,
        ];
    }

    public static function trabajo(WP_Post $post): array
    {
        $cliente = get_userdata($post->post_author);
        $proveedorId = (int) get_post_meta($post->ID, '_proveedor_id', true);
        $proveedor = get_userdata($proveedorId);
        $servicioId = (int) get_post_meta($post->ID, '_servicio_publicado_id', true);

        return [
            'id' => $post->ID,
            'titulo' => $post->post_title,
            'servicioPublicadoId' => $servicioId,
            'estado' => get_post_meta($post->ID, '_estado', true),
            'progreso' => (int) get_post_meta($post->ID, '_progreso_porcentaje', true),
            'precioAcordado' => (float) get_post_meta($post->ID, '_precio_acordado', true),
            'fechaContratacion' => get_post_meta($post->ID, '_fecha_contratacion', true),
            'fechaEntregaEstimada' => get_post_meta($post->ID, '_fecha_entrega_estimada', true),
            'revisionesRestantes' => (int) get_post_meta($post->ID, '_revisiones_restantes', true),
            'cliente' => [
                'id' => $post->post_author,
                'nombre' => $cliente ? $cliente->display_name : 'Desconocido',
                'email' => $cliente ? $cliente->user_email : '',
                'avatar' => get_avatar_url($post->post_author, ['size' => 48]),
            ],
            'proveedor' => [
                'id' => $proveedorId,
                'nombre' => $proveedor ? $proveedor->display_name : 'Desconocido',
                'avatar' => get_avatar_url($proveedorId, ['size' => 48]),
            ],
        ];
    }

    public static function hosting(WP_Post $post): array
    {
        $cliente = get_userdata($post->post_author);

        return [
            'id' => $post->ID,
            'dominio' => get_post_meta($post->ID, '_dominio', true),
            'dominioTemporal' => get_post_meta($post->ID, '_dominio_temporal', true),
            'stackUuid' => get_post_meta($post->ID, '_stack_uuid', true),
            'plan' => get_post_meta($post->ID, '_plan', true),
            'precioMensual' => (float) get_post_meta($post->ID, '_precio_mensual', true),
            'fechaInicio' => get_post_meta($post->ID, '_fecha_inicio', true),
            'fechaRenovacion' => get_post_meta($post->ID, '_fecha_renovacion', true),
            'estado' => get_post_meta($post->ID, '_estado', true),
            'pagado' => (bool) get_post_meta($post->ID, '_pagado', true),
            'cliente' => [
                'id' => $post->post_author,
                'nombre' => $cliente ? $cliente->display_name : 'Desconocido',
            ],
        ];
    }

    public static function dominio(WP_Post $post): array
    {
        $cliente = get_userdata($post->post_author);

        return [
            'id' => $post->ID,
            'dominio' => get_post_meta($post->ID, '_dominio', true),
            'registrador' => get_post_meta($post->ID, '_registrador', true),
            'fechaRegistro' => get_post_meta($post->ID, '_fecha_registro', true),
            'fechaExpiracion' => get_post_meta($post->ID, '_fecha_expiracion', true),
            'precioAnual' => (float) get_post_meta($post->ID, '_precio_anual', true),
            'autoRenovacion' => (bool) get_post_meta($post->ID, '_auto_renovacion', true),
            'estado' => get_post_meta($post->ID, '_estado', true),
            'pagado' => (bool) get_post_meta($post->ID, '_pagado', true),
            'cliente' => [
                'id' => $post->post_author,
                'nombre' => $cliente ? $cliente->display_name : 'Desconocido',
            ],
        ];
    }

    public static function factura(WP_Post $post): array
    {
        $cliente = get_userdata($post->post_author);
        $itemsJson = get_post_meta($post->ID, '_items', true);
        $items = $itemsJson ? json_decode($itemsJson, true) : [];

        return [
            'id' => $post->ID,
            'numero' => $post->post_title,
            'items' => $items,
            'subtotal' => (float) get_post_meta($post->ID, '_subtotal', true),
            'impuestos' => (float) get_post_meta($post->ID, '_impuestos', true),
            'total' => (float) get_post_meta($post->ID, '_total', true),
            'estado' => get_post_meta($post->ID, '_estado', true),
            'fechaEmision' => get_post_meta($post->ID, '_fecha_emision', true),
            'fechaVencimiento' => get_post_meta($post->ID, '_fecha_vencimiento', true),
            'stripePaymentId' => get_post_meta($post->ID, '_stripe_payment_id', true),
            'cliente' => [
                'id' => $post->post_author,
                'nombre' => $cliente ? $cliente->display_name : 'Desconocido',
                'email' => $cliente ? $cliente->user_email : '',
            ],
        ];
    }

    public static function usuario(WP_User $user, bool $esAdmin): array
    {
        return [
            'id' => $user->ID,
            'nombre' => $user->display_name,
            'email' => $user->user_email,
            'avatar' => get_avatar_url($user->ID, ['size' => 96]),
            'rol' => $esAdmin ? 'admin' : 'cliente',
            'esAdmin' => $esAdmin,
        ];
    }
}
