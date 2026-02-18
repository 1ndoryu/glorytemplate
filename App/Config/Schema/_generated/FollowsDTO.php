<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/FollowsSchema.php */

namespace App\Config\Schema\_generated;

final class FollowsDTO
{
    public function __construct(
        public readonly int $seguidorId,
        public readonly int $seguidoId,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            seguidorId: (int) ($row['seguidor_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'seguidor_id' ausente en follows", 'follows', 'seguidor_id')),
            seguidoId: (int) ($row['seguido_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'seguido_id' ausente en follows", 'follows', 'seguido_id')),
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
            'seguidor_id' => $this->seguidorId,
            'seguido_id' => $this->seguidoId,
            'created_at' => $this->createdAt];
    }
}
