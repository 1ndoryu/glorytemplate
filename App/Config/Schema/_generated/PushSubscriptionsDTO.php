<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/PushSubscriptionsSchema.php */

namespace App\Config\Schema\_generated;

final class PushSubscriptionsDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $usuarioId,
        public readonly string $endpoint,
        public readonly string $auth,
        public readonly string $plataforma,
        public readonly bool $activa,
        public readonly string $createdAt,
        public readonly string $updatedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en push_subscriptions", 'push_subscriptions', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en push_subscriptions", 'push_subscriptions', 'usuario_id')),
            endpoint: ($row['endpoint'] ?? throw new \Glory\Exception\SchemaException("Columna 'endpoint' ausente en push_subscriptions", 'push_subscriptions', 'endpoint')),
            auth: ($row['auth'] ?? throw new \Glory\Exception\SchemaException("Columna 'auth' ausente en push_subscriptions", 'push_subscriptions', 'auth')),
            plataforma: ($row['plataforma'] ?? 'web'),
            activa: (bool) ($row['activa'] ?? true),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            updatedAt: ($row['updated_at'] ?? date('Y-m-d H:i:s'))
        );
    }

    /**
     * Convertir a array asociativo camelCase (para serialización JSON).
     */
    public function aArray(): array
    {
        return get_object_vars($this);
    }

    /**
     * Convertir a array con claves snake_case (para queries SQL).
     */
    public function aArrayDB(): array
    {
        return [
            'id' => $this->id,
            'usuario_id' => $this->usuarioId,
            'endpoint' => $this->endpoint,
            'auth' => $this->auth,
            'plataforma' => $this->plataforma,
            'activa' => $this->activa,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
