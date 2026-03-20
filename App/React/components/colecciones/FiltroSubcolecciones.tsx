/*
 * FiltroSubcolecciones — Badges filtrables para subcolecciones.
 *
 * Muestra una fila de badges (estilo feedTags) para las subcolecciones
 * de una colección padre. Al clicar uno, filtra el FeedSamples
 * para mostrar solo los samples de esa subcolección.
 *
 * Props:
 *   subcolecciones: ColeccionResumen[] — lista de subs del padre
 *   activa: number | null — id de la sub seleccionada (null = "Todos")
 *   onChange: (id | null) => void — callback al seleccionar/deseleccionar
 */

import { Badge } from '@app/components/ui/Badge';
import type { ColeccionResumen } from '@app/types';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/filtroSubcolecciones.css';

export interface FiltroSubcoleccionesProps {
    subcolecciones: ColeccionResumen[];
    activa: number | null;
    onChange: (subId: number | null) => void;
}

export const FiltroSubcolecciones = ({
    subcolecciones,
    activa,
    onChange,
}: FiltroSubcoleccionesProps): JSX.Element | null => {
    const { t } = useT();
    if (subcolecciones.length === 0) return null;

    return (
        <div className="filtroSubcolecciones">
            {/* Badge "Todos" — deselecciona cualquier sub activa */}
            <Badge
                variante={activa === null ? 'acento' : 'neutro'}
                estilo={activa === null ? 'relleno' : 'borde'}
                tamano="sm"
                interactivo
                onClick={() => onChange(null)}
            >
                {t('comun.todos')}
            </Badge>

            {subcolecciones.map(sub => (
                <Badge
                    key={sub.id}
                    variante={activa === sub.id ? 'acento' : 'neutro'}
                    estilo={activa === sub.id ? 'relleno' : 'borde'}
                    tamano="sm"
                    interactivo
                    onClick={() => onChange(activa === sub.id ? null : sub.id)}
                >
                    {sub.nombre} ({sub.totalSamples})
                </Badge>
            ))}
        </div>
    );
};

export default FiltroSubcolecciones;
