/*
 * Isla: ReproductorIsland — Kamples
 * Vista expandida del reproductor a pantalla completa.
 * Waveform grande, cola editable, controles avanzados.
 */

import {useCallback} from 'react';
import {Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Music, ListMusic, Trash2, ChevronUp, ChevronDown, X} from 'lucide-react';
import {useReproductorStore} from '@app/stores/reproductorStore';
import {WaveformPlayer} from '@app/components/ui/WaveformPlayer';
import {Badge} from '@app/components/ui/Badge';
import {useNavigationStore} from '@/core/router';
import type {SampleResumen} from '@app/types';
import '../../styles/componentes/reproductorIsland.css';
import { BotonBase } from '../../components/ui/BotonBase';

/* Formatear segundos a mm:ss */
const formatearTiempo = (segundos: number): string => {
    if (!segundos || isNaN(segundos)) return '0:00';
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const ReproductorIsland = (): JSX.Element => {
    const sampleActual = useReproductorStore(s => s.sampleActual);
    const cola = useReproductorStore(s => s.cola);
    const reproduciendo = useReproductorStore(s => s.reproduciendo);
    const volumen = useReproductorStore(s => s.volumen);
    const progreso = useReproductorStore(s => s.progreso);
    const duracion = useReproductorStore(s => s.duracion);
    const muted = useReproductorStore(s => s.muted);
    const repetir = useReproductorStore(s => s.repetir);
    const aleatorio = useReproductorStore(s => s.aleatorio);
    const togglePlay = useReproductorStore(s => s.togglePlay);
    const setVolumen = useReproductorStore(s => s.setVolumen);
    const toggleMute = useReproductorStore(s => s.toggleMute);
    const setProgreso = useReproductorStore(s => s.setProgreso);
    const toggleRepetir = useReproductorStore(s => s.toggleRepetir);
    const toggleAleatorio = useReproductorStore(s => s.toggleAleatorio);
    const siguiente = useReproductorStore(s => s.siguiente);
    const anterior = useReproductorStore(s => s.anterior);
    const setSample = useReproductorStore(s => s.setSample);
    const quitarDeCola = useReproductorStore(s => s.quitarDeCola);
    const limpiarCola = useReproductorStore(s => s.limpiarCola);

    const navegar = useNavigationStore(s => s.navegar);

    /* Seek desde waveform */
    const manejarSeek = useCallback(
        (posicion: number) => {
            setProgreso(posicion);
        },
        [setProgreso]
    );

    /* Mover item en cola (swap con vecino) */
    const moverEnCola = useCallback(
        (indice: number, direccion: 'arriba' | 'abajo') => {
            const nuevaCola = [...cola];
            const destino = direccion === 'arriba' ? indice - 1 : indice + 1;
            if (destino < 0 || destino >= nuevaCola.length) return;
            [nuevaCola[indice], nuevaCola[destino]] = [nuevaCola[destino], nuevaCola[indice]];
            /* Actualizamos la cola completa reemplazando */
            useReproductorStore.setState({cola: nuevaCola});
        },
        [cola]
    );

    /* Ir al perfil del creador */
    const irAlCreador = useCallback(
        (username: string) => {
            navegar(`/perfil/${username}/`);
        },
        [navegar]
    );

    /* Estado vacío: no hay sample en reproducción */
    if (!sampleActual) {
        return (
            <div className="reproductorIsland" id="reproductorIsland">
                <div className="reproductorIslandVacio">
                    <Music size={48} />
                    <h2>Sin reproducción</h2>
                    <p>Selecciona un sample para empezar a escuchar</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reproductorIsland" id="reproductorIsland">
            <div className="reproductorIslandGrid">
                {/* Panel izquierdo: artwork + info + waveform */}
                <div className="reproductorIslandPrincipal">
                    {/* Artwork */}
                    <div className="reproductorIslandArt">
                        {sampleActual.imagenUrl ? (
                            <img src={sampleActual.imagenUrl} alt={sampleActual.titulo} />
                        ) : (
                            <div className="reproductorIslandArtPlaceholder">
                                <Music size={64} />
                            </div>
                        )}
                    </div>

                    {/* Info del sample */}
                    <div className="reproductorIslandInfo">
                        <h1 className="reproductorIslandTitulo">{sampleActual.titulo}</h1>
                        <BotonBase variante="ghost" className="reproductorIslandCreador" type="button" onClick={() => irAlCreador(sampleActual.creador.username)}>
                            {sampleActual.creador.nombreVisible || sampleActual.creador.username}
                        </BotonBase>

                        <div className="reproductorIslandBadges">
                            {sampleActual.bpm && <Badge>{sampleActual.bpm} BPM</Badge>}
                            {sampleActual.key && (
                                <Badge>
                                    {sampleActual.key}
                                    {sampleActual.escala === 'menor' ? 'm' : ''}
                                </Badge>
                            )}
                            {sampleActual.tipo && <Badge>{sampleActual.tipo}</Badge>}
                            {sampleActual.tags?.slice(0, 3).map(tag => (
                                <Badge key={tag}>{tag}</Badge>
                            ))}
                        </div>
                    </div>

                    {/* Waveform grande */}
                    <div className="reproductorIslandWaveform">
                        <WaveformPlayer picos={null} progreso={progreso} duracion={duracion} onSeek={manejarSeek} tamano="xl" />
                    </div>

                    {/* Tiempos */}
                    <div className="reproductorIslandTiempos">
                        <span>{formatearTiempo(progreso * duracion)}</span>
                        <span>{formatearTiempo(duracion)}</span>
                    </div>

                    {/* Controles */}
                    <div className="reproductorIslandControles">
                        <BotonBase variante="ghost" className={`reproductorIslandBtn ${aleatorio ? 'reproductorIslandBtnActivo' : ''}`} onClick={toggleAleatorio} type="button" aria-label="Aleatorio">
                            <Shuffle size={18} />
                        </BotonBase>
                        <BotonBase variante="ghost" className="reproductorIslandBtn" onClick={anterior} type="button" aria-label="Anterior">
                            <SkipBack size={22} />
                        </BotonBase>
                        <BotonBase variante="ghost" className="reproductorIslandPlayBtn" onClick={togglePlay} type="button" aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}>
                            {reproduciendo ? <Pause size={28} /> : <Play size={28} />}
                        </BotonBase>
                        <BotonBase variante="ghost" className="reproductorIslandBtn" onClick={siguiente} type="button" aria-label="Siguiente">
                            <SkipForward size={22} />
                        </BotonBase>
                        <BotonBase variante="ghost" className={`reproductorIslandBtn ${repetir ? 'reproductorIslandBtnActivo' : ''}`} onClick={toggleRepetir} type="button" aria-label="Repetir">
                            <Repeat size={18} />
                        </BotonBase>
                    </div>

                    {/* Volumen */}
                    <div className="reproductorIslandVolumen">
                        <BotonBase variante="ghost" className="reproductorIslandBtn reproductorIslandBtnSm" onClick={toggleMute} type="button">
                            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </BotonBase>
                        {/* sentinel-disable-next-line html-nativo: input type="range" sin equivalente UI */}
                        <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volumen} onChange={e => setVolumen(Number(e.target.value))} className="reproductorIslandSlider" aria-label="Volumen" />
                    </div>
                </div>

                {/* Panel derecho: cola de reproducción */}
                <PanelCola cola={cola} sampleActualId={sampleActual.id} onSeleccionar={setSample} onQuitar={quitarDeCola} onMover={moverEnCola} onLimpiar={limpiarCola} />
            </div>
        </div>
    );
};

/* Componente separado para la cola — SRP */
interface PanelColaProps {
    cola: SampleResumen[];
    sampleActualId: number;
    onSeleccionar: (sample: SampleResumen) => void;
    onQuitar: (id: number) => void;
    onMover: (indice: number, dir: 'arriba' | 'abajo') => void;
    onLimpiar: () => void;
}

const PanelCola = ({cola, sampleActualId, onSeleccionar, onQuitar, onMover, onLimpiar}: PanelColaProps): JSX.Element => (
    <div className="reproductorIslandCola">
        <div className="reproductorIslandColaHeader">
            <ListMusic size={18} />
            <h3>Cola de reproducción</h3>
            <span className="reproductorIslandColaCount">{cola.length}</span>
            {cola.length > 0 && (
                <BotonBase variante="ghost" className="reproductorIslandBtn reproductorIslandBtnSm" onClick={onLimpiar} type="button" aria-label="Limpiar cola">
                    <Trash2 size={14} />
                </BotonBase>
            )}
        </div>

        {cola.length === 0 ? (
            <div className="reproductorIslandColaVacia">
                <p>La cola está vacía</p>
                <span>Añade samples desde el explorador</span>
            </div>
        ) : (
            <div className="reproductorIslandColaLista">
                {cola.map((sample, indice) => (
                    <div key={sample.id} className={`reproductorIslandColaItem ${sample.id === sampleActualId ? 'reproductorIslandColaItemActivo' : ''}`}>
                        <BotonBase variante="ghost" className="reproductorIslandColaPlay" onClick={() => onSeleccionar(sample)} type="button">
                            <div className="reproductorIslandColaImagen">{sample.imagenUrl ? <img src={sample.imagenUrl} alt="" /> : <Music size={14} />}</div>
                            <div className="reproductorIslandColaInfo">
                                <span className="reproductorIslandColaTitulo">{sample.titulo}</span>
                                <span className="reproductorIslandColaArtista">{sample.creador.nombreVisible || sample.creador.username}</span>
                            </div>
                        </BotonBase>

                        <div className="reproductorIslandColaAcciones">
                            <BotonBase variante="ghost" className="reproductorIslandColaBtnMini" onClick={() => onMover(indice, 'arriba')} disabled={indice === 0} type="button" aria-label="Mover arriba">
                                <ChevronUp size={12} />
                            </BotonBase>
                            <BotonBase variante="ghost" className="reproductorIslandColaBtnMini" onClick={() => onMover(indice, 'abajo')} disabled={indice === cola.length - 1} type="button" aria-label="Mover abajo">
                                <ChevronDown size={12} />
                            </BotonBase>
                            <BotonBase variante="ghost" className="reproductorIslandColaBtnMini" onClick={() => onQuitar(sample.id)} type="button" aria-label="Quitar de cola">
                                <X size={12} />
                            </BotonBase>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default ReproductorIsland;
