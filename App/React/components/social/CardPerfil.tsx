/*
 * Componente: CardPerfil — Kamples
 * Mini card de perfil estilo Threads.
 * Aparece al hacer clic en el icono de seguir sobre el avatar de un post.
 * Muestra: avatar grande, nombre, username, bio, seguidores, botón seguir.
 * Logica en useCardPerfil (SRP).
 */

import Avatar from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import Badge from '@app/components/ui/Badge';
import { useCardPerfil } from '@app/hooks/useCardPerfil';
import '../../styles/componentes/cardPerfil.css';

interface CardPerfilProps {
    username: string;
    onCerrar: () => void;
    onNavegar: (ruta: string) => void;
}

export function CardPerfil({ username, onCerrar, onNavegar }: CardPerfilProps) {
    const { perfil, cargando, siguiendo, cardRef, esPropio, manejarSeguir, irAPerfil } =
        useCardPerfil({ username, onCerrar, onNavegar });

    return (
        /* sentinel-disable-next-line componente-artesanal — popover posicionado, no un modal centrado. Modal lo centraria incorrectamente. */
        <div className="cardPerfilOverlay" onClick={onCerrar} aria-hidden="true">
        <div
            ref={cardRef}
            className="cardPerfil"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Perfil de ${username}`}
        >
            {cargando ? (
                <div className="cardPerfilCargando">Cargando...</div>
            ) : !perfil ? (
                <div className="cardPerfilCargando">No disponible</div>
            ) : (
                <>
                    <div className="cardPerfilCabecera">
                        <div className="cardPerfilTextos">
                            <BotonBase variante="ghost" className="cardPerfilNombreBtn" onClick={irAPerfil}>
                                <span className="cardPerfilNombre">
                                    {perfil.nombreVisible}
                                    {perfil.verificado && <Badge variante="acento" tamano="xs">✓</Badge>}
                                </span>
                            </BotonBase>
                            <span className="cardPerfilUsername">@{perfil.username}</span>
                        </div>
                        <BotonBase variante="ghost" className="cardPerfilAvatarBtn" onClick={irAPerfil} aria-label="Ver perfil">
                            <Avatar src={perfil.avatarUrl} nombre={perfil.nombreVisible} tamano="lg" />
                        </BotonBase>
                    </div>

                    {perfil.bio && (
                        <p className="cardPerfilBio">{perfil.bio}</p>
                    )}

                    <span className="cardPerfilSeguidores">
                        {(perfil.totalSeguidores ?? 0).toLocaleString('es')} seguidores
                    </span>

                    {!esPropio && (
                        <BotonBase
                            variante={siguiendo ? 'secundario' : 'primario'}
                            className="cardPerfilSeguirBtn"
                            onClick={manejarSeguir}
                        >
                            {siguiendo ? 'Siguiendo' : 'Seguir'}
                        </BotonBase>
                    )}
                </>
            )}
        </div>
        </div>
    );
}
