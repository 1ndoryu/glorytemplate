/*
 * SamplesIsland — Kamples
 * Explorador principal de samples con filtros, búsqueda y lista.
 * Conecta la API de samples con los componentes TarjetaSample y ReproductorGlobal.
 */

import { useState, useCallback, useEffect, type ChangeEvent } from 'react';
import { Search, Music } from 'lucide-react';
import {
    InputBusqueda,
    BotonBase,
    TabBar,
} from '@app/components/ui';
import type { TabDefinicion } from '@app/components/ui';
import { ReproductorGlobal } from '@app/components/ui/ReproductorGlobal';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { listarSamples } from '@app/services/apiSamples';
import type { FiltrosSamples, RespuestaListaSamples } from '@app/services/apiSamples';
import type { SampleResumen } from '@app/types';
import { useReproductorStore } from '@app/stores/reproductorStore';
import '../../styles/componentes/samples.css';

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TIPOS = ['loop', 'oneshot', 'fx', 'vocal', 'stem', 'otro'];

const TABS_EXPLORAR: TabDefinicion[] = [
    { id: 'todos', etiqueta: 'Todos' },
    { id: 'trending', etiqueta: 'Trending' },
    { id: 'recientes', etiqueta: 'Recientes' },
    { id: 'recomendados', etiqueta: 'Para ti' },
];

export const SamplesIsland = (): JSX.Element => {
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [filtros, setFiltros] = useState<FiltrosSamples>({ page: 1, perPage: 20 });
    const [paginacion, setPaginacion] = useState({ page: 1, pages: 1, total: 0 });
    const [tabActiva, setTabActiva] = useState('todos');

    const { sampleActual, reproduciendo, progreso, setSample, pause } =
        useReproductorStore();

    /* Cargar samples */
    const cargarSamples = useCallback(async () => {
        setCargando(true);
        const respuesta = await listarSamples(filtros);
        if (respuesta.ok && respuesta.data) {
            const lista = respuesta.data as unknown as RespuestaListaSamples;
            setSamples(lista.data ?? []);
            setPaginacion({
                page: lista.pagination?.page ?? 1,
                pages: lista.pagination?.pages ?? 1,
                total: lista.pagination?.total ?? 0,
            });
        } else {
            setSamples([]);
        }
        setCargando(false);
    }, [filtros]);

    useEffect(() => {
        cargarSamples();
    }, [cargarSamples]);

    /* Actualizar filtro de búsqueda */
    const manejarBusqueda = useCallback((valor: string) => {
        setFiltros((prev) => ({ ...prev, busqueda: valor || undefined, page: 1 }));
    }, []);

    /* Selectores de filtro */
    const manejarFiltroSelect = useCallback(
        (campo: keyof FiltrosSamples) => (e: ChangeEvent<HTMLSelectElement>) => {
            const valor = e.target.value;
            setFiltros((prev) => ({
                ...prev,
                [campo]: valor || undefined,
                page: 1,
            }));
        },
        []
    );

    /* Filtro BPM rango */
    const manejarBpmMin = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || undefined;
        setFiltros((prev) => ({ ...prev, bpmMin: val, page: 1 }));
    }, []);

    const manejarBpmMax = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || undefined;
        setFiltros((prev) => ({ ...prev, bpmMax: val, page: 1 }));
    }, []);

    /* Paginación */
    const irAPagina = useCallback((pagina: number) => {
        setFiltros((prev) => ({ ...prev, page: pagina }));
    }, []);

    /* Reproducción */
    const manejarPlay = useCallback(
        (sample: SampleResumen) => {
            setSample(sample);
        },
        [setSample]
    );

    const manejarPause = useCallback(() => {
        pause();
    }, [pause]);

    /* Tabs */
    const manejarTab = useCallback((tabId: string) => {
        setTabActiva(tabId);
        /* TO-DO: cambiar endpoint según tab (trending, recientes, recomendados) */
        setFiltros((prev) => ({ ...prev, page: 1 }));
    }, []);

    return (
        <div className="explorador" id="seccionExplorador">
            {/* Cabecera */}
            <div className="exploradorCabecera">
                <h1 className="exploradorTitulo">Explorar</h1>
                <div className="exploradorBusqueda">
                    <InputBusqueda
                        onChange={manejarBusqueda}
                        placeholder="Buscar samples, packs, artistas..."
                    />
                </div>
            </div>

            {/* Tabs */}
            <TabBar tabs={TABS_EXPLORAR} activa={tabActiva} onChange={manejarTab} />

            {/* Filtros */}
            <div className="exploradorFiltros">
                <div className="exploradorFiltroGrupo">
                    <span className="exploradorFiltroLabel">Tipo</span>
                    <select
                        className="exploradorFiltroSelect"
                        onChange={manejarFiltroSelect('tipo')}
                        value={filtros.tipo ?? ''}
                    >
                        <option value="">Todos</option>
                        {TIPOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="exploradorFiltroGrupo">
                    <span className="exploradorFiltroLabel">Key</span>
                    <select
                        className="exploradorFiltroSelect"
                        onChange={manejarFiltroSelect('key')}
                        value={filtros.key ?? ''}
                    >
                        <option value="">Todas</option>
                        {NOTAS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                <div className="exploradorFiltroGrupo">
                    <span className="exploradorFiltroLabel">BPM</span>
                    <div className="exploradorRango">
                        <input
                            className="exploradorRangoInput"
                            type="number"
                            placeholder="Min"
                            min={40}
                            max={300}
                            onChange={manejarBpmMin}
                        />
                        <span className="exploradorRangoSeparador">—</span>
                        <input
                            className="exploradorRangoInput"
                            type="number"
                            placeholder="Max"
                            min={40}
                            max={300}
                            onChange={manejarBpmMax}
                        />
                    </div>
                </div>
            </div>

            {/* Info resultados */}
            <div className="exploradorResultadosInfo">
                <span className="exploradorConteo">
                    {paginacion.total} sample{paginacion.total !== 1 ? 's' : ''} encontrado{paginacion.total !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Lista de samples */}
            {cargando ? (
                <div className="exploradorCargando">
                    Cargando samples...
                </div>
            ) : samples.length === 0 ? (
                <div className="exploradorVacio">
                    <Search size={48} className="exploradorVacioIcono" />
                    <h3 className="exploradorVacioTitulo">No se encontraron samples</h3>
                    <p className="exploradorVacioTexto">
                        Intenta con otros filtros o términos de búsqueda.
                    </p>
                </div>
            ) : (
                <div className="exploradorLista">
                    {samples.map((sample) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            activa={sampleActual?.id === sample.id}
                            reproduciendo={sampleActual?.id === sample.id && reproduciendo}
                            progreso={sampleActual?.id === sample.id ? progreso : 0}
                            onPlay={manejarPlay}
                            onPause={manejarPause}
                        />
                    ))}
                </div>
            )}

            {/* Paginación */}
            {paginacion.pages > 1 && (
                <div className="exploradorPaginacion">
                    <BotonBase
                        variante="ghost"
                        tamano="sm"
                        disabled={paginacion.page <= 1}
                        onClick={() => irAPagina(paginacion.page - 1)}
                    >
                        Anterior
                    </BotonBase>
                    <span className="exploradorPaginaInfo">
                        {paginacion.page} / {paginacion.pages}
                    </span>
                    <BotonBase
                        variante="ghost"
                        tamano="sm"
                        disabled={paginacion.page >= paginacion.pages}
                        onClick={() => irAPagina(paginacion.page + 1)}
                    >
                        Siguiente
                    </BotonBase>
                </div>
            )}

            {/* Reproductor global persistente */}
            <ReproductorGlobal />
        </div>
    );
};

export default SamplesIsland;
