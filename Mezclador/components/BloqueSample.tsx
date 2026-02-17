/*
 * BloqueSample — Bloque visual de un sample en la timeline
 * Muestra mini waveform + titulo. Draggeable + resize handles (C204 stretch/pitch).
 * C215: Botones de 3 puntos (config), duplicar y eliminar en cabecera.
 * C214: Click derecho o herramienta de corte para dividir el bloque.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, MoreHorizontal, Copy } from 'lucide-react';
import type { BloqueMezclador } from '../types/mezclador';
import { anchoBloquePorc, posicionBloquePorc, snapABeat, snapConResolucion } from '../utils/compasUtils';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { ModalConfigBloque } from './ModalConfigBloque';

interface BloqueSampleProps {
    bloque: BloqueMezclador;
    totalCompases: number;
    onIniciarDrag: (bloqueId: string, pistaId: string, e: React.MouseEvent) => void;
    estaSiendoArrastrado?: boolean;
    modoCortarActivo?: boolean;
    onCortar?: (bloqueId: string, compas: number) => void;
}

export const BloqueSample = ({
    bloque,
    totalCompases,
    onIniciarDrag,
    estaSiendoArrastrado,
    modoCortarActivo,
    onCortar,
}: BloqueSampleProps): JSX.Element => {
    const eliminarBloque = useMezcladorStore(s => s.eliminarBloque);
    const duplicarBloque = useMezcladorStore(s => s.duplicarBloque);
    const setDuracionBloque = useMezcladorStore(s => s.setDuracionBloque);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const guardarSnapshot = useMezcladorStore(s => s._guardarSnapshot);
    const snapResolucion = useMezcladorStore(s => s.snapResolucion);
    const ancho = anchoBloquePorc(bloque.duracionCompases, totalCompases);
    const izquierda = posicionBloquePorc(bloque.compasInicio, totalCompases);

    /* Estado local para resize, modal config y línea preview de corte */
    const [resizing, setResizing] = useState(false);
    const [modalConfigAbierto, setModalConfigAbierto] = useState(false);
    const [lineaCortePorc, setLineaCortePorc] = useState<number | null>(null);
    const resizingRef = useRef(false);
    const datosResizeRef = useRef({ duracionInicial: 0, xInicial: 0, anchoContenedor: 0 });

    /* Iniciar resize desde el handle derecho */
    const iniciarResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        /* C224: Guardar snapshot antes del resize para undo */
        guardarSnapshot();

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
    }, [bloque.duracionCompases, guardarSnapshot]);

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

    /* C232: Preview de línea de corte cuando el modo cortar está activo */
    const alMoverMouse = useCallback((e: React.MouseEvent) => {
        if (!modoCortarActivo) {
            if (lineaCortePorc !== null) setLineaCortePorc(null);
            return;
        }
        const bloqueEl = e.currentTarget as HTMLElement;
        const rect = bloqueEl.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const porcDentroBloque = relX / rect.width;

        /* Convertir a compás absoluto, snap, y volver a porcentaje del bloque */
        const compasAbsoluto = bloque.compasInicio + porcDentroBloque * bloque.duracionCompases;
        const compasSnapped = snapConResolucion(compasAbsoluto, compasProyecto, snapResolucion);
        const porcSnapped = (compasSnapped - bloque.compasInicio) / bloque.duracionCompases;
        const porcClamped = Math.max(0.02, Math.min(0.98, porcSnapped));
        setLineaCortePorc(porcClamped * 100);
    }, [modoCortarActivo, bloque.compasInicio, bloque.duracionCompases, compasProyecto, snapResolucion, lineaCortePorc]);

    const alSalirMouse = useCallback(() => {
        if (lineaCortePorc !== null) setLineaCortePorc(null);
    }, [lineaCortePorc]);

    /* C214: Manejar click para cortar si el modo cortar está activo */
    const alClickBloque = useCallback((e: React.MouseEvent) => {
        if (!modoCortarActivo || !onCortar) return;
        e.stopPropagation();
        e.preventDefault();

        const contenedor = (e.target as HTMLElement).closest('.mezcladorPistaContenido');
        if (!contenedor) return;
        const rect = contenedor.getBoundingClientRect();
        const relX = e.clientX - rect.left;
        const porcentaje = relX / rect.width;
        const compasClick = snapConResolucion(porcentaje * totalCompases, compasProyecto, snapResolucion);
        onCortar(bloque.id, compasClick);
    }, [modoCortarActivo, onCortar, totalCompases, compasProyecto, bloque.id, snapResolucion]);

    return (
        <div
            className={`mezcladorBloque ${estaSiendoArrastrado ? 'mezcladorBloqueDragging' : ''} ${resizing ? 'mezcladorBloqueResizing' : ''} ${modoCortarActivo ? 'mezcladorBloqueCortando' : ''}`}
            style={{
                left: `${izquierda}%`,
                width: `${ancho}%`,
                '--colorBloque': bloque.color,
            } as React.CSSProperties}
            onMouseDown={(e) => {
                if (resizing || modoCortarActivo) return;
                /* C226: No iniciar drag si el click es sobre un botón de acción */
                const target = e.target as HTMLElement;
                if (target.closest('.mezcladorBloqueBotones') || target.closest('.mezcladorBloqueResizeHandle')) return;
                onIniciarDrag(bloque.id, bloque.pistaId, e);
            }}
            onClick={alClickBloque}
            onMouseMove={alMoverMouse}
            onMouseLeave={alSalirMouse}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                /* C225: Solo abrir si no está ya abierto */
                if (!modalConfigAbierto) setModalConfigAbierto(true);
            }}
            title={`${bloque.sample.titulo} (x${bloque.playbackRate.toFixed(2)}${bloque.invertido ? ' REV' : ''})`}
        >
            <div className="mezcladorBloqueCabecera">
                <span className="mezcladorBloqueTitulo">
                    {bloque.sample.titulo}
                </span>
                <div className="mezcladorBloqueBotones">
                    {/* C215: Botón de duplicar */}
                    <button
                        className="mezcladorBloqueBoton"
                        onClick={(e) => {
                            e.stopPropagation();
                            duplicarBloque(bloque.id);
                        }}
                        title="Duplicar bloque"
                    >
                        <Copy size={11} />
                    </button>
                    {/* C215: Botón de 3 puntos — abre modal config */}
                    <button
                        className="mezcladorBloqueBoton"
                        onClick={(e) => {
                            e.stopPropagation();
                            setModalConfigAbierto(true);
                        }}
                        title="Configuración de audio"
                    >
                        <MoreHorizontal size={12} />
                    </button>
                    {/* Botón eliminar */}
                    <button
                        className="mezcladorBloqueBoton mezcladorBloqueEliminar"
                        onClick={(e) => {
                            e.stopPropagation();
                            eliminarBloque(bloque.id);
                        }}
                        title="Eliminar"
                    >
                        <X size={11} />
                    </button>
                </div>
            </div>

            {/* Indicadores visuales de config activa */}
            {(bloque.invertido || bloque.fadeIn > 0 || bloque.fadeOut > 0) && (
                <div className="mezcladorBloqueIndicadores">
                    {bloque.invertido && <span className="mezcladorBloqueTag">REV</span>}
                    {bloque.fadeIn > 0 && <span className="mezcladorBloqueTag">IN</span>}
                    {bloque.fadeOut > 0 && <span className="mezcladorBloqueTag">OUT</span>}
                </div>
            )}

            {bloque.waveformPeaks.length > 0 && (
                <svg className="mezcladorBloqueWaveform" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={waveformPath} stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.7" />
                </svg>
            )}

            {/* C232: Línea preview de corte */}
            {modoCortarActivo && lineaCortePorc !== null && (
                <div
                    className="mezcladorBloqueLineaCorte"
                    style={{ left: `${lineaCortePorc}%` }}
                />
            )}

            {/* Handle derecho para resize — C204 stretch/pitch */}
            <div
                className="mezcladorBloqueResizeHandle"
                onMouseDown={iniciarResize}
            />

            {/* C215: Modal de configuración avanzada */}
            {modalConfigAbierto && (
                <ModalConfigBloque
                    bloque={bloque}
                    onCerrar={() => setModalConfigAbierto(false)}
                />
            )}
        </div>
    );
};
