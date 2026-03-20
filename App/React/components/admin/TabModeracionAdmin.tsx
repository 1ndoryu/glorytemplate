/* glory-sentinel-disable-file limite-lineas — Panel de moderación con 4 secciones diferenciadas
 * (publicaciones pendientes, reportes, historial IA, modal de ban). Split no viable sin
 * fragmentar UI que conceptualmente es una sola vista de moderación.
 */
/*
 * Componente: TabModeracionAdmin — Kamples (FASE 13)
 * Lista de publicaciones pendientes de moderación, reportes con acciones,
 * e historial IA en grid de 3 columnas con JSON acordeona, menú contextual.
 * Solo vista; lógica en useAdminPanel.
 * - Menú contextual usa <MenuContextual> del sistema UI (posicionamiento por coords).
 * - Formulario de ban en <Modal> pequeno con <SelectorBase> e <Input>.
 */

import { useState, useCallback } from 'react';
import { AlertTriangle, Flag, Loader2, CheckCircle, BookOpen } from 'lucide-react';
import { useT } from '@app/utils/i18n/useT';
import { getT } from '@app/utils/i18n';
import type { DatosModeracion, PublicacionModeracion, ArticuloModeracion } from '../../services/apiAdmin';
import { BotonBase, EstadoVacio, MenuContextual, Modal, SelectorBase, Input } from '../ui';
import type { MenuItemDef } from '../ui';

type DuracionBan = '1h' | '24h' | '7d' | '30d';

interface TabModeracionAdminProps {
    moderacion: DatosModeracion | null;
    historialModeracion: PublicacionModeracion[];
    onModerar: (tipo: 'publicacion' | 'comentario' | 'articulo', id: number, accion: 'aprobar' | 'rechazar') => Promise<boolean>;
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
    const t = getT();
    const ms = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 60) return t('tiempo.haceMinutos', { n: min });
    const h = Math.floor(min / 60);
    if (h < 24) return t('tiempo.haceHoras', { n: h });
    return t('tiempo.haceDias', { n: Math.floor(h / 24) });
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
    const { t } = useT();

    return (
        <div className="historialTarjeta">
            <div className="historialCabecera">
                <a href={`/perfil/${pub.username}/`} target="_blank" rel="noopener noreferrer" className="historialPerfilLink" title={t('admin.verPerfil')}>
                    {pub.avatar_url && (
                        <img src={pub.avatar_url} alt="" className="historialAvatar" />
                    )}
                </a>
                <div className="historialUsuarioInfo">
                    <a href={`/perfil/${pub.username}/`} target="_blank" rel="noopener noreferrer" className="historialNombreLink">
                        <span className="historialNombre">{pub.nombre_visible || pub.username}</span>
                    </a>
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
                    <summary className="historialExpanderTrigger">{t('admin.moderacion.verDetalleIa')}</summary>
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
                        {t('admin.moderacion.aprobar')}
                    </BotonBase>
                )}
                {pub.moderacion_estado !== 'rechazado' && (
                    <BotonBase
                        variante="ghost"
                        className="historialBoton historialBotonRechazar"
                        onClick={() => onModerar('publicacion', pub.id, 'rechazar')}
                        type="button"
                    >
                        {t('admin.moderacion.rechazar')}
                    </BotonBase>
                )}
                <BotonBase
                    variante="ghost"
                    className="historialMenuBoton"
                    onClick={(e) => onAbrirMenu(e, pub)}
                    type="button"
                    title={t('comun.masOpciones')}
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
    const { t } = useT();
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
            etiqueta: t('admin.moderacion.banearUsuario'),
            peligro: true,
            onClick: abrirModalBan,
        },
        {
            id: 'rechazar-todas',
            etiqueta: t('admin.moderacion.rechazarTodas'),
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
                mensaje={t('admin.moderacion.cargando')}
                icono={<Loader2 size={24} className="adminSpinner" />}
            />
        );
    }

    const publicaciones = moderacion.publicaciones ?? [];
    const articulos = moderacion.articulos ?? [];
    const reportes = moderacion.reportes ?? [];
    const sinContenido = publicaciones.length === 0 && articulos.length === 0 && reportes.length === 0 && historialModeracion.length === 0;

    if (sinContenido) {
        return (
            <EstadoVacio
                mensaje={t('admin.moderacion.todoEnOrden')}
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
                                {t('admin.moderacion.publicacionesPendientes', { cantidad: publicaciones.length })}
                                <BotonBase
                                    variante="ghost"
                                    className="adminModeracionBotonDescartar"
                                    onClick={onRechazarTodosPendientes}
                                    type="button"
                                >
                                    {t('admin.moderacion.rechazarTodos')}
                                </BotonBase>
                            </div>
                            {publicaciones.map((pub) => (
                                <div key={pub.id} className="adminModeracionTarjeta">
                                    <div className="adminModeracionCabecera">
                                        <a href={`/perfil/${pub.username}/`} target="_blank" rel="noopener noreferrer" className="adminModeracionPerfilLink" title={t('admin.verPerfil')}>
                                            {pub.avatar_url && (
                                                <img src={pub.avatar_url} alt="" className="adminModeracionAvatar" />
                                            )}
                                        </a>
                                        <a href={`/perfil/${pub.username}/`} target="_blank" rel="noopener noreferrer" className="adminModeracionNombreLink">
                                            <span className="adminModeracionAutor">{pub.nombre_visible || pub.username}</span>
                                        </a>
                                        <BadgeEstado estado={pub.moderacion_estado} />
                                        {pub.moderacion_razon && (
                                            <span className="adminModeracionRazon">{pub.moderacion_razon}</span>
                                        )}
                                        <span className="adminModeracionFecha">{formatearFechaRelativa(pub.created_at)}</span>
                                    </div>
                                    <div className="adminModeracionContenido">{pub.contenido}</div>
                                    <div className="adminModeracionAcciones">
                                        <BotonBase variante="ghost" className="historialBoton historialBotonAprobar" onClick={() => onModerar('publicacion', pub.id, 'aprobar')} type="button">{t('admin.moderacion.aprobar')}</BotonBase>
                                        <BotonBase variante="ghost" className="historialBoton historialBotonRechazar" onClick={() => onModerar('publicacion', pub.id, 'rechazar')} type="button">{t('admin.moderacion.rechazar')}</BotonBase>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* [183A-109 Fase 4] Artículos pendientes de moderación */}
                {articulos.length > 0 && (
                    <>
                        <div className="adminModeracionLista">
                            <div className="adminModeracionCabeceraSeccion">
                                <BookOpen size={14} />
                                {t('admin.moderacion.articulosPendientes', { cantidad: articulos.length })}
                            </div>
                            {articulos.map((art: ArticuloModeracion) => (
                                <div key={art.id} className="adminModeracionTarjeta">
                                    <div className="adminModeracionCabecera">
                                        {art.autor_avatar && (
                                            <img src={art.autor_avatar} alt="" className="adminModeracionAvatar" />
                                        )}
                                        <span className="adminModeracionAutor">{art.autor_nombre || art.autor_username}</span>
                                        <BadgeEstado estado={art.moderacion_estado} />
                                        <span className="adminModeracionFecha">{formatearFechaRelativa(art.created_at)}</span>
                                    </div>
                                    <div className="adminModeracionContenido">
                                        <strong>{art.titulo}</strong>
                                        {art.extracto && <p style={{ margin: '4px 0 0', opacity: 0.7 }}>{art.extracto}</p>}
                                    </div>
                                    <div className="adminModeracionAcciones">
                                        <BotonBase variante="ghost" className="historialBoton" onClick={() => window.open(`/blog/${art.slug}/`, '_blank')} type="button">{t('admin.moderacion.ver')}</BotonBase>
                                        <BotonBase variante="ghost" className="historialBoton historialBotonAprobar" onClick={() => onModerar('articulo', art.id, 'aprobar')} type="button">{t('admin.moderacion.aprobar')}</BotonBase>
                                        <BotonBase variante="ghost" className="historialBoton historialBotonRechazar" onClick={() => onModerar('articulo', art.id, 'rechazar')} type="button">{t('admin.moderacion.rechazar')}</BotonBase>
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
                                {t('admin.moderacion.reportesPendientes', { cantidad: reportes.length })}
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
                                        <BotonBase variante="ghost" className="historialBoton historialBotonAprobar" onClick={() => onResolverReporte(rep.id, 'resolver')} type="button">{t('admin.moderacion.resolver')}</BotonBase>
                                        <BotonBase variante="ghost" className="historialBoton" onClick={() => onResolverReporte(rep.id, 'descartar')} type="button">{t('admin.moderacion.descartar')}</BotonBase>
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
                titulo={t('admin.moderacion.banearA', { username: banModal.pub?.username ?? '' })}
                tamano="pequeno"
                pie={
                    <>
                        <BotonBase variante="ghost" onClick={cerrarModalBan} type="button">{t('comun.cancelar')}</BotonBase>
                        <BotonBase variante="peligro" onClick={aplicarBan} type="button">{t('admin.moderacion.aplicarBan')}</BotonBase>
                    </>
                }
            >
                <SelectorBase
                    etiqueta={t('admin.moderacion.duracionBan')}
                    value={banModal.duracion}
                    onChange={(e) => setBanModal(prev => ({ ...prev, duracion: e.target.value as DuracionBan }))}
                >
                    <option value="1h">{t('admin.moderacion.1hora')}</option>
                    <option value="24h">{t('admin.moderacion.24horas')}</option>
                    <option value="7d">{t('admin.moderacion.7dias')}</option>
                    <option value="30d">{t('admin.moderacion.30dias')}</option>
                </SelectorBase>
                <Input
                    placeholder={t('admin.moderacion.razonPlaceholder')}
                    value={banModal.razon}
                    onChange={(e) => setBanModal(prev => ({ ...prev, razon: e.target.value }))}
                    style={{ marginTop: 'var(--espacioMd)', width: '100%', boxSizing: 'border-box' }}
                />
            </Modal>
        </>
    );
};
