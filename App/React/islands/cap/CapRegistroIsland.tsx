/**
 * CapRegistroIsland
 *
 * Isla de registro para el sistema CAP.
 * Formulario de registro que crea un usuario WordPress con rol cap_admin.
 * Lógica de estado y fetch delegadas a useRegistro (SRP).
 */

import {useRegistro} from './hooks/useRegistro';
import {Input, Boton, Alerta} from './components/ui';
import {IconoUsuario, IconoCorreo, IconoCandado, IconoEdificio, IconoLogoCap, IconoCheck} from './components/icons';
import './styles/index.css';
import './components/auth/login.css';

interface CapRegistroIslandProps {
    restUrl?: string;
    restNonce?: string;
    loginUrl?: string;
}

export function CapRegistroIsland({restUrl = '/wp-json/cap/v1', restNonce = '', loginUrl = '/cap-login/'}: CapRegistroIslandProps) {
    const {
        nombreCentro, setNombreCentro,
        nombreUsuario, setNombreUsuario,
        email, setEmail,
        password, setPassword,
        confirmarPassword, setConfirmarPassword,
        aceptaTerminos, setAceptaTerminos,
        cargando, errores, errorGeneral, registroExitoso,
        stripeCheckoutUrl, diasTrial, trialHabilitado, redireccionando,
        handleSubmit, irACheckout
    } = useRegistro({restUrl, restNonce, loginUrl});

    /* Pantalla de éxito */
    if (registroExitoso) {
        return (
            <div className="capApp capLoginPagina" id="paginaRegistro">
                <div className="capLoginContenedor">
                    <div className="capLoginTarjeta">
                        <div className="capLoginHeader">
                            <div className="capLoginLogo capLoginLogo--exito">
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
                                        <h3>Acceso Completo</h3>
                                        <p>Suscríbete ahora y desbloquea todas las funcionalidades sin límites.</p>
                                        <Boton variante="primario" anchoCompleto onClick={irACheckout} cargando={redireccionando} className="capLoginBoton">
                                            {redireccionando ? 'Redirigiendo a pago...' : 'Suscribirme Ahora'}
                                        </Boton>
                                    </div>

                                    {/* Opción trial: solo si trial habilitado y dias > 0 */}
                                    {trialHabilitado && diasTrial > 0 && (
                                        <>
                                            <div className="capRegistroSeparador">
                                                <span>o</span>
                                            </div>

                                            <div className="capRegistroOpcion">
                                                <h3>Prueba Gratuita</h3>
                                                <p>
                                                    Explora la plataforma durante <strong>{diasTrial} días</strong> sin compromiso.
                                                </p>
                                                <Boton variante="secundario" anchoCompleto onClick={() => (window.location.href = loginUrl)} className="capLoginBoton">
                                                    Comenzar Prueba Gratuita
                                                </Boton>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                /* Sin Stripe configurado */
                                <>
                                    {trialHabilitado && diasTrial > 0 ? (
                                        <Alerta variante="info" className="capMb--md">
                                            Tienes <strong>{diasTrial} días de prueba gratuita</strong> para explorar todas las funcionalidades.
                                        </Alerta>
                                    ) : (
                                        <Alerta variante="advertencia" className="capMb--md">
                                            Tu cuenta ha sido creada. Contacta con el administrador para activar tu suscripción.
                                        </Alerta>
                                    )}
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
