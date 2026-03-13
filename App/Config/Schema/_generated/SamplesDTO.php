<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/SamplesSchema.php */

namespace App\Config\Schema\_generated;

final class SamplesDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $creadorId,
        public readonly string $titulo,
        public readonly string $slug,
        public readonly string $descripcion,
        public readonly ?int $bpm,
        public readonly ?string $key,
        public readonly ?string $escala,
        public readonly float $duracion,
        public readonly string $formato,
        public readonly int $tamano,
        public readonly array $metadata,
        public readonly array $tags,
        public readonly string $estado,
        public readonly string $tipo,
        public readonly bool $esPremium,
        public readonly ?float $precio,
        public readonly ?string $rutaOriginal,
        public readonly ?string $rutaOptimizada,
        public readonly ?string $rutaPreview,
        public readonly ?string $rutaWaveform,
        public readonly ?string $imagenUrl,
        public readonly ?string $embedding,
        public readonly int $totalDescargas,
        public readonly int $totalLikes,
        public readonly int $totalReproducciones,
        public readonly ?string $publicadoAt,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?string $idCorto,
        public readonly bool $permitirDescarga,
        public readonly bool $licenciaLibre,
        public readonly ?string $audioHash,
        public readonly ?string $hashParcial,
        public readonly int $totalComentarios,
        public readonly bool $verificado,
        public readonly bool $mostrarEnComunidad,
        public readonly ?int $cancionOrigenId,
        public readonly ?int $relacionSampleoId,
        public readonly ?string $eliminadoEn
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en samples", 'samples', 'id')),
            creadorId: (int) ($row['creador_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'creador_id' ausente en samples", 'samples', 'creador_id')),
            titulo: ($row['titulo'] ?? throw new \Glory\Exception\SchemaException("Columna 'titulo' ausente en samples", 'samples', 'titulo')),
            slug: ($row['slug'] ?? throw new \Glory\Exception\SchemaException("Columna 'slug' ausente en samples", 'samples', 'slug')),
            descripcion: ($row['descripcion'] ?? ''),
            bpm: isset($row['bpm']) ? (int) $row['bpm'] : null,
            key: isset($row['key']) ? $row['key'] : null,
            escala: isset($row['escala']) ? $row['escala'] : null,
            duracion: (float) ($row['duracion'] ?? 0),
            formato: ($row['formato'] ?? 'wav'),
            tamano: (int) ($row['tamano'] ?? 0),
            metadata: isset($row['metadata']) ? (is_string($row['metadata']) ? json_decode($row['metadata'], true) ?? [] : $row['metadata']) : [],
            tags: (array) ($row['tags'] ?? '{}'),
            estado: ($row['estado'] ?? 'procesando'),
            tipo: ($row['tipo'] ?? 'loop'),
            esPremium: (bool) ($row['es_premium'] ?? false),
            precio: isset($row['precio']) ? (float) $row['precio'] : null,
            rutaOriginal: isset($row['ruta_original']) ? $row['ruta_original'] : null,
            rutaOptimizada: isset($row['ruta_optimizada']) ? $row['ruta_optimizada'] : null,
            rutaPreview: isset($row['ruta_preview']) ? $row['ruta_preview'] : null,
            rutaWaveform: isset($row['ruta_waveform']) ? $row['ruta_waveform'] : null,
            imagenUrl: isset($row['imagen_url']) ? $row['imagen_url'] : null,
            embedding: isset($row['embedding']) ? $row['embedding'] : null,
            totalDescargas: (int) ($row['total_descargas'] ?? 0),
            totalLikes: (int) ($row['total_likes'] ?? 0),
            totalReproducciones: (int) ($row['total_reproducciones'] ?? 0),
            publicadoAt: isset($row['publicado_at']) ? $row['publicado_at'] : null,
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            updatedAt: ($row['updated_at'] ?? date('Y-m-d H:i:s')),
            idCorto: isset($row['id_corto']) ? $row['id_corto'] : null,
            permitirDescarga: (bool) ($row['permitir_descarga'] ?? true),
            licenciaLibre: (bool) ($row['licencia_libre'] ?? false),
            audioHash: isset($row['audio_hash']) ? $row['audio_hash'] : null,
            hashParcial: isset($row['hash_parcial']) ? $row['hash_parcial'] : null,
            totalComentarios: (int) ($row['total_comentarios'] ?? 0),
            verificado: (bool) ($row['verificado'] ?? false),
            mostrarEnComunidad: (bool) ($row['mostrar_en_comunidad'] ?? true),
            cancionOrigenId: isset($row['cancion_origen_id']) ? (int) $row['cancion_origen_id'] : null,
            relacionSampleoId: isset($row['relacion_sampleo_id']) ? (int) $row['relacion_sampleo_id'] : null,
            eliminadoEn: isset($row['eliminado_en']) ? $row['eliminado_en'] : null
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
            'creador_id' => $this->creadorId,
            'titulo' => $this->titulo,
            'slug' => $this->slug,
            'descripcion' => $this->descripcion,
            'bpm' => $this->bpm,
            'key' => $this->key,
            'escala' => $this->escala,
            'duracion' => $this->duracion,
            'formato' => $this->formato,
            'tamano' => $this->tamano,
            'metadata' => $this->metadata,
            'tags' => $this->tags,
            'estado' => $this->estado,
            'tipo' => $this->tipo,
            'es_premium' => $this->esPremium,
            'precio' => $this->precio,
            'ruta_original' => $this->rutaOriginal,
            'ruta_optimizada' => $this->rutaOptimizada,
            'ruta_preview' => $this->rutaPreview,
            'ruta_waveform' => $this->rutaWaveform,
            'imagen_url' => $this->imagenUrl,
            'embedding' => $this->embedding,
            'total_descargas' => $this->totalDescargas,
            'total_likes' => $this->totalLikes,
            'total_reproducciones' => $this->totalReproducciones,
            'publicado_at' => $this->publicadoAt,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
            'id_corto' => $this->idCorto,
            'permitir_descarga' => $this->permitirDescarga,
            'licencia_libre' => $this->licenciaLibre,
            'audio_hash' => $this->audioHash,
            'hash_parcial' => $this->hashParcial,
            'total_comentarios' => $this->totalComentarios,
            'verificado' => $this->verificado,
            'mostrar_en_comunidad' => $this->mostrarEnComunidad,
            'cancion_origen_id' => $this->cancionOrigenId,
            'relacion_sampleo_id' => $this->relacionSampleoId,
            'eliminado_en' => $this->eliminadoEn];
    }
}
