/**
 * CapRegistroIsland
 *
 * Isla de registro para el sistema CAP.
 * Formulario de registro que crea un usuario WordPress con rol cap_admin.
 */

import {useState, type FormEvent} from 'react';
import {Input, Boton, Alerta} from './components/ui';
import {IconoUsuario, IconoCorreo, IconoCandado, IconoEdificio, IconoLogoCap, IconoCheck} from './components/icons';
import './styles/index.css';
import './components/auth/login.css';

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

    /* Estado para checkout de Stripe */
    const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
    const [diasTrial, setDiasTrial] = useState(14);
    const [redireccionando, setRedireccionando] = useState(false);

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

            /* Guardar información de Stripe si está disponible */
            if (data.stripeCheckoutUrl) {
                setStripeCheckoutUrl(data.stripeCheckoutUrl);
            }
            if (data.diasTrial) {
                setDiasTrial(data.diasTrial);
            }

            setRegistroExitoso(true);
        } catch (err) {
            setErrorGeneral(err instanceof Error ? err.message : 'Error al crear la cuenta');
        } finally {
            setCargando(false);
        }
    };

    /* Handler para ir al checkout de Stripe */
    const irACheckout = () => {
        if (stripeCheckoutUrl) {
            setRedireccionando(true);
            window.location.href = stripeCheckoutUrl;
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
                                <IconoCheck size={40} />
                            </div>
                            <h1 className="capLoginTitulo">¡Registro Exitoso!</h1>
                            <p className="capLoginSubtitulo">Tu cuenta ha sido creada correctamente</p>
                        </div>

                        <Alerta variante="exito" className="capMb--md">
                            Hemos enviado un correo de confirmación a <strong>{email}</strong>
                        </Alerta>

                        {/* Opciones post-registro */}
                        <div className="capRegistroOpciones">
                            {stripeCheckoutUrl ? (
                                <>
                                    {/* Opción premium: Suscribirse ahora */}
                                    <div className="capRegistroOpcion capRegistroOpcion--destacada">
                                        <h3>🚀 Acceso Completo</h3>
                                        <p>Suscríbete ahora y desbloquea todas las funcionalidades sin límites.</p>
                                        <Boton variante="primario" anchoCompleto onClick={irACheckout} cargando={redireccionando} className="capLoginBoton">
                                            {redireccionando ? 'Redirigiendo a pago...' : 'Suscribirme Ahora'}
                                        </Boton>
                                    </div>

                                    <div className="capRegistroSeparador">
                                        <span>o</span>
                                    </div>

                                    {/* Opción trial */}
                                    <div className="capRegistroOpcion">
                                        <h3>🎁 Prueba Gratuita</h3>
                                        <p>
                                            Explora la plataforma durante <strong>{diasTrial} días</strong> sin compromiso.
                                        </p>
                                        <Boton variante="secundario" anchoCompleto onClick={() => (window.location.href = loginUrl)} className="capLoginBoton">
                                            Comenzar Prueba Gratuita
                                        </Boton>
                                    </div>
                                </>
                            ) : (
                                /* Sin Stripe configurado: solo trial */
                                <>
                                    <Alerta variante="info" className="capMb--md">
                                        Tienes <strong>{diasTrial} días de prueba gratuita</strong> para explorar todas las funcionalidades.
                                    </Alerta>
                                    <Boton variante="primario" anchoCompleto onClick={() => (window.location.href = loginUrl)} className="capLoginBoton">
                                        Ir a Iniciar Sesión
                                    </Boton>
                                </>
                            )}
                        </div>
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
                            <IconoLogoCap size={40} />
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
