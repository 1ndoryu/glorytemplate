/*
 * BloqueSample — Bloque visual de un sample en la timeline
 * Muestra mini waveform + título. Draggeable + resize handles (C204 stretch/pitch).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { BloqueMezclador } from '../types/mezclador';
import { anchoBloquePorc, posicionBloquePorc, snapABeat } from '../utils/compasUtils';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface BloqueSampleProps {
    bloque: BloqueMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    estaSiendoArrastrado?: boolean;
}

export const BloqueSample = ({
    bloque,
    totalCompases,
    onIniciarDrag,
    estaSiendoArrastrado,
}: BloqueSampleProps): JSX.Element => {
    const eliminarBloque = useMezcladorStore(s => s.eliminarBloque);
    const setDuracionBloque = useMezcladorStore(s => s.setDuracionBloque);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const ancho = anchoBloquePorc(bloque.duracionCompases, totalCompases);
    const izquierda = posicionBloquePorc(bloque.compasInicio, totalCompases);

    /* Estado local para resize */
    const [resizing, setResizing] = useState(false);
    const resizingRef = useRef(false);
    const datosResizeRef = useRef({ duracionInicial: 0, xInicial: 0, anchoContenedor: 0 });

    /* Iniciar resize desde el handle derecho */
    const iniciarResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        /* Encontrar el contenedor de la pista para calcular ancho */
        const contenedor = (e.target as HTMLElement).closest('.mezcladorPistaContenido');
        const anchoContenedor = contenedor ? contenedor.getBoundingClientRect().width : 400;

        datosResizeRef.current = {
            duracionInicial: bloque.duracionCompases,
            xInicial: e.clientX,
            anchoContenedor,
        };
        resizingRef.current = true;
        setResizing(true);

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, [bloque.duracionCompases]);

    /* Document listeners para resize */
    useEffect(() => {
        if (!resizing) return;

        const mover = (ev: MouseEvent) => {
            if (!resizingRef.current) return;
            const { duracionInicial, xInicial, anchoContenedor } = datosResizeRef.current;
            const deltaX = ev.clientX - xInicial;
            const deltaCompases = (deltaX / anchoContenedor) * totalCompases;
            const nuevaDuracion = snapABeat(
                Math.max(0.25, duracionInicial + deltaCompases),
                compasProyecto
            );
            setDuracionBloque(bloque.id, nuevaDuracion);
        };

        const soltar = () => {
            resizingRef.current = false;
            setResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);

        return () => {
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
        };
    }, [resizing, totalCompases, compasProyecto, bloque.id, setDuracionBloque]);

    /* Mini waveform SVG */
    const waveformPath = bloque.waveformPeaks.length > 0
        ? bloque.waveformPeaks.map((peak, i) => {
            const x = (i / bloque.waveformPeaks.length) * 100;
            const y = 50 - peak * 40;
            const yEspejo = 50 + peak * 40;
            return `M${x},${y} L${x},${yEspejo}`;
        }).join(' ')
        : '';

    return (
        <div
            className={`mezcladorBloque ${estaSiendoArrastrado ? 'mezcladorBloqueDragging' : ''} ${resizing ? 'mezcladorBloqueResizing' : ''}`}
            style={{
                left: `${izquierda}%`,
                width: `${ancho}%`,
                '--colorBloque': bloque.color,
            } as React.CSSProperties}
            onMouseDown={(e) => {
                /* No iniciar drag si estamos resizing */
                if (resizing) return;
                onIniciarDrag(bloque.id, bloque.pistaId, e);
            }}
            title={`${bloque.sample.titulo} (×${bloque.playbackRate.toFixed(2)})`}
        >
            <div className="mezcladorBloqueCabecera">
                <span className="mezcladorBloqueTitulo">
                    {bloque.sample.titulo}
                </span>
                <button
                    className="mezcladorBloqueEliminar"
                    onClick={(e) => {
                        e.stopPropagation();
                        eliminarBloque(bloque.id);
                    }}
                >
                    <X size={10} />
                </button>
            </div>
            {bloque.waveformPeaks.length > 0 && (
                <svg className="mezcladorBloqueWaveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={waveformPath} stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
                </svg>
            )}

            {/* Handle derecho para resize — C204 stretch/pitch */}
            <div
                className="mezcladorBloqueResizeHandle"
                onMouseDown={iniciarResize}
            />
        </div>
    );
};
