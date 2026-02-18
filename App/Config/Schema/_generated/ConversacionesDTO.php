<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ConversacionesSchema.php */

namespace App\Config\Schema\_generated;

final class ConversacionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $ultimoMensajeAt,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en conversaciones", 'conversaciones', 'id')),
            ultimoMensajeAt: ($row['ultimo_mensaje_at'] ?? 'NOW()'),
            createdAt: ($row['created_at'] ?? 'NOW()')
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
