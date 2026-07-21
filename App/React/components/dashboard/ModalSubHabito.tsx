/*
 * ModalSubHabito
 * Modal para configurar un subhábito individual.
 * Reutiliza FormularioHabitoModerno para consistencia visual con ModalHabito.
 * Abre desde ListaSubHabitos o desde el menú contextual de subhábitos en Ejecución.
 *
 * [217A-2] Configuración independiente de subhábitos.
 * [217A-2b] Reutiliza FormularioHabitoModerno en vez de formulario propio.
 */

import type {SubHabito, Habito} from '../../types/dashboard';
import {AccionesFormulario, Modal} from '../shared';
import {FormularioHabitoModerno} from './habitos/FormularioHabitoModerno';
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
                <FormularioHabitoModerno
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
                    onPausarHabito={manejarPausarHabito}
                    habito={habitoPadre}
                    modoEdicion={true}
                    errorNombre={errores.nombre}
                />
            </div>
            <AccionesFormulario onCancelar={onCerrar} onGuardar={manejarGuardar} textoGuardar="Guardar" />
        </Modal>
    );
}
