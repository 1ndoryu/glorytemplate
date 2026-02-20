/**
 * useCalendarioNavegacion
 * 
 * Navegación entre semanas del calendario.
 * Responsabilidad única: cambiar la semana activa.
 */

import {useCallback} from 'react';
import {getLunesDeSemana} from '../../constants';

interface Props {
    setSemanaActual: React.Dispatch<React.SetStateAction<Date>>;
}

export function useCalendarioNavegacion({setSemanaActual}: Props) {
    const irSemanaAnterior = useCallback(() => {
        setSemanaActual(prev => {
            const nueva = new Date(prev);
            nueva.setDate(nueva.getDate() - 7);
            return nueva;
        });
    }, [setSemanaActual]);

    const irSemanaSiguiente = useCallback(() => {
        setSemanaActual(prev => {
            const nueva = new Date(prev);
            nueva.setDate(nueva.getDate() + 7);
            return nueva;
        });
    }, [setSemanaActual]);

    const irASemana = useCallback((fecha: Date) => {
        setSemanaActual(getLunesDeSemana(fecha));
    }, [setSemanaActual]);

    const irASemanaActual = useCallback(() => {
        setSemanaActual(getLunesDeSemana(new Date()));
    }, [setSemanaActual]);

    return {irSemanaAnterior, irSemanaSiguiente, irASemana, irASemanaActual};
}
