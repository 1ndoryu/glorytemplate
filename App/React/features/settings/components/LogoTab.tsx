/**
 * LogoTab - Configuracion del logo del sitio
 *
 * Permite configurar:
 * - Modo del logo (imagen o texto)
 * - Texto del logo (cuando modo = texto)
 * - Imagen del logo (cuando modo = imagen)
 */

import {ImageIcon, Type} from 'lucide-react';
import {ImageUploader} from './ImageUploader';
import {SettingsField} from './SettingsField';

interface LogoTabProps {
    options: Record<string, string>;
    onUpdate: (key: string, value: string) => void;
    onUpload: (file: File) => Promise<string>;
}

export function LogoTab({options, onUpdate, onUpload}: LogoTabProps): JSX.Element {
    const logoMode = options.glory_logo_mode || 'text';

    return (
        <div id="settings-logo-tab" className="settings-tab-content">
            <header className="settings-tab-header">
                <div className="settings-tab-icon">
                    <ImageIcon className="settings-icon" />
                </div>
                <div>
                    <h2 className="settings-tab-title">Logo del Sitio</h2>
                    <p className="settings-tab-description">Define como se muestra el logo en el header y footer del sitio.</p>
                </div>
            </header>

            <div className="settings-form">
                {/* Selector de modo */}
                <div className="settings-field-group">
                    <label className="settings-label">Tipo de Logo</label>
                    <div className="settings-logo-mode-selector">
                        <button type="button" className={`settings-logo-mode-option ${logoMode === 'text' ? 'active' : ''}`} onClick={() => onUpdate('glory_logo_mode', 'text')}>
                            <Type className="w-5 h-5" />
                            <span>Solo Texto</span>
                        </button>
                        <button type="button" className={`settings-logo-mode-option ${logoMode === 'image' ? 'active' : ''}`} onClick={() => onUpdate('glory_logo_mode', 'image')}>
                            <ImageIcon className="w-5 h-5" />
                            <span>Imagen</span>
                        </button>
                    </div>
                    <p className="settings-field-description">Elige si tu logo sera texto (nombre del sitio) o una imagen.</p>
                </div>

                {/* Campo condicional: Texto del logo */}
                {logoMode === 'text' && <SettingsField id="glory_logo_text" label="Texto del Logo" type="text" value={options.glory_logo_text || ''} onChange={value => onUpdate('glory_logo_text', value)} description="El texto que aparecera como logo. Si esta vacio, se usa el nombre del sitio." placeholder="Ej: Guillermo Garcia" />}

                {/* Campo condicional: Imagen del logo */}
                {logoMode === 'image' && (
                    <div className="settings-logo-image-section">
                        <ImageUploader id="glory_logo_image" label="Imagen del Logo" value={options.glory_logo_image || ''} onChange={url => onUpdate('glory_logo_image', url)} onUpload={onUpload} description="Sube tu logo en formato PNG o SVG con fondo transparente. Tamaño recomendado: 200x50px." aspectRatio="auto" />
                    </div>
                )}
            </div>
        </div>
    );
}
