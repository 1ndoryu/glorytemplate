/*
 * Componente: ModalConfiguracion — Kamples
 * Modal de configuración tipo panel lateral con navegación por secciones.
 * Lógica extraída a useModalConfiguracion (SRP).
 */

import {ImagePlus, Save, Bell, BellOff, User, Shield, Palette} from 'lucide-react';
import {obtenerImagenColor} from '@app/services/imagenesColor';
import {Avatar} from '@app/components/ui/Avatar';
import {BotonBase} from '@app/components/ui/BotonBase';
import {Modal} from '@app/components/ui/Modal';
import {usePanelLateralStore} from '@app/stores/panelLateralStore';
import {useModalConfiguracion, type SeccionConfig} from '@app/hooks/useModalConfiguracion';
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
    {id: 'apariencia', etiqueta: 'Apariencia', icono: <Palette size={16} />}
];

export const ModalConfiguracion = (): JSX.Element | null => {
    const {abierto, autenticado, usuario, seccionActiva, setSeccionActiva, nombreVisible, setNombreVisible, username, setUsername, bio, setBio, notificaciones, setNotificaciones, temaSeleccionado, avatarActual, portadaPreview, guardando, inputFotoRef, inputPortadaRef, manejarCambioTema, manejarCambioFoto, manejarCambioPortada, manejarGuardar, manejarCerrar} = useModalConfiguracion();

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
                    </>
                );

            case 'cuenta':
                return (
                    <>
                        <div className="configSeccion">
                            <label className="configLabel">Email</label>
                            <CampoTexto type="email" variante="desnudo" className="configInput" value={usuario?.email ?? ''} disabled placeholder="tu@email.com" />
                            <span className="configSubtexto">El email no se puede cambiar desde aquí.</span>
                        </div>
                        <div className="configSeccion">
                            <label className="configLabel">Contraseña</label>
                            <BotonBase variante="secundario" tamano="sm" onClick={() => console.info('TO-DO: Cambiar contraseña')}>
                                Cambiar contraseña
                            </BotonBase>
                        </div>
                        <div className="configSeccion">
                            <label className="configLabel configLabelPeligro">Zona de peligro</label>
                            <BotonBase variante="ghost" tamano="sm" onClick={() => console.info('TO-DO: Eliminar cuenta')}>
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
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <Modal abierto={abierto && autenticado} onCerrar={manejarCerrar} className="configModalLayout">
            {/* Panel de navegación lateral */}
            <div className="configNavLateral">
                <h3 className="configNavTitulo">Configuración</h3>
                <nav className="configNavLista">
                    {SECCIONES_NAV.map(item => (
                        <BotonBase variante="ghost" key={item.id} className={`configNavItem ${seccionActiva === item.id ? 'configNavItemActivo' : ''}`} onClick={() => setSeccionActiva(item.id)} type="button">
                            {item.icono}
                            {item.etiqueta}
                        </BotonBase>
                    ))}
                </nav>
            </div>

            {/* Contenido de la sección */}
            <div className="configContenido">
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
