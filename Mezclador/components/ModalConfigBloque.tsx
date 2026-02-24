/*
 * ModalConfigBloque — Configuración avanzada de bloque de audio.
 * C287: Ventana flotante 700px, controles FL Studio Channel Settings.
 * C311: On/Off movido al header vía botonesExtra. Lógica en useConfigBloque.
 */

import { RotateCcw, Power, Music } from 'lucide-react';
import type { BloqueMezclador } from '../types/mezclador';
import { useMezcladorStore } from '../stores/mezcladorStore';
import { VentanaFlotante } from './VentanaFlotante';
import { KnobControl } from './KnobControl';
import { useConfigBloque } from '../hooks/useConfigBloque';
import { BotonBase } from '@app/components/ui/BotonBase';

interface ModalConfigBloqueProps {
    bloque: BloqueMezclador;
    onCerrar: () => void;
}

export const ModalConfigBloque = ({
    bloque,
    onCerrar,
}: ModalConfigBloqueProps): JSX.Element => {
    const {
        ventanaId, silenciado, invertido, normalizado, fadeIn, fadeOut,
        volumen, playbackRate, detune, modoTonalidad, pan, modoDeclic,
        invertirPolaridad, intercambiarEstereo,
        duracionBuffer, duracionWall,
        setSilenciado,
        toggleSilenciado, alCambiarPan, alCambiarVolumen, alCambiarRate,
        alCambiarDetune, alCambiarModoTonalidad, alCambiarFadeIn,
        alCambiarFadeOut, alCambiarDeclic,
        toggleInvertido, toggleNormalizado, toggleInvertirPolaridad, toggleIntercambiarEstereo,
    } = useConfigBloque(bloque, onCerrar);

    return (
        <VentanaFlotante
            id={ventanaId}
            titulo={bloque.sample.titulo}
            ancho={700}
            botonesExtra={
                <BotonBase variante="ghost"
                    className={`ventanaFlotanteBoton configBloqueHeaderLed ${!silenciado ? 'configBloqueHeaderLedActivo' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleSilenciado(); }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (silenciado) {
                            setSilenciado(false);
                            useMezcladorStore.setState(prev => ({
                                pistas: prev.pistas.map(p => ({
                                    ...p,
                                    bloques: p.bloques.map(b =>
                                        b.id === bloque.id ? { ...b, silenciado: false } : b
                                    ),
                                })),
                            }));
                        }
                    }}
                    title={silenciado ? 'Activar bloque' : 'Desactivar bloque'}
                >
                    <Power size={12} />
                </BotonBase>
            }
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

                    {/* Controles principales: Knobs (Pan + Vol + Pitch) */}
                    <div className="configBloqueControlGrid">
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
                                    <BotonBase variante="ghost"
                                        className={`configBloqueModoBtn ${modoTonalidad === 'resample' ? 'activo' : ''}`}
                                        onClick={() => alCambiarModoTonalidad('resample')}
                                        onDoubleClick={(e) => { e.stopPropagation(); alCambiarModoTonalidad('resample'); }}
                                        title="Resample: pitch ligado a velocidad (vinilo)"
                                        type="button"
                                    >
                                        Resample
                                    </BotonBase>
                                    <BotonBase variante="ghost"
                                        className={`configBloqueModoBtn ${modoTonalidad === 'stretch' ? 'activo' : ''}`}
                                        onClick={() => alCambiarModoTonalidad('stretch')}
                                        onDoubleClick={(e) => { e.stopPropagation(); alCambiarModoTonalidad('resample'); }}
                                        title="Stretch: pitch independiente (SoundTouch)"
                                        type="button"
                                    >
                                        Stretch
                                    </BotonBase>
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
                                        <BotonBase variante="ghost"
                                            key={modo}
                                            className={`configBloqueModoBtn ${modoDeclic === modo ? 'activo' : ''}`}
                                            onClick={() => alCambiarDeclic(modo)}
                                            title={modo === 'none' ? 'Sin declicking' : `Declicking ${modo}`}
                                            type="button"
                                        >
                                            {modo === 'none' ? 'Off' : modo.charAt(0).toUpperCase() + modo.slice(1)}
                                        </BotonBase>
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
                                <BotonBase variante="ghost"
                                    className={`configBloqueToggle ${invertido ? 'activo' : ''}`}
                                    onClick={toggleInvertido}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (invertido) toggleInvertido(); }}
                                    title="Reverse (doble-click para restablecer)"
                                >
                                    <RotateCcw size={12} />
                                    <span>Reverse</span>
                                </BotonBase>

                                <BotonBase variante="ghost"
                                    className={`configBloqueToggle ${normalizado ? 'activo' : ''}`}
                                    onClick={toggleNormalizado}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (normalizado) toggleNormalizado(); }}
                                    title="Normalize (doble-click para restablecer)"
                                >
                                    <span>Normalize</span>
                                </BotonBase>

                                <BotonBase variante="ghost"
                                    className={`configBloqueToggle ${invertirPolaridad ? 'activo' : ''}`}
                                    onClick={toggleInvertirPolaridad}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (invertirPolaridad) toggleInvertirPolaridad(); }}
                                    title="Inv. Polaridad (doble-click para restablecer)"
                                >
                                    <span>Inv. Polaridad</span>
                                </BotonBase>

                                <BotonBase variante="ghost"
                                    className={`configBloqueToggle ${intercambiarEstereo ? 'activo' : ''}`}
                                    onClick={toggleIntercambiarEstereo}
                                    onDoubleClick={(e) => { e.stopPropagation(); if (intercambiarEstereo) toggleIntercambiarEstereo(); }}
                                    title="Swap L/R (doble-click para restablecer)"
                                >
                                    <span>Swap L/R</span>
                                </BotonBase>
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
