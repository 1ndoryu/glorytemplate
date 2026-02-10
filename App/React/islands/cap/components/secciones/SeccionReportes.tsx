/**
 * SeccionReportes
 *
 * Vista para la generación y descarga de reportes PDF del módulo CAP.
 * Permite generar reportes de:
 * - Plan de formación individual por alumno (con buscador autocompletado)
 * - Control de horas semanal (con calendario visual de selección de semana)
 */

import {useState, useEffect, useMemo} from 'react';
import {useReportes} from '../../hooks/useReportes';
import {useAlumnos} from '../../hooks/useAlumnos';
import {Tarjeta, Boton, Alerta, Spinner, InputAutocompletado} from '../ui';
import {SelectorFechaSemana} from '../reportes';
import {getLunesDeSemana} from '../../constants/cap-constants';
import {FileText, Download, Users, Calendar} from 'lucide-react';
import {IconoBuscar} from '../icons';

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

    /* Opciones formateadas para el autocompletado de alumnos */
    const opcionesAlumnos = useMemo(() => {
        return alumnos.map(alumno => ({
            id: Number(alumno.id),
            etiqueta: alumno.nombre,
            detalle: `${alumno.horas_completadas || 0}h completadas${alumno.dni ? ` · DNI: ${alumno.dni}` : ''}`
        }));
    }, [alumnos]);

    /* Formato de fecha para mostrar rango de semana */
    const formatearSemana = (fecha: Date): string => {
        const viernes = new Date(fecha);
        viernes.setDate(fecha.getDate() + 4);

        const formatoCorto = (d: Date) => d.toLocaleDateString('es-ES', {day: 'numeric', month: 'short'});
        return `${formatoCorto(fecha)} - ${formatoCorto(viernes)}`;
    };

    /* Formato de fecha para API (YYYY-MM-DD) sin conversión a UTC */
    const formatearFechaApi = (fecha: Date): string => {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    /* Manejar selección de alumno desde el autocompletado */
    const handleSeleccionarAlumno = (id: number | string | null) => {
        setAlumnoSeleccionado(id !== null ? Number(id) : null);
    };

    /* Manejar descarga de plan alumno */
    const handleDescargarPlanAlumno = () => {
        if (!alumnoSeleccionado) return;

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
                {/* Tarjeta: Plan de Formación por Alumno — con buscador autocompletado */}
                <Tarjeta className="capReporteTarjeta">
                    <div className="capReporteTarjeta__icono capReporteTarjeta__icono--azul">
                        <Users size={24} />
                    </div>

                    <h3 className="capReporteTarjeta__titulo">Plan de Formación</h3>
                    <p className="capReporteTarjeta__descripcion">Genera un PDF con el plan de formación completo de un alumno, incluyendo su progreso por asignatura e historial de clases.</p>

                    <div className="capReporteTarjeta__controles">
                        {cargandoAlumnos ? (
                            <div className="capFlexCenter capPadding--md">
                                <Spinner tamano="sm" />
                            </div>
                        ) : (
                            <InputAutocompletado
                                opciones={opcionesAlumnos}
                                valorSeleccionado={alumnoSeleccionado}
                                onSeleccionar={handleSeleccionarAlumno}
                                placeholder="Buscar alumno por nombre o DNI..."
                                etiqueta="Seleccionar alumno"
                                icono={<IconoBuscar />}
                                cargando={cargandoAlumnos}
                            />
                        )}
                    </div>

                    <Boton variante="primario" onClick={handleDescargarPlanAlumno} disabled={!alumnoSeleccionado || generando} cargando={generando && tipoGenerando === 'plan-alumno'} className="capReporteTarjeta__boton" anchoCompleto icono={<Download size={16} />}>
                        Descargar PDF
                    </Boton>
                </Tarjeta>

                {/* Tarjeta: Control de Horas Semanal — con calendario visual */}
                <Tarjeta className="capReporteTarjeta">
                    <div className="capReporteTarjeta__icono capReporteTarjeta__icono--verde">
                        <Calendar size={24} />
                    </div>

                    <h3 className="capReporteTarjeta__titulo">Control de Horas</h3>
                    <p className="capReporteTarjeta__descripcion">Genera un PDF con el resumen semanal de clases, incluyendo horarios, asignaturas y alumnos asignados por día.</p>

                    <div className="capReporteTarjeta__controles">
                        <label className="capLabel">Semana a reportar</label>
                        <SelectorFechaSemana
                            semanaSeleccionada={semanaSeleccionada}
                            onCambiarSemana={setSemanaSeleccionada}
                            formatearSemana={formatearSemana}
                        />
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
