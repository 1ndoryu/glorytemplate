<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ColaProcesamientoIaSchema.php */

namespace App\Config\Schema\_generated;

final class ColaProcesamientoIaDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $tipo,
        public readonly int $entidadId,
        public readonly string $operacion,
        public readonly string $estado,
        public readonly int $intentos,
        public readonly int $maxIntentos,
        public readonly ?string $ultimoError,
        public readonly ?string $proximoIntento,
        public readonly array $metadata,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en cola_procesamiento_ia", 'cola_procesamiento_ia', 'id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en cola_procesamiento_ia", 'cola_procesamiento_ia', 'tipo')),
            entidadId: (int) ($row['entidad_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'entidad_id' ausente en cola_procesamiento_ia", 'cola_procesamiento_ia', 'entidad_id')),
            operacion: ($row['operacion'] ?? throw new \Glory\Exception\SchemaException("Columna 'operacion' ausente en cola_procesamiento_ia", 'cola_procesamiento_ia', 'operacion')),
            estado: ($row['estado'] ?? 'pendiente'),
            intentos: (int) ($row['intentos'] ?? 0),
            maxIntentos: (int) ($row['max_intentos'] ?? 2),
            ultimoError: isset($row['ultimo_error']) ? $row['ultimo_error'] : null,
            proximoIntento: isset($row['proximo_intento']) ? $row['proximo_intento'] : null,
            metadata: isset($row['metadata']) ? (is_string($row['metadata']) ? json_decode($row['metadata'], true) ?? [] : $row['metadata']) : [],
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
            'tipo' => $this->tipo,
            'entidad_id' => $this->entidadId,
            'operacion' => $this->operacion,
            'estado' => $this->estado,
            'intentos' => $this->intentos,
            'max_intentos' => $this->maxIntentos,
            'ultimo_error' => $this->ultimoError,
            'proximo_intento' => $this->proximoIntento,
            'metadata' => $this->metadata,
            'procesado_at' => $this->procesadoAt,
            'created_at' => $this->createdAt];
    }
}
