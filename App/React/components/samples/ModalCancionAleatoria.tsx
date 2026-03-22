/*
 * Componente: ModalCancionAleatoria — Kamples
 * [223A-4][223A-3-E][223A-3-G] Modal de descubrimiento de canciones aleatorias.
 * Filtros de género y década via SelectFiltro. Muestra cancionDetalleTarjeta
 * con acciones: like, 3-puntos, siguiente, recorte, youtube (admin).
 */

import { Music, SkipForward, Scissors, Youtube, Loader2, Heart, MoreVertical } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { SelectFiltro } from '../ui/SelectFiltro';
import { MenuContextual } from '../ui/MenuContextual';
import { ModalContribucion } from './ModalContribucion';
import { ModalEdicionRelacion } from './ModalEdicionRelacion';
import type { useCancionAleatoria } from '@app/hooks/useCancionAleatoria';
import { useMenuCancionDetalle } from '@app/hooks/useMenuCancionDetalle';
import { useLikeCancion } from '@app/hooks/useLikeCancion';
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

    /* [223A-3-G] Like + menu contextual via hooks reutilizables */
    const { liked, likeando, toggleLike, autenticado } = useLikeCancion(cancion?.id, cancion?.liked ?? false);
    const menuCtx = useMenuCancionDetalle(detalle, autenticado);

    return (
        <Modal
            abierto={abierto}
            onCerrar={ctrl.cerrar}
            tamano="grande"
        >
            {/* [223A-3-E] Filtros género y década centrados arriba */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--espacioSm)', marginBottom: 'var(--espacioMd)', flexWrap: 'wrap' }}>
                {ctrl.generosDisponibles.length > 0 && (
                    <SelectFiltro
                        etiqueta="Género"
                        opciones={ctrl.generosDisponibles}
                        tagsIncluidos={ctrl.generosIncluidos}
                        tagsExcluidos={ctrl.generosExcluidos}
                        onIncluir={ctrl.incluirGenero}
                        onExcluir={ctrl.excluirGenero}
                        onQuitar={ctrl.quitarGenero}
                    />
                )}
                <SelectFiltro
                    etiqueta="Década"
                    opciones={ctrl.decadasDisponibles}
                    tagsIncluidos={ctrl.decadasIncluidas}
                    tagsExcluidos={ctrl.decadasExcluidas}
                    onIncluir={ctrl.incluirDecada}
                    onExcluir={ctrl.excluirDecada}
                    onQuitar={ctrl.quitarDecada}
                />
            </div>

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

                        {/* [223A-3-G] Acciones: like, 3-puntos, siguiente, recorte, youtube — solo iconos */}
                        <div className="cancionDetalleAcciones">
                            {autenticado && (
                                <>
                                    <BotonBase
                                        variante="ghost"
                                        tamano="ninguno"
                                        className={`cancionDetalleLikeBtn${liked ? ' cancionDetalleLikeBtnActiva' : ''}`}
                                        onClick={toggleLike}
                                        aria-label={liked ? 'Quitar like' : 'Dar like'}
                                        cargando={likeando}
                                    >
                                        <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                                    </BotonBase>
                                    <BotonBase
                                        variante="ghost"
                                        tamano="ninguno"
                                        className="cancionDetalleMenuBtn"
                                        onClick={menuCtx.abrirMenu}
                                        aria-label="Acciones"
                                    >
                                        <MoreVertical size={20} />
                                    </BotonBase>
                                </>
                            )}
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                className="cancionDetalleMenuBtn"
                                onClick={ctrl.siguiente}
                                disabled={cargando}
                                aria-label="Siguiente canción"
                            >
                                <SkipForward size={18} />
                            </BotonBase>
                            <BotonBase
                                variante="ghost"
                                tamano="ninguno"
                                className="cancionDetalleMenuBtn"
                                onClick={ctrl.generarRecorte}
                                disabled={ctrl.generandoRecorte || (detalle.samplesDe.length === 0 && detalle.sampleadaEn.length === 0)}
                                aria-label="Generar recorte"
                            >
                                {ctrl.generandoRecorte
                                    ? <Loader2 size={18} className="animacionGiro" />
                                    : <Scissors size={18} />
                                }
                            </BotonBase>
                            {ctrl.esAdmin && cancion.youtubeId && (
                                <BotonBase
                                    variante="ghost"
                                    tamano="ninguno"
                                    className="cancionDetalleMenuBtn"
                                    onClick={() => window.open(
                                        `https://www.youtube.com/watch?v=${cancion.youtubeId}`,
                                        '_blank',
                                        'noopener'
                                    )}
                                    aria-label="Abrir en YouTube"
                                >
                                    <Youtube size={18} />
                                </BotonBase>
                            )}
                        </div>
                    </div>

                    {/* [223A-3-C] YouTube embed con autoplay + timestamp de sampleo si existe */}
                    {cancion.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(cancion.youtubeId) && (() => {
                        /* Buscar primer timing disponible: fuente (samplesDe) o destino (sampleadaEn) */
                        const primerTiming = detalle.samplesDe.find(r => r.timingsFuente?.length > 0)?.timingsFuente[0]
                            ?? detalle.sampleadaEn.find(r => r.timingsDestino?.length > 0)?.timingsDestino[0]
                            ?? 0;
                        const startParam = primerTiming > 0 ? `&start=${Math.floor(primerTiming)}` : '';
                        return (
                            <div className="cancionDetalleYoutube" style={{ marginTop: 'var(--espacioMd)' }}>
                                <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${cancion.youtubeId}?autoplay=1${startParam}`}
                                    title={`${cancion.titulo} - YouTube`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                                    allowFullScreen
                                    style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 'var(--radio-md, 8px)' }}
                                />
                            </div>
                        );
                    })()}

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

            {/* [223A-3-G] Menu contextual + modals del 3-puntos */}
            <MenuContextual
                abierto={menuCtx.menuAbierto}
                onCerrar={menuCtx.cerrarMenu}
                items={menuCtx.items}
                x={menuCtx.menuPos.x}
                y={menuCtx.menuPos.y}
                alinearDerecha
            />
            {detalle && (
                <ModalContribucion
                    abierto={menuCtx.contribucionAbierta}
                    cancionBaseId={detalle.cancion.id}
                    cancionBaseTitulo={detalle.cancion.titulo}
                    onCerrar={menuCtx.cerrarContribucion}
                />
            )}
            <ModalEdicionRelacion
                relacion={menuCtx.relacionEditando}
                modoEliminacion={menuCtx.modoEliminacion}
                onCerrar={menuCtx.cerrarEdicionRelacion}
            />
        </Modal>
    );
};
