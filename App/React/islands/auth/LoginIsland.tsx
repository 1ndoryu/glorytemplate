/*
 * Isla: LoginIsland
 * Formulario de autenticación con Google OAuth y credenciales.
 */

import { useRef, type FormEvent } from 'react';
import { Music } from 'lucide-react';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { GloryLink } from '@/core/router';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/componentes/login.css';

export const LoginIsland = (): JSX.Element => {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const { cargando, error, iniciarSesion, googleBotonRef, loginGoogleDesktop, esDesktopApp } = useAuth();

    const manejarSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const email = (emailRef.current?.value ?? '').trim();
        const password = passwordRef.current?.value ?? '';
        /* DEBUG TEMPORAL: confirmar valores leidos en Android */
        console.error('[LOGIN-DEBUG] email="' + email + '" pw_len=' + password.length + ' ref_ok=' + !!emailRef.current);
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
                        ref={emailRef}
                        type="text"
                        placeholder="Email o usuario"
                        autoComplete="username"
                    />

                    <CampoTexto
                        etiqueta="Contraseña"
                        ref={passwordRef}
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
                        Iniciar sesión v2
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
