/*
 * Isla: DescubrirIsland — Kamples (QQ88)
 * Feed publico identico al InicioIsland.
 * FilaColecciones + barra control + FeedSamples con tags, infinite scroll.
 * No requiere autenticacion. Filtros avanzados (reproducidos, seguidos, etc.)
 * no aplican para anonimos — solo ordenamiento y tags/BPM.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, ArrowDownWideNarrow } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { obtenerFeed } from '@app/services/apiSamples';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useAuthStore } from '@app/stores/authStore';
import { useHistorialIds } from '@app/hooks/useHistorialIds';
import { useFiltroIds } from '@app/hooks/useFiltroIds';
import { useUrlFiltros } from '@app/hooks/useUrlFiltros';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { FilaColecciones } from '@app/components/social/FilaColecciones';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/inicio.css';

const TABS_DESCUBRIR = [{ id: 'descubrir', etiqueta: 'Explorar' }];

export const DescubrirIsland = (): JSX.Element => {
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [totalServidor, setTotalServidor] = useState(0);
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

    useUrlFiltros();

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

    const proveedor = useCallback(async (pagina: number): Promise<SampleResumen[]> => {
        const tipo = ordenamiento === 'recientes' ? 'recientes'
            : ordenamiento === 'destacados' ? 'trending'
            : 'descubrir';
        const resp = await obtenerFeed(tipo, pagina);
        if (resp.total != null) setTotalServidor(resp.total);
        return resp.ok && resp.data ? resp.data : [];
    }, [ordenamiento]);

    const claveCache = `descubrir_${ordenamiento}_${periodoDestacados}`;

    const obtenerEtiquetaOrden = useCallback((): string => {
        if (ordenamiento === 'destacados') {
            return periodoDestacados === 'mes' ? 'Top Mensual' : 'Top Semanal';
        }
        return ordenamiento === 'recientes' ? 'Recientes' : 'Inteligente';
    }, [ordenamiento, periodoDestacados]);

    return (
        <div className="inicioContenedor" id="seccionDescubrir">
            <FilaColecciones />

            <div className="inicioBarraControl">
                <div className="inicioControlesIzquierda">
                    <span className="inicioTagsContador">
                        {busqueda.trim()
                            ? `${conteoFiltrado} de ${totalServidor} samples`
                            : `${totalServidor} samples`
                        }
                    </span>
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

            <FeedSamples
                proveedor={proveedor}
                claveCache={claveCache}
                mostrarTags
                infiniteScroll
                virtualizar
                mensajeVacio="No se encontraron samples."
                idsExcluidos={idsExcluidosCombinados}
                idsCreadoresIncluidos={autenticado && deSeguidos && idsSeguidos.size > 0 ? idsSeguidos : undefined}
                onConteoChange={setConteoFiltrado}
            />

            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
            />
        </div>
    );
};

export default DescubrirIsland;
