/**
 * CapLoginIsland
 *
 * Isla de login para el sistema CAP.
 * Formulario estilizado que hace POST a wp-login.php
 */

import {Input, Boton, Alerta} from './components/ui';
import {IconoUsuario, IconoCandado, IconoLogoCap} from './components/icons';
import {useCapLogin} from './hooks/useCapLogin';
import './styles/index.css';
import './components/auth/login.css';

interface CapLoginIslandProps {
    siteUrl?: string;
    redirectTo?: string;
    registroUrl?: string;
    errorInicial?: string;
}

export function CapLoginIsland({siteUrl = '', redirectTo = '/cap-dashboard/', registroUrl = '/cap-registro/', errorInicial = ''}: CapLoginIslandProps) {
    const {usuario, setUsuario, password, setPassword, recordar, setRecordar, cargando, error, handleSubmit} = useCapLogin({siteUrl, redirectTo, errorInicial});

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
