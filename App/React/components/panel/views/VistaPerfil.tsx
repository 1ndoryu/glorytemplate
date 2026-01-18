import React, {useState} from 'react';
import {User, Mail, Shield, Save} from 'lucide-react';
import {Tarjeta} from '../../ui/Tarjeta';
import {Boton} from '../../ui/Boton';
import {usePanel} from '../../../context/PanelContext';

/**
 * VistaPerfil: Gestión de datos del usuario.
 */
export const VistaPerfil: React.FC = () => {
    const {user} = usePanel();
    const [nombre, setNombre] = useState(user.name);

    return (
        <div className="bloqueVista">
            <header className="vistaHeader">
                <h2 className="vistaTitulo">Mi Perfil</h2>
                <p className="vistaSubtitulo">Administra tu información personal y seguridad.</p>
            </header>

            <div className="perfilGrid">
                <div className="perfilSidebar">
                    <div className="perfilAvatarArea">
                        <div className="perfilAvatar">{user.avatar}</div>
                        <div className="perfilInfo">
                            <h3 className="perfilNombre">{user.name}</h3>
                            <p className="perfilRol">{user.role}</p>
                        </div>
                    </div>
                </div>

                <div className="perfilFormulario">
                    <Tarjeta>
                        <div className="tarjetaHeader">
                            <h3 className="tarjetaTitulo">Información Personal</h3>
                        </div>
                        <form className="formPerfil" onSubmit={e => e.preventDefault()}>
                            <div className="formGrupo">
                                <label>Nombre Completo</label>
                                <div className="inputIconWrapper">
                                    <User size={16} className="inputIcon" />
                                    <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="inputGlory" />
                                </div>
                            </div>

                            <div className="formGrupo">
                                <label>Correo Electrónico</label>
                                <div className="inputIconWrapper">
                                    <Mail size={16} className="inputIcon" />
                                    <input type="email" value={user.email} disabled className="inputGlory disabled" />
                                </div>
                                <p className="formAyuda">Contacta a soporte para cambiar tu email.</p>
                            </div>

                            <div className="formActions">
                                <Boton icono={<Save size={16} />}>Guardar Cambios</Boton>
                            </div>
                        </form>
                    </Tarjeta>
                </div>
            </div>
        </div>
    );
};
