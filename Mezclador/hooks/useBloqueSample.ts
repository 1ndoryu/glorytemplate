/*
 * useBloqueSample — Lógica del bloque de sample en timeline.
 * Resize drag, corte preview, waveform path, store access.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BloqueMezclador } from '../types/mezclador';
import { anchoBloquePorc, posicionBloquePorc, snapABeat, snapConResolucion } from '../utils/compasUtils';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface UseBloqueSampleParams {
    bloque: BloqueMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    modoCortarActivo?: boolean;
    onCortar?: (bloqueId: string, compas: number) => void;
}

export const useBloqueSample = ({
    bloque,
    totalCompases,
    onIniciarDrag,
    modoCortarActivo,
    onCortar,
}: UseBloqueSampleParams) => {
    const eliminarBloque = useMezcladorStore(s => s.eliminarBloque);
    const duplicarBloque = useMezcladorStore(s => s.duplicarBloque);
    const setDuracionBloque = useMezcladorStore(s => s.setDuracionBloque);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const guardarSnapshot = useMezcladorStore(s => s._guardarSnapshot);
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const toggleSeleccionBloque = useMezcladorStore(s => s.toggleSeleccionBloque);
    const fijarTotalExtendido = useMezcladorStore(s => s.fijarTotalExtendido);
    const desfijarTotalExtendido = useMezcladorStore(s => s.desfijarTotalExtendido);

    const ancho = anchoBloquePorc(bloque.duracionCompases, totalCompases);
    const izquierda = posicionBloquePorc(bloque.compasInicio, totalCompases);

    const [resizing, setResizing] = useState(false);
    const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
    const [lineaCortePorc, setLineaCortePorc] = useState<number | null>(null);
    const resizingRef = useRef(false);
    const datosResizeRef = useRef({ duracionInicial: 0, xInicial: 0, anchoContenedor: 0 });

    /* Iniciar resize desde el handle derecho */
    const iniciarResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        /* C224: Guardar snapshot antes del resize para undo */
        guardarSnapshot();
        /* C296: Congelar total extendido para evitar saltos de zoom */
        fijarTotalExtendido();

        const contenedor = (e.target as HTMLElement).closest('.mezcladorPistaContenido');
        const anchoContenedor = contenedor ? contenedor.getBoundingClientRect().width : 400;

        datosResizeRef.current = {
            duracionInicial: bloque.duracionCompases,
            xInicial: e.clientX,
            anchoContenedor,
        };
        resizingRef.current = true;
        setResizing(true);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, [bloque.duracionCompases, guardarSnapshot, fijarTotalExtendido]);

    /* Document listeners para resize */
    useEffect(() => {
        if (!resizing) return;

        const mover = (ev: MouseEvent) => {
            if (!resizingRef.current) return;
            const { duracionInicial, xInicial, anchoContenedor } = datosResizeRef.current;
            const deltaX = ev.clientX - xInicial;
            const deltaCompases = (deltaX / anchoContenedor) * totalCompases;
            const nuevaDuracion = snapABeat(
                Math.max(0.25, duracionInicial + deltaCompases),
                compasProyecto
            );
            setDuracionBloque(bloque.id, nuevaDuracion);
        };

        const soltar = () => {
            resizingRef.current = false;
            setResizing(false);
            /* C296: Descongelar total extendido */
            desfijarTotalExtendido();
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
        };
    }, [resizing, totalCompases, compasProyecto, bloque.id, setDuracionBloque, desfijarTotalExtendido]);

    /*
     * Mini waveform SVG path
     * C273: Centrar cada peak en su segmento temporal
     */
    const waveformPath = bloque.waveformPeaks.length > 0
        ? bloque.waveformPeaks.map((peak, i) => {
            const n = bloque.waveformPeaks.length;
            const x = ((i + 0.5) / n) * 100;
            const y = 50 - peak * 40;
            const yEspejo = 50 + peak * 40;
            return `M${x},${y} L${x},${yEspejo}`;
        }).join(' ')
        : '';

    /* C232: Preview de linea de corte */
    const alMoverMouse = useCallback((e: React.MouseEvent) => {
        if (!modoCortarActivo) {
            if (lineaCortePorc !== null) setLineaCortePorc(null);
            return;
        }
        const bloqueEl = e.currentTarget as HTMLElement;
        const rect = bloqueEl.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const porcDentroBloque = relX / rect.width;

        const compasAbsoluto = bloque.compasInicio + porcDentroBloque * bloque.duracionCompases;
        const compasSnapped = snapConResolucion(compasAbsoluto, compasProyecto, snapResolucion);
        const porcSnapped = (compasSnapped - bloque.compasInicio) / bloque.duracionCompases;
        const porcClamped = Math.max(0.02, Math.min(0.98, porcSnapped));
        setLineaCortePorc(porcClamped * 100);
    }, [modoCortarActivo, bloque.compasInicio, bloque.duracionCompases, compasProyecto, snapResolucion, lineaCortePorc]);

    const alSalirMouse = useCallback(() => {
        if (lineaCortePorc !== null) setLineaCortePorc(null);
    }, [lineaCortePorc]);

    /* C214: Click para cortar */
    const alClickBloque = useCallback((e: React.MouseEvent) => {
        if (!modoCortarActivo || !onCortar) return;
        e.stopPropagation();
        e.preventDefault();

        const contenedor = (e.target as HTMLElement).closest('.mezcladorPistaContenido');
        if (!contenedor) return;
        const rect = contenedor.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const porcentaje = relX / rect.width;
        const compasClick = snapConResolucion(porcentaje * totalCompases, compasProyecto, snapResolucion);
        onCortar(bloque.id, compasClick);
    }, [modoCortarActivo, onCortar, totalCompases, compasProyecto, bloque.id, snapResolucion]);

    /* Handler mousedown principal — C226, C247, C249 */
    const alMouseDown = useCallback((e: React.MouseEvent) => {
        if (resizing || modoCortarActivo) return;
        const target = e.target as HTMLElement;
        if (target.closest('.mezcladorBloqueBotones') || target.closest('.mezcladorBloqueResizeHandle')) return;

        /* C247: Ctrl+click togglea selección sin iniciar drag */
        if (e.ctrlKey || e.metaKey) {
            toggleSeleccionBloque(bloque.id, true);
            return;
        }
        /* C249: Shift+drag duplica el bloque y arrastra la copia */
        if (e.shiftKey) {
            duplicarBloque(bloque.id);
        }
        onIniciarDrag(bloque.id, bloque.pistaId, e);
    }, [resizing, modoCortarActivo, toggleSeleccionBloque, bloque.id, duplicarBloque, bloque.pistaId, onIniciarDrag]);

    /* C286: Doble click abre configuración avanzada */
    const alDobleClick = useCallback((e: React.MouseEvent) => {
        if (modoCortarActivo) return;
        e.stopPropagation();
        e.preventDefault();
        setModalConfigAbierto(true);
    }, [modoCortarActivo]);

    /* Menú contextual */
    const alContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!modalConfigAbierto) setModalConfigAbierto(true);
    }, [modalConfigAbierto]);

    /* Cerrar modal config */
    const cerrarConfig = useCallback(() => setModalConfigAbierto(false), []);

    return {
        eliminarBloque,
        duplicarBloque,
        ancho,
        izquierda,
        resizing,
        modalConfigAbierto,
        cerrarConfig,
        setModalConfigAbierto,
        lineaCortePorc,
        waveformPath,
        iniciarResize,
        alMoverMouse,
        alSalirMouse,
        alClickBloque,
        alMouseDown,
        alDobleClick,
        alContextMenu,
    };
};
