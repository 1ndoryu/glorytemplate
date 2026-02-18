/*
 * Componente: ContenidoCrear — Kamples (C124)
 * UI compartida para crear publicaciones y subir samples.
 * Usado por ModalCrear (con wrapper Modal) y SeccionPublicar (inline).
 * Toda la lógica reside en useCrearContenido.
 */

import { Music, Image, X, Download, AlertCircle, CheckCircle, Crown, Users } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useCrearContenido } from '@app/hooks/useCrearContenido';
import { useAuthStore } from '@app/stores/authStore';
import '@app/styles/componentes/modalCrear.css';

interface ContenidoCrearProps {
    autoFocus?: boolean;
    placeholder?: string;
    alCompletarPublicacion?: () => void;
}

export const ContenidoCrear = ({ autoFocus, placeholder, alCompletarPublicacion }: ContenidoCrearProps): JSX.Element => {
    const { usuario } = useAuthStore();

    const {
        contenido, publicando, permitirDescarga, setPermitirDescarga,
        esPremium, setEsPremium,
        mostrarEnComunidad, setMostrarEnComunidad,
        precio, setPrecio, waveformPeaks, audioUrl,
        reproduciendoPreview, progresoPreview, setProgresoPreview,
        errorSubida, setErrorSubida, exitoSubida,
        audioPreviewRef, textareaRef,
        tags, caracteresPendientes, tagsInsuficientes, puedePublicar,
        togglePreview, manejarCambioTexto, manejarKeyDown, manejarPublicar,
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
            <textarea
                ref={textareaRef}
                className="crearTextarea"
                placeholder={placeholder ?? '¿Qué estás creando? Usa # para agregar tags'}
                value={contenido}
                onChange={manejarCambioTexto}
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
                    <button className="crearAdjuntoBtn crearAdjuntoBtnQuitar" onClick={quitarAudio} type="button" aria-label="Quitar audio">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Waveform preview del audio con indicador de progreso */}
            {audioAdjunto && waveformPeaks.length > 0 && (
                <div className="crearWaveform" onClick={togglePreview} role="button" tabIndex={0}>
                    <div className="crearWaveformBarras">
                        {waveformPeaks.map((peak, i) => {
                            const porcentaje = (i + 1) / waveformPeaks.length;
                            const reproducida = reproduciendoPreview && porcentaje <= progresoPreview;
                            return (
                                <div
                                    key={i}
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

            {/* Preview de imágenes */}
            {imagenes.length > 0 && (
                <div className={`crearImagenes crearImagenes${imagenes.length}`}>
                    {imagenes.map((img, i) => (
                        <div className="crearImagenItem" key={img.url}>
                            <img src={img.url} alt={`Imagen ${i + 1}`} />
                            <button className="crearImagenQuitar" onClick={() => quitarImagen(i)} type="button" aria-label="Quitar imagen">
                                <X size={12} />
                            </button>
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
                    <button
                        className={`crearCondicionBtn ${permitirDescarga ? 'crearCondicionActiva' : ''}`}
                        onClick={() => setPermitirDescarga(!permitirDescarga)}
                        type="button"
                        title={permitirDescarga ? 'Descarga permitida' : 'Descarga no permitida'}
                    >
                        <Download size={14} />
                        <span>{permitirDescarga ? 'Descarga sí' : 'Descarga no'}</span>
                    </button>
                    <button
                        className={`crearCondicionBtn ${esPremium ? 'crearCondicionPremium' : ''}`}
                        onClick={() => setEsPremium(!esPremium)}
                        type="button"
                        title={esPremium ? 'Sample premium' : 'Sample gratuito'}
                    >
                        <Crown size={14} />
                        <span>{esPremium ? 'Premium' : 'Gratis'}</span>
                    </button>
                    {/* C220: Toggle visibilidad en comunidad */}
                    <button
                        className={`crearCondicionBtn ${mostrarEnComunidad ? 'crearCondicionActiva' : ''}`}
                        onClick={() => setMostrarEnComunidad(!mostrarEnComunidad)}
                        type="button"
                        title={mostrarEnComunidad ? 'Visible en comunidad' : 'No visible en comunidad'}
                    >
                        <Users size={14} />
                        <span>{mostrarEnComunidad ? 'Comunidad sí' : 'Comunidad no'}</span>
                    </button>
                </div>
            )}

            {/* Campo precio para samples premium */}
            {audioAdjunto && esPremium && (
                <div className="crearPrecioContenedor">
                    <label className="crearPrecioLabel" htmlFor="crearPrecioInput">Precio (USD)</label>
                    <input
                        id="crearPrecioInput"
                        className="crearPrecioInput"
                        type="number"
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
                    <button type="button" onClick={() => setErrorSubida(null)} className="crearMensajeCerrar"><X size={12} /></button>
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
            <input ref={inputAudioRef} type="file" accept={formatosAudio.join(',')} hidden onChange={manejarInputAudio} />
            <input ref={inputImagenRef} type="file" accept="image/*" multiple hidden onChange={manejarInputImagen} />
        </div>
    );
};

export default ContenidoCrear;
