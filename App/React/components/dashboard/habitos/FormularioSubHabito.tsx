/*
 * FormularioSubHabito
 * Formulario simplificado para configuración de un subhábito individual.
 * Reutiliza la estética de FormularioHabitoModerno pero sin sub-subhábitos, mapa de calor ni chat.
 *
 * [217A-2] Configuración independiente de subhábitos.
 */

import {Pause, Play} from 'lucide-react';
import type {NivelImportancia, FrecuenciaHabito, SubHabito, VentanaOportunidad} from '../../../types/dashboard';
import {CampoTituloLimpio, SelectorImportanciaPill, SelectorFrecuenciaPill, FilaPropiedades, SelectorEstadoHabitoPill, SelectorVentanaOportunidad} from '../../shared';
import {Boton} from '../../ui';
import type {EstadoHabito} from '../../shared';

interface FormularioSubHabitoProps {
    nombre: string;
    onNombreChange: (valor: string) => void;
    importancia: NivelImportancia;
    onImportanciaChange: (valor: NivelImportancia) => void;
    frecuencia: FrecuenciaHabito;
    onFrecuenciaChange: (frecuencia: FrecuenciaHabito) => void;
    ventanaOportunidad?: VentanaOportunidad;
    onVentanaOportunidadChange?: (ventana: VentanaOportunidad | undefined) => void;
    estadoHoy?: EstadoHabito;
    onEstadoChange?: (estado: EstadoHabito) => void;
    onPausarSubHabito?: () => void;
    subhabito?: SubHabito;
    errorNombre?: string;
}

export function FormularioSubHabito({
    nombre,
    onNombreChange,
    importancia,
    onImportanciaChange,
    frecuencia,
    onFrecuenciaChange,
    ventanaOportunidad,
    onVentanaOportunidadChange,
    estadoHoy,
    onEstadoChange,
    onPausarSubHabito,
    subhabito,
    errorNombre
}: FormularioSubHabitoProps): JSX.Element {
    const estaPausado = subhabito?.pausado ?? false;

    return (
        <div id="formulario-subhabito-moderno" className="formularioProyectoModerno">
            {/* Nombre del subhábito */}
            <CampoTituloLimpio id="subhabito-nombre" valor={nombre} onChange={onNombreChange} placeholder="Ej: Meditar 10 minutos" error={errorNombre} autoFocus />

            {/* Estado del día (solo si hay subhábito) */}
            {estadoHoy && onEstadoChange && (
                <FilaPropiedades etiqueta="Estado">
                    <SelectorEstadoHabitoPill estado={estadoHoy} onChange={onEstadoChange} />
                </FilaPropiedades>
            )}

            {/* Importancia */}
            <FilaPropiedades etiqueta="Importancia">
                <SelectorImportanciaPill importancia={importancia} onChange={onImportanciaChange} />
            </FilaPropiedades>

            {/* Frecuencia */}
            <FilaPropiedades etiqueta="Frecuencia">
                <SelectorFrecuenciaPill frecuencia={frecuencia} onChange={onFrecuenciaChange} />
            </FilaPropiedades>

            {/* Ventana de oportunidad */}
            {onVentanaOportunidadChange && (
                <FilaPropiedades etiqueta="Ventana">
                    <SelectorVentanaOportunidad ventana={ventanaOportunidad} onChange={onVentanaOportunidadChange} />
                </FilaPropiedades>
            )}

            {/* Pausar subhábito */}
            {onPausarSubHabito && (
                <FilaPropiedades etiqueta="Pausar">
                    <Boton type="button" claseAdicional={`botonPausaHabito ${estaPausado ? 'botonPausaHabito--activo' : ''}`} onClick={onPausarSubHabito} title={estaPausado ? 'Reanudar subhábito' : 'Pausar subhábito'}>
                        {estaPausado ? (
                            <><Play size={14} /><span>Reanudar</span></>
                        ) : (
                            <><Pause size={14} /><span>Pausar</span></>
                        )}
                    </Boton>
                </FilaPropiedades>
            )}
        </div>
    );
}
