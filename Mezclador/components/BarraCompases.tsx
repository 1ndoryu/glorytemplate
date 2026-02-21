/*
 * BarraCompases — Regla superior con los números de compás.
 * C303: Soporta drag continuo (mousedown+mousemove) para seek en tiempo real.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { generarLabelsCompases, posicionBloquePorc } from '../utils/compasUtils';

interface BarraCompasesProps {
    onSeek: (compas: number) => void;
}

export const BarraCompases = ({ onSeek }: BarraCompasesProps): JSX.Element => {
    const totalCompases = useMezcladorStore(s => s.obtenerTotalExtendido());
    const labels = generarLabelsCompases(totalCompases);
    const barraRef = useRef<HTMLDivElement>(null);
    const arrastrando = useRef(false);

    /* Convertir posición X del mouse a compás */
    const xACompas = useCallback((clientX: number): number => {
        const rect = barraRef.current?.getBoundingClientRect();
        if (!rect) return 0;
        const relX = clientX - rect.left;
        const porcentaje = Math.max(0, Math.min(1, relX / rect.width));
        return porcentaje * totalCompases;
    }, [totalCompases]);

    /* Mousedown inicia seeking + drag */
    const alMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        arrastrando.current = true;
        onSeek(xACompas(e.clientX));
    }, [xACompas, onSeek]);

    /* Document listeners para drag continuo */
    useEffect(() => {
        const mover = (e: MouseEvent) => {
            if (!arrastrando.current) return;
            onSeek(xACompas(e.clientX));
        };

        const soltar = () => {
            arrastrando.current = false;
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
        };
    }, [xACompas, onSeek]);

    return (
        <div
            ref={barraRef}
            className="mezcladorBarraCompases"
            onMouseDown={alMouseDown}
        >
            {labels.map((label, i) => (
                <div
                    key={label}
                    className="mezcladorCompasLabel"
                    style={{ left: `${posicionBloquePorc(i, totalCompases)}%`, width: `${100 / totalCompases}%` }}
                >
                    <span className="mezcladorCompasNumero">{label}</span>
                </div>
            ))}
        </div>
    );
};
