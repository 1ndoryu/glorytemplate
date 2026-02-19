/*
 * ModalConfigBloque — Configuración avanzada de un bloque de audio.
 * C287: Rediseño completo — ventana flotante draggable de 700px con controles
 * profesionales organizados en secciones inspiradas en FL Studio Channel Settings.
 * Se abre desde doble click (C286) o botón 3 puntos en BloqueSample.
 */

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Power, Music } from 'lucide-react';
import type { BloqueMezclador, ConfigBloque } from '../types/mezclador';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { useVentanasStore } from '../stores/ventanasStore';
import { VentanaFlotante } from './VentanaFlotante';
import { KnobControl } from './KnobControl';
import { invalidarCacheBloque } from '../services/pitchShiftService';

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
    const abrirVentana = useVentanasStore(s => s.abrirVentana);
    const cerrarVentana = useVentanasStore(s => s.cerrarVentana);

    /* ID único de la ventana basado en el bloque */
    const ventanaId = `config-bloque-${bloque.id}`;

    /* Registrar ventana al montar */
    useEffect(() => {
        abrirVentana({
            id: ventanaId,
            tipo: 'configBloque',
            titulo: bloque.sample.titulo,
            bloqueId: bloque.id,
            posicion: {
                x: Math.max(20, Math.round(window.innerWidth / 2 - 350)),
                y: Math.max(20, Math.round(window.innerHeight / 2 - 280)),
            },
        });
    }, []);

    /* Cerrar la ventana y notificar al padre */
    const ventana = useVentanasStore(s => s.ventanas.find(v => v.id === ventanaId));
    useEffect(() => {
        /* Si la ventana fue cerrada desde VentanaFlotante, propagar al padre */
        if (ventana === undefined) {
            onCerrar();
        }
    }, [ventana, onCerrar]);

    /* Estado local para edición — se aplica inmediatamente */
    const [silenciado, setSilenciado] = useState(bloque.silenciado);
    const [invertido, setInvertido] = useState(bloque.invertido);
    const [normalizado, setNormalizado] = useState(bloque.normalizado);
    const [fadeIn, setFadeIn] = useState(bloque.fadeIn);
    const [fadeOut, setFadeOut] = useState(bloque.fadeOut);
    const [volumen, setVolumen] = useState(bloque.volumen);
    const [playbackRate, setPlaybackRate] = useState(bloque.playbackRate);
    const [detune, setDetune] = useState(bloque.detune ?? 0);
    const [modoTonalidad, setModoTonalidad] = useState<'resample' | 'stretch'>(bloque.modoTonalidad ?? 'resample');
    const [pan, setPan] = useState(bloque.pan ?? 0);
    const [modoDeclic, setModoDeclic] = useState(bloque.modoDeclic ?? 'none');
    const [invertirPolaridad, setInvertirPolaridad] = useState(bloque.invertirPolaridad ?? false);
    const [intercambiarEstereo, setIntercambiarEstereo] = useState(bloque.intercambiarEstereo ?? false);

    /* Duración total del buffer en segundos */
    const duracionBuffer = bloque.audioBuffer?.duration ?? 0;
    const durCompas = (60 / bpmProyecto) * compasProyecto.numerador;
    const duracionWall = bloque.duracionCompases * durCompas;

    /* Aplicar cambios en tiempo real */
    const aplicar = useCallback((config: ConfigBloque) => {
        actualizarConfigBloque(bloque.id, config);
    }, [bloque.id, actualizarConfigBloque]);

    /* Toggle on/off (silenciar bloque) */
    const toggleSilenciado = () => {
        const nuevo = !silenciado;
        setSilenciado(nuevo);
        useMezcladorStore.setState(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.map(b =>
                    b.id === bloque.id ? { ...b, silenciado: nuevo } : b
                ),
            })),
        }));
    };

    /* Pan */
    const alCambiarPan = (valor: number) => {
        const clamped = Math.max(-1, Math.min(1, valor));
        setPan(clamped);
        aplicar({ pan: clamped });
    };

    /* Volumen */
    const alCambiarVolumen = (valor: number) => {
        const clamped = Math.max(0, Math.min(2, valor));
        setVolumen(clamped);
        aplicar({ volumen: clamped });
    };

    /* Pitch / Speed */
    const alCambiarRate = (valor: number) => {
        const clamped = Math.max(0.25, Math.min(4, valor));
        setPlaybackRate(clamped);
        const nuevaDuracion = duracionBuffer / (clamped * durCompas);
        setDuracionBloque(bloque.id, Math.max(0.25, nuevaDuracion));
    };

    /* Detune en semitonos */
    const alCambiarDetune = (valor: number) => {
        const clamped = Math.max(-12, Math.min(12, Math.round(valor)));
        setDetune(clamped);
        if (modoTonalidad === 'stretch') invalidarCacheBloque(bloque.id);
        aplicar({ detune: clamped });
    };

    /* Modo tonal */
    const alCambiarModoTonalidad = (modo: 'resample' | 'stretch') => {
        setModoTonalidad(modo);
        invalidarCacheBloque(bloque.id);
        aplicar({ modoTonalidad: modo });
    };

    /* Fade In */
    const alCambiarFadeIn = (valor: number) => {
        const clamped = Math.max(0, Math.min(duracionWall / 2, valor));
        setFadeIn(clamped);
        aplicar({ fadeIn: clamped });
    };

    /* Fade Out */
    const alCambiarFadeOut = (valor: number) => {
        const clamped = Math.max(0, Math.min(duracionWall / 2, valor));
        setFadeOut(clamped);
        aplicar({ fadeOut: clamped });
    };

    /* Declicking */
    const alCambiarDeclic = (modo: 'none' | 'corto' | 'medio' | 'largo') => {
        setModoDeclic(modo);
        aplicar({ modoDeclic: modo });
    };

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

    /* Toggle invertir polaridad */
    const toggleInvertirPolaridad = () => {
        const nuevo = !invertirPolaridad;
        setInvertirPolaridad(nuevo);
        aplicar({ invertirPolaridad: nuevo });
    };

    /* Toggle intercambiar estéreo */
    const toggleIntercambiarEstereo = () => {
        const nuevo = !intercambiarEstereo;
        setIntercambiarEstereo(nuevo);
        aplicar({ intercambiarEstereo: nuevo });
    };

    return (
        <VentanaFlotante
            id={ventanaId}
            titulo={bloque.sample.titulo}
            ancho={700}
        >
            <div className="configBloqueContenido">
                {/* Sección: Cabecera principal con info y controles maestros */}
                <div className="configBloqueSeccion configBloqueCabeceraPrincipal">
                    <div className="configBloqueInfo">
                        <span className="configBloqueInfoItem">
                            <Music size={10} />
                            {duracionBuffer.toFixed(2)}s
                        </span>
                        <span className="configBloqueInfoItem">
                            {bloque.sample.bpm ?? '?'} BPM
                        </span>
                        <span className="configBloqueInfoItem">
                            {bloque.duracionCompases.toFixed(2)} comp.
                        </span>
                        <span className="configBloqueInfoItem">
                            x{playbackRate.toFixed(2)}
                        </span>
                    </div>

                    {/* Controles principales: On/Off + Knobs (Pan + Vol + Pitch) */}
                    <div className="configBloqueControlGrid">
                        {/* On/Off LED */}
                        <div className="configBloqueControlGrupo">
                            <button
                                className={`configBloqueLed ${!silenciado ? 'configBloqueLedActivo' : ''}`}
                                onClick={toggleSilenciado}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (silenciado) { setSilenciado(false); useMezcladorStore.setState(prev => ({ pistas: prev.pistas.map(p => ({ ...p, bloques: p.bloques.map(b => b.id === bloque.id ? { ...b, silenciado: false } : b) })) })); }
                                }}
                                title={silenciado ? 'Activar canal' : 'Silenciar canal'}
                            >
                                <Power size={14} />
                            </button>
                            <span className="configBloqueControlEtiqueta">
                                {silenciado ? 'OFF' : 'ON'}
                            </span>
                        </div>

                        {/* Pan — Knob bipolar */}
                        <KnobControl
                            valor={pan}
                            min={-1}
                            max={1}
                            paso={0.01}
                            etiqueta="Pan"
                            valorPorDefecto={0}
                            bipolar={true}
                            formatoValor={(v) => v === 0 ? 'C' : v < 0 ? `${Math.round(Math.abs(v) * 100)}L` : `${Math.round(v * 100)}R`}
                            onChange={alCambiarPan}
                        />

                        {/* Volumen — Knob */}
                        <KnobControl
                            valor={volumen}
                            min={0}
                            max={2}
                            paso={0.01}
                            etiqueta="Vol"
                            valorPorDefecto={1}
                            formatoValor={(v) => `${Math.round(v * 100)}%`}
                            onChange={alCambiarVolumen}
                        />

                        {/* Pitch (detune semitonos) — Knob bipolar */}
                        <KnobControl
                            valor={detune}
                            min={-12}
                            max={12}
                            paso={1}
                            etiqueta="Pitch"
                            valorPorDefecto={0}
                            bipolar={true}
                            formatoValor={(v) => `${v > 0 ? '+' : ''}${v} st`}
                            onChange={alCambiarDetune}
                        />
                    </div>
                </div>

                {/* Panel de dos columnas */}
                <div className="configBloqueColumnas">
                    {/* Columna izquierda */}
                    <div className="configBloqueColumna">
                        {/* Time Stretching */}
                        <div className="configBloqueSeccion">
                            <h4 className="configBloqueSeccionTitulo">Time Stretching</h4>

                            <div className="configBloqueFilaKnobs">
                                <KnobControl
                                    valor={playbackRate}
                                    min={0.25}
                                    max={4}
                                    paso={0.05}
                                    etiqueta="Speed"
                                    valorPorDefecto={1}
                                    formatoValor={(v) => `x${v.toFixed(2)}`}
                                    onChange={alCambiarRate}
                                    tamano={38}
                                />
                            </div>

                            <div className="configBloqueFila">
                                <label className="configBloqueLabel">Modo</label>
                                <div className="configBloqueModoTonal">
                                    <button
                                        className={`configBloqueModoBtn ${modoTonalidad === 'resample' ? 'activo' : ''}`}
                                        onClick={() => alCambiarModoTonalidad('resample')}
                                        onDoubleClick={(e) => { e.stopPropagation(); alCambiarModoTonalidad('resample'); }}
                                        title="Resample: pitch ligado a velocidad (vinilo)"
                                        type="button"
                                    >
                                        Resample
                                    </button>
                                    <button
                                        className={`configBloqueModoBtn ${modoTonalidad === 'stretch' ? 'activo' : ''}`}
                                        onClick={() => alCambiarModoTonalidad('stretch')}
                                        onDoubleClick={(e) => { e.stopPropagation(); alCambiarModoTonalidad('resample'); }}
                                        title="Stretch: pitch independiente (SoundTouch)"
                                        type="button"
                                    >
                                        Stretch
                                    </button>
                                </div>
                            </div>

                            <div className="configBloqueFila configBloqueFilaInfo">
                                <span className="configBloqueLabel">Rango</span>
                                <span className="configBloqueValor">±12 semitonos</span>
                            </div>
                        </div>

                        {/* Edición de sample */}
                        <div className="configBloqueSeccion">
                            <h4 className="configBloqueSeccionTitulo">Edición de Sample</h4>

                            <div className="configBloqueFilaKnobs">
                                <KnobControl
                                    valor={fadeIn}
                                    min={0}
                                    max={Math.max(0.1, duracionWall / 2)}
                                    paso={0.01}
                                    etiqueta="Fade In"
                                    valorPorDefecto={0}
                                    formatoValor={(v) => `${v.toFixed(2)}s`}
                                    onChange={alCambiarFadeIn}
                                    tamano={38}
                                />
                                <KnobControl
                                    valor={fadeOut}
                                    min={0}
                                    max={Math.max(0.1, duracionWall / 2)}
                                    paso={0.01}
                                    etiqueta="Fade Out"
                                    valorPorDefecto={0}
                                    formatoValor={(v) => `${v.toFixed(2)}s`}
                                    onChange={alCambiarFadeOut}
                                    tamano={38}
                                />
                            </div>

                            <div className="configBloqueFila">
                                <label className="configBloqueLabel">Declicking</label>
                                <div className="configBloqueModoTonal">
                                    {(['none', 'corto', 'medio', 'largo'] as const).map(modo => (
                                        <button
                                            key={modo}
                                            className={`configBloqueModoBtn ${modoDeclic === modo ? 'activo' : ''}`}
                                            onClick={() => alCambiarDeclic(modo)}
                                            title={modo === 'none' ? 'Sin declicking' : `Declicking ${modo}`}
                                            type="button"
                                        >
                                            {modo === 'none' ? 'Off' : modo.charAt(0).toUpperCase() + modo.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="configBloqueFila configBloqueFilaInfo">
                                <span className="configBloqueLabel">Recorte inicio</span>
                                <span className="configBloqueValor">
                                    {(bloque.recorteInicio ?? 0).toFixed(3)}s
                                </span>
                            </div>
                            <div className="configBloqueFila configBloqueFilaInfo">
                                <span className="configBloqueLabel">Recorte fin</span>
                                <span className="configBloqueValor">
                                    {bloque.recorteFin !== null ? `${bloque.recorteFin.toFixed(3)}s` : 'completo'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="configBloqueColumna">
                        {/* Efectos */}
                        <div className="configBloqueSeccion">
                            <h4 className="configBloqueSeccionTitulo">Efectos</h4>

                            <div className="configBloqueTogglesGrid">
                                <button
                                    className={`configBloqueToggle ${invertido ? 'activo' : ''}`}
                                    onClick={toggleInvertido}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (invertido) toggleInvertido(); }}
                                    title="Reverse (doble-click para restablecer)"
                                >
                                    <RotateCcw size={12} />
                                    <span>Reverse</span>
                                </button>

                                <button
                                    className={`configBloqueToggle ${normalizado ? 'activo' : ''}`}
                                    onClick={toggleNormalizado}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (normalizado) toggleNormalizado(); }}
                                    title="Normalize (doble-click para restablecer)"
                                >
                                    <span>Normalize</span>
                                </button>

                                <button
                                    className={`configBloqueToggle ${invertirPolaridad ? 'activo' : ''}`}
                                    onClick={toggleInvertirPolaridad}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (invertirPolaridad) toggleInvertirPolaridad(); }}
                                    title="Inv. Polaridad (doble-click para restablecer)"
                                >
                                    <span>Inv. Polaridad</span>
                                </button>

                                <button
                                    className={`configBloqueToggle ${intercambiarEstereo ? 'activo' : ''}`}
                                    onClick={toggleIntercambiarEstereo}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (intercambiarEstereo) toggleIntercambiarEstereo(); }}
                                    title="Swap L/R (doble-click para restablecer)"
                                >
                                    <span>Swap L/R</span>
                                </button>
                            </div>

                            <div className="configBloquePendientes">
                                <span className="configBloquePendienteLabel">
                                    Pendientes: Remove DC Offset, Resample HQ, Load Regions, Crossfade, Trim
                                </span>
                            </div>
                        </div>

                        {/* Información del archivo */}
                        <div className="configBloqueSeccion">
                            <h4 className="configBloqueSeccionTitulo">Información</h4>
                            <div className="configBloqueInfoGrid">
                                <div className="configBloqueInfoFila">
                                    <span className="configBloqueInfoKey">Archivo</span>
                                    <span className="configBloqueInfoVal">{bloque.sample.titulo}</span>
                                </div>
                                <div className="configBloqueInfoFila">
                                    <span className="configBloqueInfoKey">Buffer</span>
                                    <span className="configBloqueInfoVal">{duracionBuffer.toFixed(3)}s</span>
                                </div>
                                <div className="configBloqueInfoFila">
                                    <span className="configBloqueInfoKey">Wall-clock</span>
                                    <span className="configBloqueInfoVal">{duracionWall.toFixed(3)}s</span>
                                </div>
                                <div className="configBloqueInfoFila">
                                    <span className="configBloqueInfoKey">Sample rate</span>
                                    <span className="configBloqueInfoVal">{bloque.audioBuffer?.sampleRate ?? '?'} Hz</span>
                                </div>
                                <div className="configBloqueInfoFila">
                                    <span className="configBloqueInfoKey">Canales</span>
                                    <span className="configBloqueInfoVal">{bloque.audioBuffer?.numberOfChannels ?? '?'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </VentanaFlotante>
    );
};
