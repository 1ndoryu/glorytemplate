/*
 * Componente: TabModeracionAdmin — Kamples (FASE 13)
 * Lista de publicaciones pendientes de moderación, reportes con acciones,
 * e historial IA en grid de 3 columnas con JSON acordeona, menú contextual.
 * Solo vista; lógica en useAdminPanel.
 * - Menú contextual usa <MenuContextual> del sistema UI (posicionamiento por coords).
 * - Formulario de ban en <Modal> pequeno con <SelectorBase> e <Input>.
 */

import { useState, useCallback } from 'react';
import { AlertTriangle, Flag, Loader2, CheckCircle } from 'lucide-react';
import type { DatosModeracion, PublicacionModeracion } from '../../services/apiAdmin';
import { BotonBase, EstadoVacio, MenuContextual, Modal, SelectorBase, Input } from '../ui';
import type { MenuItemDef } from '../ui';

type DuracionBan = '1h' | '24h' | '7d' | '30d';

interface TabModeracionAdminProps {
    moderacion: DatosModeracion | null;
    historialModeracion: PublicacionModeracion[];
    onModerar: (tipo: 'publicacion' | 'comentario', id: number, accion: 'aprobar' | 'rechazar') => Promise<boolean>;
    onResolverReporte: (id: number, accion: 'resolver' | 'descartar') => Promise<boolean>;
    onRechazarTodosPendientes: () => Promise<boolean>;
    onBanear: (usuarioId: number, duracion: DuracionBan, razon: string) => Promise<boolean>;
    onRechazarTodasDeUsuario: (autorId: number) => Promise<boolean>;
}

/* Estado del menú contextual: compartido entre todas las tarjetas del historial */
interface EstadoMenu {
    abierto: boolean;
    x: number;
    y: number;
    pub: PublicacionModeracion | null;
}

/* Estado del modal de ban */
interface EstadoBanModal {
    abierto: boolean;
    pub: PublicacionModeracion | null;
    duracion: DuracionBan;
    razon: string;
}

const ESTADO_MENU_INICIAL: EstadoMenu = { abierto: false, x: 0, y: 0, pub: null };
const ESTADO_BAN_INICIAL: EstadoBanModal = { abierto: false, pub: null, duracion: '24h', razon: '' };

const formatearFechaRelativa = (fecha: string): string => {
    const ms = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 60) return `hace ${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)}d`;
};

const formatearJson = (raw: string | null): string => {
    if (!raw) return '';
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch { return raw; }
};

const BadgeEstado = ({ estado }: { estado: string }): JSX.Element => {
    const cls: Record<string, string> = {
        aprobado: 'adminBadgeExito', pendiente: 'adminBadgeAdvertencia',
        revision: 'adminBadgeAdvertencia', rechazado: 'adminBadgeError',
    };
    return <span className={`adminBadge ${cls[estado] ?? 'adminBadgeNeutro'}`}>{estado}</span>;
};

/* Tarjeta individual del historial IA */
const TarjetaHistorial = ({
    pub, onModerar, onAbrirMenu,
}: {
    pub: PublicacionModeracion;
    onModerar: TabModeracionAdminProps['onModerar'];
    onAbrirMenu: (e: React.MouseEvent, pub: PublicacionModeracion) => void;
}): JSX.Element => {
    const jsonFormateado = formatearJson(pub.moderacion_detalle);

    return (
        <div className="historialTarjeta">
            <div className="historialCabecera">
                {pub.avatar_url && (
                    <img src={pub.avatar_url} alt="" className="historialAvatar" />
                )}
                <div className="historialUsuarioInfo">
                    <span className="historialNombre">{pub.nombre_visible || pub.username}</span>
                    <span className="historialUsername">@{pub.username}</span>
                </div>
                <span className="historialFecha">{formatearFechaRelativa(pub.created_at)}</span>
            </div>

            <div className="historialBadges">
                <BadgeEstado estado={pub.moderacion_estado} />
                {pub.moderacion_razon && (
                    <span className="historialRazon">{pub.moderacion_razon}</span>
                )}
            </div>

            {pub.contenido && (
                <p className="historialContenidoTexto">{pub.contenido}</p>
            )}

            {/* QK46: Imagenes visibles por defecto, sin ocultar en details */}
            {pub.imagenes?.length > 0 && (
                <div className="adminModeracionImagenes">
                    {pub.imagenes.map(url => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="adminModeracionImagenLink">
                            <img src={url} alt="Imagen" className="adminModeracionImagen" loading="lazy" />
                        </a>
                    ))}
                </div>
            )}

            {jsonFormateado && (
                <details className="historialExpander">
                    <summary className="historialExpanderTrigger">Ver detalle IA</summary>
                    <div className="historialExpanderContenido">
                        <pre className="historialDetalleJson">{jsonFormateado}</pre>
                    </div>
                </details>
            )}

            <div className="historialAcciones">
                {pub.moderacion_estado !== 'aprobado' && (
                    <BotonBase
                        variante="ghost"
                        className="historialBoton historialBotonAprobar"
                        onClick={() => onModerar('publicacion', pub.id, 'aprobar')}
                        type="button"
                    >
                        Aprobar
                    </BotonBase>
                )}
                {pub.moderacion_estado !== 'rechazado' && (
                    <BotonBase
                        variante="ghost"
                        className="historialBoton historialBotonRechazar"
                        onClick={() => onModerar('publicacion', pub.id, 'rechazar')}
                        type="button"
                    >
                        Rechazar
                    </BotonBase>
                )}
                <BotonBase
                    variante="ghost"
                    className="historialMenuBoton"
                    onClick={(e) => onAbrirMenu(e, pub)}
                    type="button"
                    title="Más opciones"
                >
                    ···
                </BotonBase>
            </div>
        </div>
    );
};

export const TabModeracionAdmin = ({
    moderacion,
    historialModeracion,
    onModerar,
    onResolverReporte,
    onRechazarTodosPendientes,
    onBanear,
    onRechazarTodasDeUsuario,
}: TabModeracionAdminProps): JSX.Element => {
    const [menu, setMenu] = useState<EstadoMenu>(ESTADO_MENU_INICIAL);
    const [banModal, setBanModal] = useState<EstadoBanModal>(ESTADO_BAN_INICIAL);

    const cerrarMenu = useCallback(() => setMenu(ESTADO_MENU_INICIAL), []);

    const abrirMenu = useCallback((e: React.MouseEvent, pub: PublicacionModeracion) => {
        e.stopPropagation();
        setMenu({ abierto: true, x: e.clientX, y: e.clientY, pub });
    }, []);

    const abrirModalBan = useCallback(() => {
        if (!menu.pub) return;
        setBanModal({ abierto: true, pub: menu.pub, duracion: '24h', razon: '' });
        cerrarMenu();
    }, [menu.pub, cerrarMenu]);

    const cerrarModalBan = useCallback(() => setBanModal(ESTADO_BAN_INICIAL), []);

    const aplicarBan = useCallback(async () => {
        if (!banModal.pub?.autor_id) return;
        await onBanear(banModal.pub.autor_id, banModal.duracion, banModal.razon || 'Revisión manual');
        cerrarModalBan();
    }, [banModal, onBanear, cerrarModalBan]);

    const itemsMenu: MenuItemDef[] = menu.pub ? [
        {
            id: 'banear',
            etiqueta: 'Banear usuario',
            peligro: true,
            onClick: abrirModalBan,
        },
        {
            id: 'rechazar-todas',
            etiqueta: 'Rechazar todas las publicaciones',
            peligro: true,
            onClick: async () => {
                if (!menu.pub?.autor_id) return;
                await onRechazarTodasDeUsuario(menu.pub.autor_id);
                cerrarMenu();
            },
        },
    ] : [];

    if (!moderacion) {
        return (
            <EstadoVacio
                mensaje="Cargando moderación..."
                icono={<Loader2 size={24} className="adminSpinner" />}
            />
        );
    }

    const publicaciones = moderacion.publicaciones ?? [];
    const reportes = moderacion.reportes ?? [];
    const sinContenido = publicaciones.length === 0 && reportes.length === 0 && historialModeracion.length === 0;

    if (sinContenido) {
        return (
            <EstadoVacio
                mensaje="Todo en orden. No hay contenido pendiente de moderación."
                icono={<CheckCircle size={24} />}
            />
        );
    }

    return (
        <>
            <div>
                {/* Publicaciones pendientes */}
                {publicaciones.length > 0 && (
                    <>
                        <div className="adminModeracionLista">
                            <div className="adminModeracionCabeceraSeccion">
                                <AlertTriangle size={14} />
                                Publicaciones pendientes ({publicaciones.length})
                                <BotonBase
                                    variante="ghost"
                                    className="adminModeracionBotonDescartar"
                                    onClick={onRechazarTodosPendientes}
                                    type="button"
                                >
                                    Rechazar todos
                                </BotonBase>
                            </div>
                            {publicaciones.map((pub) => (
                                <div key={pub.id} className="adminModeracionTarjeta">
                                    <div className="adminModeracionCabecera">
                                        {pub.avatar_url && (
                                            <img src={pub.avatar_url} alt="" className="adminModeracionAvatar" />
                                        )}
                                        <span className="adminModeracionAutor">{pub.nombre_visible || pub.username}</span>
                                        <BadgeEstado estado={pub.moderacion_estado} />
                                        {pub.moderacion_razon && (
                                            <span className="adminModeracionRazon">{pub.moderacion_razon}</span>
                                        )}
                                        <span className="adminModeracionFecha">{formatearFechaRelativa(pub.created_at)}</span>
                                    </div>
                                    <div className="adminModeracionContenido">{pub.contenido}</div>
                                    <div className="adminModeracionAcciones">
                                        <BotonBase variante="ghost" className="historialBoton historialBotonAprobar" onClick={() => onModerar('publicacion', pub.id, 'aprobar')} type="button">Aprobar</BotonBase>
                                        <BotonBase variante="ghost" className="historialBoton historialBotonRechazar" onClick={() => onModerar('publicacion', pub.id, 'rechazar')} type="button">Rechazar</BotonBase>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Reportes pendientes */}
                {reportes.length > 0 && (
                    <>
                        <div className="adminModeracionLista">
                            <div className="adminModeracionCabeceraSeccion">
                                <Flag size={14} />
                                Reportes pendientes ({reportes.length})
                            </div>
                            {reportes.map((rep) => (
                                <div key={rep.id} className="adminModeracionTarjeta">
                                    <div className="adminModeracionCabecera">
                                        <span className="adminModeracionAutor">@{rep.reportador_username}</span>
                                        <span className="adminModeracionFecha">{formatearFechaRelativa(rep.created_at)}</span>
                                    </div>
                                    <div className="adminModeracionContenido">
                                        <strong>{rep.tipo}</strong> #{rep.target_id} — {rep.razon}
                                        {rep.detalles && (
                                            <div className="adminModeracionDetalles">{rep.detalles}</div>
                                        )}
                                    </div>
                                    <div className="adminModeracionAcciones">
                                        <BotonBase variante="ghost" className="historialBoton historialBotonAprobar" onClick={() => onResolverReporte(rep.id, 'resolver')} type="button">Resolver</BotonBase>
                                        <BotonBase variante="ghost" className="historialBoton" onClick={() => onResolverReporte(rep.id, 'descartar')} type="button">Descartar</BotonBase>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Historial IA: grid de 3 columnas con JSON acordeona y menu contextual */}
                {historialModeracion.length > 0 && (
                    <>
                        <div className="historialGrid">
                            {historialModeracion.map((pub) => (
                                <TarjetaHistorial
                                    key={pub.id}
                                    pub={pub}
                                    onModerar={onModerar}
                                    onAbrirMenu={abrirMenu}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Menú contextual compartido: abre desde el botón ··· de cada tarjeta */}
            <MenuContextual
                abierto={menu.abierto}
                x={menu.x}
                y={menu.y}
                onCerrar={cerrarMenu}
                items={itemsMenu}
                alinearDerecha
            />

            {/* Modal de ban: formulario con selector de duración y campo de razón */}
            <Modal
                abierto={banModal.abierto}
                onCerrar={cerrarModalBan}
                titulo={`Banear a @${banModal.pub?.username ?? ''}`}
                tamano="pequeno"
                pie={
                    <>
                        <BotonBase variante="ghost" onClick={cerrarModalBan} type="button">Cancelar</BotonBase>
                        <BotonBase variante="peligro" onClick={aplicarBan} type="button">Aplicar ban</BotonBase>
                    </>
                }
            >
                <SelectorBase
                    etiqueta="Duración del ban"
                    value={banModal.duracion}
                    onChange={(e) => setBanModal(prev => ({ ...prev, duracion: e.target.value as DuracionBan }))}
                >
                    <option value="1h">1 hora</option>
                    <option value="24h">24 horas</option>
                    <option value="7d">7 días</option>
                    <option value="30d">30 días</option>
                </SelectorBase>
                <Input
                    placeholder="Razón (opcional)"
                    value={banModal.razon}
                    onChange={(e) => setBanModal(prev => ({ ...prev, razon: e.target.value }))}
                    style={{ marginTop: 'var(--espacioMd)', width: '100%', boxSizing: 'border-box' }}
                />
            </Modal>
        </>
    );
};
