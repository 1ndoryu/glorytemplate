/**
 * CalendarioDisponibilidad — Calendario interactivo que muestra días disponibles/ocupados.
 * Verde = disponible, Gris = ocupado, Tachado = pasado.
 * Toda la lógica en useCalendarioDisponibilidad.
 */

import { useCalendarioDisponibilidad } from '@app/hooks/useCalendarioDisponibilidad';
import { Boton } from '@app/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export function CalendarioDisponibilidad({
    vehiculoId,
    onSelectRange,
    className = '',
}: CalendarioDisponibilidadProps): JSX.Element {
    const {
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
    } = useCalendarioDisponibilidad({ vehiculoId, onSelectRange });

    return (
        <div className={`calendario ${className}`}>
            {/* Header */}
            <div className="calendarioHeader">
                <Boton
                    variante="icono"
                    onClick={mesAnterior}
                    disabled={esPasado(mes - 1, mes === 1 ? anio - 1 : anio)}
                    className="calendarioFlecha"
                    aria-label="Mes anterior"
                >
                    <ChevronLeft size={20} />
                </Boton>
                <h3 className="calendarioMes">
                    {MESES[mes - 1]} {anio}
                </h3>
                <Boton
                    variante="icono"
                    onClick={mesSiguiente}
                    className="calendarioFlecha"
                    aria-label="Mes siguiente"
                >
                    <ChevronRight size={20} />
                </Boton>
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
                            <Boton
                                key={dia.dia}
                                variante="icono"
                                onClick={() => handleDiaClick(dia)}
                                disabled={!disponible}
                                className={claseDia}
                            >
                                {dia.dia}
                            </Boton>
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
