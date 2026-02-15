/*
 * Componente: ModalConfiguracion — Kamples (FASE 1.2)
 * Modal de configuración de perfil que reemplaza EditarPerfilIsland.
 * Secciones: foto de perfil, nombre, username, bio, notificaciones.
 * Se abre desde TopBar/sidebar o desde el botón "Editar perfil" en PerfilIsland.
 */

import { useState, useCallback, useRef, type ChangeEvent } from 'react';
import { Camera, Save, Bell, BellOff, User } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { Avatar } from '@app/components/ui/Avatar';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useConfiguracionModalStore } from '@app/stores/configuracionModalStore';
import { useAuthStore } from '@app/stores/authStore';
import { crearLogger } from '@app/services/logger';
import '../../styles/componentes/modalConfiguracion.css';

const log = crearLogger('ModalConfiguracion');

export const ModalConfiguracion = (): JSX.Element | null => {
    const { abierto, cerrar } = useConfiguracionModalStore();
    const { usuario, autenticado } = useAuthStore();

    const [nombreVisible, setNombreVisible] = useState(usuario?.nombreVisible ?? '');
    const [username, setUsername] = useState(usuario?.username ?? '');
    const [bio, setBio] = useState('');
    const [notificaciones, setNotificaciones] = useState(true);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const inputFotoRef = useRef<HTMLInputElement>(null);

    /* Actualizar campos cuando se abre con datos frescos */
    const manejarAbrir = useCallback(() => {
        if (usuario) {
            setNombreVisible(usuario.nombreVisible ?? '');
            setUsername(usuario.username ?? '');
            setAvatarPreview(null);
        }
    }, [usuario]);

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

    return (
        <Modal abierto={abierto} onCerrar={manejarCerrar}>
            <div className="configContenido">
                <h2 className="configTitulo">Configuración de perfil</h2>

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

                {/* Notificaciones */}
                <div className="configSeccion configSeccionHorizontal">
                    <div className="configSeccionInfo">
                        <span className="configLabel">Notificaciones</span>
                        <span className="configSubtexto">Recibir alertas de likes, follows y mensajes</span>
                    </div>
                    <button
                        className={`configToggle ${notificaciones ? 'configToggleActivo' : ''}`}
                        onClick={() => setNotificaciones(!notificaciones)}
                        type="button"
                        aria-label={notificaciones ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                    >
                        {notificaciones ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                </div>

                {/* Acciones */}
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
