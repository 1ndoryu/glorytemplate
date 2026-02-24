import { type InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = '', label, ...props }, ref) => {
        return (
            <label className={`editarCheckbox ${className}`}>
                <input
                    type="checkbox"
                    ref={ref}
                    {...props}
                />
                {label && <span>{label}</span>}
            </label>
        );
    }
);

Checkbox.displayName = 'Checkbox';
