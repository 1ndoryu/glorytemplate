/*
 * Componente: ModalAuth
 * Modal unificado de login y registro con layout de imagen lateral.
 * Reutiliza la estructura visual de PlanesIsland (.planesLayoutEspecial).
 */

import { useState, type FormEvent, useCallback } from 'react';
import { Music } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { useAuth } from '../../hooks/useAuth';
import { useAuthModalStore } from '../../stores/authModalStore';
import '../../styles/componentes/authModal.css';

const imagenAuth = '/wp-content/themes/glorytemplate/App/Assets/images/1.jpg';

/* Formulario de Login */
const FormularioLogin = ({ onCambiar }: { onCambiar: () => void }): JSX.Element => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, iniciarSesion } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
        iniciarSesion(email, password);
    };

    return (
        <div className="authFormContenedor">
            <div className="authLogo">
                <Music size={28} />
                <span className="authLogoTexto">Kamples</span>
            </div>

            <h2 className="authTitulo">Inicia sesion</h2>
            <p className="authSubtitulo">Descubre los mejores samples del mundo</p>

            {error && <div className="authError">{error}</div>}

            <form className="authFormulario" onSubmit={manejarSubmit}>
                <CampoTexto
                    etiqueta="Email o usuario"
                    type="text"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <CampoTexto
                    etiqueta="Contrasena"
                    type="password"
                    placeholder="Tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <BotonBase
                    type="submit"
                    variante="primario"
                    anchoCompleto
                    cargando={cargando}
                >
                    Iniciar sesion
                </BotonBase>
            </form>

            <p className="authFooter">
                No tienes cuenta?{' '}
                <button type="button" className="authEnlace" onClick={onCambiar}>
                    Registrate gratis
                </button>
            </p>
        </div>
    );
};

/* Formulario de Registro (simplificado: username, email, password) */
const FormularioRegistro = ({ onCambiar }: { onCambiar: () => void }): JSX.Element => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, registrar } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
        registrar({ nombreVisible: username, username, email, password });
    };

    return (
        <div className="authFormContenedor">
            <div className="authLogo">
                <Music size={28} />
                <span className="authLogoTexto">Kamples</span>
            </div>

            <h2 className="authTitulo">Crea tu cuenta</h2>
            <p className="authSubtitulo">Empieza a descubrir y compartir samples</p>

            {error && <div className="authError">{error}</div>}

            <form className="authFormulario" onSubmit={manejarSubmit}>
                <CampoTexto
                    etiqueta="Nombre de usuario"
                    placeholder="tu_usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <CampoTexto
                    etiqueta="Email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <CampoTexto
                    etiqueta="Contrasena"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <BotonBase
                    type="submit"
                    variante="primario"
                    anchoCompleto
                    cargando={cargando}
                >
                    Crear cuenta
                </BotonBase>
            </form>

            <p className="authFooter">
                Ya tienes cuenta?{' '}
                <button type="button" className="authEnlace" onClick={onCambiar}>
                    Inicia sesion
                </button>
            </p>
        </div>
    );
};

export const ModalAuth = (): JSX.Element | null => {
    const { abierto, vista, cerrar, cambiarVista } = useAuthModalStore();

    const cambiarALogin = useCallback(() => cambiarVista('login'), [cambiarVista]);
    const cambiarARegistro = useCallback(() => cambiarVista('registro'), [cambiarVista]);

    if (!abierto) return null;

    return (
        <Modal abierto={abierto} onCerrar={cerrar} tamano="grande" className="modalAuthEspecial">
            <div className="authLayoutEspecial">
                <aside className="authPanelImagen">
                    <img src={imagenAuth} alt="Kamples" className="authImagen" loading="lazy" />
                </aside>
                <section className="authPanelContenido">
                    {vista === 'login'
                        ? <FormularioLogin onCambiar={cambiarARegistro} />
                        : <FormularioRegistro onCambiar={cambiarALogin} />
                    }
                </section>
            </div>
        </Modal>
    );
};
