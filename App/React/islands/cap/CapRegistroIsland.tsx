/**
 * CapRegistroIsland
 *
 * Isla de registro para el sistema CAP.
 * Formulario de registro que crea un usuario WordPress con rol cap_admin.
 */

import {useState, type FormEvent} from 'react';
import {Input, Boton, Alerta} from './components/ui';
import './styles/index.css';
import './components/auth/login.css';

/* Iconos inline */
function IconoUsuario() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function IconoCorreo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

function IconoCandado() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function IconoEdificio() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
            <path d="M9 22v-4h6v4" />
            <path d="M8 6h.01" />
            <path d="M16 6h.01" />
            <path d="M12 6h.01" />
            <path d="M12 10h.01" />
            <path d="M12 14h.01" />
            <path d="M16 10h.01" />
            <path d="M16 14h.01" />
            <path d="M8 10h.01" />
            <path d="M8 14h.01" />
        </svg>
    );
}

function IconoLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6" />
            <path d="M15 6v6" />
            <path d="M2 12h19.6" />
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
            <circle cx="7" cy="18" r="2" />
            <path d="M9 18h5" />
            <circle cx="16" cy="18" r="2" />
        </svg>
    );
}

interface CapRegistroIslandProps {
    restUrl?: string;
    restNonce?: string;
    loginUrl?: string;
}

interface ErroresFormulario {
    nombreCentro?: string;
    nombreUsuario?: string;
    email?: string;
    password?: string;
    confirmarPassword?: string;
}

export function CapRegistroIsland({restUrl = '/wp-json/cap/v1', restNonce = '', loginUrl = '/cap-login/'}: CapRegistroIslandProps) {
    /* Estado del formulario */
    const [nombreCentro, setNombreCentro] = useState('');
    const [nombreUsuario, setNombreUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [aceptaTerminos, setAceptaTerminos] = useState(false);

    /* Estado UI */
    const [cargando, setCargando] = useState(false);
    const [errores, setErrores] = useState<ErroresFormulario>({});
    const [errorGeneral, setErrorGeneral] = useState('');
    const [registroExitoso, setRegistroExitoso] = useState(false);

    /* Validación de formulario */
    const validarFormulario = (): boolean => {
        const nuevosErrores: ErroresFormulario = {};
        let esValido = true;

        if (!nombreCentro.trim()) {
            nuevosErrores.nombreCentro = 'El nombre del centro es obligatorio';
            esValido = false;
        }

        if (!nombreUsuario.trim()) {
            nuevosErrores.nombreUsuario = 'El nombre de usuario es obligatorio';
            esValido = false;
        } else if (nombreUsuario.length < 4) {
            nuevosErrores.nombreUsuario = 'Mínimo 4 caracteres';
            esValido = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            nuevosErrores.email = 'El correo es obligatorio';
            esValido = false;
        } else if (!emailRegex.test(email)) {
            nuevosErrores.email = 'Correo electrónico inválido';
            esValido = false;
        }

        if (!password) {
            nuevosErrores.password = 'La contraseña es obligatoria';
            esValido = false;
        } else if (password.length < 8) {
            nuevosErrores.password = 'Mínimo 8 caracteres';
            esValido = false;
        }

        if (password !== confirmarPassword) {
            nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
            esValido = false;
        }

        setErrores(nuevosErrores);
        return esValido;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorGeneral('');

        if (!validarFormulario()) {
            return;
        }

        if (!aceptaTerminos) {
            setErrorGeneral('Debes aceptar los términos y condiciones');
            return;
        }

        setCargando(true);

        try {
            const response = await fetch(`${restUrl}/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': restNonce
                },
                body: JSON.stringify({
                    nombreCentro,
                    nombreUsuario,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar');
            }

            setRegistroExitoso(true);
        } catch (err) {
            setErrorGeneral(err instanceof Error ? err.message : 'Error al crear la cuenta');
        } finally {
            setCargando(false);
        }
    };

    /* Pantalla de éxito */
    if (registroExitoso) {
        return (
            <div className="capApp capLoginPagina" id="paginaRegistro">
                <div className="capLoginContenedor">
                    <div className="capLoginTarjeta">
                        <div className="capLoginHeader">
                            <div className="capLoginLogo" style={{background: 'linear-gradient(135deg, var(--cap-exito-500), var(--cap-exito-600))'}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <h1 className="capLoginTitulo">¡Registro Exitoso!</h1>
                            <p className="capLoginSubtitulo">Tu cuenta ha sido creada correctamente</p>
                        </div>

                        <Alerta variante="exito" className="capMb--md">
                            Hemos enviado un correo de verificación a <strong>{email}</strong>
                        </Alerta>

                        <Boton variante="primario" anchoCompleto onClick={() => (window.location.href = loginUrl)} className="capLoginBoton">
                            Ir a Iniciar Sesión
                        </Boton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="capApp capLoginPagina" id="paginaRegistro">
            <div className="capLoginContenedor">
                <div className="capLoginTarjeta">
                    {/* Header */}
                    <div className="capLoginHeader">
                        <div className="capLoginLogo">
                            <IconoLogo />
                        </div>
                        <h1 className="capLoginTitulo">Crear Cuenta</h1>
                        <p className="capLoginSubtitulo">Registra tu autoescuela en la plataforma CAP</p>
                    </div>

                    {/* Error general */}
                    {errorGeneral && (
                        <Alerta variante="error" className="capMb--md">
                            {errorGeneral}
                        </Alerta>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="capLoginFormulario">
                        <Input tipo="text" etiqueta="Nombre del Centro / Autoescuela" placeholder="Autoescuela Ejemplo" value={nombreCentro} onChange={e => setNombreCentro(e.target.value)} icono={<IconoEdificio />} error={errores.nombreCentro} disabled={cargando} />

                        <Input tipo="text" etiqueta="Nombre de usuario" placeholder="usuario123" value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)} icono={<IconoUsuario />} error={errores.nombreUsuario} disabled={cargando} autoComplete="username" />

                        <Input tipo="email" etiqueta="Correo electrónico" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} icono={<IconoCorreo />} error={errores.email} disabled={cargando} autoComplete="email" />

                        <Input tipo="password" etiqueta="Contraseña" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} icono={<IconoCandado />} error={errores.password} disabled={cargando} autoComplete="new-password" />

                        <Input tipo="password" etiqueta="Confirmar contraseña" placeholder="Repite tu contraseña" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} icono={<IconoCandado />} error={errores.confirmarPassword} disabled={cargando} autoComplete="new-password" />

                        <label className="capLoginRecordar">
                            <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} disabled={cargando} />
                            <span>
                                Acepto los{' '}
                                <a href="/terminos" className="capLoginEnlace" target="_blank">
                                    términos y condiciones
                                </a>
                            </span>
                        </label>

                        <Boton type="submit" variante="primario" anchoCompleto cargando={cargando} className="capLoginBoton">
                            {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Boton>
                    </form>

                    {/* Footer */}
                    <div className="capLoginFooter">
                        <p>
                            ¿Ya tienes cuenta? <a href={loginUrl}>Inicia sesión</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CapRegistroIsland;
