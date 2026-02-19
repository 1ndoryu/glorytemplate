/*
 * CabeceraPianoRoll — Toolbar del editor Piano Roll.
 * C310: Botones de herramientas, dropdown snap, toggles ghost/preview.
 */

import { memo, useCallback } from 'react';
import {
    Pencil, MousePointer2, Scissors, PaintBucket, Eraser, VolumeX,
    Ghost, Volume2,
} from 'lucide-react';
import { usePianoRollStore } from '../../stores/pianoRollStore';
import type { HerramientaPianoRoll, SnapPianoRoll } from '../../types/pianoRoll';

const HERRAMIENTAS: { id: HerramientaPianoRoll; icono: typeof Pencil; titulo: string }[] = [
    { id: 'dibujar', icono: Pencil, titulo: 'Dibujar (P)' },
    { id: 'seleccionar', icono: MousePointer2, titulo: 'Seleccionar (S)' },
    { id: 'cortar', icono: Scissors, titulo: 'Cortar (C)' },
    { id: 'pintar', icono: PaintBucket, titulo: 'Pintar (B)' },
    { id: 'borrar', icono: Eraser, titulo: 'Borrar (D)' },
    { id: 'silenciar', icono: VolumeX, titulo: 'Silenciar (T)' },
];

const OPCIONES_SNAP: { valor: SnapPianoRoll; label: string }[] = [
    { valor: 'none', label: 'Libre' },
    { valor: '1/1', label: '1/1' },
    { valor: '1/2', label: '1/2' },
    { valor: '1/4', label: '1/4' },
    { valor: '1/8', label: '1/8' },
    { valor: '1/16', label: '1/16' },
    { valor: '1/32', label: '1/32' },
    { valor: '1/3', label: '1/3 T' },
    { valor: '1/6', label: '1/6 T' },
    { valor: '1/12', label: '1/12 T' },
];

export const CabeceraPianoRoll = memo((): JSX.Element => {
    const herramienta = usePianoRollStore(s => s.herramienta);
    const snap = usePianoRollStore(s => s.snap);
    const ghostHabilitado = usePianoRollStore(s => s.ghostHabilitado);
    const previewActivo = usePianoRollStore(s => s.previewActivo);
    const setHerramienta = usePianoRollStore(s => s.setHerramienta);
    const setSnap = usePianoRollStore(s => s.setSnap);
    const toggleGhost = usePianoRollStore(s => s.toggleGhost);
    const togglePreview = usePianoRollStore(s => s.togglePreview);

    const handleSnapChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setSnap(e.target.value as SnapPianoRoll);
    }, [setSnap]);

    return (
        <div className="pianoRollCabecera">
            {/* Grupo de herramientas */}
            <div className="pianoRollGrupoHerramientas">
                {HERRAMIENTAS.map(({ id, icono: Icono, titulo }) => (
                    <button
                        key={id}
                        className={`pianoRollBotonHerramienta ${
                            herramienta === id ? 'pianoRollBotonHerramientaActiva' : ''
                        }`}
                        onClick={() => setHerramienta(id)}
                        title={titulo}
                    >
                        <Icono size={14} />
                    </button>
                ))}
            </div>

            <div className="pianoRollSeparador" />

            {/* Snap */}
            <span className="pianoRollEtiquetaSnap">Snap</span>
            <select
                className="pianoRollSelectSnap"
                value={snap}
                onChange={handleSnapChange}
            >
                {OPCIONES_SNAP.map(({ valor, label }) => (
                    <option key={valor} value={valor}>{label}</option>
                ))}
            </select>

            <div className="pianoRollSeparador" />

            {/* Toggle ghost notes */}
            <button
                className={`pianoRollToggle ${ghostHabilitado ? 'pianoRollToggleActivo' : ''}`}
                onClick={toggleGhost}
                title="Ghost Notes"
            >
                <Ghost size={13} />
                <span>Ghost</span>
            </button>

            {/* Toggle preview audio */}
            <button
                className={`pianoRollToggle ${previewActivo ? 'pianoRollToggleActivo' : ''}`}
                onClick={togglePreview}
                title="Preview Audio"
            >
                <Volume2 size={13} />
                <span>Preview</span>
            </button>
        </div>
    );
});

CabeceraPianoRoll.displayName = 'CabeceraPianoRoll';
