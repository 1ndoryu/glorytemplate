<?php

/**
 * CapSuscripcionesRepository — Acceso a datos para tabla 'cap_suscripciones'.
 *
 * SECCION AUTO-GENERADA: Los metodos base se regeneran con schema:generate.
 * SECCION CUSTOM: Todo debajo de la marca CUSTOM se preserva al regenerar.
 *
 * @package App
 */

namespace Glory\App\Database\Repositories;

use App\Config\Schema\_generated\CapSuscripcionesCols;
use App\Config\Schema\_generated\CapCentrosCols;

class CapSuscripcionesRepository extends BaseRepository
{
    protected static function tabla(): string
    {
        return CapSuscripcionesCols::TABLA;
    }

    protected static function colId(): string
    {
        return CapSuscripcionesCols::ID;
    }

    /*
     * Buscar registros mas recientes.
     */
    public static function buscarRecientes(int $limit = 20): array
    {
        $tabla = static::tablaCompleta();

        return static::consultar(
            "SELECT * FROM {$tabla} ORDER BY created_at DESC LIMIT :limit",
            ['limit' => $limit]
        );
    }

    /* === METODOS CUSTOM (seguro para editar debajo de esta linea) === */

    /**
     * Busca la suscripción más reciente de un centro.
     */
    public static function buscarUltimaPorCentro(int $centroId): ?array
    {
        $tabla = static::tablaCompleta();
        $colCentroId = CapSuscripcionesCols::CENTRO_ID;
        $colId = CapSuscripcionesCols::ID;

        $resultados = static::consultar(
            "SELECT * FROM {$tabla} WHERE {$colCentroId} = :centroId ORDER BY {$colId} DESC LIMIT 1",
            ['centroId' => $centroId]
        );

        return $resultados[0] ?? null;
    }

    /**
     * Obtiene el stripe_customer_id activo de un centro.
     * Retorna null si no existe suscripción con customer ID.
     */
    public static function buscarCustomerIdPorCentro(int $centroId): ?string
    {
        $tabla = static::tablaCompleta();
        $colCentroId = CapSuscripcionesCols::CENTRO_ID;
        $colCustomerId = CapSuscripcionesCols::STRIPE_CUSTOMER_ID;
        $colId = CapSuscripcionesCols::ID;

        $resultados = static::consultar(
            "SELECT {$colCustomerId} FROM {$tabla} WHERE {$colCentroId} = :centroId AND {$colCustomerId} IS NOT NULL ORDER BY {$colId} DESC LIMIT 1",
            ['centroId' => $centroId]
        );

        if (empty($resultados)) {
            return null;
        }

        $customerId = $resultados[0][$colCustomerId] ?? null;
        return !empty($customerId) ? (string) $customerId : null;
    }

    /**
     * [2003A-3] Lista todas las suscripciones con datos del centro y usuario WP.
     * Solo para admin — no filtra por centro_id.
     */
    public static function listarTodosConCentro(int $limite = 50, int $offset = 0): array
    {
        global $wpdb;

        $tablaSuscripciones = static::tablaCompleta();
        $tablaCentros = $wpdb->prefix . CapCentrosCols::TABLA;
        $colCentroId = CapSuscripcionesCols::CENTRO_ID;
        $colCentroNombre = CapCentrosCols::NOMBRE;
        $colCentroEmail = CapCentrosCols::EMAIL;
        $colCentroTelefono = CapCentrosCols::TELEFONO;
        $colUserId = CapCentrosCols::USER_ID;

        $resultados = static::consultar(
            "SELECT s.*, c.{$colCentroNombre} AS centro_nombre, c.{$colCentroEmail} AS centro_email, c.{$colCentroTelefono} AS centro_telefono, c.{$colUserId} AS user_id
             FROM {$tablaSuscripciones} s
             LEFT JOIN {$tablaCentros} c ON s.{$colCentroId} = c.id
             ORDER BY s.id DESC
             LIMIT :limite OFFSET :offset",
            ['limite' => $limite, 'offset' => $offset]
        );

        return $resultados;
    }

    /**
     * [2003A-3] Cuenta el total de suscripciones (sin paginación).
     */
    public static function contarTodos(): int
    {
        $tabla = static::tablaCompleta();
        $resultados = static::consultar("SELECT COUNT(*) AS total FROM {$tabla}");

        return (int) ($resultados[0]['total'] ?? 0);
    }
}
