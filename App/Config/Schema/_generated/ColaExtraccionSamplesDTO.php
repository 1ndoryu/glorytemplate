<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColaExtraccionSamplesSchema.php */

namespace App\Config\Schema\_generated;

final class ColaExtraccionSamplesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $relacionId,
        public readonly string $youtubeId,
        public readonly int $timingInicioSeg,
        public readonly ?int $bpmDetectado,
        public readonly ?float $duracionCompasSeg,
        public readonly ?float $compasInicioSeg,
        public readonly ?float $compasFinSeg,
        public readonly string $estado,
        public readonly ?int $sampleId,
        public readonly ?string $errorMensaje,
        public readonly int $intentos,
        public readonly ?string $procesadoAt,
        public readonly string $createdAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cola_extraccion_samples", 'cola_extraccion_samples', 'id')),
            relacionId: (int) ($row['relacion_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'relacion_id' ausente en cola_extraccion_samples", 'cola_extraccion_samples', 'relacion_id')),
            youtubeId: ($row['youtube_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'youtube_id' ausente en cola_extraccion_samples", 'cola_extraccion_samples', 'youtube_id')),
            timingInicioSeg: (int) ($row['timing_inicio_seg'] ?? throw new \Glory\Exception\SchemaException("Columna 'timing_inicio_seg' ausente en cola_extraccion_samples", 'cola_extraccion_samples', 'timing_inicio_seg')),
            bpmDetectado: isset($row['bpm_detectado']) ? (int) $row['bpm_detectado'] : null,
            duracionCompasSeg: isset($row['duracion_compas_seg']) ? (float) $row['duracion_compas_seg'] : null,
            compasInicioSeg: isset($row['compas_inicio_seg']) ? (float) $row['compas_inicio_seg'] : null,
            compasFinSeg: isset($row['compas_fin_seg']) ? (float) $row['compas_fin_seg'] : null,
            estado: ($row['estado'] ?? 'pendiente'),
            sampleId: isset($row['sample_id']) ? (int) $row['sample_id'] : null,
            errorMensaje: isset($row['error_mensaje']) ? $row['error_mensaje'] : null,
            intentos: (int) ($row['intentos'] ?? 0),
            procesadoAt: isset($row['procesado_at']) ? $row['procesado_at'] : null,
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
            'relacion_id' => $this->relacionId,
            'youtube_id' => $this->youtubeId,
            'timing_inicio_seg' => $this->timingInicioSeg,
            'bpm_detectado' => $this->bpmDetectado,
            'duracion_compas_seg' => $this->duracionCompasSeg,
            'compas_inicio_seg' => $this->compasInicioSeg,
            'compas_fin_seg' => $this->compasFinSeg,
            'estado' => $this->estado,
            'sample_id' => $this->sampleId,
            'error_mensaje' => $this->errorMensaje,
            'intentos' => $this->intentos,
            'procesado_at' => $this->procesadoAt,
            'created_at' => $this->createdAt];
    }
}
