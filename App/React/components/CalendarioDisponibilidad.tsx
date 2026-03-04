/**
 * CalendarioDisponibilidad — Calendario interactivo que muestra días disponibles/ocupados.
 * Verde = disponible, Gris = ocupado, Tachado = pasado.
 */

import { useEffect, useState, useCallback } from 'react';
import { useDisponibilidad } from '@app/hooks/useDisponibilidad';
import type { CalendarioDia } from '@app/types/cresta';

interface CalendarioDisponibilidadProps {
    vehiculoId: number;
    onSelectRange?: (inicio: string, fin: string) => void;
    className?: string;
}

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

export function CalendarioDisponibilidad({
    vehiculoId,
    onSelectRange,
    className = '',
}: CalendarioDisponibilidadProps): JSX.Element {
    const ahora = new Date();
    const [mes, setMes] = useState(ahora.getMonth() + 1);
    const [anio, setAnio] = useState(ahora.getFullYear());
    const [seleccionInicio, setSeleccionInicio] = useState<string | null>(null);
    const [seleccionFin, setSeleccionFin] = useState<string | null>(null);

    const { calendario, calendarioLoading, cargarCalendario } = useDisponibilidad(vehiculoId);

    useEffect(() => {
        cargarCalendario(mes, anio);
    }, [mes, anio, cargarCalendario]);

    const mesAnterior = useCallback(() => {
        if (mes === 1) {
            setMes(12);
            setAnio(a => a - 1);
        } else {
            setMes(m => m - 1);
        }
    }, [mes]);

    const mesSiguiente = useCallback(() => {
        if (mes === 12) {
            setMes(1);
            setAnio(a => a + 1);
        } else {
            setMes(m => m + 1);
        }
    }, [mes]);

    const esPasado = (mesActual: number, anioActual: number): boolean => {
        const hoy = new Date();
        return anioActual < hoy.getFullYear() ||
            (anioActual === hoy.getFullYear() && mesActual < hoy.getMonth() + 1);
    };

    const handleDiaClick = useCallback((dia: CalendarioDia) => {
        if (!dia.disponible || dia.pasado) return;

        const fecha = `${anio}-${pad(mes)}-${pad(dia.dia)}`;

        if (!seleccionInicio || seleccionFin) {
            setSeleccionInicio(fecha);
            setSeleccionFin(null);
        } else {
            if (fecha <= seleccionInicio) {
                setSeleccionInicio(fecha);
            } else {
                setSeleccionFin(fecha);
                if (onSelectRange) onSelectRange(seleccionInicio, fecha);
            }
        }
    }, [anio, mes, seleccionInicio, seleccionFin, onSelectRange]);

    const estaSeleccionado = (dia: number): 'inicio' | 'fin' | 'rango' | null => {
        const fecha = `${anio}-${pad(mes)}-${pad(dia)}`;
        if (fecha === seleccionInicio) return 'inicio';
        if (fecha === seleccionFin) return 'fin';
        if (seleccionInicio && seleccionFin && fecha > seleccionInicio && fecha < seleccionFin) return 'rango';
        return null;
    };

    // Calcular offset del primer día del mes (lunes = 0)
    const primerDia = new Date(anio, mes - 1, 1).getDay();
    const offset = primerDia === 0 ? 6 : primerDia - 1;

    return (
        <div className={`calendario ${className}`}>
            {/* Header */}
            <div className="calendarioHeader">
                <button
                    onClick={mesAnterior}
                    disabled={esPasado(mes - 1, mes === 1 ? anio - 1 : anio)}
                    className="calendarioFlecha"
                    aria-label="Mes anterior"
                >
                    ◀
                </button>
                <h3 className="calendarioMes">
                    {MESES[mes - 1]} {anio}
                </h3>
                <button
                    onClick={mesSiguiente}
                    className="calendarioFlecha"
                    aria-label="Mes siguiente"
                >
                    ▶
                </button>
            </div>

            {/* Días de la semana */}
            <div className="calendarioSemana">
                {DIAS_SEMANA.map(d => (
                    <div key={d} className="calendarioSemanaLabel">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid de días */}
            {calendarioLoading ? (
                <div className="cargando">
                    <div className="cargandoSpinner" />
                </div>
            ) : (
                <div className="calendarioDias">
                    {/* Espacios vacíos antes del primer día */}
                    {Array.from({ length: offset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {/* Días del mes */}
                    {calendario.map((dia) => {
                        const sel = estaSeleccionado(dia.dia);
                        const disponible = dia.disponible && !dia.pasado;

                        let claseDia = 'calendarioDia';
                        if (dia.pasado) claseDia += ' calendarioDiaPasado';
                        else if (!dia.disponible) claseDia += ' calendarioDiaOcupado';
                        else if (sel === 'inicio' || sel === 'fin') claseDia += ' calendarioDiaSelInicio';
                        else if (sel === 'rango') claseDia += ' calendarioDiaSelRango';
                        else claseDia += ' calendarioDiaDisponible';

                        return (
                            <button
                                key={dia.dia}
                                onClick={() => handleDiaClick(dia)}
                                disabled={!disponible}
                                className={claseDia}
                            >
                                {dia.dia}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Leyenda */}
            <div className="calendarioLeyenda">
                <span className="calendarioLeyendaItem">
                    <span className="calendarioLeyendaColor calendarioLeyendaDisponible" /> Disponible
                </span>
                <span className="calendarioLeyendaItem">
                    <span className="calendarioLeyendaColor calendarioLeyendaOcupado" /> Ocupado
                </span>
            </div>
        </div>
    );
}
