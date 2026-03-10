<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/RelacionesSampleSchema.php */

namespace App\Config\Schema\_generated;

final class RelacionesSampleDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $cancionDestinoId,
        public readonly int $cancionFuenteId,
        public readonly ?int $whosampledId,
        public readonly string $tipoRelacion,
        public readonly string $tipoElemento,
        public readonly array $timingsDestino,
        public readonly array $timingsFuente,
        public readonly bool $apareceEnTodo,
        public readonly ?int $sampleId,
        public readonly ?int $sampleFuenteId,
        public readonly ?int $sampleDestinoId,
        public readonly int $votosTotal,
        public readonly float $votosPromedio,
        public readonly string $fuente,
        public readonly ?int $contribuidorId,
        public readonly bool $verificada,
        public readonly int $totalLikes,
        public readonly int $totalComentarios,
        public readonly string $createdAt,
        public readonly string $updatedAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en relaciones_sample", 'relaciones_sample', 'id')),
            cancionDestinoId: (int) ($row['cancion_destino_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'cancion_destino_id' ausente en relaciones_sample", 'relaciones_sample', 'cancion_destino_id')),
            cancionFuenteId: (int) ($row['cancion_fuente_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'cancion_fuente_id' ausente en relaciones_sample", 'relaciones_sample', 'cancion_fuente_id')),
            whosampledId: isset($row['whosampled_id']) ? (int) $row['whosampled_id'] : null,
            tipoRelacion: ($row['tipo_relacion'] ?? 'sample'),
            tipoElemento: ($row['tipo_elemento'] ?? 'multiple_elements'),
            timingsDestino: isset($row['timings_destino']) ? (is_string($row['timings_destino']) ? json_decode($row['timings_destino'], true) ?? [] : $row['timings_destino']) : [],
            timingsFuente: isset($row['timings_fuente']) ? (is_string($row['timings_fuente']) ? json_decode($row['timings_fuente'], true) ?? [] : $row['timings_fuente']) : [],
            apareceEnTodo: (bool) ($row['aparece_en_todo'] ?? false),
            sampleId: isset($row['sample_id']) ? (int) $row['sample_id'] : null,
            sampleFuenteId: isset($row['sample_fuente_id']) ? (int) $row['sample_fuente_id'] : null,
            sampleDestinoId: isset($row['sample_destino_id']) ? (int) $row['sample_destino_id'] : null,
            votosTotal: (int) ($row['votos_total'] ?? 0),
            votosPromedio: (float) ($row['votos_promedio'] ?? 0),
            fuente: ($row['fuente'] ?? 'scraping'),
            contribuidorId: isset($row['contribuidor_id']) ? (int) $row['contribuidor_id'] : null,
            verificada: (bool) ($row['verificada'] ?? false),
            totalLikes: (int) ($row['total_likes'] ?? 0),
            totalComentarios: (int) ($row['total_comentarios'] ?? 0),
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            updatedAt: ($row['updated_at'] ?? date('Y-m-d H:i:s'))
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
            'cancion_destino_id' => $this->cancionDestinoId,
            'cancion_fuente_id' => $this->cancionFuenteId,
            'whosampled_id' => $this->whosampledId,
            'tipo_relacion' => $this->tipoRelacion,
            'tipo_elemento' => $this->tipoElemento,
            'timings_destino' => $this->timingsDestino,
            'timings_fuente' => $this->timingsFuente,
            'aparece_en_todo' => $this->apareceEnTodo,
            'sample_id' => $this->sampleId,
            'sample_fuente_id' => $this->sampleFuenteId,
            'sample_destino_id' => $this->sampleDestinoId,
            'votos_total' => $this->votosTotal,
            'votos_promedio' => $this->votosPromedio,
            'fuente' => $this->fuente,
            'contribuidor_id' => $this->contribuidorId,
            'verificada' => $this->verificada,
            'total_likes' => $this->totalLikes,
            'total_comentarios' => $this->totalComentarios,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt];
    }
}
