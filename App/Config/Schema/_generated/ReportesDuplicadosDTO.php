<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ReportesDuplicadosSchema.php */

namespace App\Config\Schema\_generated;

final class ReportesDuplicadosDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $sampleOriginalId,
        public readonly int $sampleDuplicadoId,
        public readonly int $reportadorId,
        public readonly string $estado,
        public readonly string $pruebasTexto,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en reportes_duplicados", 'reportes_duplicados', 'id')),
            sampleOriginalId: (int) ($row['sample_original_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_original_id' ausente en reportes_duplicados", 'reportes_duplicados', 'sample_original_id')),
            sampleDuplicadoId: (int) ($row['sample_duplicado_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'sample_duplicado_id' ausente en reportes_duplicados", 'reportes_duplicados', 'sample_duplicado_id')),
            reportadorId: (int) ($row['reportador_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'reportador_id' ausente en reportes_duplicados", 'reportes_duplicados', 'reportador_id')),
            estado: ($row['estado'] ?? 'reportado'),
            pruebasTexto: ($row['pruebas_texto'] ?? ''),
            resueltoAt: isset($row['resuelto_at']) ? $row['resuelto_at'] : null,
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
            'reportador_id' => $this->reportadorId,
            'estado' => $this->estado,
            'pruebas_texto' => $this->pruebasTexto,
            'resuelto_at' => $this->resueltoAt,
            'created_at' => $this->createdAt];
    }
}
