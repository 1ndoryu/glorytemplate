/*
 * Componente: ModalAuth
 * Modal full-screen de login y registro con soporte Google OAuth.
 * Layout: imagen en mitad izquierda, formulario en mitad derecha.
 * Renderiza su propio portal (no usa Modal base) para tener control total
 * del layout sin restricciones de max-width ni border-radius.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { useAuth } from '../../hooks/useAuth';
import { useModalAuth } from '../../hooks/useModalAuth';
import { IconoGoogle } from '../ui/IconoGoogle';
import '../../styles/componentes/authModal.css';

const imagenAuth = '/wp-content/themes/glorytemplate/App/Assets/images/2.jpg';

/* Formulario de Login */
const FormularioLogin = ({ onCambiar }: { onCambiar: () => void }): JSX.Element => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, iniciarSesion, iniciarSesionGoogle } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
        iniciarSesion(email, password);
    };

    return (
        <div className="authFormContenedor">
            <h2 className="authTitulo">Inicia sesión</h2>

            <BotonBase
                variante="ghost"
                className="authGoogleBtn"
                onClick={iniciarSesionGoogle}
                disabled={cargando}
                type="button"
            >
                <IconoGoogle />
                Continuar con Google
            </BotonBase>

            <div className="authSeparador">o</div>

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
                    etiqueta="Contraseña"
                    type="password"
                    placeholder="Tu contraseña"
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
                    Iniciar sesión
                </BotonBase>
            </form>

            <p className="authFooter">
                ¿No tienes cuenta?{' '}
                <BotonBase variante="ghost" type="button" className="authEnlace" onClick={onCambiar}>
                    Regístrate gratis
                </BotonBase>
            </p>
        </div>
    );
};

/* Formulario de Registro (simplificado: username, email, password) */
const FormularioRegistro = ({ onCambiar }: { onCambiar: () => void }): JSX.Element => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, registrar, iniciarSesionGoogle } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
        registrar({ nombreVisible: username, username, email, password });
    };

    return (
        <div className="authFormContenedor">
            <h2 className="authTitulo">Crea tu cuenta</h2>

            <BotonBase
                variante="ghost"
                className="authGoogleBtn"
                onClick={iniciarSesionGoogle}
                disabled={cargando}
                type="button"
            >
                <IconoGoogle />
                Registrarse con Google
            </BotonBase>

            <div className="authSeparador">o</div>

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
                    etiqueta="Contraseña"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
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
                ¿Ya tienes cuenta?{' '}
                <BotonBase variante="ghost" type="button" className="authEnlace" onClick={onCambiar}>
                    Inicia sesión
                </BotonBase>
            </p>
        </div>
    );
};

export const ModalAuth = (): JSX.Element | null => {
    const { abierto, vista, cerrar, cambiarALogin, cambiarARegistro } = useModalAuth();

    const manejarEscape = useCallback(
        (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); },
        [cerrar]
    );

    useEffect(() => {
        if (!abierto) return;
        document.addEventListener('keydown', manejarEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', manejarEscape);
            document.body.style.overflow = '';
        };
    }, [abierto, manejarEscape]);

    if (!abierto) return null;

    return createPortal(
        <div className="authPantallaCompleta" role="dialog" aria-modal="true">
            <aside className="authPanelImagen">
                <img src={imagenAuth} alt="Kamples" className="authImagen" loading="lazy" />
            </aside>
            <section className="authPanelContenido">
                <BotonBase
                    variante="ghost"
                    className="authBtnCerrar"
                    onClick={cerrar}
                    aria-label="Cerrar"
                    type="button"
                >
                    <X size={20} />
                </BotonBase>
                {vista === 'login'
                    ? <FormularioLogin onCambiar={cambiarARegistro} />
                    : <FormularioRegistro onCambiar={cambiarALogin} />
                }
            </section>
        </div>,
        document.body
    );
};
