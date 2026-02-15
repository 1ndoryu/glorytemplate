/*
 * Hook: useMenuContextualSample — Kamples (Fase 2.9)
 * Gestiona la apertura, posición y acciones del menú contextual en samples.
 * Reutilizable en cualquier lista que muestre TarjetaSample.
 */

import { useState, useCallback, useMemo, type MouseEvent } from 'react';
import type { SampleResumen } from '@app/types';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useNavigationStore } from '@/core/router';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { useAuthStore } from '@app/stores/authStore';
import { eliminarSample } from '@app/services/apiSamples';

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
    /* Sample seleccionado para inspección — null si no hay */
    sampleInspeccion: SampleResumen | null;
    cerrarInspeccion: () => void;
}

export const useMenuContextualSample = (): RetornoMenuSample => {
    const [estado, setEstado] = useState<EstadoMenuSample>({
        abierto: false,
        x: 0,
        y: 0,
        sample: null,
    });
    const [sampleInspeccion, setSampleInspeccion] = useState<SampleResumen | null>(null);

    const { navegar } = useNavigationStore();
    const { setSample, agregarACola } = useReproductorStore();
    const { abrir: abrirColeccionPicker } = useColeccionPickerStore();
    const { usuario } = useAuthStore();

    /* El usuario puede eliminar si es propietario del sample o admin */
    const puedeEliminar = useMemo(() => {
        if (!usuario || !estado.sample) return false;
        const esPropietario = usuario.id === estado.sample.creador.id;
        const esAdmin = usuario.rol === 'admin';
        return esPropietario || esAdmin;
    }, [usuario, estado.sample]);

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

    const cerrarInspeccion = useCallback(() => {
        setSampleInspeccion(null);
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
                href: estado.sample ? `/sample/${estado.sample.slug}/` : undefined,
                onClick: () => {
                    if (estado.sample) navegar(`/sample/${estado.sample.slug}/`);
                },
                separadorDespues: true,
            },
            {
                id: 'coleccion',
                etiqueta: 'Añadir a colección',
                onClick: () => {
                    if (estado.sample) abrirColeccionPicker(estado.sample);
                },
            },
            {
                id: 'cola',
                etiqueta: 'Añadir a la cola',
                onClick: () => {
                    if (estado.sample) agregarACola(estado.sample);
                },
                separadorDespues: true,
            },
            {
                id: 'creador',
                etiqueta: `Ir a ${estado.sample.creador.nombreVisible || estado.sample.creador.username}`,
                href: estado.sample ? `/perfil/${estado.sample.creador.username}/` : undefined,
                onClick: () => {
                    if (estado.sample) navegar(`/perfil/${estado.sample.creador.username}/`);
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
                id: 'inspeccionar',
                etiqueta: 'Inspeccionar datos',
                onClick: () => {
                    if (estado.sample) setSampleInspeccion(estado.sample);
                },
            },
            ...(puedeEliminar
                ? [
                    {
                        id: 'eliminar',
                        etiqueta: 'Eliminar sample',
                        peligro: true,
                        separadorAntes: true,
                        onClick: async () => {
                            if (!estado.sample) return;
                            const confirmar = window.confirm(
                                `¿Estás seguro de eliminar "${estado.sample.titulo}"? Esta acción no se puede deshacer.`
                            );
                            if (!confirmar) return;
                            const resp = await eliminarSample(estado.sample.id);
                            if (resp.ok) {
                                /* Recargar la página para reflejar el cambio */
                                window.location.reload();
                            }
                        },
                    } as MenuItemDef,
                ]
                : []),
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

    return { estado, items, abrirMenu, cerrarMenu, sampleInspeccion, cerrarInspeccion };
};
