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
import { obtenerUsuarioActual, actualizarPerfil } from '../../services/apiAuth';
import { crearLogger } from '../../services/logger';
import '../../styles/componentes/editarPerfil.css';

const log = crearLogger('EditarPerfilIsland');

export const EditarPerfilIsland = (): JSX.Element => {
    const [nombre, setNombre] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [portadaUrl, setPortadaUrl] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoInicial, setCargandoInicial] = useState(true);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const portadaInputRef = useRef<HTMLInputElement>(null);

    /* Cargar datos actuales del usuario */
    useEffect(() => {
        const cargar = async () => {
            try {
                const resp = await obtenerUsuarioActual();
                if (resp.ok && resp.datos) {
                    const u = resp.datos as Record<string, unknown>;
                    setNombre((u.nombreDisplay as string) ?? '');
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
            const resp = await actualizarPerfil({
                nombreDisplay: nombre,
                username,
                bio,
            });

            if (resp.ok) {
                crearToast({ tipo: 'exito', mensaje: 'Perfil actualizado correctamente' });
            } else {
                crearToast({ tipo: 'error', mensaje: resp.error ?? 'Error al actualizar' });
            }
        } catch (err) {
            log.error('Error actualizando perfil', err);
            crearToast({ tipo: 'error', mensaje: 'Error de conexión' });
        } finally {
            setCargando(false);
        }
    };

    /* TO-DO: subida de avatar/portada real vía API */
    const manejarCambioAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (archivo) {
            const url = URL.createObjectURL(archivo);
            setAvatarUrl(url);
            log.info('Avatar seleccionado (preview local)', archivo.name);
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
                        multilinea
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

export default EditarPerfilIsland;
