/*
 * Componente: ContenidoCrear — Kamples (C124)
 * UI compartida para crear publicaciones y subir samples.
 * Usado por ModalCrear (con wrapper Modal) y SeccionPublicar (inline).
 * Toda la lógica reside en useCrearContenido.
 */

import { Music, Image as ImageIcon, X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { Badge } from '@app/components/ui/Badge';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useCrearContenido } from '@app/hooks/useCrearContenido';
import { useAuthStore } from '@app/stores/authStore';
import { ETIQUETAS_TIPO_ELEMENTO } from '@app/types/cancion';
import type { TipoElemento } from '@app/types/cancion';
import { SelectorMenu } from '@app/components/ui/SelectorMenu';
import { CondicionesSample } from '@app/components/social/CondicionesSample';
import '@app/styles/componentes/modalCrear.css';
import { CampoTexto } from '../ui/CampoTexto';
import { Input } from '../ui/Input';
import { useT } from '@app/utils/i18n/useT';

interface ContenidoCrearProps {
    autoFocus?: boolean;
    placeholder?: string;
    alCompletarPublicacion?: () => void;
}

export const ContenidoCrear = ({ autoFocus, placeholder, alCompletarPublicacion }: ContenidoCrearProps): JSX.Element => {
    const usuario = useAuthStore(s => s.usuario);

    const {
        contenido, publicando, permitirDescarga, setPermitirDescarga,
        esContextoAdjuntar,
        /* [2003A-2] Pendiente: restaurar esPremium, togglePremium, tienePrecio, setTienePrecio, precio, setPrecio */
        mostrarEnComunidad, setMostrarEnComunidad,
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
        /* QQ90: Portada del sample */
        portadaPreviewUrl, adjuntarPortada, quitarPortada, inputPortadaRef,
    } = useCrearContenido({ alCompletarPublicacion });

    const { t } = useT();

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
                placeholder={placeholder ?? t('crear.placeholder')}
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
                        ? t('crear.tagsInsuficientes', { cantidad: String(tags.length) })
                        : t('crear.tags', { cantidad: String(tags.length) })}
                </div>
            )}

            {/* [2003A-2] Pendiente: campo de precio para samples con precio — desactivado.
               Restaurar bloque {audioAdjunto && tienePrecio && (...)} cuando se reactive pricing */}

            {/* Audio adjunto con info */}
            {audioAdjunto && (
                <div className="crearAdjunto">
                    {/* [193A-95] ImageIcon indica "subir imagen". Cuando hay portada,
                     * la imagen la reemplaza a tamaño mayor (56x56 via CSS). */}
                    {portadaPreviewUrl ? (
                        <BotonBase
                            variante="ghost"
                            className="crearAdjuntoIcono crearAdjuntoPortadaPreview crearAdjuntoIconoGrande"
                            onClick={quitarPortada}
                            type="button"
                            aria-label={t('crear.quitarPortada')}
                            title={t('crear.quitarPortada')}
                        >
                            <img src={portadaPreviewUrl} alt="Portada" />
                            <span className="crearAdjuntoPortadaQuitar"><X size={10} /></span>
                        </BotonBase>
                    ) : (
                        <BotonBase
                            variante="ghost"
                            className="crearAdjuntoIcono crearAdjuntoIconoBtn"
                            onClick={() => inputPortadaRef.current?.click()}
                            type="button"
                            aria-label={t('crear.adjuntarPortada')}
                            title={t('crear.adjuntarPortada')}
                        >
                            <ImageIcon size={18} />
                        </BotonBase>
                    )}
                    <div className="crearAdjuntoInfo">
                        <span className="crearAdjuntoNombre">{audioAdjunto.nombre}</span>
                        <span className="crearAdjuntoMeta">{audioAdjunto.formato} — {audioAdjunto.tamano}</span>
                    </div>
                    <BotonBase variante="ghost" className="crearAdjuntoBtn crearAdjuntoBtnQuitar" onClick={quitarAudio} type="button" aria-label={t('crear.quitarAudio')}>
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
                    <label className="crearTimingLabel" htmlFor="crearTimingInput">{t('crear.inicioCancion')}</label>
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
                <div className="crearPrecioContenedor">
                    <SelectorMenu
                        etiqueta={t('crear.elementoSampleado')}
                        valor={tipoElemento}
                        onChange={(v) => setTipoElemento(v as TipoElemento)}
                        opciones={[
                            { valor: '', etiqueta: t('crear.sinEspecificar') },
                            ...Object.entries(ETIQUETAS_TIPO_ELEMENTO).map(([valor, etiqueta]) => ({ valor, etiqueta })),
                        ]}
                    />
                </div>
            )}

            {/* Preview de imágenes */}
            {imagenes.length > 0 && (
                <div className={`crearImagenes crearImagenes${imagenes.length}`}>
                    {imagenes.map((img, i) => (
                        <div className="crearImagenItem" key={img.url}>
                            <img src={img.url} alt={`Imagen ${i + 1}`} />
                            <BotonBase variante="ghost" className="crearImagenQuitar" onClick={() => quitarImagen(i)} type="button" aria-label={t('crear.quitarImagen')}>
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
                    <span>{t('crear.sueltaArchivos')}</span>
                </div>
            )}

            {/* QQ30/30.2: Condiciones del sample */}
            {audioAdjunto && (
                <CondicionesSample
                    permitirDescarga={permitirDescarga} setPermitirDescarga={setPermitirDescarga}
                    /* [2003A-2] Pendiente: restaurar esPremium, togglePremium, tienePrecio, setTienePrecio, precio */
                    mostrarEnComunidad={mostrarEnComunidad} setMostrarEnComunidad={setMostrarEnComunidad}
                    esContextoAdjuntar={esContextoAdjuntar}
                />
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
                    <span>{audioAdjunto ? t('crear.sampleSubido') : t('crear.publicacionCreada')}</span>
                </div>
            )}

            {/* Barra de acciones */}
            <div className="crearAcciones">
                <div className="crearAccionesIzquierda">
                    <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => inputAudioRef.current?.click()} type="button" aria-label={t('crear.adjuntarAudio')} disabled={!!audioAdjunto}>
                        <Music size={20} />
                    </BotonBase>
                    <BotonBase variante="ghost" tamano="sm" soloIcono onClick={() => inputImagenRef.current?.click()} type="button" aria-label={t('crear.adjuntarImagen')} disabled={imagenes.length >= maxImagenes}>
                        <ImageIcon size={20} />
                    </BotonBase>
                </div>
                <div className="crearAccionesDerecha">
                    <span className={`crearContador ${caracteresPendientes < 100 ? 'crearContadorAlerta' : ''}`}>{caracteresPendientes}</span>
                    <BotonBase variante="primario" tamano="sm" onClick={manejarPublicar} disabled={!puedePublicar}>
                        {publicando ? (audioAdjunto ? t('crear.subiendo') : t('crear.publicando')) : t('crear.publicar')}
                    </BotonBase>
                </div>
            </div>

            {/* Inputs ocultos */}
            <Input ref={inputAudioRef} type="file" accept={formatosAudio.join(',')} hidden onChange={manejarInputAudio} />
            <Input ref={inputImagenRef} type="file" accept="image/*" multiple hidden onChange={manejarInputImagen} />
            <Input ref={inputPortadaRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={adjuntarPortada} />
        </div>
    );
};

export default ContenidoCrear;
