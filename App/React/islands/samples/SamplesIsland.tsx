/* sentinel-disable isla-no-registrada */
/*
 * SamplesIsland — Kamples
 * Explorador principal de samples con filtros, búsqueda y lista.
 * Incluye menú contextual, likes y navegación SPA.
 * TO-DO: Isla desactivada (explorar ya no existe como página). Evaluar si eliminar archivo.
 */

import { Search } from 'lucide-react';
import {
    InputBusqueda,
    BotonBase,
    TabBar,
} from '@app/components/ui';
import type { TabDefinicion } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useSamplesIsland } from '@app/hooks/useSamplesIsland';
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
    const {
        samples, cargando, filtros, paginacion, tabActiva,
        navegar, menu, manejarLike, manejarBusqueda,
        manejarFiltroSelect, manejarBpmMin, manejarBpmMax,
        irAPagina, manejarTab,
    } = useSamplesIsland();

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
                            onLike={manejarLike}
                            onMenu={menu.abrirMenu}
                            onClickCreador={(u) => navegar(`/perfil/${u}`)}
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

            {/* Menú contextual de sample */}
            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />
        </div>
    );
};

export default SamplesIsland;
