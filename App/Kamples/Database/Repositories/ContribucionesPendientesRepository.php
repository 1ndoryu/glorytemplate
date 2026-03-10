<?php

/**
 * ContribucionesPendientesRepository — Acceso a datos para tabla 'contribuciones_pendientes'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package Kamples
 */

namespace App\Kamples\Database\Repositories;

use App\Config\Schema\_generated\ContribucionesPendientesCols;
use App\Config\Schema\_generated\ContribucionesPendientesEnums;
use App\Config\Schema\_generated\ContribucionesPendientesDTO;
use App\Config\Schema\_generated\UsuariosExtCols;
use App\Config\Schema\_generated\CancionesCols;
use App\Config\Schema\_generated\ArtistasMusicalesCols;

class ContribucionesPendientesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return ContribucionesPendientesCols::TABLA;
    }

    protected static function colId(): string
    {
        return ContribucionesPendientesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = ContribucionesPendientesCols::TABLA;

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY " . ContribucionesPendientesCols::CREATED_AT . " DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /*
     * Crear una nueva contribucion pendiente.
     * Retorna el ID generado.
     */
    public static function crear(array $datos): ?int
    {
        $t = ContribucionesPendientesCols::TABLA;

        return static::insertar(
            "INSERT INTO {$t} ("
            . ContribucionesPendientesCols::CONTRIBUIDOR_ID . ", "
            . ContribucionesPendientesCols::CANCION_DESTINO_ID . ", "
            . ContribucionesPendientesCols::CANCION_FUENTE_ID . ", "
            . ContribucionesPendientesCols::CANCION_NUEVA_TITULO . ", "
            . ContribucionesPendientesCols::CANCION_NUEVA_ARTISTA . ", "
            . ContribucionesPendientesCols::CANCION_NUEVA_YOUTUBE_URL . ", "
            . ContribucionesPendientesCols::CANCION_NUEVA_LADO . ", "
            . ContribucionesPendientesCols::TIPO_RELACION . ", "
            . ContribucionesPendientesCols::TIPO_ELEMENTO
            . ") VALUES ("
            . ":contribuidorId, :cancionDestinoId, :cancionFuenteId,"
            . " :cancionNuevoTitulo, :cancionNuevaArtista, :cancionNuevaYoutubeUrl, :cancionNuevaLado,"
            . " :tipoRelacion, :tipoElemento"
            . ") RETURNING " . ContribucionesPendientesCols::ID,
            [
                'contribuidorId'          => $datos['contribuidor_id'],
                'cancionDestinoId'        => $datos['cancion_destino_id'] ?? null,
                'cancionFuenteId'         => $datos['cancion_fuente_id'] ?? null,
                'cancionNuevoTitulo'      => $datos['cancion_nueva_titulo'] ?? null,
                'cancionNuevaArtista'     => $datos['cancion_nueva_artista'] ?? null,
                'cancionNuevaYoutubeUrl'  => $datos['cancion_nueva_youtube_url'] ?? null,
                'cancionNuevaLado'        => $datos['cancion_nueva_lado'] ?? null,
                'tipoRelacion'            => $datos['tipo_relacion'],
                'tipoElemento'            => $datos['tipo_elemento'],
            ]
        );
    }

    /*
     * Listar contribuciones pendientes para panel de moderacion (con JOINs).
     * Incluye username del contribuidor y titulos de canciones si existen.
     */
    public static function listarPendientes(int $limit = 20, int $offset = 0): array
    {
        $t  = ContribucionesPendientesCols::TABLA;
        $tu = UsuariosExtCols::TABLA;
        $tc = CancionesCols::TABLA;
        $ta = ArtistasMusicalesCols::TABLA;

        return static::consultar(
            "SELECT cp."
            . ContribucionesPendientesCols::ID . ", cp."
            . ContribucionesPendientesCols::TIPO_RELACION . ", cp."
            . ContribucionesPendientesCols::TIPO_ELEMENTO . ", cp."
            . ContribucionesPendientesCols::ESTADO . ", cp."
            . ContribucionesPendientesCols::CANCION_DESTINO_ID . ", cp."
            . ContribucionesPendientesCols::CANCION_FUENTE_ID . ", cp."
            . ContribucionesPendientesCols::CANCION_NUEVA_TITULO . ", cp."
            . ContribucionesPendientesCols::CANCION_NUEVA_ARTISTA . ", cp."
            . ContribucionesPendientesCols::CANCION_NUEVA_YOUTUBE_URL . ", cp."
            . ContribucionesPendientesCols::CANCION_NUEVA_LADO . ", cp."
            . ContribucionesPendientesCols::CREATED_AT
            . ", u." . UsuariosExtCols::USERNAME . " AS contribuidor_username"
            . ", cd.titulo AS cancion_destino_titulo, cd.slug AS cancion_destino_slug"
            . ", cf.titulo AS cancion_fuente_titulo, cf.slug AS cancion_fuente_slug"
            . " FROM {$t} cp"
            . " JOIN {$tu} u ON cp." . ContribucionesPendientesCols::CONTRIBUIDOR_ID . " = u." . UsuariosExtCols::ID
            . " LEFT JOIN {$tc} cd ON cp." . ContribucionesPendientesCols::CANCION_DESTINO_ID . " = cd.id"
            . " LEFT JOIN {$tc} cf ON cp." . ContribucionesPendientesCols::CANCION_FUENTE_ID . " = cf.id"
            . " WHERE cp." . ContribucionesPendientesCols::ESTADO . " = :estado"
            . " ORDER BY cp." . ContribucionesPendientesCols::CREATED_AT . " DESC"
            . " LIMIT :limit OFFSET :offset",
            [
                'estado' => ContribucionesPendientesEnums::ESTADO_PENDIENTE,
                'limit'  => $limit,
                'offset' => $offset,
            ]
        );
    }

    /*
     * Contar contribuciones pendientes (para paginacion).
     */
    public static function contarPendientes(): int
    {
        $t = ContribucionesPendientesCols::TABLA;

        $row = static::consultarUno(
            "SELECT COUNT(*) as total FROM {$t} WHERE " . ContribucionesPendientesCols::ESTADO . " = :estado",
            ['estado' => ContribucionesPendientesEnums::ESTADO_PENDIENTE]
        );

        return $row ? (int) $row['total'] : 0;
    }

    /*
     * Contribuciones de un usuario especifico (mis contribuciones).
     */
    public static function misContribuciones(int $contribuidorId, int $limit = 20, int $offset = 0): array
    {
        $t  = ContribucionesPendientesCols::TABLA;
        $tc = CancionesCols::TABLA;

        return static::consultar(
            "SELECT cp."
            . ContribucionesPendientesCols::ID . ", cp."
            . ContribucionesPendientesCols::TIPO_RELACION . ", cp."
            . ContribucionesPendientesCols::TIPO_ELEMENTO . ", cp."
            . ContribucionesPendientesCols::ESTADO . ", cp."
            . ContribucionesPendientesCols::MODERADOR_NOTA . ", cp."
            . ContribucionesPendientesCols::CANCION_NUEVA_TITULO . ", cp."
            . ContribucionesPendientesCols::CANCION_NUEVA_ARTISTA . ", cp."
            . ContribucionesPendientesCols::CREATED_AT . ", cp."
            . ContribucionesPendientesCols::RESUELTO_AT
            . ", cd.titulo AS cancion_destino_titulo, cd.slug AS cancion_destino_slug"
            . ", cf.titulo AS cancion_fuente_titulo, cf.slug AS cancion_fuente_slug"
            . " FROM {$t} cp"
            . " LEFT JOIN {$tc} cd ON cp." . ContribucionesPendientesCols::CANCION_DESTINO_ID . " = cd.id"
            . " LEFT JOIN {$tc} cf ON cp." . ContribucionesPendientesCols::CANCION_FUENTE_ID . " = cf.id"
            . " WHERE cp." . ContribucionesPendientesCols::CONTRIBUIDOR_ID . " = :contribuidorId"
            . " ORDER BY cp." . ContribucionesPendientesCols::CREATED_AT . " DESC"
            . " LIMIT :limit OFFSET :offset",
            ['contribuidorId' => $contribuidorId, 'limit' => $limit, 'offset' => $offset]
        );
    }

    /*
     * Verificar si ya existe una contribucion pendiente duplicada.
     * Previene duplicados: misma (destino, fuente, tipo) con estado pendiente.
     */
    public static function existeDuplicado(int $destinoId, int $fuenteId, string $tipoRelacion): bool
    {
        $t = ContribucionesPendientesCols::TABLA;

        $row = static::consultarUno(
            "SELECT 1 FROM {$t}"
            . " WHERE " . ContribucionesPendientesCols::CANCION_DESTINO_ID . " = :destinoId"
            . " AND " . ContribucionesPendientesCols::CANCION_FUENTE_ID . " = :fuenteId"
            . " AND " . ContribucionesPendientesCols::TIPO_RELACION . " = :tipoRelacion"
            . " AND " . ContribucionesPendientesCols::ESTADO . " = :estado"
            . " LIMIT 1",
            [
                'destinoId'    => $destinoId,
                'fuenteId'     => $fuenteId,
                'tipoRelacion' => $tipoRelacion,
                'estado'       => ContribucionesPendientesEnums::ESTADO_PENDIENTE,
            ]
        );

        return $row !== null;
    }

    /*
     * Moderar una contribucion: aprobar o rechazar.
     * Al aprobar: el caller es responsable de crear la relacion y llenar relacion_creada_id.
     */
    public static function moderar(int $id, string $accion, int $moderadorId, ?string $nota, ?int $relacionCreadaId = null): bool
    {
        $t = ContribucionesPendientesCols::TABLA;
        $estadoValido = \in_array($accion, ContribucionesPendientesEnums::TODOS_ESTADO, true)
            && $accion !== ContribucionesPendientesEnums::ESTADO_PENDIENTE;

        if (!$estadoValido) {
            return false;
        }

        $filas = static::ejecutar(
            "UPDATE {$t} SET "
            . ContribucionesPendientesCols::ESTADO . " = :estado, "
            . ContribucionesPendientesCols::MODERADOR_ID . " = :moderadorId, "
            . ContribucionesPendientesCols::MODERADOR_NOTA . " = :nota, "
            . ContribucionesPendientesCols::RELACION_CREADA_ID . " = :relacionId, "
            . ContribucionesPendientesCols::RESUELTO_AT . " = NOW()"
            . " WHERE " . ContribucionesPendientesCols::ID . " = :id"
            . " AND " . ContribucionesPendientesCols::ESTADO . " = :estadoPrevio",
            [
                'estado'      => $accion,
                'moderadorId' => $moderadorId,
                'nota'        => $nota,
                'relacionId'  => $relacionCreadaId,
                'id'          => $id,
                'estadoPrevio' => ContribucionesPendientesEnums::ESTADO_PENDIENTE,
            ]
        );

        return $filas > 0;
    }
}
