/*
 * BarraCompases — Regla superior con los números de compás
 * Muestra la cuadrícula de compases y permite click para seek
 */

import { useMezcladorStore } from '../stores/mezcladorStore';
import { generarLabelsCompases, posicionBloquePorc } from '../utils/compasUtils';

interface BarraCompasesProps {
    onSeek: (compas: number) => void;
}

export const BarraCompases = ({ onSeek }: BarraCompasesProps): JSX.Element => {
    const totalCompases = useMezcladorStore(s => s.totalCompases);
    const labels = generarLabelsCompases(totalCompases);

    const alClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const porcentaje = relX / rect.width;
        onSeek(porcentaje * totalCompases);
    };

    return (
        <div className="mezcladorBarraCompases" onClick={alClick}>
            {labels.map((label, i) => (
                <div
                    key={i}
                    className="mezcladorCompasLabel"
                    style={{ left: `${posicionBloquePorc(i, totalCompases)}%`, width: `${100 / totalCompases}%` }}
                >
                    <span className="mezcladorCompasNumero">{label}</span>
                </div>
            ))}
        </div>
    );
};
