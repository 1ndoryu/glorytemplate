/**
 * Componente: ModalAutenticacion
 * Modal con tabs para Iniciar Sesion / Registrarse.
 * Incluye: login, registro, recuperacion de contrasena, login con Google.
 * La logica de estado se delega al hook useAutenticacion (SRP).
 * TO-DO: Conectar con backend (REST API, JWT, OAuth) cuando esten las credenciales.
 */
import React from 'react';
import {Button} from '../ui/Button';
import {useAutenticacion} from '../../hooks/useAutenticacion';
import './ModalAutenticacion.css';

interface ModalAutenticacionProps {
    abierto: boolean;
    onCerrar: () => void;
}

export const ModalAutenticacion: React.FC<ModalAutenticacionProps> = ({abierto, onCerrar}) => {
    const {
        vista, setVista, cargando, modalRef,
        login, registro, recuperar,
        actualizarLogin, actualizarRegistro, actualizarRecuperar,
        handleLogin, handleRegistro, handleRecuperar,
        handleGoogleLogin, resetRecuperacion
    } = useAutenticacion(abierto, onCerrar);

    /* Cerrar al click fuera del modal */
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onCerrar();
        }
    };

    if (!abierto) return null;

    return (
        <div className="modalOverlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Autenticación">
            <div className="modalContenedor" ref={modalRef}>
                {/* Boton cerrar */}
                <button className="modalCerrar" onClick={onCerrar} aria-label="Cerrar modal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="modalHeader">
                    <h2 className="modalTitulo">
                        {vista === 'login' && 'Iniciar Sesión'}
                        {vista === 'registro' && 'Crear Cuenta'}
                        {vista === 'recuperar' && 'Recuperar Contraseña'}
                    </h2>
                </div>

                {/* Tabs (solo login/registro) */}
                {vista !== 'recuperar' && (
                    <div className="modalTabs">
                        <button
                            className={`modalTab ${vista === 'login' ? 'modalTabActivo' : ''}`}
                            onClick={() => setVista('login')}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            className={`modalTab ${vista === 'registro' ? 'modalTabActivo' : ''}`}
                            onClick={() => setVista('registro')}
                        >
                            Registrarse
                        </button>
                    </div>
                )}

                {/* Contenido: Login */}
                {vista === 'login' && (
                    <form className="modalFormulario" onSubmit={handleLogin}>
                        <div className="modalCampo">
                            <label htmlFor="loginEmail" className="modalEtiqueta">Correo electrónico</label>
                            <input
                                type="email"
                                id="loginEmail"
                                value={login.email}
                                onChange={e => actualizarLogin('email', e.target.value)}
                                placeholder="tu@email.com"
                                className="modalInput"
                                required
                            />
                        </div>
                        <div className="modalCampo">
                            <label htmlFor="loginPassword" className="modalEtiqueta">Contraseña</label>
                            <input
                                type="password"
                                id="loginPassword"
                                value={login.password}
                                onChange={e => actualizarLogin('password', e.target.value)}
                                placeholder="Tu contraseña"
                                className="modalInput"
                                required
                            />
                        </div>
                        <button
                            type="button"
                            className="modalEnlaceTexto"
                            onClick={() => setVista('recuperar')}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                        <Button variante="primario" tamano="mediano" className="modalBotonPrincipal" disabled={cargando}>
                            {cargando ? 'Cargando...' : 'Iniciar Sesión'}
                        </Button>

                        <div className="modalSeparador">
                            <span>o</span>
                        </div>

                        <button type="button" className="modalBotonGoogle" onClick={handleGoogleLogin}>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Continuar con Google
                        </button>
                    </form>
                )}

                {/* Contenido: Registro */}
                {vista === 'registro' && (
                    <form className="modalFormulario" onSubmit={handleRegistro}>
                        <div className="modalCampo">
                            <label htmlFor="regNombre" className="modalEtiqueta">Nombre completo</label>
                            <input
                                type="text"
                                id="regNombre"
                                value={registro.nombre}
                                onChange={e => actualizarRegistro('nombre', e.target.value)}
                                placeholder="Tu nombre"
                                className="modalInput"
                                required
                            />
                        </div>
                        <div className="modalCampo">
                            <label htmlFor="regEmail" className="modalEtiqueta">Correo electrónico</label>
                            <input
                                type="email"
                                id="regEmail"
                                value={registro.email}
                                onChange={e => actualizarRegistro('email', e.target.value)}
                                placeholder="tu@email.com"
                                className="modalInput"
                                required
                            />
                        </div>
                        <div className="modalCampo">
                            <label htmlFor="regPassword" className="modalEtiqueta">Contraseña</label>
                            <input
                                type="password"
                                id="regPassword"
                                value={registro.password}
                                onChange={e => actualizarRegistro('password', e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="modalInput"
                                minLength={8}
                                required
                            />
                        </div>
                        <div className="modalCampo">
                            <label htmlFor="regConfirmar" className="modalEtiqueta">Confirmar contraseña</label>
                            <input
                                type="password"
                                id="regConfirmar"
                                value={registro.confirmar}
                                onChange={e => actualizarRegistro('confirmar', e.target.value)}
                                placeholder="Repite la contraseña"
                                className="modalInput"
                                minLength={8}
                                required
                            />
                        </div>
                        {/* TO-DO: Agregar reCAPTCHA aqui cuando se configuren las keys */}
                        <p className="modalNotaCaptcha">
                            Protegido por reCAPTCHA. Se aplicarán la política de privacidad y los términos de servicio.
                        </p>
                        <Button variante="primario" tamano="mediano" className="modalBotonPrincipal" disabled={cargando}>
                            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
                        </Button>

                        <div className="modalSeparador">
                            <span>o</span>
                        </div>

                        <button type="button" className="modalBotonGoogle" onClick={handleGoogleLogin}>
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Registrarse con Google
                        </button>
                    </form>
                )}

                {/* Contenido: Recuperar contraseña */}
                {vista === 'recuperar' && (
                    <div className="modalFormulario">
                        {recuperar.enviado ? (
                            <div className="modalExito">
                                <p className="modalExitoTexto">
                                    Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                                </p>
                                <Button variante="outline" onClick={resetRecuperacion}>
                                    Volver al login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleRecuperar}>
                                <p className="modalDescripcion">
                                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                                </p>
                                <div className="modalCampo">
                                    <label htmlFor="recEmail" className="modalEtiqueta">Correo electrónico</label>
                                    <input
                                        type="email"
                                        id="recEmail"
                                        value={recuperar.email}
                                        onChange={e => actualizarRecuperar('email', e.target.value)}
                                        placeholder="tu@email.com"
                                        className="modalInput"
                                        required
                                    />
                                </div>
                                <Button variante="primario" tamano="mediano" className="modalBotonPrincipal" disabled={cargando}>
                                    {cargando ? 'Enviando...' : 'Enviar enlace'}
                                </Button>
                                <button type="button" className="modalEnlaceTexto" onClick={() => setVista('login')}>
                                    Volver al inicio de sesión
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
