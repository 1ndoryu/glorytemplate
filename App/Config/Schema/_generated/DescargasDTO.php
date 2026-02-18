<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/DescargasSchema.php */

namespace App\Config\Schema\_generated;

final class DescargasDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $usuarioId,
        public readonly int $sampleId,
        public readonly string $calidad,
        public readonly string $createdAt,
        public readonly int $tamanoBytes
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en descargas", 'descargas', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en descargas", 'descargas', 'usuario_id')),
            sampleId: (int) ($row['sample_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_id' ausente en descargas", 'descargas', 'sample_id')),
            calidad: ($row['calidad'] ?? 'mp3'),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            tamanoBytes: (int) ($row['tamano_bytes'] ?? 0)
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
            'sample_id' => $this->sampleId,
            'calidad' => $this->calidad,
            'created_at' => $this->createdAt,
            'tamano_bytes' => $this->tamanoBytes];
    }
}
