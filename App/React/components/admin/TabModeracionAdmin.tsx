/*
 * Componente: TabModeracionAdmin — Kamples (FASE 13)
 * Lista de publicaciones pendientes de moderación, reportes con acciones,
 * e historial de moderación IA para supervisión de decisiones auto.
 * Solo vista; lógica en useAdminPanel.
 */

import { CheckCircle, XCircle, AlertTriangle, Flag, History, Eye, Trash2 } from 'lucide-react';
import type { DatosModeracion, PublicacionModeracion } from '../../services/apiAdmin';

interface TabModeracionAdminProps {
    moderacion: DatosModeracion | null;
    historialModeracion: PublicacionModeracion[];
    onModerar: (tipo: 'publicacion' | 'comentario', id: number, accion: 'aprobar' | 'rechazar') => Promise<boolean>;
    onResolverReporte: (id: number, accion: 'resolver' | 'descartar') => Promise<boolean>;
}

/* Formatear fecha relativa sencilla */
const formatearFechaRelativa = (fecha: string): string => {
    const ahora = Date.now();
    const ms = ahora - new Date(fecha).getTime();
    const minutos = Math.floor(ms / 60000);
    if (minutos < 60) return `hace ${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias}d`;
};

/* Badge de estado de moderación */
const BadgeEstado = ({ estado }: { estado: string }): JSX.Element => {
    const claseMap: Record<string, string> = {
        aprobado: 'adminBadgeExito',
        pendiente: 'adminBadgeAdvertencia',
        revision: 'adminBadgeAdvertencia',
        rechazado: 'adminBadgeError',
    };
    return (
        <span className={`adminBadge ${claseMap[estado] ?? 'adminBadgeNeutro'}`}>
            {estado}
        </span>
    );
};

export const TabModeracionAdmin = ({
    moderacion,
    historialModeracion,
    onModerar,
    onResolverReporte,
}: TabModeracionAdminProps): JSX.Element => {
    if (!moderacion) {
        return <div className="adminVacio">Cargando moderación...</div>;
    }

    const publicaciones = moderacion?.publicaciones ?? [];
    const reportes = moderacion?.reportes ?? [];
    const sinContenido = publicaciones.length === 0 && reportes.length === 0 && historialModeracion.length === 0;

    if (sinContenido) {
        return (
            <div className="adminVacio">
                <CheckCircle size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div>Todo en orden. No hay contenido pendiente de moderación.</div>
            </div>
        );
    }

    return (
        <div>
            {/* Publicaciones pendientes */}
            {publicaciones.length > 0 && (
                <>
                    <div className="adminSeccionTitulo">
                        <AlertTriangle size={16} />
                        Publicaciones pendientes ({publicaciones.length})
                    </div>
                    <div className="adminModeracionLista">
                        {publicaciones.map((pub) => (
                            <div key={pub.id} className="adminModeracionTarjeta">
                                <div className="adminModeracionCabecera">
                                    {pub.avatar_url && (
                                        <img src={pub.avatar_url} alt="" className="adminModeracionAvatar" />
                                    )}
                                    <span className="adminModeracionAutor">
                                        {pub.nombre_visible || pub.username}
                                    </span>
                                    <BadgeEstado estado={pub.moderacion_estado} />
                                    <span className="adminModeracionFecha">
                                        {formatearFechaRelativa(pub.created_at)}
                                    </span>
                                </div>
                                <div className="adminModeracionContenido">
                                    {pub.contenido}
                                </div>
                                {pub.moderacion_detalle && (
                                    <div className="adminModeracionDetalle">
                                        <Eye size={12} />
                                        <span>IA: {pub.moderacion_detalle}</span>
                                    </div>
                                )}
                                <div className="adminModeracionAcciones">
                                    <button
                                        className="adminModeracionBotonAprobar"
                                        onClick={() => onModerar('publicacion', pub.id, 'aprobar')}
                                        type="button"
                                    >
                                        <CheckCircle size={14} />
                                        Aprobar
                                    </button>
                                    <button
                                        className="adminModeracionBotonRechazar"
                                        onClick={() => onModerar('publicacion', pub.id, 'rechazar')}
                                        type="button"
                                    >
                                        <XCircle size={14} />
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Reportes pendientes con acciones */}
            {reportes.length > 0 && (
                <>
                    <div className="adminSeccionTitulo">
                        <Flag size={16} />
                        Reportes pendientes ({reportes.length})
                    </div>
                    <div className="adminModeracionLista">
                        {reportes.map((rep) => (
                            <div key={rep.id} className="adminModeracionTarjeta">
                                <div className="adminModeracionCabecera">
                                    <span className="adminModeracionAutor">
                                        @{rep.reportador_username}
                                    </span>
                                    <span className="adminModeracionFecha">
                                        {formatearFechaRelativa(rep.created_at)}
                                    </span>
                                </div>
                                <div className="adminModeracionContenido">
                                    <strong>{rep.tipo}</strong> #{rep.target_id} — {rep.motivo}
                                </div>
                                <div className="adminModeracionAcciones">
                                    <button
                                        className="adminModeracionBotonAprobar"
                                        onClick={() => onResolverReporte(rep.id, 'resolver')}
                                        type="button"
                                    >
                                        <CheckCircle size={14} />
                                        Resolver
                                    </button>
                                    <button
                                        className="adminModeracionBotonDescartar"
                                        onClick={() => onResolverReporte(rep.id, 'descartar')}
                                        type="button"
                                    >
                                        <Trash2 size={14} />
                                        Descartar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Historial de moderación IA — supervisión de decisiones automáticas */}
            {historialModeracion.length > 0 && (
                <>
                    <div className="adminSeccionTitulo">
                        <History size={16} />
                        Historial IA (últimas 48h)
                    </div>
                    <div className="adminModeracionLista">
                        {historialModeracion.map((pub) => (
                            <div key={pub.id} className="adminModeracionTarjeta adminModeracionHistorial">
                                <div className="adminModeracionCabecera">
                                    {pub.avatar_url && (
                                        <img src={pub.avatar_url} alt="" className="adminModeracionAvatar" />
                                    )}
                                    <span className="adminModeracionAutor">
                                        {pub.nombre_visible || pub.username}
                                    </span>
                                    <BadgeEstado estado={pub.moderacion_estado} />
                                    <span className="adminModeracionFecha">
                                        {formatearFechaRelativa(pub.created_at)}
                                    </span>
                                </div>
                                <div className="adminModeracionContenido">
                                    {pub.contenido}
                                </div>
                                {pub.moderacion_detalle && (
                                    <div className="adminModeracionDetalle">
                                        <Eye size={12} />
                                        <span>IA: {pub.moderacion_detalle}</span>
                                    </div>
                                )}
                                {/* Permitir override manual si fue auto-aprobada */}
                                {pub.moderacion_estado === 'aprobado' && (
                                    <div className="adminModeracionAcciones">
                                        <button
                                            className="adminModeracionBotonRechazar"
                                            onClick={() => onModerar('publicacion', pub.id, 'rechazar')}
                                            type="button"
                                        >
                                            <XCircle size={14} />
                                            Rechazar
                                        </button>
                                    </div>
                                )}
                                {(pub.moderacion_estado === 'revision' || pub.moderacion_estado === 'rechazado') && (
                                    <div className="adminModeracionAcciones">
                                        <button
                                            className="adminModeracionBotonAprobar"
                                            onClick={() => onModerar('publicacion', pub.id, 'aprobar')}
                                            type="button"
                                        >
                                            <CheckCircle size={14} />
                                            Aprobar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
