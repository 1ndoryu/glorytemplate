/*
 * useMenuContextualPR — Lógica del menú contextual del Piano Roll.
 * Acciones: copiar, cortar, pegar, eliminar, seleccionar todo, color, velocity.
 * Keyboard: Escape cierra. Click fuera cierra.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
    Copy, Scissors, ClipboardPaste, Trash2, MousePointer2,
} from 'lucide-react';
import { usePianoRollStore } from '../stores/pianoRollStore';
import { useNotasStore } from '../stores/accionesNotas';

export interface OpcionMenu {
    label: string;
    icono?: typeof Copy;
    onClick: () => void;
    separadorDespues?: boolean;
}

interface UseMenuContextualPRParams {
    x: number;
    y: number;
    notaId: string | null;
    onCerrar: () => void;
}

export const useMenuContextualPR = ({
    x, y, notaId, onCerrar,
}: UseMenuContextualPRParams) => {
    const menuRef = useRef<HTMLDivElement>(null);

    const patronId = usePianoRollStore(s => s.patronId);
    const canalId = usePianoRollStore(s => s.canalId);
    const notasSeleccionadas = usePianoRollStore(s => s.notasSeleccionadas);
    const copiar = usePianoRollStore(s => s.copiar);
    const cortar = usePianoRollStore(s => s.cortar);
    const limpiarSeleccion = usePianoRollStore(s => s.limpiarSeleccion);
    const seleccionarTodas = usePianoRollStore(s => s.seleccionarTodas);
    const seleccionarNota = usePianoRollStore(s => s.seleccionarNota);

    /* Si se hizo click derecho en una nota, asegurar que esté seleccionada */
    useEffect(() => {
        if (notaId && !notasSeleccionadas.has(notaId)) {
            seleccionarNota(notaId, false);
        }
    }, [notaId, notasSeleccionadas, seleccionarNota]);

    /* Cerrar al hacer click fuera o al presionar Escape */
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onCerrar();
            }
        };
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onCerrar]);

    /* Acciones */
    const handleCopiar = useCallback(() => {
        if (!patronId || !canalId) return;
        const notas = useNotasStore.getState().obtenerNotas(patronId, canalId);
        const seleccion = usePianoRollStore.getState().notasSeleccionadas;
        const seleccionadas = notas.filter(n => seleccion.has(n.id));
        if (seleccionadas.length > 0) copiar(seleccionadas);
        onCerrar();
    }, [patronId, canalId, copiar, onCerrar]);

    const handleCortar = useCallback(() => {
        if (!patronId || !canalId) return;
        const notas = useNotasStore.getState().obtenerNotas(patronId, canalId);
        const seleccion = usePianoRollStore.getState().notasSeleccionadas;
        const seleccionadas = notas.filter(n => seleccion.has(n.id));
        if (seleccionadas.length > 0) {
            cortar(seleccionadas);
            useNotasStore.getState().eliminarNotas(
                patronId, canalId, seleccionadas.map(n => n.id),
            );
            limpiarSeleccion();
        }
        onCerrar();
    }, [patronId, canalId, cortar, limpiarSeleccion, onCerrar]);

    const handlePegar = useCallback(() => {
        if (!patronId || !canalId) return;
        const clipboard = usePianoRollStore.getState().obtenerClipboard();
        if (clipboard && clipboard.length > 0) {
            const inicioMin = Math.min(...clipboard.map(n => n.inicio));
            for (const nota of clipboard) {
                useNotasStore.getState().crearNota(
                    patronId, canalId,
                    nota.nota,
                    nota.inicio - inicioMin,
                    nota.duracion,
                    nota.velocity,
                );
            }
        }
        onCerrar();
    }, [patronId, canalId, onCerrar]);

    const handleEliminar = useCallback(() => {
        if (!patronId || !canalId) return;
        const sel = usePianoRollStore.getState().notasSeleccionadas;
        if (sel.size > 0) {
            useNotasStore.getState().eliminarNotas(patronId, canalId, Array.from(sel));
            limpiarSeleccion();
        }
        onCerrar();
    }, [patronId, canalId, limpiarSeleccion, onCerrar]);

    const handleSeleccionarTodo = useCallback(() => {
        if (!patronId || !canalId) return;
        const notas = useNotasStore.getState().obtenerNotas(patronId, canalId);
        seleccionarTodas(notas.map(n => n.id));
        onCerrar();
    }, [patronId, canalId, seleccionarTodas, onCerrar]);

    const handleColor = useCallback((colorIdx: number) => {
        if (!patronId || !canalId) return;
        const sel = usePianoRollStore.getState().notasSeleccionadas;
        if (sel.size > 0) {
            useNotasStore.getState().setColorBatch(
                patronId, canalId, Array.from(sel), colorIdx,
            );
        }
        onCerrar();
    }, [patronId, canalId, onCerrar]);

    const handleVelocity = useCallback((velocity: number) => {
        if (!patronId || !canalId) return;
        const sel = usePianoRollStore.getState().notasSeleccionadas;
        if (sel.size > 0) {
            useNotasStore.getState().setVelocityBatch(
                patronId, canalId, Array.from(sel), velocity,
            );
        }
        onCerrar();
    }, [patronId, canalId, onCerrar]);

    /* Construir opciones del menú */
    const haySeleccion = notasSeleccionadas.size > 0 || notaId != null;
    const hayClipboard = usePianoRollStore.getState().obtenerClipboard() != null;

    const opciones: OpcionMenu[] = [];

    if (haySeleccion) {
        opciones.push(
            { label: 'Copiar', icono: Copy, onClick: handleCopiar },
            { label: 'Cortar', icono: Scissors, onClick: handleCortar, separadorDespues: true },
        );
    }

    if (hayClipboard) {
        opciones.push({ label: 'Pegar', icono: ClipboardPaste, onClick: handlePegar });
    }

    if (haySeleccion) {
        opciones.push(
            { label: 'Eliminar', icono: Trash2, onClick: handleEliminar, separadorDespues: true },
        );
    }

    opciones.push(
        { label: 'Seleccionar todo', icono: MousePointer2, onClick: handleSeleccionarTodo, separadorDespues: true },
    );

    /* Posición clamped al viewport */
    const menuAncho = 180;
    const menuAlto = 320;
    const posX = Math.min(x, window.innerWidth - menuAncho - 10);
    const posY = Math.min(y, window.innerHeight - menuAlto - 10);

    return {
        menuRef,
        opciones,
        haySeleccion,
        posX,
        posY,
        handleColor,
        handleVelocity,
    };
};
