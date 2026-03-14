<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/PushSubscriptionsSchema.php */

namespace App\Config\Schema\_generated;

final class PushSubscriptionsDTO
{
    public ?int $id = null;
    public ?int $usuario_id = null;
    public ?string $endpoint = null;
    public ?string $p256dh = null;
    public ?string $auth = null;
    public string $plataforma = 'web';
    public bool $activa = true;
    public ?string $created_at = null;
    public ?string $updated_at = null;
}
