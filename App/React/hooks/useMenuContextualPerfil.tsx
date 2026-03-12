/*
 * Hook: useMenuContextualPerfil — Kamples (QQ23)
 * Gestiona menu contextual de 3 puntos en perfiles de otros usuarios.
 * Acciones: Reportar usuario, Bloquear/Desbloquear.
 */

import { useState, useCallback, useMemo, type MouseEvent } from 'react';
import { Flag, ShieldAlert, ShieldOff } from 'lucide-react';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useReportarUsuarioStore } from '@app/stores/reportarUsuarioStore';
import { useBloqueosStore } from '@app/stores/bloqueosStore';
import { toast } from '@app/stores/toastStore';

interface EstadoMenuPerfil {
    abierto: boolean;
    x: number;
    y: number;
}

interface DatosUsuarioPerfil {
    id: number;
    username: string;
}

interface RetornoMenuPerfil {
    estado: EstadoMenuPerfil;
    items: MenuItemDef[];
    abrirMenu: (e: MouseEvent) => void;
    cerrarMenu: () => void;
}

export const useMenuContextualPerfil = (usuario: DatosUsuarioPerfil | null): RetornoMenuPerfil => {
    const [estado, setEstado] = useState<EstadoMenuPerfil>({
        abierto: false,
        x: 0,
        y: 0,
    });

    const abrirReporte = useReportarUsuarioStore(s => s.abrir);
    const bloquear = useBloqueosStore(s => s.bloquear);
    const desbloquear = useBloqueosStore(s => s.desbloquear);
    const estaBloqueado = useBloqueosStore(s => s.estaBloqueado);

    const bloqueado = useMemo(() => {
        if (!usuario) return false;
        return estaBloqueado(usuario.id);
    }, [usuario, estaBloqueado]);

    const abrirMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado(prev => ({ ...prev, abierto: false }));
    }, []);

    const items = useMemo((): MenuItemDef[] => {
        if (!usuario) return [];
        const result: MenuItemDef[] = [];

        result.push({
            id: 'reportar',
            etiqueta: 'Reportar',
            icono: <Flag size={16} />,
            peligro: true,
            separadorDespues: true,
            onClick: () => {
                abrirReporte(usuario.id, usuario.username);
            },
        });

        if (bloqueado) {
            result.push({
                id: 'desbloquear',
                etiqueta: 'Desbloquear',
                icono: <ShieldOff size={16} />,
                onClick: async () => {
                    await desbloquear(usuario.id);
                    toast.exito(`Has desbloqueado a @${usuario.username}`);
                },
            });
        } else {
            result.push({
                id: 'bloquear',
                etiqueta: 'Bloquear',
                icono: <ShieldAlert size={16} />,
                peligro: true,
                onClick: async () => {
                    await bloquear(usuario.id);
                    toast.exito(`Has bloqueado a @${usuario.username}`);
                },
            });
        }

        return result;
    }, [usuario, bloqueado, abrirReporte, bloquear, desbloquear]);

    return { estado, items, abrirMenu, cerrarMenu };
};
