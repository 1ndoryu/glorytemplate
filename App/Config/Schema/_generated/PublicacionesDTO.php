<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/PublicacionesSchema.php */

namespace App\Config\Schema\_generated;

final class PublicacionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $autorId,
        public readonly string $tipo,
        public readonly string $contenido,
        public readonly array $imagenes,
        public readonly array $samplesAdjuntos,
        public readonly int $totalLikes,
        public readonly int $totalComentarios,
        public readonly int $totalReposts,
        public readonly string $createdAt,
        public readonly ?int $repostId,
        public readonly array $imagenesMetadata,
        public readonly string $moderacionEstado,
        public readonly array $moderacionDetalle,
        public readonly ?string $moderacionRazon,
        public readonly string $updatedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en publicaciones", 'publicaciones', 'id')),
            autorId: (int) ($row['autor_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'autor_id' ausente en publicaciones", 'publicaciones', 'autor_id')),
            tipo: ($row['tipo'] ?? 'social'),
            contenido: ($row['contenido'] ?? ''),
            imagenes: (array) ($row['imagenes'] ?? '{}'),
            samplesAdjuntos: (array) ($row['samples_adjuntos'] ?? '{}'),
            totalLikes: (int) ($row['total_likes'] ?? 0),
            totalComentarios: (int) ($row['total_comentarios'] ?? 0),
            totalReposts: (int) ($row['total_reposts'] ?? 0),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            repostId: isset($row['repost_id']) ? (int) $row['repost_id'] : null,
            imagenesMetadata: isset($row['imagenes_metadata']) ? (is_string($row['imagenes_metadata']) ? json_decode($row['imagenes_metadata'], true) ?? [] : $row['imagenes_metadata']) : [],
            moderacionEstado: ($row['moderacion_estado'] ?? 'pendiente'),
            moderacionDetalle: isset($row['moderacion_detalle']) ? (is_string($row['moderacion_detalle']) ? json_decode($row['moderacion_detalle'], true) ?? [] : $row['moderacion_detalle']) : [],
            moderacionRazon: isset($row['moderacion_razon']) ? $row['moderacion_razon'] : null,
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
            'autor_id' => $this->autorId,
            'tipo' => $this->tipo,
            'contenido' => $this->contenido,
            'imagenes' => $this->imagenes,
            'samples_adjuntos' => $this->samplesAdjuntos,
            'total_likes' => $this->totalLikes,
            'total_comentarios' => $this->totalComentarios,
            'total_reposts' => $this->totalReposts,
            'created_at' => $this->createdAt,
            'repost_id' => $this->repostId,
            'imagenes_metadata' => $this->imagenesMetadata,
            'moderacion_estado' => $this->moderacionEstado,
            'moderacion_detalle' => $this->moderacionDetalle,
            'moderacion_razon' => $this->moderacionRazon,
            'updated_at' => $this->updatedAt];
    }
}
