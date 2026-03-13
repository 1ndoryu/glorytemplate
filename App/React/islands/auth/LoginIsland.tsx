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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, iniciarSesion, googleBotonRef } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
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

                {/* QK5: Botón de Google renderizado por GSI — abre popup nativo,
                 * funciona en incógnito sin third-party cookies. */}
                <div ref={googleBotonRef} className="loginGoogleBtnContenedor" />

                <div className="loginSeparador">o</div>

                {error && <div className="loginError">{error}</div>}

                <form className="loginFormulario" onSubmit={manejarSubmit}>
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
                        placeholder="••••••••"
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

                <p className="loginFooter">
                    ¿No tienes cuenta?{' '}
                    <GloryLink href="/auth/registro">Regístrate gratis</GloryLink>
                </p>
            </div>
        </div>
    );
};

export default LoginIsland;
