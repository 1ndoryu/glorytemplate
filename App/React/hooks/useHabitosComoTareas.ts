/*
 * useHabitosComoTareas
 * Hook que convierte hábitos que "tocan hoy" en tareas virtuales para Ejecución
 * La urgencia se calcula automáticamente basada en días de inactividad
 *
 * Fase 14.8: Ahora también incluye las tareas asociadas al hábito como subtareas
 * SubHabitos: También incluye subhábitos como subtareas virtuales
 * Las tareas heredan prioridad del hábito y mantienen su orden definido en tareasIds
 */

import {useMemo} from 'react';
import type {Habito, Tarea, TareaHabito, TareaSubHabito, SubHabito, NivelUrgencia, NivelPrioridad} from '../types/dashboard';
import {tocaHoy, estaEnVentanaOportunidad} from '../utils/frecuenciaHabitos';
import {FRECUENCIA_POR_DEFECTO} from '../types/dashboard';
import {obtenerFechaHoy} from '../utils/fecha';
import type {UmbralesUrgencia} from './useConfiguracionHabitos';

/*
 * Umbrales por defecto (moderado)
 */
const UMBRALES_DEFECTO: UmbralesUrgencia = {normal: 1, urgente: 3, bloqueante: 5};

/*
 * Mapea importancia de hábito a prioridad de tarea
 */
const mapearImportanciaAPrioridad = (importancia: Habito['importancia']): NivelPrioridad => {
    const mapa: Record<Habito['importancia'], NivelPrioridad> = {
        'Muy Alta': 'muy_alta',
        Alta: 'alta',
        Media: 'media',
        Baja: 'baja',
        'Muy Baja': 'muy_baja'
    };
    return mapa[importancia];
};

/*
 * Calcula urgencia automática basada en días de inactividad y umbrales configurables
 * Mayor inactividad = mayor urgencia
 */
const calcularUrgenciaAutomatica = (diasInactividad: number, racha: number, umbrales: UmbralesUrgencia = UMBRALES_DEFECTO): NivelUrgencia => {
    /* Si tiene racha y está dentro del umbral normal, es chill */
    if (racha > 0 && diasInactividad < umbrales.normal) {
        return 'chill';
    }

    /* Si supera el umbral bloqueante */
    if (diasInactividad >= umbrales.bloqueante) {
        return 'bloqueante';
    }
    /* Si supera el umbral urgente */
    if (diasInactividad >= umbrales.urgente) {
        return 'urgente';
    }
    /* Si supera el umbral normal */
    if (diasInactividad >= umbrales.normal) {
        return 'normal';
    }

    return 'chill';
};

/*
 * Genera un ID único negativo para tareas-hábito
 * Los IDs negativos evitan colisión con tareas reales
 */
const generarIdTareaHabito = (habitoId: number): number => {
    return -habitoId - 10000;
};

/*
 * Genera un ID único negativo para subhábitos como tareas virtuales
 * Usa un rango diferente para evitar colisión con tareas-hábito
 */
const generarIdSubHabitoTarea = (habitoId: number, subhabitoId: number): number => {
    return -(habitoId * 1000 + subhabitoId) - 100000;
};

/*
 * Verifica si un subhábito "toca hoy"
 */
const subhabitoTocaHoy = (subhabito: SubHabito, frecuenciaPadre: Habito['frecuencia']): boolean => {
    const frecuencia = subhabito.frecuencia || frecuenciaPadre || FRECUENCIA_POR_DEFECTO;
    const hoy = obtenerFechaHoy();
    const completadoHoy = subhabito.ultimoCompletado === hoy;
    const pospuestoHoy = subhabito.historialPospuestos?.includes(hoy) ?? false;
    /* [217A-2] Filtrar por pospuestoHasta (posponer con tiempo) */
    const pospuestoHasta = subhabito.pospuestoHasta ? new Date(subhabito.pospuestoHasta) > new Date() : false;
    return tocaHoy(frecuencia, subhabito.ultimoCompletado) && !completadoHoy && !pospuestoHoy && !pospuestoHasta;
};

/*
 * Verifica si un hábito fue pospuesto hoy
 */
const fuePospuestoHoy = (habito: Habito, fechaHoy: string): boolean => {
    return habito.historialPospuestos?.includes(fechaHoy) ?? false;
};

interface UseHabitosComoTareasParams {
    habitos: Habito[];
    tareas: Tarea[];
    mostrarHabitos: boolean;
    onToggleHabito: (habitoId: number) => void;
    onToggleSubHabito?: (habitoId: number, subHabitoId: number) => void;
    onEliminarSubHabito?: (habitoId: number, subHabitoId: number) => void;
    umbralesUrgencia?: UmbralesUrgencia;
}

interface UseHabitosComoTareasReturn {
    tareasHabito: TareaHabito[];
    /* Incluye tanto tareas virtuales de hábito como las subtareas reales del hábito */
    tareasConSubtareas: Tarea[];
    manejarToggleTareaHabito: (tareaId: number) => boolean;
    /* [263A-2] Intercepta eliminación de subhábitos virtuales (IDs negativos) */
    manejarEliminarTareaHabito: (tareaId: number) => boolean;
}

export function useHabitosComoTareas({habitos, tareas, mostrarHabitos, onToggleHabito, onToggleSubHabito, onEliminarSubHabito, umbralesUrgencia}: UseHabitosComoTareasParams): UseHabitosComoTareasReturn {
    const umbrales = umbralesUrgencia || UMBRALES_DEFECTO;

    /*
     * Tareas virtuales de hábitos que tocan hoy
     */
    const tareasHabito = useMemo<TareaHabito[]>(() => {
        if (!mostrarHabitos) return [];

        const hoy = obtenerFechaHoy();

        return habitos
            .filter(habito => {
                /* Los hábitos pausados nunca aparecen en el panel de ejecución */
                if (habito.pausado) return false;

                const frecuencia = habito.frecuencia || FRECUENCIA_POR_DEFECTO;
                /* Solo incluir hábitos que tocan hoy y no están completados hoy ni pospuestos */
                const tocaHoyResult = tocaHoy(frecuencia, habito.ultimoCompletado);
                const completadoHoy = habito.ultimoCompletado === hoy;
                const pospuestoHoy = fuePospuestoHoy(habito, hoy);
                /* [2303A-41] Filtrar hábitos pospuestos por tiempo (pospuestoHasta futuro) */
                const pospuestoTemporal = habito.pospuestoHasta && new Date(habito.pospuestoHasta) > new Date();
                return tocaHoyResult && !completadoHoy && !pospuestoHoy && !pospuestoTemporal;
            })
            .map(habito => {
                const urgenciaAutomatica = calcularUrgenciaAutomatica(habito.diasInactividad, habito.racha, umbrales);

                const tareaHabito: TareaHabito = {
                    id: generarIdTareaHabito(habito.id),
                    texto: habito.nombre,
                    completado: false,
                    fechaCreacion: habito.fechaCreacion,
                    prioridad: mapearImportanciaAPrioridad(habito.importancia),
                    urgencia: urgenciaAutomatica,
                    /* Campos específicos de TareaHabito */
                    esHabito: true,
                    habitoId: habito.id,
                    habitoNombre: habito.nombre,
                    habitoRacha: habito.racha,
                    habitoImportancia: habito.importancia,
                    enVentanaOportunidad: estaEnVentanaOportunidad(habito)
                };

                return tareaHabito;
            });
    }, [habitos, mostrarHabitos, umbrales]);

    /*
     * Tareas virtuales + subtareas reales del hábito + subhábitos como tareas virtuales
     * Fase 14.8: Las subtareas heredan prioridad del hábito y no tienen urgencia propia
     * SubHabitos: Los subhábitos que "tocan hoy" también aparecen como subtareas virtuales
     * Mantienen el orden definido en tareasIds del hábito
     */
    const tareasConSubtareas = useMemo<Tarea[]>(() => {
        if (!mostrarHabitos) return [];

        const resultado: Tarea[] = [];

        for (const tareaHabito of tareasHabito) {
            /* Agregar la tarea virtual del hábito */
            resultado.push(tareaHabito);

            /* Buscar hábito original para obtener tareasIds (orden) y subhábitos */
            const habito = habitos.find(h => h.id === tareaHabito.habitoId);
            if (!habito) continue;

            /* Agregar subhábitos que "tocan hoy" como tareas virtuales */
            if (habito.subhabitos && habito.subhabitos.length > 0) {
                /* [044A-27] Dedup por nombre + por ID. Evita mostrar 56 copias
                 * aunque el store tenga subhabitos con IDs únicos pero mismo nombre.
                 * Safety net del rendering: incluso si el store no deduplica, la UI sí. */
                const subIdsVistos = new Set<number>();
                const subNombresVistos = new Set<string>();
                for (const subhabito of habito.subhabitos) {
                    /* [253A-1] Filtrar subhábitos fantasma (sin nombre válido) */
                    if (!subhabito.nombre || !subhabito.nombre.trim()) continue;
                    /* Solo incluir si no está pausado y "toca hoy" */
                    if (subhabito.pausado) continue;
                    if (!subhabitoTocaHoy(subhabito, habito.frecuencia)) continue;
                    /* [044A-22] Deduplicar: solo una tarea virtual por subhábito */
                    if (subIdsVistos.has(subhabito.id)) continue;
                    subIdsVistos.add(subhabito.id);
                    /* [044A-27] Dedup por nombre: IDs únicos pero mismo nombre = duplicado */
                    const nombreNorm = subhabito.nombre.trim().toLowerCase();
                    if (subNombresVistos.has(nombreNorm)) continue;
                    subNombresVistos.add(nombreNorm);

                    /* [207A-3] Crear tarea virtual para el subhábito con tipo TareaSubHabito.
                     * Esto permite routing correcto en menú contextual y registro de actividad.
                     * [217A-5] Prioridad refleja la importancia propia del subhábito, no la del padre. */
                    const tareaSubhabito: TareaSubHabito = {
                        id: generarIdSubHabitoTarea(habito.id, subhabito.id),
                        texto: subhabito.nombre,
                        completado: false,
                        fechaCreacion: subhabito.fechaCreacion,
                        prioridad: mapearImportanciaAPrioridad(subhabito.importancia),
                        parentId: tareaHabito.id,
                        /* Sin urgencia propia (heredada del hábito visual) */
                        urgencia: undefined,
                        /* [207A-3] Campos de TareaSubHabito para routing y actividad */
                        esSubHabito: true,
                        habitoPadreId: habito.id,
                        subHabitoId: subhabito.id
                    };

                    resultado.push(tareaSubhabito);
                }
            }

            /* Filtrar tareas que pertenecen a este hábito */
            const tareasDelHabito = tareas.filter(t => t.habitoId === habito.id && !t.completado);

            /* Ordenar según tareasIds si existe */
            let tareasOrdenadas: Tarea[];
            if (habito.tareasIds && habito.tareasIds.length > 0) {
                const ordenMap = new Map(habito.tareasIds.map((id, index) => [id, index]));
                tareasOrdenadas = [...tareasDelHabito].sort((a, b) => {
                    const ordenA = ordenMap.get(a.id) ?? 999;
                    const ordenB = ordenMap.get(b.id) ?? 999;
                    return ordenA - ordenB;
                });
            } else {
                tareasOrdenadas = tareasDelHabito;
            }

            /* Agregar las subtareas con parentId apuntando al ID virtual del hábito */
            for (const tarea of tareasOrdenadas) {
                resultado.push({
                    ...tarea,
                    parentId: tareaHabito.id,
                    /* Heredar prioridad del hábito */
                    prioridad: tareaHabito.prioridad,
                    /* Sin urgencia propia (heredada del hábito visual) */
                    urgencia: undefined
                });
            }
        }

        return resultado;
    }, [tareasHabito, tareas, habitos, mostrarHabitos]);

    /*
     * Maneja el toggle de una tarea-hábito o subhábito
     * Retorna true si fue manejado (era una tarea-hábito o subhábito), false si no
     */
    const manejarToggleTareaHabito = (tareaId: number): boolean => {
        /* Las tareas-hábito tienen IDs negativos */
        if (tareaId >= 0) return false;

        /* Encontrar el hábito correspondiente (tarea principal de hábito) */
        const tareaHabito = tareasHabito.find(t => t.id === tareaId);
        if (tareaHabito) {
            /* Llamar al toggle del hábito original */
            onToggleHabito(tareaHabito.habitoId);
            return true;
        }

        /* Verificar si es un subhábito (IDs más negativos: -(habitoId * 1000 + subhabitoId) - 100000) */
        /* Buscar en todos los hábitos si algún subhábito tiene este ID */
        for (const habito of habitos) {
            if (!habito.subhabitos) continue;
            for (const subhabito of habito.subhabitos) {
                const idSubhabito = generarIdSubHabitoTarea(habito.id, subhabito.id);
                if (idSubhabito === tareaId) {
                    /* Llamar al toggle del subhábito si está disponible */
                    if (onToggleSubHabito) {
                        onToggleSubHabito(habito.id, subhabito.id);
                    }
                    return true;
                }
            }
        }

        return false;
    };

    /* [263A-2] Intercepta eliminación de tareas virtuales de subhábitos.
     * Sin esto, el delete llama a eliminarTarea del tareasStore que no encuentra
     * el ID virtual negativo → falla silenciosa → el subhábito "reaparece". */
    const manejarEliminarTareaHabito = (tareaId: number): boolean => {
        if (tareaId >= 0) return false;

        for (const habito of habitos) {
            if (!habito.subhabitos) continue;
            for (const subhabito of habito.subhabitos) {
                const idSubhabito = generarIdSubHabitoTarea(habito.id, subhabito.id);
                if (idSubhabito === tareaId) {
                    if (onEliminarSubHabito) {
                        onEliminarSubHabito(habito.id, subhabito.id);
                    }
                    return true;
                }
            }
        }

        return false;
    };

    return {
        tareasHabito,
        tareasConSubtareas,
        manejarToggleTareaHabito,
        manejarEliminarTareaHabito
    };
}
