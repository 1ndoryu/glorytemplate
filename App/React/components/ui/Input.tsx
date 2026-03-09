import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    claseExtra?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className, claseExtra, ...rest },
    ref
): JSX.Element {
    const claseFinal = [className, claseExtra].filter(Boolean).join(' ');

    return <input ref={ref} className={claseFinal} {...rest} />;
});
