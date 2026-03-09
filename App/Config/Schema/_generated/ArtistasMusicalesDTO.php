<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ArtistasMusicalesSchema.php */

namespace App\Config\Schema\_generated;

final class ArtistasMusicalesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $nombre,
        public readonly string $slug,
        public readonly ?string $imagenUrl,
        public readonly ?string $whosampledSlug,
        public readonly ?string $musicbrainzId,
        public readonly array $metadata,
        public readonly int $totalCanciones,
        public readonly string $createdAt,
        public readonly string $updatedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en artistas_musicales", 'artistas_musicales', 'id')),
            nombre: ($row['nombre'] ?? throw new \Glory\Exception\SchemaException("Columna 'nombre' ausente en artistas_musicales", 'artistas_musicales', 'nombre')),
            slug: ($row['slug'] ?? throw new \Glory\Exception\SchemaException("Columna 'slug' ausente en artistas_musicales", 'artistas_musicales', 'slug')),
            imagenUrl: isset($row['imagen_url']) ? $row['imagen_url'] : null,
            whosampledSlug: isset($row['whosampled_slug']) ? $row['whosampled_slug'] : null,
            musicbrainzId: isset($row['musicbrainz_id']) ? $row['musicbrainz_id'] : null,
            metadata: isset($row['metadata']) ? (is_string($row['metadata']) ? json_decode($row['metadata'], true) ?? [] : $row['metadata']) : [],
            totalCanciones: (int) ($row['total_canciones'] ?? 0),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            updatedAt: ($row['updated_at'] ?? date('Y-m-d H:i:s'))
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
            'nombre' => $this->nombre,
            'slug' => $this->slug,
            'imagen_url' => $this->imagenUrl,
            'whosampled_slug' => $this->whosampledSlug,
            'musicbrainz_id' => $this->musicbrainzId,
            'metadata' => $this->metadata,
            'total_canciones' => $this->totalCanciones,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
