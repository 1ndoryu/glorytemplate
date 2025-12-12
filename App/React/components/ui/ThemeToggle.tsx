import {Palette} from 'lucide-react';
import {ThemeName, themeLabels} from '../../hooks/useTheme';

interface ThemeToggleProps {
    theme: ThemeName;
    onToggle: () => void;
}

/**
 * Boton flotante para alternar entre temas.
 *
 * Este componente es temporal para pruebas de estilo.
 * Se posiciona fijo en la esquina inferior derecha.
 */
export function ThemeToggle({theme, onToggle}: ThemeToggleProps) {
    return (
        <button onClick={onToggle} className={`fixed bottom-20 right-4 flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-all hover:scale-110 z-[9999] text-white border border-white/20 ${theme === 'project' ? 'bg-blue-600' : 'bg-[var(--color-accent-primary)]'}`} title={`Tema actual: ${themeLabels[theme]}. Clic para cambiar.`}>
            <Palette className="w-4 h-4" />
        </button>
    );
}
