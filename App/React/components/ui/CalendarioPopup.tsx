/**
 * CalendarioPopup — Cuadrícula de calendario personalizada.
 * Renderiza el mes actual con navegación prev/next.
 * Sin estilos inline, todo en componentes.css.
 */

import { useState } from 'react';
import { Boton } from './Boton';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

interface CalendarioPopupProps {
    fechaSeleccionada: string;
    fechaMin?: string;
    fechaMax?: string;
    onChange: (fecha: string) => void;
}

function parsearFecha(yyyyMmDd: string): Date {
    return new Date(yyyyMmDd + 'T12:00:00');
}

function construirFechaStr(year: number, mes: number, dia: number): string {
    return `${year}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function CalendarioPopup({
    fechaSeleccionada,
    fechaMin,
    fechaMax,
    onChange,
}: CalendarioPopupProps): JSX.Element {
    const hoy = new Date();

    const mesInicial = fechaSeleccionada
        ? parsearFecha(fechaSeleccionada).getMonth()
        : hoy.getMonth();
    const yearInicial = fechaSeleccionada
        ? parsearFecha(fechaSeleccionada).getFullYear()
        : hoy.getFullYear();

    const [year, setYear] = useState(yearInicial);
    const [mes, setMes] = useState(mesInicial);

    const fechaMinDate = fechaMin ? parsearFecha(fechaMin) : null;
    const fechaMaxDate = fechaMax ? parsearFecha(fechaMax) : null;

    /* Generar celdas del mes — offset lunes=0 */
    const primerDia = new Date(year, mes, 1);
    const totalDias = new Date(year, mes + 1, 0).getDate();
    const offsetInicio = (primerDia.getDay() + 6) % 7;

    const celdas: (number | null)[] = [];
    for (let i = 0; i < offsetInicio; i++) celdas.push(null);
    for (let d = 1; d <= totalDias; d++) celdas.push(d);
    while (celdas.length % 7 !== 0) celdas.push(null);

    const irMesAnterior = () => {
        if (mes === 0) { setYear(y => y - 1); setMes(11); }
        else setMes(m => m - 1);
    };

    const irMesSiguiente = () => {
        if (mes === 11) { setYear(y => y + 1); setMes(0); }
        else setMes(m => m + 1);
    };

    const estaDeshabilitado = (dia: number): boolean => {
        const fecha = parsearFecha(construirFechaStr(year, mes, dia));
        if (fechaMinDate && fecha < fechaMinDate) return true;
        if (fechaMaxDate && fecha > fechaMaxDate) return true;
        return false;
    };

    const esSeleccionado = (dia: number): boolean =>
        !!fechaSeleccionada && construirFechaStr(year, mes, dia) === fechaSeleccionada;

    const esHoy = (dia: number): boolean =>
        year === hoy.getFullYear() && mes === hoy.getMonth() && dia === hoy.getDate();

    const obtenerClaseDia = (dia: number): string => {
        const clases = ['calendarioDia'];
        if (esSeleccionado(dia)) clases.push('calendarioDiaSeleccionado');
        else if (esHoy(dia)) clases.push('calendarioDiaHoy');
        if (estaDeshabilitado(dia)) clases.push('calendarioDiaDeshabilitado');
        return clases.join(' ');
    };

    return (
        <div className="calendarioPopup">
            <div className="calendarioNavegacion">
                <Boton
                    variante="icono"
                    claseExtra="calendarioNavBtn"
                    type="button"
                    onClick={irMesAnterior}
                    aria-label="Mes anterior"
                >
                    &#8249;
                </Boton>
                <span className="calendarioMesTitulo">
                    {MESES[mes]} {year}
                </span>
                <Boton
                    variante="icono"
                    claseExtra="calendarioNavBtn"
                    type="button"
                    onClick={irMesSiguiente}
                    aria-label="Mes siguiente"
                >
                    &#8250;
                </Boton>
            </div>

            <div className="calendarioGrilla">
                {DIAS_SEMANA.map(d => (
                    <span key={d} className="calendarioDiaSemana">{d}</span>
                ))}

                {celdas.map((dia, idx) => {
                    if (dia === null) {
                        return <span key={`v${idx}`} className="calendarioCeldaVacia" />;
                    }

                    return (
                        <Boton
                            key={dia}
                            variante="icono"
                            claseExtra={obtenerClaseDia(dia)}
                            type="button"
                            disabled={estaDeshabilitado(dia)}
                            onClick={() => onChange(construirFechaStr(year, mes, dia))}
                        >
                            {dia}
                        </Boton>
                    );
                })}
            </div>
        </div>
    );
}
