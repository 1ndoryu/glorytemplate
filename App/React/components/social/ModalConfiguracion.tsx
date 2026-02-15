/*
 * Componente: ModalConfiguracion — Kamples
 * Modal de configuración tipo panel lateral con navegación por secciones.
 * Secciones: Perfil, Cuenta, Notificaciones, Apariencia (futuro: más secciones).
 * Se abre desde TopBar menu contextual o desde el botón "Editar perfil" en PerfilIsland.
 */

import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import { Camera, Save, Bell, BellOff, User, Shield, Palette, X } from 'lucide-react';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';
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
    const { usuario, autenticado } = useAuthStore();

    const [seccionActiva, setSeccionActiva] = useState<SeccionConfig>('perfil');
    const [nombreVisible, setNombreVisible] = useState(usuario?.nombreVisible ?? '');
    const [username, setUsername] = useState(usuario?.username ?? '');
    const [bio, setBio] = useState('');
    const [notificaciones, setNotificaciones] = useState(true);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const inputFotoRef = useRef<HTMLInputElement>(null);

    /* Sincronizar campos cuando el modal se abre o los datos del usuario cambian */
    useEffect(() => {
        if (abierto && usuario) {
            setNombreVisible(usuario.nombreVisible ?? '');
            setUsername(usuario.username ?? '');
            setAvatarPreview(null);
            setSeccionActiva('perfil');
        }
    }, [abierto, usuario]);

    /* Preview de foto nueva */
    const manejarCambioFoto = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const url = URL.createObjectURL(archivo);
        setAvatarPreview(url);
    }, []);

    /* Guardar cambios */
    const manejarGuardar = useCallback(async () => {
        if (guardando) return;
        setGuardando(true);

        log.info('Guardando configuración', { nombreVisible, username, notificaciones });

        /* TO-DO: PUT /kamples/v1/perfil con FormData (incluir avatar si cambió) */
        await new Promise((r) => setTimeout(r, 800));

        setGuardando(false);
        cerrar();
    }, [guardando, nombreVisible, username, notificaciones, cerrar]);

    /* Cerrar sin guardar */
    const manejarCerrar = useCallback(() => {
        if (guardando) return;
        cerrar();
        setAvatarPreview(null);
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

                        {/* Foto de perfil */}
                        <div className="configSeccion">
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
                            <span className="configSubtexto">Próximamente: modo claro / oscuro / auto.</span>
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
