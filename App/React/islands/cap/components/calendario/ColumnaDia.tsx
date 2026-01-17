/**
 * ColumnaDia
 *
 * Columna del calendario que representa un día de la semana.
 * Contiene las tarjetas de clases programadas para ese día.
 */

import type {Clase, DiaSemana} from '../../types';
import {DIAS_LABELS} from '../../constants';
import {TarjetaClase} from './TarjetaClase';

interface ColumnaDiaProps {
    dia: DiaSemana;
    fecha: Date;
    clases: Clase[];
    esHoy: boolean;
    onToggleBloqueo: (claseId: number) => void;
    onClaseClick?: (clase: Clase) => void;
}

export function ColumnaDia({dia, fecha, clases, esHoy, onToggleBloqueo, onClaseClick}: ColumnaDiaProps) {
    const diaNumero = fecha.getDate();

    return (
        <div className={`capColumnaDia ${esHoy ? 'capColumnaDia--hoy' : ''}`}>
            <div className="capColumnaDia__header">
                <span className="capColumnaDia__nombre">{DIAS_LABELS[dia]}</span>
                <span className="capColumnaDia__fecha">{diaNumero}</span>
            </div>

            <div className="capColumnaDia__slots">
                {clases.length === 0 ? (
                    <div className="capColumnaDia__vacia">
                        <span>Sin clases</span>
                    </div>
                ) : (
                    clases.map(clase => <TarjetaClase key={clase.id} clase={clase} onToggleBloqueo={onToggleBloqueo} onClick={onClaseClick} />)
                )}
            </div>
        </div>
    );
}

export default ColumnaDia;
