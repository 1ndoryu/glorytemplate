/*
 * Componente: ModalAuth
 * Modal full-screen de login y registro con soporte Google OAuth.
 * Layout: imagen en mitad izquierda, formulario en mitad derecha.
 * Renderiza su propio portal (no usa Modal base) para tener control total
 * del layout sin restricciones de max-width ni border-radius.
 */

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { IconoGoogle } from '../ui/IconoGoogle';
import { useAuth } from '../../hooks/useAuth';
import { useModalAuth } from '../../hooks/useModalAuth';
import '../../styles/componentes/authModal.css';
import { resolverRutaAsset } from '@app/utils/resolverRutaAsset';
import { useT } from '@app/utils/i18n';
/* [183A-111] ModalAuth migrado a i18n: FormularioLogin, FormularioRegistro y ModalAuth via t() */
/* [2003A-17] imagenAuth movida al interior del componente — la constante módulo se evalúa antes
 * de que window.__KAMPLES_DESKTOP__ sea seteado por main.tsx, retornando ruta relativa rota. */

/* Formulario de Login */
const FormularioLogin = ({ onCambiar }: { onCambiar: () => void }): JSX.Element => {
    const { t } = useT();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, iniciarSesion, googleBotonRef, esGoogleNativo, loginGoogleNativo } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
        iniciarSesion(email, password);
    };

    return (
        <div className="authFormContenedor">
            <h2 className="authTitulo">{t('auth.login.titulo')}</h2>

            {/* QL32: En desktop/APK, Google GSI no funciona en WebView; mostrar boton propio */}
            {esGoogleNativo ? (
                <BotonBase
                    variante="secundario"
                    anchoCompleto
                    onClick={loginGoogleNativo}
                    cargando={cargando}
                    className="authGoogleBtnDesktop"
                    type="button"
                >
                    <IconoGoogle />
                    {t('auth.continuarConGoogle')}
                </BotonBase>
            ) : (
                <div ref={googleBotonRef} className="authGoogleBtnContenedor" />
            )}

            <div className="authSeparador">{t('auth.o')}</div>

            {error && <div className="authError">{error}</div>}

            <form className="authFormulario" onSubmit={manejarSubmit}>
                <CampoTexto
                    etiqueta={t('auth.emailOUsuario')}
                    type="text"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <CampoTexto
                    etiqueta={t('auth.contrasena')}
                    type="password"
                    placeholder={t('auth.contrasenaPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <BotonBase
                    type="submit"
                    variante="primario"
                    anchoCompleto
                    cargando={cargando}
                >
                    {t('auth.iniciarSesion')}
                </BotonBase>
            </form>

            <p className="authFooter">
                {t('auth.noTienesCuenta')}{' '}
                <BotonBase variante="ghost" type="button" className="authEnlace" onClick={onCambiar}>
                    {t('auth.registrateGratis')}
                </BotonBase>
            </p>
        </div>
    );
};

/* Formulario de Registro (simplificado: username, email, password) */
const FormularioRegistro = ({ onCambiar }: { onCambiar: () => void }): JSX.Element => {
    const { t } = useT();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { cargando, error, registrar, googleBotonRef, esGoogleNativo, loginGoogleNativo } = useAuth();

    const manejarSubmit = (e: FormEvent) => {
        e.preventDefault();
        registrar({ nombreVisible: username, username, email, password });
    };

    return (
        <div className="authFormContenedor">
            <h2 className="authTitulo">{t('auth.registro.titulo')}</h2>

            {/* QL32: En desktop/APK, Google GSI no funciona en WebView; mostrar boton propio */}
            {esGoogleNativo ? (
                <BotonBase
                    variante="secundario"
                    anchoCompleto
                    onClick={loginGoogleNativo}
                    cargando={cargando}
                    className="authGoogleBtnDesktop"
                    type="button"
                >
                    <IconoGoogle />
                    {t('auth.continuarConGoogle')}
                </BotonBase>
            ) : (
                <div ref={googleBotonRef} className="authGoogleBtnContenedor" />
            )}

            <div className="authSeparador">{t('auth.o')}</div>

            {error && <div className="authError">{error}</div>}

            <form className="authFormulario" onSubmit={manejarSubmit}>
                <CampoTexto
                    etiqueta={t('config.nombreUsuario')}
                    placeholder="tu_usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <CampoTexto
                    etiqueta={t('auth.email')}
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <CampoTexto
                    etiqueta={t('auth.contrasena')}
                    type="password"
                    placeholder={t('auth.contrasenaMin')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <BotonBase
                    type="submit"
                    variante="primario"
                    anchoCompleto
                    cargando={cargando}
                >
                    {t('auth.registro')}
                </BotonBase>
            </form>

            <p className="authFooter">
                {t('auth.yaTienesCuenta')}{' '}
                <BotonBase variante="ghost" type="button" className="authEnlace" onClick={onCambiar}>
                    {t('auth.iniciarSesion')}
                </BotonBase>
            </p>
        </div>
    );
};

export const ModalAuth = (): JSX.Element | null => {
    const { abierto, vista, cerrar, cambiarALogin, cambiarARegistro, puedesCerrar } = useModalAuth();
    /* [2003A-17] Evaluada aquí (no en módulo) para que __KAMPLES_DESKTOP__ esté seteado */
    const imagenAuth = resolverRutaAsset('/wp-content/themes/glorytemplate/App/Assets/images/2.jpg');

    const manejarEscape = useCallback(
        (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); },
        [cerrar]
    );

    useEffect(() => {
        if (!abierto) return;
        document.addEventListener('keydown', manejarEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', manejarEscape);
            document.body.style.overflow = '';
        };
    }, [abierto, manejarEscape]);

    if (!abierto) return null;

    return createPortal(
        <div className={`authPantallaCompleta${puedesCerrar ? '' : ' authSoloFormulario'}`} role="dialog" aria-modal="true">
            {puedesCerrar && (
                <aside className="authPanelImagen">
                    <img src={imagenAuth} alt="Kamples" className="authImagen" loading="lazy" />
                </aside>
            )}
            <section className="authPanelContenido">
                {puedesCerrar && (
                    <BotonBase
                        variante="ghost"
                        className="authBtnCerrar"
                        onClick={cerrar}
                        aria-label="Cerrar"
                        type="button"
                    >
                        <X size={20} />
                    </BotonBase>
                )}
                {vista === 'login'
                    ? <FormularioLogin onCambiar={cambiarARegistro} />
                    : <FormularioRegistro onCambiar={cambiarALogin} />
                }
            </section>
        </div>,
        document.body
    );
};
