/*
 * useTimeline — Lógica de drag & drop y snap para la timeline del mezclador
 * C205/C206: Drag robusto con document listeners — mover horizontal y entre pistas
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { snapConResolucion } from '../utils/compasUtils';
import type { SampleResumen } from '@app/types';

interface DragState {
    bloqueId: string | null;
    pistaIdOrigen: string | null;
    compasOrigen: number;
    offsetCompas: number;
    activo: boolean;
}

const DRAG_INICIAL: DragState = {
    bloqueId: null,
    pistaIdOrigen: null,
    compasOrigen: 0,
    offsetCompas: 0,
    activo: false,
};

export const useTimeline = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState>({ ...DRAG_INICIAL });
    const [posicionDragFantasma, setPosicionDragFantasma] = useState<number | null>(null);
    const [pistaIdHover, setPistaIdHover] = useState<string | null>(null);
    /* C242: Duración del bloque arrastrado, para el ghost preview */
    const [duracionBloqueDrag, setDuracionBloqueDrag] = useState<number>(0);

    /* Refs para acceder al estado actual dentro de document listeners */
    const dragRef = useRef(dragState);
    dragRef.current = dragState;
    const fantasmaRef = useRef(posicionDragFantasma);
    fantasmaRef.current = posicionDragFantasma;
    const pistaHoverRef = useRef(pistaIdHover);
    pistaHoverRef.current = pistaIdHover;

    /* C285: Usar totalExtendido para cálculos de posición */
    const totalCompases = useMezcladorStore(s => s.obtenerTotalExtendido());
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const moverBloque = useMezcladorStore(s => s.moverBloque);
    const moverBloquesSeleccionados = useMezcladorStore(s => s.moverBloquesSeleccionados);

    /* Convertir posición X del mouse a compás */
    const xACompas = useCallback((clientX: number): number => {
        if (!timelineRef.current) return 0;
        /*
         * Medir desde .mezcladorPistaContenido para ignorar la zona de controles (80px).
         * Si no existe, usar fallback con offset manual.
         */
        const contenido = timelineRef.current.querySelector('.mezcladorPistaContenido');
        if (contenido) {
            const rect = contenido.getBoundingClientRect();
            const relX = clientX - rect.left;
            const porcentaje = Math.max(0, relX / rect.width);
            return porcentaje * totalCompases;
        }
        const rect = timelineRef.current.getBoundingClientRect();
        const relX = clientX - rect.left - 80;
        const porcentaje = Math.max(0, relX / (rect.width - 80));
        return porcentaje * totalCompases;
    }, [totalCompases]);

    /* Detectar sobre qué pista está el mouse (por posición Y) */
    const detectarPista = useCallback((clientY: number): string | null => {
        if (!timelineRef.current) return null;
        const pistasDOM = timelineRef.current.querySelectorAll('[data-pista-id]');
        for (const pistaDOM of pistasDOM) {
            const rect = pistaDOM.getBoundingClientRect();
            if (clientY >= rect.top && clientY <= rect.bottom) {
                return pistaDOM.getAttribute('data-pista-id');
            }
        }
        return null;
    }, []);

    /* Iniciar drag de un bloque existente */
    const iniciarDragBloque = useCallback((
        bloqueId: string,
        pistaId: string,
        evento: React.MouseEvent
    ) => {
        evento.preventDefault();
        evento.stopPropagation();

        /* Calcular offset: dónde hizo clic el usuario dentro del bloque */
        const compasClick = xACompas(evento.clientX);
        const bloque = useMezcladorStore.getState().pistas
            .flatMap(p => p.bloques)
            .find(b => b.id === bloqueId);
        const offsetCompas = bloque ? compasClick - bloque.compasInicio : 0;

        setDragState({
            bloqueId,
            pistaIdOrigen: pistaId,
            compasOrigen: bloque?.compasInicio ?? 0,
            offsetCompas: Math.max(0, offsetCompas),
            activo: true,
        });
        /* C242: Guardar duración del bloque para renderizar ghost */
        setDuracionBloqueDrag(bloque?.duracionCompases ?? 0);
        setPistaIdHover(pistaId);

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }, [xACompas]);

    /*
     * Document-level mousemove/mouseup para drag robusto.
     * Se registran solo cuando hay un drag activo y se limpian al soltar.
     */
    useEffect(() => {
        if (!dragState.activo) return;

        const mover = (ev: MouseEvent) => {
            const compas = xACompas(ev.clientX);
            const ajustado = compas - dragRef.current.offsetCompas;
            /* C216: Usar snap con resolución configurable del store */
            const snapped = snapConResolucion(Math.max(0, ajustado), compasProyecto, snapResolucion);
            setPosicionDragFantasma(snapped);

            const pistaId = detectarPista(ev.clientY);
            if (pistaId) setPistaIdHover(pistaId);
        };

        const soltar = () => {
            const dragging = dragRef.current;
            const fantasma = fantasmaRef.current;
            const pistaDestino = pistaHoverRef.current;

            if (dragging.activo && dragging.bloqueId && fantasma !== null) {
                const destino = pistaDestino ?? dragging.pistaIdOrigen ?? '';
                const seleccionados = useMezcladorStore.getState().bloquesSeleccionados;

                /* C247: Si hay varios bloques seleccionados, mover todos con delta relativo */
                if (seleccionados.size > 1 && seleccionados.has(dragging.bloqueId)) {
                    const deltaCompas = Math.max(0, fantasma) - dragging.compasOrigen;
                    moverBloquesSeleccionados(destino, deltaCompas);
                } else {
                    moverBloque(dragging.bloqueId, destino, Math.max(0, fantasma));
                }
            }

            setDragState({ ...DRAG_INICIAL });
            setPosicionDragFantasma(null);
            setPistaIdHover(null);
            setDuracionBloqueDrag(0);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);

        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
        };
    }, [dragState.activo, xACompas, compasProyecto, snapResolucion, moverBloque, detectarPista]);

    /* Drop externo — recibir sample desde el feed */
    const alDropExterno = useCallback((evento: React.DragEvent, pistaId?: string) => {
        evento.preventDefault();
        evento.stopPropagation();

        const data = evento.dataTransfer.getData('application/kamples-sample');
        if (!data) return;

        try {
            const parsed: unknown = JSON.parse(data);
            if (
                !parsed ||
                typeof parsed !== 'object' ||
                !('id' in parsed) ||
                !('rutaPreview' in parsed)
            ) {
                console.error('[Mezclador] Sample inválido en drag data');
                return;
            }
            useMezcladorStore.getState().agregarSample(parsed as SampleResumen, pistaId);
        } catch {
            console.error('[Mezclador] Error parseando sample del drag');
        }
    }, []);

    /* Permitir drop */
    const alDragOver = useCallback((evento: React.DragEvent) => {
        evento.preventDefault();
        evento.dataTransfer.dropEffect = 'copy';
    }, []);

    return {
        timelineRef,
        dragState,
        posicionDragFantasma,
        duracionBloqueDrag,
        pistaIdHover,
        iniciarDragBloque,
        alDropExterno,
        alDragOver,
        xACompas,
    };
};
