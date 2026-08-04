/*
 * useModalCreacionRapida
 * Hook que centraliza toda la lógica del modal de creación rápida.
 * Gestiona estados del formulario, menús contextuales y acciones.
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import type {Adjunto} from '../../types/dashboard';
import {useAdjuntos} from '../useAdjuntos';

interface EstadoOpciones {
    proyectoId?: number;
    prioridad?: string;
    urgencia?: string;
    frecuencia?: string;
    fecha?: string;
    importancia?: string;
    grupoEjecucion?: string | null;
}

interface EstadoMenu {
    visible: boolean;
    x: number;
    y: number;
}

interface DatosCreacion {
    texto: string;
    tipo: 'tarea' | 'habito' | 'proyecto';
    adjuntos: Adjunto[];
    proyectoId?: number;
    prioridad?: string;
    urgencia?: string;
    frecuencia?: string;
    fecha?: string;
    importancia?: string;
    grupoEjecucion?: string | null;
}

interface UseModalCreacionRapidaProps {
    tipo: 'tarea' | 'habito' | 'proyecto';
    valoresIniciales?: {
        proyectoId?: number;
        prioridad?: string;
        urgencia?: string;
        grupoEjecucion?: string | null;
    };
    onCerrar: () => void;
    onGuardar: (datos: DatosCreacion) => Promise<void>;
    onCambiarTipo: (tipo: 'tarea' | 'habito' | 'proyecto') => void;
}

const menuInicial: EstadoMenu = {visible: false, x: 0, y: 0};

export function useModalCreacionRapida({tipo, valoresIniciales = {}, onCerrar, onGuardar, onCambiarTipo}: UseModalCreacionRapidaProps) {
    const [texto, setTexto] = useState('');
    const [opciones, setOpciones] = useState<EstadoOpciones>({
        proyectoId: valoresIniciales.proyectoId,
        prioridad: valoresIniciales.prioridad,
        urgencia: valoresIniciales.urgencia,
        grupoEjecucion: valoresIniciales.grupoEjecucion
    });
    const [cargando, setCargando] = useState(false);
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* Hook para adjuntos */
    const {subirArchivo, estado: estadoSubida} = useAdjuntos();

    /* Estados para menús contextuales - consolidados */
    const [menuTipo, setMenuTipo] = useState<EstadoMenu>(menuInicial);
    const [menuProyecto, setMenuProyecto] = useState<EstadoMenu>(menuInicial);
    const [menuPrioridad, setMenuPrioridad] = useState<EstadoMenu>(menuInicial);
    const [menuUrgencia, setMenuUrgencia] = useState<EstadoMenu>(menuInicial);
    const [menuFrecuencia, setMenuFrecuencia] = useState<EstadoMenu>(menuInicial);
    const [menuFecha, setMenuFecha] = useState<EstadoMenu>(menuInicial);
    const [menuImportancia, setMenuImportancia] = useState<EstadoMenu>(menuInicial);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [tipo]);

    const cerrarOtrosMenus = useCallback(() => {
        setMenuTipo(prev => ({...prev, visible: false}));
        setMenuProyecto(prev => ({...prev, visible: false}));
        setMenuPrioridad(prev => ({...prev, visible: false}));
        setMenuUrgencia(prev => ({...prev, visible: false}));
        setMenuFrecuencia(prev => ({...prev, visible: false}));
        setMenuFecha(prev => ({...prev, visible: false}));
        setMenuImportancia(prev => ({...prev, visible: false}));
    }, []);

    const hayMenuAbierto = menuTipo.visible || menuProyecto.visible || menuPrioridad.visible || menuUrgencia.visible || menuFrecuencia.visible || menuFecha.visible || menuImportancia.visible;

    const manejarSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!texto.trim() || cargando) return;

        setCargando(true);
        try {
            await onGuardar({
                texto,
                tipo,
                ...opciones,
                adjuntos
            });
            setOpciones({});
            setTexto('');
            setOpciones({});
            setAdjuntos([]);
            onCerrar();
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    }, [texto, cargando, tipo, opciones, adjuntos, onGuardar, onCerrar]);

    const manejarKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCerrar();
        }
    }, [onCerrar]);

    const manejarArchivoSeleccionado = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const nuevoAdjunto = await subirArchivo(file);
            if (nuevoAdjunto) {
                setAdjuntos(prev => [...prev, nuevoAdjunto]);
            }
        } catch (error) {
            console.error('Error subiendo archivo:', error);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [subirArchivo]);

    const obtenerPlaceholder = useCallback(() => {
        switch (tipo) {
            case 'tarea':
                return 'Escribe una nueva tarea...';
            case 'habito':
                return 'Nombre del nuevo hábito...';
            case 'proyecto':
                return 'Nombre del nuevo proyecto...';
            default:
                return 'Escribir...';
        }
    }, [tipo]);

    const obtenerEtiquetaFecha = useCallback((val?: string) => {
        if (!val) return 'Fecha';
        if (val === 'hoy') return 'Hoy';
        if (val === 'manana') return 'Mañana';
        if (val === 'semana') return 'Esta Semana';
        /* [253A-9] Formatear fechas ISO (YYYY-MM-DD) de forma legible */
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const fecha = new Date(val + 'T12:00:00');
            return fecha.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'});
        }
        return val;
    }, []);

    const manejarClickOverlay = useCallback((_e: React.MouseEvent) => {
        if (hayMenuAbierto) {
            cerrarOtrosMenus();
            return;
        }
        onCerrar();
    }, [hayMenuAbierto, cerrarOtrosMenus, onCerrar]);

    const manejarClickContenedor = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (hayMenuAbierto) {
            cerrarOtrosMenus();
        }
    }, [hayMenuAbierto, cerrarOtrosMenus]);

    const abrirMenu = useCallback((setter: React.Dispatch<React.SetStateAction<EstadoMenu>>, e: React.MouseEvent) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        cerrarOtrosMenus();
        setter({visible: true, x: rect.left, y: rect.bottom + 4});
    }, [cerrarOtrosMenus]);

    const seleccionarTipo = useCallback((id: string) => {
        onCambiarTipo(id as 'tarea' | 'habito' | 'proyecto');
        setMenuTipo(prev => ({...prev, visible: false}));
    }, [onCambiarTipo]);

    const seleccionarProyecto = useCallback((id: string) => {
        setOpciones(prev => ({...prev, proyectoId: id === 'ninguno' ? undefined : Number(id)}));
        setMenuProyecto(prev => ({...prev, visible: false}));
    }, []);

    const seleccionarPrioridad = useCallback((id: string) => {
        setOpciones(prev => ({...prev, prioridad: id}));
        setMenuPrioridad(prev => ({...prev, visible: false}));
    }, []);

    const seleccionarUrgencia = useCallback((id: string) => {
        setOpciones(prev => ({...prev, urgencia: id}));
        setMenuUrgencia(prev => ({...prev, visible: false}));
    }, []);

    const seleccionarFrecuencia = useCallback((id: string) => {
        setOpciones(prev => ({...prev, frecuencia: id}));
        setMenuFrecuencia(prev => ({...prev, visible: false}));
    }, []);

    const seleccionarFecha = useCallback((id: string) => {
        setOpciones(prev => ({...prev, fecha: id === 'ninguna' ? undefined : id}));
        setMenuFecha(prev => ({...prev, visible: false}));
    }, []);

    const seleccionarImportancia = useCallback((id: string) => {
        setOpciones(prev => ({...prev, importancia: id}));
        setMenuImportancia(prev => ({...prev, visible: false}));
    }, []);

    const abrirSelectorArchivo = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (fileInputRef.current && !estadoSubida.subiendo) {
            fileInputRef.current.click();
        }
    }, [estadoSubida.subiendo]);

    return {
        /* Estado */
        texto,
        setTexto,
        opciones,
        cargando,
        adjuntos,
        estadoSubida,

        /* Refs */
        inputRef,
        fileInputRef,

        /* Menús */
        menuTipo,
        menuProyecto,
        menuPrioridad,
        menuUrgencia,
        menuFrecuencia,
        menuFecha,
        menuImportancia,

        /* Acciones de menús */
        abrirMenu,
        cerrarMenuTipo: () => setMenuTipo(prev => ({...prev, visible: false})),
        cerrarMenuProyecto: () => setMenuProyecto(prev => ({...prev, visible: false})),
        cerrarMenuPrioridad: () => setMenuPrioridad(prev => ({...prev, visible: false})),
        cerrarMenuUrgencia: () => setMenuUrgencia(prev => ({...prev, visible: false})),
        cerrarMenuFrecuencia: () => setMenuFrecuencia(prev => ({...prev, visible: false})),
        cerrarMenuFecha: () => setMenuFecha(prev => ({...prev, visible: false})),
        cerrarMenuImportancia: () => setMenuImportancia(prev => ({...prev, visible: false})),

        /* Selectores */
        seleccionarTipo,
        seleccionarProyecto,
        seleccionarPrioridad,
        seleccionarUrgencia,
        seleccionarFrecuencia,
        seleccionarFecha,
        seleccionarImportancia,

        /* Handlers */
        manejarSubmit,
        manejarKeyDown,
        manejarArchivoSeleccionado,
        manejarClickOverlay,
        manejarClickContenedor,
        abrirSelectorArchivo,

        /* Setters de menú (para abrirMenu) */
        setMenuTipo,
        setMenuProyecto,
        setMenuPrioridad,
        setMenuUrgencia,
        setMenuFrecuencia,
        setMenuFecha,
        setMenuImportancia,

        /* Utilidades */
        obtenerPlaceholder,
        obtenerEtiquetaFecha,
    };
}

export type {DatosCreacion, EstadoOpciones, EstadoMenu};
