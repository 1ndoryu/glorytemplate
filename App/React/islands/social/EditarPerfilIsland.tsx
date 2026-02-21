/*
 * Isla: EditarPerfilIsland
 * Formulario para editar avatar, portada, bio, username y nombre.
 */

import { useState, useEffect, type FormEvent, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { crearToast } from '../../components/ui/Notificacion';
import { obtenerUsuarioActual, actualizarPerfil, subirAvatar } from '../../services/apiAuth';
import { useAuthStore } from '../../stores/authStore';
import type { Usuario, UsuarioAutenticado } from '../../types/usuario';
import { crearLogger } from '../../services/logger';
import { conAutenticacion } from '../../components/auth/ConAutenticacion';
import '../../styles/componentes/editarPerfil.css';

const log = crearLogger('EditarPerfilIsland');

export const EditarPerfilIsland = (): JSX.Element => {
    const [nombre, setNombre] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [portadaUrl, setPortadaUrl] = useState<string | null>(null);
    const [avatarArchivo, setAvatarArchivo] = useState<File | null>(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoInicial, setCargandoInicial] = useState(true);
    const setUsuario = useAuthStore(s => s.setUsuario);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const portadaInputRef = useRef<HTMLInputElement>(null);

    /* Cargar datos actuales del usuario */
    useEffect(() => {
        const cargar = async () => {
            try {
                const resp = await obtenerUsuarioActual();
                if (resp.ok && resp.data) {
                    const u = resp.data as unknown as Record<string, unknown>;
                    setNombre((u.nombreVisible as string) ?? (u.nombreDisplay as string) ?? '');
                    setUsername((u.username as string) ?? '');
                    setBio((u.bio as string) ?? '');
                    setAvatarUrl((u.avatarUrl as string) ?? null);
                    setPortadaUrl((u.portadaUrl as string) ?? null);
                }
            } catch (err) {
                log.error('Error cargando usuario', err);
            } finally {
                setCargandoInicial(false);
            }
        };

        cargar();
    }, []);

    const manejarSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setCargando(true);

        try {
            /* 1. Subir avatar si el usuario seleccionó uno nuevo */
            if (avatarArchivo) {
                const respAvatar = await subirAvatar(avatarArchivo);
                if (respAvatar.ok && respAvatar.data) {
                    const datos = (respAvatar.data as Record<string, unknown>).data ?? respAvatar.data;
                    setUsuario(datos as UsuarioAutenticado);
                    setAvatarArchivo(null);
                    log.info('Avatar subido correctamente');
                } else {
                    crearToast('error', 'Error al subir avatar');
                }
            }

            /* 2. Actualizar campos de texto */
            const resp = await actualizarPerfil({
                nombreVisible: nombre,
                username,
                bio,
            } as Partial<Usuario>);

            if (resp.ok) {
                if (resp.data) {
                    setUsuario(resp.data as unknown as UsuarioAutenticado);
                }
                crearToast('exito', 'Perfil actualizado correctamente');
            } else {
                crearToast('error', resp.error ?? 'Error al actualizar');
            }
        } catch (err) {
            log.error('Error actualizando perfil', err);
            crearToast('error', 'Error de conexión');
        } finally {
            setCargando(false);
        }
    };

    /* C193: Subida real de avatar — guarda archivo para enviar al backend en submit */
    const manejarCambioAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            const url = URL.createObjectURL(archivo);
            setAvatarUrl(url);
            setAvatarArchivo(archivo);
            log.info('Avatar seleccionado', archivo.name);
        }
    };

    const manejarCambioPortada = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            const url = URL.createObjectURL(archivo);
            setPortadaUrl(url);
            log.info('Portada seleccionada (preview local)', archivo.name);
        }
    };

    if (cargandoInicial) {
        return (
            <div className="editarPerfilContenedor">
                <p>Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="editarPerfilContenedor">
            <h1 className="editarPerfilTitulo">Editar perfil</h1>

            <form className="editarPerfilFormulario" onSubmit={manejarSubmit}>
                {/* Portada */}
                <div
                    className="editarPerfilPortada"
                    onClick={() => portadaInputRef.current?.click()}
                >
                    {portadaUrl && <img src={portadaUrl} alt="Portada" />}
                    <div className="editarPerfilPortadaOverlay">
                        <Camera size={20} />
                        <span style={{ marginLeft: 8 }}>Cambiar portada</span>
                    </div>
                    <input
                        ref={portadaInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={manejarCambioPortada}
                    />
                </div>

                {/* Avatar */}
                <div className="editarPerfilAvatarSection">
                    <div
                        className="editarPerfilAvatarBtn"
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        <Avatar
                            src={avatarUrl}
                            nombre={nombre}
                            tamano="xl"
                        />
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={manejarCambioAvatar}
                        />
                    </div>
                    <div>
                        <p style={{ color: 'var(--textoSecundario)', fontSize: 'var(--fuenteSm)' }}>
                            Click para cambiar avatar
                        </p>
                    </div>
                </div>

                {/* Datos */}
                <div className="editarPerfilSeccion">
                    <h2 className="editarPerfilSeccionTitulo">Información</h2>

                    <CampoTexto
                        etiqueta="Nombre"
                        placeholder="Tu nombre público"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />

                    <CampoTexto
                        etiqueta="Username"
                        placeholder="tu_usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <CampoTexto
                        etiqueta="Bio"
                        placeholder="Cuéntanos sobre ti..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        multilínea
                    />
                </div>

                {/* Acciones */}
                <div className="editarPerfilAcciones">
                    <BotonBase
                        variante="secundario"
                        onClick={() => window.history.back()}
                        type="button"
                    >
                        Cancelar
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        type="submit"
                        cargando={cargando}
                    >
                        Guardar cambios
                    </BotonBase>
                </div>
            </form>
        </div>
    );
};

export default conAutenticacion(EditarPerfilIsland as React.ComponentType<Record<string, unknown>>);
