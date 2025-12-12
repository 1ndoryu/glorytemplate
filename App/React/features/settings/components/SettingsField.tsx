/**
 * SettingsField - Campo de formulario reutilizable
 *
 * Componente base para todos los campos del panel de configuracion.
 * Soporta tipos: text, textarea
 */

import {ReactNode} from 'react';

interface SettingsFieldProps {
    id: string;
    label: string;
    type: 'text' | 'textarea';
    value: string;
    onChange: (value: string) => void;
    description?: string;
    placeholder?: string;
    inputType?: 'text' | 'email' | 'url' | 'tel';
    icon?: ReactNode;
    rows?: number;
    required?: boolean;
    error?: string;
}

export function SettingsField({id, label, type, value, onChange, description, placeholder, inputType = 'text', icon, rows = 3, required = false, error}: SettingsFieldProps): JSX.Element {
    const inputId = `settings-field-${id}`;
    const hasError = Boolean(error);

    return (
        <div className={`settings-field ${hasError ? 'settings-field--error' : ''}`}>
            <label htmlFor={inputId} className="settings-field-label">
                {icon && <span className="settings-field-label-icon">{icon}</span>}
                <span>{label}</span>
                {required && <span className="settings-field-required">*</span>}
            </label>

            {type === 'textarea' ? <textarea id={inputId} className="settings-field-input settings-field-textarea" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} required={required} /> : <input id={inputId} type={inputType} className="settings-field-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} />}

            {description && !hasError && <p className="settings-field-description">{description}</p>}

            {hasError && <p className="settings-field-error">{error}</p>}
        </div>
    );
}
