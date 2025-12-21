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
    const [modo, setModo] = useState<'login' | 'registro'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo={modo === 'login' ? 'Acceso a Glory Dashboard' : 'Registro de Usuario'}>
            <div className="modalLoginContenido">
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
                </form>

                <div className="loginSeparador">
                    <span className="loginSeparadorTexto">ó</span>
                </div>

                <button type="button" className="botonSecundario botonFull botonGoogle" onClick={onLoginGoogle} disabled={loading}>
                    <Chrome size={16} style={{marginRight: 8}} />
                    Continuar con Google
                </button>
            </div>
        </Modal>
    );
}
