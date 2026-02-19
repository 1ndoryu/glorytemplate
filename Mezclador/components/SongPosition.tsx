/*
 * SongPosition — Visualizador de posición estilo FL Studio.
 * C304: Muestra la posición actual en dos modos (click para alternar):
 * - M:S:CS (Minutos:Segundos:Centésimas)
 * - B:S:T  (Bar:Step:Tick — Compás:Pulso:Tick)
 */

import { useCallback, useState } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { segundosACompases } from '../utils/compasUtils';

type ModoDisplay = 'tiempo' | 'compas';

export const SongPosition = (): JSX.Element => {
    const [modo, setModo] = useState<ModoDisplay>('tiempo');
    const tiempoActual = useMezcladorStore(s => s.tiempoActual);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);

    const alternarModo = useCallback(() => {
        setModo(prev => prev === 'tiempo' ? 'compas' : 'tiempo');
    }, []);

    /* M:S:CS — Minutos:Segundos:Centésimas */
    const formatoTiempo = (): string => {
        const totalSegundos = Math.max(0, tiempoActual);
        const minutos = Math.floor(totalSegundos / 60);
        const segundos = Math.floor(totalSegundos % 60);
        const centesimas = Math.floor((totalSegundos % 1) * 100);

        const m = String(minutos).padStart(2, '0');
        const s = String(segundos).padStart(2, '0');
        const cs = String(centesimas).padStart(2, '0');
        return `${m}:${s}:${cs}`;
    };

    /* B:S:T — Bar:Step:Tick (1-indexed como FL Studio) */
    const formatoCompas = (): string => {
        const compases: number = segundosACompases(tiempoActual, bpmProyecto, compasProyecto);
        const bar: number = Math.floor(compases) + 1;
        const pulsosEnCompas: number = Number(compasProyecto.numerador);
        const restante: number = compases - Math.floor(compases);
        const pulsoExacto: number = restante * pulsosEnCompas;
        const step = Math.floor(pulsoExacto) + 1;
        const tick = Math.floor((pulsoExacto % 1) * 100);

        const b = String(bar).padStart(3, '0');
        const s = String(step).padStart(2, '0');
        const t = String(tick).padStart(2, '0');
        return `${b}:${s}:${t}`;
    };

    const etiqueta = modo === 'tiempo' ? 'M:S:CS' : 'B:S:T';
    const valor = modo === 'tiempo' ? formatoTiempo() : formatoCompas();

    return (
        <div
            className="songPosition"
            onClick={alternarModo}
            title={`Click para cambiar a ${modo === 'tiempo' ? 'B:S:T' : 'M:S:CS'}`}
        >
            <span className="songPositionValor">{valor}</span>
            <span className="songPositionEtiqueta">{etiqueta}</span>
        </div>
    );
};
