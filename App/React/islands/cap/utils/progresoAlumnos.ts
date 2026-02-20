/*
 * Utilidades de cálculo de progreso para alumnos CAP.
 * Extraído de useAlumnos para cumplir SRP y límite de líneas en hooks.
 */

const HORAS_TOTALES_CAP = 35;

/* Calcula el porcentaje de progreso dado las horas completadas */
export function calcularProgreso(horasCompletadas: number): number {
    return Math.min(100, Math.round((horasCompletadas / HORAS_TOTALES_CAP) * 100));
}

/* Obtiene el estado visual del progreso según las horas completadas */
export function estadoProgreso(horasCompletadas: number): 'ok' | 'warning' | 'completed' {
    const porcentaje = calcularProgreso(horasCompletadas);
    if (porcentaje >= 100) return 'completed';
    if (porcentaje >= 75) return 'warning';
    return 'ok';
}
