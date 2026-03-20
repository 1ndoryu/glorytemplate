/*
 * Componente: ReproductorGlobal
 * Reproductor minimalista flotante centrado abajo.
 * Pill shape, portada circular, controles inline, barra de progreso.
 * QQ49: Rediseño completo.
 */

import { Play, Pause, SkipBack, SkipForward, Heart, Music, X } from 'lucide-react';
import { useReproductorGlobal } from '../../hooks/useReproductorGlobal';
import { BotonBase } from './BotonBase';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/reproductorGlobal.css';

export const ReproductorGlobal = (): JSX.Element | null => {
    const {
        sampleActual,
        reproduciendo,
        progreso,
        duracion,
        liked,
        togglePlay,
        siguiente,
        anterior,
        cerrar,
        manejarLike,
        manejarSeekProgreso,
        progresoBarraRef,
        formatearTiempo,
        irASample,
    } = useReproductorGlobal();

    /* [193A-66] useT DEBE ir antes de cualquier return condicional — Rules of Hooks */
    const { t } = useT();

    if (!sampleActual) return null;

    return (
        <div className="reproductorGlobal" id="reproductorGlobal">
            {/* QK73: Linea de tiempo como borde superior con color acento */}
            <div
                ref={progresoBarraRef}
                className="reproductorTimelineSuperior"
                onClick={manejarSeekProgreso}
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progreso * 100)}
                aria-label={t('reproductor.progreso')}
            >
                <div className="reproductorTimelineRelleno" style={{ width: `${progreso * 100}%` }} />
            </div>

            {/* [183A-52] Portada circular — click navega al sample */}
            <div className="reproductorPortada reproductorClickable" onClick={irASample} title={t('reproductor.irAlSample')}>
                {sampleActual.imagenUrl
                    ? <img src={sampleActual.imagenUrl} alt={sampleActual.titulo} />
                    : <Music size={16} className="reproductorPortadaIcono" />
                }
            </div>

            {/* [183A-52] Info — click navega al sample */}
            <div className="reproductorInfo reproductorClickable" onClick={irASample} title={t('reproductor.irAlSample')}>
                <span className="reproductorTitulo">{sampleActual.titulo}</span>
                <span className="reproductorArtista">
                    {sampleActual.creador.nombreVisible || sampleActual.creador.username}
                </span>
            </div>

            {/* Controles */}
            <div className="reproductorControles">
                <BotonBase variante="ghost" tamano="ninguno" soloIcono className="reproductorBtn" onClick={anterior} aria-label={t('reproductor.anterior')}>
                    <SkipBack size={14} />
                </BotonBase>
                <BotonBase variante="ghost" tamano="ninguno" soloIcono className="reproductorPlayBtn" onClick={togglePlay} aria-label={reproduciendo ? t('reproductor.pausar') : t('reproductor.reproducir')}>
                    {reproduciendo ? <Pause size={16} /> : <Play size={16} />}
                </BotonBase>
                <BotonBase variante="ghost" tamano="ninguno" soloIcono className="reproductorBtn" onClick={siguiente} aria-label={t('reproductor.siguiente')}>
                    <SkipForward size={14} />
                </BotonBase>
            </div>

            {/* QK73: Tiempo compacto sin barra (la barra ahora es el borde superior) */}
            <span className="reproductorTiempoCompacto">
                {formatearTiempo(progreso * duracion)} / {formatearTiempo(duracion)}
            </span>

            {/* Like */}
            <BotonBase
                variante="ghost"
                tamano="ninguno"
                soloIcono
                className={`reproductorBtn ${liked ? 'reproductorBtnActivo' : ''}`}
                onClick={manejarLike}
                aria-label={t('reproductor.like')}
            >
                <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </BotonBase>

            {/* QK102: Cerrar reproductor */}
            <BotonBase
                variante="ghost"
                tamano="ninguno"
                soloIcono
                className="reproductorBtn reproductorBtnCerrar"
                onClick={cerrar}
                aria-label={t('reproductor.cerrar')}
            >
                <X size={14} />
            </BotonBase>
        </div>
    );
};

export default ReproductorGlobal;
