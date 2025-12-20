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

/*
 * Informacion de urgencia para fechas limite
 */
export interface InfoUrgenciaFecha {
    diasRestantes: number;
    esUrgente: boolean;
    vencida: boolean;
    esHoy: boolean;
    esMañana: boolean;
}

/*
 * Calcula la urgencia de una fecha limite
 * Retorna null si no hay fecha
 */
export function calcularUrgenciaFechaLimite(fechaLimite: string | undefined): InfoUrgenciaFecha | null {
    if (!fechaLimite) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(fechaLimite);
    fecha.setHours(0, 0, 0, 0);

    const diferencia = fecha.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

    return {
        diasRestantes,
        esUrgente: diasRestantes <= 3 && diasRestantes >= 0,
        vencida: diasRestantes < 0,
        esHoy: diasRestantes === 0,
        esMañana: diasRestantes === 1
    };
}

/*
 * Formatea una fecha en formato corto (ej: "20 dic")
 */
export function formatearFechaCorta(fechaIso: string): string {
    const fecha = new Date(fechaIso);
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', {month: 'short'});
    return `${dia} ${mes}`;
}

/*
 * Obtiene el texto descriptivo para una fecha limite
 * Incluye indicadores como "Hoy", "Mañana", "Vencida"
 */
export function obtenerTextoFechaLimite(fechaIso: string | undefined): string {
    const info = calcularUrgenciaFechaLimite(fechaIso);
    if (!info || !fechaIso) return '';

    if (info.vencida) {
        const diasVencida = Math.abs(info.diasRestantes);
        return `Vencida (${diasVencida}d)`;
    }
    if (info.esHoy) return 'Hoy';
    if (info.esMañana) return 'Mañana';

    return formatearFechaCorta(fechaIso);
}

/*
 * Determina la variante visual para un badge de fecha
 * Retorna: 'urgente' si vencida, 'advertencia' si es hoy o urgente, 'normal' en otro caso
 */
export type VarianteFechaLimite = 'urgente' | 'advertencia' | 'exito' | 'normal';

export function obtenerVarianteFechaLimite(fechaIso: string | undefined): VarianteFechaLimite {
    const info = calcularUrgenciaFechaLimite(fechaIso);
    if (!info) return 'normal';

    if (info.vencida) return 'urgente';
    if (info.esHoy) return 'advertencia';
    if (info.esUrgente) return 'advertencia';

    return 'normal';
}
