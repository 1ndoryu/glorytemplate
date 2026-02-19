<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapClasesSchema.php */

namespace App\Config\Schema\_generated;

final class CapClasesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $centroId,
        public readonly string $fecha,
        public readonly string $horaInicio,
        public readonly string $horaFin,
        public readonly string $asignatura,
        public readonly int $duracionMinutos,
        public readonly bool $bloqueada,
        public readonly ?string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_clases", 'cap_clases', 'id')),
            centroId: (int) ($row['centro_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'centro_id' ausente en cap_clases", 'cap_clases', 'centro_id')),
            fecha: ($row['fecha'] ?? throw new \Glory\Exception\SchemaException("Columna 'fecha' ausente en cap_clases", 'cap_clases', 'fecha')),
            horaInicio: ($row['hora_inicio'] ?? throw new \Glory\Exception\SchemaException("Columna 'hora_inicio' ausente en cap_clases", 'cap_clases', 'hora_inicio')),
            horaFin: ($row['hora_fin'] ?? throw new \Glory\Exception\SchemaException("Columna 'hora_fin' ausente en cap_clases", 'cap_clases', 'hora_fin')),
            asignatura: ($row['asignatura'] ?? throw new \Glory\Exception\SchemaException("Columna 'asignatura' ausente en cap_clases", 'cap_clases', 'asignatura')),
            duracionMinutos: (int) ($row['duracion_minutos'] ?? 60),
            bloqueada: (bool) ($row['bloqueada'] ?? 0),
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
            'centro_id' => $this->centroId,
            'fecha' => $this->fecha,
            'hora_inicio' => $this->horaInicio,
            'hora_fin' => $this->horaFin,
            'asignatura' => $this->asignatura,
            'duracion_minutos' => $this->duracionMinutos,
            'bloqueada' => $this->bloqueada,
            'created_at' => $this->createdAt];
    }
}
