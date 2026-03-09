<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColeccionSamplesSchema.php */

namespace App\Config\Schema\_generated;

final class ColeccionSamplesDTO
{
    public function __construct(
        public readonly int $coleccionId,
        public readonly int $sampleId,
        public readonly int $usuarioId,
        public readonly int $posicion,
        public readonly string $addedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            coleccionId: (int) ($row['coleccion_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'coleccion_id' ausente en coleccion_samples", 'coleccion_samples', 'coleccion_id')),
            sampleId: (int) ($row['sample_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_id' ausente en coleccion_samples", 'coleccion_samples', 'sample_id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en coleccion_samples", 'coleccion_samples', 'usuario_id')),
            posicion: (int) ($row['posicion'] ?? 0),
            addedAt: ($row['added_at'] ?? date('Y-m-d H:i:s'))
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
            'coleccion_id' => $this->coleccionId,
            'sample_id' => $this->sampleId,
            'usuario_id' => $this->usuarioId,
            'posicion' => $this->posicion,
            'added_at' => $this->addedAt];
    }
}
