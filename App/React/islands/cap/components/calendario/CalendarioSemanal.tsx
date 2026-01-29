/**
 * CalendarioSemanal
 *
 * Vista principal del calendario CAP.
 * Grid de 5 columnas (Lunes-Viernes) con navegación entre semanas.
 * Ahora soporta Smart Drag & Drop con detección de conflictos.
 */

import {useMemo, useState, useCallback} from 'react';
import {DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, pointerWithin, rectIntersection} from '@dnd-kit/core';
import type {DragStartEvent, DragEndEvent, DragMoveEvent, CollisionDetection} from '@dnd-kit/core';
import type {Clase, DiaSemana} from '../../types';
import {DIAS_SEMANA, CALENDARIO_CONFIG} from '../../constants/cap-constants';
import {NavegadorSemana} from './NavegadorSemana';
import {BarraAcciones} from './BarraAcciones';
import {ColumnaDia} from './ColumnaDia';
import {DragOverlayClase} from './DragOverlayClase';
import {ModalConflictoDrag} from './ModalConflictoDrag';
import {Spinner} from '../ui';
import {IconoCalendario} from '../icons';
import {validarMovimiento, resolverDesplazamientoCascada, horaAMinutos, encontrarHorarioDisponibleMasCercano} from '../../utils/collisionUtils';

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
    onMoverMultiplesClases?: (cambios: {clase: Clase; nuevoInicio: string; nuevoFin: string; nuevaFecha?: string}[]) => Promise<void>;
}

export function CalendarioSemanal({clases, semanaActual, fechasSemana, cargando, generando, onSemanaAnterior, onSemanaSiguiente, onIrHoy, onToggleBloqueo, onGenerar, onClaseClick, puedeDeshacer = false, onDeshacer, onBorrarSemana, onMoverClase, onMoverMultiplesClases}: CalendarioSemanalProps) {
    /* Estado para el arrastre activo */
    const [claseArrastrada, setClaseArrastrada] = useState<Clase | null>(null);

    /* Estado para preview de drop */
    const [previewDrop, setPreviewDrop] = useState<{fecha: string; top: number; height: number} | null>(null);

    /* Notificaciones UI */
    const [notificaciones, setNotificaciones] = useState<{id: string; mensaje: string}[]>([]);

    /* Estado para conflicto detectado */
    const [conflictoData, setConflictoData] = useState<{
        claseMoviendo: Clase;
        claseExistente: Clase;
        nuevaHoraInicio: string;
        nuevaHoraFin: string;
        fechaDestino: string;
    } | null>(null);

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
        // Simple check based on dates
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

    /* Verificar si un día es hoy */
    const esHoy = (fecha: Date): boolean => {
        return fecha.getTime() === hoy.getTime();
    };

    const notificarMovimiento = useCallback((mensaje: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setNotificaciones(prev => [...prev, {id, mensaje}]);

        window.setTimeout(() => {
            setNotificaciones(prev => prev.filter(item => item.id !== id));
        }, 3200);
    }, []);

    const collisionDetection: CollisionDetection = useCallback(args => {
        /*
         * Corrige acceso a droppableContainers: es un array, no Map.
         * Esto evita errores en runtime al filtrar por día.
         */
        const obtenerData = (id: string | number) =>
            args.droppableContainers.find(container => container.id === id)?.data?.current as {type?: string} | undefined;

        const pointerCollisions = pointerWithin(args);
        const baseCollisions = pointerCollisions.length ? pointerCollisions : rectIntersection(args);

        const soloDias = baseCollisions.filter(collision => obtenerData(collision.id)?.type === 'dia');

        if (soloDias.length > 0) {
            return soloDias;
        }

        return closestCenter(args).filter(collision => obtenerData(collision.id)?.type === 'dia');
    }, []);

    /* Handlers de drag & drop */
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const {active} = event;
        const claseData = active.data.current?.clase as Clase | undefined;
        if (claseData) {
            setClaseArrastrada(claseData);
        }
    }, []);

    const handleDragMove = useCallback(
        (event: DragMoveEvent) => {
            const {active, over, delta} = event;

            const claseData = active.data.current?.clase as Clase | undefined;
            if (!claseData || claseData.bloqueada) {
                setPreviewDrop(null);
                return;
            }

            const fechaDestino = over?.data.current?.fecha as string | undefined;
            if (!fechaDestino) {
                setPreviewDrop(null);
                return;
            }

            const minutosOriginales = horaAMinutos(claseData.horaInicio) - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
            const topOriginal = Math.max(0, minutosOriginales * CALENDARIO_CONFIG.PIXELS_POR_MINUTO);
            const duracionMinutos = horaAMinutos(claseData.horaFin) - horaAMinutos(claseData.horaInicio);
            const altura = Math.max(CALENDARIO_CONFIG.ALTO_MINIMO_CLASE, duracionMinutos * CALENDARIO_CONFIG.PIXELS_POR_MINUTO - 2);

            const nuevoTopRaw = Math.max(0, Math.min(topOriginal + delta.y, CALENDARIO_CONFIG.ALTURA_TOTAL_COLUMNA - altura));

            const fechaObj = parsearFechaLocal(fechaDestino);
            const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
            const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];

            if (!diaKey) {
                setPreviewDrop(null);
                return;
            }

            const clasesDestino = clasesPorDia[diaKey];
            const validacion = validarMovimiento(nuevoTopRaw, claseData, clasesDestino);
            const minutosInicio = horaAMinutos(validacion.nuevaHoraInicio) - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
            const topSnap = Math.max(0, Math.min(minutosInicio * CALENDARIO_CONFIG.PIXELS_POR_MINUTO, CALENDARIO_CONFIG.ALTURA_TOTAL_COLUMNA - altura));

            setPreviewDrop({
                fecha: fechaDestino,
                top: topSnap,
                height: altura
            });
        },
        [clasesPorDia]
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const {active, over, delta} = event;

            setClaseArrastrada(null);
            setPreviewDrop(null);

            if (!over || !onMoverClase) {
                notificarMovimiento('No se pudo mover la clase. Suelta dentro del calendario.');
                return;
            }

            /* Datos de origen */
            const claseData = active.data.current?.clase as Clase | undefined;
            if (!claseData) return;

            /* Datos de destino (día) */
            const fechaDestino = over.data.current?.fecha as string | undefined;
            if (!fechaDestino) {
                notificarMovimiento('No se pudo mover la clase. Suelta dentro del día destino.');
                return;
            }

            /* No mover clases bloqueadas */
            if (claseData.bloqueada) {
                notificarMovimiento('La clase está bloqueada y no se puede mover.');
                return;
            }

            /*
             * Calcular nueva ubicación temporal
             * 1. Obtener posición original en píxeles
             * 2. Sumar delta.y
             * 3. Convertir a hora
             */
            const minutosOriginales = horaAMinutos(claseData.horaInicio) - CALENDARIO_CONFIG.HORA_INICIO_DIA * 60;
            const topOriginal = Math.max(0, minutosOriginales * CALENDARIO_CONFIG.PIXELS_POR_MINUTO);

            const nuevoTop = Math.max(0, topOriginal + delta.y);

            /* Obtener clases del día destino para validar colisiones */
            /* Encontrar el día de la semana basado en la fecha string */
            const fechaObj = parsearFechaLocal(fechaDestino);
            const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
            const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];

            // Si el día no es lunes-viernes (ej fin de semana), abortar (aunque el droppable no debería estar ahí)
            if (!diaKey) return;

            const clasesDestino = clasesPorDia[diaKey];

            /* Validar movimiento */
            const validacion = validarMovimiento(nuevoTop, claseData, clasesDestino);

            if (validacion.valido) {
                const mismaFecha = fechaDestino === claseData.fecha;
                const mismaHora = validacion.nuevaHoraInicio === claseData.horaInicio && validacion.nuevaHoraFin === claseData.horaFin;

                if (mismaFecha && mismaHora) {
                    return;
                }

                // Caso A: Sin conflicto, mover directamente
                await onMoverClase(claseData.id, fechaDestino, validacion.nuevaHoraInicio, validacion.nuevaHoraFin);
            } else if (validacion.conflicto) {
                // Caso B: Conflicto, mostrar modal
                setConflictoData({
                    claseMoviendo: claseData,
                    claseExistente: validacion.conflicto.clase,
                    nuevaHoraInicio: validacion.nuevaHoraInicio,
                    nuevaHoraFin: validacion.nuevaHoraFin,
                    fechaDestino: fechaDestino
                });
            } else {
                notificarMovimiento('No se pudo mover la clase a esa hora.');
            }
        },
        [onMoverClase, clasesPorDia, notificarMovimiento]
    );

    const handleDragCancel = useCallback(() => {
        setClaseArrastrada(null);
        setPreviewDrop(null);
    }, []);

    /* Handler para resolver conflicto con desplazamiento (Push) */
    const resolverConflicto = useCallback(async () => {
        if (!conflictoData || !onMoverMultiplesClases) return;

        /* Encontrar el día para obtener todas las clases */
        const fechaObj = parsearFechaLocal(conflictoData.fechaDestino);
        const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
        const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];
        if (!diaKey) return;

        const clasesDestino = clasesPorDia[diaKey];

        /* Calcular desplazamientos necesarios */
        const cambios = resolverDesplazamientoCascada(conflictoData.claseMoviendo, conflictoData.nuevaHoraInicio, conflictoData.nuevaHoraFin, clasesDestino);

        // Añadir fecha de destino a cada cambio si cambia de día
        const cambiosConFecha = cambios.map(c => ({
            ...c,
            nuevaFecha: conflictoData.fechaDestino
        }));

        setConflictoData(null); // Cerrar modal
        await onMoverMultiplesClases(cambiosConFecha);
    }, [conflictoData, onMoverMultiplesClases, clasesPorDia]);

    const cancelarConflicto = () => {
        setConflictoData(null);
    };

    const moverHorarioCercano = useCallback(async () => {
        if (!conflictoData) return;

        const fechaObj = parsearFechaLocal(conflictoData.fechaDestino);
        const diaIndices = {1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes'} as const;
        const diaKey = diaIndices[fechaObj.getDay() as keyof typeof diaIndices];
        if (!diaKey) return;

        const clasesDestino = clasesPorDia[diaKey];
        const horario = encontrarHorarioDisponibleMasCercano(
            conflictoData.nuevaHoraInicio,
            conflictoData.nuevaHoraFin,
            clasesDestino,
            conflictoData.claseMoviendo.id
        );

        if (!horario) {
            notificarMovimiento('No hay un horario disponible cercano para mover la clase.');
            setConflictoData(null);
            return;
        }

        setConflictoData(null);
        await onMoverClase(conflictoData.claseMoviendo.id, conflictoData.fechaDestino, horario.horaInicio, horario.horaFin);
    }, [conflictoData, clasesPorDia, onMoverClase, notificarMovimiento]);

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
                        <div className="capCalendarioGrid__horaHeader" style={{borderBottom: '1px solid var(--cap-borde-suave, #eee)', boxSizing: 'border-box'}} />
                        {Array.from({length: 15}, (_, i) => i + 8).map(hora => (
                            <div key={hora} className="capCalendarioGrid__horaSlot" style={{height: '90px', borderBottom: '1px solid var(--cap-borde-suave, #eee)', boxSizing: 'border-box', position: 'relative'}}>
                                <span style={{position: 'absolute', top: '-10px', right: '10px', fontSize: '0.75rem', color: 'var(--cap-texto-secundario, #666)'}}>{hora.toString().padStart(2, '0')}:00</span>
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
