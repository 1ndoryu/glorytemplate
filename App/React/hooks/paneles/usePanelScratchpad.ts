/*
 * usePanelScratchpad
 * Lógica extraída de PanelScratchpad para cumplir SRP
 * Gestiona estado de notas con autoguardado debounced y modo enfoque
 */

import {useState, useEffect, useRef, useCallback} from 'react';
import {useNotasStore, PANEL_SCRATCHPAD} from '../../stores/notasStore';
import {extraerTitulo, CONTENIDO_NOTA_NUEVA} from '../../utils/notasUtils';
import {useAlertas} from '../useAlertas';
import type {NotaActiva} from '../../types/notas';

/* Constante para delay de autoguardado (ms) */
const DELAY_AUTOGUARDADO = 2000;

/* [263A-12] Nota vacía por defecto para el selector de Zustand */
const NOTA_VACIA: NotaActiva = {id: null, contenido: CONTENIDO_NOTA_NUEVA, modificada: false};

interface UsePanelScratchpadReturn {
    modalNotasExpandidoAbierto: boolean;
    setModalNotasExpandidoAbierto: (abierto: boolean) => void;
    modoEnfoque: boolean;
    setModoEnfoque: (activo: boolean) => void;
    notaActiva: NotaActiva;
    actualizarContenido: (contenido: string) => void;
    tituloActivo: string;
    esNotaNueva: boolean;
    manejarNuevaNota: () => void;
    manejarLimpiar: () => void;
    manejarAbrirCarpeta: () => Promise<void>;
}

/* [263A-12] El hook recibe panelId para que cada instancia gestione su propia nota independiente */
export function usePanelScratchpad(panelId: string = PANEL_SCRATCHPAD): UsePanelScratchpadReturn {
    const [modalNotasExpandidoAbierto, setModalNotasExpandidoAbierto] = useState(false);
    const [modoEnfoque, setModoEnfoque] = useState(false);

    /* [263A-12] Estado per-panel: cada panel lee su propia nota del mapa */
    const notaActiva = useNotasStore(s => s.notasActivaPorPanel[panelId]) ?? NOTA_VACIA;
    const notas = useNotasStore(s => s.notas);
    const crearNuevaNota = useNotasStore(s => s.crearNuevaNota);
    const actualizarContenidoStore = useNotasStore(s => s.actualizarContenidoNotaActiva);
    const guardarNotaActiva = useNotasStore(s => s.guardarNotaActiva);
    const cargarNotas = useNotasStore(s => s.cargarNotas);
    const restaurarNotaActivaGuardada = useNotasStore(s => s.restaurarNotaActivaGuardada);

    /* [263A-12] Wrapper: las acciones del store ahora reciben panelId */
    const actualizarContenido = useCallback((contenido: string) => {
        actualizarContenidoStore(panelId, contenido);
    }, [panelId, actualizarContenidoStore]);

    /* Refs para autoguardado debounced */
    const timeoutGuardadoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const contenidoAnteriorRef = useRef<string>(notaActiva.contenido);

    const {mostrarExito} = useAlertas();

    /*
     * Efecto 0: Inicializar panel si no tiene entrada en el store.
     * Paneles duplicados se crean con nota vacía.
     */
    useEffect(() => {
        const estado = useNotasStore.getState();
        if (!estado.notasActivaPorPanel[panelId]) {
            estado.crearNuevaNota(panelId);
        }
    }, [panelId]);

    /*
     * Efecto 1: Cargar notas al montar el componente
     * Solo se ejecuta una vez al inicio
     */
    useEffect(() => {
        cargarNotas(true);
    }, [cargarNotas]);

    /*
     * Efecto 2: Restaurar última nota activa cuando las notas se cargan
     * [263A-12] Todos los paneles, incluyendo duplicados, intentan restaurar su nota guardada.
     */
    useEffect(() => {
        if (notas.length > 0 && notaActiva.id === null && notaActiva.contenido === CONTENIDO_NOTA_NUEVA) {
            restaurarNotaActivaGuardada(panelId);
        }
    }, [panelId, notas.length, notaActiva.id, notaActiva.contenido, restaurarNotaActivaGuardada]);

    /*
     * Efecto 3: Autoguardado debounced
     * Se activa cuando el contenido cambia y está modificada
     * Usa debounce de 2 segundos para evitar guardar en cada keystroke
     */
    useEffect(() => {
        if (!notaActiva.modificada) return;
        if (notaActiva.contenido === contenidoAnteriorRef.current) return;
        if (notaActiva.contenido === CONTENIDO_NOTA_NUEVA) return;
        if (!notaActiva.contenido.trim()) return;

        if (timeoutGuardadoRef.current) {
            clearTimeout(timeoutGuardadoRef.current);
        }

        timeoutGuardadoRef.current = setTimeout(() => {
            guardarNotaActiva(panelId);
            contenidoAnteriorRef.current = notaActiva.contenido;
        }, DELAY_AUTOGUARDADO);

        return () => {
            if (timeoutGuardadoRef.current) {
                clearTimeout(timeoutGuardadoRef.current);
            }
        };
    }, [notaActiva.contenido, notaActiva.modificada, guardarNotaActiva, panelId]);

    const manejarNuevaNota = () => {
        crearNuevaNota(panelId);
        mostrarExito('Nueva nota creada');
    };

    const manejarLimpiar = () => {
        crearNuevaNota(panelId);
    };

    /* Guardar la nota activa antes de abrir el modal de notas guardadas */
    const manejarAbrirCarpeta = async () => {
        if (notaActiva.modificada && notaActiva.contenido.trim()) {
            await guardarNotaActiva(panelId);
        }
        setModalNotasExpandidoAbierto(true);
    };

    /* Título de la nota activa para mostrar en el encabezado */
    const tituloActivo = extraerTitulo(notaActiva.contenido);
    const esNotaNueva = notaActiva.id === null;

    return {
        modalNotasExpandidoAbierto,
        setModalNotasExpandidoAbierto,
        modoEnfoque,
        setModoEnfoque,
        notaActiva,
        actualizarContenido,
        tituloActivo,
        esNotaNueva,
        manejarNuevaNota,
        manejarLimpiar,
        manejarAbrirCarpeta
    };
}
