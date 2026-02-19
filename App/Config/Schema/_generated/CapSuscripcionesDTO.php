<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapSuscripcionesSchema.php */

namespace App\Config\Schema\_generated;

final class CapSuscripcionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $centroId,
        public readonly string $stripeCustomerId,
        public readonly string $stripeSubscriptionId,
        public readonly string $estado,
        public readonly ?string $fechaInicio,
        public readonly ?string $fechaFin,
        public readonly ?string $createdAt,
        public readonly ?string $updatedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_suscripciones", 'cap_suscripciones', 'id')),
            centroId: (int) ($row['centro_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'centro_id' ausente en cap_suscripciones", 'cap_suscripciones', 'centro_id')),
            stripeCustomerId: ($row['stripe_customer_id'] ?? ''),
            stripeSubscriptionId: ($row['stripe_subscription_id'] ?? ''),
            estado: ($row['estado'] ?? 'activa'),
            fechaInicio: isset($row['fecha_inicio']) ? $row['fecha_inicio'] : null,
            fechaFin: isset($row['fecha_fin']) ? $row['fecha_fin'] : null,
            createdAt: isset($row['created_at']) ? $row['created_at'] : null,
            updatedAt: isset($row['updated_at']) ? $row['updated_at'] : null
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
            'centro_id' => $this->centroId,
            'stripe_customer_id' => $this->stripeCustomerId,
            'stripe_subscription_id' => $this->stripeSubscriptionId,
            'estado' => $this->estado,
            'fecha_inicio' => $this->fechaInicio,
            'fecha_fin' => $this->fechaFin,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
