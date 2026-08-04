/*
 * Tipos para Creación Rápida
 * Interfaces tipadas para los datos provenientes de modales/BottomSheets de creación
 * Extraído de DashboardModales para cumplir DIP/ISP
 */

import type {Adjunto, NivelImportancia, NivelPrioridad, NivelUrgencia, TipoFrecuencia} from './dashboard';

/*
 * Datos genéricos de creación rápida desde ModalCreacionRapida
 * Contiene todos los campos posibles para tareas, hábitos y proyectos
 */
export interface DatosCreacionRapida {
    tipo: 'tarea' | 'habito' | 'proyecto';
    texto: string;
    /* Campos para tareas */
    proyectoId?: number;
    prioridad?: NivelPrioridad;
    urgencia?: NivelUrgencia;
    fecha?: string; /* Clave de fecha rápida: 'hoy' | 'manana' | 'semana' */
    adjuntos?: Adjunto[];
    grupoEjecucion?: string | null;
    /* Campos para hábitos */
    frecuencia?: TipoFrecuencia;
    importancia?: NivelImportancia;
}

/*
 * Tipo auxiliar para valores iniciales de creación rápida
 * Usado por NavegacionInferior y otros triggers de creación
 */
export interface ValoresCreacionRapida {
    proyectoId?: number;
    prioridad?: string;
    urgencia?: string;
    grupoEjecucion?: string | null;
}
