<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ReproduccionesSchema.php */

namespace App\Config\Schema\_generated;

final class ReproduccionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly ?int $usuarioId,
        public readonly int $sampleId,
        public readonly float $duracionEscuchada,
        public readonly bool $completada,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en reproducciones", 'reproducciones', 'id')),
            usuarioId: isset($row['usuario_id']) ? (int) $row['usuario_id'] : null,
            sampleId: (int) ($row['sample_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_id' ausente en reproducciones", 'reproducciones', 'sample_id')),
            duracionEscuchada: (float) ($row['duracion_escuchada'] ?? 0),
            completada: (bool) ($row['completada'] ?? false),
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
            'sample_id' => $this->sampleId,
            'duracion_escuchada' => $this->duracionEscuchada,
            'completada' => $this->completada,
            'created_at' => $this->createdAt];
    }
}
