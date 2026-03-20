/* [183A-111] SelectorIdioma — Cambia el idioma activo (es/en/ja).
 * variante='compacto': botones con bandera. variante='completo': bandera + nombre.
 * variante='select': select nativo pill sin bandera (para la landing). [193A-52] */
import { useIdiomaStore, type Idioma } from '@app/utils/i18n';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/selectorIdioma.css';

interface SelectorIdiomaProps {
    variante?: 'compacto' | 'completo' | 'select';
    className?: string;
}

const IDIOMAS: Array<{ id: Idioma; bandera: string; etiqueta: string; ariaLabel: string; nombre: string }> = [
    { id: 'es', bandera: '🇪🇸', etiqueta: 'ES', ariaLabel: 'Español', nombre: 'Español' },
    { id: 'en', bandera: '🇺🇸', etiqueta: 'EN', ariaLabel: 'English', nombre: 'English' },
    { id: 'ja', bandera: '🇯🇵', etiqueta: '日本語', ariaLabel: '日本語', nombre: '日本語' },
];

export const SelectorIdioma = ({ variante = 'compacto', className = '' }: SelectorIdiomaProps): JSX.Element => {
    const idioma = useIdiomaStore(s => s.idioma);
    const setIdioma = useIdiomaStore(s => s.setIdioma);
    const { t } = useT();

    /* [193A-52] Variante select: pill nativo sin banderas */
    if (variante === 'select') {
        return (
            /* sentinel-disable-next-line html-nativo-en-vez-de-componente — SelectorIdioma ES el componente base para el select de idioma */
            <select
                className={`selectorIdiomaPill${className ? ` ${className}` : ''}`}
                value={idioma}
                onChange={e => setIdioma(e.target.value as Idioma)}
                aria-label={t('idioma.seleccionar')}
            >
                {IDIOMAS.map(({ id, nombre }) => (
                    <option key={id} value={id}>{nombre}</option>
                ))}
            </select>
        );
    }

    return (
        <div
            className={`selectorIdioma selectorIdioma--${variante}${className ? ` ${className}` : ''}`}
            role="group"
            aria-label={t('idioma.seleccionar')}
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
