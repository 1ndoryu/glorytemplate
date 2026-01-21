/**
 * SeccionReportes
 *
 * Vista para la generación y descarga de reportes PDF del módulo CAP.
 * Permite generar reportes de:
 * - Plan de formación individual por alumno
 * - Control de horas semanal
 */

import {useState, useEffect} from 'react';
import {useReportes} from '../../hooks/useReportes';
import {useAlumnos} from '../../hooks/useAlumnos';
import {Tarjeta, Boton, Alerta, Spinner} from '../ui';
import {getLunesDeSemana} from '../../constants/cap-constants';
import {FileText, Download, Users, Calendar, ChevronLeft, ChevronRight} from 'lucide-react';

export function SeccionReportes() {
    const {generando, tipoGenerando, error, exito, descargarPlanAlumno, descargarControlHoras, limpiarMensajes} = useReportes();
    const {alumnos, cargando: cargandoAlumnos, cargarAlumnos} = useAlumnos();

    /* Estado para el alumno seleccionado */
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<number | null>(null);

    /* Estado para la semana seleccionada */
    const [semanaSeleccionada, setSemanaSeleccionada] = useState<Date>(() => getLunesDeSemana(new Date()));

    /* Cargar alumnos al montar */
    useEffect(() => {
        cargarAlumnos();
    }, [cargarAlumnos]);

    /* Limpiar mensajes después de 4 segundos */
    useEffect(() => {
        if (exito || error) {
            const timer = setTimeout(limpiarMensajes, 4000);
            return () => clearTimeout(timer);
        }
    }, [exito, error, limpiarMensajes]);

    /* Formato de fecha para mostrar */
    const formatearSemana = (fecha: Date): string => {
        const viernes = new Date(fecha);
        viernes.setDate(fecha.getDate() + 4);

        const formatoCorto = (d: Date) => d.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'});
        return `${formatoCorto(fecha)} - ${formatoCorto(viernes)}`;
    };

    /* Formato de fecha para API (YYYY-MM-DD) */
    const formatearFechaApi = (fecha: Date): string => {
        return fecha.toISOString().split('T')[0];
    };

    /* Navegación de semanas */
    const cambiarSemana = (direccion: 'anterior' | 'siguiente') => {
        setSemanaSeleccionada(prev => {
            const nueva = new Date(prev);
            nueva.setDate(prev.getDate() + (direccion === 'anterior' ? -7 : 7));
            return nueva;
        });
    };

    /* Manejar descarga de plan alumno */
    const handleDescargarPlanAlumno = () => {
        if (!alumnoSeleccionado) return;

        /* Usar Number() para normalizar tipos (API puede devolver string o number) */
        const alumno = alumnos.find(a => Number(a.id) === Number(alumnoSeleccionado));
        if (alumno) {
            descargarPlanAlumno(alumnoSeleccionado, alumno.nombre);
        }
    };

    /* Manejar descarga de control horas */
    const handleDescargarControlHoras = () => {
        descargarControlHoras(formatearFechaApi(semanaSeleccionada));
    };

    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Reportes</h2>
                <p className="capTexto capTexto--secundario">Genera y descarga reportes PDF para tu centro</p>
            </div>

            {/* Mensajes de feedback */}
            {error && (
                <Alerta variante="error" className="capMt--md capAnimSlideUp">
                    {error}
                </Alerta>
            )}
            {exito && (
                <Alerta variante="exito" className="capMt--md capAnimSlideUp">
                    {exito}
                </Alerta>
            )}

            {/* Grid de tarjetas de reportes */}
            <div className="capReportesGrid capMt--lg">
                {/* Tarjeta: Plan de Formación por Alumno */}
                <Tarjeta className="capReporteTarjeta">
                    <div className="capReporteTarjeta__icono capReporteTarjeta__icono--azul">
                        <Users size={24} />
                    </div>

                    <h3 className="capReporteTarjeta__titulo">Plan de Formación</h3>
                    <p className="capReporteTarjeta__descripcion">Genera un PDF con el plan de formación completo de un alumno, incluyendo su progreso por asignatura e historial de clases.</p>

                    <div className="capReporteTarjeta__controles">
                        <label className="capLabel">Seleccionar alumno</label>
                        {cargandoAlumnos ? (
                            <div className="capFlexCenter capPadding--md">
                                <Spinner tamano="sm" />
                            </div>
                        ) : (
                            <select className="capSelect" value={alumnoSeleccionado || ''} onChange={e => setAlumnoSeleccionado(e.target.value ? Number(e.target.value) : null)}>
                                <option value="">-- Selecciona un alumno --</option>
                                {alumnos.map(alumno => (
                                    <option key={alumno.id} value={alumno.id}>
                                        {alumno.nombre} ({alumno.horas_completadas || 0}h completadas)
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <Boton variante="primario" onClick={handleDescargarPlanAlumno} disabled={!alumnoSeleccionado || generando} cargando={generando && tipoGenerando === 'plan-alumno'} className="capReporteTarjeta__boton" anchoCompleto icono={<Download size={16} />}>
                        Descargar PDF
                    </Boton>
                </Tarjeta>

                {/* Tarjeta: Control de Horas Semanal */}
                <Tarjeta className="capReporteTarjeta">
                    <div className="capReporteTarjeta__icono capReporteTarjeta__icono--verde">
                        <Calendar size={24} />
                    </div>

                    <h3 className="capReporteTarjeta__titulo">Control de Horas</h3>
                    <p className="capReporteTarjeta__descripcion">Genera un PDF con el resumen semanal de clases, incluyendo horarios, asignaturas y alumnos asignados por día.</p>

                    <div className="capReporteTarjeta__controles">
                        <label className="capLabel">Semana a reportar</label>
                        <div className="capSelectorSemana">
                            <button type="button" className="capSelectorSemana__btn" onClick={() => cambiarSemana('anterior')} aria-label="Semana anterior">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="capSelectorSemana__texto">{formatearSemana(semanaSeleccionada)}</span>
                            <button type="button" className="capSelectorSemana__btn" onClick={() => cambiarSemana('siguiente')} aria-label="Semana siguiente">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <Boton variante="primario" onClick={handleDescargarControlHoras} disabled={generando} cargando={generando && tipoGenerando === 'control-horas'} className="capReporteTarjeta__boton" anchoCompleto icono={<Download size={16} />}>
                        Descargar PDF
                    </Boton>
                </Tarjeta>
            </div>

            {/* Información adicional */}
            <div className="capReportesInfo capMt--xl">
                <FileText size={20} className="capReportesInfo__icono" />
                <div>
                    <p className="capTexto capTexto--sm">
                        <strong>Nota:</strong> Los reportes se generan en formato PDF y cumplen con los requisitos del Real Decreto 1032/2007 para la formación CAP.
                    </p>
                    <p className="capTexto capTexto--sm capTexto--secundario capMt--xs">Los documentos generados son válidos como comprobante de formación para los alumnos inscritos.</p>
                </div>
            </div>
        </div>
    );
}

export default SeccionReportes;
