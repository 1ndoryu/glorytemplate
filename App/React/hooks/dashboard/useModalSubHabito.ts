/*
 * useModalSubHabito
 * Hook que encapsula la lógica del modal de configuración de subhábito.
 * Similar a useModalHabito pero simplificado: sin chat, sin mapa de calor, sin sub-subhábitos.
 *
 * [217A-2] Configuración independiente de subhábitos.
 */

import {useState, useCallback, useEffect} from 'react';
import type {NivelImportancia, FrecuenciaHabito, SubHabito, Habito, DatosNuevoSubHabito, VentanaOportunidad} from '../../types/dashboard';
import {FRECUENCIA_POR_DEFECTO} from '../../types/dashboard';
import {useHabitosStore} from '../../stores/habitosStore';
import {obtenerFechaHoy} from '../../utils/fecha';
import type {EstadoHabito} from '../../components/shared';

export interface UseModalSubHabitoProps {
    estaAbierto: boolean;
    onCerrar: () => void;
    subhabito: SubHabito | null;
    habitoPadre: Habito | null;
}

export interface UseModalSubHabitoReturn {
    nombre: string;
    setNombre: (v: string) => void;
    descripcion: string;
    setDescripcion: (v: string) => void;
    importancia: NivelImportancia;
    setImportancia: (v: NivelImportancia) => void;
    frecuencia: FrecuenciaHabito;
    setFrecuencia: (v: FrecuenciaHabito) => void;
    ventanaOportunidad: VentanaOportunidad | undefined;
    setVentanaOportunidad: (v: VentanaOportunidad | undefined) => void;
    errores: {nombre?: string};
    estadoHoy: EstadoHabito;
    manejarCambioEstado: (nuevoEstado: EstadoHabito) => void;
    manejarGuardar: () => void;
    manejarCerrarConGuardado: () => void;
    manejarPausarHabito: (() => void) | undefined;
}

export function useModalSubHabito({estaAbierto, onCerrar, subhabito, habitoPadre}: UseModalSubHabitoProps): UseModalSubHabitoReturn {
    const [nombre, setNombre] = useState(subhabito?.nombre || '');
    const [descripcion, setDescripcion] = useState('');
    const [importancia, setImportancia] = useState<NivelImportancia>(subhabito?.importancia || 'Media');
    const [frecuencia, setFrecuencia] = useState<FrecuenciaHabito>(subhabito?.frecuencia || FRECUENCIA_POR_DEFECTO);
    const [ventanaOportunidad, setVentanaOportunidad] = useState<VentanaOportunidad | undefined>(subhabito?.ventanaOportunidad);
    const [errores, setErrores] = useState<{nombre?: string}>({});

    /* Store actions */
    const editarSubHabito = useHabitosStore(state => state.editarSubHabito);
    const toggleSubHabito = useHabitosStore(state => state.toggleSubHabito);
    const posponerSubHabito = useHabitosStore(state => state.posponerSubHabitoConTiempo);
    const hoy = obtenerFechaHoy();

    /* Estado de hoy del subhábito */
    let estadoHoy: EstadoHabito = 'pendiente';
    if (subhabito) {
        if (subhabito.historialCompletados?.includes(hoy) || subhabito.ultimoCompletado === hoy) estadoHoy = 'completado';
        else if (subhabito.historialPospuestos?.includes(hoy)) estadoHoy = 'pospuesto';
    }

    /* Sincronizar estado cuando cambia el subhábito */
    useEffect(() => {
        if (subhabito) {
            setNombre(subhabito.nombre);
            setDescripcion('');
            setImportancia(subhabito.importancia);
            setFrecuencia(subhabito.frecuencia || FRECUENCIA_POR_DEFECTO);
            setVentanaOportunidad(subhabito.ventanaOportunidad);
        } else {
            setNombre('');
            setDescripcion('');
            setImportancia('Media');
            setFrecuencia(FRECUENCIA_POR_DEFECTO);
            setVentanaOportunidad(undefined);
        }
        setErrores({});
    }, [subhabito?.id, estaAbierto]);

    /* Cambiar estado (toggle/posponer) */
    const manejarCambioEstado = useCallback(
        (nuevoEstado: EstadoHabito) => {
            if (!subhabito || !habitoPadre) return;
            if (nuevoEstado === 'completado') {
                toggleSubHabito(habitoPadre.id, subhabito.id);
            } else if (nuevoEstado === 'pospuesto') {
                /* Posponer por día (historialPospuestos) */
                const estabaPospuestoHoy = subhabito.historialPospuestos?.includes(hoy) ?? false;
                if (!estabaPospuestoHoy) {
                    editarSubHabito(habitoPadre.id, subhabito.id, {
                        nombre: subhabito.nombre,
                        importancia: subhabito.importancia,
                        frecuencia: subhabito.frecuencia
                    });
                }
            } else if (nuevoEstado === 'pendiente') {
                if (estadoHoy === 'completado') toggleSubHabito(habitoPadre.id, subhabito.id);
            }
        },
        [subhabito, habitoPadre, estadoHoy, hoy, toggleSubHabito, editarSubHabito]
    );

    /* Validar */
    const validarFormulario = useCallback((): boolean => {
        const nuevosErrores: {nombre?: string} = {};
        if (!nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        } else if (nombre.trim().length < 2) {
            nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
        }
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }, [nombre]);

    /* Guardar */
    const manejarGuardar = useCallback(() => {
        if (!validarFormulario() || !subhabito || !habitoPadre) return;
        editarSubHabito(habitoPadre.id, subhabito.id, {
            nombre: nombre.trim(),
            importancia,
            frecuencia,
            ventanaOportunidad
        });
        onCerrar();
    }, [nombre, importancia, frecuencia, ventanaOportunidad, subhabito, habitoPadre, validarFormulario, editarSubHabito, onCerrar]);

    /* Cerrar con auto-guardado */
    const manejarCerrarConGuardado = useCallback(() => {
        if (nombre.trim().length >= 2) {
            manejarGuardar();
        } else {
            onCerrar();
        }
    }, [nombre, manejarGuardar, onCerrar]);

    /* Pausar subhábito */
    const manejarPausarHabito = subhabito && habitoPadre
        ? () => {
              editarSubHabito(habitoPadre.id, subhabito.id, {
                  nombre: subhabito.nombre,
                  importancia: subhabito.importancia,
                  frecuencia: subhabito.frecuencia
              });
          }
        : undefined;

    return {
        nombre,
        setNombre,
        descripcion,
        setDescripcion,
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
    };
}
