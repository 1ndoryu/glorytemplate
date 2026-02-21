/*
 * useGhostNotas — Lógica de notas fantasma en piano roll.
 * Filtra notas de otros canales del mismo patrón para referencia visual.
 */

import { useMemo } from 'react';
import { usePianoRollStore } from '../stores/pianoRollStore';
import { useNotasStore } from '../stores/accionesNotas';
import { ticksAPx, notaAPx, alturaTotal, anchoTotalCompases } from '../utils/pianoRollUtils';

interface UseGhostNotasParams {
    totalCompases: number;
    numerador: number;
}

export const useGhostNotas = ({
    totalCompases,
    numerador,
}: UseGhostNotasParams) => {
    const ghostHabilitado = usePianoRollStore(s => s.ghostHabilitado);
    const patronId = usePianoRollStore(s => s.patronId);
    const canalIdActivo = usePianoRollStore(s => s.canalId);
    const vista = usePianoRollStore(s => s.vista);
    const notasPorCanal = useNotasStore(s => s.notasPorCanal);

    const ghostElements = useMemo(() => {
        if (!ghostHabilitado || !patronId || !canalIdActivo) return [];

        const altoPorNota = vista.alturaNota * vista.zoomY;
        const resultado: JSX.Element[] = [];
        const prefix = `${patronId}:`;

        /* Iterar por todos los canales del mismo patrón, excepto el activo */
        notasPorCanal.forEach((notas, key) => {
            if (!key.startsWith(prefix)) return;
            const canalId = key.slice(prefix.length);
            if (canalId === canalIdActivo) return;

            for (const nota of notas) {
                if (nota.silenciada) continue;

                const x = ticksAPx(nota.inicio, vista.zoomX) - vista.scrollX;
                const y = notaAPx(nota.nota, vista.alturaNota, vista.zoomY) - vista.scrollY;
                const ancho = ticksAPx(nota.duracion, vista.zoomX);

                /* Culling: no renderizar fuera del viewport */
                if (x + ancho < -5 || x > 1200) continue;
                if (y + altoPorNota < -5 || y > 600) continue;

                resultado.push(
                    <div
                        key={`ghost-${key}-${nota.id}`}
                        className="pianoRollGhostNota"
                        style={{
                            left: x,
                            top: y,
                            width: Math.max(2, ancho),
                            height: altoPorNota - 1,
                        }}
                    />
                );
            }
        });

        return resultado;
    }, [ghostHabilitado, patronId, canalIdActivo, vista, notasPorCanal]);

    const altTotal = alturaTotal(vista.alturaNota, vista.zoomY);
    const anchoTotal = anchoTotalCompases(totalCompases + 2, numerador, vista.zoomX);

    return {
        ghostHabilitado,
        ghostElements,
        altTotal,
        anchoTotal,
    };
};
