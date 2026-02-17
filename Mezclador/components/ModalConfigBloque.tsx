/*
 * ModalConfigBloque — Modal de configuración avanzada de un bloque de audio.
 * C215: pitch, reverse, normalización, fade in/out, recorte inicio/fin.
 * Se abre desde el botón de 3 puntos en BloqueSample.
 */

import { useState, useCallback, useEffect } from 'react';
import { X, RotateCcw, RefreshCw } from 'lucide-react';
import type { BloqueMezclador, ConfigBloque } from '../types/mezclador';
import { useMezcladorStore } from '../stores/mezcladorStore';

interface ModalConfigBloqueProps {
    bloque: BloqueMezclador;
    onCerrar: () => void;
}

export const ModalConfigBloque = ({
    bloque,
    onCerrar,
}: ModalConfigBloqueProps): JSX.Element => {
    const actualizarConfigBloque = useMezcladorStore(s => s.actualizarConfigBloque);
    const setDuracionBloque = useMezcladorStore(s => s.setDuracionBloque);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);

    /* Estado local para edición — se aplica inmediatamente */
    const [invertido, setInvertido] = useState(bloque.invertido);
    const [normalizado, setNormalizado] = useState(bloque.normalizado);
    const [fadeIn, setFadeIn] = useState(bloque.fadeIn);
    const [fadeOut, setFadeOut] = useState(bloque.fadeOut);
    const [volumen, setVolumen] = useState(bloque.volumen);
    const [playbackRate, setPlaybackRate] = useState(bloque.playbackRate);

    /* Duración total del buffer en segundos */
    const duracionBuffer = bloque.audioBuffer?.duration ?? 0;
    const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
    const duracionWall = bloque.duracionCompases * durCompas;

    /* Aplicar cambios en tiempo real */
    const aplicar = useCallback((config: ConfigBloque) => {
        actualizarConfigBloque(bloque.id, config);
    }, [bloque.id, actualizarConfigBloque]);

    /* Toggle reverse */
    const toggleInvertido = () => {
        const nuevo = !invertido;
        setInvertido(nuevo);
        aplicar({ invertido: nuevo });
    };

    /* Toggle normalizar */
    const toggleNormalizado = () => {
        const nuevo = !normalizado;
        setNormalizado(nuevo);
        aplicar({ normalizado: nuevo });
    };

    /* Cambiar fade in */
    const alCambiarFadeIn = (valor: number) => {
        const clamped = Math.max(0, Math.min(duracionWall / 2, valor));
        setFadeIn(clamped);
        aplicar({ fadeIn: clamped });
    };

    /* Cambiar fade out */
    const alCambiarFadeOut = (valor: number) => {
        const clamped = Math.max(0, Math.min(duracionWall / 2, valor));
        setFadeOut(clamped);
        aplicar({ fadeOut: clamped });
    };

    /* Cambiar volumen */
    const alCambiarVolumen = (valor: number) => {
        const clamped = Math.max(0, Math.min(2, valor));
        setVolumen(clamped);
        aplicar({ volumen: clamped });
    };

    /* Cambiar playbackRate (pitch/speed) */
    const alCambiarRate = (valor: number) => {
        const clamped = Math.max(0.25, Math.min(4, valor));
        setPlaybackRate(clamped);
        /* Recalcular duración en compases */
        const nuevaDuracion = duracionBuffer / (clamped * durCompas);
        setDuracionBloque(bloque.id, Math.max(0.25, nuevaDuracion));
    };

    /*
     * C239: Restablecer todas las propiedades del bloque a valores por defecto.
     * playbackRate vuelve al ratio original (BPM sample / BPM proyecto).
     */
    const restablecer = () => {
        const rateOriginal = bloque.sample.bpm
            ? bloque.sample.bpm / bpmProyecto
            : 1;
        const rateClamped = Math.max(0.25, Math.min(4, rateOriginal));

        setVolumen(1);
        setPlaybackRate(rateClamped);
        setFadeIn(0);
        setFadeOut(0);
        setInvertido(false);
        setNormalizado(false);

        aplicar({
            volumen: 1,
            playbackRate: rateClamped,
            fadeIn: 0,
            fadeOut: 0,
            invertido: false,
            normalizado: false,
        });

        /* Recalcular duración con rate original */
        const nuevaDuracion = duracionBuffer / (rateClamped * durCompas);
        setDuracionBloque(bloque.id, Math.max(0.25, nuevaDuracion));
    };

    /* Cerrar con Escape */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCerrar]);

    /* Prevenir que clicks dentro del modal propaguen al bloque */
    const detenerPropagacion = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="modalConfigOverlay"
            onClick={onCerrar}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onMouseDown={detenerPropagacion}
        >
            <div className="modalConfigBloque" onClick={detenerPropagacion} onMouseDown={detenerPropagacion}>
                {/* Cabecera */}
                <div className="modalConfigCabecera">
                    <span className="modalConfigTitulo">
                        {bloque.sample.titulo}
                    </span>
                    <button className="modalConfigCerrar" onClick={onCerrar}>
                        <X size={14} />
                    </button>
                </div>

                {/* Info del bloque */}
                <div className="modalConfigInfo">
                    <span>{duracionBuffer.toFixed(2)}s</span>
                    <span>{bloque.sample.bpm ?? '?'} BPM</span>
                    <span>x{playbackRate.toFixed(2)}</span>
                </div>

                {/* Controles */}
                <div className="modalConfigControles">
                    {/* Volumen */}
                    <div className="modalConfigFila">
                        <label className="modalConfigLabel">Volumen</label>
                        <input
                            type="range"
                            min={0}
                            max={2}
                            step={0.01}
                            value={volumen}
                            onChange={(e) => alCambiarVolumen(parseFloat(e.target.value))}
                            className="modalConfigSlider"
                        />
                        <span className="modalConfigValor">{Math.round(volumen * 100)}%</span>
                    </div>

                    {/* Pitch / Speed */}
                    <div className="modalConfigFila">
                        <label className="modalConfigLabel">Velocidad</label>
                        <input
                            type="range"
                            min={0.25}
                            max={4}
                            step={0.05}
                            value={playbackRate}
                            onChange={(e) => alCambiarRate(parseFloat(e.target.value))}
                            className="modalConfigSlider"
                        />
                        <span className="modalConfigValor">x{playbackRate.toFixed(2)}</span>
                    </div>

                    {/* Fade In */}
                    <div className="modalConfigFila">
                        <label className="modalConfigLabel">Fade In</label>
                        <input
                            type="range"
                            min={0}
                            max={Math.max(0.1, duracionWall / 2)}
                            step={0.01}
                            value={fadeIn}
                            onChange={(e) => alCambiarFadeIn(parseFloat(e.target.value))}
                            className="modalConfigSlider"
                        />
                        <span className="modalConfigValor">{fadeIn.toFixed(2)}s</span>
                    </div>

                    {/* Fade Out */}
                    <div className="modalConfigFila">
                        <label className="modalConfigLabel">Fade Out</label>
                        <input
                            type="range"
                            min={0}
                            max={Math.max(0.1, duracionWall / 2)}
                            step={0.01}
                            value={fadeOut}
                            onChange={(e) => alCambiarFadeOut(parseFloat(e.target.value))}
                            className="modalConfigSlider"
                        />
                        <span className="modalConfigValor">{fadeOut.toFixed(2)}s</span>
                    </div>

                    {/* Toggles: Reverse + Normalizar */}
                    <div className="modalConfigToggles">
                        <button
                            className={`modalConfigToggle ${invertido ? 'activo' : ''}`}
                            onClick={toggleInvertido}
                            title="Reproducir al revés"
                        >
                            <RotateCcw size={12} />
                            <span>Reverse</span>
                        </button>
                        <button
                            className={`modalConfigToggle ${normalizado ? 'activo' : ''}`}
                            onClick={toggleNormalizado}
                            title="Normalizar volumen al máximo"
                        >
                            <span>Normalizar</span>
                        </button>
                    </div>

                    {/* C239: Botón restablecer valores por defecto */}
                    <button
                        className="modalConfigRestablecer"
                        onClick={restablecer}
                        title="Restablecer todas las propiedades a valores originales"
                    >
                        <RefreshCw size={12} />
                        <span>Restablecer</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
