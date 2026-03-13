<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/BloqueoSchema.php */

namespace App\Config\Schema\_generated;

final class BloqueoDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $bloqueadorId,
        public readonly int $bloqueadoId,
        public readonly string $razon,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en bloqueos", 'bloqueos', 'id')),
            bloqueadorId: (int) ($row['bloqueador_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'bloqueador_id' ausente en bloqueos", 'bloqueos', 'bloqueador_id')),
            bloqueadoId: (int) ($row['bloqueado_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'bloqueado_id' ausente en bloqueos", 'bloqueos', 'bloqueado_id')),
            razon: ($row['razon'] ?? ''),
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
            'bloqueador_id' => $this->bloqueadorId,
            'bloqueado_id' => $this->bloqueadoId,
            'razon' => $this->razon,
            'created_at' => $this->createdAt];
    }
}
