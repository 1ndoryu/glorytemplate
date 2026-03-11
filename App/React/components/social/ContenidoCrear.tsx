/*
 * Componente: ContenidoCrear — Kamples (C124)
 * UI compartida para crear publicaciones y subir samples.
 * Usado por ModalCrear (con wrapper Modal) y SeccionPublicar (inline).
 * Toda la lógica reside en useCrearContenido.
 */

import { Music, Image, X, Download, AlertCircle, CheckCircle, Crown, Users, Clock } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useCrearContenido } from '@app/hooks/useCrearContenido';
import { useAuthStore } from '@app/stores/authStore';
import { ETIQUETAS_TIPO_ELEMENTO } from '@app/types/cancion';
import type { TipoElemento } from '@app/types/cancion';
import { SelectorMenu } from '@app/components/ui/SelectorMenu';
import '@app/styles/componentes/modalCrear.css';
import { CampoTexto } from '../ui/CampoTexto';
import { Input } from '../ui/Input';

interface ContenidoCrearProps {
    autoFocus?: boolean;
    placeholder?: string;
    alCompletarPublicacion?: () => void;
}

export const ContenidoCrear = ({ autoFocus, placeholder, alCompletarPublicacion }: ContenidoCrearProps): JSX.Element => {
    const usuario = useAuthStore(s => s.usuario);

    const {
        contenido, publicando, permitirDescarga, setPermitirDescarga,
        esPremium, setEsPremium,
        mostrarEnComunidad, setMostrarEnComunidad,
        precio, setPrecio,
        inicioSegundos, setInicioSegundos, enContextoRelacion,
        tipoElemento, setTipoElemento,
        waveformPeaks, audioUrl,
        reproduciendoPreview, progresoPreview, setProgresoPreview,
        errorSubida, setErrorSubida, exitoSubida,
        audioPreviewRef, textareaRef,
        tags, caracteresPendientes, tagsInsuficientes, puedePublicar,
        togglePreview, manejarCambioTexto, manejarPegar, manejarKeyDown, manejarPublicar,
        audioAdjunto, imagenes, arrastrando,
        inputAudioRef, inputImagenRef,
        manejarInputAudio, manejarInputImagen,
        quitarImagen, quitarAudio,
        manejarDragEnter, manejarDragLeave, manejarDragOver, manejarDrop,
        formatosAudio, maxImagenes,
    } = useCrearContenido({ alCompletarPublicacion });

    return (
        <div
            className="crearContenido"
            onDragEnter={manejarDragEnter}
            onDragLeave={manejarDragLeave}
            onDragOver={manejarDragOver}
            onDrop={manejarDrop}
        >
            {/* Avatar + nombre */}
            <div className="crearCabecera">
                <Avatar src={usuario?.avatarUrl ?? null} nombre={usuario?.nombreVisible ?? ''} tamano="sm" />
                <span className="crearUsuario">{usuario?.nombreVisible ?? usuario?.username}</span>
            </div>

            {/* Textarea con soporte de # tags */}
            <CampoTexto multilínea
                ref={textareaRef}
                className="crearTextarea"
                placeholder={placeholder ?? '¿Qué estás creando? Usa # para agregar tags'}
                value={contenido}
                onChange={manejarCambioTexto}
                onPaste={manejarPegar}
                onKeyDown={manejarKeyDown}
                rows={1}
                autoFocus={autoFocus}
            />

            {/* Tags extraídos del texto */}
            {tags.length > 0 && (
                <div className="crearTags">
                    {tags.map(tag => (
                        <Badge key={tag} variante="acento" estilo="borde">#{tag}</Badge>
                    ))}
                </div>
            )}

            {/* Indicador de tags mínimos para samples con audio */}
            {audioAdjunto && (
                <div className={`crearTagsContador ${tagsInsuficientes ? 'crearTagsInsuficientes' : 'crearTagsSuficientes'}`}>
                    {tagsInsuficientes
                        ? `Agrega al menos 2 tags (#hashtags) para subir tu sample (${tags.length}/2)`
                        : `${tags.length} tags`}
                </div>
            )}

            {/* Audio adjunto con info */}
            {audioAdjunto && (
                <div className="crearAdjunto">
                    <div className="crearAdjuntoIcono"><Music size={18} /></div>
                    <div className="crearAdjuntoInfo">
                        <span className="crearAdjuntoNombre">{audioAdjunto.nombre}</span>
                        <span className="crearAdjuntoMeta">{audioAdjunto.formato} — {audioAdjunto.tamano}</span>
                    </div>
                    <BotonBase variante="ghost" className="crearAdjuntoBtn crearAdjuntoBtnQuitar" onClick={quitarAudio} type="button" aria-label="Quitar audio">
                        <X size={14} />
                    </BotonBase>
                </div>
            )}

            {/* Waveform preview del audio con indicador de progreso */}
            {audioAdjunto && waveformPeaks.length > 0 && (
                <div className="crearWaveform" onClick={togglePreview} role="button" tabIndex={0}>
                    <div className="crearWaveformBarras">
                        {/* sentinel-disable-next-line key-index-lista */}
                        {waveformPeaks.map((peak, i) => {
                            const porcentaje = (i + 1) / waveformPeaks.length;
                            const reproducida = reproduciendoPreview && porcentaje <= progresoPreview;
                            return (
                                <div
                                    key={`waveform-${i}`}
                                    className={`crearWaveformBarra ${reproducida ? 'crearWaveformBarraActiva' : ''}`}
                                    style={{ height: `${Math.max(peak * 100, 4)}%` }}
                                />
                            );
                        })}
                    </div>
                    {audioUrl && (
                        <audio
                            ref={audioPreviewRef}
                            src={audioUrl}
                            onTimeUpdate={() => {
                                const a = audioPreviewRef.current;
                                if (a && a.duration) setProgresoPreview(a.currentTime / a.duration);
                            }}
                            onEnded={() => { setProgresoPreview(0); }}
                        />
                    )}
                </div>
            )}

            {/* L7.2: Campo de timing — solo cuando se sube en contexto de relacion de sampleo */}
            {audioAdjunto && enContextoRelacion && (
                <div className="crearTimingContenedor">
                    <Clock size={14} className="crearTimingIcono" />
                    <label className="crearTimingLabel" htmlFor="crearTimingInput">Inicio en canción original (seg)</label>
                    <CampoTexto
                        id="crearTimingInput"
                        type="number"
                        className="crearTimingInput"
                        min="0"
                        step="1"
                        placeholder="ej: 42"
                        value={inicioSegundos}
                        onChange={(e) => setInicioSegundos(e.target.value)}
                    />
                </div>
            )}

            {/* Selector de tipo de elemento sampleado — solo en contexto de relacion */}
            {audioAdjunto && enContextoRelacion && (
                <div className="crearElementoContenedor">
                    <SelectorMenu
                        etiqueta="Elemento sampleado (opcional)"
                        valor={tipoElemento}
                        onChange={(v) => setTipoElemento(v as TipoElemento)}
                        opciones={[
                            { valor: '', etiqueta: 'Sin especificar' },
                            ...Object.entries(ETIQUETAS_TIPO_ELEMENTO).map(([valor, etiqueta]) => ({ valor, etiqueta })),
                        ]}
                        compacto
                    />
                </div>
            )}

            {/* Preview de imágenes */}
            {imagenes.length > 0 && (
                <div className={`crearImagenes crearImagenes${imagenes.length}`}>
                    {imagenes.map((img, i) => (
                        <div className="crearImagenItem" key={img.url}>
                            <img src={img.url} alt={`Imagen ${i + 1}`} />
                            <BotonBase variante="ghost" className="crearImagenQuitar" onClick={() => quitarImagen(i)} type="button" aria-label="Quitar imagen">
                                <X size={12} />
                            </BotonBase>
                        </div>
                    ))}
                </div>
            )}

            {/* Overlay drag & drop */}
            {arrastrando && (
                <div className="crearDropOverlay">
                    <Music size={32} />
                    <span>Suelta archivos aquí</span>
                </div>
            )}

            {/* Condiciones del sample (descarga/licencia/premium) */}
            {audioAdjunto && (
                <div className="crearCondiciones">
                    <BotonBase variante="ghost"
                        className={`crearCondicionBtn ${permitirDescarga ? 'crearCondicionActiva' : ''}`}
                        onClick={() => setPermitirDescarga(!permitirDescarga)}
                        type="button"
                        title={permitirDescarga ? 'Descarga permitida' : 'Descarga no permitida'}
                    >
                        <Download size={14} />
                        <span>{permitirDescarga ? 'Descarga sí' : 'Descarga no'}</span>
                    </BotonBase>
                    <BotonBase variante="ghost"
                        className={`crearCondicionBtn ${esPremium ? 'crearCondicionPremium' : ''}`}
                        onClick={() => setEsPremium(!esPremium)}
                        type="button"
                        title={esPremium ? 'Sample premium' : 'Sample gratuito'}
                    >
                        <Crown size={14} />
                        <span>{esPremium ? 'Premium' : 'Gratis'}</span>
                    </BotonBase>
                    {/* C220: Toggle visibilidad en comunidad */}
                    <BotonBase variante="ghost"
                        className={`crearCondicionBtn ${mostrarEnComunidad ? 'crearCondicionActiva' : ''}`}
                        onClick={() => setMostrarEnComunidad(!mostrarEnComunidad)}
                        type="button"
                        title={mostrarEnComunidad ? 'Visible en comunidad' : 'No visible en comunidad'}
                    >
                        <Users size={14} />
                        <span>{mostrarEnComunidad ? 'Comunidad sí' : 'Comunidad no'}</span>
                    </BotonBase>
                </div>
            )}

            {/* Campo precio para samples premium */}
            {audioAdjunto && esPremium && (
                <div className="crearPrecioContenedor">
                    <label className="crearPrecioLabel" htmlFor="crearPrecioInput">Precio (USD)</label>
                    <CampoTexto
                        id="crearPrecioInput"
                        type="number"
                        className="crearPrecioInput"
                        min="0.50"
                        max="99.99"
                        step="0.01"
                        placeholder="2.99"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                    />
                </div>
            )}

            {/* Mensaje de error */}
            {errorSubida && (
                <div className="crearMensajeError">
                    <AlertCircle size={16} />
                    <span>{errorSubida}</span>
                    <BotonBase variante="ghost" type="button" onClick={() => setErrorSubida(null)} className="crearMensajeCerrar"><X size={12} /></BotonBase>
                </div>
            )}

            {/* Mensaje de éxito */}
            {exitoSubida && (
                <div className="crearMensajeExito">
                    <CheckCircle size={16} />
                    <span>{audioAdjunto ? 'Sample subido correctamente' : 'Publicación creada'}</span>
                </div>
            )}

            {/* Barra de acciones */}
            <div className="crearAcciones">
                <div className="crearAccionesIzquierda">
                    <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => inputAudioRef.current?.click()} type="button" aria-label="Adjuntar audio" disabled={!!audioAdjunto}>
                        <Music size={18} />
                    </BotonBase>
                    <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => inputImagenRef.current?.click()} type="button" aria-label="Adjuntar imagen" disabled={imagenes.length >= maxImagenes}>
                        <Image size={18} />
                    </BotonBase>
                </div>
                <div className="crearAccionesDerecha">
                    <span className={`crearContador ${caracteresPendientes < 100 ? 'crearContadorAlerta' : ''}`}>{caracteresPendientes}</span>
                    <BotonBase variante="primario" tamano="sm" onClick={manejarPublicar} disabled={!puedePublicar}>
                        {publicando ? (audioAdjunto ? 'Subiendo...' : 'Publicando...') : 'Publicar'}
                    </BotonBase>
                </div>
            </div>

            {/* Inputs ocultos */}
            <Input ref={inputAudioRef} type="file" accept={formatosAudio.join(',')} hidden onChange={manejarInputAudio} />
            <Input ref={inputImagenRef} type="file" accept="image/*" multiple hidden onChange={manejarInputImagen} />
        </div>
    );
};

export default ContenidoCrear;
