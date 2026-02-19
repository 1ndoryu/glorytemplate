/*
 * BarraVelocity — Barra vertical editable para velocity/pan/pitch en el panel control.
 * C310: Se arrastra verticalmente para cambiar el valor de una nota.
 */

import { memo, useCallback, useRef } from 'react';

interface BarraVelocityProps {
    notaId: string;
    x: number;
    valor: number;
    alturaPanel: number;
    seleccionada: boolean;
    color: string;
    bipolar?: boolean;
    onChange: (notaId: string, nuevoValor: number) => void;
}

export const BarraVelocity = memo(({
    notaId,
    x,
    valor,
    alturaPanel,
    seleccionada,
    color,
    bipolar = false,
    onChange,
}: BarraVelocityProps): JSX.Element => {
    const dragRef = useRef({ yInicial: 0, valorInicial: 0 });

    /* Altura de la barra: proporcional al valor */
    const altBarra = bipolar
        ? Math.abs(valor) * (alturaPanel / 2)
        : valor * alturaPanel;

    const posY = bipolar
        ? (valor >= 0 ? alturaPanel / 2 - altBarra : alturaPanel / 2)
        : alturaPanel - altBarra;

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        dragRef.current = { yInicial: e.clientY, valorInicial: valor };

        const moveHandler = (ev: MouseEvent) => {
            const deltaPx = dragRef.current.yInicial - ev.clientY;
            const rango = bipolar ? alturaPanel / 2 : alturaPanel;
            const deltaValor = deltaPx / rango;
            const nuevoValor = bipolar
                ? Math.max(-1, Math.min(1, dragRef.current.valorInicial + deltaValor))
                : Math.max(0, Math.min(1, dragRef.current.valorInicial + deltaValor));
            onChange(notaId, nuevoValor);
        };

        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    }, [valor, alturaPanel, bipolar, notaId, onChange]);

    const clases = [
        'pianoRollBarraControl',
        seleccionada ? 'pianoRollBarraControlSeleccionada' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={clases}
            style={{
                left: x,
                top: posY,
                height: Math.max(2, altBarra),
                background: color,
            }}
            onMouseDown={handleMouseDown}
            data-nota-id={notaId}
        />
    );
});

BarraVelocity.displayName = 'BarraVelocity';
