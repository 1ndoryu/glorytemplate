<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/LikesSchema.php */

namespace App\Config\Schema\_generated;

final class LikesDTO
{
    public function __construct(
        public readonly int $usuarioId,
        public readonly string $tipo,
        public readonly int $targetId,
        public readonly string $createdAt,
        public readonly string $reaccion
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en likes", 'likes', 'usuario_id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en likes", 'likes', 'tipo')),
            targetId: (int) ($row['target_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'target_id' ausente en likes", 'likes', 'target_id')),
            createdAt: ($row['created_at'] ?? 'NOW()'),
            reaccion: ($row['reaccion'] ?? 'like')
        );
    }

    /**
     * Convertir a array asociativo (para serialización JSON).
     */
    public function aArray(): array
    {
        return get_object_vars($this);
    }
}
