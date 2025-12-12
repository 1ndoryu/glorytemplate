/**
 * SocialTab - Configuracion de perfiles sociales
 *
 * Permite configurar:
 * - LinkedIn
 * - Twitter/X
 * - YouTube
 * - Instagram
 */

import {Share2, Linkedin, Twitter, Youtube, Instagram} from 'lucide-react';
import {SettingsField} from './SettingsField';

interface SocialTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
}

export function SocialTab({options, onUpdate}: SocialTabProps): JSX.Element {
    return (
        <div id="settings-social-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <Share2 className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Perfiles Sociales</h2>
                    <p className="settings-tab-description">Agrega los enlaces a tus perfiles en redes sociales. Apareceran en el footer y en los schemas SEO.</p>
                </div>
            </header>

            <div className="settings-fields-grid">
                <SettingsField id="glory_social_linkedin" label="LinkedIn" type="text" inputType="url" value={options.glory_social_linkedin || ''} onChange={(value: string) => onUpdate('glory_social_linkedin', value)} description="URL completa de tu perfil de LinkedIn." placeholder="https://linkedin.com/in/tu-usuario" icon={<Linkedin className="settings-field-icon" />} />

                <SettingsField id="glory_social_twitter" label="Twitter / X" type="text" inputType="url" value={options.glory_social_twitter || ''} onChange={(value: string) => onUpdate('glory_social_twitter', value)} description="URL completa de tu perfil en X (antes Twitter)." placeholder="https://x.com/tu-usuario" icon={<Twitter className="settings-field-icon" />} />

                <SettingsField id="glory_social_youtube" label="YouTube" type="text" inputType="url" value={options.glory_social_youtube || ''} onChange={(value: string) => onUpdate('glory_social_youtube', value)} description="URL de tu canal de YouTube." placeholder="https://youtube.com/@tu-canal" icon={<Youtube className="settings-field-icon" />} />

                <SettingsField id="glory_social_instagram" label="Instagram" type="text" inputType="url" value={options.glory_social_instagram || ''} onChange={(value: string) => onUpdate('glory_social_instagram', value)} description="URL de tu perfil de Instagram." placeholder="https://instagram.com/tu-usuario" icon={<Instagram className="settings-field-icon" />} />
            </div>
        </div>
    );
}
