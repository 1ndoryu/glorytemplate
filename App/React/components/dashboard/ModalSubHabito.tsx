/*
 * ModalSubHabito
 * Modal para configurar un subhábito individual.
 * Abre desde ListaSubHabitos o desde el menú contextual de subhábitos en Ejecución.
 *
 * [217A-2] Configuración independiente de subhábitos.
 */

import type {SubHabito, Habito} from '../../types/dashboard';
import {AccionesFormulario, Modal} from '../shared';
import {FormularioSubHabito} from './habitos/FormularioSubHabito';
import {useModalSubHabito} from '../../hooks/dashboard/useModalSubHabito';

interface ModalSubHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    subhabito: SubHabito | null;
    habitoPadre: Habito | null;
}

export function ModalSubHabito({estaAbierto, onCerrar, subhabito, habitoPadre}: ModalSubHabitoProps): JSX.Element | null {
    const {
        nombre,
        setNombre,
        importancia,
        setImportancia,
        frecuencia,
        setFrecuencia,
        ventanaOportunidad,
        setVentanaOportunidad,
        errores,
        estadoHoy,
        manejarCambioEstado,
        manejarGuardar,
        manejarCerrarConGuardado,
        manejarPausarHabito
    } = useModalSubHabito({estaAbierto, onCerrar, subhabito, habitoPadre});

    if (!subhabito || !habitoPadre) return null;

    return (
        <Modal estaAbierto={estaAbierto} onCerrar={manejarCerrarConGuardado} titulo="Configurar subhábito" claseExtra="modalContenedor--moderno">
            <div className="formularioHabito">
                <FormularioSubHabito
                    nombre={nombre}
                    onNombreChange={setNombre}
                    importancia={importancia}
                    onImportanciaChange={setImportancia}
                    frecuencia={frecuencia}
                    onFrecuenciaChange={setFrecuencia}
                    ventanaOportunidad={ventanaOportunidad}
                    onVentanaOportunidadChange={setVentanaOportunidad}
                    estadoHoy={estadoHoy}
                    onEstadoChange={manejarCambioEstado}
                    onPausarSubHabito={manejarPausarHabito}
                    subhabito={subhabito}
                    errorNombre={errores.nombre}
                />
            </div>
            <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar="Guardar" />
        </Modal>
    );
}
