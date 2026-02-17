/*
 * useTimeline — Lógica de drag & drop y snap para la timeline del mezclador
 * Maneja: arrastrar bloques dentro de la timeline, reposicionar, snap a beat
 */

import { useCallback, useRef, useState } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { snapABeat } from '../utils/compasUtils';
import type { SampleResumen } from '@app/types';

interface DragState {
    bloqueId: string | null;
    pistaIdOrigen: string | null;
    offsetX: number;
    activo: boolean;
}

export const useTimeline = () => {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState>({
        bloqueId: null,
        pistaIdOrigen: null,
        offsetX: 0,
        activo: false,
    });
    const [posicionDragFantasma, setPosicionDragFantasma] = useState<number | null>(null);

    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const moverBloque = useMezcladorStore(s => s.moverBloque);

    /* Convertir posición X del mouse a compás */
    const xACompas = useCallback((clientX: number): number => {
        if (!timelineRef.current) return 0;
        const rect = timelineRef.current.getBoundingClientRect();
        const relX = clientX - rect.left;
        const porcentaje = relX / rect.width;
        return porcentaje * totalCompases;
    }, [totalCompases]);

    /* Iniciar drag de un bloque existente */
    const iniciarDragBloque = useCallback((
        bloqueId: string,
        pistaId: string,
        evento: React.MouseEvent
    ) => {
        evento.preventDefault();
        evento.stopPropagation();

        setDragState({
            bloqueId,
            pistaIdOrigen: pistaId,
            offsetX: evento.clientX,
            activo: true,
        });
    }, []);

    /* Mover durante drag */
    const alMoverDrag = useCallback((evento: React.MouseEvent) => {
        if (!dragState.activo) return;

        const compas = xACompas(evento.clientX);
        const snapped = snapABeat(compas, compasProyecto);
        setPosicionDragFantasma(snapped);
    }, [dragState.activo, xACompas, compasProyecto]);

    /* Soltar bloque */
    const alSoltarDrag = useCallback((pistaIdDestino: string) => {
        if (!dragState.activo || !dragState.bloqueId || posicionDragFantasma === null) {
            setDragState({ bloqueId: null, pistaIdOrigen: null, offsetX: 0, activo: false });
            setPosicionDragFantasma(null);
            return;
        }

        moverBloque(dragState.bloqueId, pistaIdDestino, Math.max(0, posicionDragFantasma));

        setDragState({ bloqueId: null, pistaIdOrigen: null, offsetX: 0, activo: false });
        setPosicionDragFantasma(null);
    }, [dragState, posicionDragFantasma, moverBloque]);

    /* Cancelar drag */
    const cancelarDrag = useCallback(() => {
        setDragState({ bloqueId: null, pistaIdOrigen: null, offsetX: 0, activo: false });
        setPosicionDragFantasma(null);
    }, []);

    /* Drop externo — recibir sample desde el feed */
    const alDropExterno = useCallback((evento: React.DragEvent, pistaId?: string) => {
        evento.preventDefault();
        evento.stopPropagation();

        const data = evento.dataTransfer.getData('application/kamples-sample');
        if (!data) return;

        try {
            const parsed: unknown = JSON.parse(data);
            /* Validar estructura mínima del sample antes de usarlo */
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
        iniciarDragBloque,
        alMoverDrag,
        alSoltarDrag,
        cancelarDrag,
        alDropExterno,
        alDragOver,
        xACompas,
    };
};
