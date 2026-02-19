<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapDisponibilidadSchema.php */

namespace App\Config\Schema\_generated;

final class CapDisponibilidadDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $alumnoId,
        public readonly string $dia,
        public readonly string $hora,
        public readonly bool $disponible,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_disponibilidad", 'cap_disponibilidad', 'id')),
            alumnoId: (int) ($row['alumno_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'alumno_id' ausente en cap_disponibilidad", 'cap_disponibilidad', 'alumno_id')),
            dia: ($row['dia'] ?? throw new \Glory\Exception\SchemaException("Columna 'dia' ausente en cap_disponibilidad", 'cap_disponibilidad', 'dia')),
            hora: ($row['hora'] ?? throw new \Glory\Exception\SchemaException("Columna 'hora' ausente en cap_disponibilidad", 'cap_disponibilidad', 'hora')),
            disponible: (bool) ($row['disponible'] ?? 1),
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
            'alumno_id' => $this->alumnoId,
            'dia' => $this->dia,
            'hora' => $this->hora,
            'disponible' => $this->disponible,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
