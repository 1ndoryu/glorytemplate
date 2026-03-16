/*
 * Componente: ModalConfiguracion — Kamples
 * Modal de configuración tipo panel lateral con navegación por secciones.
 * Lógica extraída a useModalConfiguracion (SRP).
 */

import {ImagePlus, Save, Bell, BellOff, User, Shield, Palette, Ban, Music, Mail, Lock, ChevronRight, ArrowLeft} from 'lucide-react';
import {obtenerImagenColor} from '@app/services/imagenesColor';
import {Avatar} from '@app/components/ui/Avatar';
import {BotonBase} from '@app/components/ui/BotonBase';
import {Modal} from '@app/components/ui/Modal';
import {usePanelLateralStore} from '@app/stores/panelLateralStore';
import {useModalConfiguracion, type SeccionConfig} from '@app/hooks/useModalConfiguracion';
import {SeccionBloqueos} from './SeccionBloqueos';
import {useGenerosModalStore} from '@app/stores/generosModalStore';
import '../../styles/componentes/modalConfiguracion.css';
import {CampoTexto} from '../ui/CampoTexto';
import {Input} from '../ui/Input';

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
const SECCIONES_NAV: NavItemConfig[] = [
    {id: 'perfil', etiqueta: 'Perfil', icono: <User size={16} />},
    {id: 'cuenta', etiqueta: 'Cuenta', icono: <Shield size={16} />},
    {id: 'notificaciones', etiqueta: 'Notificaciones', icono: <Bell size={16} />},
    {id: 'apariencia', etiqueta: 'Apariencia', icono: <Palette size={16} />},
    {id: 'bloqueos', etiqueta: 'Bloqueos', icono: <Ban size={16} />}
];

export const ModalConfiguracion = (): JSX.Element | null => {
    const {abierto, autenticado, usuario, seccionActiva, setSeccionActiva, movilEnMenu, seleccionarSeccionMovil, volverAlMenuMovil, nombreVisible, setNombreVisible, username, setUsername, bio, setBio, sitioWeb, setSitioWeb, notificaciones, setNotificaciones, temaSeleccionado, avatarActual, portadaPreview, guardando, inputFotoRef, inputPortadaRef, manejarCambioTema, manejarCambioFoto, manejarCambioPortada, manejarGuardar, manejarCerrar, nuevoEmail, setNuevoEmail, emailPasswordActual, setEmailPasswordActual, cambiandoEmail, emailEditando, setEmailEditando, manejarCambiarEmail, passwordActual, setPasswordActual, nuevaPassword, setNuevaPassword, confirmarPassword, setConfirmarPassword, cambiandoPassword, passwordEditando, setPasswordEditando, manejarCambiarPassword} = useModalConfiguracion();

    if (!abierto || !autenticado) return null;

    const renderizarSeccion = () => {
        switch (seccionActiva) {
            case 'perfil':
                return (
                    <>
                        {/* Portada / Cover */}
                        <div className="configSeccion">
                            <label className="configLabel">Portada</label>
                            <div className="configPortadaContenedor" onClick={() => inputPortadaRef.current?.click()} role="button" aria-label="Cambiar portada">
                                <img src={portadaPreview || usuario?.portadaUrl || obtenerImagenColor((usuario?.id ?? 0) + 100)} alt="Portada" className="configPortadaImg" />
                                <div className="configPortadaOverlay">
                                    <ImagePlus size={24} />
                                </div>
                                <Input ref={inputPortadaRef} type="file" accept="image/*" hidden onChange={manejarCambioPortada} />
                            </div>
                        </div>

                        {/* Foto de perfil */}
                        <div className="configSeccion">
                            <label className="configLabel">Foto de perfil</label>
                            <div className="configFotoContenedor" onClick={() => inputFotoRef.current?.click()} role="button" aria-label="Cambiar foto de perfil">
                                <Avatar src={avatarActual} nombre={nombreVisible || 'U'} tamano="lg" />
                                <Input ref={inputFotoRef} type="file" accept="image/*" hidden onChange={manejarCambioFoto} />
                            </div>
                        </div>

                        {/* Nombre visible */}
                        <div className="configSeccion">
                            <label className="configLabel">Nombre visible</label>
                            <CampoTexto variante="desnudo" className="configInput" value={nombreVisible} onChange={e => setNombreVisible(e.target.value)} placeholder="Tu nombre" maxLength={50} />
                        </div>

                        {/* Username */}
                        <div className="configSeccion">
                            <label className="configLabel">Username</label>
                            <div className="configInputConPrefijo">
                                <span className="configPrefijo">@</span>
                                <CampoTexto variante="desnudo" className="configInput" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" maxLength={30} />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="configSeccion">
                            <label className="configLabel">Descripción / Bio</label>
                            <CampoTexto multilínea variante="desnudo" className="configTextarea" value={bio} onChange={e => setBio(e.target.value)} placeholder="Cuéntanos sobre ti..." maxLength={300} rows={3} />
                            <span className="configContador">{300 - bio.length}</span>
                        </div>

                        {/* QQ32: Enlace externo */}
                        <div className="configSeccion">
                            <label className="configLabel">Enlace</label>
                            <CampoTexto variante="desnudo" className="configInput" value={sitioWeb} onChange={e => setSitioWeb(e.target.value)} placeholder="https://tu-pagina.com" maxLength={500} />
                            <span className="configSubtexto">Se mostrará en tu perfil público.</span>
                        </div>
                    </>
                );

            case 'cuenta':
                return (
                    <>
                        {/* QK89: Cambiar email */}
                        <div className="configSeccion">
                            <label className="configLabel"><Mail size={14} /> Email</label>
                            <span className="configSubtexto">{usuario?.email ?? ''}</span>
                            {!emailEditando ? (
                                <BotonBase variante="secundario" tamano="sm" onClick={() => setEmailEditando(true)}>
                                    Cambiar email
                                </BotonBase>
                            ) : (
                                <div className="configFormInline">
                                    <CampoTexto type="email" variante="desnudo" className="configInput" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="Nuevo email" />
                                    <CampoTexto type="password" variante="desnudo" className="configInput" value={emailPasswordActual} onChange={e => setEmailPasswordActual(e.target.value)} placeholder="Contraseña actual" autoComplete="current-password" />
                                    <div className="configFormAcciones">
                                        <BotonBase variante="primario" tamano="sm" onClick={manejarCambiarEmail} disabled={cambiandoEmail || !nuevoEmail.trim() || !emailPasswordActual}>
                                            {cambiandoEmail ? 'Guardando...' : 'Confirmar'}
                                        </BotonBase>
                                        <BotonBase variante="ghost" tamano="sm" onClick={() => setEmailEditando(false)} disabled={cambiandoEmail}>
                                            Cancelar
                                        </BotonBase>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* QK89: Cambiar contraseña */}
                        <div className="configSeccion">
                            <label className="configLabel"><Lock size={14} /> Contraseña</label>
                            {!passwordEditando ? (
                                <BotonBase variante="secundario" tamano="sm" onClick={() => setPasswordEditando(true)}>
                                    Cambiar contraseña
                                </BotonBase>
                            ) : (
                                <div className="configFormInline">
                                    <CampoTexto type="password" variante="desnudo" className="configInput" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} placeholder="Contraseña actual" autoComplete="current-password" />
                                    <CampoTexto type="password" variante="desnudo" className="configInput" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} placeholder="Nueva contraseña" autoComplete="new-password" />
                                    <CampoTexto type="password" variante="desnudo" className="configInput" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} placeholder="Confirmar nueva contraseña" autoComplete="new-password" />
                                    <div className="configFormAcciones">
                                        <BotonBase variante="primario" tamano="sm" onClick={manejarCambiarPassword} disabled={cambiandoPassword || !passwordActual || !nuevaPassword || !confirmarPassword}>
                                            {cambiandoPassword ? 'Guardando...' : 'Confirmar'}
                                        </BotonBase>
                                        <BotonBase variante="ghost" tamano="sm" onClick={() => setPasswordEditando(false)} disabled={cambiandoPassword}>
                                            Cancelar
                                        </BotonBase>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="configSeccion">
                            <label className="configLabel configLabelPeligro">Zona de peligro</label>
                            <BotonBase variante="secundario" tamano="md" onClick={() => console.info('TO-DO: Eliminar cuenta')}>
                                Eliminar cuenta
                            </BotonBase>
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
                            <BotonBase variante="ghost" className={`configToggle ${notificaciones ? 'configToggleActivo' : ''}`} onClick={() => setNotificaciones(!notificaciones)} type="button">
                                {notificaciones ? <Bell size={14} /> : <BellOff size={14} />}
                            </BotonBase>
                        </div>
                        <div className="configSeccion configSeccionHorizontal">
                            <div className="configSeccionInfo">
                                <span className="configLabel">Nuevos seguidores</span>
                                <span className="configSubtexto">Notificar cuando alguien te sigue</span>
                            </div>
                            <BotonBase variante="ghost" className={`configToggle configToggleActivo`} type="button">
                                <Bell size={14} />
                            </BotonBase>
                        </div>
                        <div className="configSeccion configSeccionHorizontal">
                            <div className="configSeccionInfo">
                                <span className="configLabel">Mensajes</span>
                                <span className="configSubtexto">Alertas de mensajes directos</span>
                            </div>
                            <BotonBase variante="ghost" className={`configToggle configToggleActivo`} type="button">
                                <Bell size={14} />
                            </BotonBase>
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
                                <BotonBase variante={temaSeleccionado === 'dark' ? 'primario' : 'secundario'} tamano="sm" onClick={() => manejarCambioTema('dark')} type="button">
                                    Oscuro
                                </BotonBase>
                                <BotonBase variante={temaSeleccionado === 'light' ? 'primario' : 'secundario'} tamano="sm" onClick={() => manejarCambioTema('light')} type="button">
                                    Claro
                                </BotonBase>
                            </div>
                        </div>

                        {/* C155: Preferencia panel lateral al dar like */}
                        <PanelLateralPreferencia />

                        {/* QQ45: Boton para reabrir modal de generos */}
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

            default:
                return null;
        }
    };

    return (
        <Modal abierto={abierto && autenticado} onCerrar={manejarCerrar} className={`configModalLayout ${movilEnMenu ? 'configMovilEnMenu' : 'configMovilEnContenido'}`}>
            {/* Panel de navegación lateral (desktop) / lista drill-down (móvil QL51) */}
            <div className="configNavLateral">
                <h3 className="configNavTitulo">Configuración</h3>
                <nav className="configNavLista">
                    {SECCIONES_NAV.map(item => (
                        <BotonBase variante="ghost" key={item.id}
                            className={`configNavItem ${seccionActiva === item.id ? 'configNavItemActivo' : ''}`}
                            onClick={() => { setSeccionActiva(item.id); seleccionarSeccionMovil(item.id); }}
                            type="button"
                        >
                            {item.icono}
                            {item.etiqueta}
                            <ChevronRight size={14} className="configNavChevron" />
                        </BotonBase>
                    ))}
                </nav>
            </div>

            {/* Contenido de la sección */}
            <div className="configContenido">
                {/* QL51: Botón volver solo visible en móvil */}
                <BotonBase variante="ghost" className="configMovilVolver" onClick={volverAlMenuMovil} type="button">
                    <ArrowLeft size={16} />
                    <span>{SECCIONES_NAV.find(s => s.id === seccionActiva)?.etiqueta ?? 'Configuración'}</span>
                </BotonBase>
                <div className="configSeccionContenido">{renderizarSeccion()}</div>

                {/* Acciones: guardar / cancelar */}
                <div className="configAcciones">
                    <BotonBase variante="ghost" onClick={manejarCerrar} disabled={guardando}>
                        Cancelar
                    </BotonBase>
                    <BotonBase variante="primario" onClick={manejarGuardar} disabled={guardando}>
                        <Save size={14} />
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};

export default ModalConfiguracion;
