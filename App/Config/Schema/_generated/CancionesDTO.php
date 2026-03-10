<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CancionesSchema.php */

namespace App\Config\Schema\_generated;

final class CancionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $titulo,
        public readonly string $slug,
        public readonly int $artistaId,
        public readonly ?string $album,
        public readonly ?string $sello,
        public readonly ?int $anio,
        public readonly ?int $duracionSegundos,
        public readonly ?string $genero,
        public readonly ?string $youtubeId,
        public readonly ?string $spotifyId,
        public readonly ?string $imagenUrl,
        public readonly ?string $whosampledUrl,
        public readonly ?int $bpm,
        public readonly ?string $tonalidad,
        public readonly array $metadata,
        public readonly int $totalSampleada,
        public readonly int $totalSamplea,
        public readonly int $totalLikes,
        public readonly int $totalComentarios,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en canciones", 'canciones', 'id')),
            titulo: ($row['titulo'] ?? throw new \Glory\Exception\SchemaException("Columna 'titulo' ausente en canciones", 'canciones', 'titulo')),
            slug: ($row['slug'] ?? throw new \Glory\Exception\SchemaException("Columna 'slug' ausente en canciones", 'canciones', 'slug')),
            artistaId: (int) ($row['artista_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'artista_id' ausente en canciones", 'canciones', 'artista_id')),
            album: isset($row['album']) ? $row['album'] : null,
            sello: isset($row['sello']) ? $row['sello'] : null,
            anio: isset($row['anio']) ? (int) $row['anio'] : null,
            duracionSegundos: isset($row['duracion_segundos']) ? (int) $row['duracion_segundos'] : null,
            genero: isset($row['genero']) ? $row['genero'] : null,
            youtubeId: isset($row['youtube_id']) ? $row['youtube_id'] : null,
            spotifyId: isset($row['spotify_id']) ? $row['spotify_id'] : null,
            imagenUrl: isset($row['imagen_url']) ? $row['imagen_url'] : null,
            whosampledUrl: isset($row['whosampled_url']) ? $row['whosampled_url'] : null,
            bpm: isset($row['bpm']) ? (int) $row['bpm'] : null,
            tonalidad: isset($row['tonalidad']) ? $row['tonalidad'] : null,
            metadata: isset($row['metadata']) ? (is_string($row['metadata']) ? json_decode($row['metadata'], true) ?? [] : $row['metadata']) : [],
            totalSampleada: (int) ($row['total_sampleada'] ?? 0),
            totalSamplea: (int) ($row['total_samplea'] ?? 0),
            totalLikes: (int) ($row['total_likes'] ?? 0),
            totalComentarios: (int) ($row['total_comentarios'] ?? 0),
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
            'titulo' => $this->titulo,
            'slug' => $this->slug,
            'artista_id' => $this->artistaId,
            'album' => $this->album,
            'sello' => $this->sello,
            'anio' => $this->anio,
            'duracion_segundos' => $this->duracionSegundos,
            'genero' => $this->genero,
            'youtube_id' => $this->youtubeId,
            'spotify_id' => $this->spotifyId,
            'imagen_url' => $this->imagenUrl,
            'whosampled_url' => $this->whosampledUrl,
            'bpm' => $this->bpm,
            'tonalidad' => $this->tonalidad,
            'metadata' => $this->metadata,
            'total_sampleada' => $this->totalSampleada,
            'total_samplea' => $this->totalSamplea,
            'total_likes' => $this->totalLikes,
            'total_comentarios' => $this->totalComentarios,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
