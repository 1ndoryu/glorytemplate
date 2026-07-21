/*
 * ModalesHabitos
 * Agrupa modales relacionados con hábitos
 * Incluye: ModalHabito (crear/editar), BottomSheetHabito (móvil crear/editar)
 */

import {ModalHabito} from '../ModalHabito';
import {ModalSubHabito} from '../ModalSubHabito';
import {BottomSheetHabito} from '../BottomSheetHabito';

import type {DashboardCompletoRetorno} from '../../../hooks/useDashboardCompleto';
import type {DatosNuevoHabito, DatosEdicionTarea, SubHabito} from '../../../types/dashboard';
import type {DatosHabito} from '../BottomSheetHabito';

interface ModalesHabitosProps {
    dashboard: DashboardCompletoRetorno['dashboard'];
    modales: DashboardCompletoRetorno['modales'];
    esMovil: boolean;
    manejarCrearHabitoConLimite: (datos: DatosNuevoHabito) => Promise<void>;
    manejarCrearTareaConLimite: (datos: DatosEdicionTarea) => void;
    manejarGuardarHabitoBottomSheet: (datos: DatosHabito) => Promise<void>;
}

export function ModalesHabitos({dashboard, modales, esMovil, manejarCrearHabitoConLimite, manejarCrearTareaConLimite, manejarGuardarHabitoBottomSheet}: ModalesHabitosProps): JSX.Element {
    /* Handler para guardar hábito desde BottomSheet en modo edición */
    const manejarGuardarHabitoEdicion = async (datos: DatosHabito) => {
        if (datos.id) {
            /* Modo edición */
            await dashboard.editarHabito(datos.id, {
                nombre: datos.texto,
                frecuencia: {tipo: (datos.frecuencia || 'diaria') as import('../../../types/dashboard').TipoFrecuencia},
                importancia: (datos.importancia || 'Media') as import('../../../types/dashboard').NivelImportancia,
                tags: []
            });
        } else {
            /* Modo creación (fallback) */
            await manejarGuardarHabitoBottomSheet(datos);
        }
    };

    return (
        <>
            {/* Modal crear hábito */}
            <ModalHabito estaAbierto={dashboard.modalCrearHabitoAbierto} onCerrar={dashboard.cerrarModalCrearHabito} onGuardar={manejarCrearHabitoConLimite} />

            {/* Modal editar hábito (desktop) */}
            <ModalHabito
                estaAbierto={dashboard.habitoEditando !== null}
                onCerrar={dashboard.cerrarModalEditarHabito}
                onGuardar={datos => dashboard.editarHabito(dashboard.habitoEditando!.id, datos)}
                onPausarHabito={dashboard.pausarHabito}
                habito={dashboard.habitoEditando ?? undefined}
                /* Props para tareas del hábito - Fase 14.8 */
                tareas={dashboard.tareas}
                onToggleTarea={dashboard.toggleTarea}
                onCrearTarea={manejarCrearTareaConLimite}
                onEliminarTarea={dashboard.eliminarTarea}
                onConfigurarTarea={modales.abrirModalEditarTarea}
                onActualizarOrdenTareasHabito={dashboard.actualizarOrdenTareasHabito}
                onEditarTarea={dashboard.editarTarea}
                onConfigurarSubHabito={dashboard.habitoEditando ? (subhabito: SubHabito) => dashboard.abrirModalEditarSubHabito(dashboard.habitoEditando!.id, subhabito.id) : undefined}
            />

            {/* BottomSheet móvil para crear hábito */}
            {esMovil && modales.modalCreacionRapida === 'habito' && <BottomSheetHabito estaAbierto={true} onCerrar={modales.cerrarCreacionRapida} onGuardar={manejarGuardarHabitoBottomSheet} />}

            {/* BottomSheet móvil para editar hábito */}
            {esMovil && modales.habitoEditandoMovil && (
                <BottomSheetHabito
                    estaAbierto={true}
                    onCerrar={modales.cerrarEdicionHabitoMovil}
                    onGuardar={manejarGuardarHabitoEdicion}
                    habitoExistente={modales.habitoEditandoMovil}
                    onAbrirConfiguracion={() => {
                        /* Cerrar BottomSheet y abrir modal completo de configuración */
                        const habito = modales.habitoEditandoMovil;
                        modales.cerrarEdicionHabitoMovil();
                        if (habito) {
                            dashboard.abrirModalEditarHabito(habito);
                        }
                    }}
                />
            )}

            {/* [217A-2] Modal configuración independiente de subhábito */}
            <ModalSubHabito
                estaAbierto={dashboard.subHabitoEditando !== null}
                onCerrar={dashboard.cerrarModalEditarSubHabito}
                subhabito={dashboard.subHabitoEditando}
                habitoPadre={dashboard.habitoPadreDelSubHabito}
            />
        </>
    );
}
