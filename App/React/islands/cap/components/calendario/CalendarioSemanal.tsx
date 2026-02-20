/**
 * CalendarioSemanal
 *
 * Vista principal del calendario CAP.
 * Grid de 5 columnas (Lunes-Viernes) con navegación entre semanas.
 * Ahora soporta Smart Drag & Drop con detección de conflictos.
 */

import { useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { Clase, DiaSemana } from '../../types';
import { DIAS_SEMANA } from '../../constants/cap-constants';
import { NavegadorSemana } from './NavegadorSemana';
import { BarraAcciones } from './BarraAcciones';
import { ColumnaDia } from './ColumnaDia';
import { DragOverlayClase } from './DragOverlayClase';
import { ModalConflictoDrag } from './ModalConflictoDrag';
import { Spinner } from '../ui';
import { IconoCalendario } from '../icons';
import { useCalendarioDragDrop } from '../../hooks/useCalendarioDragDrop';

/*
 * Parsea una fecha YYYY-MM-DD como fecha local (no UTC).
 */
function parsearFechaLocal(fechaStr: string): Date {
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

/*
 * Formatea una fecha a YYYY-MM-DD respetando la zona horaria local.
 */
function formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

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
    onBorrarSemana?: () => Promise<void>;
    onMoverClase?: (claseId: number, nuevaFecha: string, horaInicio?: string, horaFin?: string) => Promise<void>;
    onMoverMultiplesClases?: (cambios: { clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string }[]) => Promise<void>;
}

export function CalendarioSemanal({ clases, semanaActual, fechasSemana, cargando, generando, onSemanaAnterior, onSemanaSiguiente, onIrHoy, onToggleBloqueo, onGenerar, onClaseClick, puedeDeshacer = false, onDeshacer, onBorrarSemana, onMoverClase, onMoverMultiplesClases }: CalendarioSemanalProps) {
    /* Sensores de DnD */
    const sensores = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    );

    /* Verificar si estamos en la semana actual */
    const esSemanaActual = useMemo(() => {
        const hoy = new Date();
        const lunesActual = new Date(semanaActual);
        const lunesHoy = new Date(hoy);
        const dia = hoy.getDay();
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
        lunesHoy.setDate(diff);
        lunesHoy.setHours(0, 0, 0, 0);

        return lunesActual.getTime() === lunesHoy.getTime();
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
            const fechaClase = parsearFechaLocal(clase.fecha);
            const indiceDia = fechaClase.getDay();
            const diasMap: Record<number, DiaSemana> = {
                1: 'lunes',
                2: 'martes',
                3: 'miercoles',
                4: 'jueves',
                5: 'viernes'
            };
            const dia = diasMap[indiceDia];
            if (dia) mapa[dia].push(clase);
        });

        /* Ordenar clases por hora de inicio */
        Object.values(mapa).forEach(arr => {
            arr.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
        });

        return mapa;
    }, [clases]);

    /* Hook de Drag & Drop: extrae toda la lógica de arrastre, conflictos y notificaciones */
    const {
        claseArrastrada, previewDrop, notificaciones, conflictoData,
        collisionDetection, handleDragStart, handleDragMove, handleDragEnd, handleDragCancel,
        moverHorarioCercano, cancelarConflicto, resolverConflicto,
    } = useCalendarioDragDrop({clasesPorDia, onMoverClase, onMoverMultiplesClases});

    /* Verificar si un día es hoy */
    const esHoy = (fecha: Date): boolean => {
        return fecha.getTime() === hoy.getTime();
    };

    return (
        <DndContext sensors={sensores} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <div className="capCalendario">
                {/* Header con navegación y acciones */}
                <div className="capCalendario__header">
                    <NavegadorSemana semanaActual={semanaActual} fechasSemana={fechasSemana} onSemanaAnterior={onSemanaAnterior} onSemanaSiguiente={onSemanaSiguiente} onIrHoy={onIrHoy} esSemanaActual={esSemanaActual} />
                    <BarraAcciones onGenerar={onGenerar} generando={generando} puedeDeshacer={puedeDeshacer} onDeshacer={onDeshacer} onBorrarSemana={onBorrarSemana} />
                </div>

                {/* Grid del calendario */}
                <div className="capCalendarioGrid">
                    {/* Columna de horas */}
                    <div className="capCalendarioGrid__horas">
                        <div className="capCalendarioGrid__horaHeader" style={{ borderBottom: '1px solid var(--cap-borde-suave, #eee)', boxSizing: 'border-box' }} />
                        {/* Altura: 117px = 60min * 1.95px/min (+30% zoom) */}
                        {Array.from({ length: 15 }, (_, i) => i + 8).map(hora => (
                            <div key={hora} className="capCalendarioGrid__horaSlot" style={{ height: '117px', borderBottom: '1px solid var(--cap-borde-suave, #eee)', boxSizing: 'border-box', position: 'relative' }}>
                                <span style={{ position: 'absolute', top: '-10px', right: '10px', fontSize: '0.75rem', color: 'var(--cap-texto-secundario, #666)' }}>{hora.toString().padStart(2, '0')}:00</span>
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
                        DIAS_SEMANA.map((dia, idx) => {
                            const fecha = fechasSemana[idx];
                            const fechaStr = formatearFechaLocal(fecha);
                            const preview = previewDrop?.fecha === fechaStr ? previewDrop : null;

                            return (
                                <ColumnaDia
                                    key={dia}
                                    dia={dia}
                                    fecha={fecha}
                                    clases={clasesPorDia[dia]}
                                    esHoy={esHoy(fecha)}
                                    onToggleBloqueo={onToggleBloqueo}
                                    onClaseClick={onClaseClick}
                                    dndActivo={claseArrastrada !== null}
                                    preview={preview}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal de Conflicto de Drag & Drop */}
            <ModalConflictoDrag abierto={conflictoData !== null} conflicto={conflictoData} onCancelar={cancelarConflicto} onDesplazar={resolverConflicto} onMoverCercano={moverHorarioCercano} />

            {/* Overlay que sigue al cursor durante el arrastre */}
            <DragOverlay dropAnimation={null}>{claseArrastrada && <DragOverlayClase clase={claseArrastrada} />}</DragOverlay>

            {/* Notificaciones inferiores */}
            <div className="capToastContainer" aria-live="polite">
                {notificaciones.map(item => (
                    <div key={item.id} className="capToast capToast--error">
                        {item.mensaje}
                    </div>
                ))}
            </div>
        </DndContext>
    );
}

export default CalendarioSemanal;
