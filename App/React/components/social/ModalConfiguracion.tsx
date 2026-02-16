/*
 * Componente: ModalConfiguracion — Kamples
 * Modal de configuración tipo panel lateral con navegación por secciones.
 * Secciones: Perfil, Cuenta, Notificaciones, Apariencia (futuro: más secciones).
 * Se abre desde TopBar menu contextual o desde el botón "Editar perfil" en PerfilIsland.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import { Camera, ImagePlus, Save, Bell, BellOff, User, Shield, Palette, X } from 'lucide-react';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { actualizarPerfil, subirAvatar } from '@app/services/apiAuth';
import { crearLogger } from '@app/services/logger';
import { aplicarTemaApp, guardarTemaApp, obtenerTemaAppActual, type TemaApp } from '@app/services/tema';
import '../../styles/componentes/modalConfiguracion.css';

const log = crearLogger('ModalConfiguracion');

type SeccionConfig = 'perfil' | 'cuenta' | 'notificaciones' | 'apariencia';

interface NavItemConfig {
    id: SeccionConfig;
    etiqueta: string;
    icono: JSX.Element;
}

const SECCIONES_NAV: NavItemConfig[] = [
    { id: 'perfil', etiqueta: 'Perfil', icono: <User size={16} /> },
    { id: 'cuenta', etiqueta: 'Cuenta', icono: <Shield size={16} /> },
    { id: 'notificaciones', etiqueta: 'Notificaciones', icono: <Bell size={16} /> },
    { id: 'apariencia', etiqueta: 'Apariencia', icono: <Palette size={16} /> },
];

export const ModalConfiguracion = (): JSX.Element | null => {
    const { abierto, cerrar } = useConfiguracionModalStore();
    const { usuario, autenticado, setUsuario } = useAuthStore();

    const [seccionActiva, setSeccionActiva] = useState<SeccionConfig>('perfil');
    const [nombreVisible, setNombreVisible] = useState(usuario?.nombreVisible ?? '');
    const [username, setUsername] = useState(usuario?.username ?? '');
    const [bio, setBio] = useState('');
    const [notificaciones, setNotificaciones] = useState(true);
    const [temaSeleccionado, setTemaSeleccionado] = useState<TemaApp>('dark');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarArchivo, setAvatarArchivo] = useState<File | null>(null);
    const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const inputFotoRef = useRef<HTMLInputElement>(null);
    const inputPortadaRef = useRef<HTMLInputElement>(null);

    /* Sincronizar campos cuando el modal se abre o los datos del usuario cambian */
    useEffect(() => {
        if (abierto && usuario) {
            setNombreVisible(usuario.nombreVisible ?? '');
            setUsername(usuario.username ?? '');
            setTemaSeleccionado(obtenerTemaAppActual());
            setAvatarPreview(null);
            setAvatarArchivo(null);
            setPortadaPreview(null);
            setSeccionActiva('perfil');
        }
    }, [abierto, usuario]);

    const manejarCambioTema = useCallback((tema: TemaApp) => {
        setTemaSeleccionado(tema);
        aplicarTemaApp(tema);
        guardarTemaApp(tema);
        log.info('Tema actualizado', { tema });
    }, []);

    /* Preview de foto de perfil nueva — guarda también la referencia al archivo */
    const manejarCambioFoto = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const url = URL.createObjectURL(archivo);
        setAvatarPreview(url);
        setAvatarArchivo(archivo);
    }, []);

    /* Preview de portada nueva */
    const manejarCambioPortada = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const url = URL.createObjectURL(archivo);
        setPortadaPreview(url);
    }, []);

    /* Guardar cambios — sube avatar si hay y envía datos de texto al backend */
    const manejarGuardar = useCallback(async () => {
        if (guardando || !usuario) return;
        setGuardando(true);

        try {
            /* 1. Subir avatar si el usuario seleccionó uno nuevo */
            if (avatarArchivo) {
                const respAvatar = await subirAvatar(avatarArchivo);
                if (respAvatar.ok && respAvatar.data) {
                    /* El endpoint devuelve perfil completo actualizado */
                    const datos = (respAvatar.data as Record<string, unknown>).data ?? respAvatar.data;
                    setUsuario(datos as any);
                    log.info('Avatar subido correctamente');
                }
            }

            /* 2. Enviar campos de texto al backend */
            const resp = await actualizarPerfil({
                nombreVisible: nombreVisible,
                username: username,
                bio: bio,
            } as any);

            /* Usar datos del servidor si la respuesta es exitosa */
            if (resp.ok && resp.data) {
                setUsuario(resp.data as any);
            }

            log.info('Configuración guardada', { nombreVisible, username });
        } catch (err) {
            log.error('Error al guardar configuración', err);
        }

        setGuardando(false);
        cerrar();
    }, [guardando, usuario, nombreVisible, username, bio, avatarArchivo, setUsuario, cerrar]);

    /* Cerrar sin guardar */
    const manejarCerrar = useCallback(() => {
        if (guardando) return;
        cerrar();
        setAvatarPreview(null);
        setPortadaPreview(null);
    }, [cerrar, guardando]);

    if (!abierto || !autenticado) return null;

    const avatarActual = avatarPreview || usuario?.avatarUrl || null;

    /* Renderizar contenido según sección activa */
    const renderizarSeccion = () => {
        switch (seccionActiva) {
            case 'perfil':
                return (
                    <>
                        <h2 className="configSeccionTitulo">Perfil</h2>

                        {/* Portada / Cover */}
                        <div className="configSeccion">
                            <label className="configLabel">Portada</label>
                            <div className="configPortadaContenedor">
                                <img
                                    src={portadaPreview || usuario?.portadaUrl || obtenerImagenColor((usuario?.id ?? 0) + 100)}
                                    alt="Portada"
                                    className="configPortadaImg"
                                />
                                <button
                                    className="configPortadaBtn"
                                    onClick={() => inputPortadaRef.current?.click()}
                                    type="button"
                                    aria-label="Cambiar portada"
                                >
                                    <ImagePlus size={16} />
                                    Cambiar portada
                                </button>
                                <input
                                    ref={inputPortadaRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={manejarCambioPortada}
                                />
                            </div>
                        </div>

                        {/* Foto de perfil */}
                        <div className="configSeccion">
                            <label className="configLabel">Foto de perfil</label>
                            <div className="configFotoContenedor">
                                <Avatar
                                    src={avatarActual}
                                    nombre={nombreVisible || 'U'}
                                    tamano="lg"
                                />
                                <button
                                    className="configFotoBtn"
                                    onClick={() => inputFotoRef.current?.click()}
                                    type="button"
                                    aria-label="Cambiar foto"
                                >
                                    <Camera size={16} />
                                </button>
                                <input
                                    ref={inputFotoRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={manejarCambioFoto}
                                />
                            </div>
                        </div>

                        {/* Nombre visible */}
                        <div className="configSeccion">
                            <label className="configLabel">Nombre visible</label>
                            <input
                                className="configInput"
                                type="text"
                                value={nombreVisible}
                                onChange={(e) => setNombreVisible(e.target.value)}
                                placeholder="Tu nombre"
                                maxLength={50}
                            />
                        </div>

                        {/* Username */}
                        <div className="configSeccion">
                            <label className="configLabel">Username</label>
                            <div className="configInputConPrefijo">
                                <span className="configPrefijo">@</span>
                                <input
                                    className="configInput"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="username"
                                    maxLength={30}
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="configSeccion">
                            <label className="configLabel">Descripción / Bio</label>
                            <textarea
                                className="configTextarea"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Cuéntanos sobre ti..."
                                maxLength={300}
                                rows={3}
                            />
                            <span className="configContador">{300 - bio.length}</span>
                        </div>
                    </>
                );

            case 'cuenta':
                return (
                    <>
                        <h2 className="configSeccionTitulo">Cuenta</h2>
                        <div className="configSeccion">
                            <label className="configLabel">Email</label>
                            <input
                                className="configInput"
                                type="email"
                                value={usuario?.email ?? ''}
                                disabled
                                placeholder="tu@email.com"
                            />
                            <span className="configSubtexto">El email no se puede cambiar desde aquí.</span>
                        </div>
                        <div className="configSeccion">
                            <label className="configLabel">Contraseña</label>
                            <BotonBase variante="secundario" tamano="sm" onClick={() => log.info('Cambiar contraseña')}>
                                Cambiar contraseña
                            </BotonBase>
                        </div>
                        <div className="configSeccion">
                            <label className="configLabel configLabelPeligro">Zona de peligro</label>
                            <BotonBase variante="ghost" tamano="sm" onClick={() => log.info('Eliminar cuenta')}>
                                Eliminar cuenta
                            </BotonBase>
                        </div>
                    </>
                );

            case 'notificaciones':
                return (
                    <>
                        <h2 className="configSeccionTitulo">Notificaciones</h2>
                        <div className="configSeccion configSeccionHorizontal">
                            <div className="configSeccionInfo">
                                <span className="configLabel">Likes y comentarios</span>
                                <span className="configSubtexto">Recibir alertas cuando alguien interactúa con tu contenido</span>
                            </div>
                            <button
                                className={`configToggle ${notificaciones ? 'configToggleActivo' : ''}`}
                                onClick={() => setNotificaciones(!notificaciones)}
                                type="button"
                            >
                                {notificaciones ? <Bell size={14} /> : <BellOff size={14} />}
                            </button>
                        </div>
                        <div className="configSeccion configSeccionHorizontal">
                            <div className="configSeccionInfo">
                                <span className="configLabel">Nuevos seguidores</span>
                                <span className="configSubtexto">Notificar cuando alguien te sigue</span>
                            </div>
                            <button
                                className={`configToggle configToggleActivo`}
                                type="button"
                            >
                                <Bell size={14} />
                            </button>
                        </div>
                        <div className="configSeccion configSeccionHorizontal">
                            <div className="configSeccionInfo">
                                <span className="configLabel">Mensajes</span>
                                <span className="configSubtexto">Alertas de mensajes directos</span>
                            </div>
                            <button
                                className={`configToggle configToggleActivo`}
                                type="button"
                            >
                                <Bell size={14} />
                            </button>
                        </div>
                    </>
                );

            case 'apariencia':
                return (
                    <>
                        <h2 className="configSeccionTitulo">Apariencia</h2>
                        <div className="configSeccion">
                            <label className="configLabel">Tema</label>
                            <span className="configSubtexto">Elige cómo quieres ver la interfaz.</span>
                            <div className="configTemaOpciones" role="group" aria-label="Selector de tema">
                                <BotonBase
                                    variante={temaSeleccionado === 'dark' ? 'primario' : 'secundario'}
                                    tamano="sm"
                                    onClick={() => manejarCambioTema('dark')}
                                    type="button"
                                >
                                    Oscuro
                                </BotonBase>
                                <BotonBase
                                    variante={temaSeleccionado === 'light' ? 'primario' : 'secundario'}
                                    tamano="sm"
                                    onClick={() => manejarCambioTema('light')}
                                    type="button"
                                >
                                    Claro
                                </BotonBase>
                            </div>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="configOverlay" onClick={(e) => e.target === e.currentTarget && manejarCerrar()} role="dialog" aria-modal="true">
            <div className="configModal">
                {/* Panel de navegación lateral */}
                <div className="configNavLateral">
                    <h3 className="configNavTitulo">Configuración</h3>
                    <nav className="configNavLista">
                        {SECCIONES_NAV.map((item) => (
                            <button
                                key={item.id}
                                className={`configNavItem ${seccionActiva === item.id ? 'configNavItemActivo' : ''}`}
                                onClick={() => setSeccionActiva(item.id)}
                                type="button"
                            >
                                {item.icono}
                                {item.etiqueta}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Contenido de la sección */}
                <div className="configContenido">
                    <button
                        className="configCerrarBtn"
                        onClick={manejarCerrar}
                        type="button"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>

                    <div className="configSeccionContenido">
                        {renderizarSeccion()}
                    </div>

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
            </div>
        </div>
    );
};

export default ModalConfiguracion;
