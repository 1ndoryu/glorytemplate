/*
 * Hook useAdministracion
 *
 * Gestiona la comunicación con la API de administración
 * y el estado del panel de administración.
 */

import {useState, useCallback} from 'react';
import type {UsuarioAdmin, FiltrosAdmin, RespuestaListaUsuarios, ResumenAdmin} from '../types/dashboard';

interface EstadoAdmin {
    usuarios: UsuarioAdmin[];
    total: number;
    paginacion: {
        pagina: number;
        porPagina: number;
        totalPaginas: number;
    };
    resumen: ResumenAdmin | null;
    cargando: boolean;
    error: string | null;
    usuarioSeleccionado: UsuarioAdmin | null;
}

interface AccionResultado {
    exito: boolean;
    mensaje: string;
}

const estadoInicial: EstadoAdmin = {
    usuarios: [],
    total: 0,
    paginacion: {
        pagina: 1,
        porPagina: 20,
        totalPaginas: 0
    },
    resumen: null,
    cargando: false,
    error: null,
    usuarioSeleccionado: null
};

const filtrosIniciales: FiltrosAdmin = {
    plan: 'todos',
    busqueda: '',
    ordenarPor: 'fechaRegistro',
    orden: 'desc',
    pagina: 1,
    porPagina: 20
};

export function useAdministracion() {
    const [estado, setEstado] = useState<EstadoAdmin>(estadoInicial);
    const [filtros, setFiltros] = useState<FiltrosAdmin>(filtrosIniciales);

    /* Obtener URL base de la API */
    const getApiUrl = useCallback((endpoint: string): string => {
        const baseUrl = (window as unknown as {gloryDashboard?: {apiUrl?: string}}).gloryDashboard?.apiUrl || '/wp-json/glory/v1';
        return `${baseUrl}${endpoint}`;
    }, []);

    /* Obtener nonce para autenticación */
    const getNonce = useCallback((): string => {
        return (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce || '';
    }, []);

    /* Hacer petición a la API */
    const fetchApi = useCallback(
        async <T>(endpoint: string, options: RequestInit = {}): Promise<{success: boolean; data?: T; message?: string}> => {
            const nonce = getNonce();

            const defaultOptions: RequestInit = {
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce
                }
            };

            const response = await fetch(getApiUrl(endpoint), {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {})
                }
            });

            const json = await response.json();
            return json;
        },
        [getApiUrl, getNonce]
    );

    /* Cargar lista de usuarios */
    const cargarUsuarios = useCallback(
        async (nuevosFiltros?: Partial<FiltrosAdmin>) => {
            const filtrosActuales = nuevosFiltros ? {...filtros, ...nuevosFiltros} : filtros;

            if (nuevosFiltros) {
                setFiltros(filtrosActuales);
            }

            setEstado(prev => ({...prev, cargando: true, error: null}));

            try {
                const params = new URLSearchParams({
                    plan: filtrosActuales.plan,
                    busqueda: filtrosActuales.busqueda,
                    ordenarPor: filtrosActuales.ordenarPor,
                    orden: filtrosActuales.orden,
                    pagina: String(filtrosActuales.pagina),
                    porPagina: String(filtrosActuales.porPagina)
                });

                const resultado = await fetchApi<RespuestaListaUsuarios>(`/admin/usuarios?${params.toString()}`);

                if (resultado.success && resultado.data) {
                    setEstado(prev => ({
                        ...prev,
                        usuarios: resultado.data!.usuarios,
                        total: resultado.data!.total,
                        paginacion: resultado.data!.paginacion,
                        cargando: false
                    }));
                } else {
                    setEstado(prev => ({
                        ...prev,
                        error: resultado.message || 'Error al cargar usuarios',
                        cargando: false
                    }));
                }
            } catch (err) {
                setEstado(prev => ({
                    ...prev,
                    error: 'Error de conexión al cargar usuarios',
                    cargando: false
                }));
            }
        },
        [filtros, fetchApi]
    );

    /* Cargar resumen global */
    const cargarResumen = useCallback(async () => {
        try {
            const resultado = await fetchApi<ResumenAdmin>('/admin/resumen');

            if (resultado.success && resultado.data) {
                setEstado(prev => ({
                    ...prev,
                    resumen: resultado.data!
                }));
            }
        } catch (err) {
            console.error('Error al cargar resumen:', err);
        }
    }, [fetchApi]);

    /* Obtener detalle de usuario */
    const obtenerDetalleUsuario = useCallback(
        async (userId: number): Promise<UsuarioAdmin | null> => {
            try {
                const resultado = await fetchApi<UsuarioAdmin>(`/admin/usuario/${userId}`);

                if (resultado.success && resultado.data) {
                    setEstado(prev => ({
                        ...prev,
                        usuarioSeleccionado: resultado.data!
                    }));
                    return resultado.data;
                }
                return null;
            } catch (err) {
                console.error('Error al obtener usuario:', err);
                return null;
            }
        },
        [fetchApi]
    );

    /* Activar premium */
    const activarPremium = useCallback(
        async (userId: number, duracion?: number): Promise<AccionResultado> => {
            try {
                const resultado = await fetchApi<{exito: boolean; mensaje: string}>(`/admin/usuario/${userId}/activar-premium`, {
                    method: 'POST',
                    body: JSON.stringify({duracion})
                });

                if (resultado.success) {
                    /* Recargar usuarios para ver el cambio */
                    cargarUsuarios();
                }

                return {
                    exito: resultado.success,
                    mensaje: resultado.message || 'Operación completada'
                };
            } catch (err) {
                return {
                    exito: false,
                    mensaje: 'Error al activar premium'
                };
            }
        },
        [fetchApi, cargarUsuarios]
    );

    /* Cancelar premium */
    const cancelarPremium = useCallback(
        async (userId: number): Promise<AccionResultado> => {
            try {
                const resultado = await fetchApi<{exito: boolean; mensaje: string}>(`/admin/usuario/${userId}/cancelar-premium`, {method: 'POST'});

                if (resultado.success) {
                    cargarUsuarios();
                }

                return {
                    exito: resultado.success,
                    mensaje: resultado.message || 'Operación completada'
                };
            } catch (err) {
                return {
                    exito: false,
                    mensaje: 'Error al cancelar premium'
                };
            }
        },
        [fetchApi, cargarUsuarios]
    );

    /* Extender trial */
    const extenderTrial = useCallback(
        async (userId: number, dias: number): Promise<AccionResultado> => {
            try {
                const resultado = await fetchApi<{exito: boolean; mensaje: string}>(`/admin/usuario/${userId}/extender-trial`, {
                    method: 'POST',
                    body: JSON.stringify({dias})
                });

                if (resultado.success) {
                    cargarUsuarios();
                }

                return {
                    exito: resultado.success,
                    mensaje: resultado.message || 'Operación completada'
                };
            } catch (err) {
                return {
                    exito: false,
                    mensaje: 'Error al extender trial'
                };
            }
        },
        [fetchApi, cargarUsuarios]
    );

    /* Cambiar página */
    const cambiarPagina = useCallback(
        (pagina: number) => {
            cargarUsuarios({pagina});
        },
        [cargarUsuarios]
    );

    /* Cambiar filtro de plan */
    const filtrarPorPlan = useCallback(
        (plan: FiltrosAdmin['plan']) => {
            cargarUsuarios({plan, pagina: 1});
        },
        [cargarUsuarios]
    );

    /* Buscar usuarios */
    const buscar = useCallback(
        (busqueda: string) => {
            cargarUsuarios({busqueda, pagina: 1});
        },
        [cargarUsuarios]
    );

    /* Limpiar usuario seleccionado */
    const limpiarSeleccion = useCallback(() => {
        setEstado(prev => ({...prev, usuarioSeleccionado: null}));
    }, []);

    /* Reiniciar filtros */
    const reiniciarFiltros = useCallback(() => {
        setFiltros(filtrosIniciales);
        cargarUsuarios(filtrosIniciales);
    }, [cargarUsuarios]);

    return {
        /* Estado */
        ...estado,
        filtros,

        /* Acciones de carga */
        cargarUsuarios,
        cargarResumen,
        obtenerDetalleUsuario,

        /* Acciones administrativas */
        activarPremium,
        cancelarPremium,
        extenderTrial,

        /* Navegación y filtros */
        cambiarPagina,
        filtrarPorPlan,
        buscar,
        limpiarSeleccion,
        reiniciarFiltros
    };
}

export type UseAdministracionReturn = ReturnType<typeof useAdministracion>;
