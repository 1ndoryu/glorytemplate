/* sentinel-disable-file limite-lineas — hook cohesivo: estado demo + seed + clean + limpiarTodas son operaciones del mismo dominio con estado compartido */
/**
 * usePanelDemo
 *
 * Hook para lógica del panel de modo demo.
 * Maneja obtención de estado, poblado y limpieza de datos demo,
 * incluida la eliminación total de clases con doble confirmación.
 */

import {useState, useEffect, useCallback} from 'react';
import {API_BASE} from '../constants/cap-constants';

interface EstadoDemo {
    activo: boolean;
    permitido: boolean;
    estadisticas: {
        alumnos: number;
        clases: number;
    };
}

interface MensajeDemo {
    tipo: 'exito' | 'error';
    texto: string;
}

export function usePanelDemo() {
    const [estado, setEstado] = useState<EstadoDemo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [ejecutando, setEjecutando] = useState<'seed' | 'clean' | 'limpiarTodas' | null>(null);
    const [mensaje, setMensaje] = useState<MensajeDemo | null>(null);
    const [confirmandoLimpiarTodas, setConfirmandoLimpiarTodas] = useState(false);

    /* Obtener estado del modo demo desde la API */
    const obtenerEstado = useCallback(async (signal?: AbortSignal) => {
        try {
            const response = await fetch(`${API_BASE}/demo/status`, {
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                },
                signal
            });

            if (response.ok) {
                const data = await response.json();
                setEstado(data);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.error('Error al obtener estado demo:', error);
        } finally {
            setCargando(false);
        }
    }, []);

    /* Cargar estado inicial con cleanup */
    useEffect(() => {
        const controller = new AbortController();
        obtenerEstado(controller.signal);
        return () => controller.abort();
    }, [obtenerEstado]);

    /* Poblar datos de demostración */
    const poblarDatos = useCallback(async () => {
        setEjecutando('seed');
        setMensaje(null);

        try {
            const response = await fetch(`${API_BASE}/demo/seed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            if (!response.ok) {
                setMensaje({tipo: 'error', texto: `Error ${response.status}: ${response.statusText}`});
                return;
            }

            try {
                const data = await response.json();
                if (data.exito) {
                    setMensaje({
                        tipo: 'exito',
                        texto: `Datos creados: ${data.estadisticas?.alumnos || 0} alumnos, ${data.estadisticas?.clases || 0} clases`
                    });
                } else {
                    setMensaje({tipo: 'error', texto: data.error || 'Error al poblar datos'});
                }
            } catch {
                setMensaje({tipo: 'error', texto: 'La respuesta del servidor no es válida. Verifica el estado de los datos.'});
            }

            await obtenerEstado();
        } catch (error) {
            console.error('Error de conexión:', error);
            setMensaje({tipo: 'error', texto: 'Error de conexión al servidor'});
        } finally {
            setEjecutando(null);
        }
    }, [obtenerEstado]);

    /* Limpiar datos de demostración */
    const limpiarDatos = useCallback(async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar todos los datos de demostración?')) {
            return;
        }

        setEjecutando('clean');
        setMensaje(null);

        try {
            const response = await fetch(`${API_BASE}/demo/clean`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            const data = await response.json();

            if (data.exito) {
                setMensaje({
                    tipo: 'exito',
                    texto: `Datos eliminados: ${data.eliminados.alumnos} alumnos, ${data.eliminados.clases} clases`
                });
                obtenerEstado().catch(() => {});
            } else {
                setMensaje({tipo: 'error', texto: data.error || 'Error al limpiar datos'});
            }
        } catch {
            setMensaje({tipo: 'error', texto: 'Error de conexión al limpiar datos'});
        } finally {
            setEjecutando(null);
        }
    }, [obtenerEstado]);

    /* Eliminar TODAS las clases con doble confirmación (prompt) */
    const limpiarTodasLasClases = useCallback(async () => {
        if (!confirmandoLimpiarTodas) {
            setConfirmandoLimpiarTodas(true);
            setMensaje({tipo: 'error', texto: '¡ATENCIÓN! Esto eliminará TODAS las clases. Click de nuevo para confirmar.'});
            setTimeout(() => {
                setConfirmandoLimpiarTodas(false);
                setMensaje(null);
            }, 5000);
            return;
        }

        const confirmacion = prompt('Escribe ELIMINAR_TODO para confirmar:');
        if (confirmacion !== 'ELIMINAR_TODO') {
            setMensaje({tipo: 'error', texto: 'Operación cancelada'});
            setConfirmandoLimpiarTodas(false);
            return;
        }

        setEjecutando('limpiarTodas');
        setMensaje(null);
        setConfirmandoLimpiarTodas(false);

        try {
            const response = await fetch(`${API_BASE}/clases/limpiar-todas?confirmar=ELIMINAR_TODO&incluirBloqueadas=true`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': window.wpApiSettings?.nonce || ''
                }
            });

            const data = await response.json();

            if (data.exito) {
                setMensaje({
                    tipo: 'exito',
                    texto: data.mensaje || `Se eliminaron ${data.eliminadas} clases`
                });
                await obtenerEstado();
            } else {
                setMensaje({tipo: 'error', texto: data.error || 'Error al limpiar clases'});
            }
        } catch {
            setMensaje({tipo: 'error', texto: 'Error de conexión al limpiar clases'});
        } finally {
            setEjecutando(null);
        }
    }, [confirmandoLimpiarTodas, obtenerEstado]);

    return {
        estado,
        cargando,
        ejecutando,
        mensaje,
        confirmandoLimpiarTodas,
        poblarDatos,
        limpiarDatos,
        limpiarTodasLasClases,
    };
}
