/*
 * useBottomSheetTarea
 * Hook que encapsula toda la lógica del componente BottomSheetTarea.
 * Maneja estado del formulario, reset/carga, modales de selección,
 * badges de propiedades y guardado.
 */

import {useState, useRef, useEffect, useMemo} from 'react';
import {Calendar, Flag, Zap, Layers} from 'lucide-react';
import type {Proyecto, Tarea} from '../../types/dashboard';
import {obtenerTextoPrioridad, obtenerTextoUrgencia} from '../../utils/constantes';
import {calcularFechaDesdeOpcion} from '../../utils/fechaUI';
import type {DatosTarea} from '../../components/dashboard/BottomSheetTarea';

/* Tipos de modales de selección */
export type ModalActivoTarea = 'proyecto' | 'prioridad' | 'urgencia' | 'fecha' | null;

export interface BadgeActivo {
    id: string;
    etiqueta: string;
    icono: JSX.Element;
    variante: 'proyecto' | 'prioridad' | 'urgencia' | 'fecha';
}

export interface UseBottomSheetTareaParams {
    estaAbierto: boolean;
    onCerrar: () => void;
    onGuardar: (datos: DatosTarea) => Promise<void>;
    proyectos?: Proyecto[];
    valoresIniciales?: {
        proyectoId?: number;
        prioridad?: string;
        urgencia?: string;
        grupoEjecucion?: string | null;
    };
    tareaExistente?: Tarea;
}

export interface UseBottomSheetTareaReturn {
    esEdicion: boolean;
    texto: string;
    setTexto: React.Dispatch<React.SetStateAction<string>>;
    proyectoId: number | undefined;
    setProyectoId: React.Dispatch<React.SetStateAction<number | undefined>>;
    prioridad: string | undefined;
    setPrioridad: React.Dispatch<React.SetStateAction<string | undefined>>;
    urgencia: string | undefined;
    setUrgencia: React.Dispatch<React.SetStateAction<string | undefined>>;
    fecha: string | undefined;
    setFecha: React.Dispatch<React.SetStateAction<string | undefined>>;
    cargando: boolean;
    modalActivo: ModalActivoTarea;
    setModalActivo: React.Dispatch<React.SetStateAction<ModalActivoTarea>>;
    inputRef: React.RefObject<HTMLInputElement | null>;
    opcionesProyecto: Array<{id: string; etiqueta: string; icono: JSX.Element}>;
    badgesActivos: BadgeActivo[];
    manejarGuardar: () => Promise<void>;
    manejarEliminarBadge: (id: string) => void;
    manejarSeleccionFecha: (valor: string | undefined) => void;
    obtenerNombreProyecto: () => string | null;
}

export function useBottomSheetTarea({estaAbierto, onCerrar, onGuardar, proyectos = [], valoresIniciales = {}, tareaExistente}: UseBottomSheetTareaParams): UseBottomSheetTareaReturn {
    const esEdicion = !!tareaExistente;
    const [texto, setTexto] = useState(tareaExistente?.texto || '');
    const [proyectoId, setProyectoId] = useState<number | undefined>(tareaExistente?.proyectoId || valoresIniciales.proyectoId);
    const [prioridad, setPrioridad] = useState<string | undefined>(tareaExistente?.prioridad || valoresIniciales.prioridad);
    const [urgencia, setUrgencia] = useState<string | undefined>(tareaExistente?.urgencia || valoresIniciales.urgencia);
    const [fecha, setFecha] = useState<string | undefined>(tareaExistente?.configuracion?.fechaMaxima);
    const [grupoEjecucion, setGrupoEjecucion] = useState<string | undefined | null>(tareaExistente ? tareaExistente.grupoEjecucion : valoresIniciales.grupoEjecucion);
    const [cargando, setCargando] = useState(false);
    const [modalActivo, setModalActivo] = useState<ModalActivoTarea>(null);

    const inputRef = useRef<HTMLInputElement>(null);

    /* Ref para rastrear qué tarea se ha cargado (evita recargas innecesarias) */
    const tareaIdCargadaRef = useRef<number | undefined>(undefined);

    /* Autofocus al abrir */
    useEffect(() => {
        if (estaAbierto && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [estaAbierto]);

    /*
     * Reset al cerrar o cargar nueva tarea
     * Bug fix: Solo resetear cuando estaAbierto pasa a false,
     * o cuando el ID de tareaExistente cambia (nueva tarea a editar)
     */
    useEffect(() => {
        if (!estaAbierto) {
            /* Reset completo al cerrar */
            setTexto('');
            setProyectoId(undefined);
            setPrioridad(undefined);
            setUrgencia(undefined);
            setFecha(undefined);
            setGrupoEjecucion(undefined);
            setModalActivo(null);
            tareaIdCargadaRef.current = undefined;
        } else if (tareaExistente && tareaExistente.id !== tareaIdCargadaRef.current) {
            /* Cargar datos solo si es una tarea diferente a la ya cargada */
            setTexto(tareaExistente.texto);
            setProyectoId(tareaExistente.proyectoId);
            setPrioridad(tareaExistente.prioridad);
            setUrgencia(tareaExistente.urgencia);
            setFecha(tareaExistente.configuracion?.fechaMaxima);
            setGrupoEjecucion(tareaExistente.grupoEjecucion);
            tareaIdCargadaRef.current = tareaExistente.id;
        } else if (!tareaExistente && estaAbierto && tareaIdCargadaRef.current === undefined) {
            /* Modo creación: aplicar valores iniciales solo la primera vez */
            setProyectoId(valoresIniciales.proyectoId);
            setPrioridad(valoresIniciales.prioridad);
            setUrgencia(valoresIniciales.urgencia);
            setGrupoEjecucion(valoresIniciales.grupoEjecucion);
            tareaIdCargadaRef.current = -1; /* Marcador para modo creación */
        }
    }, [estaAbierto, tareaExistente?.id]);

    const manejarGuardar = async () => {
        if (!texto.trim() || cargando) return;

        setCargando(true);
        try {
            await onGuardar({
                texto,
                proyectoId,
                prioridad,
                urgencia,
                fecha,
                grupoEjecucion,
                id: tareaExistente?.id
            });
            onCerrar();
        // sentinel-disable-next-line fallo-sin-feedback — TO-DO: integrar useAlertas para toast de error
        } catch (error) {
            console.error('Error al guardar tarea:', error);
        } finally {
            setCargando(false);
        }
    };

    const obtenerNombreProyecto = () => {
        if (!proyectoId) return null;
        const proyecto = proyectos.find(p => p.id === proyectoId);
        return proyecto?.nombre || null;
    };

    /* Opciones de proyectos para el modal */
    const opcionesProyecto = useMemo(
        () =>
            proyectos.map(p => ({
                id: p.id.toString(),
                etiqueta: p.nombre,
                icono: <Layers size={14} />
            })),
        [proyectos]
    );

    /* Construir lista de badges activos */
    const badgesActivos = useMemo(() => {
        const badges: BadgeActivo[] = [];
        if (proyectoId) {
            const nombreProyecto = obtenerNombreProyecto();
            if (nombreProyecto) {
                badges.push({
                    id: 'proyecto',
                    etiqueta: nombreProyecto,
                    icono: <Layers size={10} />,
                    variante: 'proyecto' as const
                });
            }
        }
        if (prioridad) {
            badges.push({
                id: 'prioridad',
                etiqueta: obtenerTextoPrioridad(prioridad) || prioridad,
                icono: <Flag size={10} />,
                variante: 'prioridad' as const
            });
        }
        if (urgencia) {
            badges.push({
                id: 'urgencia',
                etiqueta: obtenerTextoUrgencia(urgencia) || urgencia,
                icono: <Zap size={10} />,
                variante: 'urgencia' as const
            });
        }
        if (fecha) {
            badges.push({
                id: 'fecha',
                etiqueta: fecha,
                icono: <Calendar size={10} />,
                variante: 'fecha' as const
            });
        }
        return badges;
    }, [proyectoId, prioridad, urgencia, fecha, proyectos]);

    /* Manejar eliminación de badge */
    const manejarEliminarBadge = (id: string) => {
        switch (id) {
            case 'proyecto':
                setProyectoId(undefined);
                break;
            case 'prioridad':
                setPrioridad(undefined);
                break;
            case 'urgencia':
                setUrgencia(undefined);
                break;
            case 'fecha':
                setFecha(undefined);
                break;
        }
    };

    /* Manejar selección de fecha desde el modal */
    const manejarSeleccionFecha = (valor: string | undefined) => {
        if (valor) {
            setFecha(calcularFechaDesdeOpcion(valor));
        } else {
            setFecha(undefined);
        }
    };

    return {
        esEdicion,
        texto,
        setTexto,
        proyectoId,
        setProyectoId,
        prioridad,
        setPrioridad,
        urgencia,
        setUrgencia,
        fecha,
        setFecha,
        cargando,
        modalActivo,
        setModalActivo,
        inputRef,
        opcionesProyecto,
        badgesActivos,
        manejarGuardar,
        manejarEliminarBadge,
        manejarSeleccionFecha,
        obtenerNombreProyecto
    };
}
