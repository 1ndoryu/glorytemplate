/**
 * Componente: HeaderPanel
 * Header minimalista exclusivo para el panel de usuario.
 * Solo muestra: logo, "Chat", "Salir" (estilo enlaceNavegacionWrapper), y foto de usuario.
 * No incluye la navegacion principal del sitio.
 */
import React from 'react';
import {obtenerUsuarioActual} from '../../data/panel';
import {Logo} from '../ui/Logo';
import './HeaderPanel.css';

export const HeaderPanel: React.FC = () => {
    const usuario = obtenerUsuarioActual();
    const avatarUrl = usuario?.avatar || 'https://i.pravatar.cc/40?u=default';

    return (
        <header className="headerPanel" role="banner">
            <div className="headerPanelContenedor">
                {/* Logo */}
                <a href="/" className="headerPanelLogo" aria-label="Nakomi - Ir al inicio">
                    <Logo className="headerPanelLogoSvg" />
                </a>

                {/* Acciones: Chat, Salir, Avatar */}
                <div className="headerPanelAcciones">
                    <a href="/contacto/" className="headerPanelEnlace">
                        Chat
                    </a>
                    <a href="/" className="headerPanelEnlace">
                        Salir
                    </a>
                    <div className="headerPanelAvatar">
                        <img src={avatarUrl} alt="Tu perfil" className="headerPanelAvatarImg" />
                    </div>
                </div>
            </div>
        </header>
    );
};
