<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapAsistenciaSchema.php */

namespace App\Config\Schema\_generated;

final class CapAsistenciaDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $claseId,
        public readonly int $alumnoId,
        public readonly bool $asistio,
        public readonly ?string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_asistencia", 'cap_asistencia', 'id')),
            claseId: (int) ($row['clase_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'clase_id' ausente en cap_asistencia", 'cap_asistencia', 'clase_id')),
            alumnoId: (int) ($row['alumno_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'alumno_id' ausente en cap_asistencia", 'cap_asistencia', 'alumno_id')),
            asistio: (bool) ($row['asistio'] ?? 0),
            createdAt: isset($row['created_at']) ? $row['created_at'] : null
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
            'clase_id' => $this->claseId,
            'alumno_id' => $this->alumnoId,
            'asistio' => $this->asistio,
            'created_at' => $this->createdAt];
    }
}
