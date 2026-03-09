<?php

namespace App\Config\Schema;

use Glory\Contracts\TableSchema;

/**
 * Control de scraping: tracking de URLs procesadas para dedup.
 * La URL se guarda normalizada (decode + lowercase + strip trailing slash).
 */
class ScrapingLogSchema extends TableSchema
{
    public function tabla(): string
    {
        return 'scraping_log';
    }

    public function columnas(): array
    {
        return [
            'id'                => ['tipo' => 'int', 'pk' => true],
            'url'               => ['tipo' => 'string', 'max' => 1000, 'unico' => true],
            'tipo_pagina'       => ['tipo' => 'string', 'max' => 30, 'check' => ['hot_samples', 'hot_covers', 'hot_remixes', 'sample_detail', 'cover_detail', 'remix_detail', 'artist', 'track', 'track_samples', 'track_sampled', 'browse_year', 'browse_genre']],
            'estado'            => ['tipo' => 'string', 'max' => 20, 'default' => 'pendiente', 'check' => ['pendiente', 'procesado', 'error', 'skip']],
            'intentos'          => ['tipo' => 'int', 'default' => 0],
            'bytes_descargados' => ['tipo' => 'int', 'default' => 0],
            'error_mensaje'     => ['tipo' => 'text', 'nullable' => true],
            'procesado_at'      => ['tipo' => 'datetime', 'nullable' => true],
            'created_at'        => ['tipo' => 'datetime', 'default' => 'NOW()'],
        ];
    }
}
