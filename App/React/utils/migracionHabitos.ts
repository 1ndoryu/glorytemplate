/*
 * Migracion de Habitos
 * Logica para migrar y actualizar habitos al cargar datos
 * Responsabilidad unica: asegurar compatibilidad de datos antiguos
 */

import type {Habito, ConfiguracionDashboard} from '../types/dashboard';
import {calcularDiasDesde, crearFechaHaceNDias, debeResetearRacha} from './fecha';

/*
 * Migra habitos antiguos al nuevo formato y aplica logica de rachas
 * - Añade campos faltantes si no existen
 * - Calcula dias de inactividad basado en ultimo completado
 * - Resetea rachas si han pasado demasiados dias de inactividad
 */
export function migrarYActualizarHabitos(habitos: Habito[], configuracion: ConfiguracionDashboard): Habito[] {
    return habitos.map(h => {
        /* Si no tiene fechaCreacion, calcularla basada en diasInactividad o usar hoy */
        const fechaCreacion = h.fechaCreacion || crearFechaHaceNDias(h.diasInactividad || 0);

        /* Calcular dias de inactividad basado en ultimo completado o fecha de creacion */
        const diasInactividad = h.ultimoCompletado ? calcularDiasDesde(h.ultimoCompletado) : calcularDiasDesde(fechaCreacion);

        /* Determinar si la racha debe resetearse */
        const rachaReseteada = debeResetearRacha(diasInactividad, configuracion.umbralReseteoRacha);
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
