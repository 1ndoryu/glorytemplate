/*
 * ToggleSwitch
 * Componente reutilizable para interruptor boolean (on/off)
 */

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
    disabled?: boolean;
}

export function ToggleSwitch({checked, onChange, className = '', disabled = false}: ToggleSwitchProps): JSX.Element {
    return (
        <label className={`toggleSwitch ${className}`}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
            <span className="toggleSlider" />
        </label>
    );
}

export type {ToggleSwitchProps};
