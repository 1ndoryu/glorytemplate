<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/DuplicadosPendientesSchema.php */

namespace App\Config\Schema\_generated;

final class DuplicadosPendientesDTO
{
    public function __construct(
        public readonly mixed $id,
        public readonly int $sampleOriginalId,
        public readonly int $sampleDuplicadoId,
        public readonly mixed $tipo,
        public readonly mixed $estado,
        public readonly ?int $resueltoPor,
        public readonly ?string $resueltoAt,
        public readonly ?string $notas,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en duplicados_pendientes", 'duplicados_pendientes', 'id')),
            sampleOriginalId: (int) ($row['sample_original_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_original_id' ausente en duplicados_pendientes", 'duplicados_pendientes', 'sample_original_id')),
            sampleDuplicadoId: (int) ($row['sample_duplicado_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_duplicado_id' ausente en duplicados_pendientes", 'duplicados_pendientes', 'sample_duplicado_id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en duplicados_pendientes", 'duplicados_pendientes', 'tipo')),
            estado: ($row['estado'] ?? 'pendiente'),
            resueltoPor: isset($row['resuelto_por']) ? (int) $row['resuelto_por'] : null,
            resueltoAt: isset($row['resuelto_at']) ? $row['resuelto_at'] : null,
            notas: isset($row['notas']) ? $row['notas'] : null,
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
            'sample_original_id' => $this->sampleOriginalId,
            'sample_duplicado_id' => $this->sampleDuplicadoId,
            'tipo' => $this->tipo,
            'estado' => $this->estado,
            'resuelto_por' => $this->resueltoPor,
            'resuelto_at' => $this->resueltoAt,
            'notas' => $this->notas,
            'created_at' => $this->createdAt];
    }
}
