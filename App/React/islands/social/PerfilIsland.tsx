/*
 * Isla: PerfilIsland
 * Vista pública de perfil: avatar, bio, nombre, stats, tabs con samples.
 */

import { useState, useEffect } from 'react';
import { Music, FileText, Heart } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { BotonBase } from '../../components/ui/BotonBase';
import { TabBar, type TabDefinicion } from '../../components/ui/TabBar';
import { obtenerPerfil } from '../../services/apiAuth';
import type { Usuario } from '../../types/usuario';
import { crearLogger } from '../../services/logger';
import '../../styles/componentes/perfil.css';

const log = crearLogger('PerfilIsland');

const tabsPerfil: TabDefinicion[] = [
    { id: 'samples', etiqueta: 'Samples', icono: <Music size={14} /> },
    { id: 'publicaciones', etiqueta: 'Publicaciones', icono: <FileText size={14} /> },
    { id: 'likes', etiqueta: 'Likes', icono: <Heart size={14} /> },
];

interface PerfilIslandProps {
    username?: string;
}

export const PerfilIsland = ({ username }: PerfilIslandProps): JSX.Element => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [tabActiva, setTabActiva] = useState('samples');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!username) return;

        const cargar = async () => {
            setCargando(true);
            try {
                const respuesta = await obtenerPerfil(username);
                if (respuesta.ok && respuesta.datos) {
                    setUsuario(respuesta.datos as unknown as Usuario);
                }
            } catch (err) {
                log.error('Error cargando perfil', err);
            } finally {
                setCargando(false);
            }
        };

        cargar();
    }, [username]);

    if (cargando) {
        return (
            <div className="perfilContenedor">
                <div className="perfilVacio">Cargando perfil...</div>
            </div>
        );
    }

    if (!usuario) {
        return (
            <div className="perfilContenedor">
                <div className="perfilVacio">
                    <Music size={48} />
                    <p>Usuario no encontrado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="perfilContenedor">
            <div className="perfilPortada">
                {usuario.portadaUrl && (
                    <img src={usuario.portadaUrl} alt="Portada" />
                )}
                <div className="perfilAvatarWrapper">
                    <Avatar
                        src={usuario.avatarUrl}
                        nombre={usuario.nombreDisplay}
                        tamano="2xl"
                    />
                </div>
            </div>

            <div className="perfilInfo">
                <div className="perfilInfoTexto">
                    <h1 className="perfilNombre">
                        {usuario.nombreDisplay}
                        {usuario.plan !== 'free' && (
                            <span className="perfilBadgePlan">
                                <Badge variante={usuario.plan === 'premium' ? 'premium' : 'acento'}>
                                    {usuario.plan}
                                </Badge>
                            </span>
                        )}
                    </h1>
                    <p className="perfilUsername">@{usuario.username}</p>
                    {usuario.bio && <p className="perfilBio">{usuario.bio}</p>}

                    <div className="perfilStats">
                        <div className="perfilStat">
                            <span className="perfilStatValor">
                                {usuario.totalSamples ?? 0}
                            </span>
                            <span className="perfilStatLabel">Samples</span>
                        </div>
                        <div className="perfilStat">
                            <span className="perfilStatValor">
                                {usuario.totalSeguidores ?? 0}
                            </span>
                            <span className="perfilStatLabel">Seguidores</span>
                        </div>
                        <div className="perfilStat">
                            <span className="perfilStatValor">
                                {usuario.totalSiguiendo ?? 0}
                            </span>
                            <span className="perfilStatLabel">Siguiendo</span>
                        </div>
                    </div>
                </div>

                <div className="perfilAcciones">
                    {/* TO-DO: condicional si es el propio perfil → "Editar", si no → "Seguir" */}
                    <BotonBase variante="primario">Seguir</BotonBase>
                    <BotonBase variante="secundario">Mensaje</BotonBase>
                </div>
            </div>

            <div className="perfilTabs">
                <TabBar
                    tabs={tabsPerfil}
                    activa={tabActiva}
                    onChange={setTabActiva}
                />
            </div>

            <div className="perfilContenidoTab">
                {tabActiva === 'samples' && (
                    <div className="perfilVacio">
                        <Music size={40} />
                        <p>Los samples aparecerán aquí</p>
                    </div>
                )}
                {tabActiva === 'publicaciones' && (
                    <div className="perfilVacio">
                        <FileText size={40} />
                        <p>Las publicaciones aparecerán aquí</p>
                    </div>
                )}
                {tabActiva === 'likes' && (
                    <div className="perfilVacio">
                        <Heart size={40} />
                        <p>Los likes aparecerán aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerfilIsland;
