/*
 * Isla: NotificacionesIsland — Kamples (Fase 7.5)
 * Centro de notificaciones: likes, follows, comentarios, descargas, sistema.
 * Filtro por tipo, marcar leídas.
 */

import {
    Bell,
    Heart,
    UserPlus,
    MessageCircle,
    Download,
    CreditCard,
    Info,
    CheckCheck,
    ShieldAlert,
    AlertTriangle,
    Sparkles,
} from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { Badge } from '@app/components/ui/Badge';
import { Avatar } from '@app/components/ui/Avatar';
import type { TipoNotificacion } from '@app/services/apiNotificaciones';
import { useNotificacionesIsland } from '@app/hooks/useNotificacionesIsland';
import '../../styles/componentes/notificaciones.css';

/* Mapa de iconos por tipo */
const ICONOS_TIPO: Record<string, React.ReactNode> = {
    like: <Heart size={14} />,
    encanta: <Sparkles size={14} />,
    follow: <UserPlus size={14} />,
    comentario: <MessageCircle size={14} />,
    descarga: <Download size={14} />,
    mensaje: <MessageCircle size={14} />,
    pago: <CreditCard size={14} />,
    sistema: <Info size={14} />,
    moderacion: <ShieldAlert size={14} />,
    duplicado_detectado: <AlertTriangle size={14} />,
};

const FILTROS: { id: TipoNotificacion | 'todas'; etiqueta: string }[] = [
    { id: 'todas', etiqueta: 'Todas' },
    { id: 'like', etiqueta: 'Likes' },
    { id: 'follow', etiqueta: 'Follows' },
    { id: 'comentario', etiqueta: 'Comentarios' },
    { id: 'descarga', etiqueta: 'Descargas' },
];

/* Formatear tiempo relativo */
const formatearTiempo = (fecha: string): string => {
    const ahora = Date.now();
    const diff = ahora - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es');
};

export const NotificacionesIsland = (): JSX.Element => {
    const {
        filtro, setFiltro, cargando,
        manejarMarcarTodas, manejarClick,
        filtradas, noLeidas,
    } = useNotificacionesIsland();

    return (
        <div className="notificacionesIsland" id="notificacionesIsland">
            {/* Header */}
            <div className="notificacionesHeader">
                <div className="notificacionesHeaderTitulo">
                    <Bell size={20} />
                    <h1>Notificaciones</h1>
                    {noLeidas > 0 && (
                        <Badge variante="acento" tamano="xs">{noLeidas}</Badge>
                    )}
                </div>
                {noLeidas > 0 && (
                    <BotonBase variante="ghost" tamano="sm" onClick={manejarMarcarTodas}>
                        <CheckCheck size={14} />
                        Marcar todas
                    </BotonBase>
                )}
            </div>

            {/* Filtros */}
            <div className="notificacionesFiltros">
                {FILTROS.map((f) => (
                    <BotonBase variante="ghost"
                        key={f.id}
                        className={`notificacionesFiltro ${filtro === f.id ? 'notificacionesFiltroActivo' : ''}`}
                        onClick={() => setFiltro(f.id)}
                        type="button"
                    >
                        {f.etiqueta}
                    </BotonBase>
                ))}
            </div>

            {/* Lista */}
            {cargando ? (
                <div className="notificacionesVacio">Cargando...</div>
            ) : filtradas.length === 0 ? (
                <div className="notificacionesVacio">
                    <Bell size={32} />
                    <p>Sin notificaciones</p>
                </div>
            ) : (
                <div className="notificacionesLista">
                    {filtradas.map((notif) => (
                        <BotonBase variante="ghost"
                            key={notif.id}
                            className={`notificacionItem ${!notif.leida ? 'notificacionItemNoLeida' : ''}`}
                            onClick={() => manejarClick(notif)}
                            type="button"
                        >
                            <div className="notificacionItemIcono">
                                {notif.actor ? (
                                    <Avatar
                                        nombre={notif.actor.nombreVisible}
                                        src={notif.actor.avatarUrl ?? undefined}
                                        tamano="sm"
                                    />
                                ) : (
                                    <div className="notificacionItemIconoSistema">
                                        {ICONOS_TIPO[notif.tipo] ?? <Bell size={14} />}
                                    </div>
                                )}
                            </div>
                            <div className="notificacionItemContenido">
                                <span className="notificacionItemMensaje">
                                    {notif.mensaje}
                                </span>
                                <span className="notificacionItemTiempo">
                                    {formatearTiempo(notif.creadaAt)}
                                </span>
                            </div>
                            <div className="notificacionItemTipo">
                                {ICONOS_TIPO[notif.tipo] ?? <Bell size={14} />}
                            </div>
                            {!notif.leida && <div className="notificacionItemPunto" />}
                        </BotonBase>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificacionesIsland;
