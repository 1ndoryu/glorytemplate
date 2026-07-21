/**
 * MapaCalorHabito
 *
 * Componente especializado para visualizar y editar el historial de un habito.
 * Permite marcar retroactivamente dias como completados o pospuestos.
 *
 * Interaccion:
 * - Click: cicla entre estados (vacio -> completado -> pospuesto -> vacio)
 *
 * @package App/React/components/shared
 */

import {useMapaCalorHabito} from '../../hooks/shared/useMapaCalorHabito';
import {formatearFechaTooltip, DIAS_SEMANA_CORTO, MESES} from '../../utils/mapaCalorUtils';
import type {FrecuenciaHabito} from '../../types/dashboard';
import type {EstadoHabito} from '../../types/historialHabitos';

/* Tipos */
interface MapaCalorHabitoProps {
    habitoId: number;
    periodo?: 'semana' | 'mes';
    compacto?: boolean;
    /* Modo modal: ancho 100%, sin leyenda/stats, con tooltip */
    enModal?: boolean;
    /* Frecuencia del hábito (para determinar días relevantes) */
    frecuencia?: FrecuenciaHabito;
    /* Fecha de creación del hábito (para calcular ciclos) */
    fechaCreacion?: string;
    /* [217A-3] Overrides opcionales para subhábitos */
    historialCompletados?: string[];
    historialPospuestos?: string[];
    onMarcarDia?: (fecha: string, estado: EstadoHabito) => boolean;
    onDesmarcarDia?: (fecha: string) => boolean;
}

/**
 * Componente principal del Mapa de Calor para Hábitos
 */
export function MapaCalorHabito({habitoId, periodo = 'mes', compacto = false, enModal = false, frecuencia, fechaCreacion, historialCompletados, historialPospuestos, onMarcarDia, onDesmarcarDia}: MapaCalorHabitoProps): JSX.Element {
    const {
        contenedorRef, fechas: _fechas, semanas,
        estadoGuardado, errorGuardado,
        obtenerEstadoDia, manejarClick, obtenerClaseEstado,
        estadisticasCalculadas, esRelevanteDia,
        mostrarEstadoCargando, mostrarEstadisticas, mostrarLeyenda,
        esHoy, esEditable
    } = useMapaCalorHabito({habitoId, periodo, compacto, enModal, frecuencia, fechaCreacion, historialCompletados, historialPospuestos, onMarcarDia, onDesmarcarDia});

    /* Renderizar celda */
    const renderCelda = (fecha: string, index: number) => {
        if (!fecha) {
            return <div key={`vacio-${index}`} className="mapaCalorHabitoCelda mapaCalorHabitoCelda--placeholder" />;
        }

        const estadoDia = obtenerEstadoDia(fecha);
        const esEditableDia = esEditable(fecha);
        const esHoyFecha = esHoy(fecha);
        const esRelevante = esRelevanteDia(fecha);

        const clase = obtenerClaseEstado(estadoDia, esEditableDia, esHoyFecha, esRelevante);

        /* Tooltip con fecha formateada + indicador de no relevante */
        let tooltipTexto = enModal ? formatearFechaTooltip(fecha) : undefined;
        if (tooltipTexto && !esRelevante) {
            tooltipTexto += ' (día libre)';
        }

        return (
            <div
                key={fecha}
                className={clase}
                onClick={e => manejarClick(fecha, e)}
                onContextMenu={e => e.preventDefault()}
                title={tooltipTexto}
                role={esEditableDia ? 'button' : undefined}
                tabIndex={esEditableDia ? 0 : undefined}
                onKeyDown={
                    esEditableDia
                        ? e => {
                              if (e.key === 'Enter') manejarClick(fecha, e as unknown as React.MouseEvent);
                          }
                        : undefined
                }
            />
        );
    };

    /* Usar el estado del store para mostrar errores */

    if (errorGuardado && estadoGuardado === 'error') {
        return (
            <div className="mapaCalorHabitoContenedor mapaCalorHabitoContenedor--error">
                <span className="mapaCalorHabitoError">{errorGuardado}</span>
            </div>
        );
    }

    /* Ocultar encabezado con estadisticas si estamos en modal */

    /* Solo mostrar estado de carga visual si NO hay datos y está guardando */

    return (
        <div ref={contenedorRef} id="mapa-calor-habito" className={`mapaCalorHabitoContenedor ${compacto ? 'mapaCalorHabitoContenedor--compacto' : ''} ${enModal ? 'mapaCalorHabitoContenedor--modal' : ''} ${mostrarEstadoCargando ? 'mapaCalorHabitoContenedor--cargando' : ''}`}>
            {/* Encabezado con estadisticas dinamicas - oculto en modal */}
            {mostrarEstadisticas && (
                <div className="mapaCalorHabitoEncabezado">
                    <div className="mapaCalorHabitoStats">
                        <span className="mapaCalorHabitoStat mapaCalorHabitoStat--completado">
                            <strong>{estadisticasCalculadas.completados}</strong> completados
                        </span>
                        <span className="mapaCalorHabitoStat mapaCalorHabitoStat--pospuesto">
                            <strong>{estadisticasCalculadas.pospuestos}</strong> pospuestos
                        </span>
                        <span className="mapaCalorHabitoStat">
                            <strong>{estadisticasCalculadas.porcentajeCumplimiento}%</strong> cumplimiento
                        </span>
                    </div>
                </div>
            )}

            {/* Grid de dias */}
            <div className="mapaCalorHabitoCuerpo">
                {/* Etiquetas de dias de la semana (solo Lun, Mie, Vie) */}
                {!compacto && (
                    <div className="mapaCalorHabitoDiasSemana">
                        {DIAS_SEMANA_CORTO.map((dia, idx) => (
                            <span key={`dia-${idx}`} className="mapaCalorHabitoDiaSemana">
                                {idx === 1 || idx === 3 || idx === 5 ? dia : ''}
                            </span>
                        ))}
                    </div>
                )}

                {/* Contenedor de grid con indicadores de mes */}
                <div className="mapaCalorHabitoGridContenedor">
                    {/* Indicadores de mes */}
                    {!compacto && (
                        <div className="mapaCalorHabitoMeses">
                            {semanas.map((semana, idxSemana) => {
                                const primeraFecha = semana.find(f => f);
                                let mostrarMes = false;
                                let mesTexto = '';

                                if (primeraFecha) {
                                    const fechaDate = new Date(primeraFecha + 'T12:00:00');
                                    mesTexto = MESES[fechaDate.getMonth()];

                                    if (idxSemana === 0) {
                                        mostrarMes = true;
                                    } else {
                                        /* Verificar si cambió el mes respecto a la semana anterior */
                                        const semanaAnterior = semanas[idxSemana - 1];
                                        const fechaAnterior = semanaAnterior.find(f => f);
                                        if (fechaAnterior) {
                                            const fechaAntDate = new Date(fechaAnterior + 'T12:00:00');
                                            const mesAnt = MESES[fechaAntDate.getMonth()];
                                            if (mesAnt !== mesTexto) {
                                                mostrarMes = true;
                                            }
                                        }
                                    }
                                }

                                return (
                                    <span key={`mes-${idxSemana}`} className="mapaCalorHabitoMes">
                                        {mostrarMes ? mesTexto : ''}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Cuadricula de celdas */}
                    <div className="mapaCalorHabitoGrid">
                        {semanas.map((semana, idxSemana) => (
                            <div key={`semana-${idxSemana}`} className="mapaCalorHabitoSemana">
                                {semana.map((fecha, idxDia) => renderCelda(fecha, idxDia))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leyenda - oculta en modal */}
            {mostrarLeyenda && (
                <div className="mapaCalorHabitoLeyenda">
                    <div className="mapaCalorHabitoLeyendaItem">
                        <div className="mapaCalorHabitoCelda mapaCalorHabitoCelda--vacio mapaCalorHabitoCelda--leyenda" />
                        <span>Sin registro</span>
                    </div>
                    <div className="mapaCalorHabitoLeyendaItem">
                        <div className="mapaCalorHabitoCelda mapaCalorHabitoCelda--completado mapaCalorHabitoCelda--leyenda" />
                        <span>Completado</span>
                    </div>
                    <div className="mapaCalorHabitoLeyendaItem">
                        <div className="mapaCalorHabitoCelda mapaCalorHabitoCelda--pospuesto mapaCalorHabitoCelda--leyenda" />
                        <span>Pospuesto</span>
                    </div>
                </div>
            )}
        </div>
    );
}
