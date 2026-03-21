/*
 * Isla: DescubrirIsland — Kamples (QQ88)
 * Feed publico identico al InicioIsland.
 * FilaColecciones + barra control + FeedSamples con tags, infinite scroll.
 * No requiere autenticacion. Filtros avanzados (reproducidos, seguidos, etc.)
 * no aplican para anonimos — solo ordenamiento y tags/BPM.
 */

import { useState, useCallback } from 'react';
import { SlidersHorizontal, ChevronDown, ArrowDownWideNarrow, Dices } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { FilaColecciones } from '@app/components/social/FilaColecciones';
import { useDescubrirIsland } from '@app/hooks/useDescubrirIsland';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { obtenerSampleAleatorio } from '@app/services/apiSamples';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/inicio.css';

export const DescubrirIsland = (): JSX.Element => {
    const { t } = useT();

    /* [2103A-12] Dado: reproduce un sample aleatorio del top 1000 */
    const [cargandoAleatorio, setCargandoAleatorio] = useState(false);
    const reproducir = useReproductorStore(s => s.reproducir);
    const reproducirAleatorio = useCallback(async () => {
        if (cargandoAleatorio) return;
        setCargandoAleatorio(true);
        try {
            const resp = await obtenerSampleAleatorio();
            if (resp.ok && resp.data) reproducir(resp.data);
        } finally {
            setCargandoAleatorio(false);
        }
    }, [cargandoAleatorio, reproducir]);
    const {
        filtrosAbierto, setFiltrosAbierto,
        menuOrdenamiento, setMenuOrdenamiento,
        totalServidor,
        conteoFiltrado, setConteoFiltrado,
        autenticado, busqueda,
        ordenamiento, periodoDestacados,
        setOrdenamiento, setPeriodoDestacados,
        deSeguidos, idsSeguidos,
        idsExcluidosCombinados,
        proveedor, claveCache, obtenerEtiquetaOrden,
    } = useDescubrirIsland();

    return (
        <div className="inicioContenedor" id="seccionDescubrir">
            <FilaColecciones />

            <div className="inicioBarraControl">
                <div className="inicioControlesIzquierda">
                    {/* QL13: Contador con fallback a conteoFiltrado */}
                    {(totalServidor != null || conteoFiltrado > 0) && (
                        <span className="inicioTagsContador">
                            {busqueda.trim()
                                ? t('feed.contadorDeSamples', { actual: conteoFiltrado, total: totalServidor ?? conteoFiltrado })
                                : t('feed.contadorSamples', { total: totalServidor ?? conteoFiltrado })
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
                                    {t('feed.orden.inteligente')}
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'recientes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('recientes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    {t('feed.orden.recientes')}
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'semana' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('semana'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    {t('feed.orden.topSemanal')}
                                </BotonBase>
                                <BotonBase variante="ghost"
                                    className={ordenamiento === 'destacados' && periodoDestacados === 'mes' ? 'inicioOrdenamientoActivo' : ''}
                                    onClick={() => { setOrdenamiento('destacados'); setPeriodoDestacados('mes'); setMenuOrdenamiento(false); }}
                                    type="button"
                                >
                                    {t('feed.orden.topMensual')}
                                </BotonBase>
                            </div>
                        )}
                    </div>

                    {/* [2103A-12] Dado: reproduce un sample aleatorio del top 1000 */}
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        onClick={reproducirAleatorio}
                        type="button"
                        aria-label={t('feed.aleatorio')}
                        className={`inicioFiltrosBtn${cargandoAleatorio ? ' cargandoAleatorio' : ''}`}
                        disabled={cargandoAleatorio}
                    >
                        <Dices size={16} />
                    </BotonBase>

                    <BotonBase variante="ghost"
                        className="inicioFiltrosBtn"
                        onClick={() => setFiltrosAbierto(true)}
                        tamano="ninguno"
                        type="button"
                        aria-label={t('feed.filtros')}
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
                mensajeVacio={t('feed.noSeEncontraronSamples')}
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
