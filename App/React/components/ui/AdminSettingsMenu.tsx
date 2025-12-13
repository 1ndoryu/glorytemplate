// Submenu de configuracion para admins
// Solo visible para usuarios con permisos de administrador

import {useRef, useEffect} from 'react';
import {Sparkles, Cog} from 'lucide-react';

interface AdminSettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminSettingsMenu({isOpen, onClose}: AdminSettingsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={menuRef} className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-bg-surface)] border border-[var(--color-border-primary)] rounded-lg shadow-lg overflow-hidden z-50">
            <a href="/panel-ia" className="flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-[var(--color-bg-secondary)] transition-colors">
                <Sparkles size={18} className="text-[var(--color-accent-primary)]" />
                <span>IA Contenido</span>
            </a>
            <a href="/configuracion" className="flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-[var(--color-bg-secondary)] transition-colors border-t border-[var(--color-border-primary)]">
                <Cog size={18} className="text-muted" />
                <span>Configuracion</span>
            </a>
        </div>
    );
}
