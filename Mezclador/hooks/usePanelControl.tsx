/*
 * usePanelControl — Lógica del panel de control velocity/pan/pitch.
 * Store access, ResizeObserver, handleChange, barras renderizadas.
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { usePianoRollStore } from '../stores/pianoRollStore';
import { useNotasStore } from '../stores/accionesNotas';
import { PALETA_NOTAS } from '../types/pianoRoll';
import { ticksAPx } from '../utils/pianoRollUtils';
import { BarraVelocity } from '../components/PianoRoll/BarraVelocity';

export const usePanelControl = () => {
    const patronId = usePianoRollStore(s => s.patronId);
    const canalId = usePianoRollStore(s => s.canalId);
    const controlActivo = usePianoRollStore(s => s.controlActivo);
    const controlAbierto = usePianoRollStore(s => s.controlAbierto);
    const setControlActivo = usePianoRollStore(s => s.setControlActivo);
    const toggleControlAbierto = usePianoRollStore(s => s.toggleControlAbierto);
    const vista = usePianoRollStore(s => s.vista);
    const notasSeleccionadas = usePianoRollStore(s => s.notasSeleccionadas);
    const notas = useNotasStore(s =>
        patronId && canalId ? s.obtenerNotas(patronId, canalId) : []
    );
    const setVelocityNota = useNotasStore(s => s.setVelocityNota);
    const setPanNota = useNotasStore(s => s.setPanNota);
    const setFinePitchNota = useNotasStore(s => s.setFinePitchNota);

    const cuerpoRef = useRef<HTMLDivElement>(null);
    const [alturaCuerpo, setAlturaCuerpo] = useState(vista.alturaControl);

    useEffect(() => {
        const el = cuerpoRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                setAlturaCuerpo(entry.contentRect.height);
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const handleChange = useCallback((notaId: string, nuevoValor: number) => {
        if (!patronId || !canalId) return;
        switch (controlActivo) {
            case 'velocity':
                setVelocityNota(patronId, canalId, notaId, nuevoValor);
                break;
            case 'pan':
                setPanNota(patronId, canalId, notaId, nuevoValor);
                break;
            case 'finePitch':
                /* Fine pitch: -1..1 normalizado a -100..100 cents */
                setFinePitchNota(patronId, canalId, notaId, Math.round(nuevoValor * 100));
                break;
        }
    }, [patronId, canalId, controlActivo, setVelocityNota, setPanNota, setFinePitchNota]);

    /* Barras renderizadas */
    const barras = useMemo(() => {
        const bipolar = controlActivo === 'pan' || controlActivo === 'finePitch';

        return notas.map(nota => {
            const x = ticksAPx(nota.inicio, vista.zoomX) - vista.scrollX;
            const anchoNota = ticksAPx(nota.duracion, vista.zoomX);

            /* No renderizar fuera del viewport */
            if (x + anchoNota < 0 || x > 1200) return null;

            /* Valor segun el control activo */
            let valor: number;
            switch (controlActivo) {
                case 'velocity': valor = nota.velocity; break;
                case 'pan': valor = nota.pan; break;
                case 'finePitch': valor = nota.finePitch / 100; break;
                default: valor = nota.velocity;
            }

            const color = PALETA_NOTAS[nota.color % PALETA_NOTAS.length];

            return (
                <BarraVelocity
                    key={nota.id}
                    notaId={nota.id}
                    x={x + anchoNota / 2 - 1}
                    valor={valor}
                    alturaPanel={alturaCuerpo}
                    seleccionada={notasSeleccionadas.has(nota.id)}
                    color={color}
                    bipolar={bipolar}
                    onChange={handleChange}
                />
            );
        }).filter(Boolean);
    }, [notas, vista, controlActivo, alturaCuerpo, notasSeleccionadas, handleChange]);

    return {
        controlActivo,
        controlAbierto,
        setControlActivo,
        toggleControlAbierto,
        vista,
        cuerpoRef,
        barras,
    };
};
