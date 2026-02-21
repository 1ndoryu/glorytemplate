/*
 * SampleDetalleAcciones — botones de interacción del detalle de sample.
 * Extraído de SampleDetalleIsland para cumplir límite de 300 líneas (SRP).
 */

import { Heart, MessageCircle, Download, Lock, MoreHorizontal } from 'lucide-react';
import { TooltipReacciones } from '@app/components/ui/TooltipReacciones';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { useComentarios } from '@app/hooks/useComentarios';
import type { TipoReaccion, SampleResumen } from '@app/types';

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
    onAbrirMenu, sample,
    seccionComentarios, onClickAutorComentario,
}: SampleDetalleAccionesProps): JSX.Element {
    return (
        <>
            <div className="detalleAcciones">
                <TooltipReacciones
                    reaccionActual={reaccionActual}
                    onReaccionar={onReaccionar}
                    onQuitar={onQuitarReaccion}
                >
                    <button
                        className={`detalleAccionPlano ${liked ? 'detalleAccionPlanoActivo' : ''} ${
                            reaccionActual === 'encanta' ? 'reaccionPrincipalEncanta' :
                            reaccionActual === 'dislike' ? 'reaccionPrincipalDislike' : ''
                        }`}
                        onClick={onLike}
                        type="button"
                        aria-label={liked ? 'Quitar like' : 'Dar like'}
                    >
                        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                    </button>
                </TooltipReacciones>

                <button
                    className="detalleAccionPlano"
                    onClick={onToggleComentarios}
                    type="button"
                    aria-label="Comentarios"
                >
                    <MessageCircle size={18} />
                </button>

                <button
                    className={`detalleAccionPlano ${descargado ? 'detalleAccionPlanoDescargado' : ''}`}
                    onClick={onDescargar}
                    type="button"
                    aria-label="Descargar sample"
                >
                    <Download size={18} />
                </button>

                {esPremiumBloqueado && (
                    <button
                        className="detalleAccionPlano detalleAccionPlanoActivo"
                        onClick={onAbrirPlanes}
                        type="button"
                        aria-label="Requiere plan Pro"
                    >
                        <Lock size={18} />
                    </button>
                )}

                {/* C127: Menú de 3 puntos para el sample principal */}
                <button
                    className="detalleAccionPlano"
                    onClick={(e) => onAbrirMenu(e as React.MouseEvent, sample)}
                    type="button"
                    aria-label="Más opciones"
                >
                    <MoreHorizontal size={18} />
                </button>
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
