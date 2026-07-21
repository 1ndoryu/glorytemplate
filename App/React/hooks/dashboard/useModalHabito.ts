/*
 * useModalHabito
 * Hook que encapsula toda la lógica del modal de crear/editar hábito.
 * Gestiona estado del formulario, validación, auto-guardado,
 * subhábitos, tareas del hábito y panel de chat.
 */

import {useState, useCallback, useEffect, useMemo} from 'react';
import type {NivelImportancia, DatosNuevoHabito, FrecuenciaHabito, Habito, SubHabito, Participante, Tarea, DatosEdicionTarea, DatosNuevoSubHabito, VentanaOportunidad} from '../../types/dashboard';
import type {ParticipanteChat} from '../usePanelChat';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import type {EstadoHabito} from '../../components/shared';
import {usePanelChat} from '../usePanelChat';
import {useHabitosStore} from '../../stores/habitosStore';
import {usePluginsStore} from '../../stores/pluginsStore';
import {obtenerFechaHoy} from '../../utils/fecha';

type DatosFormulario = DatosNuevoHabito;

export interface UseModalHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosFormulario) => void;
    onPausarHabito?: (id: number) => void;
    habito?: Habito;
    participantes?: Participante[];
    tareas?: Tarea[];
    onToggleTarea?: (id: number) => void;
    onCrearTarea?: (datos: DatosEdicionTarea) => void;
    onEliminarTarea?: (id: number) => void;
    onConfigurarTarea?: (tarea: Tarea) => void;
    onActualizarOrdenTareasHabito?: (habitoId: number, tareasIds: number[]) => void;
    onEditarTarea?: (id: number, datos: DatosEdicionTarea) => void;
    /** Modo subhábito: cuando presente, el modal opera sobre un subhábito en vez de un hábito */
    subHabito?: SubHabito | null;
    habitoPadre?: Habito | null;
}

export interface UseModalHabitoReturn {
    /* Estado del formulario */
    modoEdicion: boolean;
    nombre: string;
    setNombre: (v: string) => void;
    descripcion: string;
    setDescripcion: (v: string) => void;
    icono: string;
    setIcono: (v: string) => void;
    colorIcono: string;
    setColorIcono: (v: string) => void;
    importancia: NivelImportancia;
    setImportancia: (v: NivelImportancia) => void;
    frecuencia: FrecuenciaHabito;
    setFrecuencia: (v: FrecuenciaHabito) => void;
    ventanaOportunidad: VentanaOportunidad | undefined;
    setVentanaOportunidad: (v: VentanaOportunidad | undefined) => void;
    errores: {nombre?: string};
    esHabitoEspecialAyuno: boolean;
    esModoSubHabito: boolean;

    /* Estado del hábito hoy */
    estadoHoy: EstadoHabito;
    manejarCambioEstado: (nuevoEstado: EstadoHabito) => void;

    /* Chat */
    chatVisible: boolean;
    toggleChat: () => void;
    tieneMensajesSinLeer: boolean;
    participantesChat: ParticipanteChat[];
    mostrarChatColumna: boolean;

    /* Tareas del hábito */
    tareasDelHabito: Tarea[];
    manejarReordenarTareas: (tareasIds: number[]) => void;

    /* SubHábitos */
    manejarCrearSubHabito: (datos: DatosNuevoSubHabito) => void;
    manejarEditarSubHabito: (subHabitoId: number, datos: DatosNuevoSubHabito) => void;
    manejarEliminarSubHabito: (subHabitoId: number) => void;
    manejarToggleSubHabito: (subHabitoId: number) => void;

    /* [217A-3] Historial retroactivo subhábitos */
    manejarMarcarDiaSubHabito: (fecha: string, estado: EstadoHabito) => boolean;
    manejarDesmarcarDiaSubHabito: (fecha: string) => boolean;

    /* Acciones */
    manejarGuardar: () => void;
    manejarCerrarConGuardado: () => void;
    manejarPausarHabito: (() => void) | undefined;
}

export function useModalHabito({
    estaAbierto,
    onCerrar,
    onGuardar,
    onPausarHabito,
    habito,
    participantes = [],
    tareas = [],
    onActualizarOrdenTareasHabito,
    subHabito,
    habitoPadre
}: UseModalHabitoProps): UseModalHabitoReturn {
    const modoEdicion = !!habito && !subHabito;
    const esModoSubHabito = Boolean(subHabito);

    const habitoAyunoId = usePluginsStore(s => (s.configuracionPlugins['ayuno'] as unknown as {habitoId?: number} | undefined)?.habitoId);
    const esHabitoEspecialAyuno = !!(habito && habitoAyunoId && habito.id === habitoAyunoId);

    /* Estado local para edición */
    const [nombre, setNombre] = useState((subHabito ? subHabito.nombre : habito?.nombre) || '');
    const [descripcion, setDescripcion] = useState(habito?.descripcion || '');
    const [icono, setIcono] = useState(habito?.icono || 'check-circle');
    const [colorIcono, setColorIcono] = useState(habito?.colorIcono || '#888888');
    const [importancia, setImportancia] = useState<NivelImportancia>((subHabito ? subHabito.importancia : habito?.importancia) || 'Media');
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>((subHabito ? subHabito.frecuencia : habito?.frecuencia) || FRECUENCIA_POR_DEFECTO);
    const [ventanaOportunidad, setVentanaOportunidad] = useState<VentanaOportunidad | undefined>(subHabito ? subHabito.ventanaOportunidad : habito?.ventanaOportunidad);
    const [errores, setErrores] = useState<{nombre?: string}>({});

    /* Hook para panel de chat (solo en modo hábito) */
    const {chatVisible, toggleChat, tieneMensajesSinLeer, participantesChat, mostrarChatColumna} = usePanelChat({
        elementoId: habito?.id,
        elementoTipo: 'habito',
        participantes,
        habilitado: modoEdicion && !esModoSubHabito
    });

    /* Estado de cumplimiento de hoy y acciones del store */
    const toggleHabito = useHabitosStore(state => state.toggleHabito);
    const posponerHabito = useHabitosStore(state => state.posponerHabito);
    const toggleSubHabito = useHabitosStore(state => state.toggleSubHabito);
    const posponerSubHabito = useHabitosStore(state => state.posponerSubHabitoConTiempo);
    const crearSubHabito = useHabitosStore(state => state.crearSubHabito);
    const editarSubHabito = useHabitosStore(state => state.editarSubHabito);
    const eliminarSubHabito = useHabitosStore(state => state.eliminarSubHabito);
    /* [217A-3] Acciones de historial retroactivo para subhábitos */
    const marcarDiaSubHabito = useHabitosStore(state => state.marcarDiaSubHabito);
    const desmarcarDiaSubHabito = useHabitosStore(state => state.desmarcarDiaSubHabito);
    const hoy = obtenerFechaHoy();

    let estadoHoy: EstadoHabito = 'pendiente';
    if (subHabito) {
        if (subHabito.historialCompletados?.includes(hoy)) estadoHoy = 'completado';
        else if (subHabito.historialPospuestos?.includes(hoy)) estadoHoy = 'pospuesto';
    } else if (habito) {
        if (habito.historialCompletados?.includes(hoy)) estadoHoy = 'completado';
        else if (habito.historialPospuestos?.includes(hoy)) estadoHoy = 'pospuesto';
    }

    /* Callbacks para subhábitos */
    const manejarCrearSubHabito = useCallback(
        (datos: DatosNuevoSubHabito) => {
            if (habito) crearSubHabito(habito.id, datos);
        },
        [habito, crearSubHabito]
    );

    const manejarEditarSubHabito = useCallback(
        (subHabitoId: number, datos: DatosNuevoSubHabito) => {
            if (habito) editarSubHabito(habito.id, subHabitoId, datos);
        },
        [habito, editarSubHabito]
    );

    const manejarEliminarSubHabito = useCallback(
        (subHabitoId: number) => {
            if (habito) eliminarSubHabito(habito.id, subHabitoId);
        },
        [habito, eliminarSubHabito]
    );

    const manejarToggleSubHabito = useCallback(
        (subHabitoId: number) => {
            if (habito) toggleSubHabito(habito.id, subHabitoId);
        },
        [habito, toggleSubHabito]
    );

    /* Filtrar y ordenar tareas que pertenecen a este hábito */
    const tareasDelHabito = useMemo(() => {
        if (!habito) return [];
        const tareasHabito = tareas.filter(t => t.habitoId === habito.id);

        if (habito.tareasIds && habito.tareasIds.length > 0) {
            const ordenMap = new Map(habito.tareasIds.map((id, index) => [id, index]));
            return [...tareasHabito].sort((a, b) => {
                const ordenA = ordenMap.get(a.id) ?? 999;
                const ordenB = ordenMap.get(b.id) ?? 999;
                return ordenA - ordenB;
            });
        }

        return tareasHabito;
    }, [habito, tareas]);

    /* Sincronizar estado cuando cambia el hábito o subhábito */
    useEffect(() => {
        if (subHabito) {
            setNombre(subHabito.nombre);
            setDescripcion('');
            setIcono('check-circle');
            setColorIcono('#888888');
            setImportancia(subHabito.importancia);
            setFrecuencia(subHabito.frecuencia || FRECUENCIA_POR_DEFECTO);
            setVentanaOportunidad(subHabito.ventanaOportunidad);
        } else if (habito) {
            setNombre(habito.nombre);
            setDescripcion(habito.descripcion || '');
            setIcono(habito.icono || 'check-circle');
            setColorIcono(habito.colorIcono || '#888888');
            setImportancia(habito.importancia);
            setFrecuencia(habito.frecuencia || FRECUENCIA_POR_DEFECTO);
            setVentanaOportunidad(habito.ventanaOportunidad);
        } else {
            setNombre('');
            setDescripcion('');
            setIcono('check-circle');
            setColorIcono('#888888');
            setImportancia('Media');
            setFrecuencia(FRECUENCIA_POR_DEFECTO);
            setVentanaOportunidad(undefined);
        }
        setErrores({});
    }, [habito?.id, subHabito?.id, estaAbierto]);

    /* Manejador de cambio de estado del hábito o subhábito */
    const manejarCambioEstado = useCallback(
        (nuevoEstado: EstadoHabito) => {
            if (subHabito && habitoPadre) {
                if (nuevoEstado === 'completado') {
                    toggleSubHabito(habitoPadre.id, subHabito.id);
                } else if (nuevoEstado === 'pospuesto') {
                    posponerSubHabito(habitoPadre.id, subHabito.id, null);
                } else if (nuevoEstado === 'pendiente') {
                    if (estadoHoy === 'completado') toggleSubHabito(habitoPadre.id, subHabito.id);
                    else if (estadoHoy === 'pospuesto') posponerSubHabito(habitoPadre.id, subHabito.id, null);
                }
            } else if (habito) {
                if (nuevoEstado === 'completado') {
                    toggleHabito(habito.id);
                } else if (nuevoEstado === 'pospuesto') {
                    posponerHabito(habito.id);
                } else if (nuevoEstado === 'pendiente') {
                    if (estadoHoy === 'completado') toggleHabito(habito.id);
                    else if (estadoHoy === 'pospuesto') posponerHabito(habito.id);
                }
            }
        },
        [subHabito, habitoPadre, habito, estadoHoy, toggleSubHabito, posponerSubHabito, toggleHabito, posponerHabito]
    );

    /* Validar formulario (mínimo 2 chars para subhábitos, 3 para hábitos) */
    const validarFormulario = useCallback((): boolean => {
        const nuevosErrores: {nombre?: string} = {};
        const minLength = esModoSubHabito ? 2 : 3;

        if (!nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        } else if (nombre.trim().length < minLength) {
            nuevosErrores.nombre = `El nombre debe tener al menos ${minLength} caracteres`;
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }, [nombre, esModoSubHabito]);

    /* Guardar hábito o subhábito */
    const manejarGuardar = useCallback(() => {
        if (!validarFormulario()) return;

        if (esModoSubHabito && subHabito && habitoPadre) {
            editarSubHabito(habitoPadre.id, subHabito.id, {
                nombre: nombre.trim(),
                importancia,
                frecuencia,
                ventanaOportunidad
            });
        } else {
            const nombreSeguro = esHabitoEspecialAyuno ? 'Ayuno' : nombre.trim();
            onGuardar({
                nombre: nombreSeguro,
                importancia,
                tags: [],
                frecuencia,
                descripcion: descripcion.trim() || undefined,
                icono,
                colorIcono,
                ventanaOportunidad
            });
        }
        onCerrar();
    }, [esModoSubHabito, subHabito, habitoPadre, nombre, importancia, frecuencia, ventanaOportunidad, descripcion, icono, colorIcono, validarFormulario, editarSubHabito, onGuardar, onCerrar, esHabitoEspecialAyuno]);

    /* Auto-guardado: al cerrar el modal, guardar si hay nombre válido */
    const manejarCerrarConGuardado = useCallback(() => {
        const minLength = esModoSubHabito ? 2 : 3;
        if (nombre.trim().length >= minLength) {
            manejarGuardar();
        } else {
            onCerrar();
        }
    }, [nombre, manejarGuardar, onCerrar, esModoSubHabito]);

    /* Callback para reordenar tareas del hábito */
    const manejarReordenarTareas = useCallback(
        (tareasIds: number[]) => {
            if (habito && onActualizarOrdenTareasHabito) {
                onActualizarOrdenTareasHabito(habito.id, tareasIds);
            }
        },
        [habito, onActualizarOrdenTareasHabito]
    );

    /* [217A-3] Callbacks de historial retroactivo para subhábitos (mapa de calor).
     * Usa EstadoHabito de historialHabitos (sin 'pendiente') porque el mapa de calor
     * solo genera completado/pospuesto/null. 'pendiente' se maneja como null (desmarcar). */
    const manejarMarcarDiaSubHabito = useCallback(
        (fecha: string, estado: EstadoHabito) => {
            if (!habitoPadre || !subHabito) return false;
            /* 'pendiente' no es un estado del historial — tratar como desmarcar */
            if (estado === 'pendiente') return desmarcarDiaSubHabito(habitoPadre.id, subHabito.id, fecha);
            return marcarDiaSubHabito(habitoPadre.id, subHabito.id, fecha, estado);
        },
        [habitoPadre, subHabito, marcarDiaSubHabito, desmarcarDiaSubHabito]
    );
    const manejarDesmarcarDiaSubHabito = useCallback(
        (fecha: string) => {
            if (habitoPadre && subHabito) return desmarcarDiaSubHabito(habitoPadre.id, subHabito.id, fecha);
            return false;
        },
        [habitoPadre, subHabito, desmarcarDiaSubHabito]
    );

    /* Callback para pausar hábito o subhábito */
    const manejarPausarHabito = esModoSubHabito && subHabito && habitoPadre
        ? () => {
              editarSubHabito(habitoPadre.id, subHabito.id, {
                  nombre: subHabito.nombre,
                  importancia: subHabito.importancia,
                  frecuencia: subHabito.frecuencia
              });
          }
        : habito && onPausarHabito
          ? () => onPausarHabito(habito.id)
          : undefined;

    return {
        modoEdicion,
        nombre,
        setNombre,
        descripcion,
        setDescripcion,
        icono,
        setIcono,
        colorIcono,
        setColorIcono,
        importancia,
        setImportancia,
        frecuencia,
        setFrecuencia,
        ventanaOportunidad,
        setVentanaOportunidad,
        errores,
        esHabitoEspecialAyuno,
        esModoSubHabito,
        estadoHoy,
        manejarCambioEstado,
        chatVisible,
        toggleChat,
        tieneMensajesSinLeer,
        participantesChat,
        mostrarChatColumna,
        tareasDelHabito,
        manejarReordenarTareas,
        manejarCrearSubHabito,
        manejarEditarSubHabito,
        manejarEliminarSubHabito,
        manejarToggleSubHabito,
        manejarMarcarDiaSubHabito,
        manejarDesmarcarDiaSubHabito,
        manejarGuardar,
        manejarCerrarConGuardado,
        manejarPausarHabito
    };
}
