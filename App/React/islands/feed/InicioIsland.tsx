/*
 * InicioIsland — Kamples
 * Feed principal con ordenamientos (Inteligente/Recientes/Destacados).
 * Usa FeedSamples centralizado para la lista de samples.
 * Si el usuario no está autenticado, muestra LandingPublica.
 * [183A-110-D] Blog es un tab del inicio, no una página separada.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, ArrowDownWideNarrow, Heart, Dices, RefreshCw } from 'lucide-react';
import { BotonBase } from '@app/components/ui';
import { SkeletonFeed } from '@app/components/skeletons';
import { FeedSamples } from '@app/components/feed/FeedSamples';
import { LandingPublica } from '@app/components/social/LandingPublica';
import { BlogIsland } from '../blog/BlogIsland';
import { obtenerFeed, recargarCacheFeed, type FiltrosFeedBackend } from '@app/services/apiSamples';
import { useCrearModalStore } from '@app/stores/crearModalStore';
import { useReproductorAleatorio } from '@app/hooks/useReproductorAleatorio';
import { useAuthStore } from '@app/stores/authStore';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import { useTabsIsla } from '@app/hooks/useTabsIsla';
import { useTabsTopBarStore } from '@app/stores/tabsTopBarStore';
import { useNavigationStore } from '@/core/router';
import { usePanelLateralStore } from '@app/stores/panelLateralStore';
import { useHistorialIds } from '@app/hooks/useHistorialIds';
import { useFiltroIds } from '@app/hooks/useFiltroIds';
import { useUrlFiltros } from '@app/hooks/useUrlFiltros';
import { ModalFiltros } from '@app/components/ui/ModalFiltros';
import { useFiltrosContenido } from '@app/hooks/useFiltrosContenido';
import { FilaColecciones } from '@app/components/social/FilaColecciones';
import { ComunidadIsland } from '../comunidad/ComunidadIsland';
import { useEsMovil } from '@app/hooks/useEsMovil';
import { useT } from '@app/utils/i18n';
import '../../styles/componentes/inicio.css';

/* [183A-110-D] Blog como tab del inicio en vez de página separada */
const TABS_INICIO = [
    { id: 'inicio', etiqueta: 'nav.inicio' },
    { id: 'blog', etiqueta: 'nav.blog' },
];

export const InicioIsland = (): JSX.Element => {
    const autenticado = useAuthStore(s => s.autenticado);
    const cargando = useAuthStore(s => s.cargando);
    const esMovil = useEsMovil();
    const tabActiva = useTabsTopBarStore(s => s.activa);

    /* [183A-110-D] Registrar tabs antes de cualquier return condicional (regla de hooks).
     * Para auth: se muestran en el TopBar. Para non-auth: se ignoran visualmente
     * pero quedan registradas para consistencia. */
    useTabsIsla('InicioIsland', TABS_INICIO, 'inicio');

    if (cargando) {
        return (
            <div className="inicioContenedor" id="seccionInicio">
                <SkeletonFeed cantidad={8} />
            </div>
        );
    }

    /* [183A-110-D] Tab Blog activa → mostrar BlogIsland para usuarios autenticados */
    if (autenticado && tabActiva === 'blog') {
        return <BlogIsland />;
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
    const { t } = useT();
    const [filtrosAbierto, setFiltrosAbierto] = useState(false);
    const [menuOrdenamiento, setMenuOrdenamiento] = useState(false);
    const [totalServidor, setTotalServidor] = useState<number | null>(null);
    const [conteoFiltrado, setConteoFiltrado] = useState(0);

    /* [2103A-16] Recargar feed: invalida caché del algoritmo y fuerza nueva llamada */
    const [recargarVersion, setRecargarVersion] = useState(0);
    const [recargando, setRecargando] = useState(false);
    const manejarRecargarFeed = useCallback(async () => {
        if (recargando) return;
        setRecargando(true);
        try {
            await recargarCacheFeed();
            setRecargarVersion(v => v + 1);
        } finally {
            setRecargando(false);
        }
    }, [recargando]);

    /* [2103A-12] Dado: reproduce un sample aleatorio del top 1000 */
    const { cargandoAleatorio, reproducirAleatorio } = useReproductorAleatorio();

    const abrirCrear = useCrearModalStore(s => s.abrir);
    const busqueda = useFiltrosStore(s => s.busqueda);
    const ordenamiento = useFiltrosStore(s => s.ordenamiento);
    const periodoDestacados = useFiltrosStore(s => s.periodoDestacados);
    const yaReproducidos = useFiltrosStore(s => s.yaReproducidos);
    const deSeguidos = useFiltrosStore(s => s.deSeguidos);
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

    /* Cargar IDs de seguidos para filtro "Solo de seguidos" */
    const { idsSeguidos } = useFiltroIds(false, false, deSeguidos);

    /*
     * QL87: Filtros de contenido locales (independientes por pagina).
     * Reemplaza el viejo sistema de IDs para descargados/likeados con filtrado
     * client-side usando campos yaColeccionado/liked del SampleResumen.
     */
    const filtrosContenido = useFiltrosContenido({
        disponibles: ['soloWav', 'soloMeEncanta', 'ocultarDescargados', 'ocultarColeccionados', 'ocultarReproducidos', 'ocultarLikeados', 'soloDeSeguidos'],
        /* [193A-82] Todos los filtros que tienen equivalente SQL se manejan por backend.
         * Solo ocultarReproducidos se queda client-side (historial en localStorage). */
        servidorSide: ['soloMeEncanta', 'soloWav', 'ocultarDescargados', 'ocultarColeccionados', 'ocultarLikeados', 'soloDeSeguidos'],
        idsReproducidos: yaReproducidos ? idsReproducidos : undefined,
        idsSeguidos: deSeguidos && idsSeguidos.size > 0 ? idsSeguidos : undefined,
    });

    /* IDs de exclusión: solo reproducidos (el resto se maneja via filtrosContenido) */
    const idsExcluidosCombinados = useMemo(() => {
        if (yaReproducidos && idsReproducidos.size > 0) return idsReproducidos;
        return undefined;
    }, [yaReproducidos, idsReproducidos]);

    /* [183A-110-D] useTabsIsla movido a InicioIsland para que funcione antes
     * de los returns condicionales (auth, mobile, blog tab). */

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
     * QL24: El backend ahora envía total en TODAS las páginas, no solo page 1.
     * [193A-82] Todos los filtros con equivalente SQL se envían al backend.
     */
    const soloWav = filtrosContenido.estaActivo('soloWav');
    const ocultarDescargados = filtrosContenido.estaActivo('ocultarDescargados');
    const ocultarColeccionados = filtrosContenido.estaActivo('ocultarColeccionados');
    const ocultarLikeados = filtrosContenido.estaActivo('ocultarLikeados');
    const soloDeSeguidos = filtrosContenido.estaActivo('soloDeSeguidos');
    const { modoCorazon } = filtrosContenido;

    /* [193A-82] Objeto estable de filtros backend — useMemo evita recrear en cada render
     * [223A-5] modoCorazon envía soloEncanta o soloLike según el ciclo */
    const filtrosBackend = useMemo<FiltrosFeedBackend>(() => ({
        soloEncanta: modoCorazon === 'encanta',
        soloLike: modoCorazon === 'like',
        soloWav,
        ocultarDescargados,
        ocultarColeccionados,
        ocultarLikeados,
        soloDeSeguidos,
    }), [modoCorazon, soloWav, ocultarDescargados, ocultarColeccionados, ocultarLikeados, soloDeSeguidos]);

    const proveedor = useCallback(async (pagina: number) => {
        const tipo = ordenamiento === 'recientes' ? 'recientes'
            : ordenamiento === 'destacados' ? 'trending'
            : 'descubrir';
        const resp = await obtenerFeed(tipo, pagina, busquedaDebounced, filtrosBackend);
        if (resp.total != null) setTotalServidor(resp.total);
        return { ok: resp.ok, data: resp.ok && resp.data ? resp.data : [] };
    }, [ordenamiento, busquedaDebounced, filtrosBackend]);

    /* QL24: Resetear totalServidor al cambiar ordenamiento/búsqueda/filtros para evitar
     * mostrar total stale de un contexto anterior mientras la nueva API responde. */
    useEffect(() => {
        setTotalServidor(null);
    }, [ordenamiento, busquedaDebounced, filtrosBackend]);

    /* QK83: Incluir búsqueda y filtros en clave de cache para invalidar al cambiar */
    /* [2103A-16] recargarVersion fuerza invalidación del cache cuando el usuario recarga */
    const claveCache = `${ordenamiento}_${periodoDestacados}_${busquedaDebounced}_${modoCorazon}_${soloWav}_${ocultarDescargados}_${ocultarColeccionados}_${ocultarLikeados}_${soloDeSeguidos}_v${recargarVersion}`;

    const obtenerEtiquetaOrden = useCallback((): string => {
        if (ordenamiento === 'destacados') {
            return periodoDestacados === 'mes' ? t('feed.orden.topMensual') : t('feed.orden.topSemanal');
        }
        return ordenamiento === 'recientes' ? t('feed.orden.recientes') : t('feed.orden.inteligente');
    }, [ordenamiento, periodoDestacados, t]);

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

                    {/* [2103A-16] Botón recargar feed — invalida caché del algoritmo */}
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        onClick={manejarRecargarFeed}
                        type="button"
                        aria-label={t('feed.recargar')}
                        className={`inicioFiltrosBtn${recargando ? ' cargandoAleatorio' : ''}`}
                        disabled={recargando}
                    >
                        <RefreshCw size={16} />
                    </BotonBase>

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

                    {/* [223A-5] Ciclo corazón: off → like (contorno) → encanta (relleno) → off */}
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        onClick={filtrosContenido.ciclarCorazon}
                        type="button"
                        aria-label={modoCorazon === 'off' ? t('feed.soloMeEncanta') : modoCorazon === 'like' ? 'Solo me gusta' : 'Solo me encanta'}
                        className={`inicioFiltrosBtn ${modoCorazon !== 'off' ? 'filtroEncantaActivo' : ''}`}
                    >
                        <Heart size={16} fill={modoCorazon === 'encanta' ? 'currentColor' : 'none'} strokeWidth={modoCorazon === 'like' ? 3 : 2} />
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

            {/* FeedSamples centralizado con tags, infinite scroll y virtualización */}
            <FeedSamples
                proveedor={proveedor}
                claveCache={claveCache}
                mostrarTags
                infiniteScroll
                mensajeVacio={t('feed.noSeEncontraronSamples')}
                idsExcluidos={idsExcluidosCombinados}
                idsCreadoresIncluidos={deSeguidos && idsSeguidos.size > 0 ? idsSeguidos : undefined}
                onConteoChange={setConteoFiltrado}
                filtroAdicional={filtrosContenido.aplicar}
                accionVacia={
                    <BotonBase variante="primario" onClick={() => abrirCrear()}>
                        {t('feed.subeElPrimero')}
                    </BotonBase>
                }
            />

            <ModalFiltros
                abierto={filtrosAbierto}
                onCerrar={() => setFiltrosAbierto(false)}
                filtrosContenido={filtrosContenido.filtros}
                estaActivo={filtrosContenido.estaActivo}
                onToggleFiltro={filtrosContenido.toggle}
                hayFiltrosContenidoActivos={filtrosContenido.hayActivos}
                onResetContenido={filtrosContenido.resetear}
            />
        </div>
    );
};

export default InicioIsland;
