import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface MenuContextualProps {
    abierto: boolean;
    onAbiertoChange: (abierto: boolean) => void;
    trigger: ReactNode;
    children: ReactNode;
    className?: string;
    panelClassName?: string;
    role?: string;
}

export function MenuContextual({
    abierto,
    onAbiertoChange,
    trigger,
    children,
    className,
    panelClassName,
    role = 'menu',
}: MenuContextualProps): JSX.Element {
    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!abierto) {
            return;
        }

        const handleClickFuera = (event: MouseEvent): void => {
            if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
                onAbiertoChange(false);
            }
        };

        const handleEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onAbiertoChange(false);
            }
        };

        document.addEventListener('mousedown', handleClickFuera);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickFuera);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [abierto, onAbiertoChange]);

    return (
        <div className={className} ref={contenedorRef}>
            {trigger}
            {abierto ? (
                <div className={panelClassName} role={role}>
                    {children}
                </div>
            ) : null}
        </div>
    );
}
