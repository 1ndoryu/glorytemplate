/*
 * CampoUrgencia
 * Selector de urgencia reutilizable
 * Diferencia entre urgencia (temporalidad) y prioridad (importancia)
 *
 * Valores:
 * - bloqueante: Debe hacerse SÍ o SÍ (rojo)
 * - urgente: Debe hacerse pronto (naranja)
 * - normal: Default (sin badge, oculto por defecto)
 * - chill: Sin presión temporal (verde/gris)
 */

import type {NivelUrgencia} from '../../types/dashboard';
import {SeccionPanel} from './SeccionPanel';
import {SelectorNivel} from './SelectorNivel';

interface CampoUrgenciaProps {
    valor: NivelUrgencia | null;
    onChange: (valor: NivelUrgencia | null) => void;
    permitirNulo?: boolean;
    disabled?: boolean;
    titulo?: string;
}

const URGENCIAS: NivelUrgencia[] = ['bloqueante', 'urgente', 'normal', 'chill'];

export function CampoUrgencia({valor, onChange, permitirNulo = true, disabled = false, titulo = 'Urgencia'}: CampoUrgenciaProps): JSX.Element {
    const manejarSeleccion = (nivel: NivelUrgencia) => {
        if (permitirNulo && valor === nivel) {
            onChange(null);
        } else {
            onChange(nivel);
        }
    };

    return (
        <SeccionPanel titulo={titulo}>
            <SelectorNivel<NivelUrgencia> niveles={URGENCIAS} seleccionado={valor} onSeleccionar={manejarSeleccion} disabled={disabled} />
        </SeccionPanel>
    );
}
