/*
 * Hook: useModalColeccion
 * Lógica del modal de crear/editar colección (estado de formulario, guardado).
 * Extraído de ModalColeccion.tsx para cumplir SRP.
 */

import { useState, useCallback, useEffect } from 'react';
import { crearColeccion, actualizarColeccion } from '@app/services/apiColecciones';
import { crearLogger } from '@app/services/logger';
import type { Coleccion } from '@app/types';

const log = crearLogger('ModalColeccion');

interface UseModalColeccionParams {
    abierto: boolean;
    onCerrar: () => void;
    onGuardar?: (coleccion: Coleccion) => void;
    coleccion?: Coleccion | null;
}

export const useModalColeccion = ({
    abierto,
    onCerrar,
    onGuardar,
    coleccion = null,
}: UseModalColeccionParams) => {
    const esEdicion = coleccion !== null;

    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [esPublica, setEsPublica] = useState(false);
    const [guardando, setGuardando] = useState(false);

    /* Pre-rellenar en modo edición */
    useEffect(() => {
        if (coleccion) {
            setNombre(coleccion.nombre);
            setDescripcion(coleccion.descripcion);
            setEsPublica(coleccion.esPublica);
        } else {
            setNombre('');
            setDescripcion('');
            setEsPublica(false);
        }
    }, [coleccion, abierto]);

    const manejarGuardar = useCallback(async () => {
        if (!nombre.trim() || guardando) return;

        setGuardando(true);
        try {
            if (esEdicion && coleccion) {
                const resp = await actualizarColeccion(coleccion.id, {
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    esPublica,
                });
                if (resp.ok && resp.data) {
                    onGuardar?.(resp.data);
                    log.info('Colección actualizada', { id: coleccion.id });
                }
            } else {
                const resp = await crearColeccion({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    esPublica,
                });
                if (resp.ok && resp.data) {
                    onGuardar?.(resp.data);
                    log.info('Colección creada', { nombre: nombre.trim() });
                }
            }
            onCerrar();
        } catch (err) {
            log.error('Error guardando colección', err);
        } finally {
            setGuardando(false);
        }
    }, [nombre, descripcion, esPublica, guardando, esEdicion, coleccion, onCerrar, onGuardar]);

    const titulo = esEdicion ? 'Editar colección' : 'Nueva colección';

    return {
        esEdicion,
        nombre,
        setNombre,
        descripcion,
        setDescripcion,
        esPublica,
        setEsPublica,
        guardando,
        manejarGuardar,
        titulo,
    };
};
