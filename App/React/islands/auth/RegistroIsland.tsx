/*
 * Isla: RegistroIsland
 * Formulario de registro con Google OAuth y email/contraseña.
 */

import { Music } from 'lucide-react';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { GloryLink } from '@/core/router';
import { useRegistroIsland } from '../../hooks/useRegistroIsland';
import '../../styles/componentes/login.css';

export const RegistroIsland = (): JSX.Element => {
    const {
        nombre,
        setNombre,
        username,
        setUsername,
        email,
        setEmail,
        password,
        setPassword,
        confirmarPassword,
        setConfirmarPassword,
        cargando,
        error,
        iniciarSesionGoogle,
        manejarSubmit,
        errorPassword,
    } = useRegistroIsland();

    return (
        <div className="loginContenedor">
            <div className="loginCaja">
                <div className="loginLogo">
                    <Music size={32} />
                    <span className="loginLogoTexto">Kamples</span>
                </div>

                <h1 className="loginTitulo">Crea tu cuenta</h1>
                <p className="loginSubtitulo">
                    Empieza a descubrir y compartir samples
                </p>

                <BotonBase variante="ghost"
                    className="loginGoogleBtn"
                    onClick={iniciarSesionGoogle}
                    disabled={cargando}
                    type="button"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Registrarse con Google
                </BotonBase>

                <div className="loginSeparador">o</div>

                {error && <div className="loginError">{error}</div>}

                <form className="loginFormulario" onSubmit={manejarSubmit}>
                    <CampoTexto
                        etiqueta="Nombre"
                        placeholder="Tu nombre"
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
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <CampoTexto
                        etiqueta="Confirmar contraseña"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={confirmarPassword}
                        onChange={(e) => setConfirmarPassword(e.target.value)}
                        error={errorPassword}
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

                <p className="loginFooter">
                    ¿Ya tienes cuenta?{' '}
                    <GloryLink href="/auth/login">Inicia sesión</GloryLink>
                </p>
            </div>
        </div>
    );
};

export default RegistroIsland;
