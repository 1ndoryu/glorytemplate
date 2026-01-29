/**
 * ColumnaDia
 *
 * Columna del calendario que representa un día de la semana.
 * Contiene las tarjetas de clases programadas para ese día.
 * Ahora soporta drag & drop con @dnd-kit.
 */

import type {Clase, DiaSemana} from '../../types';
import {DIAS_LABELS, CALENDARIO_CONFIG} from '../../constants/cap-constants';
import {TarjetaClaseDraggable} from './TarjetaClaseDraggable';
import {ZonaDropDia} from './ZonaDropDia';

interface ColumnaDiaProps {
    dia: DiaSemana;
    fecha: Date;
    clases: Clase[];
    esHoy: boolean;
    onToggleBloqueo: (claseId: number) => void;
    onClaseClick?: (clase: Clase) => void;
    dndActivo?: boolean;
}

export function ColumnaDia({dia, fecha, clases, esHoy, onToggleBloqueo, onClaseClick, dndActivo = false}: ColumnaDiaProps) {
    const diaNumero = fecha.getDate();

    const calcularEstiloClase = (clase: Clase, indice: number): React.CSSProperties => {
        const [horas, minutos] = clase.horaInicio.split(':').map(Number);
        const [horasFin, minutosFin] = clase.horaFin.split(':').map(Number);

        const minutosDesdeInicio = horas * 60 + minutos - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
        const duracionMinutos = horasFin * 60 + minutosFin - (horas * 60 + minutos);

        /* Evitar valores negativos */
        const top = Math.max(0, minutosDesdeInicio * CALENDARIO_CONFIG.PIXELS_POR_MINUTO);
        // Restamos 2px a la altura para generar un pequeño espacio visual entre clases consecutivas
        const height = Math.max(CALENDARIO_CONFIG.ALTO_MINIMO_CLASE, duracionMinutos * CALENDARIO_CONFIG.PIXELS_POR_MINUTO - 2);

        /* Calcular z-index y width para solapamientos simples (mejora futura: algoritmo de columnas) */
        // Por ahora, si hay solapamiento exacto, desplazamos un poco o usamos z-index

        return {
            position: 'absolute',
            top: `${top}px`,
            height: `${height}px`,
            width: '94%', // Dejar espacio lateral
            left: '3%',
            zIndex: 10 + indice // Asegurar que se puedan ver/cliquear
        };
    };

    return (
        <div className={`capColumnaDia ${esHoy ? 'capColumnaDia--hoy' : ''}`}>
            <div className="capColumnaDia__header">
                <span className="capColumnaDia__nombre">{DIAS_LABELS[dia]}</span>
                <span className="capColumnaDia__fecha">{diaNumero}</span>
            </div>

            <ZonaDropDia dia={dia} fecha={fecha} esActivo={dndActivo}>
                {/* Contenedor relativo con altura fija para 15 horas (08:00 - 23:00) = 900 min * 1.5px = 1350px */}
                <div className="capColumnaDia__slots" style={{position: 'relative', height: '1350px'}}>
                    {clases.map((clase, indice) => (
                        <TarjetaClaseDraggable key={clase.id} clase={clase} onToggleBloqueo={onToggleBloqueo} onClick={onClaseClick} style={calcularEstiloClase(clase, indice)} />
                    ))}
                    {clases.length === 0 && (
                        <div className="capColumnaDia__vacia" style={{position: 'absolute', top: 0, width: '100%', textAlign: 'center', paddingTop: '20px'}}>
                            <span>Sin clases</span>
                        </div>
                    )}
                </div>
            </ZonaDropDia>
        </div>
    );
}

export default ColumnaDia;
