/*
 * Componente: ListaHistorialAdmin — QK14
 * Lista compacta de historial para el tab Resumen del admin panel.
 * Muestra stats de cola IA + items recientes en cola/pendiente.
 * Solo vista — datos vienen de props (useAdminPanel).
 */

import { Clock, AlertCircle, CheckCircle, Loader2, ListFilter } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { ItemColaIa, EstadisticasColaIa } from '../../services/apiColaIa';

interface ListaHistorialAdminProps {
    stats: EstadisticasColaIa | null;
    items: ItemColaIa[];
}

/* Colores de badge por estado */
const COLORES_ESTADO: Record<string, 'exito' | 'advertencia' | 'error' | 'info' | 'neutro'> = {
    pendiente: 'info',
    procesando: 'advertencia',
    completado: 'exito',
    error_reintento: 'advertencia',
    error_final: 'error',
};

const ETIQUETAS_ESTADO: Record<string, string> = {
    pendiente: 'Pendiente',
    procesando: 'Procesando',
    completado: 'Completado',
    error_reintento: 'Reintento',
    error_final: 'Error',
};

/* Iconos por estado */
const iconoPorEstado = (estado: string): JSX.Element => {
    switch (estado) {
        case 'pendiente': return <Clock size={12} />;
        case 'procesando': return <Loader2 size={12} className="adminSpinner" />;
        case 'completado': return <CheckCircle size={12} />;
        default: return <AlertCircle size={12} />;
    }
};

/* Formatear fecha relativa compacta */
const formatearTiempoRelativo = (fechaStr: string): string => {
    const fecha = new Date(fechaStr);
    const ahora = Date.now();
    const diffMs = ahora - fecha.getTime();
    const minutos = Math.floor(diffMs / 60000);

    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `${minutos}m`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;

    const dias = Math.floor(horas / 24);
    return `${dias}d`;
};

export const ListaHistorialAdmin = ({ stats, items }: ListaHistorialAdminProps): JSX.Element => {
    const hayItems = items.length > 0;

    return (
        <div className="adminHistorialContenedor">
            <div className="adminHistorialCabecera">
                <div className="adminHistorialTitulo">
                    <ListFilter size={16} />
                    Cola de procesamiento
                </div>
            </div>

            {/* Stats compactos en fila */}
            {stats && (
                <div className="adminHistorialStats">
                    <div className="adminHistorialStat">
                        <span className="adminHistorialStatValor">{stats.pendientes}</span>
                        <span className="adminHistorialStatEtiqueta">Pendientes</span>
                    </div>
                    <div className="adminHistorialStat">
                        <span className="adminHistorialStatValor">{stats.procesando}</span>
                        <span className="adminHistorialStatEtiqueta">Procesando</span>
                    </div>
                    <div className="adminHistorialStat">
                        <span className="adminHistorialStatValor">{stats.completados_hoy}</span>
                        <span className="adminHistorialStatEtiqueta">Hoy</span>
                    </div>
                    <div className="adminHistorialStat">
                        <span className="adminHistorialStatValor">{stats.en_reintento}</span>
                        <span className="adminHistorialStatEtiqueta">Reintento</span>
                    </div>
                    <div className="adminHistorialStat">
                        <span className="adminHistorialStatValor">{stats.errores}</span>
                        <span className="adminHistorialStatEtiqueta">Errores</span>
                    </div>
                </div>
            )}

            {/* Lista compacta de items recientes */}
            {hayItems ? (
                <div className="adminHistorialLista">
                    {items.map(item => (
                        <div key={item.id} className="adminHistorialItem">
                            <span className="adminHistorialItemIcono">
                                {iconoPorEstado(item.estado)}
                            </span>
                            <span className="adminHistorialItemInfo">
                                <span className="adminHistorialItemTipo">{item.tipo}</span>
                                <span className="adminHistorialItemOp">{item.operacion}</span>
                            </span>
                            <Badge variante={COLORES_ESTADO[item.estado] ?? 'neutro'}>
                                {ETIQUETAS_ESTADO[item.estado] ?? item.estado}
                            </Badge>
                            {item.ultimo_error && (
                                <span className="adminHistorialItemError" title={item.ultimo_error}>
                                    <AlertCircle size={12} />
                                </span>
                            )}
                            <span className="adminHistorialItemTiempo">
                                {formatearTiempoRelativo(item.created_at)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="adminHistorialVacio">
                    <CheckCircle size={16} />
                    <span>Sin items en cola</span>
                </div>
            )}
        </div>
    );
};
