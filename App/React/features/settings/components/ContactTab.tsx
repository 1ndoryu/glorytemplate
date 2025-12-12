/**
 * ContactTab - Configuracion de URLs de contacto
 *
 * Permite configurar:
 * - URL de Calendly
 * - Numero de WhatsApp
 * - Mensaje predefinido de WhatsApp
 */

import {Calendar, MessageCircle} from 'lucide-react';
import {SettingsField} from './SettingsField';

interface ContactTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export function ContactTab({options, onUpdate}: ContactTabProps): JSX.Element {
    const whatsappPreview = options.glory_url_whatsapp ? `https://wa.me/${options.glory_url_whatsapp}` : '';

    return (
        <div id="settings-contact-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <Calendar className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">URLs de Contacto</h2>
                    <p className="settings-tab-description">Configura los enlaces externos para que tus clientes puedan contactarte.</p>
                </div>
            </header>

            <div className="settings-fields-grid">
                <SettingsField id="glory_url_calendly" label="URL de Calendly" type="text" inputType="url" value={options.glory_url_calendly || ''} onChange={value => onUpdate('glory_url_calendly', value)} description="URL completa a tu calendario de Calendly." placeholder="https://calendly.com/tu-usuario" icon={<Calendar className="settings-field-icon" />} />

                <div className="settings-field-group">
                    <h3 className="settings-group-title">
                        <MessageCircle className="settings-group-icon" />
                        WhatsApp
                    </h3>

                    <SettingsField id="glory_url_whatsapp" label="Numero de WhatsApp" type="text" value={options.glory_url_whatsapp || ''} onChange={value => onUpdate('glory_url_whatsapp', value)} description="Numero sin + ni espacios (ej: 34612345678). Se usara como wa.me/NUMERO." placeholder="34612345678" />

                    {whatsappPreview && (
                        <div className="settings-preview-link">
                            <span className="settings-preview-label">Vista previa:</span>
                            <a href={whatsappPreview} target="_blank" rel="noopener noreferrer" className="settings-preview-url">
                                {whatsappPreview}
                            </a>
                        </div>
                    )}

                    <SettingsField id="glory_whatsapp_message" label="Mensaje Predefinido" type="textarea" value={options.glory_whatsapp_message || ''} onChange={value => onUpdate('glory_whatsapp_message', value)} description="Mensaje opcional que aparecera pre-escrito cuando el usuario haga clic en WhatsApp." placeholder="Hola, me gustaria obtener mas informacion sobre..." rows={3} />
                </div>
            </div>
        </div>
    );
}
