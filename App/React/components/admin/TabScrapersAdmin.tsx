/*
 * Componente: TabScrapersAdmin — QK40
 * Tabla del scraping_log con búsqueda, filtro por estado y columnas ocultables.
 * Lógica delegada a useTabScrapersAdmin.
 */

import { Search, ChevronLeft, ChevronRight, RefreshCw, Columns } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import type { OpcionSelector } from '../ui/SelectorMenu';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabScrapersAdmin } from '@app/hooks/useTabScrapersAdmin';
import { Checkbox } from '../ui/Checkbox';
import { useState } from 'react';
import '../../styles/componentes/adminTablas.css';

const POR_PAGINA = 25;

const OPCIONES_ESTADO: OpcionSelector[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'pending', etiqueta: 'Pending' },
    { valor: 'scraped', etiqueta: 'Scraped' },
    { valor: 'error', etiqueta: 'Error' },
    { valor: 'skipped', etiqueta: 'Skipped' },
];

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
    { id: 'url', etiqueta: 'URL' },
    { id: 'tipo_pagina', etiqueta: 'Tipo' },
    { id: 'estado', etiqueta: 'Estado' },
    { id: 'intentos', etiqueta: 'Intentos' },
    { id: 'bytes_descargados', etiqueta: 'Bytes' },
    { id: 'error_mensaje', etiqueta: 'Error' },
    { id: 're_scrapeable', etiqueta: 'Re-scrapeable' },
    { id: 'veces_rescrapeado', etiqueta: 'Veces' },
    { id: 'procesado_at', etiqueta: 'Procesado' },
    { id: 'created_at', etiqueta: 'Creado' },
] as const;

const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatearBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const unidades = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${unidades[i]}`;
};

const truncarUrl = (url: string, max = 50): string =>
    url.length > max ? `${url.slice(0, max)}...` : url;

export const TabScrapersAdmin = (): JSX.Element => {
    const tab = useTabScrapersAdmin();
    const totalPaginas = Math.ceil(tab.total / POR_PAGINA);
    const [menuColumnasAbierto, setMenuColumnasAbierto] = useState(false);

    const columnaVisible = (id: string): boolean => !tab.columnasOcultas.has(id);

    return (
        <div className="adminTablaDatos">
            {/* Controles */}
            <div className="adminTablaDatosControles">
                <div className="adminBusquedaContenedor">
                    <Search size={14} className="adminBusquedaIcono" />
                    <CampoTexto
                        className="adminTablaDatosBusqueda"
                        variante="bordado"
                        placeholder="Buscar por URL, tipo o error..."
                        value={tab.busqueda}
                        onChange={(e) => tab.cambiarBusqueda(e.target.value)}
                    />
                </div>
                <SelectorMenu
                    opciones={OPCIONES_ESTADO}
                    valor={tab.filtroEstado}
                    onChange={tab.cambiarFiltroEstado}
                />
                <div className="adminTablaDatosAccionesExtra">
                    <BotonBase
                        variante="ghost"
                        tamano="ninguno"
                        className="adminBotonAccion"
                        title="Refrescar"
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
                            <th>ID</th>
                            {columnaVisible('url') && <th>URL</th>}
                            {columnaVisible('tipo_pagina') && <th>Tipo</th>}
                            {columnaVisible('estado') && <th>Estado</th>}
                            {columnaVisible('intentos') && <th>Intentos</th>}
                            {columnaVisible('bytes_descargados') && <th>Bytes</th>}
                            {columnaVisible('error_mensaje') && <th>Error</th>}
                            {columnaVisible('re_scrapeable') && <th>Re-scrap.</th>}
                            {columnaVisible('veces_rescrapeado') && <th>Veces</th>}
                            {columnaVisible('procesado_at') && <th>Procesado</th>}
                            {columnaVisible('created_at') && <th>Creado</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {tab.items.length === 0 && !tab.cargando && (
                            <tr>
                                <td colSpan={11}>
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
