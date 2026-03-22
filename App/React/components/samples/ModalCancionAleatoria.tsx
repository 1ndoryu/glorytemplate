/*
 * Componente: ModalCancionAleatoria — Kamples
 * [223A-4] Modal de descubrimiento de canciones aleatorias.
 * Muestra cancionDetalleTarjeta con botones: Siguiente, Recorte, YouTube (admin).
 */

import { Music, SkipForward, Scissors, Youtube, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import type { useCancionAleatoria } from '@app/hooks/useCancionAleatoria';
import { ETIQUETAS_ROL } from '@app/types/cancion';
import { useNavigationStore } from '@/core/router';
import '../../styles/componentes/cancionDetalle.css';

interface Props {
    ctrl: ReturnType<typeof useCancionAleatoria>;
}

export const ModalCancionAleatoria = ({ ctrl }: Props): JSX.Element | null => {
    const navegar = useNavigationStore(s => s.navegar);
    const { detalle, cargando, abierto } = ctrl;
    const cancion = detalle?.cancion;
    const artistas = detalle?.artistas ?? [];

    return (
        <Modal
            abierto={abierto}
            onCerrar={ctrl.cerrar}
            titulo="Descubrir canción"
            tamano="grande"
        >
            {cargando || !cancion ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 size={32} className="animacionGiro" />
                </div>
            ) : (
                <div className="cancionDetalleTarjeta" style={{ border: 'none', boxShadow: 'none' }}>
                    <div className="cancionDetalleCabecera">
                        <div className="cancionDetallePortada">
                            {cancion.imagenUrl ? (
                                <img src={cancion.imagenUrl} alt={cancion.titulo} loading="lazy" />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Music size={48} color="var(--textoTerciario)" />
                                </div>
                            )}
                        </div>

                        <div className="cancionDetalleInfo">
                            <h2
                                className="cancionDetalleTitulo"
                                style={{ cursor: 'pointer' }}
                                onClick={() => { ctrl.cerrar(); navegar(`/cancion/${cancion.slug}`); }}
                            >
                                {cancion.titulo}
                            </h2>

                            <div className="cancionDetalleArtistas">
                                {artistas.map(a => (
                                    <BotonBase
                                        key={`${a.artistaId}-${a.rol}`}
                                        variante="ghost"
                                        tamano="ninguno"
                                        className="cancionDetalleArtista"
                                        onClick={() => { ctrl.cerrar(); navegar(`/artista/${a.slug}`); }}
                                    >
                                        {a.nombre}
                                        {a.rol !== 'principal' && <> ({ETIQUETAS_ROL[a.rol]})</>}
                                    </BotonBase>
                                ))}
                            </div>

                            {cancion.anio && (
                                <span className="cancionDetalleAnio">{cancion.anio}</span>
                            )}

                            <div className="cancionDetalleMeta">
                                {cancion.genero && <Badge variante="neutro" tamano="sm">{cancion.genero}</Badge>}
                                {cancion.album && <Badge variante="neutro" tamano="sm">{cancion.album}</Badge>}
                            </div>
                        </div>
                    </div>

                    {/* YouTube embed si existe */}
                    {cancion.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(cancion.youtubeId) && (
                        <div className="cancionDetalleYoutube" style={{ marginTop: 'var(--espacioMd)' }}>
                            <iframe
                                src={`https://www.youtube-nocookie.com/embed/${cancion.youtubeId}`}
                                title={`${cancion.titulo} - YouTube`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                                allowFullScreen
                                style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 'var(--radio-md, 8px)' }}
                            />
                        </div>
                    )}

                    {/* Resumen relaciones */}
                    {(detalle.samplesDe.length > 0 || detalle.sampleadaEn.length > 0) && (
                        <div style={{ marginTop: 'var(--espacioMd)', fontSize: '0.85rem', opacity: 0.7 }}>
                            {detalle.samplesDe.length > 0 && (
                                <span>Samplea a {detalle.samplesDe.length} canción(es) · </span>
                            )}
                            {detalle.sampleadaEn.length > 0 && (
                                <span>Sampleada en {detalle.sampleadaEn.length} canción(es)</span>
                            )}
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="cancionDetalleAcciones" style={{
                        marginTop: 'var(--espacioLg)',
                        justifyContent: 'flex-start',
                        gap: 'var(--espacioSm)',
                        flexWrap: 'wrap',
                    }}>
                        <BotonBase
                            variante="primario"
                            tamano="sm"
                            onClick={ctrl.siguiente}
                            disabled={cargando}
                        >
                            <SkipForward size={16} /> Siguiente
                        </BotonBase>

                        <BotonBase
                            variante="secundario"
                            tamano="sm"
                            onClick={ctrl.generarRecorte}
                            disabled={ctrl.generandoRecorte || (detalle.samplesDe.length === 0 && detalle.sampleadaEn.length === 0)}
                        >
                            {ctrl.generandoRecorte
                                ? <Loader2 size={16} className="animacionGiro" />
                                : <Scissors size={16} />
                            }
                            Recorte
                        </BotonBase>

                        {ctrl.esAdmin && cancion.youtubeId && (
                            <BotonBase
                                variante="ghost"
                                tamano="sm"
                                onClick={() => {
                                    window.open(`https://www.youtube.com/watch?v=${cancion.youtubeId}`, '_blank', 'noopener');
                                }}
                            >
                                <Youtube size={16} /> YouTube
                            </BotonBase>
                        )}
                    </div>

                    {/* Mensaje de resultado de recorte */}
                    {ctrl.mensajeRecorte && (
                        <div style={{
                            marginTop: 'var(--espacioSm)',
                            fontSize: '0.8rem',
                            padding: '0.5rem',
                            borderRadius: 'var(--radio-sm, 4px)',
                            background: 'var(--fondoTerciario, #1a1a1a)',
                        }}>
                            {ctrl.mensajeRecorte}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};
