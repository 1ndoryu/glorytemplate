<?php

/**
 * ArticulosRepository — Acceso a datos para tabla 'articulos'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ArticulosCols;
use App\Config\Schema\_generated\ArticulosEnums;
use App\Config\Schema\_generated\ArticulosDTO;

class ArticulosRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ArticulosCols::TABLA;
    }

    protected static function colId(): string
    {
        return ArticulosCols::ID;
    }

    /*
     * Buscar registros del usuario dado.
     */
    public static function buscarPorUsuario(int $usuarioId, int $limit = 20, int $offset = 0): array
    {
        $tabla = ArticulosCols::TABLA;
        $col = ArticulosCols::AUTOR_ID;

        return static::consultar(
            "SELECT * FROM {$tabla} WHERE {$col} = :usuarioId ORDER BY " . static::colId() . " DESC LIMIT :limit OFFSET :offset",
            ['usuarioId' => $usuarioId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ArticulosCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ArticulosCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /* [183A-109] Listado público de artículos aprobados con datos del autor.
     * Opcionalmente filtra por categoría. Incluye like status si hay usuario autenticado. */
    public static function listarPublicados(
        int $limit = 20,
        int $offset = 0,
        ?string $categoria = null,
        ?int $usuarioActualId = null
    ): array {
        $t = ArticulosCols::TABLA;
        $where = "{$t}." . ArticulosCols::MODERACION_ESTADO . " = :estado 
                  AND {$t}." . ArticulosCols::ELIMINADO_EN . " IS NULL";

        $params = ['estado' => ArticulosEnums::MODERACION_ESTADO_APROBADO, 'limit' => $limit, 'offset' => $offset];

        if ($categoria !== null) {
            $where .= " AND {$t}." . ArticulosCols::CATEGORIA . " = :categoria";
            $params['categoria'] = $categoria;
        }

        $likeSelect = '';
        $likeJoin = '';
        if ($usuarioActualId !== null) {
            $likeSelect = ", (al.usuario_id IS NOT NULL) AS liked_por_mi";
            $likeJoin = "LEFT JOIN articulos_likes al ON al.articulo_id = {$t}.id AND al.usuario_id = :uid";
            $params['uid'] = $usuarioActualId;
        }

        $sql = "SELECT {$t}.*, 
                       ue.username AS autor_username, ue.avatar_url AS autor_avatar,
                       ue.nombre_display AS autor_nombre, ue.verificado AS autor_verificado
                       {$likeSelect}
                FROM {$t}
                JOIN usuarios_ext ue ON ue.id = {$t}." . ArticulosCols::AUTOR_ID . "
                {$likeJoin}
                WHERE {$where}
                ORDER BY {$t}." . ArticulosCols::PUBLICADO_EN . " DESC
                LIMIT :limit OFFSET :offset";

        return static::consultar($sql, $params);
    }

    /* Conteo total de artículos publicados, opcionalmente por categoría */
    public static function contarPublicados(?string $categoria = null): int
    {
        $t = ArticulosCols::TABLA;
        $where = ArticulosCols::MODERACION_ESTADO . " = :estado AND " . ArticulosCols::ELIMINADO_EN . " IS NULL";
        $params = ['estado' => ArticulosEnums::MODERACION_ESTADO_APROBADO];

        if ($categoria !== null) {
            $where .= " AND " . ArticulosCols::CATEGORIA . " = :categoria";
            $params['categoria'] = $categoria;
        }

        return (int) static::consultarValor("SELECT COUNT(*) FROM {$t} WHERE {$where}", $params);
    }

    /* Buscar artículo por slug con datos del autor */
    public static function buscarPorSlug(string $slug, ?int $usuarioActualId = null): ?array
    {
        $t = ArticulosCols::TABLA;

        $likeSelect = '';
        $likeJoin = '';
        $params = ['slug' => $slug];

        if ($usuarioActualId !== null) {
            $likeSelect = ", (al.usuario_id IS NOT NULL) AS liked_por_mi";
            $likeJoin = "LEFT JOIN articulos_likes al ON al.articulo_id = {$t}.id AND al.usuario_id = :uid";
            $params['uid'] = $usuarioActualId;
        }

        return static::consultarUno(
            "SELECT {$t}.*, 
                    ue.username AS autor_username, ue.avatar_url AS autor_avatar,
                    ue.nombre_display AS autor_nombre, ue.verificado AS autor_verificado
                    {$likeSelect}
             FROM {$t}
             JOIN usuarios_ext ue ON ue.id = {$t}." . ArticulosCols::AUTOR_ID . "
             {$likeJoin}
             WHERE {$t}." . ArticulosCols::SLUG . " = :slug 
               AND {$t}." . ArticulosCols::ELIMINADO_EN . " IS NULL",
            $params
        );
    }

    /* Crear artículo y retornar ID. Genera slug automáticamente. */
    public static function crearArticulo(
        int $autorId,
        string $titulo,
        string $contenido,
        string $extracto,
        string $categoria,
        ?string $portadaUrl = null,
        string $embeds = '[]',
        bool $descargaPublica = false,
        string $moderacionEstado = ArticulosEnums::MODERACION_ESTADO_PENDIENTE
    ): ?int {
        $slug = self::generarSlugUnico($titulo);
        $t = ArticulosCols::TABLA;

        return static::insertar(
            "INSERT INTO {$t} (
                " . ArticulosCols::AUTOR_ID . ", " . ArticulosCols::TITULO . ", " . ArticulosCols::SLUG . ",
                " . ArticulosCols::CONTENIDO . ", " . ArticulosCols::EXTRACTO . ", " . ArticulosCols::CATEGORIA . ",
                " . ArticulosCols::PORTADA_URL . ", " . ArticulosCols::EMBEDS . ", " . ArticulosCols::DESCARGA_PUBLICA . ",
                " . ArticulosCols::MODERACION_ESTADO . ", " . ArticulosCols::PUBLICADO_EN . "
            ) VALUES (
                :autor_id, :titulo, :slug, :contenido, :extracto, :categoria,
                :portada_url, :embeds::jsonb, :descarga_publica,
                :moderacion_estado, :publicado_en
            ) RETURNING id",
            [
                'autor_id'          => $autorId,
                'titulo'            => $titulo,
                'slug'              => $slug,
                'contenido'         => $contenido,
                'extracto'          => $extracto,
                'categoria'         => $categoria,
                'portada_url'       => $portadaUrl,
                'embeds'            => $embeds,
                'descarga_publica'  => $descargaPublica ? 'true' : 'false',
                'moderacion_estado' => $moderacionEstado,
                'publicado_en'      => $moderacionEstado === ArticulosEnums::MODERACION_ESTADO_APROBADO ? date('c') : null,
            ]
        );
    }

    /* Actualizar artículo existente (solo el autor o admin) */
    public static function actualizarArticulo(int $id, array $campos): bool
    {
        $permitidos = [
            ArticulosCols::TITULO, ArticulosCols::CONTENIDO, ArticulosCols::EXTRACTO,
            ArticulosCols::CATEGORIA, ArticulosCols::PORTADA_URL, ArticulosCols::EMBEDS,
            ArticulosCols::DESCARGA_PUBLICA,
        ];
        $sets = [];
        $params = ['id' => $id];
        foreach ($campos as $col => $valor) {
            if (!in_array($col, $permitidos, true)) continue;
            $key = str_replace('.', '_', $col);
            if ($col === ArticulosCols::EMBEDS) {
                $sets[] = "{$col} = :{$key}::jsonb";
            } else {
                $sets[] = "{$col} = :{$key}";
            }
            $params[$key] = $valor;
        }
        if (empty($sets)) return false;

        $sets[] = ArticulosCols::UPDATED_AT . " = NOW()";

        /* Si se cambió el título, regenerar slug */
        if (isset($campos[ArticulosCols::TITULO])) {
            $nuevoSlug = self::generarSlugUnico($campos[ArticulosCols::TITULO], $id);
            $sets[] = ArticulosCols::SLUG . " = :nuevo_slug";
            $params['nuevo_slug'] = $nuevoSlug;
        }

        $setStr = implode(', ', $sets);
        $t = ArticulosCols::TABLA;
        return static::ejecutar("UPDATE {$t} SET {$setStr} WHERE id = :id", $params) > 0;
    }

    /* Soft-delete */
    public static function eliminar(int $id): bool
    {
        $t = ArticulosCols::TABLA;
        return static::ejecutar(
            "UPDATE {$t} SET " . ArticulosCols::ELIMINADO_EN . " = NOW() WHERE id = :id AND " . ArticulosCols::ELIMINADO_EN . " IS NULL",
            ['id' => $id]
        ) > 0;
    }

    /* Listar artículos pendientes de moderación */
    public static function listarPendientesModeracion(int $limit = 20, int $offset = 0): array
    {
        $t = ArticulosCols::TABLA;
        return static::consultar(
            "SELECT {$t}.*, ue.username AS autor_username, ue.avatar_url AS autor_avatar, ue.nombre_display AS autor_nombre
             FROM {$t}
             JOIN usuarios_ext ue ON ue.id = {$t}." . ArticulosCols::AUTOR_ID . "
             WHERE {$t}." . ArticulosCols::MODERACION_ESTADO . " = :estado 
               AND {$t}." . ArticulosCols::ELIMINADO_EN . " IS NULL
             ORDER BY {$t}." . ArticulosCols::CREATED_AT . " ASC
             LIMIT :limit OFFSET :offset",
            ['estado' => ArticulosEnums::MODERACION_ESTADO_PENDIENTE, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /* Aprobar artículo: actualizar estado + establecer publicado_en */
    public static function aprobar(int $id): bool
    {
        $t = ArticulosCols::TABLA;
        return static::ejecutar(
            "UPDATE {$t} SET " . ArticulosCols::MODERACION_ESTADO . " = :estado, 
                             " . ArticulosCols::PUBLICADO_EN . " = NOW(),
                             " . ArticulosCols::UPDATED_AT . " = NOW()
             WHERE id = :id",
            ['estado' => ArticulosEnums::MODERACION_ESTADO_APROBADO, 'id' => $id]
        ) > 0;
    }

    /* Rechazar artículo con razón */
    public static function rechazar(int $id, string $razon): bool
    {
        $t = ArticulosCols::TABLA;
        return static::ejecutar(
            "UPDATE {$t} SET " . ArticulosCols::MODERACION_ESTADO . " = :estado, 
                             " . ArticulosCols::MODERACION_RAZON . " = :mod_razon,
                             " . ArticulosCols::UPDATED_AT . " = NOW()
             WHERE id = :id",
            ['estado' => ArticulosEnums::MODERACION_ESTADO_RECHAZADO, 'id' => $id, 'mod_razon' => $razon]
        ) > 0;
    }

    /* Generar slug único a partir de título */
    private static function generarSlugUnico(string $titulo, ?int $excluirId = null): string
    {
        $slug = mb_strtolower(trim($titulo));
        $slug = preg_replace('/[^\p{L}\p{N}\s-]/u', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        $slug = trim($slug, '-');
        if (empty($slug)) $slug = 'articulo';
        $slug = mb_substr($slug, 0, 280);

        $baseSlug = $slug;
        $counter = 0;
        $t = ArticulosCols::TABLA;

        do {
            $candidato = $counter === 0 ? $baseSlug : "{$baseSlug}-{$counter}";
            $params = ['slug' => $candidato];
            $extra = '';
            if ($excluirId !== null) {
                $extra = ' AND id != :excluir';
                $params['excluir'] = $excluirId;
            }
            $existe = static::consultarValor(
                "SELECT COUNT(*) FROM {$t} WHERE " . ArticulosCols::SLUG . " = :slug{$extra}",
                $params
            );
            if ((int)$existe === 0) return $candidato;
            $counter++;
        } while ($counter < 100);

        return $baseSlug . '-' . bin2hex(random_bytes(4));
    }

    /* Artículos del autor (para su perfil/dashboard) incluye borradores */
    public static function listarPorAutor(int $autorId, int $limit = 20, int $offset = 0): array
    {
        $t = ArticulosCols::TABLA;
        return static::consultar(
            "SELECT * FROM {$t}
             WHERE " . ArticulosCols::AUTOR_ID . " = :autorId 
               AND " . ArticulosCols::ELIMINADO_EN . " IS NULL
             ORDER BY " . ArticulosCols::CREATED_AT . " DESC
             LIMIT :limit OFFSET :offset",
            ['autorId' => $autorId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /* Categorías agrupadas con conteo para navegación */
    public static function contarPorCategorias(): array
    {
        $t = ArticulosCols::TABLA;
        return static::consultar(
            "SELECT " . ArticulosCols::CATEGORIA . " AS categoria, COUNT(*) AS total
             FROM {$t}
             WHERE " . ArticulosCols::MODERACION_ESTADO . " = :estado 
               AND " . ArticulosCols::ELIMINADO_EN . " IS NULL
             GROUP BY " . ArticulosCols::CATEGORIA . "
             ORDER BY total DESC",
            ['estado' => ArticulosEnums::MODERACION_ESTADO_APROBADO]
        );
    }

    /* [183A-109 Fase 4] Listar artículos aprobados para sitemap (slug + fecha) */
    public static function listarParaSitemap(int $limit, int $offset): array
    {
        $t = ArticulosCols::TABLA;
        return static::consultar(
            "SELECT " . ArticulosCols::SLUG . ", " . ArticulosCols::PUBLICADO_EN . "
             FROM {$t}
             WHERE " . ArticulosCols::MODERACION_ESTADO . " = :estado
               AND " . ArticulosCols::ELIMINADO_EN . " IS NULL
             ORDER BY " . ArticulosCols::PUBLICADO_EN . " DESC
             LIMIT :limit OFFSET :offset",
            ['estado' => ArticulosEnums::MODERACION_ESTADO_APROBADO, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /* [183A-109 Fase 4] Contar artículos aprobados para sitemap paginación */
    public static function contarParaSitemap(): int
    {
        $t = ArticulosCols::TABLA;
        return (int) static::consultarValor(
            "SELECT COUNT(*) FROM {$t}
             WHERE " . ArticulosCols::MODERACION_ESTADO . " = :estado
               AND " . ArticulosCols::ELIMINADO_EN . " IS NULL",
            ['estado' => ArticulosEnums::MODERACION_ESTADO_APROBADO]
        );
    }

    /* [183A-109 Fase 4] Buscar autor ID para notificaciones de moderación */
    public static function buscarAutorId(int $id): ?int
    {
        $t = ArticulosCols::TABLA;
        $val = static::consultarValor(
            "SELECT " . ArticulosCols::AUTOR_ID . " FROM {$t} WHERE " . ArticulosCols::ID . " = :id",
            ['id' => $id]
        );
        return $val !== null ? (int) $val : null;
    }
}
