/*
 * Isla: LoginIsland
 * Formulario de autenticación con Google OAuth y credenciales.
 */

import { useState, type FormEvent } from 'react';
import { Music } from 'lucide-react';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { GloryLink } from '@/core/router';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/componentes/login.css';

export const LoginIsland = (): JSX.Element => {
    /* Estado controlado — useRef falla en Android porque el IME no confirma el valor
     * al DOM antes del submit. onChange sincroniza el estado en cada keystroke. */
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, iniciarSesion, googleBotonRef, loginGoogleNativo, esGoogleNativo } = useAuth();

    const manejarSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        iniciarSesion(email.trim(), password);
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
                {esGoogleNativo ? (
                    <BotonBase
                        variante="secundario"
                        anchoCompleto
                        cargando={cargando}
                        onClick={loginGoogleNativo}
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
                        type="text"
                        placeholder="Email o usuario"
                        autoComplete="username"
                        value={email}
                        onChange={e => setEmail((e.target as HTMLInputElement).value)}
                    />

                    <CampoTexto
                        etiqueta="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        value={password}
                        onChange={e => setPassword((e.target as HTMLInputElement).value)}
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
