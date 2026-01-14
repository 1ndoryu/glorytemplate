/**
 * SmtpTab - Configuracion de SMTP para envio de correos
 *
 * Permite configurar un servidor SMTP externo (Brevo, Gmail, etc.)
 * para que los formularios de contacto puedan enviar emails.
 */

import {Mail, Server, Key, User, Send} from 'lucide-react';
import {SettingsField} from './SettingsField';
import {useState} from 'react';
import {getWpNonce} from '../utils/getNonce';

interface SmtpTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export function SmtpTab({options, onUpdate}: SmtpTabProps): JSX.Element {
    const [testingEmail, setTestingEmail] = useState(false);
    const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

    const isEnabled = options.glory_smtp_enabled === '1' || options.glory_smtp_enabled === 'true';

    const handleToggleSmtp = () => {
        onUpdate('glory_smtp_enabled', isEnabled ? '' : '1');
    };

    const handleSendTestEmail = async () => {
        const testEmail = options.glory_smtp_from_email || options.glory_site_email;
        if (!testEmail) {
            setTestResult({success: false, message: 'Configura un email remitente primero'});
            return;
        }

        setTestingEmail(true);
        setTestResult(null);

        try {
            const response = await fetch('/wp-json/glory/v1/smtp/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': getWpNonce()
                },
                body: JSON.stringify({email: testEmail})
            });

            const data = await response.json();
            setTestResult({
                success: data.success,
                message: data.message || (data.success ? 'Email enviado' : 'Error al enviar')
            });
        } catch {
            setTestResult({success: false, message: 'Error de conexion'});
        } finally {
            setTestingEmail(false);
        }
    };

    return (
        <div id="settings-smtp-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <Mail className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Configuracion SMTP</h2>
                    <p className="settings-tab-description">Configura un servidor SMTP externo para enviar correos desde los formularios. Sin esto, los emails del formulario de contacto no funcionaran.</p>
                </div>
            </header>

            <div className="settings-fields-grid">
                <div className="settings-field-group">
                    <div className="settings-toggle-row">
                        <label className="settings-toggle-label">
                            <Server className="settings-group-icon" />
                            Habilitar SMTP
                        </label>
                        <button type="button" onClick={handleToggleSmtp} className={`settings-toggle ${isEnabled ? 'settings-toggle--active' : ''}`} aria-pressed={isEnabled}>
                            <span className="settings-toggle-track">
                                <span className="settings-toggle-thumb" />
                            </span>
                            <span className="settings-toggle-text">{isEnabled ? 'Activado' : 'Desactivado'}</span>
                        </button>
                    </div>
                    <p className="settings-field-description">Cuando esta desactivado, WordPress intentara usar el servidor de correo local (que probablemente no funcione).</p>
                </div>

                {isEnabled && (
                    <>
                        <div className="settings-field-group">
                            <h3 className="settings-group-title">
                                <Server className="settings-group-icon" />
                                Servidor SMTP
                            </h3>

                            <SettingsField id="glory_smtp_host" label="Host SMTP" type="text" value={options.glory_smtp_host || ''} onChange={(value: string) => onUpdate('glory_smtp_host', value)} description="Servidor SMTP (ej: smtp-relay.brevo.com, smtp.gmail.com)" placeholder="smtp-relay.brevo.com" />

                            <SettingsField id="glory_smtp_port" label="Puerto" type="text" value={options.glory_smtp_port || '587'} onChange={(value: string) => onUpdate('glory_smtp_port', value)} description="Puerto SMTP (587 para TLS, 465 para SSL)" placeholder="587" />
                        </div>

                        <div className="settings-field-group">
                            <h3 className="settings-group-title">
                                <Key className="settings-group-icon" />
                                Credenciales
                            </h3>

                            <SettingsField id="glory_smtp_user" label="Usuario SMTP" type="text" value={options.glory_smtp_user || ''} onChange={(value: string) => onUpdate('glory_smtp_user', value)} description="Usuario o API Key del servicio SMTP" placeholder="xsmtpsib-abc123..." />

                            <SettingsField id="glory_smtp_password" label="Contrasena SMTP" type="text" inputType="password" value={options.glory_smtp_password || ''} onChange={(value: string) => onUpdate('glory_smtp_password', value)} description="Contrasena o API Key del servicio SMTP" placeholder="••••••••" />
                        </div>

                        <div className="settings-field-group">
                            <h3 className="settings-group-title">
                                <User className="settings-group-icon" />
                                Remitente
                            </h3>

                            <SettingsField id="glory_smtp_from_email" label="Email Remitente" type="text" inputType="email" value={options.glory_smtp_from_email || ''} onChange={(value: string) => onUpdate('glory_smtp_from_email', value)} description="Email desde el cual se enviaran los correos (debe estar verificado en tu proveedor SMTP)" placeholder="noreply@tudominio.com" />

                            <SettingsField id="glory_smtp_from_name" label="Nombre Remitente" type="text" value={options.glory_smtp_from_name || ''} onChange={(value: string) => onUpdate('glory_smtp_from_name', value)} description="Nombre que aparecera como remitente (ej: nombre del sitio)" placeholder="Mi Sitio Web" />

                            <SettingsField id="glory_smtp_bcc_email" label="Email de Copia (BCC)" type="text" inputType="email" value={options.glory_smtp_bcc_email || ''} onChange={(value: string) => onUpdate('glory_smtp_bcc_email', value)} description="Opcional. Recibe una copia oculta de todos los correos del formulario de contacto para monitorear." placeholder="tu@email.com" />
                        </div>

                        <div className="settings-field-group">
                            <h3 className="settings-group-title">
                                <Send className="settings-group-icon" />
                                Probar Configuracion
                            </h3>
                            <p className="settings-field-description">Envia un email de prueba para verificar que la configuracion SMTP funciona correctamente. El email se enviara a la direccion configurada como remitente.</p>
                            <button type="button" onClick={handleSendTestEmail} disabled={testingEmail || !options.glory_smtp_host || !options.glory_smtp_user} className="settings-btn settings-btn--secondary">
                                {testingEmail ? (
                                    <>
                                        <span className="settings-btn-spinner" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="settings-btn-icon" />
                                        Enviar Email de Prueba
                                    </>
                                )}
                            </button>

                            {testResult && <div className={`settings-test-result ${testResult.success ? 'settings-test-result--success' : 'settings-test-result--error'}`}>{testResult.message}</div>}
                        </div>

                        <div className="settings-info-box">
                            <h4>Configuracion para Brevo (Sendinblue)</h4>
                            <ul>
                                <li>
                                    <strong>Host:</strong> smtp-relay.brevo.com
                                </li>
                                <li>
                                    <strong>Puerto:</strong> 587
                                </li>
                                <li>
                                    <strong>Usuario:</strong> Tu clave SMTP (empieza con xsmtpsib-)
                                </li>
                                <li>
                                    <strong>Contrasena:</strong> La misma clave SMTP
                                </li>
                                <li>
                                    <strong>Email:</strong> El email verificado en tu cuenta Brevo
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
