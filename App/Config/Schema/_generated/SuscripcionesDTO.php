<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SuscripcionesSchema.php */

namespace App\Config\Schema\_generated;

final class SuscripcionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $usuarioId,
        public readonly string $plan,
        public readonly string $estado,
        public readonly ?string $stripeSubscriptionId,
        public readonly ?string $inicioAt,
        public readonly ?string $finAt,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en suscripciones", 'suscripciones', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en suscripciones", 'suscripciones', 'usuario_id')),
            plan: ($row['plan'] ?? 'free'),
            estado: ($row['estado'] ?? 'activa'),
            stripeSubscriptionId: isset($row['stripe_subscription_id']) ? $row['stripe_subscription_id'] : null,
            inicioAt: isset($row['inicio_at']) ? $row['inicio_at'] : null,
            finAt: isset($row['fin_at']) ? $row['fin_at'] : null,
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s'))
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
            'plan' => $this->plan,
            'estado' => $this->estado,
            'stripe_subscription_id' => $this->stripeSubscriptionId,
            'inicio_at' => $this->inicioAt,
            'fin_at' => $this->finAt,
            'created_at' => $this->createdAt];
    }
}
