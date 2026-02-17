/*
 * Componente: TabModeracionAdmin — Kamples (FASE 13)
 * Lista de publicaciones pendientes de moderación y reportes.
 * Solo vista; lógica en useAdminPanel.
 */

import { CheckCircle, XCircle, AlertTriangle, Flag } from 'lucide-react';
import type { DatosModeracion } from '../../services/apiAdmin';

interface TabModeracionAdminProps {
    moderacion: DatosModeracion | null;
    onModerar: (tipo: 'publicacion' | 'comentario', id: number, accion: 'aprobar' | 'rechazar') => Promise<boolean>;
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

export const TabModeracionAdmin = ({
    moderacion,
    onModerar,
}: TabModeracionAdminProps): JSX.Element => {
    if (!moderacion) {
        return <div className="adminVacio">Cargando moderación...</div>;
    }

    const { publicaciones, reportes } = moderacion;
    const sinContenido = publicaciones.length === 0 && reportes.length === 0;

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
                                    <span className="adminModeracionFecha">
                                        {formatearFechaRelativa(pub.created_at)}
                                    </span>
                                </div>
                                <div className="adminModeracionContenido">
                                    {pub.contenido}
                                </div>
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

            {/* Reportes pendientes */}
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
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
