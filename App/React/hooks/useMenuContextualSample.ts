/*
 * Hook: useMenuContextualSample — Kamples (Fase 2.9 + C800 + C801 + QQ68)
 * Gestiona la apertura, posicion y acciones del menu contextual en samples.
 * Reutilizable en cualquier lista que muestre TarjetaSample.
 * Items delegados a construirItemsMenuSample (SRP).
 */

import { useState, useCallback, useMemo, type MouseEvent } from 'react';
import type { SampleResumen } from '@app/types';
import type { MenuItemDef } from '@app/components/ui/MenuContextual';
import { useNavigationStore } from '@/core/router';
import { copiarAlPortapapeles } from '@app/services/clipboard';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useColeccionPickerStore } from '@app/stores/coleccionPickerStore';
import { useAuthStore } from '@app/stores/authStore';
import { useEditarModalStore } from '@app/stores/editarModalStore';
import { useCorregirIAStore } from '@app/stores/corregirIAStore';
import { useExtenderRecorteStore } from '@app/stores/extenderRecorteStore';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { construirItemsMenuSample } from '@app/utils/construirItemsMenuSample';
import { useCodigoGratisStore } from '@app/stores/codigoGratisStore';

/* Eventos globales para notificar cambios de samples sin recargar la página */
export const EVENTO_SAMPLE_ELIMINADO = 'kamples:sample-eliminado';
export const EVENTO_SAMPLE_RESTAURADO = 'kamples:sample-restaurado';
export const EVENTO_SAMPLE_ACTUALIZADO = 'kamples:sample-actualizado';
export const EVENTO_SAMPLE_CREADO = 'kamples:sample-creado';

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

    const navegar = useNavigationStore(s => s.navegar);
    const reproducir = useReproductorStore(s => s.reproducir);
    const abrirColeccionPicker = useColeccionPickerStore(s => s.abrir);
    const usuario = useAuthStore(s => s.usuario);
    const abrirEditarSample = useEditarModalStore(s => s.abrirSample);
    const abrirCorregirIA = useCorregirIAStore(s => s.abrir);
    const abrirExtenderRecorte = useExtenderRecorteStore(s => s.abrir);
    const abrirSugerencias = usePanelLateralStore(s => s.abrirSugerencias);
    const abrirDetalle = usePanelLateralStore(s => s.abrirDetalle);
    const obtenerCodigoParaSample = useCodigoGratisStore(s => s.obtenerCodigoParaSample);

    const puedeEditar = useMemo(() => {
        if (!usuario || !estado.sample) return false;
        return usuario.id === estado.sample.creador.id || usuario.rol === 'admin';
    }, [usuario, estado.sample]);

    const puedeEliminar = puedeEditar;

    const esAdmin = useMemo(() => usuario?.rol === 'admin', [usuario]);

    const abrirMenu = useCallback((e: MouseEvent, sample: SampleResumen) => {
        e.preventDefault();
        e.stopPropagation();
        setEstado({ abierto: true, x: e.clientX, y: e.clientY, sample });
    }, []);

    const cerrarMenu = useCallback(() => {
        setEstado((prev) => ({ ...prev, abierto: false }));
    }, []);

    const cerrarInspeccion = useCallback(() => setSampleInspeccion(null), []);

    const items: MenuItemDef[] = estado.sample
        ? construirItemsMenuSample({
            sample: estado.sample,
            navegar,
            reproducir,
            abrirColeccionPicker,
            abrirEditarSample,
            abrirCorregirIA,
            abrirExtenderRecorte,
            abrirSugerencias,
            abrirDetalle,
            copiarAlPortapapeles,
            setSampleInspeccion,
            puedeEditar,
            puedeEliminar,
            esAdmin,
            /* [183A-106] Pasar codigo gratis reclamado para este sample si existe */
            codigoGratis: estado.sample ? obtenerCodigoParaSample(estado.sample.id) : null,
        })
        : [];

    return { estado, items, abrirMenu, cerrarMenu, sampleInspeccion, cerrarInspeccion };
};
