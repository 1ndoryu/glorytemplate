<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ComentariosSchema.php */

namespace App\Config\Schema\_generated;

final class ComentariosDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $autorId,
        public readonly string $tipo,
        public readonly int $targetId,
        public readonly ?string $contenido,
        public readonly string $createdAt,
        public readonly string $tipoContenido,
        public readonly ?string $mediaUrl,
        public readonly ?array $mediaMetadata,
        public readonly string $moderacionEstado,
        public readonly array $moderacionDetalle,
        public readonly ?int $parentId,
        public readonly int $totalRespuestas,
        public readonly int $totalLikes,
        public readonly ?string $updatedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en comentarios", 'comentarios', 'id')),
            autorId: (int) ($row['autor_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'autor_id' ausente en comentarios", 'comentarios', 'autor_id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en comentarios", 'comentarios', 'tipo')),
            targetId: (int) ($row['target_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'target_id' ausente en comentarios", 'comentarios', 'target_id')),
            contenido: isset($row['contenido']) ? $row['contenido'] : null,
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            tipoContenido: ($row['tipo_contenido'] ?? 'texto'),
            mediaUrl: isset($row['media_url']) ? $row['media_url'] : null,
            mediaMetadata: isset($row['media_metadata']) ? (is_string($row['media_metadata']) ? json_decode($row['media_metadata'], true) : $row['media_metadata']) : null,
            moderacionEstado: ($row['moderacion_estado'] ?? 'aprobado'),
            moderacionDetalle: isset($row['moderacion_detalle']) ? (is_string($row['moderacion_detalle']) ? json_decode($row['moderacion_detalle'], true) ?? [] : $row['moderacion_detalle']) : [],
            parentId: isset($row['parent_id']) ? (int) $row['parent_id'] : null,
            totalRespuestas: (int) ($row['total_respuestas'] ?? 0),
            totalLikes: (int) ($row['total_likes'] ?? 0),
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
            'autor_id' => $this->autorId,
            'tipo' => $this->tipo,
            'target_id' => $this->targetId,
            'contenido' => $this->contenido,
            'created_at' => $this->createdAt,
            'tipo_contenido' => $this->tipoContenido,
            'media_url' => $this->mediaUrl,
            'media_metadata' => $this->mediaMetadata,
            'moderacion_estado' => $this->moderacionEstado,
            'moderacion_detalle' => $this->moderacionDetalle,
            'parent_id' => $this->parentId,
            'total_respuestas' => $this->totalRespuestas,
            'total_likes' => $this->totalLikes,
            'updated_at' => $this->updatedAt];
    }
}
