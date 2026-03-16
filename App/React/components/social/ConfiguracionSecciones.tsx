/*
 * Componente: ConfiguracionSecciones — Kamples (QL89)
 * Contenido compartido entre las vistas Desktop y Móvil de ModalConfiguracion.
 * Extraído para cumplir SRP y limite de 300 líneas.
 */

import {ImagePlus, Bell, BellOff, User, Shield, Palette, Ban, Music, Mail, Lock, ChevronRight, Scale, ExternalLink} from 'lucide-react';
import {obtenerImagenColor} from '@app/services/imagenesColor';
import {Avatar} from '@app/components/ui/Avatar';
import {BotonBase} from '@app/components/ui/BotonBase';
import {usePanelLateralStore} from '@app/stores/panelLateralStore';
import {useModalConfiguracion, type SeccionConfig} from '@app/hooks/useModalConfiguracion';
import {SeccionBloqueos} from './SeccionBloqueos';
import {useGenerosModalStore} from '@app/stores/generosModalStore';
import {abrirEnlaceExterno} from '@app/utils/plataforma';
import {useReproductorStore} from '@app/stores/reproductorStore';
import {CampoTexto} from '../ui/CampoTexto';
import {Input} from '../ui/Input';

/* Tipo del resultado del hook — usado en Desktop y Móvil */
export type HookConfiguracion = ReturnType<typeof useModalConfiguracion>;

/* Sub-componente: preferencia autoplay (evita re-renders) */
const AutoplayPreferencia = (): JSX.Element => {
    const autoplay = useReproductorStore(s => s.autoplay);
    const toggleAutoplay = useReproductorStore(s => s.toggleAutoplay);
    return (
        <div className="configSeccion">
            <label className="configLabel">Reproduccion automatica</label>
            <span className="configSubtexto">Reproducir el siguiente sample automaticamente al terminar el actual.</span>
            <div className="configTemaOpciones" role="group" aria-label="Autoplay">
                <BotonBase variante={autoplay ? 'primario' : 'secundario'} tamano="sm" onClick={() => { if (!autoplay) toggleAutoplay(); }} type="button">
                    Activado
                </BotonBase>
                <BotonBase variante={!autoplay ? 'primario' : 'secundario'} tamano="sm" onClick={() => { if (autoplay) toggleAutoplay(); }} type="button">
                    Desactivado
                </BotonBase>
            </div>
        </div>
    );
};

/* Sub-componente: preferencia panel lateral al dar like (evita re-renders) */
const PanelLateralPreferencia = (): JSX.Element => {
    const sugerenciasAlDarLike = usePanelLateralStore(s => s.sugerenciasAlDarLike);
    const setSugerenciasAlDarLike = usePanelLateralStore(s => s.setSugerenciasAlDarLike);
    return (
        <div className="configSeccion">
            <label className="configLabel">Panel lateral</label>
            <span className="configSubtexto">Mostrar sugerencias en el panel lateral al dar like a un sample.</span>
            <div className="configTemaOpciones" role="group" aria-label="Panel lateral al dar like">
                <BotonBase variante={sugerenciasAlDarLike ? 'primario' : 'secundario'} tamano="sm" onClick={() => setSugerenciasAlDarLike(true)} type="button">
                    Activado
                </BotonBase>
                <BotonBase variante={!sugerenciasAlDarLike ? 'primario' : 'secundario'} tamano="sm" onClick={() => setSugerenciasAlDarLike(false)} type="button">
                    Desactivado
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
    {id: 'legal', etiqueta: 'Legal', icono: <Scale size={16} />}
];

/* Renderiza el contenido de la sección activa (compartido) */
export const ContenidoSeccion = ({h}: {h: HookConfiguracion}): JSX.Element | null => {
    switch (h.seccionActiva) {
        case 'perfil':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">Portada</label>
                        <div className="configPortadaContenedor" onClick={() => h.inputPortadaRef.current?.click()} role="button" aria-label="Cambiar portada">
                            <img src={h.portadaPreview || h.usuario?.portadaUrl || obtenerImagenColor((h.usuario?.id ?? 0) + 100)} alt="Portada" className="configPortadaImg" />
                            <div className="configPortadaOverlay"><ImagePlus size={24} /></div>
                            <Input ref={h.inputPortadaRef} type="file" accept="image/*" hidden onChange={h.manejarCambioPortada} />
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">Foto de perfil</label>
                        <div className="configFotoContenedor" onClick={() => h.inputFotoRef.current?.click()} role="button" aria-label="Cambiar foto de perfil">
                            <Avatar src={h.avatarActual} nombre={h.nombreVisible || 'U'} tamano="lg" />
                            <Input ref={h.inputFotoRef} type="file" accept="image/*" hidden onChange={h.manejarCambioFoto} />
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">Nombre visible</label>
                        <CampoTexto variante="desnudo" className="configInput" value={h.nombreVisible} onChange={e => h.setNombreVisible(e.target.value)} placeholder="Tu nombre" maxLength={50} />
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">Username</label>
                        <div className="configInputConPrefijo">
                            <span className="configPrefijo">@</span>
                            <CampoTexto variante="desnudo" className="configInput" value={h.username} onChange={e => h.setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" maxLength={30} />
                        </div>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">Descripción / Bio</label>
                        <CampoTexto multilínea variante="desnudo" className="configTextarea" value={h.bio} onChange={e => h.setBio(e.target.value)} placeholder="Cuéntanos sobre ti..." maxLength={300} rows={3} />
                        <span className="configContador">{300 - h.bio.length}</span>
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel">Enlace</label>
                        <CampoTexto variante="desnudo" className="configInput" value={h.sitioWeb} onChange={e => h.setSitioWeb(e.target.value)} placeholder="https://tu-pagina.com" maxLength={500} />
                        <span className="configSubtexto">Se mostrará en tu perfil público.</span>
                    </div>
                </>
            );

        case 'cuenta':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel"><Mail size={14} /> Email</label>
                        <span className="configSubtexto">{h.usuario?.email ?? ''}</span>
                        {!h.emailEditando ? (
                            <BotonBase variante="secundario" tamano="sm" onClick={() => h.setEmailEditando(true)}>Cambiar email</BotonBase>
                        ) : (
                            <div className="configFormInline">
                                <CampoTexto type="email" variante="desnudo" className="configInput" value={h.nuevoEmail} onChange={e => h.setNuevoEmail(e.target.value)} placeholder="Nuevo email" />
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.emailPasswordActual} onChange={e => h.setEmailPasswordActual(e.target.value)} placeholder="Contraseña actual" autoComplete="current-password" />
                                <div className="configFormAcciones">
                                    <BotonBase variante="primario" tamano="sm" onClick={h.manejarCambiarEmail} disabled={h.cambiandoEmail || !h.nuevoEmail.trim() || !h.emailPasswordActual}>
                                        {h.cambiandoEmail ? 'Guardando...' : 'Confirmar'}
                                    </BotonBase>
                                    <BotonBase variante="ghost" tamano="sm" onClick={() => h.setEmailEditando(false)} disabled={h.cambiandoEmail}>Cancelar</BotonBase>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel"><Lock size={14} /> Contraseña</label>
                        {!h.passwordEditando ? (
                            <BotonBase variante="secundario" tamano="sm" onClick={() => h.setPasswordEditando(true)}>Cambiar contraseña</BotonBase>
                        ) : (
                            <div className="configFormInline">
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.passwordActual} onChange={e => h.setPasswordActual(e.target.value)} placeholder="Contraseña actual" autoComplete="current-password" />
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.nuevaPassword} onChange={e => h.setNuevaPassword(e.target.value)} placeholder="Nueva contraseña" autoComplete="new-password" />
                                <CampoTexto type="password" variante="desnudo" className="configInput" value={h.confirmarPassword} onChange={e => h.setConfirmarPassword(e.target.value)} placeholder="Confirmar nueva contraseña" autoComplete="new-password" />
                                <div className="configFormAcciones">
                                    <BotonBase variante="primario" tamano="sm" onClick={h.manejarCambiarPassword} disabled={h.cambiandoPassword || !h.passwordActual || !h.nuevaPassword || !h.confirmarPassword}>
                                        {h.cambiandoPassword ? 'Guardando...' : 'Confirmar'}
                                    </BotonBase>
                                    <BotonBase variante="ghost" tamano="sm" onClick={() => h.setPasswordEditando(false)} disabled={h.cambiandoPassword}>Cancelar</BotonBase>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="configSeccion">
                        <label className="configLabel configLabelPeligro">Zona de peligro</label>
                        <BotonBase variante="secundario" tamano="md" onClick={() => console.info('TO-DO: Eliminar cuenta')}>Eliminar cuenta</BotonBase>
                    </div>
                </>
            );

        case 'notificaciones':
            return (
                <>
                    <div className="configSeccion configSeccionHorizontal">
                        <div className="configSeccionInfo">
                            <span className="configLabel">Likes y comentarios</span>
                            <span className="configSubtexto">Recibir alertas cuando alguien interactúa con tu contenido</span>
                        </div>
                        <BotonBase variante="ghost" className={`configToggle ${h.notificaciones ? 'configToggleActivo' : ''}`} onClick={() => h.setNotificaciones(!h.notificaciones)} type="button">
                            {h.notificaciones ? <Bell size={14} /> : <BellOff size={14} />}
                        </BotonBase>
                    </div>
                    <div className="configSeccion configSeccionHorizontal">
                        <div className="configSeccionInfo">
                            <span className="configLabel">Nuevos seguidores</span>
                            <span className="configSubtexto">Notificar cuando alguien te sigue</span>
                        </div>
                        <BotonBase variante="ghost" className="configToggle configToggleActivo" type="button"><Bell size={14} /></BotonBase>
                    </div>
                    <div className="configSeccion configSeccionHorizontal">
                        <div className="configSeccionInfo">
                            <span className="configLabel">Mensajes</span>
                            <span className="configSubtexto">Alertas de mensajes directos</span>
                        </div>
                        <BotonBase variante="ghost" className="configToggle configToggleActivo" type="button"><Bell size={14} /></BotonBase>
                    </div>
                </>
            );

        case 'apariencia':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">Tema</label>
                        <span className="configSubtexto">Elige cómo quieres ver la interfaz.</span>
                        <div className="configTemaOpciones" role="group" aria-label="Selector de tema">
                            <BotonBase variante={h.temaSeleccionado === 'dark' ? 'primario' : 'secundario'} tamano="sm" onClick={() => h.manejarCambioTema('dark')} type="button">Oscuro</BotonBase>
                            <BotonBase variante={h.temaSeleccionado === 'light' ? 'primario' : 'secundario'} tamano="sm" onClick={() => h.manejarCambioTema('light')} type="button">Claro</BotonBase>
                        </div>
                    </div>
                    <PanelLateralPreferencia />
                    <AutoplayPreferencia />
                    <div className="configSeccion">
                        <label className="configLabel">Generos favoritos</label>
                        <span className="configSubtexto">Personaliza tu feed eligiendo tus generos musicales preferidos.</span>
                        <BotonBase variante="secundario" tamano="sm" onClick={() => { useGenerosModalStore.getState().abrir(); }} type="button">
                            <Music size={14} /> Editar generos
                        </BotonBase>
                    </div>
                </>
            );

        case 'bloqueos':
            return <SeccionBloqueos />;

        case 'legal':
            return (
                <>
                    <div className="configSeccion">
                        <label className="configLabel">Información legal</label>
                        <span className="configSubtexto">Consulta nuestras políticas y condiciones de uso.</span>
                    </div>
                    <div className="configSeccion">
                        <BotonBase variante="secundario" tamano="sm" onClick={() => abrirEnlaceExterno('https://kamples.com/privacy/')}>
                            <Scale size={14} /> Política de Privacidad <ExternalLink size={12} />
                        </BotonBase>
                    </div>
                    <div className="configSeccion">
                        <BotonBase variante="secundario" tamano="sm" onClick={() => abrirEnlaceExterno('https://kamples.com/terms/')}>
                            <Scale size={14} /> Términos de Servicio <ExternalLink size={12} />
                        </BotonBase>
                    </div>
                </>
            );

        default:
            return null;
    }
};

/* Lista de navegación de secciones (compartida) */
export const NavSecciones = ({h}: {h: HookConfiguracion}): JSX.Element => (
    <nav className="configNavLista">
        {SECCIONES_NAV.map(item => (
            <BotonBase variante="ghost" key={item.id}
                className={`configNavItem ${h.seccionActiva === item.id ? 'configNavItemActivo' : ''}`}
                onClick={() => { h.setSeccionActiva(item.id); h.seleccionarSeccionMovil(item.id); }}
                type="button"
            >
                {item.icono}
                {item.etiqueta}
                <ChevronRight size={14} className="configNavChevron" />
            </BotonBase>
        ))}
    </nav>
);
