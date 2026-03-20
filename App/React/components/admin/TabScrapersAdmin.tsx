/*
 * Componente: TabScrapersAdmin — QK40
 * Tabla del scraping_log con búsqueda, filtro por estado y columnas ocultables.
 * Lógica delegada a useTabScrapersAdmin.
 */

import { Search, ChevronLeft, ChevronRight, RefreshCw, Columns, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import type { OpcionSelector } from '../ui/SelectorMenu';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabScrapersAdmin } from '@app/hooks/useTabScrapersAdmin';
import { Checkbox } from '../ui/Checkbox';
import { useT } from '@app/utils/i18n/useT';
import { useState, useMemo } from 'react';
import '../../styles/componentes/adminTablas.css';

const POR_PAGINA = 25;

/* QK66: Mapa de etiquetas para estados de scraping */
const ETIQUETAS_ESTADO_SCRAPING: Record<string, string> = {
    pending: 'Pending',
    scraped: 'Scraped',
    error: 'Error',
    skipped: 'Skipped',
};

type VarianteBadge = 'neutro' | 'acento' | 'exito' | 'error' | 'advertencia' | 'info';

const colorEstado = (estado: string): VarianteBadge => {
    const mapa: Record<string, VarianteBadge> = {
        pending: 'advertencia',
        scraped: 'exito',
        error: 'error',
        skipped: 'neutro',
    };
    return mapa[estado] ?? 'neutro';
};

const COLUMNAS = [
    { id: 'contenido', etiqueta: 'Contenido', sortKey: 'url' },
    { id: 'url', etiqueta: 'URL', sortKey: 'url' },
    { id: 'tipo_pagina', etiqueta: 'Tipo', sortKey: 'tipo_pagina' },
    { id: 'estado', etiqueta: 'Estado', sortKey: 'estado' },
    { id: 'intentos', etiqueta: 'Intentos', sortKey: 'intentos' },
    { id: 'bytes_descargados', etiqueta: 'Bytes', sortKey: 'bytes_descargados' },
    { id: 'error_mensaje', etiqueta: 'Error', sortKey: 'error_mensaje' },
    { id: 're_scrapeable', etiqueta: 'Re-scrapeable', sortKey: 're_scrapeable' },
    { id: 'veces_rescrapeado', etiqueta: 'Veces', sortKey: 'veces_rescrapeado' },
    { id: 'procesado_at', etiqueta: 'Procesado', sortKey: 'procesado_at' },
    { id: 'created_at', etiqueta: 'Creado', sortKey: 'created_at' },
] as const;

const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatearBytes = (bytes: number): string => {
    const n = Number(bytes);
    if (!n || n <= 0) return '0 B';
    const k = 1024;
    const unidades = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / Math.pow(k, i)).toFixed(1)} ${unidades[i]}`;
};

const truncarUrl = (url: string, max = 50): string =>
    url.length > max ? `${url.slice(0, max)}...` : url;

/* QK66: Extraer artista/título legible del path de WhoSampled.
 * Patrones: /Artista/Cancion/..., /Artista/, /hot-samples/, etc. */
const extraerContenidoUrl = (url: string): string => {
    try {
        const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
        const segmentos = path.split('/').filter(Boolean);
        /* Filtrar segmentos genéricos (sampled, contains, covered, etc.) */
        const genericos = new Set(['sampled', 'contains', 'covered', 'remixed', 'samples', 'hot-samples']);
        const relevantes = segmentos.filter(s => !genericos.has(s.toLowerCase()));
        if (relevantes.length === 0) return segmentos[0] ?? '—';
        return relevantes.map(s => s.replace(/-/g, ' ')).join(' — ');
    } catch {
        return '—';
    }
};

export const TabScrapersAdmin = (): JSX.Element => {
    const tab = useTabScrapersAdmin();
    const totalPaginas = Math.ceil(tab.total / POR_PAGINA);
    const [menuColumnasAbierto, setMenuColumnasAbierto] = useState(false);
    const { t } = useT();

    /* QK66: Construir opciones de estado dinámicamente */
    const opcionesEstado = useMemo((): OpcionSelector[] => {
        const base: OpcionSelector[] = [{ valor: '', etiqueta: 'Todos los estados' }];
        return base.concat(
            Object.entries(tab.estadosCuenta).map(([estado, total]) => ({
                valor: estado,
                etiqueta: `${ETIQUETAS_ESTADO_SCRAPING[estado] ?? estado} (${total})`,
            }))
        );
    }, [tab.estadosCuenta]);

    const columnaVisible = (id: string): boolean => !tab.columnasOcultas.has(id);

    const renderTh = (sortKey: string, etiqueta: string) => (
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
                        placeholder={t('admin.buscar.scrapers')}
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
                            {columnaVisible('contenido') && renderTh('url', 'Contenido')}
                            {columnaVisible('url') && renderTh('url', 'URL')}
                            {columnaVisible('tipo_pagina') && renderTh('tipo_pagina', 'Tipo')}
                            {columnaVisible('estado') && renderTh('estado', 'Estado')}
                            {columnaVisible('intentos') && renderTh('intentos', 'Intentos')}
                            {columnaVisible('bytes_descargados') && renderTh('bytes_descargados', 'Bytes')}
                            {columnaVisible('error_mensaje') && renderTh('error_mensaje', 'Error')}
                            {columnaVisible('re_scrapeable') && renderTh('re_scrapeable', 'Re-scrap.')}
                            {columnaVisible('veces_rescrapeado') && renderTh('veces_rescrapeado', 'Veces')}
                            {columnaVisible('procesado_at') && renderTh('procesado_at', 'Procesado')}
                            {columnaVisible('created_at') && renderTh('created_at', 'Creado')}
                        </tr>
                    </thead>
                    <tbody>
                        {tab.items.length === 0 && !tab.cargando && (
                            <tr>
                                <td colSpan={12}>
                                    <EstadoVacio
                                        mensaje="No se encontraron registros de scraping"
                                        icono={<Search size={24} />}
                                    />
                                </td>
                            </tr>
                        )}
                        {tab.items.map(item => (
                            <tr key={item.id}>
                                <td className="adminTablaCeldaMono">{item.id}</td>
                                {columnaVisible('contenido') && (
                                    <td title={item.url}>{extraerContenidoUrl(item.url)}</td>
                                )}
                                {columnaVisible('url') && (
                                    <td title={item.url} className="adminTablaCeldaUrl">
                                        {truncarUrl(item.url)}
                                    </td>
                                )}
                                {columnaVisible('tipo_pagina') && <td>{item.tipo_pagina}</td>}
                                {columnaVisible('estado') && (
                                    <td>
                                        <Badge variante={colorEstado(item.estado)}>{item.estado}</Badge>
                                    </td>
                                )}
                                {columnaVisible('intentos') && <td>{item.intentos}</td>}
                                {columnaVisible('bytes_descargados') && (
                                    <td className="adminTablaCeldaMono">{formatearBytes(item.bytes_descargados)}</td>
                                )}
                                {columnaVisible('error_mensaje') && (
                                    <td className="adminTablaCeldaError" title={item.error_mensaje ?? ''}>
                                        {item.error_mensaje ? truncarUrl(item.error_mensaje, 40) : '—'}
                                    </td>
                                )}
                                {columnaVisible('re_scrapeable') && (
                                    <td>{item.re_scrapeable ? 'Si' : 'No'}</td>
                                )}
                                {columnaVisible('veces_rescrapeado') && <td>{item.veces_rescrapeado}</td>}
                                {columnaVisible('procesado_at') && <td>{formatearFecha(item.procesado_at)}</td>}
                                {columnaVisible('created_at') && <td>{formatearFecha(item.created_at)}</td>}
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
