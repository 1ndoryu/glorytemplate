<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/NotificacionesSchema.php */

namespace App\Config\Schema\_generated;

final class NotificacionesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $usuarioId,
        public readonly string $tipo,
        public readonly ?string $titulo,
        public readonly string $mensaje,
        public readonly bool $leida,
        public readonly ?string $enlace,
        public readonly ?int $actorId,
        public readonly string $createdAt,
        public readonly array $datos
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en notificaciones", 'notificaciones', 'id')),
            usuarioId: (int) ($row['usuario_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'usuario_id' ausente en notificaciones", 'notificaciones', 'usuario_id')),
            tipo: ($row['tipo'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo' ausente en notificaciones", 'notificaciones', 'tipo')),
            titulo: isset($row['titulo']) ? $row['titulo'] : null,
            mensaje: ($row['mensaje'] ?? ''),
            leida: (bool) ($row['leida'] ?? false),
            enlace: isset($row['enlace']) ? $row['enlace'] : null,
            actorId: isset($row['actor_id']) ? (int) $row['actor_id'] : null,
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            datos: isset($row['datos']) ? (is_string($row['datos']) ? json_decode($row['datos'], true) ?? [] : $row['datos']) : []
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
            'tipo' => $this->tipo,
            'titulo' => $this->titulo,
            'mensaje' => $this->mensaje,
            'leida' => $this->leida,
            'enlace' => $this->enlace,
            'actor_id' => $this->actorId,
            'created_at' => $this->createdAt,
            'datos' => $this->datos];
    }
}
