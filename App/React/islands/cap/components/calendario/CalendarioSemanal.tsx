/**
 * CalendarioSemanal
 *
 * Vista principal del calendario CAP.
 * Grid de 5 columnas (Lunes-Viernes) con navegación entre semanas.
 */

import {useMemo} from 'react';
import type {Clase, DiaSemana} from '../../types';
import {DIAS_SEMANA, SLOTS_HORARIOS, getLunesDeSemana} from '../../constants';
import {NavegadorSemana} from './NavegadorSemana';
import {BarraAcciones} from './BarraAcciones';
import {ColumnaDia} from './ColumnaDia';
import {Spinner} from '../ui';
import {IconoCalendario} from '../icons';

interface CalendarioSemanalProps {
    clases: Clase[];
    semanaActual: Date;
    fechasSemana: Date[];
    cargando: boolean;
    generando: boolean;
    onSemanaAnterior: () => void;
    onSemanaSiguiente: () => void;
    onIrHoy: () => void;
    onToggleBloqueo: (claseId: number) => void;
    onGenerar: () => void;
    onClaseClick?: (clase: Clase) => void;
    puedeDeshacer?: boolean;
    onDeshacer?: () => void;
}

export function CalendarioSemanal({clases, semanaActual, fechasSemana, cargando, generando, onSemanaAnterior, onSemanaSiguiente, onIrHoy, onToggleBloqueo, onGenerar, onClaseClick, puedeDeshacer = false, onDeshacer}: CalendarioSemanalProps) {
    /* Verificar si estamos en la semana actual */
    const esSemanaActual = useMemo(() => {
        const lunesActual = getLunesDeSemana(new Date());
        return semanaActual.getTime() === lunesActual.getTime();
    }, [semanaActual]);

    /* Fecha de hoy para marcar el día actual */
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    /* Agrupar clases por día */
    const clasesPorDia = useMemo(() => {
        const mapa: Record<DiaSemana, Clase[]> = {
            lunes: [],
            martes: [],
            miercoles: [],
            jueves: [],
            viernes: []
        };

        clases.forEach(clase => {
            const fechaClase = new Date(clase.fecha);
            const indiceDia = fechaClase.getDay();
            /* getDay(): 0=domingo, 1=lunes, ..., 5=viernes */
            const diasMap: Record<number, DiaSemana> = {
                1: 'lunes',
                2: 'martes',
                3: 'miercoles',
                4: 'jueves',
                5: 'viernes'
            };
            const dia = diasMap[indiceDia];
            if (dia) {
                mapa[dia].push(clase);
            }
        });

        /* Ordenar clases por hora de inicio */
        Object.values(mapa).forEach(arr => {
            arr.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        });

        return mapa;
    }, [clases]);

    /* Verificar si un día es hoy */
    const esHoy = (fecha: Date): boolean => {
        return fecha.getTime() === hoy.getTime();
    };

    return (
        <div className="capCalendario">
            {/* Header con navegación y acciones */}
            <div className="capCalendario__header">
                <NavegadorSemana semanaActual={semanaActual} fechasSemana={fechasSemana} onSemanaAnterior={onSemanaAnterior} onSemanaSiguiente={onSemanaSiguiente} onIrHoy={onIrHoy} esSemanaActual={esSemanaActual} />

                <BarraAcciones onGenerar={onGenerar} generando={generando} puedeDeshacer={puedeDeshacer} onDeshacer={onDeshacer} />
            </div>

            {/* Grid del calendario */}
            <div className="capCalendarioGrid">
                {/* Columna de horas */}
                <div className="capCalendarioGrid__horas">
                    <div className="capCalendarioGrid__horaHeader" />
                    {SLOTS_HORARIOS.slice(0, 10).map(hora => (
                        <div key={hora} className="capCalendarioGrid__horaSlot">
                            {hora}
                        </div>
                    ))}
                </div>

                {cargando ? (
                    <div className="capCalendario__cargando">
                        <Spinner tamano="lg" />
                        <p className="capTexto capTexto--secundario capMt--md">Cargando calendario...</p>
                    </div>
                ) : clases.length === 0 ? (
                    <div className="capCalendario__vacio">
                        <IconoCalendario size={48} className="capCalendario__vacioIcono" />
                        <p className="capCalendario__vacioTexto">No hay clases programadas para esta semana</p>
                        <p className="capTexto capTexto--secundario capTexto--sm">Añade alumnos y genera el calendario para comenzar</p>
                    </div>
                ) : (
                    /* Columnas de días */
                    DIAS_SEMANA.map((dia, idx) => <ColumnaDia key={dia} dia={dia} fecha={fechasSemana[idx]} clases={clasesPorDia[dia]} esHoy={esHoy(fechasSemana[idx])} onToggleBloqueo={onToggleBloqueo} onClaseClick={onClaseClick} />)
                )}
            </div>
        </div>
    );
}

export default CalendarioSemanal;
