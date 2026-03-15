/*
 * Isla: LoginIsland
 * Formulario de autenticación con Google OAuth y credenciales.
 */

import { type FormEvent } from 'react';
import { Music } from 'lucide-react';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { GloryLink } from '@/core/router';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/componentes/login.css';

export const LoginIsland = (): JSX.Element => {
    const { cargando, error, iniciarSesion, googleBotonRef, loginGoogleDesktop, esDesktopApp } = useAuth();

    const manejarSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        /* Inputs NO controlados (sin value prop): React nunca resetea el .value del
         * DOM, por lo que el texto escrito con el teclado virtual Android persiste.
         * FormData lee los valores reales incluso cuando onChange no dispara (IME bug). */
        const fd = new FormData(e.currentTarget);
        const email = ((fd.get('email') as string | null) ?? '').trim();
        const password = (fd.get('password') as string | null) ?? '';
        iniciarSesion(email, password);
    };

    return (
        <div className="loginContenedor">
            <div className="loginCaja">
                <div className="loginLogo">
                    <Music size={32} />
                    <span className="loginLogoTexto">Kamples</span>
                </div>

                <h1 className="loginTitulo">Inicia sesión</h1>
                <p className="loginSubtitulo">
                    Descubre los mejores samples del mundo
                </p>

                {/* En desktop: botón nativo que abre el browser del sistema con Google OAuth PKCE.
                 * En web: Google Identity Services renderiza su propio botón en el div. */}
                {esDesktopApp ? (
                    <BotonBase
                        variante="secundario"
                        anchoCompleto
                        cargando={cargando}
                        onClick={loginGoogleDesktop}
                    >
                        Continuar con Google
                    </BotonBase>
                ) : (
                    <div ref={googleBotonRef} className="loginGoogleBtnContenedor" />
                )}

                <div className="loginSeparador">o</div>

                {error && <div className="loginError">{error}</div>}

                <form className="loginFormulario" onSubmit={manejarSubmit}>
                    <CampoTexto
                        etiqueta="Email o usuario"
                        name="email"
                        type="text"
                        placeholder="Email o usuario"
                        autoComplete="username"
                    />

                    <CampoTexto
                        etiqueta="Contraseña"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
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

                <p className="loginFooter">
                    ¿No tienes cuenta?{' '}
                    <GloryLink href="/auth/registro">Regístrate gratis</GloryLink>
                </p>
            </div>
        </div>
    );
};

export default LoginIsland;
