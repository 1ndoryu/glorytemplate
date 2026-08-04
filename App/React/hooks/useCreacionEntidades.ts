/*
 * useCreacionEntidades
 * Hook centralizado para la lógica de creación/edición de entidades (tareas, hábitos, proyectos)
 * Extraído de DashboardModales para cumplir SRP - la lógica de negocio separada de la vista
 */

import type {DashboardCompletoRetorno} from './useDashboardCompleto';
import type {NivelImportancia, NivelPrioridad, NivelUrgencia, TipoFrecuencia, DatosNuevoHabito, DatosEdicionTarea, Adjunto} from '../types/dashboard';
import type {DatosCreacionRapida} from '../types/creacionRapida';
import type {DatosTarea} from '../components/dashboard/BottomSheetTarea';
import type {DatosHabito} from '../components/dashboard/BottomSheetHabito';
import type {DatosProyecto} from '../components/dashboard/BottomSheetProyecto';
import {calcularFechaDesdeKey} from '../utils/fechaUI';

interface UseCreacionEntidadesParams {
    dashboard: DashboardCompletoRetorno['dashboard'];
    limites: DashboardCompletoRetorno['limites'];
    acciones: DashboardCompletoRetorno['acciones'];
}

interface UseCreacionEntidadesRetorno {
    manejarGuardarRapido: (datos: DatosCreacionRapida) => Promise<void>;
    manejarCrearHabitoConLimite: (datos: DatosNuevoHabito) => Promise<void>;
    manejarCrearProyectoConLimite: (datos: {nombre: string; prioridad?: NivelPrioridad; urgencia?: NivelUrgencia; fechaLimite?: string}) => void;
    manejarCrearTareaConLimite: (datos: DatosEdicionTarea) => void;
    manejarGuardarTareaBottomSheet: (datos: DatosTarea) => Promise<void>;
    manejarGuardarHabitoBottomSheet: (datos: DatosHabito) => Promise<void>;
    manejarGuardarProyectoBottomSheet: (datos: DatosProyecto) => Promise<void>;
}

/*
 * Mapea frecuencia del BottomSheet a TipoFrecuencia del sistema
 */
const mapearFrecuencia = (frecuencia?: string): TipoFrecuencia => {
    if (frecuencia === 'diaria') return 'diario';
    if (frecuencia === 'semanal') return 'semanal';
    return 'diario';
};

export function useCreacionEntidades({dashboard, limites, acciones}: UseCreacionEntidadesParams): UseCreacionEntidadesRetorno {
    /*
     * Manejador unificado para creación rápida (modal desktop y shortcuts)
     * Verifica límites antes de crear cualquier tipo de entidad
     */
    const manejarGuardarRapido = async (datos: DatosCreacionRapida): Promise<void> => {
        const {tipo, texto, ...opciones} = datos;

        if (tipo === 'tarea') {
            const tareasActivas = dashboard.tareas.filter(t => !t.completado).length;
            if (!limites.verificarYMostrar('tareasActivas', tareasActivas)) return;

            const configTarea = {
                fechaMaxima: calcularFechaDesdeKey(opciones.fecha),
                adjuntos: opciones.adjuntos || []
            };
            acciones.manejarCrearNuevaTareaGlobal(configTarea, opciones.prioridad || null, texto, undefined, opciones.urgencia || null, [], opciones.proyectoId, undefined, opciones.grupoEjecucion);
        } else if (tipo === 'habito') {
            if (!limites.verificarYMostrar('habitos', dashboard.habitos.length)) return;

            const datosHabito: DatosNuevoHabito = {
                nombre: texto,
                importancia: (opciones.importancia || 'Media') as NivelImportancia,
                tags: [],
                frecuencia: {tipo: (opciones.frecuencia || 'diario') as TipoFrecuencia}
            };
            await dashboard.crearHabito(datosHabito);
        } else if (tipo === 'proyecto') {
            if (!limites.verificarYMostrar('proyectos', dashboard.proyectos?.length ?? 0)) return;

            acciones.manejarGuardarNuevoProyecto({
                nombre: texto,
                prioridad: opciones.prioridad || 'media',
                urgencia: opciones.urgencia || undefined,
                fechaLimite: calcularFechaDesdeKey(opciones.fecha)
            });
        }
    };

    /*
     * Wrapper para crear hábito con verificación de límites
     */
    const manejarCrearHabitoConLimite = async (datos: DatosNuevoHabito): Promise<void> => {
        if (!limites.verificarYMostrar('habitos', dashboard.habitos.length)) return;
        await dashboard.crearHabito(datos);
    };

    /*
     * Wrapper para crear proyecto con verificación de límites
     */
    const manejarCrearProyectoConLimite = (datos: {nombre: string; prioridad?: NivelPrioridad; urgencia?: NivelUrgencia; fechaLimite?: string}): void => {
        if (!limites.verificarYMostrar('proyectos', dashboard.proyectos?.length ?? 0)) return;
        acciones.manejarGuardarNuevoProyecto({...datos, prioridad: datos.prioridad ?? 'Media'} as import('./useProyectos').DatosNuevoProyecto);
    };

    /*
     * Wrapper para crear tarea con verificación de límites
     */
    const manejarCrearTareaConLimite = (datos: DatosEdicionTarea): void => {
        if (!datos.texto) return;
        const tareasActivas = dashboard.tareas.filter(t => !t.completado).length;
        if (!limites.verificarYMostrar('tareasActivas', tareasActivas)) return;
        dashboard.crearTarea({texto: datos.texto, ...datos});
    };

    /*
     * Manejador para BottomSheetTarea (móvil)
     * Soporta tanto creación como edición basándose en la presencia de ID
     */
    const manejarGuardarTareaBottomSheet = async (datos: DatosTarea): Promise<void> => {
        if (datos.id) {
            /* Modo edición: actualizar tarea existente */
            await dashboard.editarTarea(datos.id, {
                texto: datos.texto,
                prioridad: datos.prioridad as NivelPrioridad | undefined,
                urgencia: datos.urgencia as NivelUrgencia | undefined,
                configuracion: datos.fecha ? {fechaMaxima: datos.fecha} : undefined,
                proyectoId: datos.proyectoId
            });
            return;
        }

        /* Modo creación */
        const tareasActivas = dashboard.tareas.filter(t => !t.completado).length;
        if (!limites.verificarYMostrar('tareasActivas', tareasActivas)) return;

        const configTarea = {
            fechaMaxima: datos.fecha,
            adjuntos: [] as Adjunto[]
        };
        acciones.manejarCrearNuevaTareaGlobal(configTarea, (datos.prioridad as NivelPrioridad) || null, datos.texto, undefined, (datos.urgencia as NivelUrgencia) || null, [], datos.proyectoId, undefined, datos.grupoEjecucion);
    };

    /*
     * Manejador para BottomSheetHabito (móvil)
     */
    const manejarGuardarHabitoBottomSheet = async (datos: DatosHabito): Promise<void> => {
        if (!limites.verificarYMostrar('habitos', dashboard.habitos.length)) return;

        const datosHabito: DatosNuevoHabito = {
            nombre: datos.texto,
            importancia: (datos.importancia || 'Media') as NivelImportancia,
            tags: [],
            frecuencia: {tipo: mapearFrecuencia(datos.frecuencia)}
        };
        await dashboard.crearHabito(datosHabito);
    };

    /*
     * Manejador para BottomSheetProyecto (móvil)
     */
    const manejarGuardarProyectoBottomSheet = async (datos: DatosProyecto): Promise<void> => {
        if (!limites.verificarYMostrar('proyectos', dashboard.proyectos?.length ?? 0)) return;

        acciones.manejarGuardarNuevoProyecto({
            nombre: datos.nombre,
            prioridad: datos.prioridad || 'media',
            urgencia: datos.urgencia || undefined,
            fechaLimite: datos.fechaLimite
        });
    };

    return {
        manejarGuardarRapido,
        manejarCrearHabitoConLimite,
        manejarCrearProyectoConLimite,
        manejarCrearTareaConLimite,
        manejarGuardarTareaBottomSheet,
        manejarGuardarHabitoBottomSheet,
        manejarGuardarProyectoBottomSheet
    };
}
