/*
 * Migracion de Habitos
 * Logica para migrar y actualizar habitos al cargar datos
 * Responsabilidad unica: asegurar compatibilidad de datos antiguos
 */

import type {Habito, ConfiguracionDashboard} from '../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../types/dashboard';
import {calcularDiasDesde, crearFechaHaceNDias} from './fecha';
import {calcularUmbralInactividad} from './frecuenciaHabitos';

/*
 * Migra habitos antiguos al nuevo formato y aplica logica de rachas
 * - Añade campos faltantes si no existen
 * - Calcula dias de inactividad basado en ultimo completado
 * - Resetea rachas basandose en el umbral de la frecuencia del habito
 */
export function migrarYActualizarHabitos(habitos: Habito[], _configuracion: ConfiguracionDashboard): Habito[] {
    return habitos.map(h => {
        /* Si no tiene fechaCreacion, calcularla basada en diasInactividad o usar hoy */
        const fechaCreacion = h.fechaCreacion || crearFechaHaceNDias(h.diasInactividad || 0);

        /* Calcular dias de inactividad basado en ultimo completado o fecha de creacion */
        const diasInactividad = h.ultimoCompletado ? calcularDiasDesde(h.ultimoCompletado) : calcularDiasDesde(fechaCreacion);

        /* Obtener frecuencia del habito (usar valor por defecto si no existe) */
        const frecuencia = h.frecuencia || FRECUENCIA_POR_DEFECTO;

        /* Calcular umbral de inactividad basado en la frecuencia del habito */
        const umbralInactividad = calcularUmbralInactividad(frecuencia);

        /* Determinar si la racha debe resetearse segun la frecuencia */
        const rachaReseteada = diasInactividad > umbralInactividad;
        const nuevaRacha = rachaReseteada ? 0 : h.racha;

        return {
            ...h,
            historialCompletados: h.historialCompletados || [],
            ultimoCompletado: h.ultimoCompletado || undefined,
            fechaCreacion,
            diasInactividad,
            racha: nuevaRacha
        };
    });
}
