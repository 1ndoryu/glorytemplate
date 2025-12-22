import React, {useState} from 'react';
import {Modal} from '../shared/Modal';
import {CampoTexto} from '../shared/CampoTexto';
import {Chrome, LogIn} from 'lucide-react';
import '../../styles/dashboard/componentes/modalLogin.css';

interface ModalLoginProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    onLoginGoogle: () => void;
    onLoginCredentials: (u: string, p: string) => Promise<void>;
    onRegister: (u: string, e: string, p: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export function ModalLogin({estaAbierto, onCerrar, onLoginGoogle, onLoginCredentials, onRegister, loading, error}: ModalLoginProps): JSX.Element {
    const [modo, setModo] = useState<'login' | 'registro' | 'recuperar'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailRecuperar, setEmailRecuperar] = useState('');
    const [recuperarLoading, setRecuperarLoading] = useState(false);
    const [recuperarMensaje, setRecuperarMensaje] = useState<{tipo: 'exito' | 'error'; texto: string} | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        if (modo === 'registro') {
            if (!email) return;
            await onRegister(username, email, password);
        } else {
            await onLoginCredentials(username, password);
        }
    };

    const handleRecuperar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailRecuperar) return;

        setRecuperarLoading(true);
        setRecuperarMensaje(null);

        try {
            const response = await fetch('/wp-json/glory/v1/auth/recuperar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email: emailRecuperar})
            });
            const data = await response.json();
            setRecuperarMensaje({tipo: 'exito', texto: data.message});
            setEmailRecuperar('');
        } catch {
            setRecuperarMensaje({tipo: 'error', texto: 'Error al procesar la solicitud'});
        } finally {
            setRecuperarLoading(false);
        }
    };

    const tituloModal = modo === 'login' ? 'Acceso a Glory Dashboard' : modo === 'registro' ? 'Registro de Usuario' : 'Recuperar Contraseña';

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo={tituloModal}>
            <div className="modalLoginContenido">
                {modo !== 'recuperar' ? (
                    <>
                        <div className="loginTabs">
                            <button className={`loginTab ${modo === 'login' ? 'activo' : ''}`} onClick={() => setModo('login')}>
                                Iniciar Sesión
                            </button>
                            <button className={`loginTab ${modo === 'registro' ? 'activo' : ''}`} onClick={() => setModo('registro')}>
                                Registrarse
                            </button>
                        </div>

                        {error && (
                            <div className="loginError">
                                <span className="loginError__icono">⚠️</span>
                                <span className="loginError__texto">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="loginForm">
                            <CampoTexto titulo="Usuario" valor={username} onChange={setUsername} autoFocus disabled={loading} />

                            {modo === 'registro' && <CampoTexto titulo="Email" valor={email} onChange={setEmail} tipo="email" disabled={loading} />}

                            <CampoTexto titulo="Contraseña" valor={password} onChange={setPassword} tipo="password" disabled={loading} />

                            <div style={{marginTop: 8}}></div>

                            <button type="submit" className="botonPrimario botonFull" disabled={loading}>
                                {loading ? (
                                    'Procesando...'
                                ) : (
                                    <>
                                        <LogIn size={16} style={{marginRight: 8}} />
                                        {modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                                    </>
                                )}
                            </button>

                            {modo === 'login' && (
                                <button
                                    type="button"
                                    className="enlaceRecuperar"
                                    onClick={() => {
                                        setModo('recuperar');
                                        setRecuperarMensaje(null);
                                    }}>
                                    ¿Olvidaste tu contraseña?
                                </button>
                            )}
                        </form>

                        <div className="loginSeparador">
                            <span className="loginSeparadorTexto">ó</span>
                        </div>

                        <button type="button" className="botonSecundario botonFull botonGoogle" onClick={onLoginGoogle} disabled={loading}>
                            <Chrome size={16} style={{marginRight: 8}} />
                            Continuar con Google
                        </button>
                    </>
                ) : (
                    <div className="recuperarContenido">
                        <p className="recuperarDescripcion">Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.</p>

                        {recuperarMensaje && <div className={`mensajeRecuperar mensajeRecuperar--${recuperarMensaje.tipo}`}>{recuperarMensaje.texto}</div>}

                        <form onSubmit={handleRecuperar} className="loginForm">
                            <CampoTexto titulo="Correo Electrónico" valor={emailRecuperar} onChange={setEmailRecuperar} tipo="email" autoFocus disabled={recuperarLoading} />

                            <button type="submit" className="botonPrimario botonFull" disabled={recuperarLoading}>
                                {recuperarLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                            </button>
                        </form>

                        <button type="button" className="enlaceRecuperar" onClick={() => setModo('login')}>
                            ← Volver al inicio de sesión
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
