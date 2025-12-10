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
        <button
            onClick={onToggle}
            className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
            style={{
                zIndex: 9999,
                backgroundColor: theme === 'project' ? '#2563EB' : 'var(--color-accent-primary)',
                color: '#ffffff',
                border: '2px solid var(--color-border-primary)'
            }}
            title={`Tema actual: ${themeLabels[theme]}. Clic para cambiar.`}>
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">{themeLabels[theme]}</span>
        </button>
    );
}
