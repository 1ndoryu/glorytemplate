/*
 * FaderControl — Slider vertical estilo DAW para volumen.
 * Drag vertical fluido. Doble click restablece valor por defecto.
 */

import { useCallback, useRef, useState } from 'react';

interface FaderControlProps {
    valor: number;
    min: number;
    max: number;
    valorPorDefecto: number;
    onChange: (v: number) => void;
    etiqueta?: string;
    alto?: number;
    color?: string;
}

export const FaderControl = ({
    valor,
    min,
    max,
    valorPorDefecto,
    onChange,
    etiqueta,
    alto = 120,
    color = 'var(--acento, #6c63ff)',
}: FaderControlProps): JSX.Element => {
    const [arrastrando, setArrastrando] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const rango = max - min;
    const porcentaje = rango > 0 ? ((valor - min) / rango) * 100 : 0;

    /* Calcular valor desde posición Y en el track */
    const yAValor = useCallback((clientY: number): number => {
        if (!trackRef.current) return valor;
        const rect = trackRef.current.getBoundingClientRect();
        const y = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
        return min + y * rango;
    }, [min, rango, valor]);

    /* Iniciar drag */
    const iniciarDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setArrastrando(true);

        const nuevo = yAValor(e.clientY);
        onChange(Math.max(min, Math.min(max, nuevo)));

        const moverHandler = (ev: MouseEvent) => {
            const val = yAValor(ev.clientY);
            onChange(Math.max(min, Math.min(max, val)));
        };
        const soltarHandler = () => {
            setArrastrando(false);
            document.removeEventListener('mousemove', moverHandler);
            document.removeEventListener('mouseup', soltarHandler);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', moverHandler);
        document.addEventListener('mouseup', soltarHandler);
    }, [yAValor, onChange, min, max]);

    /* Doble click → restaurar */
    const alDobleClick = useCallback(() => onChange(valorPorDefecto), [valorPorDefecto, onChange]);

    return (
        <div className={`faderControl ${arrastrando ? 'faderControlArrastrando' : ''}`}>
            <div
                ref={trackRef}
                className="faderTrack"
                style={{ height: alto }}
                onMouseDown={iniciarDrag}
                onDoubleClick={alDobleClick}
            >
                {/* Track de fondo */}
                <div className="faderTrackFondo" />

                {/* Relleno activo */}
                <div
                    className="faderTrackRelleno"
                    style={{ height: `${porcentaje}%`, backgroundColor: color }}
                />

                {/* Thumb / manija */}
                <div
                    className="faderThumb"
                    style={{ bottom: `${porcentaje}%` }}
                />
            </div>

            {/* Valor numérico */}
            <span className="faderValor">
                {valor <= 0.01 ? '-inf' : `${(20 * Math.log10(valor)).toFixed(1)} dB`}
            </span>

            {etiqueta && <span className="faderEtiqueta">{etiqueta}</span>}
        </div>
    );
};
