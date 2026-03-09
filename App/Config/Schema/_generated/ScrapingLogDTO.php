<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ScrapingLogSchema.php */

namespace App\Config\Schema\_generated;

final class ScrapingLogDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $url,
        public readonly string $tipoPagina,
        public readonly string $estado,
        public readonly int $intentos,
        public readonly int $bytesDescargados,
        public readonly ?string $errorMensaje,
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
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en scraping_log", 'scraping_log', 'id')),
            url: ($row['url'] ?? throw new \Glory\Exception\SchemaException("Columna 'url' ausente en scraping_log", 'scraping_log', 'url')),
            tipoPagina: ($row['tipo_pagina'] ?? throw new \Glory\Exception\SchemaException("Columna 'tipo_pagina' ausente en scraping_log", 'scraping_log', 'tipo_pagina')),
            estado: ($row['estado'] ?? 'pendiente'),
            intentos: (int) ($row['intentos'] ?? 0),
            bytesDescargados: (int) ($row['bytes_descargados'] ?? 0),
            errorMensaje: isset($row['error_mensaje']) ? $row['error_mensaje'] : null,
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
            'url' => $this->url,
            'tipo_pagina' => $this->tipoPagina,
            'estado' => $this->estado,
            'intentos' => $this->intentos,
            'bytes_descargados' => $this->bytesDescargados,
            'error_mensaje' => $this->errorMensaje,
            'procesado_at' => $this->procesadoAt,
            'created_at' => $this->createdAt];
    }
}
