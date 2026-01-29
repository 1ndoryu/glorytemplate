/**
 * NavegadorSemana
 *
 * Controles de navegación entre semanas del calendario.
 * Incluye flechas prev/next y botón "Hoy".
 */

import {IconoFlechaIzquierda, IconoFlechaDerecha} from '../icons';
import {formatearFechaCorta} from '../../constants';

interface NavegadorSemanaProps {
    semanaActual: Date;
    fechasSemana: Date[];
    onSemanaAnterior: () => void;
    onSemanaSiguiente: () => void;
    onIrHoy: () => void;
    esSemanaActual: boolean;
}

export function NavegadorSemana({semanaActual, fechasSemana, onSemanaAnterior, onSemanaSiguiente, onIrHoy, esSemanaActual}: NavegadorSemanaProps) {
    const primerDia = fechasSemana[0];
    const ultimoDia = fechasSemana[fechasSemana.length - 1];

    /* Formato: "13 Ene - 17 Ene" */
    const rangoFechas = `${formatearFechaCorta(primerDia)} - ${formatearFechaCorta(ultimoDia)}`;

    /* Obtener número de semana del año */
    const getNumeroSemana = (fecha: Date): number => {
        const primerDiaAnio = new Date(fecha.getFullYear(), 0, 1);
        const dias = Math.floor((fecha.getTime() - primerDiaAnio.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((dias + primerDiaAnio.getDay() + 1) / 7);
    };

    return (
        <div className="capNavegadorSemana">
            <button className="capNavegadorSemana__boton" onClick={onSemanaAnterior} title="Semana anterior" aria-label="Semana anterior">
                <IconoFlechaIzquierda size={18} />
            </button>

            <div className="capCalendario__semanaInfo" style={{minWidth: '220px', textAlign: 'center'}}>
                <span className="capCalendario__semanaLabel">Semana {getNumeroSemana(semanaActual)}</span>
                <span className="capCalendario__semanaFechas">{rangoFechas}</span>
            </div>

            <button className="capNavegadorSemana__boton" onClick={onSemanaSiguiente} title="Siguiente semana" aria-label="Siguiente semana">
                <IconoFlechaDerecha size={18} />
            </button>

            {!esSemanaActual && (
                <button className="capNavegadorSemana__hoy" onClick={onIrHoy}>
                    Hoy
                </button>
            )}

            {esSemanaActual && (
                <div className="capIndicadorSemana">
                    <span className="capIndicadorSemana__punto" />
                    Semana actual
                </div>
            )}
        </div>
    );
}

export default NavegadorSemana;
