/**
 * IdentityTab - Configuración de identidad del sitio
 *
 * Permite configurar:
 * - Nombre del sitio
 * - Tagline/Slogan
 * - Teléfono
 * - Email
 */

import {Building2} from 'lucide-react';
import {SettingsField} from './SettingsField';

interface IdentityTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export function IdentityTab({options, onUpdate}: IdentityTabProps): JSX.Element {
    return (
        <div id="settings-identity-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <Building2 className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Identidad del Sitio</h2>
                    <p className="settings-tab-description">Información básica de tu negocio que aparece en el sitio web.</p>
                </div>
            </header>

            <div className="settings-fields-grid">
                <SettingsField id="glory_site_name" label="Nombre del Sitio" type="text" value={options.glory_site_name || ''} onChange={(value: string) => onUpdate('glory_site_name', value)} description="El nombre que aparece en encabezados, SEO y schemas JSON-LD." placeholder="Ej: Guillermo Garcia" />

                <SettingsField id="glory_site_tagline" label="Tagline / Slogan" type="text" value={options.glory_site_tagline || ''} onChange={(value: string) => onUpdate('glory_site_tagline', value)} description="Descripción corta del sitio usada en SEO y headers." placeholder="Ej: Consultoría en Chatbots y Automatización" />

                <SettingsField id="glory_site_phone" label="Teléfono de Contacto" type="text" value={options.glory_site_phone || ''} onChange={(value: string) => onUpdate('glory_site_phone', value)} description="Número con código de país (ej: +34 612 345 678). Usado en JSON-LD y sección de contacto." placeholder="Ej: +34 612 345 678" />

                <SettingsField id="glory_site_email" label="Email de Contacto" type="text" inputType="email" value={options.glory_site_email || ''} onChange={(value: string) => onUpdate('glory_site_email', value)} description="Dirección de email principal para contacto." placeholder="Ej: hola@tudominio.com" />
            </div>
        </div>
    );
}
