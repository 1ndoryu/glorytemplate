/*
 * usePianoRoll — Hook principal de interacción del Piano Roll.
 * C310: Gestiona click/drag según herramienta activa, snap, creación/movimiento
 * de notas, resize, selección marquee y scroll/zoom.
 */

import { useCallback, useRef, useState } from 'react';
import { usePianoRollStore } from '../stores/pianoRollStore';
import { useNotasStore } from '../stores/accionesNotas';
import { SNAP_TICKS } from '../types/pianoRoll';
import { snapTick, pxATicks, pxANota } from '../utils/pianoRollUtils';

/* Tipo de operación de drag en progreso */
type DragOp =
    | { tipo: 'mover'; notaId: string; inicioOriginal: number; notaOriginal: number; origenX: number; origenY: number }
    | { tipo: 'resizeIzq'; notaId: string; inicioOriginal: number; duracionOriginal: number; origenX: number }
    | { tipo: 'resizeDer'; notaId: string; duracionOriginal: number; origenX: number }
    | { tipo: 'crearDrag'; notaId: string; origenX: number }
    | { tipo: 'marquee'; origenX: number; origenY: number }
    | null;

export interface MarqueeState {
    x: number;
    y: number;
    ancho: number;
    alto: number;
}

export function usePianoRoll() {
    const patronId = usePianoRollStore(s => s.patronId);
    const canalId = usePianoRollStore(s => s.canalId);
    const herramienta = usePianoRollStore(s => s.herramienta);
    const snap = usePianoRollStore(s => s.snap);
    const duracionDefault = usePianoRollStore(s => s.duracionDefault);
    const vista = usePianoRollStore(s => s.vista);
    const notasSeleccionadas = usePianoRollStore(s => s.notasSeleccionadas);

    const seleccionarNota = usePianoRollStore(s => s.seleccionarNota);
    const seleccionarRango = usePianoRollStore(s => s.seleccionarRango);
    const limpiarSeleccion = usePianoRollStore(s => s.limpiarSeleccion);
    const ajustarScrollX = usePianoRollStore(s => s.ajustarScrollX);
    const ajustarScrollY = usePianoRollStore(s => s.ajustarScrollY);
    const setZoomX = usePianoRollStore(s => s.setZoomX);
    const setZoomY = usePianoRollStore(s => s.setZoomY);

    const crearNota = useNotasStore(s => s.crearNota);
    const eliminarNota = useNotasStore(s => s.eliminarNota);
    const moverNota = useNotasStore(s => s.moverNota);
    const moverNotasBatch = useNotasStore(s => s.moverNotasBatch);
    const redimensionarNota = useNotasStore(s => s.redimensionarNota);
    const dividirNota = useNotasStore(s => s.dividirNota);
    const toggleMuteNota = useNotasStore(s => s.toggleMuteNota);
    const obtenerNotas = useNotasStore(s => s.obtenerNotas);

    const dragRef = useRef<DragOp>(null);
    const [marquee, setMarquee] = useState<MarqueeState | null>(null);

    /* Convertir posición de click del mouse a ticks y nota MIDI */
    const mouseATicks = useCallback((clientX: number, gridRect: DOMRect): number => {
        const px = clientX - gridRect.left + vista.scrollX;
        return pxATicks(px, vista.zoomX);
    }, [vista.scrollX, vista.zoomX]);

    const mouseANota = useCallback((clientY: number, gridRect: DOMRect): number => {
        const py = clientY - gridRect.top + vista.scrollY;
        return pxANota(py, vista.alturaNota, vista.zoomY);
    }, [vista.scrollY, vista.alturaNota, vista.zoomY]);

    /* Click en el grid (zona vacía) */
    const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!patronId || !canalId) return;
        if (e.button !== 0) return;

        const gridRect = e.currentTarget.getBoundingClientRect();
        const tickRaw = mouseATicks(e.clientX, gridRect);
        const midi = mouseANota(e.clientY, gridRect);
        const tickSnapped = snapTick(tickRaw, snap);

        switch (herramienta) {
            case 'dibujar': {
                /* Crear nota nueva */
                const dur = snap === 'none' ? duracionDefault : SNAP_TICKS[snap];
                const id = crearNota(patronId, canalId, midi, tickSnapped, dur);
                /* Iniciar drag para definir duración */
                dragRef.current = {
                    tipo: 'crearDrag',
                    notaId: id,
                    origenX: e.clientX,
                };
                break;
            }

            case 'seleccionar': {
                /* Iniciar marquee selection */
                limpiarSeleccion();
                dragRef.current = {
                    tipo: 'marquee',
                    origenX: e.clientX,
                    origenY: e.clientY,
                };
                break;
            }

            case 'pintar': {
                /* Crear nota en la posición */
                const dur = snap === 'none' ? duracionDefault : SNAP_TICKS[snap];
                crearNota(patronId, canalId, midi, tickSnapped, dur);
                break;
            }

            default:
                break;
        }
    }, [patronId, canalId, herramienta, snap, duracionDefault, mouseATicks, mouseANota, crearNota, limpiarSeleccion]);

    /* Click en una nota existente */
    const handleNotaMouseDown = useCallback((
        e: React.MouseEvent,
        notaId: string,
        zona: 'cuerpo' | 'izq' | 'der',
    ) => {
        if (!patronId || !canalId) return;
        e.preventDefault();

        const notas = obtenerNotas(patronId, canalId);
        const nota = notas.find(n => n.id === notaId);
        if (!nota) return;

        switch (herramienta) {
            case 'dibujar': {
                /* Click en nota con pencil = eliminar */
                eliminarNota(patronId, canalId, notaId);
                break;
            }

            case 'seleccionar': {
                /* Seleccionar y preparar drag */
                seleccionarNota(notaId, e.ctrlKey || e.metaKey);

                if (zona === 'cuerpo') {
                    dragRef.current = {
                        tipo: 'mover',
                        notaId,
                        inicioOriginal: nota.inicio,
                        notaOriginal: nota.nota,
                        origenX: e.clientX,
                        origenY: e.clientY,
                    };
                } else if (zona === 'izq') {
                    dragRef.current = {
                        tipo: 'resizeIzq',
                        notaId,
                        inicioOriginal: nota.inicio,
                        duracionOriginal: nota.duracion,
                        origenX: e.clientX,
                    };
                } else {
                    dragRef.current = {
                        tipo: 'resizeDer',
                        notaId,
                        duracionOriginal: nota.duracion,
                        origenX: e.clientX,
                    };
                }
                break;
            }

            case 'cortar': {
                /* Dividir nota en la posición del click */
                const gridEl = (e.currentTarget as HTMLElement).closest('.pianoRollGrid');
                if (gridEl) {
                    const gridRect = gridEl.getBoundingClientRect();
                    const tickPos = mouseATicks(e.clientX, gridRect);
                    dividirNota(patronId, canalId, notaId, Math.round(tickPos));
                }
                break;
            }

            case 'borrar': {
                eliminarNota(patronId, canalId, notaId);
                break;
            }

            case 'silenciar': {
                toggleMuteNota(patronId, canalId, notaId);
                break;
            }

            default:
                break;
        }
    }, [patronId, canalId, herramienta, obtenerNotas, eliminarNota, seleccionarNota, dividirNota, toggleMuteNota, mouseATicks]);

    /* Mouse move global (debe registrarse en document) */
    const handleMouseMove = useCallback((e: MouseEvent, gridRect: DOMRect) => {
        if (!dragRef.current || !patronId || !canalId) return;
        const op = dragRef.current;

        switch (op.tipo) {
            case 'mover': {
                const deltaPx = e.clientX - op.origenX;
                const deltaTicks = Math.round(pxATicks(deltaPx, vista.zoomX));
                const deltaPxY = e.clientY - op.origenY;
                const deltaPitch = -Math.round(deltaPxY / (vista.alturaNota * vista.zoomY));

                const ticksFinal = snapTick(op.inicioOriginal + deltaTicks, snap) - op.inicioOriginal;
                const pitchFinal = deltaPitch;

                /* Mover batch si hay seleccionadas, sino solo esta */
                const ids = notasSeleccionadas.has(op.notaId)
                    ? Array.from(notasSeleccionadas)
                    : [op.notaId];

                if (ids.length > 1) {
                    moverNotasBatch(patronId, canalId, ids, ticksFinal, pitchFinal);
                } else {
                    moverNota(patronId, canalId, op.notaId, ticksFinal, pitchFinal);
                }

                /* Actualizar origenes para delta incremental */
                dragRef.current = {
                    ...op,
                    inicioOriginal: op.inicioOriginal + ticksFinal,
                    notaOriginal: op.notaOriginal + pitchFinal,
                    origenX: e.clientX,
                    origenY: e.clientY,
                };
                break;
            }

            case 'resizeDer': {
                const deltaPx = e.clientX - op.origenX;
                const deltaTicks = Math.round(pxATicks(deltaPx, vista.zoomX));
                let nuevaDur = op.duracionOriginal + deltaTicks;
                if (snap !== 'none') {
                    nuevaDur = Math.max(SNAP_TICKS[snap], snapTick(nuevaDur, snap));
                } else {
                    nuevaDur = Math.max(1, nuevaDur);
                }
                redimensionarNota(patronId, canalId, op.notaId, nuevaDur);
                break;
            }

            case 'resizeIzq': {
                const deltaPx = e.clientX - op.origenX;
                const deltaTicks = Math.round(pxATicks(deltaPx, vista.zoomX));
                let nuevoInicio = snapTick(op.inicioOriginal + deltaTicks, snap);
                const finOriginal = op.inicioOriginal + op.duracionOriginal;
                const nuevaDur = finOriginal - nuevoInicio;
                if (nuevaDur < 1) return;
                moverNota(patronId, canalId, op.notaId, nuevoInicio - op.inicioOriginal, 0);
                redimensionarNota(patronId, canalId, op.notaId, nuevaDur);
                break;
            }

            case 'crearDrag': {
                /* Extender duración de la nota recién creada */
                const deltaPx = e.clientX - op.origenX;
                const deltaTicks = Math.round(pxATicks(Math.abs(deltaPx), vista.zoomX));
                const snapStep = snap === 'none' ? 1 : SNAP_TICKS[snap];
                const dur = Math.max(snapStep, snapTick(deltaTicks, snap));
                redimensionarNota(patronId, canalId, op.notaId, dur);
                break;
            }

            case 'marquee': {
                const x = Math.min(op.origenX, e.clientX) - gridRect.left;
                const y = Math.min(op.origenY, e.clientY) - gridRect.top;
                const w = Math.abs(e.clientX - op.origenX);
                const h = Math.abs(e.clientY - op.origenY);
                setMarquee({ x, y, ancho: w, alto: h });

                /* Detectar notas dentro del marquee */
                const tickMin = pxATicks(x + vista.scrollX, vista.zoomX);
                const tickMax = pxATicks(x + w + vista.scrollX, vista.zoomX);
                const notaMax = pxANota(y + vista.scrollY, vista.alturaNota, vista.zoomY);
                const notaMin = pxANota(y + h + vista.scrollY, vista.alturaNota, vista.zoomY);

                const notas = obtenerNotas(patronId, canalId);
                const ids = notas
                    .filter(n =>
                        n.inicio + n.duracion > tickMin &&
                        n.inicio < tickMax &&
                        n.nota >= notaMin &&
                        n.nota <= notaMax
                    )
                    .map(n => n.id);

                seleccionarRango(ids);
                break;
            }
        }
    }, [patronId, canalId, snap, vista, notasSeleccionadas, moverNota, moverNotasBatch, redimensionarNota, obtenerNotas, seleccionarRango]);

    /* Mouse up global */
    const handleMouseUp = useCallback(() => {
        dragRef.current = null;
        setMarquee(null);
    }, []);

    /* Wheel: scroll + zoom */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        if (e.ctrlKey && e.shiftKey) {
            /* Ctrl+Shift+Wheel: zoom vertical */
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomY(vista.zoomY + delta);
        } else if (e.ctrlKey) {
            /* Ctrl+Wheel: zoom horizontal */
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setZoomX(vista.zoomX + delta);
        } else if (e.shiftKey) {
            /* Shift+Wheel: scroll horizontal */
            ajustarScrollX(e.deltaY);
        } else {
            /* Wheel: scroll vertical */
            ajustarScrollY(e.deltaY);
        }
    }, [vista.zoomX, vista.zoomY, setZoomX, setZoomY, ajustarScrollX, ajustarScrollY]);

    /* Cursor CSS según herramienta */
    const cursorGrid = useCallback((): string => {
        switch (herramienta) {
            case 'dibujar': return 'crosshair';
            case 'seleccionar': return 'default';
            case 'cortar': return 'crosshair';
            case 'pintar': return 'cell';
            case 'borrar': return 'not-allowed';
            case 'silenciar': return 'pointer';
            default: return 'default';
        }
    }, [herramienta]);

    return {
        handleGridMouseDown,
        handleNotaMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        cursorGrid,
        marquee,
        dragActivo: dragRef,
    };
}
