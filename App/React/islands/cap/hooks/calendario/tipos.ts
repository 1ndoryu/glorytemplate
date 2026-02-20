/**
 * Tipos compartidos para los sub-hooks del calendario.
 * Separados para evitar dependencias circulares entre hooks.
 */

import type {Clase, ConflictoAforo, AvisoGeneracion} from '../../types';

/* Interfaz para cambios de una clase (edición inline) */
export interface CambiosClase {
    horaInicio?: string;
    horaFin?: string;
    asignaturaId?: number;
}

/* Estado base compartido entre todos los sub-hooks del calendario */
export interface EstadoBase {
    clases: Clase[];
    setClases: React.Dispatch<React.SetStateAction<Clase[]>>;
    semanaActual: Date;
    setSemanaActual: React.Dispatch<React.SetStateAction<Date>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    getNonce: () => string;
    formatearFechaApi: (fecha: Date) => string;
    normalizarHora: (hora?: string | null) => string;
    guardarSnapshot: () => void;
    historialClases: Clase[][];
    setHistorialClases: React.Dispatch<React.SetStateAction<Clase[][]>>;
}

/* Estado completo del calendario (retornado por useCalendario) */
export interface EstadoCalendario {
    clases: Clase[];
    semanaActual: Date;
    fechasSemana: Date[];
    cargando: boolean;
    error: string | null;
    generando: boolean;
    conflictos: ConflictoAforo[];
    mostrarModalConflictos: boolean;
    avisosGeneracion: AvisoGeneracion[];
    mostrarModalAvisos: boolean;
    claseSeleccionada: Clase | null;
    mostrarModalEdicion: boolean;
    guardandoEdicion: boolean;
    puedeDeshacer: boolean;
    moviendo: boolean;
    eliminando: boolean;
}

/* Todas las acciones que expone useCalendario */
export interface AccionesCalendario {
    irSemanaAnterior: () => void;
    irSemanaSiguiente: () => void;
    irASemana: (fecha: Date) => void;
    irASemanaActual: () => void;
    toggleBloqueoClase: (claseId: number) => Promise<void>;
    recargarClases: () => Promise<void>;
    generarCalendario: (fechaDesde?: string) => Promise<void>;
    generarConExclusiones: (exclusiones: import('../../types').ExclusionesConflicto) => Promise<void>;
    cerrarModalConflictos: () => void;
    cerrarModalAvisos: () => void;
    limpiarError: () => void;
    seleccionarClase: (clase: Clase) => void;
    cerrarModalEdicion: () => void;
    actualizarClase: (claseId: number, cambios: CambiosClase) => Promise<void>;
    deshacer: () => void;
    moverClase: (claseId: number, nuevaFecha: string, horaInicio?: string, horaFin?: string) => Promise<void>;
    moverMultiplesClases: (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => Promise<void>;
    eliminarClase: (claseId: number, forzar: boolean) => Promise<void>;
    borrarSemanaCompleta: (incluirBloqueadas?: boolean) => Promise<void>;
}
