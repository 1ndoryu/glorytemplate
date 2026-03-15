/*
 * InicioIsland — Kamples
 * Feed principal con ordenamientos (Inteligente/Recientes/Destacados).
 * Usa FeedSamples centralizado para la lista de samples.
 * Si el usuario no está autenticado, muestra LandingPublica.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, ArrowDownWideNarrow } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { SkeletonFeed } from '@app/components/skeletons';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { obtenerFeed } from '@app/services/apiSamples';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useHistorialIds } from '@app/hooks/useHistorialIds';
import { useFiltroIds } from '@app/hooks/useFiltroIds';
import { useUrlFiltros } from '@app/hooks/useUrlFiltros';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { FilaColecciones } from '@app/components/social/FilaColecciones';
import { ComunidadIsland } from '../comunidad/ComunidadIsland';
import { useEsMovil } from '@app/hooks/useEsMovil';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/inicio.css';

const TABS_INICIO = [{ id: 'inicio', etiqueta: 'Inicio' }];

export const InicioIsland = (): JSX.Element => {
    const autenticado = useAuthStore(s => s.autenticado);
    const cargando = useAuthStore(s => s.cargando);
    const esMovil = useEsMovil();

    /* F11: El skeleton se muestra solo en la zona de contenido, no en toda la página.
     * El layout (sidebar/topbar) ya está visible gracias a LayoutPrincipal. */
    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionInicio">
                <SkeletonFeed cantidad={8} />
            </div>
        );
    }

    if (!autenticado) {
        return <LandingPublica />;
    }

    /* QK104: En movil, la pagina inicio muestra comunidad.
     * Los samples se acceden desde /samples (FeedSamplesIsland). */
    if (esMovil) {
        return <ComunidadIsland />;
    }

    return <FeedUnificado />;
};

/* Feed unificado: barra de control + FeedSamples centralizado */
/* QK104: Exportado para reutilización en FeedSamplesIsland (mobile) */
export const FeedUnificado = (): JSX.Element => {
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [totalServidor, setTotalServidor] = useState<number | null>(null);
    const [conteoFiltrado, setConteoFiltrado] = useState(0);

    const abrirCrear = useCrearModalStore(s => s.abrir);
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

    /* QQ3/QK56: Sincronizar filtros + tab ↔ URL query params (isla-aware) */
    useUrlFiltros('InicioIsland', 'inicio');

    /*
     * QK83: Debounce de búsqueda para evitar request server en cada keystroke.
     * 350ms de espera antes de enviar la query al backend (FTS server-side).
     */
    const [busquedaDebounced, setBusquedaDebounced] = useState(busqueda);
    const timerBusquedaRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
        timerBusquedaRef.current = setTimeout(() => setBusquedaDebounced(busqueda), 350);
        return () => clearTimeout(timerBusquedaRef.current);
    }, [busqueda]);

    /* Cargar historial para filtro "Ya reproducidos" */
    const { idsReproducidos } = useHistorialIds(yaReproducidos);

    /* Cargar IDs para filtros de likeados, descargados y seguidos */
    const { idsLikeados, idsDescargados, idsSeguidos } = useFiltroIds(likeados, descargados, deSeguidos);

    /* Combinar IDs de exclusión: reproducidos + likeados + descargados */
    const idsExcluidosCombinados = useMemo(() => {
        const set = new Set<number>();
        if (yaReproducidos) idsReproducidos.forEach((id) => set.add(id));
        if (likeados) idsLikeados.forEach((id) => set.add(id));
        if (descargados) idsDescargados.forEach((id) => set.add(id));
        return set.size > 0 ? set : undefined;
    }, [yaReproducidos, idsReproducidos, likeados, idsLikeados, descargados, idsDescargados]);

    /* C174: Re-registrar tabs al volver a esta isla (keep-alive) */
    useTabsIsla('InicioIsland', TABS_INICIO, 'inicio');

    /* Habilitar panel lateral al estar en esta isla */
    const islaActual = useNavigationStore(s => s.islaActual);
    useEffect(() => {
        if (islaActual === 'InicioIsland') habilitarPanel();
    }, [islaActual, habilitarPanel]);
    useEffect(() => {
        return () => deshabilitarPanel();
    }, [deshabilitarPanel]);

    /*
     * QK83: Proveedor de datos — pasa búsqueda al backend para FTS server-side.
     * El backend usa GIN indexes (QK75) para búsqueda full-text rápida (~400ms).
     */
    const proveedor = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        const tipo = ordenamiento === 'recientes' ? 'recientes'
            : ordenamiento === 'destacados' ? 'trending'
            : 'descubrir';
        const resp = await obtenerFeed(tipo, pagina, busquedaDebounced);
        /* QQ2: El backend devuelve total en page 1; usarlo para el contador real */
        if (resp.total != null) setTotalServidor(resp.total);
        return resp.ok && resp.data ? resp.data : [];
    }, [ordenamiento, busquedaDebounced]);

    /* QK83: Incluir búsqueda en clave de cache para invalidar al cambiar query */
    const claveCache = `${ordenamiento}_${periodoDestacados}_${busquedaDebounced}`;

    const obtenerEtiquetaOrden = useCallback((): string => {
        if (ordenamiento === 'destacados') {
            return periodoDestacados === 'mes' ? 'Top Mensual' : 'Top Semanal';
        }
        return ordenamiento === 'recientes' ? 'Recientes' : 'Inteligente';
    }, [ordenamiento, periodoDestacados]);

    return (
        <div className="inicioContenedor" id="seccionInicio">
            {/* C180: Fila horizontal de colecciones */}
            <FilaColecciones />

            {/* Barra de ordenamientos + filtros */}
            <div className="inicioBarraControl">
                <div className="inicioControlesIzquierda">
                    {/* QL13: Mostrar contador inmediatamente con conteoFiltrado como fallback.
                     * totalServidor se actualiza cuando la API responde (puede tardar).
                     * conteoFiltrado esta disponible casi inmediatamente desde cache. */}
                    {(totalServidor !== null || conteoFiltrado > 0) && (
                        <span className="inicioTagsContador">
                            {busqueda.trim()
                                ? `${conteoFiltrado} de ${totalServidor ?? conteoFiltrado} samples`
                                : `${totalServidor ?? conteoFiltrado} samples`
                            }
                        </span>
                    )}
                </div>

                <div className="inicioControlesDerecha">
                    <div className="inicioOrdenWrapper">
                        <BotonBase variante="ghost"
                            className="inicioOrdenBtn inicioOrdenBtnActivo"
                            onClick={() => setMenuOrdenamiento((prev) => !prev)}
                            type="button"
                        >
                            <ArrowDownWideNarrow size={14} />
                            {obtenerEtiquetaOrden()}
                            <ChevronDown size={12} />
                        </BotonBase>

                        {menuOrdenamiento && (
                            <div className="inicioOrdenamientoMenu">
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'inteligente' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('inteligente'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Inteligente
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'recientes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('recientes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Recientes
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'semana' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('semana'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Top Semanal
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'mes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('mes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Top Mensual
                                </BotonBase>
                            </div>
                        )}
                    </div>

                    <BotonBase variante="ghost"
                        className="inicioFiltrosBtn"
                        onClick={() => setFiltrosAbierto(true)}
                        tamano="ninguno"
                        type="button"
                        aria-label="Filtros"
                    >
                        <SlidersHorizontal size={16} />
                    </BotonBase>
                </div>
            </div>

            {/* FeedSamples centralizado con tags, infinite scroll y virtualización */}
            <FeedSamples
                proveedor={proveedor}
                claveCache={claveCache}
                mostrarTags
                infiniteScroll
                virtualizar
                mensajeVacio="No se encontraron samples."
                idsExcluidos={idsExcluidosCombinados}
                idsCreadoresIncluidos={deSeguidos && idsSeguidos.size > 0 ? idsSeguidos : undefined}
                onConteoChange={setConteoFiltrado}
                accionVacia={
                    <BotonBase variante="primario" onClick={() => abrirCrear()}>
                        Sube el primero
                    </BotonBase>
                }
            />

            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
            />
        </div>
    );
};

export default InicioIsland;
