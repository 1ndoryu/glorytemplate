/**
 * CapLoginIsland
 *
 * Isla de login para el sistema CAP.
 * Formulario estilizado que hace POST a wp-login.php
 */

import {useState, type FormEvent} from 'react';
import {Input, Boton, Alerta} from './components/ui';
import {IconoUsuario, IconoCandado, IconoLogoCap} from './components/icons';
import './styles/index.css';
import './components/auth/login.css';

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
                            <IconoLogoCap size={40} />
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
