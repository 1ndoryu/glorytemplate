/*
 * InicioIsland — Kamples
 * Feed principal: trending, recientes y recomendaciones.
 * Conecta con apiSamples.obtenerFeed para cada sección.
 */

import { useEffect, useState, useCallback } from 'react';
import { Flame, Clock, Sparkles, Music } from 'lucide-react';
import {
    BotonBase,
} from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { obtenerFeed } from '@app/services/apiSamples';
import { useReproductorStore } from '@app/stores/reproductorStore';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/inicio.css';

export const InicioIsland = (): JSX.Element => {
    const [trending, setTrending] = useState<SampleResumen[]>([]);
    const [recientes, setRecientes] = useState<SampleResumen[]>([]);
    const [descubrir, setDescubrir] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);

    const {
        sampleActual,
        reproduciendo,
        progreso,
        setSample,
        play,
        pause,
    } = useReproductorStore();

    /* Cargar las 3 secciones del feed */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            const [resTrending, resRecientes, resDescubrir] = await Promise.all([
                obtenerFeed('trending'),
                obtenerFeed('recientes'),
                obtenerFeed('descubrir'),
            ]);

            if (resTrending.ok && resTrending.data) setTrending(resTrending.data);
            if (resRecientes.ok && resRecientes.data) setRecientes(resRecientes.data);
            if (resDescubrir.ok && resDescubrir.data) setDescubrir(resDescubrir.data);

            setCargando(false);
        };

        cargar();
    }, []);

    const manejarPlay = useCallback(
        (sample: SampleResumen) => {
            if (sampleActual?.id === sample.id) {
                reproduciendo ? pause() : play();
            } else {
                setSample(sample);
            }
        },
        [sampleActual, reproduciendo, pause, play, setSample]
    );

    /* Placeholder mientras carga */
    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionInicio">
                <div className="inicioVacio">
                    <Music size={40} className="inicioVacioIcono" />
                    <p>Cargando feed…</p>
                </div>
            </div>
        );
    }

    const sinContenido = trending.length === 0 && recientes.length === 0 && descubrir.length === 0;

    return (
        <div className="inicioContenedor" id="seccionInicio">
            {/* Cabecera */}
            <div className="inicioCabecera">
                <h1 className="inicioTitulo">Descubre samples</h1>
                <p className="inicioSubtitulo">
                    Explora lo más nuevo y trending de la comunidad.
                </p>
            </div>

            {sinContenido && (
                <div className="inicioVacio">
                    <Music size={48} className="inicioVacioIcono" />
                    <p>Aún no hay samples publicados.</p>
                    <BotonBase variante="primario" onClick={() => { window.location.href = '/subir'; }}>
                        Sube el primero
                    </BotonBase>
                </div>
            )}

            {/* Trending */}
            {trending.length > 0 && (
                <div className="inicioSeccion">
                    <div className="inicioSeccionHeader">
                        <span className="inicioSeccionTitulo">
                            <Flame size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Trending
                        </span>
                        <button className="inicioSeccionLink" onClick={() => { window.location.href = '/explorar'; }}>
                            Ver todos
                        </button>
                    </div>
                    <div className="inicioLista">
                        {trending.slice(0, 5).map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                activa={sampleActual?.id === s.id}
                                reproduciendo={sampleActual?.id === s.id && reproduciendo}
                                progreso={sampleActual?.id === s.id ? progreso : 0}
                                onPlay={() => manejarPlay(s)}
                                onPause={pause}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Recientes */}
            {recientes.length > 0 && (
                <div className="inicioSeccion">
                    <div className="inicioSeccionHeader">
                        <span className="inicioSeccionTitulo">
                            <Clock size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Recientes
                        </span>
                        <button className="inicioSeccionLink" onClick={() => { window.location.href = '/explorar'; }}>
                            Ver todos
                        </button>
                    </div>
                    <div className="inicioLista">
                        {recientes.slice(0, 5).map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                activa={sampleActual?.id === s.id}
                                reproduciendo={sampleActual?.id === s.id && reproduciendo}
                                progreso={sampleActual?.id === s.id ? progreso : 0}
                                onPlay={() => manejarPlay(s)}
                                onPause={pause}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Descubrir */}
            {descubrir.length > 0 && (
                <div className="inicioSeccion">
                    <div className="inicioSeccionHeader">
                        <span className="inicioSeccionTitulo">
                            <Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                            Para ti
                        </span>
                    </div>
                    <div className="inicioLista">
                        {descubrir.slice(0, 5).map((s) => (
                            <TarjetaSample
                                key={s.id}
                                sample={s}
                                activa={sampleActual?.id === s.id}
                                reproduciendo={sampleActual?.id === s.id && reproduciendo}
                                progreso={sampleActual?.id === s.id ? progreso : 0}
                                onPlay={() => manejarPlay(s)}
                                onPause={pause}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Reproductor global vive en LayoutPrincipal */}
        </div>
    );
};

export default InicioIsland;
