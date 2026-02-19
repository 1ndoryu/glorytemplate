/*
 * PianoRoll — Contenedor principal del editor Piano Roll.
 * C310: Se renderiza dentro de una VentanaFlotante. Integra todos los sub-componentes:
 * CabeceraPianoRoll, TecladoPiano, ReglaTemporal, GridNotas, PanelControl.
 */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { VentanaFlotante } from '../VentanaFlotante';
import { useVentanasStore } from '../../stores/ventanasStore';
import { usePianoRollStore } from '../../stores/pianoRollStore';
import { useNotasStore } from '../../stores/accionesNotas';
import { CabeceraPianoRoll } from './CabeceraPianoRoll';
import { TecladoPiano } from './TecladoPiano';
import { ReglaTemporal } from './ReglaTemporal';
import { GridNotas } from './GridNotas';
import { PanelControl } from './PanelControl';
import { GhostNotas } from './GhostNotas';
import { MenuContextualPR } from './MenuContextualPR';
import { MinimapaPianoRoll } from './MinimapaPianoRoll';
import { previewNota, detenerPreview } from '../../services/pianoRollAudioService';
import { motorAudio } from '../../services/motorAudioService';
import type { HerramientaPianoRoll } from '../../types/pianoRoll';

/* Compases por defecto para un patrón de piano roll */
const TOTAL_COMPASES_DEFAULT = 4;

/* ID fijo de la ventana piano roll en ventanasStore */
const VENTANA_ID = 'pianoRoll';

export const PianoRoll = (): JSX.Element | null => {
    const abierto = usePianoRollStore(s => s.abierto);
    const patronId = usePianoRollStore(s => s.patronId);
    const canalId = usePianoRollStore(s => s.canalId);
    const vista = usePianoRollStore(s => s.vista);
    const setHerramienta = usePianoRollStore(s => s.setHerramienta);

    const abrirVentana = useVentanasStore(s => s.abrirVentana);
    const cerrarVentana = useVentanasStore(s => s.cerrarVentana);
    const cerrarPianoRoll = usePianoRollStore(s => s.cerrar);

    const [notaHover, setNotaHover] = useState<number | null>(null);
    /* Estado del menú contextual */
    const [menuContextual, setMenuContextual] = useState<{
        x: number;
        y: number;
        notaId: string | null;
    } | null>(null);

    /* Abrir ventana flotante cuando el piano roll se abre */
    useEffect(() => {
        if (abierto && canalId) {
            abrirVentana({
                id: VENTANA_ID,
                tipo: 'pianoRoll',
                titulo: `Piano Roll — ${canalId}`,
                posicion: { x: 100, y: 80 },
            });
        }

        /* Al desmontar o cerrar, limpiar ventana */
        return () => {
            if (!abierto) {
                cerrarVentana(VENTANA_ID);
            }
        };
    }, [abierto, canalId, abrirVentana, cerrarVentana, cerrarPianoRoll]);

    /* Atajos de teclado del piano roll */
    useEffect(() => {
        if (!abierto) return;

        const handler = (e: KeyboardEvent) => {
            /* Ignorar si está en un input */
            if ((e.target as HTMLElement).tagName === 'INPUT' ||
                (e.target as HTMLElement).tagName === 'SELECT') return;

            /* Atajos de herramienta */
            const mapa: Record<string, HerramientaPianoRoll> = {
                'p': 'dibujar', '1': 'dibujar',
                's': 'seleccionar', '2': 'seleccionar',
                'c': 'cortar', '3': 'cortar',
                'b': 'pintar', '4': 'pintar',
                'd': 'borrar', '5': 'borrar',
                't': 'silenciar', '6': 'silenciar',
            };

            const herr = mapa[e.key.toLowerCase()];
            if (herr && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setHerramienta(herr);
                return;
            }

            /* Undo/Redo */
            if (e.ctrlKey && e.key === 'z' && patronId && canalId) {
                e.preventDefault();
                useNotasStore.getState().deshacer(patronId, canalId);
                return;
            }
            if (e.ctrlKey && e.key === 'y' && patronId && canalId) {
                e.preventDefault();
                useNotasStore.getState().rehacer(patronId, canalId);
                return;
            }

            /* Seleccionar todas */
            if (e.ctrlKey && e.key === 'a' && patronId && canalId) {
                e.preventDefault();
                const notas = useNotasStore.getState().obtenerNotas(patronId, canalId);
                usePianoRollStore.getState().seleccionarTodas(notas.map(n => n.id));
                return;
            }

            /* Eliminar seleccionadas */
            if ((e.key === 'Delete' || e.key === 'Backspace') && patronId && canalId) {
                e.preventDefault();
                const sel = usePianoRollStore.getState().notasSeleccionadas;
                if (sel.size > 0) {
                    useNotasStore.getState().eliminarNotas(patronId, canalId, Array.from(sel));
                    usePianoRollStore.getState().limpiarSeleccion();
                }
                return;
            }

            /* Copiar */
            if (e.ctrlKey && e.key === 'c' && patronId && canalId) {
                e.preventDefault();
                const sel = usePianoRollStore.getState().notasSeleccionadas;
                const notas = useNotasStore.getState().obtenerNotas(patronId, canalId);
                const seleccionadas = notas.filter(n => sel.has(n.id));
                if (seleccionadas.length > 0) {
                    usePianoRollStore.getState().copiar(seleccionadas);
                }
                return;
            }

            /* Pegar */
            if (e.ctrlKey && e.key === 'v' && patronId && canalId) {
                e.preventDefault();
                const clipboard = usePianoRollStore.getState().obtenerClipboard();
                if (clipboard && clipboard.length > 0) {
                    const inicioMin = Math.min(...clipboard.map(n => n.inicio));
                    /* Pegar en la posición de scroll actual */
                    const offsetTicks = 0;
                    clipboard.forEach(nota => {
                        useNotasStore.getState().crearNota(
                            patronId, canalId,
                            nota.nota,
                            nota.inicio - inicioMin + offsetTicks,
                            nota.duracion,
                            nota.velocity,
                        );
                    });
                }
                return;
            }

            /* Transponer: flechas arriba/abajo */
            if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && patronId && canalId) {
                const sel = usePianoRollStore.getState().notasSeleccionadas;
                if (sel.size === 0) return;
                e.preventDefault();
                const semitonos = e.shiftKey ? 12 : 1;
                const dir = e.key === 'ArrowUp' ? semitonos : -semitonos;
                useNotasStore.getState().transponerNotas(
                    patronId, canalId, Array.from(sel), dir,
                );
                return;
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [abierto, patronId, canalId, setHerramienta]);

    /* Callbacks para teclado piano */
    const handleClickTecla = useCallback((midi: number) => {
        /* Preview: reproduce un fragmento del sample al pitch del click */
        const esPreview = usePianoRollStore.getState().previewActivo;
        if (esPreview && canalId) {
            const buffer = motorAudio.obtenerBuffer(canalId);
            if (buffer) {
                previewNota(midi, 60, buffer);
            }
        }
        setNotaHover(midi);
    }, [canalId]);

    const handleHoverTecla = useCallback((midi: number | null) => {
        setNotaHover(midi);
    }, []);

    /* Menú contextual (click derecho) */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const notaEl = target.closest('[data-nota-id]');
        const notaId = notaEl
            ? notaEl.getAttribute('data-nota-id')
            : null;
        setMenuContextual({ x: e.clientX, y: e.clientY, notaId });
    }, []);

    const cerrarMenu = useCallback(() => {
        setMenuContextual(null);
    }, []);

    /* Limpiar preview al cerrar */
    useEffect(() => {
        if (!abierto) {
            detenerPreview();
        }
    }, [abierto]);

    if (!abierto) return null;

    const contenido = (
        <VentanaFlotante
            id={VENTANA_ID}
            titulo={`Piano Roll — ${canalId ?? ''}`}
            ancho={900}
        >
            <div className="pianoRollContenedor" onContextMenu={handleContextMenu}>
                {/* Toolbar */}
                <CabeceraPianoRoll />

                {/* Area principal: teclado + (regla + grid) */}
                <div className="pianoRollAreaPrincipal">
                    {/* Teclado vertical */}
                    <TecladoPiano
                        scrollY={vista.scrollY}
                        zoomY={vista.zoomY}
                        alturaNota={vista.alturaNota}
                        anchoPiano={vista.anchoPiano}
                        alturaVisible={400}
                        onClickTecla={handleClickTecla}
                        onHoverTecla={handleHoverTecla}
                        notaHover={notaHover}
                    />

                    {/* Zona grid: regla + grid de notas */}
                    <div className="pianoRollZonaGrid">
                        <ReglaTemporal
                            scrollX={vista.scrollX}
                            zoomX={vista.zoomX}
                            anchoVisible={800}
                            totalCompases={TOTAL_COMPASES_DEFAULT}
                        />

                        <GridNotas
                            totalCompases={TOTAL_COMPASES_DEFAULT}
                            notaHover={notaHover}
                        />
                    </div>
                </div>

                {/* Minimapa: vista reducida de todas las notas */}
                <MinimapaPianoRoll totalCompases={TOTAL_COMPASES_DEFAULT} />

                {/* Panel de control inferior (velocity, pan, pitch) */}
                <PanelControl />

                {/* Ghost notes de otros canales */}
                <GhostNotas totalCompases={TOTAL_COMPASES_DEFAULT} />

                {/* Menú contextual */}
                {menuContextual && (
                    <MenuContextualPR
                        x={menuContextual.x}
                        y={menuContextual.y}
                        notaId={menuContextual.notaId}
                        onCerrar={cerrarMenu}
                    />
                )}
            </div>
        </VentanaFlotante>
    );

    /* Usar portal para evitar bubble de eventos al mezclador */
    return createPortal(contenido, document.body);
};
