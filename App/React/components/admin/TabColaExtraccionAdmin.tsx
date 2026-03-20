/*
 * Componente: TabColaExtraccionAdmin — QK40
 * Tabla de cola_extraccion_samples con búsqueda, filtro por estado y columnas ocultables.
 * Lógica delegada a useTabColaExtraccionAdmin.
 */

import { Search, ChevronLeft, ChevronRight, RefreshCw, Columns, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import type { OpcionSelector } from '../ui/SelectorMenu';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { FiltroColumna, type OpcionFiltro } from '../ui/FiltroColumna';
import { useTabColaExtraccionAdmin } from '@app/hooks/useTabColaExtraccionAdmin';
import { useT } from '@app/utils/i18n/useT';
import { Checkbox } from '../ui/Checkbox';
import { useState, useMemo } from 'react';
import '../../styles/componentes/adminTablas.css';

const POR_PAGINA = 25;

/* QK66: Mapa de etiquetas para estados — se usa para construir opciones dinámicas */
const ETIQUETAS_ESTADO: Record<string, string> = {
    pendiente: 'Pendiente',
    descargando: 'Descargando',
    analizando: 'Analizando',
    recortando: 'Recortando',
    extraido: 'Extraido',
    completado: 'Completado',
    error: 'Error',
    revision_humana: 'Rev. Humana',
    unificado: 'Unificado',
};

/* Opciones para filtros inline por columna — se construyen dinámicamente en el componente */

const FILTRO_LADO: OpcionFiltro[] = [
    { valor: 'fuente', etiqueta: 'Fuente' },
    { valor: 'destino', etiqueta: 'Destino' },
];

type VarianteBadge = 'neutro' | 'acento' | 'exito' | 'error' | 'advertencia' | 'info';

const colorEstado = (estado: string): VarianteBadge => {
    const mapa: Record<string, VarianteBadge> = {
        pendiente: 'neutro',
        descargando: 'info',
        analizando: 'info',
        recortando: 'advertencia',
        extraido: 'acento',
        completado: 'exito',
        error: 'error',
        revision_humana: 'advertencia',
    };
    return mapa[estado] ?? 'neutro';
};

const COLUMNAS = [
    { id: 'relacion_id', etiqueta: 'Relación', sortKey: 'relacion_id' },
    { id: 'youtube_id', etiqueta: 'YouTube', sortKey: 'youtube_id' },
    { id: 'spotify_id', etiqueta: 'Spotify', sortKey: 'spotify_id' },
    { id: 'estado', etiqueta: 'Estado', sortKey: 'estado' },
    { id: 'intentos', etiqueta: 'Intentos', sortKey: 'intentos' },
    { id: 'lado', etiqueta: 'Lado', sortKey: 'lado' },
    { id: 'sample_id', etiqueta: 'Sample', sortKey: 'sample_id' },
    { id: 'timing', etiqueta: 'Timing', sortKey: 'timing_inicio_seg' },
    { id: 'bpm_detectado', etiqueta: 'BPM', sortKey: 'bpm_detectado' },
    { id: 'error_mensaje', etiqueta: 'Error', sortKey: 'error_mensaje' },
    { id: 'procesado_at', etiqueta: 'Procesado', sortKey: 'procesado_at' },
    { id: 'created_at', etiqueta: 'Creado', sortKey: 'created_at' },
    { id: 'proximo_intento_at', etiqueta: 'Prox. Intento', sortKey: 'proximo_intento_at' },
] as const;

const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatearTiming = (inicio: number | null, compasInicio: number | null, compasFin: number | null): string => {
    if (inicio == null && compasInicio == null) return '—';
    const partes: string[] = [];
    if (inicio != null) partes.push(`ini:${Number(inicio).toFixed(1)}s`);
    if (compasInicio != null && compasFin != null) partes.push(`c:${Number(compasInicio).toFixed(1)}-${Number(compasFin).toFixed(1)}s`);
    return partes.join(' ');
};

export const TabColaExtraccionAdmin = (): JSX.Element => {
    const tab = useTabColaExtraccionAdmin();
    const totalPaginas = Math.ceil(tab.total / POR_PAGINA);
    const [menuColumnasAbierto, setMenuColumnasAbierto] = useState(false);
    const { t } = useT();

    /* QK66: Construir opciones de estado dinámicamente desde estadosCuenta */
    const opcionesEstado = useMemo((): OpcionSelector[] => {
        const base: OpcionSelector[] = [{ valor: '', etiqueta: 'Todos los estados' }];
        return base.concat(
            Object.entries(tab.estadosCuenta).map(([estado, total]) => ({
                valor: estado,
                etiqueta: `${ETIQUETAS_ESTADO[estado] ?? estado} (${total})`,
            }))
        );
    }, [tab.estadosCuenta]);

    const filtroEstadoOpciones = useMemo((): OpcionFiltro[] => {
        return Object.entries(tab.estadosCuenta).map(([estado, total]) => ({
            valor: estado,
            etiqueta: `${ETIQUETAS_ESTADO[estado] ?? estado} (${total})`,
        }));
    }, [tab.estadosCuenta]);

    const columnaVisible = (id: string): boolean => !tab.columnasOcultas.has(id);

    const renderTh = (sortKey: string, etiqueta: string, filtro?: { opciones: OpcionFiltro[]; columna: string }) => (
        <th
            className="adminThSortable"
            onClick={() => tab.cambiarOrden(sortKey)}
        >
            <span className="adminThContenido">
                {etiqueta}
                {tab.sortCol === sortKey && (
                    tab.sortDir === 'ASC'
                        ? <ArrowUp size={12} className="adminSortIcono" />
                        : <ArrowDown size={12} className="adminSortIcono" />
                )}
                {filtro && (
                    <FiltroColumna
                        opciones={filtro.opciones}
                        activos={tab.filtrosColumna[filtro.columna] ?? new Set()}
                        onChange={(activos) => tab.cambiarFiltroColumna(filtro.columna, activos)}
                    />
                )}
            </span>
        </th>
    );

    return (
        <div className="adminTablaDatos">
            {/* Controles */}
            <div className="adminTablaDatosControles">
                <div className="adminBusquedaContenedor">
                    <Search size={14} className="adminBusquedaIcono" />
                    <CampoTexto
                        className="adminTablaDatosBusqueda"
                        variante="bordado"
                        placeholder={t('admin.buscar.colaExtraccion')}
                        value={tab.busqueda}
                        onChange={(e) => tab.cambiarBusqueda(e.target.value)}
                    />
                </div>
                <SelectorMenu
                    opciones={opcionesEstado}
                    valor={tab.filtroEstado}
                    onChange={tab.cambiarFiltroEstado}
                />
                <div className="adminTablaDatosAccionesExtra">
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        className="adminBotonAccion"
                        title={t('admin.refrescar')}
                        onClick={tab.refrescar}
                        type="button"
                    >
                        <RefreshCw size={14} />
                    </BotonBase>
                    <div className="adminColumnasMenu">
                        <BotonBase
                            variante="ghost"
                            tamano="ninguno"
                            className="adminBotonAccion"
                            title="Columnas"
                            onClick={() => setMenuColumnasAbierto(prev => !prev)}
                            type="button"
                        >
                            <Columns size={14} />
                        </BotonBase>
                        {menuColumnasAbierto && (
                            <div className="adminColumnasDropdown">
                                {COLUMNAS.map(col => (
                                    <Checkbox
                                        key={col.id}
                                        className="adminColumnasOpcion"
                                        checked={columnaVisible(col.id)}
                                        onChange={() => tab.toggleColumna(col.id)}
                                        label={col.etiqueta}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Indicador de carga */}
            {tab.cargando && <div className="adminTablaCargando">Cargando...</div>}

            {/* Tabla */}
            <div className="adminTablaContenedorScroll">
                <table className="adminTablaDatosTabla">
                    <thead>
                        <tr>
                            {renderTh('id', 'ID')}
                            {columnaVisible('relacion_id') && renderTh('relacion_id', 'Relación')}
                            {columnaVisible('youtube_id') && renderTh('youtube_id', 'YouTube')}
                            {columnaVisible('spotify_id') && renderTh('spotify_id', 'Spotify')}
                            {columnaVisible('estado') && renderTh('estado', 'Estado', { opciones: filtroEstadoOpciones, columna: 'estado' })}
                            {columnaVisible('intentos') && renderTh('intentos', 'Intentos')}
                            {columnaVisible('lado') && renderTh('lado', 'Lado', { opciones: FILTRO_LADO, columna: 'lado' })}
                            {columnaVisible('sample_id') && renderTh('sample_id', 'Sample')}
                            {columnaVisible('timing') && renderTh('timing_inicio_seg', 'Timing')}
                            {columnaVisible('bpm_detectado') && renderTh('bpm_detectado', 'BPM')}
                            {columnaVisible('error_mensaje') && renderTh('error_mensaje', 'Error')}
                            {columnaVisible('procesado_at') && renderTh('procesado_at', 'Procesado')}
                            {columnaVisible('created_at') && renderTh('created_at', 'Creado')}
                            {columnaVisible('proximo_intento_at') && renderTh('proximo_intento_at', 'Prox. Intento')}
                        </tr>
                    </thead>
                    <tbody>
                        {tab.items.length === 0 && !tab.cargando && (
                            <tr>
                                <td colSpan={14}>
                                    <EstadoVacio
                                        mensaje="No se encontraron items en la cola de extracción"
                                        icono={<Search size={24} />}
                                    />
                                </td>
                            </tr>
                        )}
                        {tab.items.map(item => (
                            <tr key={item.id}>
                                <td className="adminTablaCeldaMono">{item.id}</td>
                                {columnaVisible('relacion_id') && (
                                    <td className="adminTablaCeldaMono">{item.relacion_id}</td>
                                )}
                                {columnaVisible('youtube_id') && (
                                    <td>
                                        {item.youtube_id ? (
                                            <a
                                                href={`https://youtube.com/watch?v=${encodeURIComponent(item.youtube_id)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="adminTablaEnlace"
                                            >
                                                {item.youtube_id}
                                            </a>
                                        ) : '—'}
                                    </td>
                                )}
                                {columnaVisible('spotify_id') && (
                                    <td className="adminTablaCeldaMono">
                                        {item.spotify_id ?? '—'}
                                    </td>
                                )}
                                {columnaVisible('estado') && (
                                    <td>
                                        <Badge variante={colorEstado(item.estado)}>{item.estado}</Badge>
                                    </td>
                                )}
                                {columnaVisible('intentos') && <td>{item.intentos}</td>}
                                {columnaVisible('lado') && <td>{item.lado}</td>}
                                {columnaVisible('sample_id') && (
                                    <td className="adminTablaCeldaMono">{item.sample_id ?? '—'}</td>
                                )}
                                {columnaVisible('timing') && (
                                    <td className="adminTablaCeldaMono">
                                        {formatearTiming(item.timing_inicio_seg, item.compas_inicio_seg, item.compas_fin_seg)}
                                    </td>
                                )}
                                {columnaVisible('bpm_detectado') && (
                                    <td>{item.bpm_detectado ?? '—'}</td>
                                )}
                                {columnaVisible('error_mensaje') && (
                                    <td className="adminTablaCeldaError" title={item.error_mensaje ?? ''}>
                                        {item.error_mensaje
                                            ? (item.error_mensaje.length > 40
                                                ? `${item.error_mensaje.slice(0, 40)}...`
                                                : item.error_mensaje)
                                            : '—'}
                                    </td>
                                )}
                                {columnaVisible('procesado_at') && <td>{formatearFecha(item.procesado_at)}</td>}
                                {columnaVisible('created_at') && <td>{formatearFecha(item.created_at)}</td>}
                                {columnaVisible('proximo_intento_at') && <td>{formatearFecha(item.proximo_intento_at)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginacion */}
            {totalPaginas > 1 && (
                <div className="adminPaginacion">
                    <BotonBase
                        variante="ghost"
                        className="adminPaginacionBoton"
                        onClick={() => tab.setPagina(tab.pagina - 1)}
                        disabled={tab.pagina <= 1}
                        type="button"
                    >
                        <ChevronLeft size={14} />
                    </BotonBase>
                    <span className="adminPaginacionTexto">
                        {tab.pagina} / {totalPaginas} ({tab.total} total)
                    </span>
                    <BotonBase
                        variante="ghost"
                        className="adminPaginacionBoton"
                        onClick={() => tab.setPagina(tab.pagina + 1)}
                        disabled={tab.pagina >= totalPaginas}
                        type="button"
                    >
                        <ChevronRight size={14} />
                    </BotonBase>
                </div>
            )}
        </div>
    );
};
