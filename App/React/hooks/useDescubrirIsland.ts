/*
 * Hook: useDescubrirIsland (QQ88)
 * Lógica extraída de DescubrirIsland para cumplir SRP (max 3 useState en componente).
 * Gestiona ordenamiento, filtros avanzados, panel lateral y proveedor de FeedSamples.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { obtenerFeed } from '@app/services/apiSamples';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useAuthStore } from '@app/stores/authStore';
import { useHistorialIds } from '@app/hooks/useHistorialIds';
import { useFiltroIds } from '@app/hooks/useFiltroIds';
import { useUrlFiltros } from '@app/hooks/useUrlFiltros';
import { getT } from '@app/utils/i18n';

const TABS_DESCUBRIR = [{ id: 'descubrir', etiqueta: 'Explorar' }];

export const useDescubrirIsland = () => {
    const t = getT();
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [totalServidor, setTotalServidor] = useState<number | null>(null);
    const [conteoFiltrado, setConteoFiltrado] = useState(0);

    const autenticado = useAuthStore(s => s.autenticado);
    const busqueda = useFiltrosStore(s => s.busqueda);
    const ordenamiento = useFiltrosStore(s => s.ordenamiento);
    const periodoDestacados = useFiltrosStore(s => s.periodoDestacados);
    const yaReproducidos = useFiltrosStore(s => s.yaReproducidos);
    const likeados = useFiltrosStore(s => s.likeados);
    const deSeguidos = useFiltrosStore(s => s.deSeguidos);
    const descargados = useFiltrosStore(s => s.descargados);
    const setOrdenamiento = useFiltrosStore(s => s.setOrdenamiento);
    const setPeriodoDestacados = useFiltrosStore(s => s.setPeriodoDestacados);
    const habilitarPanel = usePanelLateralStore(s => s.habilitar);
    const deshabilitarPanel = usePanelLateralStore(s => s.deshabilitar);

    useUrlFiltros('DescubrirIsland', 'descubrir');

    /* Filtros avanzados solo para autenticados */
    const { idsReproducidos } = useHistorialIds(autenticado && yaReproducidos);
    const { idsLikeados, idsDescargados, idsSeguidos } = useFiltroIds(
        autenticado && likeados,
        autenticado && descargados,
        autenticado && deSeguidos
    );

    const idsExcluidosCombinados = useMemo(() => {
        if (!autenticado) return undefined;
        const set = new Set<number>();
        if (yaReproducidos) idsReproducidos.forEach((id) => set.add(id));
        if (likeados) idsLikeados.forEach((id) => set.add(id));
        if (descargados) idsDescargados.forEach((id) => set.add(id));
        return set.size > 0 ? set : undefined;
    }, [autenticado, yaReproducidos, idsReproducidos, likeados, idsLikeados, descargados, idsDescargados]);

    useTabsIsla('DescubrirIsland', TABS_DESCUBRIR, 'descubrir');

    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'DescubrirIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    const proveedor = useCallback(async (pagina: number) => {
        const tipo = ordenamiento === 'recientes' ? 'recientes'
            : ordenamiento === 'destacados' ? 'trending'
            : 'descubrir';
        /* [183A-65] Pasar busqueda al API para que el endpoint filtre */
        const resp = await obtenerFeed(tipo, pagina, busqueda);
        if (resp.total != null) setTotalServidor(resp.total);
        return { ok: resp.ok, data: resp.ok && resp.data ? resp.data : [] };
    }, [ordenamiento, busqueda]);

    /* QL24: Resetear totalServidor al cambiar ordenamiento */
    useEffect(() => {
        setTotalServidor(null);
    }, [ordenamiento]);

    const claveCache = `descubrir_${ordenamiento}_${periodoDestacados}_${busqueda}`;

    const obtenerEtiquetaOrden = useCallback((): string => {
        if (ordenamiento === 'destacados') {
            return periodoDestacados === 'mes' ? t('feed.orden.topMensual') : t('feed.orden.topSemanal');
        }
        return ordenamiento === 'recientes' ? t('feed.orden.recientes') : t('feed.orden.inteligente');
    }, [ordenamiento, periodoDestacados, t]);

    return {
        filtrosAbierto,
        setFiltrosAbierto,
        menuOrdenamiento,
        setMenuOrdenamiento,
        totalServidor,
        conteoFiltrado,
        setConteoFiltrado,
        autenticado,
        busqueda,
        ordenamiento,
        periodoDestacados,
        setOrdenamiento,
        setPeriodoDestacados,
        deSeguidos,
        idsSeguidos,
        idsExcluidosCombinados,
        proveedor,
        claveCache,
        obtenerEtiquetaOrden,
    };
};
