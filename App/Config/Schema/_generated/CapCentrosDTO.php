<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CapCentrosSchema.php */

namespace App\Config\Schema\_generated;

final class CapCentrosDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $userId,
        public readonly string $nombre,
        public readonly string $direccion,
        public readonly string $telefono,
        public readonly string $email,
        public readonly string $logoUrl,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cap_centros", 'cap_centros', 'id')),
            userId: (int) ($row['user_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'user_id' ausente en cap_centros", 'cap_centros', 'user_id')),
            nombre: ($row['nombre'] ?? throw new \Glory\Exception\SchemaException("Columna 'nombre' ausente en cap_centros", 'cap_centros', 'nombre')),
            direccion: ($row['direccion'] ?? ''),
            telefono: ($row['telefono'] ?? ''),
            email: ($row['email'] ?? ''),
            logoUrl: ($row['logo_url'] ?? ''),
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
            'user_id' => $this->userId,
            'nombre' => $this->nombre,
            'direccion' => $this->direccion,
            'telefono' => $this->telefono,
            'email' => $this->email,
            'logo_url' => $this->logoUrl,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
