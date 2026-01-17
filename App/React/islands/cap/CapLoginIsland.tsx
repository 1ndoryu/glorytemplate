/**
 * CapLoginIsland
 *
 * Isla de login para el sistema CAP.
 * Formulario estilizado que hace POST a wp-login.php
 */

import {useState, type FormEvent} from 'react';
import {Input, Boton, Alerta} from './components/ui';
import './styles/index.css';
import './components/auth/login.css';

/* Iconos inline para evitar dependencias */
function IconoUsuario() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
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

interface CapLoginIslandProps {
    siteUrl?: string;
    redirectTo?: string;
    registroUrl?: string;
    errorInicial?: string;
}

export function CapLoginIsland({siteUrl = '', redirectTo = '/cap-dashboard/', registroUrl = '/cap-registro/', errorInicial = ''}: CapLoginIslandProps) {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [recordar, setRecordar] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(errorInicial);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        /* Validación básica */
        if (!usuario.trim()) {
            setError('Ingresa tu usuario o correo electrónico');
            setCargando(false);
            return;
        }

        if (!password) {
            setError('Ingresa tu contraseña');
            setCargando(false);
            return;
        }

        /* Login via fetch con wp_nonce para mayor seguridad */
        try {
            const formData = new FormData();
            formData.append('log', usuario);
            formData.append('pwd', password);
            formData.append('rememberme', recordar ? 'forever' : '');
            formData.append('redirect_to', redirectTo);

            /*
             * Hacemos POST directo a wp-login.php
             * WordPress maneja la autenticación y redirige
             */
            const loginUrl = `${siteUrl}/wp-login.php`;

            /* Enviamos el formulario de forma tradicional para que WP maneje las cookies */
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = loginUrl;
            form.style.display = 'none';

            const inputs = [
                {name: 'log', value: usuario},
                {name: 'pwd', value: password},
                {name: 'rememberme', value: recordar ? 'forever' : ''},
                {name: 'redirect_to', value: redirectTo},
                {name: 'testcookie', value: '1'}
            ];

            inputs.forEach(({name, value}) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch {
            setError('Error al conectar con el servidor. Intenta de nuevo.');
            setCargando(false);
        }
    };

    return (
        <div className="capApp capLoginPagina" id="paginaLogin">
            <div className="capLoginContenedor">
                <div className="capLoginTarjeta">
                    {/* Header */}
                    <div className="capLoginHeader">
                        <div className="capLoginLogo">
                            <IconoLogo />
                        </div>
                        <h1 className="capLoginTitulo">Bienvenido</h1>
                        <p className="capLoginSubtitulo">Accede a tu panel de gestión CAP</p>
                    </div>

                    {/* Mensaje de error */}
                    {error && (
                        <Alerta variante="error" className="capMb--md">
                            {error}
                        </Alerta>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="capLoginFormulario">
                        <Input tipo="text" etiqueta="Usuario o correo electrónico" placeholder="tu@email.com" value={usuario} onChange={e => setUsuario(e.target.value)} icono={<IconoUsuario />} disabled={cargando} autoComplete="username" />

                        <Input tipo="password" etiqueta="Contraseña" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} icono={<IconoCandado />} disabled={cargando} autoComplete="current-password" />

                        <div className="capLoginOpciones">
                            <label className="capLoginRecordar">
                                <input type="checkbox" checked={recordar} onChange={e => setRecordar(e.target.checked)} disabled={cargando} />
                                <span>Recordarme</span>
                            </label>

                            <a href={`${siteUrl}/wp-login.php?action=lostpassword`} className="capLoginEnlace">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        <Boton type="submit" variante="primario" anchoCompleto cargando={cargando} className="capLoginBoton">
                            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Boton>
                    </form>

                    {/* Footer */}
                    <div className="capLoginFooter">
                        <p>
                            ¿No tienes cuenta? <a href={registroUrl}>Regístrate aquí</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CapLoginIsland;
