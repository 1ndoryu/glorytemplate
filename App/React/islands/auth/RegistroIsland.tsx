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
        cargando,
        error,
        googleBotonRef,
        esGoogleNativo,
        loginGoogleNativo,
        manejarSubmit,
        manejarCambioPassword,
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

                {esGoogleNativo ? (
                    <BotonBase
                        variante="secundario"
                        anchoCompleto
                        cargando={cargando}
                        onClick={loginGoogleNativo}
                        type="button"
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
                        etiqueta="Nombre"
                        name="nombre"
                        placeholder="Tu nombre"
                        autoComplete="name"
                    />

                    <CampoTexto
                        etiqueta="Username"
                        name="username"
                        placeholder="tu_usuario"
                        autoComplete="username"
                    />

                    <CampoTexto
                        etiqueta="Email"
                        name="email"
                        type="text"
                        placeholder="tu@email.com"
                        autoComplete="email"
                    />

                    <CampoTexto
                        etiqueta="Contraseña"
                        name="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        autoComplete="new-password"
                        onInput={manejarCambioPassword}
                    />

                    <CampoTexto
                        etiqueta="Confirmar contraseña"
                        name="confirmar_password"
                        type="password"
                        placeholder="Repite la contraseña"
                        error={errorPassword}
                        autoComplete="new-password"
                        onInput={manejarCambioPassword}
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
