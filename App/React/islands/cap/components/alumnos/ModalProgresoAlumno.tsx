/**
 * ModalProgresoAlumno
 *
 * Modal que muestra el desglose de progreso por asignatura de un alumno.
 * Lógica de fetch y estado delegados a useProgresoAlumno (SRP).
 */

import {Modal, Badge, Spinner, Tooltip, Alerta} from '../ui';
import {ASIGNATURAS_CAP, CAP_REGLAS} from '../../constants';
import {useProgresoAlumno} from '../../hooks/useProgresoAlumno';
import type {Alumno} from '../../hooks/useAlumnos';
import {formatearHoras, normalizarNumero} from '../../utils/formateoHoras';

interface ModalProgresoAlumnoProps {
    visible: boolean;
    alumno: Alumno | null;
    onCerrar: () => void;
}

export function ModalProgresoAlumno({visible, alumno, onCerrar}: ModalProgresoAlumnoProps) {
    const {cargando, errorCarga, progresoAsignado, progresoCompletado, horasAsignadas, horasCompletadas} =
        useProgresoAlumno(visible, alumno);

    if (!alumno) return null;

    const horasTotales = normalizarNumero(horasCompletadas);
    const horasPlan = normalizarNumero(horasAsignadas);
    const porcentajeTotal = Math.min(100, Math.round((horasTotales / CAP_REGLAS.HORAS_TOTALES) * 100));
    const porcentajePlan = Math.min(100, Math.round((horasPlan / CAP_REGLAS.HORAS_TOTALES) * 100));
    const horasFaltantesGlobal = Math.max(0, CAP_REGLAS.HORAS_TOTALES - horasPlan);

    const getEstadoGeneral = () => {
        if (porcentajeTotal >= 100) return {texto: 'Completado', variante: 'exito' as const};
        if (porcentajeTotal >= 75) return {texto: 'Casi listo', variante: 'advertencia' as const};
        if (porcentajeTotal >= 25) return {texto: 'En progreso', variante: 'info' as const};
        return {texto: 'Iniciando', variante: 'neutral' as const};
    };

    const estadoGeneral = getEstadoGeneral();

    return (
        <Modal abierto={visible} onCerrar={onCerrar} titulo="Progreso del Alumno" subtitulo={alumno.nombre} tamano="md">
            <div className="capProgresoModal">
                {cargando ? (
                    <div className="capFlexCenter capPadding--lg">
                        <Spinner tamano="md" />
                    </div>
                ) : (
                    <>
                        {errorCarga && <Alerta variante="advertencia" cerrable>{errorCarga}</Alerta>}
                        {/* Resumen de Estadísticas */}
                        <div className="capGrid capGrid--3cols capGap--md capMb--lg">
                            <div className="capTarjetaEstadistica capTarjetaEstadistica--exito">
                                <span className="capTexto--xs capTexto--secundario capMb--xs">Completadas</span>
                                <div className="capFlexCenter capGap--xs">
                                    <span className="capTitulo--xl capTexto--exito">{formatearHoras(horasTotales)}h</span>
                                    <span className="capTexto--xs capTexto--terciario">/ {CAP_REGLAS.HORAS_TOTALES}h</span>
                                </div>
                            </div>
                            <div className="capTarjetaEstadistica capTarjetaEstadistica--info">
                                <span className="capTexto--xs capTexto--secundario capMb--xs">Planificadas</span>
                                <div className="capFlexCenter capGap--xs">
                                    <span className="capTitulo--xl capTexto--info">{formatearHoras(horasPlan)}h</span>
                                    <span className="capTexto--xs capTexto--terciario">Total</span>
                                </div>
                            </div>
                            <div className="capTarjetaEstadistica">
                                <span className="capTexto--xs capTexto--secundario capMb--xs">Estado</span>
                                <div className="capFlexCenter">
                                    <Badge variante={estadoGeneral.variante}>{estadoGeneral.texto}</Badge>
                                </div>
                            </div>
                        </div>

                        {/* Barra de progreso general */}
                        <div className="capMb--xl">
                            <div className="capFlexBetween capMb--sm">
                                <span className="capTexto--sm capTexto--secundario">Progreso Global</span>
                                <span className="capTexto--lg capTexto--principal capPeso--bold">{porcentajeTotal}%</span>
                            </div>
                            <Tooltip
                                content={
                                    <div className="capFlexCol capGap--xs">
                                        <div>
                                            Completadas: <strong>{formatearHoras(horasTotales)}h</strong>
                                        </div>
                                        <div>
                                            Planificadas: <strong>{formatearHoras(Math.max(0, horasPlan - horasTotales))}h</strong>
                                        </div>
                                        <div>
                                            Faltantes: <strong>{formatearHoras(horasFaltantesGlobal)}h</strong>
                                        </div>
                                        <div className="capTooltip__separador">
                                            Total: <strong>{formatearHoras(horasPlan)}h</strong> / {CAP_REGLAS.HORAS_TOTALES}h
                                        </div>
                                    </div>
                                }
                                position="top"
                                className="capWidth100">
                                <div className="capProgreso capProgreso--multi capProgreso--lg">
                                    {/* sentinel-disable-next-line css-inline-jsx */}
                                    <div className="capProgreso__barra--completado" style={{width: `${(horasTotales / CAP_REGLAS.HORAS_TOTALES) * 100}%`}} />
                                    {/* sentinel-disable-next-line css-inline-jsx */}
                                    <div className="capProgreso__barra--planificado" style={{width: `${(Math.max(0, horasPlan - horasTotales) / CAP_REGLAS.HORAS_TOTALES) * 100}%`}} />
                                </div>
                            </Tooltip>
                        </div>

                        {/* Desglose por asignatura */}
                        <div className="capProgresoModal__desglose">
                            <h4 className="capProgresoModal__desgloseHeader capMb--md">Desglose por Asignatura</h4>
                            <div className="capProgresoModal__asignaturas">
                                {ASIGNATURAS_CAP.map(asignatura => {
                                    const progresoAsig = progresoAsignado.find(p => p.asignaturaId === asignatura.id);
                                    const progresoComp = progresoCompletado.find(p => p.asignaturaId === asignatura.id);
                                    const horasAsig = normalizarNumero(progresoAsig?.horasCompletadas);
                                    const horasComp = normalizarNumero(progresoComp?.horasCompletadas);

                                    /* Cálculos para barra multi-segmento por asignatura */
                                    /* Base: duracionHoras */
                                    const pctComp = Math.min(100, (horasComp / asignatura.duracionHoras) * 100);
                                    const horasRestantes = Math.max(0, horasAsig - horasComp);
                                    const horasFaltantesAsignatura = Math.max(0, asignatura.duracionHoras - horasAsig);
                                    const pctPlan = Math.min(100 - pctComp, (horasRestantes / asignatura.duracionHoras) * 100);

                                    const completada = horasComp >= asignatura.duracionHoras;

                                    return (
                                        <div key={asignatura.id} className="capProgresoModal__asignatura">
                                            <div className="capProgresoModal__asignaturaHeader">
                                                <div className="capProgresoModal__asignaturaInfo">
                                                    {/* sentinel-disable-next-line css-inline-jsx */}
                                                    <span className="capProgresoModal__asignaturaCodigo" style={{backgroundColor: asignatura.color}}>
                                                        {asignatura.codigo}
                                                    </span>
                                                    <span className="capProgresoModal__asignaturaNombre">{asignatura.nombre}</span>
                                                </div>
                                                <span className={`capProgresoModal__asignaturaHoras ${completada ? 'capProgresoModal__asignaturaHoras--completada' : ''}`}>
                                                    {horasComp >= asignatura.duracionHoras ? (
                                                        <span className="capFlexStart capGap--xs">
                                                            <span className="capPunto capPunto--completado"></span> Completada
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            {formatearHoras(horasComp)} / {asignatura.duracionHoras}h
                                                        </span>
                                                    )}
                                                </span>
                                            </div>

                                            <div className="capMt--sm">
                                                <Tooltip
                                                    content={
                                                        <div className="capFlexCol capGap--xs">
                                                            <div>{asignatura.nombre}</div>
                                                            <div className="capTooltip__separador">
                                                                Completadas: <strong>{formatearHoras(horasComp)}h</strong>
                                                            </div>
                                                            <div>
                                                                Planificadas: <strong>{formatearHoras(horasRestantes)}h</strong>
                                                            </div>
                                                            <div>
                                                                Faltantes: <strong>{formatearHoras(horasFaltantesAsignatura)}h</strong>
                                                            </div>
                                                        </div>
                                                    }
                                                    position="top"
                                                    className="capWidth100">
                                                    <div className="capProgreso capProgreso--multi">
                                                        {/* sentinel-disable-next-line css-inline-jsx */}
                                                        <div className="capProgreso__barra--completado" style={{width: `${pctComp}%`, backgroundColor: completada ? 'var(--cap-exito-500)' : asignatura.color}} />
                                                        {/* sentinel-disable-next-line css-inline-jsx */}
                                                        <div className="capProgreso__barra--planificado" style={{width: `${pctPlan}%`, opacity: 0.3, backgroundColor: asignatura.color}} />
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Info adicional */}
                        <div className="capProgresoModal__info">
                            <p className="capProgresoModal__infoTexto capProgresoModal__infoNota">El progreso 'Planificado' incluye clases futuras asignadas en el calendario.</p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default ModalProgresoAlumno;
