import type {Tarea, DatosEdicionTarea, DatosNuevoHabito, Habito} from '../../../types/dashboard';

export interface TareaItemProps {
    tarea: Tarea;
    onToggle?: () => void;
    onEditar?: (datos: DatosEdicionTarea) => void;
    onEliminar?: () => void;
    esSubtarea?: boolean;
    onIndent?: () => void;
    onOutdent?: () => void;
    /* Crear nueva tarea debajo (hereda parentId si es subtarea, tareaActualId para posicion) */
    onCrearNueva?: (parentId: number | undefined, tareaActualId: number) => void;
    /* Abrir panel de configuracion */
    onConfigurar?: () => void;
    /* Nombre del proyecto al que pertenece (opcional) */
    nombreProyecto?: string;
    /* Mostrar solo el icono del proyecto sin texto */
    soloIconoProyecto?: boolean;
    /* Mover tarea a otro proyecto */
    onMoverProyecto?: () => void;
    /* Compartir tarea con companeros */
    onCompartir?: () => void;
    /* Indica si la tarea esta siendo compartida */
    estaCompartida?: boolean;
    /* Contador de mensajes no leídos (para badge) */
    mensajesNoLeidos?: number;
    /* Callbacks específicos para tareas-hábito (Fase 7.6.1) - Sincronizado con TablaHabitos */
    onEditarHabito?: (habitoId: number) => void;
    onEliminarHabito?: (habitoId: number) => void;
    onToggleHabito?: (habitoId: number) => void;
    onPosponerHabito?: (habitoId: number) => void;
    onPosponerHabitoConTiempo?: (habitoId: number, hasta: string | null) => void;
    onPausarHabito?: (habitoId: number) => void;
    onActualizarHabito?: (habitoId: number, datos: Partial<DatosNuevoHabito>) => void;
    /* Indica si la tarea hábito fue completada hoy (para menú contextual) */
    habitoCompletadoHoy?: boolean;
    /* Indica si el hábito está pausado (para menú contextual) */
    habitoPausado?: boolean;
    /* Indica si el hábito fue pospuesto hoy (para menú contextual) */
    habitoPospuestoHoy?: boolean;
    /* [207A-3] Callbacks para subhábitos */
    onToggleSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    onEliminarSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    /* [217A-2] Subhábitos: acciones independientes */
    onPosponerSubHabitoConTiempo?: (habitoPadreId: number, subHabitoId: number, hasta: string | null) => void;
    onActualizarSubHabito?: (habitoPadreId: number, subHabitoId: number, datos: Partial<DatosNuevoHabito>) => void;
    onConfigurarSubHabito?: (habitoPadreId: number, subHabitoId: number) => void;
    /* Indica si la tarea tiene subtareas (para ajustar padding y evitar colisión con el contador) */
    tieneSubtareas?: boolean;
    modoCompacto?: boolean;
    /* Props para selección múltiple (Ctrl+Click) */
    estaSeleccionada?: boolean;
    onSeleccionMultiple?: (tarea: Tarea, evento: React.MouseEvent) => void;
    modoSeleccionActivo?: boolean;    /* [218A-2] Ref para suprimir clicks posteriores a un drag */
    suprimirClickRef?: React.RefObject<boolean>;
    /* Listado de tareas y habitos para evaluar dependencias */
    tareas?: Tarea[];
    habitos?: Habito[];
}

export interface MenuContextualEstado {
    visible: boolean;
    x: number;
    y: number;
}
