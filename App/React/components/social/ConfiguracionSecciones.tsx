/* sentinel-disable-file limite-lineas — ConfiguracionSecciones contiene múltiples secciones
 * del modal de configuración (perfil, cuenta, notificaciones, apariencia, bloqueos, legal, admin)
 * que son sub-componentes inline de estado local + i18n. Dividirlas añadiría complejidad sin
 * beneficio real — cada sección depende del hook HookConfiguracion compartido. */

/*
 * Componente: ConfiguracionSecciones — Kamples (QL89)
 * Contenido compartido entre las vistas Desktop y Móvil de ModalConfiguracion.
 * Extraído para cumplir SRP y limite de 300 líneas.
 * [183A-111] i18n: useT + SelectorIdioma integrado en sección "apariencia".
 */

import {useState} from 'react';
import {ImagePlus, Bell, BellOff, User, Shield, Palette, Ban, Music, ChevronRight, Scale, ExternalLink, Wrench, Globe} from 'lucide-react';
import {obtenerImagenColor} from '@app/services/imagenesColor';
import {Avatar} from '@app/components/ui/Avatar';
import {BotonBase} from '@app/components/ui/BotonBase';
import {usePanelLateralStore} from '@app/stores/panelLateralStore';
import {useModalConfiguracion, type SeccionConfig} from '@app/hooks/useModalConfiguracion';
import {SeccionBloqueos} from './SeccionBloqueos';
import {SeccionAdminVersiones} from './SeccionAdminVersiones';
import {useGenerosModalStore} from '@app/stores/generosModalStore';
import {abrirEnlaceExterno} from '@app/utils/plataforma';
import {useReproductorStore} from '@app/stores/reproductorStore';
import {invalidarCacheFeed} from '@app/utils/cacheFeedPersistente';
import {CampoTexto} from '../ui/CampoTexto';
import {Input} from '../ui/Input';
import {useT} from '@app/utils/i18n';
import {SelectorIdioma} from '@app/components/ui/SelectorIdioma';

/* Tipo del resultado del hook — usado en Desktop y Móvil */
export type HookConfiguracion = ReturnType<typeof useModalConfiguracion>;

/* Sub-componente: preferencia autoplay (evita re-renders) */
const AutoplayPreferencia = (): JSX.Element => {
    const { t } = useT();
    const autoplay = useReproductorStore(s => s.autoplay);
    const toggleAutoplay = useReproductorStore(s => s.toggleAutoplay);
    return (
        <div className="configSeccion">
            <label className="configLabel">{t('config.autoplay')}</label>
            <span className="configSubtexto">{t('config.autoplay.descripcion')}</span>
            <div className="configTemaOpciones" role="group" aria-label={t('config.autoplay')}>
                <BotonBase variante={autoplay ? 'primario' : 'secundario'} tamano="sm" onClick={() => { if (!autoplay) toggleAutoplay(); }} type="button">
                    {t('config.autoplay.activado')}
                </BotonBase>
                <BotonBase variante={!autoplay ? 'primario' : 'secundario'} tamano="sm" onClick={() => { if (autoplay) toggleAutoplay(); }} type="button">
                    {t('config.autoplay.desactivado')}
                </BotonBase>
            </div>
        </div>
    );
};

/* Sub-componente: preferencia panel lateral al dar like (evita re-renders) */
const PanelLateralPreferencia = (): JSX.Element => {
    const { t } = useT();
    const sugerenciasAlDarLike = usePanelLateralStore(s => s.sugerenciasAlDarLike);
    const setSugerenciasAlDarLike = usePanelLateralStore(s => s.setSugerenciasAlDarLike);
    return (
        <div className="configSeccion">
            <label className="configLabel">{t('config.panelLateral')}</label>
            <span className="configSubtexto">{t('config.panelLateral.descripcion')}</span>
            <div className="configTemaOpciones" role="group" aria-label={t('config.panelLateral')}>
                <BotonBase variante={sugerenciasAlDarLike ? 'primario' : 'secundario'} tamano="sm" onClick={() => setSugerenciasAlDarLike(true)} type="button">
                    {t('config.autoplay.activado')}
                </BotonBase>
                <BotonBase variante={!sugerenciasAlDarLike ? 'primario' : 'secundario'} tamano="sm" onClick={() => setSugerenciasAlDarLike(false)} type="button">
                    {t('config.autoplay.desactivado')}
                </BotonBase>
            </div>
        </div>
    );
};

interface NavItemConfig {
    id: SeccionConfig;
    etiqueta: string;
    icono: JSX.Element;
}
export const SECCIONES_NAV: NavItemConfig[] = [
    {id: 'perfil', etiqueta: 'Perfil', icono: <User size={16} />},
    {id: 'cuenta', etiqueta: 'Cuenta', icono: <Shield size={16} />},
    {id: 'notificaciones', etiqueta: 'Notificaciones', icono: <Bell size={16} />},
    {id: 'apariencia', etiqueta: 'Apariencia', icono: <Palette size={16} />},
    {id: 'bloqueos', etiqueta: 'Bloqueos', icono: <Ban size={16} />},
    {id: 'legal', etiqueta: 'Legal', icono: <Scale size={16} />},
    /* [193A-31] Tab admin — solo visible para rol admin */
    {id: 'admin', etiqueta: 'Admin', icono: <Wrench size={16} />}
];

/* Renderiza el contenido de la sección activa (compartido) */
export const ContenidoSeccion = ({h}: {h: HookConfiguracion}): JSX.Element | null => {
    const { t } = useT();
    switch (h.seccionActiva) {
        case 'perfil':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.portada')}</label>
                        <div className="configPortadaContenedor" onClick={() => h.inputPortadaRef.current?.click()} role="button" aria-label={t('config.cambiarPortada')}>
                            <img src={h.portadaPreview || h.usuario?.portadaUrl || obtenerImagenColor((h.usuario?.id ?? 0) + 100)} alt={t('config.portada')} className="configPortadaImg" />
                            <div className="configPortadaOverlay"><ImagePlus size={24} /></div>
                            <Input ref={h.inputPortadaRef} type="file" accept="image/*" hidden onChange={h.manejarCambioPortada} />
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.fotoPerfil')}</label>
                        <div className="configFotoContenedor" onClick={() => h.inputFotoRef.current?.click()} role="button" aria-label={t('config.cambiarFoto')}>
                            <Avatar src={h.avatarActual} nombre={h.nombreVisible || 'U'} tamano="lg" />
                            <Input ref={h.inputFotoRef} type="file" accept="image/*" hidden onChange={h.manejarCambioFoto} />
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.nombreCompleto')}</label>
                        <CampoTexto variante="desnudo" className="configInput" value={h.nombreVisible} onChange={e => h.setNombreVisible(e.target.value)} placeholder={t('config.nombreCompleto')} maxLength={50} />
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.nombreUsuario')}</label>
                        <div className="configInputConPrefijo">
                            <span className="configPrefijo">@</span>
                            <CampoTexto variante="desnudo" className="configInput" value={h.username} onChange={e => h.setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" maxLength={30} />
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.bio')}</label>
                        <CampoTexto multilínea variante="desnudo" className="configTextarea" value={h.bio} onChange={e => h.setBio(e.target.value)} placeholder={t('config.bio')} maxLength={300} rows={3} />
                        <span className="configContador">{300 - h.bio.length}</span>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.sitioWeb')}</label>
                        <CampoTexto variante="desnudo" className="configInput" value={h.sitioWeb} onChange={e => h.setSitioWeb(e.target.value)} placeholder="https://tu-pagina.com" maxLength={500} />
                    </div>
                </>
            );

        case 'cuenta':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">Email</label>
                        <span className="configSubtexto">{h.usuario?.email ?? ''}</span>
                        {!h.emailEditando ? (
                            <BotonBase variante="secundario" tamano="sm" onClick={() => h.setEmailEditando(true)}>Cambiar email</BotonBase>
                        ) : (
                            <div className="configFormInline">
                                <CampoTexto type="email" variante="desnudo" className="configInput" value={h.nuevoEmail} onChange={e => h.setNuevoEmail(e.target.value)} placeholder="Nuevo email" />
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.emailPasswordActual} onChange={e => h.setEmailPasswordActual(e.target.value)} placeholder={t('config.contrasena.actual')} autoComplete="current-password" />
                                <div className="configFormAcciones">
                                    <BotonBase variante="primario" tamano="sm" onClick={h.manejarCambiarEmail} disabled={h.cambiandoEmail || !h.nuevoEmail.trim() || !h.emailPasswordActual}>
                                        {h.cambiandoEmail ? t('config.guardando') : t('comun.confirmar')}
                                    </BotonBase>
                                    <BotonBase variante="ghost" tamano="sm" onClick={() => h.setEmailEditando(false)} disabled={h.cambiandoEmail}>{t('comun.cancelar')}</BotonBase>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.contrasena.cambiar')}</label>
                        {!h.passwordEditando ? (
                            <BotonBase variante="secundario" tamano="sm" onClick={() => h.setPasswordEditando(true)}>{t('config.contrasena.cambiar')}</BotonBase>
                        ) : (
                            <div className="configFormInline">
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.passwordActual} onChange={e => h.setPasswordActual(e.target.value)} placeholder={t('config.contrasena.actual')} autoComplete="current-password" />
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.nuevaPassword} onChange={e => h.setNuevaPassword(e.target.value)} placeholder={t('config.contrasena.nueva')} autoComplete="new-password" />
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.confirmarPassword} onChange={e => h.setConfirmarPassword(e.target.value)} placeholder={t('config.contrasena.confirmar')} autoComplete="new-password" />
                                <div className="configFormAcciones">
                                    <BotonBase variante="primario" tamano="sm" onClick={h.manejarCambiarPassword} disabled={h.cambiandoPassword || !h.passwordActual || !h.nuevaPassword || !h.confirmarPassword}>
                                        {h.cambiandoPassword ? t('config.guardando') : t('comun.confirmar')}
                                    </BotonBase>
                                    <BotonBase variante="ghost" tamano="sm" onClick={() => h.setPasswordEditando(false)} disabled={h.cambiandoPassword}>{t('comun.cancelar')}</BotonBase>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* [183A-96] PayPal email para retiros de ganancias */}
                    <div className="configSeccion">
                        <label className="configLabel">PayPal para retiros</label>
                        <span className="configSubtexto">Email de PayPal donde recibirás tus ganancias por venta de samples.</span>
                        <div className="configFormInline">
                            <CampoTexto type="email" variante="desnudo" className="configInput" value={h.paypalEmail} onChange={e => h.setPaypalEmail(e.target.value)} placeholder="tu-email@paypal.com" />
                            <BotonBase variante="primario" tamano="sm" onClick={h.manejarGuardarPaypal} disabled={h.guardandoPaypal}>
                                {h.guardandoPaypal ? t('config.guardando') : t('comun.guardar')}
                            </BotonBase>
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel configLabelPeligro">Zona de peligro</label>
                        <BotonBase variante="secundario" tamano="md" onClick={() => console.info('TO-DO: Eliminar cuenta')}>{t('config.eliminarCuenta')}</BotonBase>
                    </div>
                </>
            );

        case 'notificaciones':
            return (
                <>
                    <div className="configSeccion configSeccionHorizontal">
                        <div className="configSeccionInfo">
                            <span className="configLabel">{t('config.notif.likes')}</span>
                            <span className="configSubtexto">{t('config.notif.comentarios')}</span>
                        </div>
                        <BotonBase variante="ghost" className={`configToggle ${h.notificaciones ? 'configToggleActivo' : ''}`} onClick={() => h.setNotificaciones(!h.notificaciones)} type="button">
                            {h.notificaciones ? <Bell size={14} /> : <BellOff size={14} />}
                        </BotonBase>
                    </div>
                    <div className="configSeccion configSeccionHorizontal">
                        <div className="configSeccionInfo">
                            <span className="configLabel">{t('config.notif.nuevosSeguidores')}</span>
                        </div>
                        <BotonBase variante="ghost" className="configToggle configToggleActivo" type="button"><Bell size={14} /></BotonBase>
                    </div>
                    <div className="configSeccion configSeccionHorizontal">
                        <div className="configSeccionInfo">
                            <span className="configLabel">{t('config.notif.mensajes')}</span>
                        </div>
                        <BotonBase variante="ghost" className="configToggle configToggleActivo" type="button"><Bell size={14} /></BotonBase>
                    </div>
                </>
            );

        case 'apariencia':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.tema')}</label>
                        <div className="configTemaOpciones" role="group" aria-label={t('config.tema')}>
                            <BotonBase variante={h.temaSeleccionado === 'dark' ? 'primario' : 'secundario'} tamano="sm" onClick={() => h.manejarCambioTema('dark')} type="button">{t('config.tema.oscuro')}</BotonBase>
                            <BotonBase variante={h.temaSeleccionado === 'light' ? 'primario' : 'secundario'} tamano="sm" onClick={() => h.manejarCambioTema('light')} type="button">{t('config.tema.claro')}</BotonBase>
                        </div>
                    </div>
                    <PanelLateralPreferencia />
                    <AutoplayPreferencia />
                    {/* [183A-111] Selector de idioma integrado en la sección apariencia */}
                    <div className="configSeccion">
                        <label className="configLabel">
                            <Globe size={14} style={{display: 'inline', marginRight: '6px', verticalAlign: 'middle'}} />
                            {t('config.idioma')}
                        </label>
                        <span className="configSubtexto">{t('config.idioma.descripcion')}</span>
                        <SelectorIdioma variante="completo" />
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.generos')}</label>
                        <BotonBase variante="secundario" tamano="sm" onClick={() => { useGenerosModalStore.getState().abrir(); }} type="button">
                            <Music size={14} /> {t('config.editarGeneros')}
                        </BotonBase>
                    </div>
                </>
            );

        case 'bloqueos':
            return <SeccionBloqueos />;

        /* [193A-31] Sección admin: herramientas de debug solo para administradores */
        case 'admin':
            return <SeccionAdmin />;

        case 'legal':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">{t('config.legal')}</label>
                        <span className="configSubtexto">{t('config.politicaPrivacidad')}</span>
                    </div>
                    <div className="configSeccion">
                        <BotonBase variante="secundario" tamano="sm" onClick={() => abrirEnlaceExterno('https://kamples.com/privacy/')}>
                            <Scale size={14} /> {t('config.politicaPrivacidad')} <ExternalLink size={12} />
                        </BotonBase>
                    </div>
                    <div className="configSeccion">
                        <BotonBase variante="secundario" tamano="sm" onClick={() => abrirEnlaceExterno('https://kamples.com/terms/')}>
                            <Scale size={14} /> {t('config.terminosServicio')} <ExternalLink size={12} />
                        </BotonBase>
                    </div>
                </>
            );

        default:
            return null;
    }
};

/* [193A-31] Sub-componente: sección admin con toggle de debug score */
const SeccionAdmin = (): JSX.Element => {
    const [debugActivo, setDebugActivo] = useState(
        () => typeof window !== 'undefined' && localStorage.getItem('kamples_debug_score') === '1'
    );
    const [logsActivos, setLogsActivos] = useState(
        () => typeof window !== 'undefined' && localStorage.getItem('kamples_debug_timing') === '1'
    );

    const toggleDebugScore = () => {
        const nuevo = !debugActivo;
        localStorage.setItem('kamples_debug_score', nuevo ? '1' : '0');
        setDebugActivo(nuevo);
        /* [193A-38] Invalidar cache del feed para que la próxima carga
         * re-fetche con/sin debug=1 y los badges aparezcan/desaparezcan */
        invalidarCacheFeed();
    };

    /* [2003A-3] Toggle de logs de rendimiento del algoritmo.
     * Cuando está activo, aparece un botón en el menú de perfil para abrir
     * el modal de métricas (historial de timings, promedio, última medición).
     * Los logs se escriben server-side siempre para userId 1 — este toggle
     * solo controla la visibilidad del botón en el menú. */
    const toggleLogs = () => {
        const nuevo = !logsActivos;
        localStorage.setItem('kamples_debug_timing', nuevo ? '1' : '0');
        setLogsActivos(nuevo);
    };

    return (
        <>
            <div className="configSeccion configSeccionHorizontal">
                <div className="configSeccionInfo">
                    <span className="configLabel">Debug score</span>
                    <span className="configSubtexto">Muestra el score del algoritmo de recomendación en cada sample del feed.</span>
                </div>
                <BotonBase variante="ghost" className={`configToggle ${debugActivo ? 'configToggleActivo' : ''}`} onClick={toggleDebugScore} type="button">
                    <Wrench size={14} />
                </BotonBase>
            </div>
            <div className="configSeccion configSeccionHorizontal">
                <div className="configSeccionInfo">
                    <span className="configLabel">Logs de rendimiento</span>
                    <span className="configSubtexto">Muestra el botón de métricas del algoritmo en el menú de perfil (mediciones en tiempo real para user 1).</span>
                </div>
                <BotonBase variante="ghost" className={`configToggle ${logsActivos ? 'configToggleActivo' : ''}`} onClick={toggleLogs} type="button">
                    <Wrench size={14} />
                </BotonBase>
            </div>
            {/* [2003A-16] Gestión de versiones de app directamente desde el VPS */}
            <SeccionAdminVersiones />
        </>
    );
};

/* Lista de navegación de secciones (compartida) */
export const NavSecciones = ({h}: {h: HookConfiguracion}): JSX.Element => {
    const { t } = useT();
    const esAdmin = h.usuario?.rol === 'admin';
    const secciones = esAdmin ? SECCIONES_NAV : SECCIONES_NAV.filter(s => s.id !== 'admin');

    /* [183A-111] Mapa de id → clave i18n para las etiquetas de navegación */
    const etiquetaI18n: Record<string, string> = {
        perfil: t('config.perfil'),
        cuenta: t('config.cuenta'),
        notificaciones: t('config.notificaciones'),
        apariencia: t('config.apariencia'),
        bloqueos: t('config.bloqueos'),
        legal: t('config.legal'),
        admin: t('config.admin'),
    };

    return (
        <nav className="configNavLista">
            {secciones.map(item => (
                <BotonBase variante="ghost" key={item.id}
                    className={`configNavItem ${h.seccionActiva === item.id ? 'configNavItemActivo' : ''}`}
                    onClick={() => { h.setSeccionActiva(item.id); h.seleccionarSeccionMovil(item.id); }}
                    type="button"
                >
                    {item.icono}
                    {etiquetaI18n[item.id] ?? item.etiqueta}
                    <ChevronRight size={14} className="configNavChevron" />
                </BotonBase>
            ))}
        </nav>
    );
};
