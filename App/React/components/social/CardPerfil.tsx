/*
 * Componente: CardPerfil — Kamples
 * Mini card de perfil estilo Threads.
 * Aparece al hacer clic en el icono de seguir sobre el avatar de un post.
 * Muestra: avatar grande, nombre, username, bio, seguidores, botón seguir.
 */

import { useState, useEffect, useRef } from 'react';
import Avatar from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import Badge from '@app/components/ui/Badge';
import { obtenerPerfil } from '@app/services/apiAuth';
import { seguirUsuario, dejarDeSeguir } from '@app/services/apiSocial';
import { useAuthStore } from '@app/stores/authStore';
import type { Usuario } from '@app/types/usuario';
import '../../styles/componentes/cardPerfil.css';

interface CardPerfilProps {
    username: string;
    posicion: { x: number; y: number };
    onCerrar: () => void;
    onNavegar: (ruta: string) => void;
}

export function CardPerfil({ username, posicion, onCerrar, onNavegar }: CardPerfilProps) {
    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [siguiendo, setSiguiendo] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const usuarioActual = useAuthStore(s => s.usuario);

    /* Cargar perfil al montar */
    useEffect(() => {
        let activo = true;
        setCargando(true);
        obtenerPerfil(username)
            .then(resp => {
                if (!activo) return;
                setPerfil(resp.data ?? null);
                setSiguiendo(resp.data?.siguiendo ?? false);
            })
            .catch(() => { /* sin-op */ })
            .finally(() => { if (activo) setCargando(false); });
        return () => { activo = false; };
    }, [username]);

    /* Cerrar al click fuera o Escape —
     * setTimeout 50ms para no capturar el mismo click que abrió la card */
    useEffect(() => {
        const manejarClick = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) onCerrar();
        };
        const manejarEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
        const id = setTimeout(() => {
            document.addEventListener('mousedown', manejarClick);
            document.addEventListener('keydown', manejarEscape);
        }, 50);
        return () => {
            clearTimeout(id);
            document.removeEventListener('mousedown', manejarClick);
            document.removeEventListener('keydown', manejarEscape);
        };
    }, [onCerrar]);

    const manejarSeguir = async () => {
        if (!perfil) return;
        const estabaS = siguiendo;
        setSiguiendo(!estabaS);
        try {
            const resp = estabaS
                ? await dejarDeSeguir(perfil.id)
                : await seguirUsuario(perfil.id);
            if (!resp.ok) setSiguiendo(estabaS);
        } catch {
            setSiguiendo(estabaS);
        }
    };

    const irAPerfil = () => {
        if (!perfil) return;
        onNavegar(`/perfil/${perfil.username}/`);
        onCerrar();
    };

    /* Ajustar posición para no salir del viewport */
    const ANCHO = 270;
    const estiloCard = {
        top: posicion.y + 8,
        left: Math.min(posicion.x, window.innerWidth - ANCHO - 16),
    };

    const esPropio = perfil && (
        String(perfil.wpUserId) === String(usuarioActual?.wpUserId) ||
        String(perfil.id) === String(usuarioActual?.id)
    );

    return (
        <div
            ref={cardRef}
            className="cardPerfil"
            style={estiloCard}
            role="dialog"
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
    );
}
