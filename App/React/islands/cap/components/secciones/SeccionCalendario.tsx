/**
 * SeccionCalendario
 *
 * Vista del calendario de clases CAP.
 * Integra el calendario semanal con navegación, generación, edición y resolución de conflictos.
 * Incluye detección inteligente de día actual para generación parcial.
 */

import {useMemo, useState, useCallback} from 'react';
import {CalendarioSemanal, ModalConflictoAforo, ModalDetalleClase, ModalAvisoGeneracion, ModalGeneracionParcial} from '../calendario';
import type {CambiosClase, InfoHorasNoCubiertas} from '../calendario';
import {useCalendario} from '../../hooks/useCalendario';
import {Alerta, Modal, Boton} from '../ui';
import type {ExclusionesConflicto, Clase, DiaSemana} from '../../types';

const NOMBRES_DIAS: Record<number, string> = {
    1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes'
};

export function SeccionCalendario() {
    const {clases, semanaActual, fechasSemana, cargando, error, generando, conflictos, mostrarModalConflictos, avisosGeneracion, mostrarModalAvisos, claseSeleccionada, mostrarModalEdicion, guardandoEdicion, puedeDeshacer, eliminando, irSemanaAnterior, irSemanaSiguiente, irASemanaActual, toggleBloqueoClase, generarCalendario, generarConExclusiones, cerrarModalConflictos, cerrarModalAvisos, limpiarError, seleccionarClase, cerrarModalEdicion, actualizarClase, deshacer, moverClase, moverMultiplesClases, eliminarClase, borrarSemanaCompleta} = useCalendario();

    /* Estado para modal de generación parcial */
    const [mostrarModalParcial, setMostrarModalParcial] = useState(false);
    /* Estado para modal de advertencia de semana pasada */
    const [mostrarModalSemanaPasada, setMostrarModalSemanaPasada] = useState(false);

    /*
     * Obtener la clase actualizada desde el array de clases
     * Esto asegura que el modal refleja cambios en tiempo real (ej: toggle bloqueo)
     */
    const claseActualizada = useMemo(() => {
        if (!claseSeleccionada) return null;
        return clases.find(c => c.id === claseSeleccionada.id) || claseSeleccionada;
    }, [clases, claseSeleccionada]);

    /*
     * Calcular clases por día para el selector de movimiento
     * Se necesita para mostrar el contador de clases en cada día
     */
    const clasesPorDia = useMemo(() => {
        const mapa: Record<DiaSemana, Clase[]> = {
            lunes: [],
            martes: [],
            miercoles: [],
            jueves: [],
            viernes: []
        };

        const parsearFechaLocal = (fechaStr: string): Date => {
            return new Date(`${fechaStr}T00:00:00`);
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
            if (dia) {
                mapa[dia].push(clase);
            }
        });

        return mapa;
    }, [clases]);

    /*
     * Detectar si la semana actual incluye el día de hoy,
     * si hoy no es lunes, o si es una semana pasada (para mostrar advertencia).
     */
    const infoGeneracion = useMemo(() => {
        const hoy = new Date();
        const diaHoy = hoy.getDay(); /* 0=dom, 1=lun ... */

        /* Calcular si hoy cae en la semana que se está viendo */
        const lunesSemana = new Date(semanaActual);
        const viernesSemana = new Date(semanaActual);
        viernesSemana.setDate(viernesSemana.getDate() + 4);

        const hoyNorm = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const lunesNorm = new Date(lunesSemana.getFullYear(), lunesSemana.getMonth(), lunesSemana.getDate());
        const viernesNorm = new Date(viernesSemana.getFullYear(), viernesSemana.getMonth(), viernesSemana.getDate());

        const esSemanaActual = hoyNorm >= lunesNorm && hoyNorm <= viernesNorm;
        /* Semana pasada: viernes de esa semana ya pasó */
        const esSemanaAnterior = viernesNorm < hoyNorm;
        const esLunes = diaHoy === 1;
        const esDiaLaboral = diaHoy >= 1 && diaHoy <= 5;

        /* Formato YYYY-MM-DD del día de hoy */
        const year = hoy.getFullYear();
        const month = String(hoy.getMonth() + 1).padStart(2, '0');
        const day = String(hoy.getDate()).padStart(2, '0');
        const fechaHoy = `${year}-${month}-${day}`;

        return {
            esSemanaActual,
            esSemanaAnterior,
            esLunes,
            esDiaLaboral,
            fechaHoy,
            nombreDiaHoy: NOMBRES_DIAS[diaHoy] || 'hoy',
            necesitaModalParcial: esSemanaActual && !esLunes && esDiaLaboral
        };
    }, [semanaActual]);

    const handleClaseClick = (clase: Clase) => {
        seleccionarClase(clase);
    };

    const handleConfirmarExclusiones = (exclusiones: ExclusionesConflicto) => {
        generarConExclusiones(exclusiones);
    };

    const handleGuardarClase = async (claseId: number, cambios: CambiosClase) => {
        await actualizarClase(claseId, cambios);
    };

    const handleMoverClase = async (claseId: number, nuevaFecha: string, horaInicio?: string, horaFin?: string) => {
        await moverClase(claseId, nuevaFecha, horaInicio, horaFin);
    };

    const handleEliminarClase = async (claseId: number, forzar: boolean) => {
        await eliminarClase(claseId, forzar);
    };

    /*
     * Interceptar generación para detectar si se necesita modal parcial o advertencia.
     * - Semana pasada: Mostrar advertencia de que se asumirá asistencia retroactiva.
     * - Semana actual, día != lunes: Preguntar si generar desde hoy o completa.
     */
    const handleGenerar = useCallback(() => {
        if (infoGeneracion.esSemanaAnterior) {
            setMostrarModalSemanaPasada(true);
        } else if (infoGeneracion.necesitaModalParcial) {
            setMostrarModalParcial(true);
        } else {
            generarCalendario();
        }
    }, [infoGeneracion, generarCalendario]);

    const handleConfirmarSemanaPasada = useCallback(() => {
        setMostrarModalSemanaPasada(false);
        generarCalendario();
    }, [generarCalendario]);

    const handleGenerarDesdeHoy = useCallback(() => {
        setMostrarModalParcial(false);
        generarCalendario(infoGeneracion.fechaHoy);
    }, [generarCalendario, infoGeneracion.fechaHoy]);

    const handleGenerarSemanaCompleta = useCallback(() => {
        setMostrarModalParcial(false);
        generarCalendario();
    }, [generarCalendario]);

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Calendario</h2>
                <p className="capTexto capTexto--secundario">Gestiona las clases del curso CAP!</p>
            </div>

            {error && (
                <Alerta variante="error" className="capMt--md" cerrable onCerrar={limpiarError}>
                    {error}
                </Alerta>
            )}

            <div className="capMt--lg">
                <div className="capMt--lg">
                    <CalendarioSemanal clases={clases} semanaActual={semanaActual} fechasSemana={fechasSemana} cargando={cargando} generando={generando} onSemanaAnterior={irSemanaAnterior} onSemanaSiguiente={irSemanaSiguiente} onIrHoy={irASemanaActual} onToggleBloqueo={toggleBloqueoClase} onGenerar={handleGenerar} onClaseClick={handleClaseClick} puedeDeshacer={puedeDeshacer} onDeshacer={deshacer} onBorrarSemana={borrarSemanaCompleta} onMoverClase={handleMoverClase} onMoverMultiplesClases={moverMultiplesClases} />
                </div>
            </div>

            {/* Modal para generación parcial (día != lunes) */}
            <ModalGeneracionParcial
                abierto={mostrarModalParcial}
                nombreDiaHoy={infoGeneracion.nombreDiaHoy}
                fechaHoy={infoGeneracion.fechaHoy}
                onCerrar={() => setMostrarModalParcial(false)}
                onGenerarDesdeHoy={handleGenerarDesdeHoy}
                onGenerarSemanaCompleta={handleGenerarSemanaCompleta}
                generando={generando}
            />

            {/* Modal de advertencia para generar en semana pasada */}
            <Modal abierto={mostrarModalSemanaPasada} onCerrar={() => setMostrarModalSemanaPasada(false)} titulo="Generar en Semana Anterior" tamano="md">
                <div className="capModalGeneracion">
                    <Alerta variante="advertencia" className="capMb--md">
                        Estás a punto de generar el calendario para una <strong>semana pasada</strong>.
                    </Alerta>
                    <p className="capTexto capMb--md">
                        Al generar clases para fechas anteriores a hoy, el sistema asumirá que todos los alumnos asignados <strong>asistieron</strong> a dichas clases. Su progreso de horas se actualizará automáticamente.
                    </p>
                    <div className="capModalGeneracion__confirmar">
                        <Boton variante="secundario" onClick={() => setMostrarModalSemanaPasada(false)} disabled={generando}>
                            Cancelar
                        </Boton>
                        <Boton variante="primario" onClick={handleConfirmarSemanaPasada} cargando={generando} disabled={generando}>
                            Continuar y Generar
                        </Boton>
                    </div>
                </div>
            </Modal>

            {/* Modal para resolver conflictos de aforo */}
            <ModalConflictoAforo abierto={mostrarModalConflictos} conflictos={conflictos} onCerrar={cerrarModalConflictos} onConfirmar={handleConfirmarExclusiones} cargando={generando} />

            {/* Modal para editar detalles de clase - usa claseActualizada para reflejar cambios en tiempo real */}
            {/* La key fuerza un remount cuando cambia la clase, reseteando el estado interno */}
            {/* Los datos de alumnos vienen directamente con la clase (alumnosData) */}
            <ModalDetalleClase key={`modal-clase-${claseActualizada?.id ?? 'none'}`} clase={claseActualizada} abierto={mostrarModalEdicion} onCerrar={cerrarModalEdicion} onGuardar={handleGuardarClase} onToggleBloqueo={toggleBloqueoClase} onMoverClase={handleMoverClase} fechasSemana={fechasSemana} clasesPorDia={clasesPorDia} onMoverMultiplesClases={moverMultiplesClases} guardando={guardandoEdicion} onEliminar={handleEliminarClase} eliminando={eliminando} />

            {/* Modal informativo de horas no cubiertas */}
            <ModalAvisoGeneracion abierto={mostrarModalAvisos} avisos={avisosGeneracion as InfoHorasNoCubiertas[]} onCerrar={cerrarModalAvisos} />
        </div>
    );
}

export default SeccionCalendario;
