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
    const hrefCancion = `/cancion/${cancion.slug}`;
    const items: MenuItemDef[] = [
        {
            id: 'ver-cancion',
            etiqueta: 'Ver canción',
            href: hrefCancion,
            onClick: () => navegar(hrefCancion),
        },
        {
            id: 'copiar-enlace',
            etiqueta: 'Copiar enlace',
            onClick: () => {
                const url = `${window.location.origin}${hrefCancion}`;
                copiarAlPortapapeles(url);
                toast.exito('Enlace copiado');
            },
        },
    ];

    if (cancion.artistaSlug) {
        const hrefArtista = `/artista/${cancion.artistaSlug}`;
        items.push({
            id: 'ver-artista',
            etiqueta: 'Ver artista',
            href: hrefArtista,
            onClick: () => navegar(hrefArtista),
        });
    }

    if (cancion.whosampledUrl) {
        items.push({
            id: 'abrir-whosampled',
            etiqueta: 'Abrir en WhoSampled',
            separadorDespues: false,
            onClick: () => {
                window.open(cancion.whosampledUrl!, '_blank', 'noopener,noreferrer');
            },
        });
    }

    return items;
}
