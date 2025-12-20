/*
 * Utilidades de Fecha
 * Funciones para manejar fechas sin dependencias externas
 * Responsabilidad unica: operaciones de fecha para el dashboard
 */

/*
 * Obtiene la fecha de hoy en formato ISO (YYYY-MM-DD)
 * Usado para comparaciones y registros de completados
 */
export function obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
}

/*
 * Calcula los dias transcurridos desde una fecha ISO
 * Retorna 999 si no hay fecha (para ordenamiento)
 */
export function calcularDiasDesde(fechaIso: string | undefined): number {
    if (!fechaIso) return 999;
    const fecha = new Date(fechaIso);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    const diferencia = hoy.getTime() - fecha.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
}

/*
 * Verifica si una fecha corresponde al dia de hoy
 * Usado para determinar si un habito fue completado hoy
 */
export function fueCompletadoHoy(ultimoCompletado: string | undefined): boolean {
    if (!ultimoCompletado) return false;
    return ultimoCompletado === obtenerFechaHoy();
}

/*
 * Crea una fecha ISO de hace N dias
 * Util para datos de demostracion y pruebas
 */
export function crearFechaHaceNDias(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString().split('T')[0];
}

/*
 * Calcula si la racha debe resetearse
 * Retorna true si los dias de inactividad superan el umbral
 */
export function debeResetearRacha(diasInactividad: number, umbral: number): boolean {
    return diasInactividad > umbral;
}

/*
 * Calcula los dias restantes antes de perder la racha
 * Retorna un numero negativo si ya se perdio
 */
export function calcularDiasAntesDePerderRacha(diasInactividad: number, umbral: number): number {
    return umbral - diasInactividad;
}

/*
 * Suma dias a una fecha ISO
 * Retorna la nueva fecha en formato ISO (YYYY-MM-DD)
 */
export function sumarDias(fechaIso: string, dias: number): string {
    const fecha = new Date(fechaIso);
    /* Usar metodos UTC para evitar problemas de zona horaria al sumar dias */
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return fecha.toISOString().split('T')[0];
}
