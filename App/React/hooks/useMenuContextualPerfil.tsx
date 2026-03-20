/*
 * Hook: useMenuContextualPerfil — Kamples (QQ23 + QQ57)
 * Gestiona menu contextual de 3 puntos en perfiles.
 * Modo propietario: Configuración + Papelera.
 * Modo visitante: Reportar + Bloquear/Desbloquear.
 */

import { useState, useCallback, useMemo, type MouseEvent } from 'react';
import { Flag, ShieldAlert, ShieldOff, Settings, Trash2 } from 'lucide-react';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useReportarStore } from '@app/stores/reportarStore';
import { useBloqueosStore } from '@app/stores/bloqueosStore';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { usePapeleraStore } from '@app/stores/papeleraStore';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

interface EstadoMenuPerfil {
    abierto: boolean;
    x: number;
    y: number;
}

interface DatosUsuarioPerfil {
    id: number;
    username: string;
}

interface OpcionesMenuPerfil {
    usuario: DatosUsuarioPerfil | null;
    esPropietario: boolean;
}

interface RetornoMenuPerfil {
    estado: EstadoMenuPerfil;
    items: MenuItemDef[];
    abrirMenu: (e: MouseEvent) => void;
    cerrarMenu: () => void;
}

export const useMenuContextualPerfil = ({ usuario, esPropietario }: OpcionesMenuPerfil): RetornoMenuPerfil => {
    const [estado, setEstado] = useState<EstadoMenuPerfil>({
        abierto: false,
        x: 0,
        y: 0,
    });

    /* Stores para modo visitante */
    const abrirReporte = useReportarStore(s => s.abrir);
    const bloquear = useBloqueosStore(s => s.bloquear);
    const desbloquear = useBloqueosStore(s => s.desbloquear);
    const estaBloqueado = useBloqueosStore(s => s.estaBloqueado);

    /* Stores para modo propietario */
    const abrirConfiguracion = useConfiguracionModalStore(s => s.abrir);
    const abrirPapelera = usePapeleraStore(s => s.abrir);

    const bloqueado = useMemo(() => {
        if (!usuario || esPropietario) return false;
        return estaBloqueado(usuario.id);
    }, [usuario, esPropietario, estaBloqueado]);

    const abrirMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({ abierto: true, x: e.clientX, y: e.clientY });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado(prev => ({ ...prev, abierto: false }));
    }, []);

    const items = useMemo((): MenuItemDef[] => {
        const t = getT();
        /* Modo propietario: configuración + papelera */
        if (esPropietario) {
            return [
                {
                    id: 'configuracion',
                    etiqueta: t('topbar.configuracion'),
                    icono: <Settings size={16} />,
                    separadorDespues: true,
                    onClick: () => { abrirConfiguracion(); },
                },
                {
                    id: 'papelera',
                    etiqueta: t('menu.papelera'),
                    icono: <Trash2 size={16} />,
                    onClick: () => { abrirPapelera(); },
                },
            ];
        }

        /* Modo visitante: reportar + bloquear */
        if (!usuario) return [];
        const result: MenuItemDef[] = [];

        result.push({
            id: 'reportar',
            etiqueta: t('comun.reportar'),
            icono: <Flag size={16} />,
            peligro: true,
            separadorDespues: true,
            onClick: () => {
                abrirReporte('usuario', usuario.id, usuario.username);
            },
        });

        if (bloqueado) {
            result.push({
                id: 'desbloquear',
                etiqueta: t('comun.desbloquear'),
                icono: <ShieldOff size={16} />,
                onClick: async () => {
                    await desbloquear(usuario.id);
                    toast.exito(`Has desbloqueado a @${usuario.username}`);
                },
            });
        } else {
            result.push({
                id: 'bloquear',
                etiqueta: t('comun.bloquear'),
                icono: <ShieldAlert size={16} />,
                peligro: true,
                onClick: async () => {
                    await bloquear(usuario.id);
                    toast.exito(`Has bloqueado a @${usuario.username}`);
                },
            });
        }

        return result;
    }, [esPropietario, usuario, bloqueado, abrirReporte, bloquear, desbloquear, abrirConfiguracion, abrirPapelera]);

    return { estado, items, abrirMenu, cerrarMenu };
};
