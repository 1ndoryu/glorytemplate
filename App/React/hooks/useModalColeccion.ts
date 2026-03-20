/*
 * Hook: useModalColeccion
 * Lógica del modal de crear/editar colección (estado de formulario, guardado, imagen).
 * Extraído de ModalColeccion.tsx para cumplir SRP.
 */

import { useState, useCallback, useEffect } from 'react';
import { crearColeccion, actualizarColeccion, subirImagenColeccion, listarColecciones } from '@app/services/apiColecciones';
import { crearLogger } from '@app/services/logger';
import { toast } from '@app/stores/toastStore';
import { getT } from '@app/utils/i18n';
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
    const [esPublica, setEsPublica] = useState(true);
    const [guardando, setGuardando] = useState(false);
    /* Estado de imagen — solo relevante en modo edición */
    const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
    const [previewImagen, setPreviewImagen] = useState<string | null>(null);

    /* QL114: Estado de parentId + opciones de colecciones padre */
    const [parentId, setParentId] = useState<number | null>(null);
    const [opcionesPadre, setOpcionesPadre] = useState<{ valor: string; etiqueta: string }[]>([]);

    /* Pre-rellenar en modo edición y limpiar al cerrar */
    useEffect(() => {
        if (coleccion) {
            setNombre(coleccion.nombre);
            setDescripcion(coleccion.descripcion);
            setEsPublica(coleccion.esPublica);
            setPreviewImagen(coleccion.imagenUrl ?? null);
            setParentId(coleccion.parentId ?? null);
        } else {
            setNombre('');
            setDescripcion('');
            setEsPublica(true);
            setPreviewImagen(null);
            setParentId(null);
        }
        setArchivoImagen(null);
    }, [coleccion, abierto]);

    /*
     * QL114: Cargar colecciones del usuario para opciones de padre.
     * Solo en modo edición y al abrir el modal.
     * Excluye la colección actual y sus subcolecciones del listado.
     */
    useEffect(() => {
        if (!abierto || !esEdicion) {
            setOpcionesPadre([]);
            return;
        }
        const cargar = async () => {
            const resp = await listarColecciones();
            if (!resp.ok || !resp.data) return;

            /* Flatten: listarColecciones devuelve padres con .subcolecciones anidadas */
            const idActual = coleccion?.id ?? 0;
            const opciones: { valor: string; etiqueta: string }[] = [
                { valor: '', etiqueta: 'Sin padre (colección raíz)' },
            ];
            for (const col of resp.data.colecciones) {
                /* Excluir la coleccion actual */
                if (col.id === idActual) continue;
                /* Solo colecciones raíz pueden ser padres (profundidad max = 2) */
                if (col.parentId !== null) continue;
                opciones.push({ valor: String(col.id), etiqueta: col.nombre });
            }
            setOpcionesPadre(opciones);
        };
        cargar();
    }, [abierto, esEdicion, coleccion?.id]);

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
                        toast.error(getT()('error.upload'));
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
                /* QL114: Incluir parentId si cambió respecto al original */
                const parentIdOriginal = coleccion.parentId ?? null;
                if (parentId !== parentIdOriginal) {
                    datos.parentId = parentId;
                }
                const resp = await actualizarColeccion(coleccion.id, datos);
                if (resp.ok) {
                    /*
                     * El PUT solo retorna {ok:true}, no la colección completa.
                     * Fusionamos los campos editados con el estado existente para
                     * preservar samples, likes, tags, etc. sin roundtrip extra a BD.
                     */
                    const actualizada: Coleccion = {
                        ...coleccion,
                        nombre: nombre.trim(),
                        descripcion: descripcion.trim(),
                        esPublica,
                        parentId,
                        ...(imagenUrl !== undefined ? { imagenUrl } : {}),
                    };
                    onGuardar?.(actualizada);
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
        parentId,
        setParentId,
        opcionesPadre,
    };
};
