/*
 * Isla: EditarPerfilIsland
 * Formulario para editar avatar, portada, bio, username y nombre.
 * Lógica extraída a useEditarPerfil (SRP).
 */

import { Camera } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { Input } from '../../components/ui/Input';
import { conAutenticacion } from '../../components/auth/ConAutenticacion';
import { useEditarPerfil } from '@app/hooks/useEditarPerfil';
import { SkeletonPerfil } from '@app/components/skeletons';
import '../../styles/componentes/editarPerfil.css';

export const EditarPerfilIsland = (): JSX.Element => {
    const {
        nombre, setNombre, username, setUsername, bio, setBio,
        avatarUrl, portadaUrl, cargando, cargandoInicial,
        avatarInputRef, portadaInputRef,
        manejarSubmit, manejarCambioAvatar, manejarCambioPortada,
    } = useEditarPerfil();

    if (cargandoInicial) {
        return (
            <div className="editarPerfilContenedor">
                <SkeletonPerfil />
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
                    <Input
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
                        <Input
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
