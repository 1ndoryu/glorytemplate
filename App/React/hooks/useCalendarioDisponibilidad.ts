/**
 * useCalendarioDisponibilidad — Lógica del calendario interactivo de disponibilidad.
 *
 * Gestiona navegación de meses, selección de rango de fechas
 * y cálculo de offset para el grid de días.
 */

import { useEffect, useState, useCallback } from 'react';
import { useDisponibilidad } from '@app/hooks/useDisponibilidad';
import type { CalendarioDia } from '@app/types/cresta';

function pad(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

interface UseCalendarioDisponibilidadParams {
    vehiculoId: number;
    onSelectRange?: (inicio: string, fin: string) => void;
}

export function useCalendarioDisponibilidad({
    vehiculoId,
    onSelectRange,
}: UseCalendarioDisponibilidadParams) {
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

    const estaSeleccionado = useCallback((dia: number): 'inicio' | 'fin' | 'rango' | null => {
        const fecha = `${anio}-${pad(mes)}-${pad(dia)}`;
        if (fecha === seleccionInicio) return 'inicio';
        if (fecha === seleccionFin) return 'fin';
        if (seleccionInicio && seleccionFin && fecha > seleccionInicio && fecha < seleccionFin) return 'rango';
        return null;
    }, [anio, mes, seleccionInicio, seleccionFin]);

    /* Offset del primer día del mes (lunes = 0) */
    const primerDia = new Date(anio, mes - 1, 1).getDay();
    const offset = primerDia === 0 ? 6 : primerDia - 1;

    return {
        mes,
        anio,
        calendario,
        calendarioLoading,
        offset,
        mesAnterior,
        mesSiguiente,
        esPasado,
        handleDiaClick,
        estaSeleccionado,
    };
}
