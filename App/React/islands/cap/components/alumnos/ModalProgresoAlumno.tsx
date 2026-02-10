/**
 * ModalProgresoAlumno
 *
 * Modal que muestra el desglose de progreso por asignatura de un alumno.
 * Consume el endpoint real /alumnos/{id}/progreso para obtener datos actualizados.
 * El calendario es la fuente de verdad: clases con fecha <= hoy.
 */

import {useState, useEffect} from 'react';
import {Modal, Badge, Spinner} from '../ui';
import {ASIGNATURAS_CAP, CAP_REGLAS} from '../../constants';
import type {Alumno} from '../../hooks/useAlumnos';

interface ProgresoAsignatura {
    asignaturaId: number;
    horasCompletadas: number;
}

interface ProgresoApiResponse {
    alumnoId: number;
    horasCompletadas: number;
    horasAsignadas?: number;
    horasTotales: number;
    porcentajeCompletadas?: number;
    porcentajeAsignadas?: number;
    asignaturas: Array<{asignatura: string; horas: string}>;
    asignaturasCompletadas?: Array<{asignatura: string; horas: string}>;
    asignaturasAsignadas?: Array<{asignatura: string; horas: string}>;
}

interface ModalProgresoAlumnoProps {
    visible: boolean;
    alumno: Alumno | null;
    onCerrar: () => void;
}

/*
 * Normaliza códigos de asignatura del backend a IDs numéricos del frontend.
 * El backend puede devolver nombres internos como "conduccion_racional".
 */
const CODIGO_A_ID: Record<string, number> = {
    conduccion_racional: 1, CR: 1,
    reglamentacion: 2, REG: 2,
    seguridad_vial: 3, SV: 3,
    servicio_logistica: 4, SL: 4,
    salud_seguridad: 5, SS: 5, salud_ergonomia: 5,
    medio_ambiente: 6, MA: 6, entorno_economico: 6,
    mercancias_peligrosas: 7, MP: 7,
    viajeros: 8, VIA: 8, evaluacion: 8,
    racionalizacion: 1
};

export function ModalProgresoAlumno({visible, alumno, onCerrar}: ModalProgresoAlumnoProps) {
    const [cargando, setCargando] = useState(false);
    const [progresoAsignado, setProgresoAsignado] = useState<ProgresoAsignatura[]>([]);
    const [progresoCompletado, setProgresoCompletado] = useState<ProgresoAsignatura[]>([]);
    const [horasAsignadas, setHorasAsignadas] = useState(0);
    const [horasCompletadas, setHorasCompletadas] = useState(0);

    /* Fetch progreso real cuando se abre el modal */
    useEffect(() => {
        if (!visible || !alumno) return;

        const cargarProgreso = async () => {
            setCargando(true);
            try {
                const nonce = (window as any).wpApiSettings?.nonce || '';
                const response = await fetch(`/wp-json/cap/v1/alumnos/${alumno.id}/progreso`, {
                    headers: {'X-WP-Nonce': nonce},
                    credentials: 'same-origin'
                });

                if (!response.ok) throw new Error('Error al cargar progreso');

                const data: ProgresoApiResponse = await response.json();

                /* Mapear respuesta del backend a formato del frontend */
                const baseAsignaturas: ProgresoAsignatura[] = ASIGNATURAS_CAP.map(asig => ({
                    asignaturaId: asig.id,
                    horasCompletadas: 0
                }));

                const mapearAsignaturas = (items: Array<{asignatura: string; horas: string}>) => {
                    const mapeado = baseAsignaturas.map(item => ({...item}));
                    (items || []).forEach(item => {
                        const id = CODIGO_A_ID[item.asignatura];
                        if (id) {
                            const idx = mapeado.findIndex(p => p.asignaturaId === id);
                            if (idx !== -1) {
                                mapeado[idx].horasCompletadas += parseFloat(item.horas) || 0;
                            }
                        }
                    });
                    return mapeado;
                };

                const asignadas = data.asignaturasAsignadas || data.asignaturas || [];
                const completadas = data.asignaturasCompletadas || data.asignaturas || [];

                setProgresoAsignado(mapearAsignaturas(asignadas));
                setProgresoCompletado(mapearAsignaturas(completadas));
                setHorasAsignadas(data.horasAsignadas || 0);
                setHorasCompletadas(data.horasCompletadas || 0);
            } catch {
                /* En caso de error usar datos del alumno como fallback */
                const fallback = ASIGNATURAS_CAP.map(asig => ({
                    asignaturaId: asig.id,
                    horasCompletadas: 0
                }));
                setProgresoAsignado(fallback);
                setProgresoCompletado(fallback);
                setHorasAsignadas(alumno.horas_completadas || 0);
                setHorasCompletadas(alumno.horas_completadas || 0);
            } finally {
                setCargando(false);
            }
        };

        cargarProgreso();
    }, [visible, alumno]);

    if (!alumno) return null;

    const normalizarNumero = (valor: number | string | undefined) => {
        if (valor === undefined || valor === null) return 0;
        const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
        return Number.isFinite(numero) ? numero : 0;
    };

    const formatearHoras = (valor: number | string | undefined) => {
        const numero = normalizarNumero(valor);
        const redondeado = Math.round(numero * 10) / 10;
        return Number.isInteger(redondeado) ? redondeado.toString() : redondeado.toFixed(1);
    };

    const horasTotales = normalizarNumero(horasCompletadas);
    const horasPlan = normalizarNumero(horasAsignadas);
    const porcentajeTotal = Math.min(100, Math.round((horasTotales / CAP_REGLAS.HORAS_TOTALES) * 100));
    const porcentajePlan = Math.min(100, Math.round((horasPlan / CAP_REGLAS.HORAS_TOTALES) * 100));

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
                        {/* Resumen general */}
                        <div className="capProgresoModal__resumen">
                            <div className="capProgresoModal__resumenPrincipal">
                                <span className="capProgresoModal__horasTotales">{formatearHoras(horasTotales)}</span>
                                <span className="capProgresoModal__horasLabel">de {CAP_REGLAS.HORAS_TOTALES}h completadas</span>
                                <span className="capProgresoModal__horasSecundarias">Plan asignado: {formatearHoras(horasPlan)}h ({porcentajePlan}%)</span>
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
                                    const progresoAsig = progresoAsignado.find(p => p.asignaturaId === asignatura.id);
                                    const progresoComp = progresoCompletado.find(p => p.asignaturaId === asignatura.id);
                                    const horasAsig = normalizarNumero(progresoAsig?.horasCompletadas);
                                    const horasComp = normalizarNumero(progresoComp?.horasCompletadas);
                                    const porcentajeAsig = Math.min(100, Math.round((horasComp / asignatura.duracionHoras) * 100));
                                    const completada = horasComp >= asignatura.duracionHoras;

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
                                                    <span className="capProgresoModal__asignaturaHorasPrim">Asignadas: {formatearHoras(horasAsig)}/{asignatura.duracionHoras}h</span>
                                                    <span className="capProgresoModal__asignaturaHorasSec">Completadas: {formatearHoras(horasComp)}h</span>
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
                            <p className="capProgresoModal__infoTexto capProgresoModal__infoNota">
                                El progreso muestra horas asignadas. Clases con fecha pasada cuentan como completadas.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

export default ModalProgresoAlumno;
