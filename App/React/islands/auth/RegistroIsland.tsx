/*
 * Isla: RegistroIsland
 * Formulario de registro con Google OAuth y email/contraseña.
 */

import { Music } from 'lucide-react';
import { BotonBase } from '../../components/ui/BotonBase';
import { CampoTexto } from '../../components/ui/CampoTexto';
import { IconoGoogle } from '../../components/ui/IconoGoogle';
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
                    <IconoGoogle />
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
