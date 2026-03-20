/*
 * Componente: ComentarioAudio
 * Reproductor de audio con waveform para comentarios multimedia.
 * Genera picos client-side si no vienen del backend.
 */

import { Play, Pause } from 'lucide-react';
import { WaveformPlayer } from '@app/components/ui/WaveformPlayer';
import { useComentarioAudio } from '@app/hooks/useComentarioAudio';
import { useT } from '@app/utils/i18n/useT';
import { BotonBase } from '../ui/BotonBase';

interface ComentarioAudioProps {
    src: string;
    picos?: number[];
}

export const ComentarioAudio = ({ src, picos }: ComentarioAudioProps): JSX.Element => {
    const { t } = useT();
    const {
        audioRef,
        reproduciendo,
        progreso,
        duracion,
        picosGenerados,
        alternarPlay,
        manejarProgreso,
        manejarSeek,
        manejarLoadedMetadata,
        manejarEnded,
    } = useComentarioAudio({ src, picos });

    return (
        <div className="comentarioAudio">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={manejarProgreso}
                onLoadedMetadata={manejarLoadedMetadata}
                onEnded={manejarEnded}
                preload="metadata"
            />
            <BotonBase variante="ghost"
                className="comentarioAudioBtn"
                onClick={alternarPlay}
                type="button"
                aria-label={reproduciendo ? t('sample.pausar') : t('sample.reproducir')}
            >
                {reproduciendo ? <Pause size={12} /> : <Play size={12} />}
            </BotonBase>
            <div className="comentarioAudioWaveform">
                <WaveformPlayer
                    picos={picosGenerados}
                    progreso={progreso}
                    duracion={duracion}
                    onSeek={manejarSeek}
                    tamano="sm"
                    colorNoReproducido="var(--colorWaveformNoReproducido)"
                    colorReproducido="var(--acento)"
                    anchoBarra={2}
                    espacioBarra={1}
                    simetrico={false}
                />
            </div>
        </div>
    );
};
