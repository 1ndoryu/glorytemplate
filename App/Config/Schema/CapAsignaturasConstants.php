<?php

/**
 * Constantes centralizadas de asignaturas del curso CAP.
 *
 * FUENTE UNICA DE VERDAD para los 8 codigos canonicos, alias, nombres legibles
 * y horas requeridas. Todo archivo que necesite referenciar asignaturas DEBE
 * importar desde aqui. PROHIBIDO duplicar estas definiciones.
 *
 * Las asignaturas no son una tabla de BD sino valores que aparecen en la columna
 * cap_clases.asignatura. Se centralizan aqui porque se usan en 8+ archivos.
 */

namespace App\Config\Schema;

final class CapAsignaturasConstants
{
    /* Codigos canonicos (los 8 valores validos para cap_clases.asignatura) */
    const CONDUCCION_RACIONAL = 'conduccion_racional';
    const REGLAMENTACION = 'reglamentacion';
    const SEGURIDAD_VIAL = 'seguridad_vial';
    const SERVICIO_LOGISTICA = 'servicio_logistica';
    const SALUD_SEGURIDAD = 'salud_seguridad';
    const MEDIO_AMBIENTE = 'medio_ambiente';
    const MERCANCIAS_PELIGROSAS = 'mercancias_peligrosas';
    const VIAJEROS = 'viajeros';

    /* Lista ordenada de todos los codigos canonicos */
    const TODOS = [
        self::CONDUCCION_RACIONAL,
        self::REGLAMENTACION,
        self::SEGURIDAD_VIAL,
        self::SERVICIO_LOGISTICA,
        self::SALUD_SEGURIDAD,
        self::MEDIO_AMBIENTE,
        self::MERCANCIAS_PELIGROSAS,
        self::VIAJEROS,
    ];

    /* Codigos cortos usados en frontend */
    const CODIGOS_CORTOS = [
        self::CONDUCCION_RACIONAL => 'CR',
        self::REGLAMENTACION => 'REG',
        self::SEGURIDAD_VIAL => 'SV',
        self::SERVICIO_LOGISTICA => 'SL',
        self::SALUD_SEGURIDAD => 'SS',
        self::MEDIO_AMBIENTE => 'MA',
        self::MERCANCIAS_PELIGROSAS => 'MP',
        self::VIAJEROS => 'VIA',
    ];

    /* Nombres legibles en español para UI y reportes */
    const NOMBRES = [
        self::CONDUCCION_RACIONAL => 'Conducción racional',
        self::REGLAMENTACION => 'Reglamentación',
        self::SEGURIDAD_VIAL => 'Seguridad vial',
        self::SERVICIO_LOGISTICA => 'Servicio y logística',
        self::SALUD_SEGURIDAD => 'Salud y seguridad',
        self::MEDIO_AMBIENTE => 'Medio ambiente',
        self::MERCANCIAS_PELIGROSAS => 'Mercancías peligrosas',
        self::VIAJEROS => 'Viajeros',
    ];

    /* Horas requeridas por asignatura segun normativa CAP (total=35h) */
    const HORAS_REQUERIDAS = [
        self::CONDUCCION_RACIONAL => 7,
        self::REGLAMENTACION => 4,
        self::SEGURIDAD_VIAL => 6,
        self::SERVICIO_LOGISTICA => 4,
        self::SALUD_SEGURIDAD => 4,
        self::MEDIO_AMBIENTE => 4,
        self::MERCANCIAS_PELIGROSAS => 3,
        self::VIAJEROS => 3,
    ];

    /*
     * Mapa completo de asignaturas con toda su metadata.
     * Equivalente a CalendarEngine::ASIGNATURAS pero centralizado.
     */
    const ASIGNATURAS = [
        self::CONDUCCION_RACIONAL => ['nombre' => 'Conducción racional', 'codigo' => 'CR', 'horas' => 7],
        self::REGLAMENTACION => ['nombre' => 'Reglamentación', 'codigo' => 'REG', 'horas' => 4],
        self::SEGURIDAD_VIAL => ['nombre' => 'Seguridad vial', 'codigo' => 'SV', 'horas' => 6],
        self::SERVICIO_LOGISTICA => ['nombre' => 'Servicio y logística', 'codigo' => 'SL', 'horas' => 4],
        self::SALUD_SEGURIDAD => ['nombre' => 'Salud y seguridad', 'codigo' => 'SS', 'horas' => 4],
        self::MEDIO_AMBIENTE => ['nombre' => 'Medio ambiente', 'codigo' => 'MA', 'horas' => 4],
        self::MERCANCIAS_PELIGROSAS => ['nombre' => 'Mercancías peligrosas', 'codigo' => 'MP', 'horas' => 3],
        self::VIAJEROS => ['nombre' => 'Viajeros', 'codigo' => 'VIA', 'horas' => 3],
    ];

    /*
     * Mapa de alias a codigos canonicos para normalizacion.
     * Incluye IDs numericos, codigos cortos y variantes legacy.
     * Usado por Alumno::normalizarCodigoAsignatura() y migraciones de datos.
     */
    const ALIAS = [
        /* IDs numericos */
        '1' => self::CONDUCCION_RACIONAL,
        '2' => self::REGLAMENTACION,
        '3' => self::SEGURIDAD_VIAL,
        '4' => self::SERVICIO_LOGISTICA,
        '5' => self::SALUD_SEGURIDAD,
        '6' => self::MEDIO_AMBIENTE,
        '7' => self::MERCANCIAS_PELIGROSAS,
        '8' => self::VIAJEROS,
        /* Codigos cortos del frontend */
        'CR' => self::CONDUCCION_RACIONAL,
        'REG' => self::REGLAMENTACION,
        'SV' => self::SEGURIDAD_VIAL,
        'SL' => self::SERVICIO_LOGISTICA,
        'SS' => self::SALUD_SEGURIDAD,
        'MA' => self::MEDIO_AMBIENTE,
        'MP' => self::MERCANCIAS_PELIGROSAS,
        'VIA' => self::VIAJEROS,
        /* Variantes legacy del seeder */
        'racionalizacion' => self::CONDUCCION_RACIONAL,
        'salud_ergonomia' => self::SALUD_SEGURIDAD,
        'entorno_economico' => self::MEDIO_AMBIENTE,
        'evaluacion' => self::VIAJEROS,
    ];
}
