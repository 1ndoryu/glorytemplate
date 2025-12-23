import {useState, useCallback, useRef, useEffect} from 'react';
import type {TipoElementoCompartido, RolCompartido, ElementoCompartidoConmigo, ElementoCompartidoPorMi, Participante, PermisosAcceso, ContadoresCompartidos, CompaneroEquipo} from '../types/dashboard';

interface EstadoCompartidos {
    compartidosConmigo: ElementoCompartidoConmigo[];
    misCompartidos: ElementoCompartidoPorMi[];
    contadores: ContadoresCompartidos;
    cargando: boolean;
    error: string | null;
}

interface UseCompartidosReturn extends EstadoCompartidos {
    compartir: (tipo: TipoElementoCompartido, elementoId: number, usuarioId: number, rol?: RolCompartido) => Promise<boolean>;
    dejarDeCompartir: (compartidoId: number) => Promise<boolean>;
    actualizarRol: (compartidoId: number, nuevoRol: RolCompartido) => Promise<boolean>;
    obtenerParticipantes: (tipo: TipoElementoCompartido, elementoId: number) => Promise<Participante[]>;
    verificarAcceso: (tipo: TipoElementoCompartido, elementoId: number, propietarioId: number) => Promise<PermisosAcceso | null>;
    recargar: () => Promise<void>;
    obtenerCompanerosDisponibles: (tipo: TipoElementoCompartido, elementoId: number, companeros: CompaneroEquipo[]) => CompaneroEquipo[];
    estaCompartido: (tipo: TipoElementoCompartido, elementoId: number) => boolean;
}

const API_BASE = '/wp-json/glory/v1';

export function useCompartidos(): UseCompartidosReturn {
    const [estado, setEstado] = useState<EstadoCompartidos>({
        compartidosConmigo: [],
        misCompartidos: [],
        contadores: {tareas: 0, proyectos: 0, habitos: 0, total: 0},
        cargando: true,
        error: null
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    /* Obtiene el nonce para la autenticación */
    const obtenerNonce = useCallback((): string => {
        return (window as unknown as {gloryDashboard?: {nonce?: string}}).gloryDashboard?.nonce ?? '';
    }, []);

    /* Realiza una petición fetch autenticada */
    const fetchAutenticado = useCallback(
        async (url: string, opciones: RequestInit = {}): Promise<Response> => {
            const nonce = obtenerNonce();

            return fetch(url, {
                ...opciones,
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                    ...opciones.headers
                },
                credentials: 'same-origin'
            });
        },
        [obtenerNonce]
    );

    /* Carga compartidos conmigo */
    const cargarCompartidosConmigo = useCallback(async (): Promise<ElementoCompartidoConmigo[]> => {
        const respuesta = await fetchAutenticado(`${API_BASE}/compartidos`);
        const datos = await respuesta.json();

        if (datos.exito) {
            return datos.compartidos;
        }
        return [];
    }, [fetchAutenticado]);

    /* Carga elementos que yo he compartido */
    const cargarMisCompartidos = useCallback(async (): Promise<ElementoCompartidoPorMi[]> => {
        const respuesta = await fetchAutenticado(`${API_BASE}/compartidos/mis`);
        const datos = await respuesta.json();

        if (datos.exito) {
            return datos.compartidos;
        }
        return [];
    }, [fetchAutenticado]);

    /* Carga contadores */
    const cargarContadores = useCallback(async (): Promise<ContadoresCompartidos> => {
        const respuesta = await fetchAutenticado(`${API_BASE}/compartidos/contadores`);
        const datos = await respuesta.json();

        if (datos.exito) {
            return datos.contadores;
        }
        return {tareas: 0, proyectos: 0, habitos: 0, total: 0};
    }, [fetchAutenticado]);

    /* Recarga todos los datos */
    const recargar = useCallback(async (): Promise<void> => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const [compartidosConmigo, misCompartidos, contadores] = await Promise.all([cargarCompartidosConmigo(), cargarMisCompartidos(), cargarContadores()]);

            setEstado({
                compartidosConmigo,
                misCompartidos,
                contadores,
                cargando: false,
                error: null
            });
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                setEstado(prev => ({
                    ...prev,
                    cargando: false,
                    error: 'Error al cargar los datos de compartidos'
                }));
            }
        }
    }, [cargarCompartidosConmigo, cargarMisCompartidos, cargarContadores]);

    /* Comparte un elemento con otro usuario */
    const compartir = useCallback(
        async (tipo: TipoElementoCompartido, elementoId: number, usuarioId: number, rol: RolCompartido = 'colaborador'): Promise<boolean> => {
            try {
                const respuesta = await fetchAutenticado(`${API_BASE}/compartidos`, {
                    method: 'POST',
                    body: JSON.stringify({tipo, elementoId, usuarioId, rol})
                });

                const datos = await respuesta.json();

                if (datos.exito) {
                    /* Añadir a la lista local */
                    setEstado(prev => ({
                        ...prev,
                        misCompartidos: [...prev.misCompartidos, datos.compartido],
                        contadores: {
                            ...prev.contadores,
                            [tipo + 's']: (prev.contadores[(tipo + 's') as keyof ContadoresCompartidos] as number) + 1,
                            total: prev.contadores.total + 1
                        }
                    }));
                    return true;
                }

                return false;
            } catch {
                return false;
            }
        },
        [fetchAutenticado]
    );

    /* Deja de compartir un elemento */
    const dejarDeCompartir = useCallback(
        async (compartidoId: number): Promise<boolean> => {
            try {
                const respuesta = await fetchAutenticado(`${API_BASE}/compartidos/${compartidoId}`, {
                    method: 'DELETE'
                });

                const datos = await respuesta.json();

                if (datos.exito) {
                    /* Remover de la lista local */
                    setEstado(prev => {
                        const enMisCompartidos = prev.misCompartidos.find(c => c.id === compartidoId);
                        const enCompartidosConmigo = prev.compartidosConmigo.find(c => c.id === compartidoId);
                        const tipo = enMisCompartidos?.tipo ?? enCompartidosConmigo?.tipo;

                        return {
                            ...prev,
                            misCompartidos: prev.misCompartidos.filter(c => c.id !== compartidoId),
                            compartidosConmigo: prev.compartidosConmigo.filter(c => c.id !== compartidoId),
                            contadores: tipo
                                ? {
                                      ...prev.contadores,
                                      [tipo + 's']: Math.max(0, (prev.contadores[(tipo + 's') as keyof ContadoresCompartidos] as number) - 1),
                                      total: Math.max(0, prev.contadores.total - 1)
                                  }
                                : prev.contadores
                        };
                    });
                    return true;
                }

                return false;
            } catch {
                return false;
            }
        },
        [fetchAutenticado]
    );

    /* Actualiza el rol de un participante */
    const actualizarRol = useCallback(
        async (compartidoId: number, nuevoRol: RolCompartido): Promise<boolean> => {
            try {
                const respuesta = await fetchAutenticado(`${API_BASE}/compartidos/${compartidoId}/rol`, {
                    method: 'PUT',
                    body: JSON.stringify({rol: nuevoRol})
                });

                const datos = await respuesta.json();

                if (datos.exito) {
                    /* Actualizar en la lista local */
                    setEstado(prev => ({
                        ...prev,
                        misCompartidos: prev.misCompartidos.map(c => (c.id === compartidoId ? {...c, rol: nuevoRol} : c))
                    }));
                    return true;
                }

                return false;
            } catch {
                return false;
            }
        },
        [fetchAutenticado]
    );

    /* Obtiene los participantes de un elemento */
    const obtenerParticipantes = useCallback(
        async (tipo: TipoElementoCompartido, elementoId: number): Promise<Participante[]> => {
            try {
                const respuesta = await fetchAutenticado(`${API_BASE}/compartidos/participantes/${tipo}/${elementoId}`);

                const datos = await respuesta.json();

                if (datos.exito) {
                    return datos.participantes;
                }

                return [];
            } catch {
                return [];
            }
        },
        [fetchAutenticado]
    );

    /* Verifica si el usuario tiene acceso a un elemento */
    const verificarAcceso = useCallback(
        async (tipo: TipoElementoCompartido, elementoId: number, propietarioId: number): Promise<PermisosAcceso | null> => {
            try {
                const respuesta = await fetchAutenticado(`${API_BASE}/compartidos/acceso/${tipo}/${elementoId}/${propietarioId}`);

                const datos = await respuesta.json();

                if (datos.exito && datos.tieneAcceso) {
                    return datos.acceso;
                }

                return null;
            } catch {
                return null;
            }
        },
        [fetchAutenticado]
    );

    /* Filtra compañeros que aún no tienen acceso a un elemento */
    const obtenerCompanerosDisponibles = useCallback(
        (tipo: TipoElementoCompartido, elementoId: number, companeros: CompaneroEquipo[]): CompaneroEquipo[] => {
            const compartidosDelElemento = estado.misCompartidos.filter(c => c.tipo === tipo && c.elementoId === elementoId);

            const idsCompartidos = new Set(compartidosDelElemento.map(c => c.usuarioId));

            return companeros.filter(c => !idsCompartidos.has(c.companeroId));
        },
        [estado.misCompartidos]
    );

    /* Verifica si un elemento está siendo compartido con otros usuarios */
    const estaCompartido = useCallback(
        (tipo: TipoElementoCompartido, elementoId: number): boolean => {
            return estado.misCompartidos.some(c => c.tipo === tipo && c.elementoId === elementoId);
        },
        [estado.misCompartidos]
    );

    /* Carga inicial */
    useEffect(() => {
        recargar();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [recargar]);

    return {
        ...estado,
        compartir,
        dejarDeCompartir,
        actualizarRol,
        obtenerParticipantes,
        verificarAcceso,
        recargar,
        obtenerCompanerosDisponibles,
        estaCompartido
    };
}
