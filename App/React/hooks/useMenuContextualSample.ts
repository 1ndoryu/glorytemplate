/*
 * Hook: useMenuContextualSample — Kamples (Fase 2.9)
 * Gestiona la apertura, posición y acciones del menú contextual en samples.
 * Reutilizable en cualquier lista que muestre TarjetaSample.
 */

import { useState, useCallback, type MouseEvent } from 'react';
import type { SampleResumen } from '@app/types';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useNavigationStore } from '@/core/router';
import { useReproductorStore } from '@app/stores/reproductorStore';

interface EstadoMenuSample {
    abierto: boolean;
    x: number;
    y: number;
    sample: SampleResumen | null;
}

interface RetornoMenuSample {
    estado: EstadoMenuSample;
    items: MenuItemDef[];
    abrirMenu: (e: MouseEvent, sample: SampleResumen) => void;
    cerrarMenu: () => void;
}

export const useMenuContextualSample = (): RetornoMenuSample => {
    const [estado, setEstado] = useState<EstadoMenuSample>({
        abierto: false,
        x: 0,
        y: 0,
        sample: null,
    });

    const { navegar } = useNavigationStore();
    const { setSample } = useReproductorStore();

    const abrirMenu = useCallback((e: MouseEvent, sample: SampleResumen) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({
            abierto: true,
            x: e.clientX,
            y: e.clientY,
            sample,
        });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado((prev) => ({ ...prev, abierto: false }));
    }, []);

    /* Acciones del menú — se arman dinámicamente */
    const items: MenuItemDef[] = estado.sample
        ? [
            {
                id: 'reproducir',
                etiqueta: 'Reproducir',
                onClick: () => {
                    if (estado.sample) setSample(estado.sample);
                },
            },
            {
                id: 'detalle',
                etiqueta: 'Ver detalle',
                onClick: () => {
                    if (estado.sample) navegar(`/sample/${estado.sample.slug}`);
                },
                separadorDespues: true,
            },
            {
                id: 'coleccion',
                etiqueta: 'Añadir a colección',
                onClick: () => {
                    /* TO-DO: abrir modal de colecciones (Fase 5) */
                },
            },
            {
                id: 'cola',
                etiqueta: 'Añadir a la cola',
                onClick: () => {
                    /* TO-DO: implementar cola de reproducción */
                },
                separadorDespues: true,
            },
            {
                id: 'creador',
                etiqueta: `Ir a ${estado.sample.creador.nombreVisible || estado.sample.creador.username}`,
                onClick: () => {
                    if (estado.sample) navegar(`/perfil/${estado.sample.creador.username}`);
                },
            },
            {
                id: 'compartir',
                etiqueta: 'Copiar enlace',
                onClick: () => {
                    if (estado.sample) {
                        navigator.clipboard.writeText(
                            `${window.location.origin}/sample/${estado.sample.slug}`
                        );
                    }
                },
                separadorDespues: true,
            },
            {
                id: 'reportar',
                etiqueta: 'Reportar',
                peligro: true,
                onClick: () => {
                    /* TO-DO: modal de reporte */
                },
            },
        ]
        : [];

    return { estado, items, abrirMenu, cerrarMenu };
};
