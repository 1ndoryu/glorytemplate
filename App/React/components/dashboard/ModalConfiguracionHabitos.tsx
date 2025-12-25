/*
 * ModalConfiguracionHabitos
 * Modal para ajustar preferencias de visualización del panel de hábitos
 */

import {Modal} from '../shared/Modal';
import {ToggleSwitch} from '../shared/ToggleSwitch';
import type {ConfiguracionHabitos, ColumnasHabitos, ToleranciaPreset} from '../../hooks/useConfiguracionHabitos';

interface ModalConfiguracionHabitosProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfiguracionHabitos;
    onToggleCompletadosHoy: () => void;
    onToggleModoCompacto: () => void;
    onToggleColumna: (columna: keyof ColumnasHabitos) => void;
    onCambiarTolerancia: (preset: ToleranciaPreset) => void;
}

interface InfoPreset {
    etiqueta: string;
    descripcion: string;
}

const PRESETS_INFO: Record<Exclude<ToleranciaPreset, 'personalizado'>, InfoPreset> = {
    muyEstricto: {
        etiqueta: 'Muy Estricto',
        descripcion: '1 día = urgente, 2+ días = bloqueante'
    },
    estricto: {
        etiqueta: 'Estricto',
        descripcion: '2 días = urgente, 4+ días = bloqueante'
    },
    moderado: {
        etiqueta: 'Moderado',
        descripcion: '3 días = urgente, 5+ días = bloqueante'
    },
    relajado: {
        etiqueta: 'Relajado',
        descripcion: '1 semana = urgente, 2+ semanas = bloqueante'
    }
};

export function ModalConfiguracionHabitos({estaAbierto, onCerrar, configuracion, onToggleCompletadosHoy, onToggleModoCompacto, onToggleColumna, onCambiarTolerancia}: ModalConfiguracionHabitosProps): JSX.Element {
    interface InfoColumna {
        etiqueta: string;
        descripcion: string;
    }

    const infoColumnas: Record<keyof ColumnasHabitos, InfoColumna> = {
        indice: {
            etiqueta: 'Indice (#)',
            descripcion: 'Muestra el checkbox para completar'
        },
        nombre: {
            etiqueta: 'Nombre',
            descripcion: 'El nombre del habito (fijo)'
        },
        racha: {
            etiqueta: 'Racha',
            descripcion: 'Contador de dias seguidos'
        },
        frecuencia: {
            etiqueta: 'Frecuencia',
            descripcion: 'Muestra si es diario, semanal...'
        },
        importancia: {
            etiqueta: 'Importancia',
            descripcion: 'Badge de prioridad Alta/Media/Baja'
        },
        tocaHoy: {
            etiqueta: 'Toca Hoy',
            descripcion: 'Indicador visual amarillo'
        },
        acciones: {
            etiqueta: 'Acciones',
            descripcion: 'Botones rapidos al pasar el mouse'
        },
        urgencia: {
            etiqueta: 'Urgencia',
            descripcion: 'Barra de progreso visual'
        },
        inactividad: {
            etiqueta: 'Inactividad',
            descripcion: 'Dias sin realizar el habito'
        }
    };

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuracion de Habitos">
            <div className="contenedorOpcionesConfig">
                {/* Opcion 1: Ocultar Completados */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Ocultar habitos completados hoy</span>
                        <span className="descripcionOpcionConfig">Los habitos ya realizados desapareceran de la lista hasta manana</span>
                    </div>
                    <ToggleSwitch checked={configuracion.ocultarCompletadosHoy} onChange={onToggleCompletadosHoy} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Opcion 2: Modo Compacto */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Modo Compacto</span>
                        <span className="descripcionOpcionConfig">Reducir el espaciado vertical de las filas</span>
                    </div>
                    <ToggleSwitch checked={configuracion.modoCompacto} onChange={onToggleModoCompacto} />
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Seccion: Tolerancia de Urgencia */}
                <div className="seccionConfiguracion">
                    <h4 className="tituloSeccionConfig">Tolerancia de Urgencia</h4>
                    <span className="descripcionSeccionConfig">Define que tan estricto es el sistema al marcar habitos como urgentes por inactividad</span>
                    <div className="gridOpcionesTolerancia">
                        {(Object.keys(PRESETS_INFO) as Array<Exclude<ToleranciaPreset, 'personalizado'>>).map(preset => {
                            const info = PRESETS_INFO[preset];
                            const estaActivo = configuracion.toleranciaPreset === preset;

                            return (
                                <button key={preset} type="button" className={`botonPresetTolerancia ${estaActivo ? 'botonPresetTolerancia--activo' : ''}`} onClick={() => onCambiarTolerancia(preset)}>
                                    <span className="etiquetaPreset">{info.etiqueta}</span>
                                    <span className="descripcionPreset">{info.descripcion}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="separadorOpcionesConfig" />

                {/* Seccion: Columnas Visibles */}
                <div className="seccionConfiguracion">
                    <h4 className="tituloSeccionConfig">Columnas Visibles</h4>
                    <div className="gridOpcionesColumnas">
                        {(Object.keys(configuracion.columnasVisibles) as Array<keyof ColumnasHabitos>).map(columna => {
                            if (columna === 'nombre') return null;

                            const info = infoColumnas[columna];

                            return (
                                <div key={columna} className="itemColumnaConfig">
                                    <div className="infoColumnaConfig">
                                        <span className="etiquetaColumna">{info.etiqueta}</span>
                                        <span className="descripcionColumna">{info.descripcion}</span>
                                    </div>
                                    <ToggleSwitch checked={configuracion.columnasVisibles[columna]} onChange={() => onToggleColumna(columna)} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
