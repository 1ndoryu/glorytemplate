/*
 * Componente: TabColaExtraccionAdmin — QK40
 * Tabla de cola_extraccion_samples con búsqueda, filtro por estado y columnas ocultables.
 * Lógica delegada a useTabColaExtraccionAdmin.
 */

import { Search, ChevronLeft, ChevronRight, RefreshCw, Columns } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { BotonBase } from '../ui/BotonBase';
import { SelectorMenu } from '../ui/SelectorMenu';
import type { OpcionSelector } from '../ui/SelectorMenu';
import { CampoTexto } from '../ui/CampoTexto';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useTabColaExtraccionAdmin } from '@app/hooks/useTabColaExtraccionAdmin';
import { Checkbox } from '../ui/Checkbox';
import { useState } from 'react';
import '../../styles/componentes/adminTablas.css';

const POR_PAGINA = 25;

const OPCIONES_ESTADO: OpcionSelector[] = [
    { valor: '', etiqueta: 'Todos los estados' },
    { valor: 'pendiente', etiqueta: 'Pendiente' },
    { valor: 'descargando', etiqueta: 'Descargando' },
    { valor: 'analizando', etiqueta: 'Analizando' },
    { valor: 'recortando', etiqueta: 'Recortando' },
    { valor: 'extraido', etiqueta: 'Extraido' },
    { valor: 'completado', etiqueta: 'Completado' },
    { valor: 'error', etiqueta: 'Error' },
    { valor: 'revision_humana', etiqueta: 'Rev. Humana' },
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
    { id: 'relacion_id', etiqueta: 'Relación' },
    { id: 'youtube_id', etiqueta: 'YouTube' },
    { id: 'spotify_id', etiqueta: 'Spotify' },
    { id: 'estado', etiqueta: 'Estado' },
    { id: 'intentos', etiqueta: 'Intentos' },
    { id: 'lado', etiqueta: 'Lado' },
    { id: 'sample_id', etiqueta: 'Sample' },
    { id: 'timing', etiqueta: 'Timing' },
    { id: 'bpm_detectado', etiqueta: 'BPM' },
    { id: 'error_mensaje', etiqueta: 'Error' },
    { id: 'procesado_at', etiqueta: 'Procesado' },
    { id: 'created_at', etiqueta: 'Creado' },
    { id: 'proximo_intento_at', etiqueta: 'Prox. Intento' },
] as const;

const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const formatearTiming = (inicio: number | null, compasInicio: number | null, compasFin: number | null): string => {
    if (inicio == null && compasInicio == null) return '—';
    const partes: string[] = [];
    if (inicio != null) partes.push(`ini:${inicio.toFixed(1)}s`);
    if (compasInicio != null && compasFin != null) partes.push(`c:${compasInicio.toFixed(1)}-${compasFin.toFixed(1)}s`);
    return partes.join(' ');
};

export const TabColaExtraccionAdmin = (): JSX.Element => {
    const tab = useTabColaExtraccionAdmin();
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
                        placeholder="Buscar por YouTube ID, Spotify ID o error..."
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
                            {columnaVisible('relacion_id') && <th>Relación</th>}
                            {columnaVisible('youtube_id') && <th>YouTube</th>}
                            {columnaVisible('spotify_id') && <th>Spotify</th>}
                            {columnaVisible('estado') && <th>Estado</th>}
                            {columnaVisible('intentos') && <th>Intentos</th>}
                            {columnaVisible('lado') && <th>Lado</th>}
                            {columnaVisible('sample_id') && <th>Sample</th>}
                            {columnaVisible('timing') && <th>Timing</th>}
                            {columnaVisible('bpm_detectado') && <th>BPM</th>}
                            {columnaVisible('error_mensaje') && <th>Error</th>}
                            {columnaVisible('procesado_at') && <th>Procesado</th>}
                            {columnaVisible('created_at') && <th>Creado</th>}
                            {columnaVisible('proximo_intento_at') && <th>Prox. Intento</th>}
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
