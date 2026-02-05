/**
 * Utilidades para cálculo de rangos de horarios
 *
 * Calcula la hora mínima y máxima de apertura de la autoescuela
 * basándose en la configuración de horarios semanales.
 */

import type {ConfiguracionHorarios} from '../hooks/useConfiguracion';

export interface RangoHoras {
    horaMinima: string;
    horaMaxima: string;
    horasDisponibles: string[];
}

/**
 * Parsea horarios_semanales que puede venir como string JSON o como objeto
 */
function parsearHorariosSemanales(horarios: Record<string, Array<{inicio: string; fin: string}>> | string | undefined): Record<string, Array<{inicio: string; fin: string}>> | null {
    if (!horarios) return null;

    if (typeof horarios === 'string') {
        try {
            return JSON.parse(horarios);
        } catch {
            return null;
        }
    }

    return horarios;
}

/**
 * Convierte hora HH:MM a minutos desde medianoche
 */
function horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + (m || 0);
}

/**
 * Convierte minutos desde medianoche a formato HH:MM
 */
function minutosAHora(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Genera un array de horas disponibles entre un rango (slots de 1 hora)
 */
function generarHorasEnRango(horaMinima: string, horaMaxima: string): string[] {
    const horas: string[] = [];
    const minInicio = horaAMinutos(horaMinima);
    const minFin = horaAMinutos(horaMaxima);

    /* Generar slots de hora en hora */
    for (let min = minInicio; min < minFin; min += 60) {
        horas.push(minutosAHora(min));
    }

    return horas;
}

/**
 * Calcula el rango de horas desde la configuración de la autoescuela.
 * Usa horarios_semanales si está disponible, sino cae a los campos legacy.
 *
 * La lógica es:
 * - Hora mínima: la hora de apertura más temprana de todos los días
 * - Hora máxima: la hora de cierre más tarde de todos los días
 */
export function calcularRangoHoras(config: ConfiguracionHorarios | null): RangoHoras {
    /* Valores por defecto si no hay configuración */
    const DEFAULT_MIN = '08:00';
    const DEFAULT_MAX = '22:00';

    if (!config) {
        return {
            horaMinima: DEFAULT_MIN,
            horaMaxima: DEFAULT_MAX,
            horasDisponibles: generarHorasEnRango(DEFAULT_MIN, DEFAULT_MAX)
        };
    }

    const horariosSemanales = parsearHorariosSemanales(config.horarios_semanales);

    if (horariosSemanales && Object.keys(horariosSemanales).length > 0) {
        /* Usar horarios flexibles (nuevo sistema) */
        let minGlobal = 24 * 60; /* Iniciar con el máximo posible */
        let maxGlobal = 0;

        for (const dia of Object.keys(horariosSemanales)) {
            const periodos = horariosSemanales[dia];
            if (!periodos || periodos.length === 0) continue;

            for (const periodo of periodos) {
                const inicioMin = horaAMinutos(periodo.inicio);
                const finMin = horaAMinutos(periodo.fin);

                if (inicioMin < minGlobal) minGlobal = inicioMin;
                if (finMin > maxGlobal) maxGlobal = finMin;
            }
        }

        /* Validar que se encontraron valores válidos */
        if (minGlobal < 24 * 60 && maxGlobal > 0) {
            const horaMinima = minutosAHora(minGlobal);
            const horaMaxima = minutosAHora(maxGlobal);

            return {
                horaMinima,
                horaMaxima,
                horasDisponibles: generarHorasEnRango(horaMinima, horaMaxima)
            };
        }
    }

    /* Fallback: usar campos legacy (mañana/tarde) */
    const candidatos: number[] = [];

    if (config.hora_inicio_manana) {
        candidatos.push(horaAMinutos(config.hora_inicio_manana));
    }
    if (config.hora_fin_manana) {
        candidatos.push(horaAMinutos(config.hora_fin_manana));
    }
    if (config.hora_inicio_tarde) {
        candidatos.push(horaAMinutos(config.hora_inicio_tarde));
    }
    if (config.hora_fin_tarde) {
        candidatos.push(horaAMinutos(config.hora_fin_tarde));
    }
    if (config.viernes_especial && config.hora_fin_viernes) {
        candidatos.push(horaAMinutos(config.hora_fin_viernes));
    }

    if (candidatos.length > 0) {
        const minGlobal = Math.min(...candidatos);
        const maxGlobal = Math.max(...candidatos);
        const horaMinima = minutosAHora(minGlobal);
        const horaMaxima = minutosAHora(maxGlobal);

        return {
            horaMinima,
            horaMaxima,
            horasDisponibles: generarHorasEnRango(horaMinima, horaMaxima)
        };
    }

    /* Último fallback: valores por defecto */
    return {
        horaMinima: DEFAULT_MIN,
        horaMaxima: DEFAULT_MAX,
        horasDisponibles: generarHorasEnRango(DEFAULT_MIN, DEFAULT_MAX)
    };
}

export default calcularRangoHoras;
