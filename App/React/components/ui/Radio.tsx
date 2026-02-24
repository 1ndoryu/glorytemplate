import { type InputHTMLAttributes, forwardRef } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ className = '', label, ...props }, ref) => {
        return (
            <label className={`editarCheckbox ${className}`}>
                <input
                    type="radio"
                    ref={ref}
                    {...props}
                />
                {label && <span>{label}</span>}
            </label>
        );
    }
);

Radio.displayName = 'Radio';
