<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapAlumnosSchema.php */

namespace App\Config\Schema\_generated;

final class CapAlumnosDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $centroId,
        public readonly string $nombre,
        public readonly string $email,
        public readonly string $telefono,
        public readonly string $dni,
        public readonly float $horasCompletadas,
        public readonly string $estado,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_alumnos", 'cap_alumnos', 'id')),
            centroId: (int) ($row['centro_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'centro_id' ausente en cap_alumnos", 'cap_alumnos', 'centro_id')),
            nombre: ($row['nombre'] ?? throw new \Glory\Exception\SchemaException("Columna 'nombre' ausente en cap_alumnos", 'cap_alumnos', 'nombre')),
            email: ($row['email'] ?? ''),
            telefono: ($row['telefono'] ?? ''),
            dni: ($row['dni'] ?? ''),
            horasCompletadas: (float) ($row['horas_completadas'] ?? 0),
            estado: ($row['estado'] ?? 'activo'),
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
            'nombre' => $this->nombre,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'dni' => $this->dni,
            'horas_completadas' => $this->horasCompletadas,
            'estado' => $this->estado,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
