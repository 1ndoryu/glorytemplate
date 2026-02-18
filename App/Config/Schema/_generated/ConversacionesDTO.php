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
            ultimoMensajeAt: ($row['ultimo_mensaje_at'] ?? date('Y-m-d H:i:s')),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s'))
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
            'ultimo_mensaje_at' => $this->ultimoMensajeAt,
            'created_at' => $this->createdAt];
    }
}
