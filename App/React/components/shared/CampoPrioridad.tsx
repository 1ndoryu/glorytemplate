/*
 * CampoPrioridad
 * Selector de prioridad/importancia reutilizable
 * Wrapper de SelectorNivel con configuracion predefinida
 */

import type {NivelPrioridad, NivelImportancia} from '../../types/dashboard';
import {SeccionPanel} from './SeccionPanel';
import {SelectorNivel} from './SelectorNivel';

type TipoCampo = 'prioridad' | 'importancia';

interface CampoPrioridadProps<T extends NivelPrioridad | NivelImportancia> {
    tipo?: TipoCampo;
    valor: T | null;
    onChange: (valor: T | null) => void;
    permitirNulo?: boolean;
    disabled?: boolean;
    titulo?: string;
}

const PRIORIDADES: NivelPrioridad[] = ['alta', 'media', 'baja'];
const IMPORTANCIAS: NivelImportancia[] = ['Alta', 'Media', 'Baja'];

export function CampoPrioridad<T extends NivelPrioridad | NivelImportancia>({tipo = 'prioridad', valor, onChange, permitirNulo = true, disabled = false, titulo}: CampoPrioridadProps<T>): JSX.Element {
    const niveles = (tipo === 'prioridad' ? PRIORIDADES : IMPORTANCIAS) as T[];
    const tituloFinal = titulo || (tipo === 'prioridad' ? 'Prioridad' : 'Importancia');

    const manejarSeleccion = (nivel: T) => {
        if (permitirNulo && valor === nivel) {
            onChange(null);
        } else {
            onChange(nivel);
        }
    };

    return (
        <SeccionPanel titulo={tituloFinal}>
            <SelectorNivel<T> niveles={niveles} seleccionado={valor} onSeleccionar={manejarSeleccion} disabled={disabled} />
        </SeccionPanel>
    );
}
