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
}
