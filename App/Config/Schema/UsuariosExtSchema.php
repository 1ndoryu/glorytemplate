<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

class UsuariosExtSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'usuarios_ext';
    }

    public function columnas(): array
    {
        return [
            'id'                     => ['tipo' => 'int', 'pk' => true],
            'wp_user_id'             => ['tipo' => 'int', 'unico' => true],
            'username'               => ['tipo' => 'string', 'max' => 50, 'unico' => true],
            'email'                  => ['tipo' => 'string', 'max' => 255, 'unico' => true, 'nullable' => true],
            'nombre_visible'         => ['tipo' => 'string', 'max' => 100, 'default' => ''],
            'bio'                    => ['tipo' => 'text', 'default' => ''],
            'avatar_url'             => ['tipo' => 'text', 'nullable' => true],
            'portada_url'            => ['tipo' => 'text', 'nullable' => true],
            'plan'                   => ['tipo' => 'string', 'max' => 20, 'default' => 'free', 'check' => ['free', 'pro', 'premium']],
            'rol'                    => ['tipo' => 'string', 'max' => 20, 'default' => 'usuario', 'check' => ['usuario', 'creador', 'admin']],
            'verificado'             => ['tipo' => 'bool', 'default' => false],
            'total_seguidores'       => ['tipo' => 'int', 'default' => 0],
            'total_seguidos'         => ['tipo' => 'int', 'default' => 0],
            'total_samples'          => ['tipo' => 'int', 'default' => 0],
            'total_descargas'        => ['tipo' => 'int', 'default' => 0],
            'stripe_customer_id'     => ['tipo' => 'string', 'max' => 100, 'nullable' => true],
            'stripe_connect_id'      => ['tipo' => 'string', 'max' => 100, 'nullable' => true],
            'created_at'             => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'updated_at'             => ['tipo' => 'datetime', 'default' => 'NOW()'],
            'violaciones_moderacion' => ['tipo' => 'int', 'default' => 0],
            'baneado_hasta'          => ['tipo' => 'datetime', 'nullable' => true],
            'ban_razon'              => ['tipo' => 'text', 'nullable' => true],
            'creditos_bonus'         => ['tipo' => 'int', 'default' => 0],
            'stripe_subscription_id' => ['tipo' => 'string', 'max' => 100, 'nullable' => true],
            'es_seed'                => ['tipo' => 'bool', 'default' => false],
            'sitio_web'              => ['tipo' => 'string', 'max' => 500, 'nullable' => true],
            'generos_favoritos'      => ['tipo' => 'json', 'default' => '[]'],
            'estado'                 => ['tipo' => 'string', 'max' => 20, 'default' => 'activo', 'check' => ['activo', 'suspendido', 'en_eliminacion']],
            'suspendido_hasta'       => ['tipo' => 'datetime', 'nullable' => true],
            'suspension_razon'       => ['tipo' => 'text', 'nullable' => true],
            'marcado_eliminacion_en' => ['tipo' => 'datetime', 'nullable' => true],
            'sera_eliminado_en'      => ['tipo' => 'datetime', 'nullable' => true],
            /* [183A-69] IP de registro para detectar cuentas múltiples desde la misma IP. */
            'registro_ip'            => ['tipo' => 'string', 'max' => 45, 'nullable' => true],
        ];
    }
}
