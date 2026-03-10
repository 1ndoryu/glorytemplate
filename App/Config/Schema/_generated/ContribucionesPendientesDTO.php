<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ContribucionesPendientesSchema.php */

namespace App\Config\Schema\_generated;

final class ContribucionesPendientesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $contribuidorId,
        public readonly ?int $cancionDestinoId,
        public readonly ?int $cancionFuenteId,
        public readonly ?string $cancionNuevaTitulo,
        public readonly ?string $cancionNuevaArtista,
        public readonly ?string $cancionNuevaYoutubeUrl,
        public readonly ?string $cancionNuevaLado,
        public readonly string $tipoRelacion,
        public readonly string $tipoElemento,
        public readonly string $estado,
        public readonly ?int $moderadorId,
        public readonly ?string $moderadorNota,
        public readonly ?int $relacionCreadaId,
        public readonly string $createdAt,
        public readonly ?string $resueltoAt
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en contribuciones_pendientes", 'contribuciones_pendientes', 'id')),
            contribuidorId: (int) ($row['contribuidor_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'contribuidor_id' ausente en contribuciones_pendientes", 'contribuciones_pendientes', 'contribuidor_id')),
            cancionDestinoId: isset($row['cancion_destino_id']) ? (int) $row['cancion_destino_id'] : null,
            cancionFuenteId: isset($row['cancion_fuente_id']) ? (int) $row['cancion_fuente_id'] : null,
            cancionNuevaTitulo: isset($row['cancion_nueva_titulo']) ? $row['cancion_nueva_titulo'] : null,
            cancionNuevaArtista: isset($row['cancion_nueva_artista']) ? $row['cancion_nueva_artista'] : null,
            cancionNuevaYoutubeUrl: isset($row['cancion_nueva_youtube_url']) ? $row['cancion_nueva_youtube_url'] : null,
            cancionNuevaLado: isset($row['cancion_nueva_lado']) ? $row['cancion_nueva_lado'] : null,
            tipoRelacion: ($row['tipo_relacion'] ?? 'sample'),
            tipoElemento: ($row['tipo_elemento'] ?? 'multiple_elements'),
            estado: ($row['estado'] ?? 'pendiente'),
            moderadorId: isset($row['moderador_id']) ? (int) $row['moderador_id'] : null,
            moderadorNota: isset($row['moderador_nota']) ? $row['moderador_nota'] : null,
            relacionCreadaId: isset($row['relacion_creada_id']) ? (int) $row['relacion_creada_id'] : null,
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            resueltoAt: isset($row['resuelto_at']) ? $row['resuelto_at'] : null
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
            'contribuidor_id' => $this->contribuidorId,
            'cancion_destino_id' => $this->cancionDestinoId,
            'cancion_fuente_id' => $this->cancionFuenteId,
            'cancion_nueva_titulo' => $this->cancionNuevaTitulo,
            'cancion_nueva_artista' => $this->cancionNuevaArtista,
            'cancion_nueva_youtube_url' => $this->cancionNuevaYoutubeUrl,
            'cancion_nueva_lado' => $this->cancionNuevaLado,
            'tipo_relacion' => $this->tipoRelacion,
            'tipo_elemento' => $this->tipoElemento,
            'estado' => $this->estado,
            'moderador_id' => $this->moderadorId,
            'moderador_nota' => $this->moderadorNota,
            'relacion_creada_id' => $this->relacionCreadaId,
            'created_at' => $this->createdAt,
            'resuelto_at' => $this->resueltoAt];
    }
}
