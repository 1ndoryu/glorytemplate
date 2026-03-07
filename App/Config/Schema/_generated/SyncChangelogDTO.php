<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SyncChangelogSchema.php */

namespace App\Config\Schema\_generated;

final class SyncChangelogDTO
{
    public function __construct(
        public readonly mixed $id,
        public readonly int $usuarioId,
        public readonly string $tipo,
        public readonly int $entidadId,
        public readonly mixed $metadata,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en sync_changelog", 'sync_changelog', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en sync_changelog", 'sync_changelog', 'usuario_id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en sync_changelog", 'sync_changelog', 'tipo')),
            entidadId: (int) ($row['entidad_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'entidad_id' ausente en sync_changelog", 'sync_changelog', 'entidad_id')),
            metadata: ($row['metadata'] ?? '{}'),
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
            'tipo' => $this->tipo,
            'entidad_id' => $this->entidadId,
            'metadata' => $this->metadata,
            'created_at' => $this->createdAt];
    }
}
