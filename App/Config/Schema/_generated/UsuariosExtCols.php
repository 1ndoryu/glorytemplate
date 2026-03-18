<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/UsuariosExtSchema.php */

namespace App\Config\Schema\_generated;

final class UsuariosExtCols
{
    const TABLA = 'usuarios_ext';

    const ID = 'id';
    const WP_USER_ID = 'wp_user_id';
    const USERNAME = 'username';
    const EMAIL = 'email';
    const NOMBRE_VISIBLE = 'nombre_visible';
    const BIO = 'bio';
    const AVATAR_URL = 'avatar_url';
    const PORTADA_URL = 'portada_url';
    const PLAN = 'plan';
    const ROL = 'rol';
    const VERIFICADO = 'verificado';
    const TOTAL_SEGUIDORES = 'total_seguidores';
    const TOTAL_SEGUIDOS = 'total_seguidos';
    const TOTAL_SAMPLES = 'total_samples';
    const TOTAL_DESCARGAS = 'total_descargas';
    const STRIPE_CUSTOMER_ID = 'stripe_customer_id';
    const STRIPE_CONNECT_ID = 'stripe_connect_id';
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    const VIOLACIONES_MODERACION = 'violaciones_moderacion';
    const BANEADO_HASTA = 'baneado_hasta';
    const BAN_RAZON = 'ban_razon';
    const CREDITOS_BONUS = 'creditos_bonus';
    const STRIPE_SUBSCRIPTION_ID = 'stripe_subscription_id';
    const ES_SEED = 'es_seed';
    const SITIO_WEB = 'sitio_web';
    const GENEROS_FAVORITOS = 'generos_favoritos';
    const ESTADO = 'estado';
    const SUSPENDIDO_HASTA = 'suspendido_hasta';
    const SUSPENSION_RAZON = 'suspension_razon';
    const MARCADO_ELIMINACION_EN = 'marcado_eliminacion_en';
    const SERA_ELIMINADO_EN = 'sera_eliminado_en';
    /* [183A-69] IP de registro para detectar cuentas múltiples desde la misma IP. */
    const REGISTRO_IP = 'registro_ip';

    /* Lista completa de columnas para validación */
    const TODAS = ['id', 'wp_user_id', 'username', 'email', 'nombre_visible', 'bio', 'avatar_url', 'portada_url', 'plan', 'rol', 'verificado', 'total_seguidores', 'total_seguidos', 'total_samples', 'total_descargas', 'stripe_customer_id', 'stripe_connect_id', 'created_at', 'updated_at', 'violaciones_moderacion', 'baneado_hasta', 'ban_razon', 'creditos_bonus', 'stripe_subscription_id', 'es_seed', 'sitio_web', 'generos_favoritos', 'estado', 'suspendido_hasta', 'suspension_razon', 'marcado_eliminacion_en', 'sera_eliminado_en', 'registro_ip'];
}
