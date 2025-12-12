/**
 * IntegrationsTab - Configuracion de integraciones y tracking
 *
 * Permite configurar:
 * - Google Tag Manager ID
 * - Google Analytics 4 ID
 * - Google Search Console verification
 */

import {LineChart, Tag, Search} from 'lucide-react';
import {SettingsField} from './SettingsField';

interface IntegrationsTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export function IntegrationsTab({options, onUpdate}: IntegrationsTabProps): JSX.Element {
    return (
        <div id="settings-integrations-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <LineChart className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Integraciones y Tracking</h2>
                    <p className="settings-tab-description">Configura los codigos de seguimiento y verificacion de Google.</p>
                </div>
            </header>

            <div className="settings-fields-grid">
                <SettingsField id="glory_gtm_id" label="Google Tag Manager ID" type="text" value={options.glory_gtm_id || ''} onChange={value => onUpdate('glory_gtm_id', value)} description="ID del contenedor GTM (ej: GTM-XXXXXXX). Se carga despues del consentimiento de cookies." placeholder="GTM-XXXXXXX" icon={<Tag className="settings-field-icon" />} />

                <SettingsField id="glory_ga4_measurement_id" label="Google Analytics 4 ID" type="text" value={options.glory_ga4_measurement_id || ''} onChange={value => onUpdate('glory_ga4_measurement_id', value)} description="ID de medicion GA4 (ej: G-XXXXXXXXXX) para analytics basico." placeholder="G-XXXXXXXXXX" icon={<LineChart className="settings-field-icon" />} />

                <SettingsField id="glory_gsc_verification_code" label="Codigo de Verificacion de Search Console" type="text" value={options.glory_gsc_verification_code || ''} onChange={value => onUpdate('glory_gsc_verification_code', value)} description="Contenido del meta tag de verificacion GSC (ej: ABC123xyz...)." placeholder="ABC123xyz..." icon={<Search className="settings-field-icon" />} />

                <SettingsField id="glory_custom_header_scripts" label="Scripts Personalizados (Header)" type="textarea" value={options.glory_custom_header_scripts || ''} onChange={value => onUpdate('glory_custom_header_scripts', value)} description="Scripts adicionales para el <head> (ej: Facebook Pixel, otros codigos de verificacion)." placeholder="<script>...</script>" rows={4} />
            </div>
        </div>
    );
}
