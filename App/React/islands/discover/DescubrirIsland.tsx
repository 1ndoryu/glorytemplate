/*
 * Isla: DescubrirIsland — Kamples (QQ88)
 * Feed publico identico al InicioIsland.
 * FilaColecciones + barra control + FeedSamples con tags, infinite scroll.
 * No requiere autenticacion. Filtros avanzados (reproducidos, seguidos, etc.)
 * no aplican para anonimos — solo ordenamiento y tags/BPM.
 */

import { SlidersHorizontal, ChevronDown, ArrowDownWideNarrow } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { FilaColecciones } from '@app/components/social/FilaColecciones';
import { useDescubrirIsland } from '@app/hooks/useDescubrirIsland';
import '../../styles/componentes/inicio.css';

export const DescubrirIsland = (): JSX.Element => {
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
