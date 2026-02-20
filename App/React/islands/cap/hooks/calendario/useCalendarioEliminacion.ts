/**
 * useCalendarioEliminacion
 * 
 * Eliminación individual de clases y limpieza de semana completa.
 * Responsabilidad: comunicación con API para borrar clases.
 */

import {useState, useCallback} from 'react';
import {API_BASE} from '../../constants';
import {obtenerMensajeContextual, procesarErrorApi} from '../../constants/cap-errores';
import type {EstadoBase} from './tipos';

interface Props {
    base: EstadoBase;
    cerrarModalEdicion: () => void;
    /* setGenerando del hook de generación, se reutiliza para indicar operación de limpieza */
    setGenerando: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCalendarioEliminacion({base, cerrarModalEdicion, setGenerando}: Props) {
    const {setClases, semanaActual, setError, getNonce, formatearFechaApi, guardarSnapshot} = base;
    const [eliminando, setEliminando] = useState(false);

    /* Eliminar una clase (con opción de forzar si está bloqueada) */
    const eliminarClase = useCallback(
        async (claseId: number, forzar: boolean) => {
            guardarSnapshot();
            setEliminando(true);
            setError(null);

            try {
                const url = forzar ? `${API_BASE}/clases/${claseId}?forzar=true` : `${API_BASE}/clases/${claseId}`;

                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'X-WP-Nonce': getNonce()
                    }
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'eliminar');
                    throw new Error(mensajeError);
                }

                setClases(prev => prev.filter(c => c.id !== claseId));
                cerrarModalEdicion();
            } catch (err) {
                const contextual = obtenerMensajeContextual('calendario', 'eliminar');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setEliminando(false);
            }
        },
        [getNonce, cerrarModalEdicion, guardarSnapshot, setClases, setError]
    );

    /* Borrar todas las clases de la semana actual (reversible con undo) */
    const borrarSemanaCompleta = useCallback(
        async (incluirBloqueadas: boolean = false) => {
            guardarSnapshot();
            setGenerando(true);
            setError(null);

            try {
                const fechaLunes = formatearFechaApi(semanaActual);

                const response = await fetch(`${API_BASE}/clases/limpiar-semana`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': getNonce()
                    },
                    body: JSON.stringify({
                        fecha: fechaLunes,
                        incluirBloqueadas
                    })
                });

                if (!response.ok) {
                    const mensajeError = await procesarErrorApi(response, 'calendario', 'limpiar');
                    throw new Error(mensajeError);
                }

                const data = await response.json();

                if (data.exito) {
                    setClases([]);
                } else {
                    throw new Error(data.error || 'Error al limpiar la semana');
                }
            } catch (err) {
                const contextual = obtenerMensajeContextual('calendario', 'limpiar');
                setError(err instanceof Error ? err.message : `${contextual.fallback} ${contextual.sugerencia}`);
            } finally {
                setGenerando(false);
            }
        },
        [semanaActual, getNonce, formatearFechaApi, guardarSnapshot, setClases, setError, setGenerando]
    );

    return {eliminando, eliminarClase, borrarSemanaCompleta};
}
