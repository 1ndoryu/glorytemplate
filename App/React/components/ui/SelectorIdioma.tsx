/* [183A-111] SelectorIdioma — Botones para cambiar el idioma (es/en/ja).
 * Variante 'compacto': solo bandera. Variante 'completo': bandera + nombre. */
import { useIdiomaStore, type Idioma } from '@app/utils/i18n';
import { BotonBase } from '@app/components/ui/BotonBase';
import '../../styles/componentes/selectorIdioma.css';

interface SelectorIdiomaProps {
    variante?: 'compacto' | 'completo';
    className?: string;
}

const IDIOMAS: Array<{ id: Idioma; bandera: string; etiqueta: string; ariaLabel: string }> = [
    { id: 'es', bandera: '🇪🇸', etiqueta: 'ES', ariaLabel: 'Español' },
    { id: 'en', bandera: '🇺🇸', etiqueta: 'EN', ariaLabel: 'English' },
    { id: 'ja', bandera: '🇯🇵', etiqueta: '日本語', ariaLabel: '日本語' },
];

export const SelectorIdioma = ({ variante = 'compacto', className = '' }: SelectorIdiomaProps): JSX.Element => {
    const idioma = useIdiomaStore(s => s.idioma);
    const setIdioma = useIdiomaStore(s => s.setIdioma);

    return (
        <div
            className={`selectorIdioma selectorIdioma--${variante}${className ? ` ${className}` : ''}`}
            role="group"
            aria-label="Seleccionar idioma"
        >
            {IDIOMAS.map(({ id, bandera, etiqueta, ariaLabel }) => (
                <BotonBase
                    key={id}
                    variante="ghost"
                    tamano="ninguno"
                    className={`selectorIdiomaBoton${idioma === id ? ' selectorIdiomaBoton--activo' : ''}`}
                    onClick={() => setIdioma(id)}
                    aria-label={ariaLabel}
                    aria-pressed={idioma === id}
                >
                    <span className="selectorIdiomaBandera" aria-hidden="true">{bandera}</span>
                    {variante === 'completo' && (
                        <span className="selectorIdiomaEtiqueta">{etiqueta}</span>
                    )}
                </BotonBase>
            ))}
        </div>
    );
};
