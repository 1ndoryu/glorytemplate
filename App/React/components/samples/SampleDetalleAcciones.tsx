/*
 * SampleDetalleAcciones — botones de interacción del detalle de sample.
 * Extraído de SampleDetalleIsland para cumplir límite de 300 líneas (SRP).
 */

import { Heart, MessageCircle, Download, Lock, MoreHorizontal, FolderTree } from 'lucide-react';
import { TooltipReacciones } from '@app/components/ui/TooltipReacciones';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useComentarios } from '@app/hooks/useComentarios';
import type { TipoReaccion, SampleResumen } from '@app/types';
import { useT } from '@app/utils/i18n/useT';
import { BotonBase } from '../ui/BotonBase';

type RetornoComentarios = ReturnType<typeof useComentarios>;

interface SampleDetalleAccionesProps {
    liked: boolean;
    reaccionActual: TipoReaccion | null;
    onLike: () => void;
    onReaccionar: (reaccion: TipoReaccion) => void;
    onQuitarReaccion: () => void;
    comentariosVisibles: boolean;
    onToggleComentarios: () => void;
    descargado: boolean;
    onDescargar: () => Promise<void>;
    esPremiumBloqueado: boolean;
    onAbrirPlanes: () => void;
    onAbrirColeccionOriginal?: () => void;
    nombreColeccionOriginal?: string | null;
    onAbrirMenu: (e: React.MouseEvent, sample: SampleResumen) => void;
    sample: SampleResumen;
    seccionComentarios: RetornoComentarios;
    onClickAutorComentario: (username: string) => void;
}

export function SampleDetalleAcciones({
    liked, reaccionActual, onLike, onReaccionar, onQuitarReaccion,
    comentariosVisibles, onToggleComentarios,
    descargado, onDescargar,
    esPremiumBloqueado, onAbrirPlanes,
    onAbrirColeccionOriginal, nombreColeccionOriginal,
    onAbrirMenu, sample,
    seccionComentarios, onClickAutorComentario,
}: SampleDetalleAccionesProps): JSX.Element {
    const { t } = useT();
    return (
        <>
            <div className="detalleAcciones">
                <TooltipReacciones
                    reaccionActual={reaccionActual}
                    onReaccionar={onReaccionar}
                    onQuitar={onQuitarReaccion}
                >
                    <BotonBase variante="ghost" tamano="ninguno"
                        className={`detalleAccionPlano ${liked ? 'detalleAccionPlanoActivo' : ''} ${
                            reaccionActual === 'encanta' ? 'reaccionPrincipalEncanta' :
                            reaccionActual === 'dislike' ? 'reaccionPrincipalDislike' : ''
                        }`}
                        onClick={onLike}
                        type="button"
                        aria-label={liked ? t('sample.quitarLike') : t('sample.darLike')}
                    >
                        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                    </BotonBase>
                </TooltipReacciones>

                <BotonBase variante="ghost" tamano="ninguno"
                    className="detalleAccionPlano"
                    onClick={onToggleComentarios}
                    type="button"
                    aria-label={t('sample.comentariosSeccion')}
                >
                    <MessageCircle size={18} />
                </BotonBase>

                <BotonBase variante="ghost" tamano="ninguno"
                    className={`detalleAccionPlano ${descargado ? 'detalleAccionPlanoDescargado' : ''}`}
                    onClick={onDescargar}
                    type="button"
                    aria-label={t('sample.menu.descargarArchivo')}
                >
                    <Download size={18} />
                </BotonBase>

                {onAbrirColeccionOriginal && nombreColeccionOriginal && (
                    <BotonBase variante="ghost" tamano="ninguno"
                        className="detalleAccionPlano"
                        onClick={onAbrirColeccionOriginal}
                        type="button"
                        aria-label={t('sample.detalle.abrirColeccionOriginal', { nombre: nombreColeccionOriginal })}
                        title={t('sample.detalle.abrirColeccionOriginal', { nombre: nombreColeccionOriginal })}
                    >
                        <FolderTree size={18} />
                    </BotonBase>
                )}

                {esPremiumBloqueado && (
                    <BotonBase variante="ghost" tamano="ninguno"
                        className="detalleAccionPlano detalleAccionPlanoActivo"
                        onClick={onAbrirPlanes}
                        type="button"
                        aria-label={t('sample.requierePlanPro')}
                    >
                        <Lock size={18} />
                    </BotonBase>
                )}

                {/* C127: Menú de 3 puntos para el sample principal */}
                <BotonBase variante="ghost" tamano="ninguno"
                    className="detalleAccionPlano"
                    onClick={(e) => onAbrirMenu(e as React.MouseEvent, sample)}
                    type="button"
                    aria-label={t('comun.masOpciones')}
                >
                    <MoreHorizontal size={18} />
                </BotonBase>
            </div>

            {/* Sección de comentarios — expandidos por defecto (C128) */}
            {comentariosVisibles && (
                <div className="detalleSeccion detalleComentariosSeccion">
                    <ListaComentarios
                        comentarios={seccionComentarios.comentarios}
                        cargando={seccionComentarios.cargando}
                        onEnviar={seccionComentarios.enviar}
                        onEnviarMultimedia={seccionComentarios.enviarMultimedia}
                        onClickAutor={onClickAutorComentario}
                        maxVisibles={5}
                        onCargarMas={seccionComentarios.cargarMas}
                        hayMasPaginas={seccionComentarios.hayMas}
                        onEditar={seccionComentarios.editar}
                        onEliminar={seccionComentarios.eliminar}
                        onReportar={seccionComentarios.reportar}
                        onToggleLike={seccionComentarios.toggleLike}
                        onCargarRespuestas={seccionComentarios.cargarRespuestas}
                        editandoId={seccionComentarios.editandoId}
                        setEditandoId={seccionComentarios.setEditandoId}
                        respondendoAId={seccionComentarios.respondendoAId}
                        setRespondendoAId={seccionComentarios.setRespondendoAId}
                    />
                </div>
            )}
        </>
    );
}
