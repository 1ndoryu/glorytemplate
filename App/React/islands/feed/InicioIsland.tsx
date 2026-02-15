/*
 * InicioIsland — Kamples
 * Feed principal con ordenamientos (Inteligente/Recientes/Destacados).
 * Usa FeedSamples centralizado para la lista de samples.
 * Si el usuario no está autenticado, muestra LandingPublica.
 */

import { useEffect, useState, useCallback } from 'react';
import { Music, SlidersHorizontal, ChevronDown, ArrowDownWideNarrow } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { obtenerFeed, listarSamples } from '@app/services/apiSamples';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useHistorialIds } from '@app/hooks/useHistorialIds';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/inicio.css';

export const InicioIsland = (): JSX.Element => {
    const { autenticado, cargando } = useAuthStore();

    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionInicio">
                <div className="inicioVacio">
                    <Music size={40} className="inicioVacioIcono" />
                    <p>Cargando…</p>
                </div>
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

    const { abrir: abrirCrear } = useCrearModalStore();
    const { busqueda, ordenamiento, periodoDestacados, yaReproducidos, setOrdenamiento, setPeriodoDestacados } = useFiltrosStore();
    const { setTabs } = useTabsTopBarStore();

    /* Cargar historial para filtro "Ya reproducidos" */
    const { idsReproducidos } = useHistorialIds(yaReproducidos);

    /* Registrar tab "Inicio" en TopBar */
    useEffect(() => {
        setTabs([{ id: 'inicio', etiqueta: 'Inicio' }], 'inicio');
        return () => { setTabs([]); };
    }, [setTabs]);

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
        /* Inteligente */
        const resp = await listarSamples({ page: pagina, perPage: 30, busqueda: busqueda || undefined });
        return resp.ok && resp.data ? resp.data.data ?? [] : [];
    }, [ordenamiento, busqueda]);

    /* Clave de cache para invalidar al cambiar filtros */
    const claveCache = `${ordenamiento}_${busqueda || ''}_${periodoDestacados}`;

    const obtenerEtiquetaOrden = useCallback((): string => {
        if (ordenamiento === 'destacados') {
            return periodoDestacados === 'mes' ? 'Top Mensual' : 'Top Semanal';
        }
        return ordenamiento === 'recientes' ? 'Recientes' : 'Inteligente';
    }, [ordenamiento, periodoDestacados]);

    return (
        <div className="inicioContenedor" id="seccionInicio">
            {/* Barra de ordenamientos + filtros */}
            <div className="inicioBarraControl">
                <div className="inicioControlesIzquierda">
                    <span className="inicioTagsContador">Samples</span>
                </div>

                <div className="inicioControlesDerecha">
                    <div className="inicioOrdenWrapper">
                        <button
                            className="inicioOrdenBtn inicioOrdenBtnActivo"
                            onClick={() => setMenuOrdenamiento((prev) => !prev)}
                            type="button"
                        >
                            <ArrowDownWideNarrow size={14} />
                            {obtenerEtiquetaOrden()}
                            <ChevronDown size={12} />
                        </button>

                        {menuOrdenamiento && (
                            <div className="inicioOrdenamientoMenu">
                                <button
                                    className={ordenamiento === 'inteligente' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('inteligente'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Inteligente
                                </button>
                                <button
                                    className={ordenamiento === 'recientes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('recientes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Recientes
                                </button>
                                <button
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'semana' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('semana'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Top Semanal
                                </button>
                                <button
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'mes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('mes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    Top Mensual
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="inicioFiltrosBtn"
                        onClick={() => setFiltrosAbierto(true)}
                        type="button"
                        aria-label="Filtros"
                    >
                        <SlidersHorizontal size={16} />
                    </button>
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
                idsExcluidos={yaReproducidos ? idsReproducidos : undefined}
                accionVacia={
                    <BotonBase variante="primario" onClick={abrirCrear}>
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
