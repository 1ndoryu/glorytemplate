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
        <div className={`bg-white rounded-2xl shadow-md border border-gray-100 p-5 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={mesAnterior}
                    disabled={esPasado(mes - 1, mes === 1 ? anio - 1 : anio)}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    aria-label="Mes anterior"
                >
                    ◀
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                    {MESES[mes - 1]} {anio}
                </h3>
                <button
                    onClick={mesSiguiente}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Mes siguiente"
                >
                    ▶
                </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid de días */}
            {calendarioLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {/* Espacios vacíos antes del primer día */}
                    {Array.from({ length: offset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {/* Días del mes */}
                    {calendario.map((dia) => {
                        const sel = estaSeleccionado(dia.dia);
                        const disponible = dia.disponible && !dia.pasado;

                        return (
                            <button
                                key={dia.dia}
                                onClick={() => handleDiaClick(dia)}
                                disabled={!disponible}
                                className={`
                                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                    ${dia.pasado ? 'text-gray-300 cursor-not-allowed' : ''}
                                    ${!dia.disponible && !dia.pasado ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through' : ''}
                                    ${disponible && !sel ? 'text-gray-700 hover:bg-green-50 hover:text-green-700 cursor-pointer' : ''}
                                    ${sel === 'inicio' || sel === 'fin' ? 'bg-green-600 text-white shadow-md' : ''}
                                    ${sel === 'rango' ? 'bg-green-100 text-green-800' : ''}
                                `}
                            >
                                {dia.dia}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Leyenda */}
            <div className="flex gap-4 mt-4 text-xs text-gray-500 justify-center">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Disponible
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gray-200" /> Ocupado
                </span>
            </div>
        </div>
    );
}
