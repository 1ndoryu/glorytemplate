<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ReportesSchema.php */

namespace App\Config\Schema\_generated;

final class ReportesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $tipo,
        public readonly int $targetId,
        public readonly int $reportadorId,
        public readonly ?int $reportadoId,
        public readonly string $razon,
        public readonly ?string $detalles,
        public readonly string $estado,
        public readonly ?int $resueltoPor,
        public readonly ?string $resueltoAt,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en reportes", 'reportes', 'id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en reportes", 'reportes', 'tipo')),
            targetId: (int) ($row['target_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'target_id' ausente en reportes", 'reportes', 'target_id')),
            reportadorId: (int) ($row['reportador_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'reportador_id' ausente en reportes", 'reportes', 'reportador_id')),
            reportadoId: isset($row['reportado_id']) ? (int) $row['reportado_id'] : null,
            razon: ($row['razon'] ?? throw new \Glory\Exception\SchemaException("Columna 'razon' ausente en reportes", 'reportes', 'razon')),
            detalles: isset($row['detalles']) ? $row['detalles'] : null,
            estado: ($row['estado'] ?? 'pendiente'),
            resueltoPor: isset($row['resuelto_por']) ? (int) $row['resuelto_por'] : null,
            resueltoAt: isset($row['resuelto_at']) ? $row['resuelto_at'] : null,
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
