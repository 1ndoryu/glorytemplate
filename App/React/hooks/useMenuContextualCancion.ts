/*
 * Hook: useMenuContextualCancion
 * Menu contextual para tarjetas de canciones (ExplorarCancionesIsland).
 * Items: ver cancion, copiar enlace, ver artista, abrir en WhoSampled.
 * Sigue el patron de useMenuContextualSample.
 */

import { useState, useCallback, type MouseEvent } from 'react';
import type { Cancion } from '@app/types/cancion';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useNavigationStore } from '@/core/router';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';

interface EstadoMenuCancion {
    abierto: boolean;
    x: number;
    y: number;
    cancion: Cancion | null;
}

interface RetornoMenuCancion {
    estado: EstadoMenuCancion;
    items: MenuItemDef[];
    abrirMenu: (e: MouseEvent, cancion: Cancion) => void;
    cerrarMenu: () => void;
}

export const useMenuContextualCancion = (): RetornoMenuCancion => {
    const [estado, setEstado] = useState<EstadoMenuCancion>({
        abierto: false,
        x: 0,
        y: 0,
        cancion: null,
    });

    const navegar = useNavigationStore(s => s.navegar);

    const abrirMenu = useCallback((e: MouseEvent, cancion: Cancion) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({
            abierto: true,
            x: e.clientX,
            y: e.clientY,
            cancion,
        });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado(prev => ({ ...prev, abierto: false }));
    }, []);

    const items: MenuItemDef[] = estado.cancion
        ? construirItems(estado.cancion, navegar)
        : [];

    return { estado, items, abrirMenu, cerrarMenu };
};

function construirItems(
    cancion: Cancion,
    navegar: (ruta: string) => void,
): MenuItemDef[] {
    const t = getT();
    const hrefCancion = `/cancion/${cancion.slug}`;
    const items: MenuItemDef[] = [
        {
            id: 'ver-cancion',
            etiqueta: t('cancion.menu.verCancion'),
            href: hrefCancion,
            onClick: () => navegar(hrefCancion),
        },
        {
            id: 'copiar-enlace',
            etiqueta: t('cancion.menu.copiarEnlace'),
            onClick: () => {
                const url = `${window.location.origin}${hrefCancion}`;
                copiarAlPortapapeles(url);
                toast.exito(t('cancion.toast.enlaceCopiado'));
            },
        },
    ];

    if (cancion.artistaSlug) {
        const hrefArtista = `/artista/${cancion.artistaSlug}`;
        items.push({
            id: 'ver-artista',
            etiqueta: t('cancion.menu.verArtista'),
            href: hrefArtista,
            onClick: () => navegar(hrefArtista),
        });
    }

    if (cancion.whosampledUrl) {
        items.push({
            id: 'abrir-whosampled',
            etiqueta: t('cancion.menu.abrirWhoSampled'),
            separadorDespues: false,
            onClick: () => {
                window.open(cancion.whosampledUrl!, '_blank', 'noopener,noreferrer');
            },
        });
    }

    return items;
}
