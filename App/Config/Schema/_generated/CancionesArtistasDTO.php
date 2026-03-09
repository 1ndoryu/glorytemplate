<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/CancionesArtistasSchema.php */

namespace App\Config\Schema\_generated;

final class CancionesArtistasDTO
{
    public function __construct(
        public readonly int $cancionId,
        public readonly int $artistaId,
        public readonly string $rol
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            cancionId: (int) ($row['cancion_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'cancion_id' ausente en canciones_artistas", 'canciones_artistas', 'cancion_id')),
            artistaId: (int) ($row['artista_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'artista_id' ausente en canciones_artistas", 'canciones_artistas', 'artista_id')),
            rol: ($row['rol'] ?? 'principal')
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
            'cancion_id' => $this->cancionId,
            'artista_id' => $this->artistaId,
            'rol' => $this->rol];
    }
}
