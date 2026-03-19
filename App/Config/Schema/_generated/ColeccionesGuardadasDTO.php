<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColeccionesGuardadasSchema.php */

namespace App\Config\Schema\_generated;

final class ColeccionesGuardadasDTO
{
    public function __construct(
        public readonly mixed $id,
        public readonly int $usuarioId,
        public readonly int $coleccionId,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en colecciones_guardadas", 'colecciones_guardadas', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en colecciones_guardadas", 'colecciones_guardadas', 'usuario_id')),
            coleccionId: (int) ($row['coleccion_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'coleccion_id' ausente en colecciones_guardadas", 'colecciones_guardadas', 'coleccion_id')),
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
            'usuario_id' => $this->usuarioId,
            'coleccion_id' => $this->coleccionId,
            'created_at' => $this->createdAt];
    }
}
