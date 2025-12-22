/*
 * ModalConfiguracionHabitos
 * Modal para ajustar preferencias de visualización del panel de hábitos
 */

import {Settings} from 'lucide-react';
import {Modal} from '../shared/Modal';
import {ToggleSwitch} from '../shared/ToggleSwitch';
import type {ConfiguracionHabitos, ColumnasHabitos} from '../../hooks/useConfiguracionHabitos';

interface ModalConfiguracionHabitosProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    configuracion: ConfiguracionHabitos;
    onToggleCompletadosHoy: () => void;
    onToggleModoCompacto: () => void;
    onToggleColumna: (columna: keyof ColumnasHabitos) => void;
}

export function ModalConfiguracionHabitos({estaAbierto, onCerrar, configuracion, onToggleCompletadosHoy, onToggleModoCompacto, onToggleColumna}: ModalConfiguracionHabitosProps): JSX.Element {
    interface InfoColumna {
        etiqueta: string;
        descripcion: string;
    }

    // Mapeo de nombres legibles y descripciones
    const infoColumnas: Record<keyof ColumnasHabitos, InfoColumna> = {
        indice: {
            etiqueta: 'Índice (#)',
            descripcion: 'Muestra el checkbox para completar'
        },
        nombre: {
            etiqueta: 'Nombre',
            descripcion: 'El nombre del hábito (fijo)'
        },
        racha: {
            etiqueta: 'Racha',
            descripcion: 'Contador de días seguidos'
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
            descripcion: 'Botones rápidos al pasar el mouse'
        },
        urgencia: {
            etiqueta: 'Urgencia',
            descripcion: 'Barra de progreso visual'
        },
        inactividad: {
            etiqueta: 'Inactividad',
            descripcion: 'Días sin realizar el hábito'
        }
    };

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={onCerrar} titulo="Configuración de Hábitos">
            <div className="contenedorOpcionesConfig">
                {/* Opcion 1: Ocultar Completados */}
                <div className="itemOpcionConfig">
                    <div className="detallesOpcionConfig">
                        <span className="tituloOpcionConfig">Ocultar hábitos completados hoy</span>
                        <span className="descripcionOpcionConfig">Los hábitos ya realizados desaparecerán de la lista hasta mañana</span>
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

                {/* Seccion: Columnas Visibles */}
                <div className="seccionConfiguracion">
                    <h4 className="tituloSeccionConfig">Columnas Visibles</h4>
                    <div className="gridOpcionesColumnas">
                        {(Object.keys(configuracion.columnasVisibles) as Array<keyof ColumnasHabitos>).map(columna => {
                            // No permitir ocultar Nombre, es esencial
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
