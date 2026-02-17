/*
 * CursorReproduccion — Línea vertical que muestra la posición actual
 * Se mueve suavemente durante la reproducción, clickeable para seek
 */

import { useMezcladorStore } from '../stores/mezcladorStore';
import { segundosACompases } from '../utils/compasUtils';

export const CursorReproduccion = (): JSX.Element => {
    const tiempoActual = useMezcladorStore(s => s.tiempoActual);
    const bpmProyecto = useMezcladorStore(s => s.bpmProyecto);
    const compasProyecto = useMezcladorStore(s => s.compasProyecto);
    const totalCompases = useMezcladorStore(s => s.totalCompases);

    const posicionCompases = segundosACompases(tiempoActual, bpmProyecto, compasProyecto);
    const porcentaje = (posicionCompases / totalCompases) * 100;
    const visible = porcentaje >= 0 && porcentaje <= 100;

    if (!visible) return <></>;

    return (
        <div
            className="mezcladorCursorReproduccion"
            style={{ left: `${porcentaje}%` }}
        >
            <div className="mezcladorCursorLinea" />
            <div className="mezcladorCursorCabeza" />
        </div>
    );
};
