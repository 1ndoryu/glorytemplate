/*
 * Componente: TabHistorialLotesAdmin — [223A-3]
 * Historial de lotes de automatización (extracción audio + scraper WhoSampled).
 * Muestra estado de automatización, botones de reactivación y tabla de lotes.
 */

import { useState } from 'react';
import { RefreshCw, Play, AlertTriangle, CheckCircle, Loader2, ChevronLeft, ChevronRight, PauseCircle } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { Badge } from '../ui/Badge';
import { SelectorMenu } from '../ui/SelectorMenu';
import { EstadoVacio } from '../ui/EstadoVacio';
import { useHistorialLotes } from '../../hooks/useHistorialLotes';
import type { TipoProceso } from '../../services/apiAutomatizacion';
import type { OpcionSelector } from '../ui/SelectorMenu';
import '../../styles/componentes/adminTablas.css';

const POR_PAGINA = 20;

const OPCIONES_TIPO: OpcionSelector[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'extraccion', etiqueta: 'Extracción Audio' },
    { valor: 'scraping', etiqueta: 'Scraper WhoSampled' },
];

type VarianteBadge = 'neutro' | 'acento' | 'exito' | 'error' | 'advertencia' | 'info';

const colorEstadoLote = (estado: string): VarianteBadge => {
    const mapa: Record<string, VarianteBadge> = {
        ejecutando: 'info',
        completado: 'exito',
        error: 'error',
        detenido: 'advertencia',
    };
    return mapa[estado] ?? 'neutro';
};

const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short' }) +
        ' ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
};

export const TabHistorialLotesAdmin = (): JSX.Element => {
    const hist = useHistorialLotes();
    const [reactivando, setReactivando] = useState<TipoProceso | null>(null);

    const totalPaginas = Math.ceil(hist.total / POR_PAGINA);

    const manejarReactivar = async (tipo: TipoProceso) => {
        setReactivando(tipo);
        await hist.reactivar(tipo);
        setReactivando(null);
    };

    return (
        <div className="adminTablaContenedor">
            {/* Estado de automatización */}
            {hist.estado && (
                <div className="adminTablaBarraSuperior">
                    <TarjetaEstadoProceso
                        titulo="Extracción Audio"
                        activo={hist.estado.extraccion.activo}
                        limiteLote={hist.estado.extraccion.limite_por_lote}
                        ultimoLote={hist.estado.extraccion.ultimo_lote}
                        reactivando={reactivando === 'extraccion'}
                        onReactivar={() => manejarReactivar('extraccion')}
                    />
                    <TarjetaEstadoProceso
                        titulo="Scraper WhoSampled"
                        activo={hist.estado.scraping.activo}
                        limiteLote={hist.estado.scraping.limite_por_lote}
                        ultimoLote={hist.estado.scraping.ultimo_lote}
                        fallosConsecutivos={hist.estado.scraping.fallos_consecutivos}
                        reactivando={reactivando === 'scraping'}
                        onReactivar={() => manejarReactivar('scraping')}
                    />
                </div>
            )}

            {/* Controles */}
            <div className="adminTablaBarraSuperior">
                <SelectorMenu
                    opciones={OPCIONES_TIPO}
                    valor={hist.filtroTipo}
                    onChange={(v) => { hist.setFiltroTipo(v as TipoProceso | ''); hist.setPagina(1); }}
                    placeholder="Filtrar por tipo"
                />
                <BotonBase variante="ghost" tamano="sm" onClick={hist.refrescar} title="Refrescar">
                    <RefreshCw size={14} />
                </BotonBase>
            </div>

            {/* Tabla de lotes */}
            {hist.cargando ? (
                <div className="adminTablaCargando"><Loader2 size={20} className="animacionGiro" /> Cargando...</div>
            ) : hist.lotes.length === 0 ? (
                <EstadoVacio mensaje="No hay lotes registrados" />
            ) : (
                <>
                    <table className="adminTabla">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                                <th>Inicio</th>
                                <th>Éxitos</th>
                                <th>Fallos</th>
                                <th>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hist.lotes.map(lote => (
                                <tr key={lote.id}>
                                    <td>{lote.id}</td>
                                    <td>
                                        <Badge variante={lote.tipo === 'extraccion' ? 'acento' : 'info'}>
                                            {lote.tipo === 'extraccion' ? 'Extracción' : 'Scraping'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge variante={colorEstadoLote(lote.estado)}>{lote.estado}</Badge>
                                    </td>
                                    <td className="celdaCompacta">{formatearFecha(lote.iniciado_at)}</td>
                                    <td className="celdaNumero">{lote.exitosos}</td>
                                    <td className="celdaNumero">{lote.fallidos}</td>
                                    <td className="celdaCompacta">
                                        <DetallesLote lote={lote} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                        <div className="adminTablaPaginacion">
                            <BotonBase
                                variante="ghost" tamano="sm"
                                onClick={() => hist.setPagina(p => Math.max(1, p - 1))}
                                disabled={hist.pagina <= 1}
                            >
                                <ChevronLeft size={14} />
                            </BotonBase>
                            <span>{hist.pagina} / {totalPaginas}</span>
                            <BotonBase
                                variante="ghost" tamano="sm"
                                onClick={() => hist.setPagina(p => Math.min(totalPaginas, p + 1))}
                                disabled={hist.pagina >= totalPaginas}
                            >
                                <ChevronRight size={14} />
                            </BotonBase>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/* Subcomponente: tarjeta de estado para cada tipo de proceso */
const TarjetaEstadoProceso = ({
    titulo,
    activo,
    limiteLote,
    ultimoLote,
    fallosConsecutivos,
    reactivando,
    onReactivar,
}: {
    titulo: string;
    activo: boolean;
    limiteLote: number;
    ultimoLote: { exitosos?: number; fallidos?: number; iniciado_at?: string } | null;
    fallosConsecutivos?: number;
    reactivando: boolean;
    onReactivar: () => void;
}): JSX.Element => (
    <div className="tarjetaEstadoProceso">
        <div className="tarjetaEstadoEncabezado">
            {activo ? <CheckCircle size={14} color="var(--colorExito, #22c55e)" /> : <PauseCircle size={14} color="var(--colorError, #ef4444)" />}
            <strong>{titulo}</strong>
            <Badge variante={activo ? 'exito' : 'error'}>{activo ? 'Activo' : 'Detenido'}</Badge>
        </div>
        <div className="tarjetaEstadoInfo">
            {limiteLote} items/lote · Cada hora
            {fallosConsecutivos !== undefined && fallosConsecutivos > 0 && (
                <span> · <AlertTriangle size={12} style={{ verticalAlign: 'middle' }} /> {fallosConsecutivos} fallos consecutivos</span>
            )}
        </div>
        {ultimoLote && (
            <div className="tarjetaEstadoUltimo">
                Último: {ultimoLote.exitosos ?? 0} ok / {ultimoLote.fallidos ?? 0} err — {formatearFecha(ultimoLote.iniciado_at ?? null)}
            </div>
        )}
        {!activo && (
            <BotonBase
                variante="primario"
                tamano="sm"
                onClick={onReactivar}
                disabled={reactivando}
                className="tarjetaEstadoReactivar"
            >
                {reactivando ? <Loader2 size={14} className="animacionGiro" /> : <Play size={14} />}
                Reactivar
            </BotonBase>
        )}
    </div>
);

/* Subcomponente: detalles específicos por tipo de lote */
const DetallesLote = ({ lote }: { lote: { tipo: string; recortes: number; samples_publicados: number; canciones_nuevas: number; sampleos_nuevos: number; error_mensaje: string | null } }): JSX.Element => {
    if (lote.tipo === 'extraccion') {
        return (
            <span className="detalleLoteTexto">
                {lote.recortes > 0 && <span>🎵 {lote.recortes} recortes</span>}
                {lote.samples_publicados > 0 && <span> · 📤 {lote.samples_publicados} pub.</span>}
                {lote.error_mensaje && <span title={lote.error_mensaje}> ⚠</span>}
            </span>
        );
    }
    return (
        <span className="detalleLoteTexto">
            {lote.canciones_nuevas > 0 && <span>🎶 {lote.canciones_nuevas} canciones</span>}
            {lote.sampleos_nuevos > 0 && <span> · 🔗 {lote.sampleos_nuevos} sampleos</span>}
            {lote.error_mensaje && <span title={lote.error_mensaje}> ⚠</span>}
        </span>
    );
};
