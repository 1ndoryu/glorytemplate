/*
 * Isla: PublicacionIsland — Kamples
 * Página de detalle de una publicación individual.
 * Muestra el post completo con comentarios expandidos.
 * Lógica extraída a usePublicacionDetalle (SRP).
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { TarjetaPublicacion } from '@app/components/social/TarjetaPublicacion';
import { ListaComentarios } from '@app/components/social/ListaComentarios';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { BotonBase } from '@app/components/ui/BotonBase';
import { SkeletonTarjetaPublicacion } from '@app/components/skeletons';
import { useComentarios } from '@app/hooks/useComentarios';
import { usePublicacionDetalle } from '@app/hooks/usePublicacionDetalle';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import '../../styles/componentes/publicacionDetalle.css';

interface PublicacionIslandProps {
    publicacionId?: string;
}

const PublicacionBase = ({ publicacionId: idProp }: PublicacionIslandProps): JSX.Element => {
    const idFallback = Number(idProp) || 0;

    const {
        publicacion, publicacionId, cargando, error, navegar,
        menuSample, menuPublicacion,
        manejarLike, manejarLikeSample, manejarRepost,
    } = usePublicacionDetalle({ publicacionIdProp: idFallback });

    /* Comentarios siempre visibles en página de detalle */
    const [comentariosVisibles, setComentariosVisibles] = useState(true);
    /* Usar publicacionId resuelto desde URL (correcto en SPA), no la prop PHP */
    const seccionComentarios = useComentarios({
        tipo: 'publicacion',
        targetId: publicacionId,
        cargarAlAbrir: true,
    });

    const manejarToggleComentarios = useCallback(() => {
        setComentariosVisibles(prev => {
            const siguiente = !prev;
            if (siguiente && seccionComentarios.comentarios.length === 0) {
                seccionComentarios.cargar(1);
            }
            return siguiente;
        });
    }, [seccionComentarios]);

    if (cargando) {
        return (
            <div className="publicacionDetalleContenedor" id="seccionPublicacionDetalle">
                <SkeletonTarjetaPublicacion />
            </div>
        );
    }

    if (error || !publicacion) {
        return (
            <div className="publicacionDetalleContenedor" id="seccionPublicacionDetalle">
                <div className="publicacionDetalleError">
                    <AlertCircle size={40} />
                    <p>{error || 'Publicación no encontrada.'}</p>
                    <BotonBase variante="ghost" className="botonVolver" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} /> Volver
                    </BotonBase>
                </div>
            </div>
        );
    }

    return (
        <div className="publicacionDetalleContenedor" id="seccionPublicacionDetalle">
            <div className="publicacionDetalleCabecera">
                <BotonBase
                    variante="ghost"
                    className="botonVolver"
                    onClick={() => window.history.back()}
                    aria-label="Volver"
                >
                    <ArrowLeft size={18} />
                    <span>Volver</span>
                </BotonBase>
            </div>

            <TarjetaPublicacion
                publicacion={publicacion}
                onLike={(postId, reaccion) => manejarLike(postId, reaccion)}
                onComentar={() => manejarToggleComentarios()}
                onRepost={(postId) => manejarRepost(postId)}
                onClickAutor={(username) => navegar(`/perfil/${username}/`)}
                onMenu={(e, pub) => menuPublicacion.abrirMenu(e, pub)}
                onLikeSample={manejarLikeSample}
                onMenuSample={menuSample.abrirMenu}
                onClickCreadorSample={(u) => navegar(`/perfil/${u}/`)}
                mostrarCeroConteo
            >
                {comentariosVisibles && (
                    <ListaComentarios
                        comentarios={seccionComentarios.comentarios}
                        cargando={seccionComentarios.cargando}
                        onEnviar={seccionComentarios.enviar}
                        onEnviarMultimedia={seccionComentarios.enviarMultimedia}
                        onClickAutor={(u) => navegar(`/perfil/${u}/`)}
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
                )}
            </TarjetaPublicacion>

            <MenuContextual
                abierto={menuPublicacion.estado.abierto}
                onCerrar={menuPublicacion.cerrarMenu}
                items={menuPublicacion.items}
                x={menuPublicacion.estado.x}
                y={menuPublicacion.estado.y}
            />
            <MenuContextual
                abierto={menuSample.estado.abierto}
                onCerrar={menuSample.cerrarMenu}
                items={menuSample.items}
                x={menuSample.estado.x}
                y={menuSample.estado.y}
            />
        </div>
    );
};

export const PublicacionIsland = conAutenticacion(PublicacionBase);
export default PublicacionIsland;
