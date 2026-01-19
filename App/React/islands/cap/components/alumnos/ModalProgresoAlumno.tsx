/**
 * ModalProgresoAlumno
 *
 * Modal que muestra el desglose de progreso por asignatura de un alumno.
 * Incluye barras de progreso visuales para cada asignatura del CAP.
 */

import {Modal, Badge} from '../ui';
import {ASIGNATURAS_CAP, CAP_REGLAS} from '../../constants';
import type {Alumno} from '../../hooks/useAlumnos';

interface ProgresoAsignatura {
    asignaturaId: number;
    horasCompletadas: number;
}

interface ModalProgresoAlumnoProps {
    visible: boolean;
    alumno: Alumno | null;
    /** Progreso por asignatura, si no se proporciona se usa datos mock */
    progresoAsignaturas?: ProgresoAsignatura[];
    onCerrar: () => void;
}

/*
 * Genera datos mock de progreso basándose en las horas totales del alumno.
 * Distribuye las horas completadas proporcionalmente entre las asignaturas.
 */
function generarProgresoMock(horasCompletadas: number): ProgresoAsignatura[] {
    if (horasCompletadas === 0) {
        return ASIGNATURAS_CAP.map(asig => ({
            asignaturaId: asig.id,
            horasCompletadas: 0
        }));
    }

    /* Distribuir horas proporcionalmente según duración de cada asignatura */
    const factorCompletado = horasCompletadas / CAP_REGLAS.HORAS_TOTALES;

    return ASIGNATURAS_CAP.map(asig => {
        const horasEsperadas = asig.duracionHoras * factorCompletado;
        /* Añadir algo de variación para que no sea exactamente proporcional */
        const variacion = Math.random() * 0.2 - 0.1;
        const horas = Math.max(0, Math.min(asig.duracionHoras, horasEsperadas * (1 + variacion)));
        return {
            asignaturaId: asig.id,
            horasCompletadas: Math.round(horas * 10) / 10
        };
    });
}

export function ModalProgresoAlumno({visible, alumno, progresoAsignaturas, onCerrar}: ModalProgresoAlumnoProps) {
    if (!alumno) return null;

    const horasTotales = alumno.horas_completadas || 0;
    const porcentajeTotal = Math.min(100, Math.round((horasTotales / CAP_REGLAS.HORAS_TOTALES) * 100));

    /* Usar datos reales si están disponibles, sino mock */
    const progreso = progresoAsignaturas || generarProgresoMock(horasTotales);

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
                {/* Resumen general */}
                <div className="capProgresoModal__resumen">
                    <div className="capProgresoModal__resumenPrincipal">
                        <span className="capProgresoModal__horasTotales">{horasTotales}</span>
                        <span className="capProgresoModal__horasLabel">de {CAP_REGLAS.HORAS_TOTALES}h completadas</span>
                    </div>
                    <Badge variante={estadoGeneral.variante}>{estadoGeneral.texto}</Badge>
                </div>

                {/* Barra de progreso general */}
                <div className="capProgresoModal__barraGeneral">
                    <div className="capProgresoModal__barraGeneralFondo">
                        <div className="capProgresoModal__barraGeneralRelleno" style={{width: `${porcentajeTotal}%`}} />
                    </div>
                    <span className="capProgresoModal__porcentaje">{porcentajeTotal}%</span>
                </div>

                {/* Desglose por asignatura */}
                <div className="capProgresoModal__desglose">
                    <h4 className="capProgresoModal__desgloseHeader">Desglose por Asignatura</h4>
                    <div className="capProgresoModal__asignaturas">
                        {ASIGNATURAS_CAP.map(asignatura => {
                            const progresoAsig = progreso.find(p => p.asignaturaId === asignatura.id);
                            const horasAsig = progresoAsig?.horasCompletadas || 0;
                            const porcentajeAsig = Math.min(100, Math.round((horasAsig / asignatura.duracionHoras) * 100));
                            const completada = porcentajeAsig >= 100;

                            return (
                                <div key={asignatura.id} className="capProgresoModal__asignatura">
                                    <div className="capProgresoModal__asignaturaHeader">
                                        <div className="capProgresoModal__asignaturaInfo">
                                            <span className="capProgresoModal__asignaturaCodigo" style={{backgroundColor: asignatura.color}}>
                                                {asignatura.codigo}
                                            </span>
                                            <span className="capProgresoModal__asignaturaNombre">{asignatura.nombre}</span>
                                        </div>
                                        <span className={`capProgresoModal__asignaturaHoras ${completada ? 'capProgresoModal__asignaturaHoras--completada' : ''}`}>
                                            {horasAsig}/{asignatura.duracionHoras}h
                                        </span>
                                    </div>
                                    <div className="capProgresoModal__asignaturaBarra">
                                        <div
                                            className={`capProgresoModal__asignaturaBarraRelleno ${completada ? 'capProgresoModal__asignaturaBarraRelleno--completada' : ''}`}
                                            style={{
                                                width: `${porcentajeAsig}%`,
                                                backgroundColor: completada ? 'var(--cap-exito-500)' : asignatura.color
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info adicional */}
                <div className="capProgresoModal__info">
                    <p className="capProgresoModal__infoTexto">
                        <strong>Horas restantes:</strong> {Math.max(0, CAP_REGLAS.HORAS_TOTALES - horasTotales)}h
                    </p>
                    <p className="capProgresoModal__infoTexto capProgresoModal__infoNota">El progreso detallado se actualiza automáticamente al registrar asistencia.</p>
                </div>
            </div>
        </Modal>
    );
}

export default ModalProgresoAlumno;
