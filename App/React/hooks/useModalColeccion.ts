/*
 * Hook: useModalColeccion
 * Lógica del modal de crear/editar colección (estado de formulario, guardado, imagen).
 * Extraído de ModalColeccion.tsx para cumplir SRP.
 */

import { useState, useCallback, useEffect } from 'react';
import { crearColeccion, actualizarColeccion, subirImagenColeccion } from '@app/services/apiColecciones';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
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
    /* Estado de imagen — solo relevante en modo edición */
    const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
    const [previewImagen, setPreviewImagen] = useState<string | null>(null);

    /* Pre-rellenar en modo edición y limpiar al cerrar */
    useEffect(() => {
        if (coleccion) {
            setNombre(coleccion.nombre);
            setDescripcion(coleccion.descripcion);
            setEsPublica(coleccion.esPublica);
            setPreviewImagen(coleccion.imagenUrl ?? null);
        } else {
            setNombre('');
            setDescripcion('');
            setEsPublica(false);
            setPreviewImagen(null);
        }
        setArchivoImagen(null);
    }, [coleccion, abierto]);

    /* Liberar object URLs creadas para preview local */
    useEffect(() => {
        return () => {
            if (previewImagen && previewImagen.startsWith('blob:')) {
                URL.revokeObjectURL(previewImagen);
            }
        };
    }, [previewImagen]);

    /* Selección de archivo de imagen — crea preview local inmediato */
    const manejarSeleccionImagen = useCallback((archivo: File) => {
        if (previewImagen && previewImagen.startsWith('blob:')) {
            URL.revokeObjectURL(previewImagen);
        }
        setArchivoImagen(archivo);
        setPreviewImagen(URL.createObjectURL(archivo));
    }, [previewImagen]);

    const manejarGuardar = useCallback(async () => {
        if (!nombre.trim() || guardando) return;

        setGuardando(true);
        try {
            if (esEdicion && coleccion) {
                /* Si hay nueva imagen, subirla primero y obtener la URL */
                let imagenUrl: string | null | undefined = undefined;
                if (archivoImagen) {
                    const respImagen = await subirImagenColeccion(coleccion.id, archivoImagen);
                    if (respImagen.ok && respImagen.data) {
                        imagenUrl = respImagen.data.imagenUrl;
                    } else {
                        toast.error('No se pudo subir la imagen');
                        setGuardando(false);
                        return;
                    }
                }
                const datos: Parameters<typeof actualizarColeccion>[1] = {
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    esPublica,
                };
                if (imagenUrl !== undefined) datos.imagenUrl = imagenUrl;
                const resp = await actualizarColeccion(coleccion.id, datos);
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
    }, [nombre, descripcion, esPublica, guardando, esEdicion, coleccion, archivoImagen, onCerrar, onGuardar]);

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
        manejarSeleccionImagen,
        previewImagen,
        titulo,
    };
};
