/*
 * Componente: TooltipPerfil — Kamples
 * Hover card de perfil estilo Twitter/X.
 * Se muestra al pasar el cursor sobre el nombre del usuario en publicaciones.
 * Flotante sin overlay oscuro, posicionado relativo al elemento trigger.
 * Montado globalmente en LayoutPrincipal, lee estado de tooltipPerfilStore.
 */

import Avatar from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { BadgeCheck } from 'lucide-react';
import { useTooltipPerfil } from '@app/hooks/useTooltipPerfil';
import { usePosicionTooltipPerfil } from '@app/hooks/usePosicionTooltipPerfil';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/tooltipPerfil.css';

export function TooltipPerfil() {
    const {
        username, ancla, perfil, cargando, siguiendo, esPropio,
        tooltipRef, manejarSeguir, irAPerfil,
        onTooltipMouseEnter, onTooltipMouseLeave,
    } = useTooltipPerfil();

    const posicion = usePosicionTooltipPerfil(ancla, tooltipRef);

    const { t } = useT();

    if (!username) return null;

    return (
        /* sentinel-disable-next-line componente-artesanal — tooltip posicionado, no un modal centrado */
        <div
            ref={tooltipRef}
            className="tooltipPerfil"
            style={{ top: posicion.top, left: posicion.left }}
            onMouseEnter={onTooltipMouseEnter}
            onMouseLeave={onTooltipMouseLeave}
            role="tooltip"
            aria-label={`Perfil de ${username}`}
        >
            {cargando ? (
                <div className="tooltipPerfilCargando">{t('perfil.cargando')}</div>
            ) : !perfil ? (
                <div className="tooltipPerfilCargando">{t('perfil.noDisponible')}</div>
            ) : (
                <>
                    <div className="tooltipPerfilCabecera">
                        <div className="tooltipPerfilTextos">
                            <BotonBase variante="ghost" className="tooltipPerfilNombreBtn" onClick={irAPerfil}>
                                <span className="tooltipPerfilNombre">
                                    {perfil.nombreVisible}
                                    {perfil.verificado && <BadgeCheck size={14} className="tooltipVerificado" />}
                                </span>
                            </BotonBase>
                            <span className="tooltipPerfilUsername">@{perfil.username}</span>
                        </div>
                        <BotonBase variante="ghost" className="tooltipPerfilAvatarBtn" onClick={irAPerfil} aria-label="Ver perfil">
                            <Avatar src={perfil.avatarUrl} nombre={perfil.nombreVisible} tamano="lg" />
                        </BotonBase>
                    </div>

                    {perfil.bio && (
                        <p className="tooltipPerfilBio">{perfil.bio}</p>
                    )}

                    <span className="tooltipPerfilSeguidores">
                        {(perfil.totalSeguidores ?? 0).toLocaleString('es')} {t('perfil.seguidores')}
                    </span>

                    {!esPropio && (
                        <BotonBase
                            variante={siguiendo ? 'secundario' : 'primario'}
                            className="tooltipPerfilSeguirBtn"
                            onClick={manejarSeguir}
                        >
                            {siguiendo ? t('comun.siguiendo') : t('comun.seguir')}
                        </BotonBase>
                    )}
                </>
            )}
        </div>
    );
}
