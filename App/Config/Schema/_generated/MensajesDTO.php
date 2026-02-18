<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/MensajesSchema.php */

namespace App\Config\Schema\_generated;

final class MensajesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $conversacionId,
        public readonly int $autorId,
        public readonly string $contenido,
        public readonly bool $leido,
        public readonly string $createdAt,
        public readonly string $tipo,
        public readonly ?string $mediaUrl,
        public readonly ?array $mediaMetadata
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en mensajes", 'mensajes', 'id')),
            conversacionId: (int) ($row['conversacion_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'conversacion_id' ausente en mensajes", 'mensajes', 'conversacion_id')),
            autorId: (int) ($row['autor_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'autor_id' ausente en mensajes", 'mensajes', 'autor_id')),
            contenido: ($row['contenido'] ?? throw new \Glory\Exception\SchemaException("Columna 'contenido' ausente en mensajes", 'mensajes', 'contenido')),
            leido: (bool) ($row['leido'] ?? false),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            tipo: ($row['tipo'] ?? 'texto'),
            mediaUrl: isset($row['media_url']) ? $row['media_url'] : null,
            mediaMetadata: isset($row['media_metadata']) ? (is_string($row['media_metadata']) ? json_decode($row['media_metadata'], true) : $row['media_metadata']) : null
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
            'conversacion_id' => $this->conversacionId,
            'autor_id' => $this->autorId,
            'contenido' => $this->contenido,
            'leido' => $this->leido,
            'created_at' => $this->createdAt,
            'tipo' => $this->tipo,
            'media_url' => $this->mediaUrl,
            'media_metadata' => $this->mediaMetadata];
    }
}
