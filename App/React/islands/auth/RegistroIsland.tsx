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
        googleBotonRef,
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

                {/* QK5: Botón de Google renderizado por GSI — abre popup nativo,
                 * funciona en incógnito sin third-party cookies. */}
                <div ref={googleBotonRef} className="loginGoogleBtnContenedor" />

                <div className="loginSeparador">o</div>

                {error && <div className="loginError">{error}</div>}

                <form className="loginFormulario" onSubmit={manejarSubmit}>
                    <CampoTexto
                        etiqueta="Nombre"
                        name="nombre"
                        placeholder="Tu nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        autoComplete="name"
                    />

                    <CampoTexto
                        etiqueta="Username"
                        name="username"
                        placeholder="tu_usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />

                    <CampoTexto
                        etiqueta="Email"
                        name="email"
                        type="text"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />

                    <CampoTexto
                        etiqueta="Contraseña"
                        name="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />

                    <CampoTexto
                        etiqueta="Confirmar contraseña"
                        name="confirmar_password"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={confirmarPassword}
                        onChange={(e) => setConfirmarPassword(e.target.value)}
                        error={errorPassword}
                        autoComplete="new-password"
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
