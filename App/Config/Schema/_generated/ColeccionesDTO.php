<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColeccionesSchema.php */

namespace App\Config\Schema\_generated;

final class ColeccionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $usuarioId,
        public readonly ?int $parentId,
        public readonly string $nombre,
        public readonly string $descripcion,
        public readonly ?string $imagenUrl,
        public readonly bool $publica,
        public readonly int $totalSamples,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?string $portadaUrl,
        public readonly int $version
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en colecciones", 'colecciones', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en colecciones", 'colecciones', 'usuario_id')),
            parentId: isset($row['parent_id']) ? (int) $row['parent_id'] : null,
            nombre: ($row['nombre'] ?? throw new \Glory\Exception\SchemaException("Columna 'nombre' ausente en colecciones", 'colecciones', 'nombre')),
            descripcion: ($row['descripcion'] ?? ''),
            imagenUrl: isset($row['imagen_url']) ? $row['imagen_url'] : null,
            publica: (bool) ($row['publica'] ?? true),
            totalSamples: (int) ($row['total_samples'] ?? 0),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            updatedAt: ($row['updated_at'] ?? date('Y-m-d H:i:s')),
            portadaUrl: isset($row['portada_url']) ? $row['portada_url'] : null,
            version: (int) ($row['version'] ?? 1)
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
            'parent_id' => $this->parentId,
            'nombre' => $this->nombre,
            'descripcion' => $this->descripcion,
            'imagen_url' => $this->imagenUrl,
            'publica' => $this->publica,
            'total_samples' => $this->totalSamples,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
            'portada_url' => $this->portadaUrl,
            'version' => $this->version];
    }
}
