<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ArticulosLikesSchema.php */

namespace App\Config\Schema\_generated;

final class ArticulosLikesDTO
{
    public function __construct(
        public readonly int $usuarioId,
        public readonly int $articuloId,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en articulos_likes", 'articulos_likes', 'usuario_id')),
            articuloId: (int) ($row['articulo_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'articulo_id' ausente en articulos_likes", 'articulos_likes', 'articulo_id')),
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
            'usuario_id' => $this->usuarioId,
            'articulo_id' => $this->articuloId,
            'created_at' => $this->createdAt];
    }
}
