/*
 * frecuenciaHabitos
 * Utilidades para calcular frecuencia y estado de habitos
 * Determina si un habito "toca hoy" y calcula dias hasta proxima repeticion
 */

import type {FrecuenciaHabito, DiaSemana} from '../types/dashboard';

/* Mapeo de dia de semana (0=domingo, 6=sabado) a DiaSemana */
const DIAS_JS_A_DIASEMANA: DiaSemana[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

/*
 * Determina si un habito debe realizarse hoy basado en su frecuencia
 * y la fecha del ultimo completado
 */
export function tocaHoy(frecuencia: FrecuenciaHabito, ultimoCompletado?: string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    switch (frecuencia.tipo) {
        case 'diario':
            return true;

        case 'cadaXDias': {
            if (!ultimoCompletado) return true;

            const ultimaFecha = new Date(ultimoCompletado);
            ultimaFecha.setHours(0, 0, 0, 0);

            const diasTranscurridos = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

            return diasTranscurridos >= (frecuencia.cadaDias || 2);
        }

        case 'semanal': {
            if (!ultimoCompletado) return true;

            const ultimaFecha = new Date(ultimoCompletado);
            ultimaFecha.setHours(0, 0, 0, 0);

            const diasTranscurridos = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

            return diasTranscurridos >= 7;
        }

        case 'diasEspecificos': {
            const diaActual = DIAS_JS_A_DIASEMANA[hoy.getDay()];
            return (frecuencia.diasSemana || []).includes(diaActual);
        }

        case 'mensual': {
            if (!ultimoCompletado) return true;

            const ultimaFecha = new Date(ultimoCompletado);
            const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
            const vecesAlMes = frecuencia.vecesAlMes || 4;

            /* Intervalo aproximado entre completados */
            const intervaloIdeal = Math.floor(diasEnMes / vecesAlMes);

            ultimaFecha.setHours(0, 0, 0, 0);

            const diasTranscurridos = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

            return diasTranscurridos >= intervaloIdeal;
        }

        default:
            return true;
    }
}

/*
 * Calcula los dias restantes hasta la proxima repeticion
 * Retorna 0 si toca hoy, numero positivo si falta tiempo
 */
export function diasHastaProximaRepeticion(frecuencia: FrecuenciaHabito, ultimoCompletado?: string): number {
    if (tocaHoy(frecuencia, ultimoCompletado)) {
        return 0;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (!ultimoCompletado) return 0;

    const ultimaFecha = new Date(ultimoCompletado);
    ultimaFecha.setHours(0, 0, 0, 0);

    const diasTranscurridos = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

    switch (frecuencia.tipo) {
        case 'cadaXDias': {
            const intervalo = frecuencia.cadaDias || 2;
            return Math.max(0, intervalo - diasTranscurridos);
        }

        case 'semanal':
            return Math.max(0, 7 - diasTranscurridos);

        case 'diasEspecificos': {
            const diasSemana = frecuencia.diasSemana || [];
            const diaActualJs = hoy.getDay();

            /* Buscar el proximo dia que toca */
            for (let i = 1; i <= 7; i++) {
                const diaProximoJs = (diaActualJs + i) % 7;
                const diaSemana = DIAS_JS_A_DIASEMANA[diaProximoJs];
                if (diasSemana.includes(diaSemana)) {
                    return i;
                }
            }
            return 7;
        }

        case 'mensual': {
            const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
            const vecesAlMes = frecuencia.vecesAlMes || 4;
            const intervaloIdeal = Math.floor(diasEnMes / vecesAlMes);
            return Math.max(0, intervaloIdeal - diasTranscurridos);
        }

        default:
            return 0;
    }
}

/*
 * Calcula el umbral de dias de inactividad para resetear racha
 * basado en la frecuencia del habito
 */
export function calcularUmbralInactividad(frecuencia: FrecuenciaHabito): number {
    switch (frecuencia.tipo) {
        case 'diario':
            return 7; /* 7 dias sin hacer = pierde racha */

        case 'cadaXDias': {
            const intervalo = frecuencia.cadaDias || 2;
            /* Dar margen de 1.5x el intervalo */
            return Math.ceil(intervalo * 1.5);
        }

        case 'semanal':
            return 10; /* Mas de una semana + 3 dias de gracia */

        case 'diasEspecificos': {
            const diasSemana = frecuencia.diasSemana || [];
            /* Si solo hay 1-2 dias, dar una semana + margen */
            if (diasSemana.length <= 2) return 10;
            /* Si hay mas dias, umbral mas estricto */
            return 7;
        }

        case 'mensual': {
            const vecesAlMes = frecuencia.vecesAlMes || 4;
            const diasEnMes = 30; /* Aproximado */
            const intervaloIdeal = Math.floor(diasEnMes / vecesAlMes);
            return Math.ceil(intervaloIdeal * 1.5);
        }

        default:
            return 7;
    }
}

/*
 * Genera texto descriptivo de la frecuencia
 */
export function describirFrecuencia(frecuencia: FrecuenciaHabito): string {
    switch (frecuencia.tipo) {
        case 'diario':
            return 'Diario';

        case 'cadaXDias':
            return `Cada ${frecuencia.cadaDias || 2} dias`;

        case 'semanal':
            return 'Semanal';

        case 'diasEspecificos': {
            const dias = frecuencia.diasSemana || [];
            if (dias.length === 7) return 'Todos los dias';
            if (dias.length === 0) return 'Sin dias';

            const abreviaturas: Record<DiaSemana, string> = {
                lunes: 'L',
                martes: 'M',
                miercoles: 'X',
                jueves: 'J',
                viernes: 'V',
                sabado: 'S',
                domingo: 'D'
            };

            return dias.map(d => abreviaturas[d]).join(', ');
        }

        case 'mensual':
            return `${frecuencia.vecesAlMes || 4}x/mes`;

        default:
            return '';
    }
}

/*
 * Obtiene el intervalo numerico de la frecuencia para mostrar en UI compacta
 * Retorna null para frecuencias diarias (no necesitan indicador)
 */
export function obtenerIntervaloFrecuencia(frecuencia: FrecuenciaHabito): number | null {
    switch (frecuencia.tipo) {
        case 'diario':
            return null;

        case 'cadaXDias':
            return frecuencia.cadaDias || 2;

        case 'semanal':
            return 7;

        case 'diasEspecificos': {
            const dias = frecuencia.diasSemana || [];
            if (dias.length === 0 || dias.length === 7) return null;
            return dias.length;
        }

        case 'mensual':
            return frecuencia.vecesAlMes || 4;

        default:
            return null;
    }
}
