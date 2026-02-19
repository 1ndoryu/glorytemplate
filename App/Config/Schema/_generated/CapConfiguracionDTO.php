<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapConfiguracionSchema.php */

namespace App\Config\Schema\_generated;

final class CapConfiguracionDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $centroId,
        public readonly string $timezone,
        public readonly string $horaInicioManana,
        public readonly string $horaFinManana,
        public readonly string $horaInicioTarde,
        public readonly string $horaFinTarde,
        public readonly bool $viernesEspecial,
        public readonly string $horaFinViernes,
        public readonly int $alumnosMaxClase,
        public readonly int $duracionClase,
        public readonly int $duracionDescanso,
        public readonly ?array $horariosSemanales,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_configuracion", 'cap_configuracion', 'id')),
            centroId: (int) ($row['centro_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'centro_id' ausente en cap_configuracion", 'cap_configuracion', 'centro_id')),
            timezone: ($row['timezone'] ?? 'Europe/Madrid'),
            horaInicioManana: ($row['hora_inicio_manana'] ?? '09:00:00'),
            horaFinManana: ($row['hora_fin_manana'] ?? '14:00:00'),
            horaInicioTarde: ($row['hora_inicio_tarde'] ?? '16:00:00'),
            horaFinTarde: ($row['hora_fin_tarde'] ?? '21:00:00'),
            viernesEspecial: (bool) ($row['viernes_especial'] ?? 0),
            horaFinViernes: ($row['hora_fin_viernes'] ?? '15:00:00'),
            alumnosMaxClase: (int) ($row['alumnos_max_clase'] ?? 20),
            duracionClase: (int) ($row['duracion_clase'] ?? 60),
            duracionDescanso: (int) ($row['duracion_descanso'] ?? 15),
            horariosSemanales: isset($row['horarios_semanales']) ? (is_string($row['horarios_semanales']) ? json_decode($row['horarios_semanales'], true) : $row['horarios_semanales']) : null,
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
            'timezone' => $this->timezone,
            'hora_inicio_manana' => $this->horaInicioManana,
            'hora_fin_manana' => $this->horaFinManana,
            'hora_inicio_tarde' => $this->horaInicioTarde,
            'hora_fin_tarde' => $this->horaFinTarde,
            'viernes_especial' => $this->viernesEspecial,
            'hora_fin_viernes' => $this->horaFinViernes,
            'alumnos_max_clase' => $this->alumnosMaxClase,
            'duracion_clase' => $this->duracionClase,
            'duracion_descanso' => $this->duracionDescanso,
            'horarios_semanales' => $this->horariosSemanales,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
