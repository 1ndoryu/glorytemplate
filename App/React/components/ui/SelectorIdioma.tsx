/* [183A-111] SelectorIdioma — Cambia el idioma activo (es/en/ja).
 * variante='compacto': botones con bandera. variante='completo': bandera + nombre.
 * variante='select': SelectorMenu de Kamples (custom dropdown). [193A-54]
 * Gotcha: variante='select' requiere SelectorMenu con opciones de texto sin banderas.
 * El select nativo HTML fue reemplazado por SelectorMenu en 193A-54. */
import { useIdiomaStore, type Idioma } from '@app/utils/i18n';
import { BotonBase } from '@app/components/ui/BotonBase';
import { SelectorMenu } from '@app/components/ui/SelectorMenu';
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

    /* [193A-54] Variante select: SelectorMenu de Kamples (sin banderas, solo texto) */
    if (variante === 'select') {
        const opciones = IDIOMAS.map(({ id, nombre }) => ({ valor: id, etiqueta: nombre }));
        return (
            <SelectorMenu
                opciones={opciones}
                valor={idioma}
                onChange={v => setIdioma(v as Idioma)}
                compacto
                className={`selectorIdiomaMenu${className ? ` ${className}` : ''}`}
            />
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
