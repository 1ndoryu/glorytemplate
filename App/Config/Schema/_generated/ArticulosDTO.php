<?php

/* ARCHIVO AUTO-GENERADO por Glory Schema Generator — NO EDITAR */
/* Fuente: App/Config/Schema/ArticulosSchema.php */

namespace App\Config\Schema\_generated;

final class ArticulosDTO
{
    public function __construct(
        public readonly int $id,
        public readonly int $autorId,
        public readonly string $titulo,
        public readonly string $slug,
        public readonly string $contenido,
        public readonly string $extracto,
        public readonly ?string $portadaUrl,
        public readonly string $categoria,
        public readonly array $embeds,
        public readonly bool $descargaPublica,
        public readonly int $totalLikes,
        public readonly int $totalComentarios,
        public readonly string $moderacionEstado,
        public readonly ?string $moderacionRazon,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?string $publicadoEn,
        public readonly ?string $eliminadoEn
    ) {}

    /**
     * Construir desde array de base de datos.
     * Valida presencia de columnas requeridas.
     */
    public static function desdeRow(array $row): self
    {
        return new self(
            id: (int) ($row['id'] ?? throw new \Glory\Exception\SchemaException("Columna 'id' ausente en articulos", 'articulos', 'id')),
            autorId: (int) ($row['autor_id'] ?? throw new \Glory\Exception\SchemaException("Columna 'autor_id' ausente en articulos", 'articulos', 'autor_id')),
            titulo: ($row['titulo'] ?? throw new \Glory\Exception\SchemaException("Columna 'titulo' ausente en articulos", 'articulos', 'titulo')),
            slug: ($row['slug'] ?? throw new \Glory\Exception\SchemaException("Columna 'slug' ausente en articulos", 'articulos', 'slug')),
            contenido: ($row['contenido'] ?? ''),
            extracto: ($row['extracto'] ?? ''),
            portadaUrl: isset($row['portada_url']) ? $row['portada_url'] : null,
            categoria: ($row['categoria'] ?? 'inspiracion'),
            embeds: isset($row['embeds']) ? (is_string($row['embeds']) ? json_decode($row['embeds'], true) ?? [] : $row['embeds']) : [],
            descargaPublica: (bool) ($row['descarga_publica'] ?? false),
            totalLikes: (int) ($row['total_likes'] ?? 0),
            totalComentarios: (int) ($row['total_comentarios'] ?? 0),
            moderacionEstado: ($row['moderacion_estado'] ?? 'pendiente'),
            moderacionRazon: isset($row['moderacion_razon']) ? $row['moderacion_razon'] : null,
            createdAt: ($row['created_at'] ?? date('Y-m-d H:i:s')),
            updatedAt: ($row['updated_at'] ?? date('Y-m-d H:i:s')),
            publicadoEn: isset($row['publicado_en']) ? $row['publicado_en'] : null,
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
            'autor_id' => $this->autorId,
            'titulo' => $this->titulo,
            'slug' => $this->slug,
            'contenido' => $this->contenido,
            'extracto' => $this->extracto,
            'portada_url' => $this->portadaUrl,
            'categoria' => $this->categoria,
            'embeds' => $this->embeds,
            'descarga_publica' => $this->descargaPublica,
            'total_likes' => $this->totalLikes,
            'total_comentarios' => $this->totalComentarios,
            'moderacion_estado' => $this->moderacionEstado,
            'moderacion_razon' => $this->moderacionRazon,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
            'publicado_en' => $this->publicadoEn,
            'eliminado_en' => $this->eliminadoEn];
    }
}
