/*
 * ModalConfigBloque — Configuración avanzada de un bloque de audio.
 * C287: Rediseño completo — ventana flotante draggable de 700px con controles
 * profesionales organizados en secciones inspiradas en FL Studio Channel Settings.
 * Se abre desde doble click (C286) o botón 3 puntos en BloqueSample.
 */

import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, RefreshCw, Power, Music } from 'lucide-react';
import type { BloqueMezclador, ConfigBloque } from '../types/mezclador';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { useVentanasStore } from '../stores/ventanasStore';
import { VentanaFlotante } from './VentanaFlotante';
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

    /* Restablecer todo a valores por defecto */
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
        setDetune(0);
        setModoTonalidad('resample');
        setPan(0);
        setModoDeclic('none');
        setSilenciado(false);
        setInvertirPolaridad(false);
        setIntercambiarEstereo(false);
        invalidarCacheBloque(bloque.id);

        aplicar({
            volumen: 1,
            playbackRate: rateClamped,
            fadeIn: 0,
            fadeOut: 0,
            invertido: false,
            normalizado: false,
            detune: 0,
            modoTonalidad: 'resample',
            pan: 0,
            modoDeclic: 'none',
            invertirPolaridad: false,
            intercambiarEstereo: false,
        });

        useMezcladorStore.setState(prev => ({
            pistas: prev.pistas.map(p => ({
                ...p,
                bloques: p.bloques.map(b =>
                    b.id === bloque.id ? { ...b, silenciado: false } : b
                ),
            })),
        }));

        const nuevaDuracion = duracionBuffer / (rateClamped * durCompas);
        setDuracionBloque(bloque.id, Math.max(0.25, nuevaDuracion));
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

                    {/* Controles principales: On/Off + Pan + Vol + Pitch */}
                    <div className="configBloqueControlGrid">
                        {/* On/Off LED */}
                        <div className="configBloqueControlGrupo">
                            <button
                                className={`configBloqueLed ${!silenciado ? 'configBloqueLedActivo' : ''}`}
                                onClick={toggleSilenciado}
                                title={silenciado ? 'Activar canal' : 'Silenciar canal'}
                            >
                                <Power size={14} />
                            </button>
                            <span className="configBloqueControlEtiqueta">
                                {silenciado ? 'OFF' : 'ON'}
                            </span>
                        </div>

                        {/* Pan */}
                        <div className="configBloqueControlGrupo configBloqueControlAncho">
                            <label className="configBloqueControlEtiqueta">Pan</label>
                            <input
                                type="range"
                                min={-1}
                                max={1}
                                step={0.01}
                                value={pan}
                                onChange={(e) => alCambiarPan(parseFloat(e.target.value))}
                                className="configBloqueSlider"
                            />
                            <span className="configBloqueControlValor">
                                {pan === 0 ? 'C' : pan < 0 ? `${Math.round(Math.abs(pan) * 100)}L` : `${Math.round(pan * 100)}R`}
                            </span>
                        </div>

                        {/* Volumen */}
                        <div className="configBloqueControlGrupo configBloqueControlAncho">
                            <label className="configBloqueControlEtiqueta">Vol</label>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={0.01}
                                value={volumen}
                                onChange={(e) => alCambiarVolumen(parseFloat(e.target.value))}
                                className="configBloqueSlider"
                            />
                            <span className="configBloqueControlValor">
                                {Math.round(volumen * 100)}%
                            </span>
                        </div>

                        {/* Pitch (detune semitonos) */}
                        <div className="configBloqueControlGrupo configBloqueControlAncho">
                            <label className="configBloqueControlEtiqueta">Pitch</label>
                            <input
                                type="range"
                                min={-12}
                                max={12}
                                step={1}
                                value={detune}
                                onChange={(e) => alCambiarDetune(parseFloat(e.target.value))}
                                className="configBloqueSlider"
                            />
                            <span className="configBloqueControlValor">
                                {detune > 0 ? `+${detune}` : detune} st
                            </span>
                        </div>
                    </div>
                </div>

                {/* Panel de dos columnas */}
                <div className="configBloqueColumnas">
                    {/* Columna izquierda */}
                    <div className="configBloqueColumna">
                        {/* Time Stretching */}
                        <div className="configBloqueSeccion">
                            <h4 className="configBloqueSeccionTitulo">Time Stretching</h4>

                            <div className="configBloqueFila">
                                <label className="configBloqueLabel">Velocidad</label>
                                <input
                                    type="range"
                                    min={0.25}
                                    max={4}
                                    step={0.05}
                                    value={playbackRate}
                                    onChange={(e) => alCambiarRate(parseFloat(e.target.value))}
                                    className="configBloqueSlider"
                                />
                                <span className="configBloqueValor">x{playbackRate.toFixed(2)}</span>
                            </div>

                            <div className="configBloqueFila">
                                <label className="configBloqueLabel">Modo</label>
                                <div className="configBloqueModoTonal">
                                    <button
                                        className={`configBloqueModoBtn ${modoTonalidad === 'resample' ? 'activo' : ''}`}
                                        onClick={() => alCambiarModoTonalidad('resample')}
                                        title="Resample: pitch ligado a velocidad (vinilo)"
                                        type="button"
                                    >
                                        Resample
                                    </button>
                                    <button
                                        className={`configBloqueModoBtn ${modoTonalidad === 'stretch' ? 'activo' : ''}`}
                                        onClick={() => alCambiarModoTonalidad('stretch')}
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

                            <div className="configBloqueFila">
                                <label className="configBloqueLabel">Fade In</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={Math.max(0.1, duracionWall / 2)}
                                    step={0.01}
                                    value={fadeIn}
                                    onChange={(e) => alCambiarFadeIn(parseFloat(e.target.value))}
                                    className="configBloqueSlider"
                                />
                                <span className="configBloqueValor">{fadeIn.toFixed(2)}s</span>
                            </div>

                            <div className="configBloqueFila">
                                <label className="configBloqueLabel">Fade Out</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={Math.max(0.1, duracionWall / 2)}
                                    step={0.01}
                                    value={fadeOut}
                                    onChange={(e) => alCambiarFadeOut(parseFloat(e.target.value))}
                                    className="configBloqueSlider"
                                />
                                <span className="configBloqueValor">{fadeOut.toFixed(2)}s</span>
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
                                    title="Reproducir al revés"
                                >
                                    <RotateCcw size={12} />
                                    <span>Reverse</span>
                                </button>

                                <button
                                    className={`configBloqueToggle ${normalizado ? 'activo' : ''}`}
                                    onClick={toggleNormalizado}
                                    title="Normalizar volumen al máximo (0dB)"
                                >
                                    <span>Normalize</span>
                                </button>

                                <button
                                    className={`configBloqueToggle ${invertirPolaridad ? 'activo' : ''}`}
                                    onClick={toggleInvertirPolaridad}
                                    title="Invertir fase de la onda (pendiente procesamiento)"
                                >
                                    <span>Inv. Polaridad</span>
                                </button>

                                <button
                                    className={`configBloqueToggle ${intercambiarEstereo ? 'activo' : ''}`}
                                    onClick={toggleIntercambiarEstereo}
                                    title="Intercambiar canales L/R (pendiente procesamiento)"
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

                {/* Restablecer */}
                <button
                    className="configBloqueRestablecer"
                    onClick={restablecer}
                    title="Restablecer todas las propiedades a valores originales"
                >
                    <RefreshCw size={12} />
                    <span>Restablecer todo</span>
                </button>
            </div>
        </VentanaFlotante>
    );
};
