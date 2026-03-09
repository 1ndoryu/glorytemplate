/*
 * InicioIsland — Kamples
 * Feed principal con ordenamientos (Inteligente/Recientes/Destacados).
 * Usa FeedSamples centralizado para la lista de samples.
 * Si el usuario no está autenticado, muestra LandingPublica.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
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
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { FilaColecciones } from '@app/components/social/FilaColecciones';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/inicio.css';

const TABS_INICIO = [{ id: 'inicio', etiqueta: 'Inicio' }];

export const InicioIsland = (): JSX.Element => {
    const autenticado = useAuthStore(s => s.autenticado);
    const cargando = useAuthStore(s => s.cargando);

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

    return <FeedUnificado />;
};

/* Feed unificado: barra de control + FeedSamples centralizado */
const FeedUnificado = (): JSX.Element => {
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [totalSamples, setTotalSamples] = useState(0);

    const abrirCrear = useCrearModalStore(s => s.abrir);
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

    /* Proveedor de datos para FeedSamples — cambia según ordenamiento */
    const proveedor = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        if (ordenamiento === 'recientes') {
            const resp = await obtenerFeed('recientes', pagina);
            return resp.ok && resp.data ? resp.data : [];
        }
        if (ordenamiento === 'destacados') {
            const resp = await obtenerFeed('trending', pagina);
            return resp.ok && resp.data ? resp.data : [];
        }
        /* Inteligente — usa el endpoint /feed con tipo 'descubrir' que activa MotorRecomendacion */
        const resp = await obtenerFeed('descubrir', pagina);
        return resp.ok && resp.data ? resp.data : [];
    }, [ordenamiento]);

    /* Clave de cache para invalidar al cambiar contexto (NO incluir busqueda — es filtro client-side) */
    const claveCache = `${ordenamiento}_${periodoDestacados}`;

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
                    <span className="inicioTagsContador">{totalSamples} samples</span>
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
                onConteoChange={setTotalSamples}
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
