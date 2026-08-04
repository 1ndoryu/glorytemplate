import {create} from 'zustand';
import {Nota, NotaActiva} from '../types/notas';
import {notasService} from '../services/notasService';
import {extraerTitulo, emitirCambioNotaActiva, CONTENIDO_NOTA_NUEVA, obtenerNotaActivaPanelGuardada, persistirNotaActivaPanel} from '../utils/notasUtils';
import {notasIniciales} from '../data/datosIniciales';

/* [263A-12] ID del panel scratchpad base. Solo este panel persiste su nota en localStorage y emite eventos de tab sync. */
export const PANEL_SCRATCHPAD = 'scratchpad';

/* [263A-12] Nota vacía para paneles sin estado previo */
const NOTA_VACIA: NotaActiva = {id: null, contenido: CONTENIDO_NOTA_NUEVA, modificada: false};

interface NotasState {
    notas: Nota[];
    /* [263A-12] Cada panel scratchpad tiene su propia nota activa independiente */
    notasActivaPorPanel: Record<string, NotaActiva>;
    total: number;
    hayMas: boolean;
    cargando: boolean;
    guardando: boolean;
    eliminando: boolean;
    error: string | null;
    offset: number;
    limite: number;
}

interface NotasActions {
    cargarNotas: (reiniciar?: boolean) => Promise<void>;
    cargarMas: () => Promise<void>;
    buscarNotas: (termino: string) => Promise<Nota[]>;
    /* [263A-12] Acciones de nota activa parametrizadas por panelId */
    seleccionarNota: (panelId: string, nota: Nota) => void;
    crearNuevaNota: (panelId: string, carpetaId?: number | null) => void;
    actualizarContenidoNotaActiva: (panelId: string, contenido: string) => void;
    guardarNotaActiva: (panelId: string) => Promise<Nota | null>;
    eliminarNota: (id: number) => Promise<boolean>;
    limpiarError: () => void;
    establecerNotaActivaDesdeId: (panelId: string, id: number | null) => void;
    restaurarNotaActivaGuardada: (panelId: string) => void;
}

const LIMITE_POR_PAGINA = 50;

/* [263A-12] Helper: obtiene la nota activa de un panel o la nota vacía por defecto */
export function obtenerNotaPanel(state: NotasState, panelId: string): NotaActiva {
    return state.notasActivaPorPanel[panelId] ?? NOTA_VACIA;
}

export const useNotasStore = create<NotasState & NotasActions>((set, get) => ({
    // Estado Inicial
    notas: [],
    /* [263A-12] Cada panel tiene su propia nota activa */
    notasActivaPorPanel: {
        [PANEL_SCRATCHPAD]: {
            id: null,
            contenido: CONTENIDO_NOTA_NUEVA,
            modificada: false
        }
    },
    total: 0,
    hayMas: false,
    cargando: false,
    guardando: false,
    eliminando: false,
    error: null,
    offset: 0,
    limite: LIMITE_POR_PAGINA,

    // Acciones
    cargarNotas: async (reiniciar = false) => {
        const {limite, offset, cargando} = get();
        if (cargando) return;

        set({cargando: true, error: null});
        const nuevoOffset = reiniciar ? 0 : offset;

        try {
            const respuesta = await notasService.cargarNotas(limite, nuevoOffset);

            set(state => ({
                cargando: false,
                notas: reiniciar ? respuesta.notas : [...state.notas, ...respuesta.notas],
                total: respuesta.total,
                hayMas: respuesta.hayMas,
                offset: nuevoOffset + respuesta.notas.length
            }));
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error al cargar notas';
            set({cargando: false, error: mensaje});
        }
    },

    cargarMas: async () => {
        const {hayMas, cargando} = get();
        if (!hayMas || cargando) return;
        await get().cargarNotas(false);
    },

    buscarNotas: async termino => {
        return await notasService.buscarNotas(termino);
    },

    /* [263A-12] Cada acción recibe panelId. Todos los paneles persisten su nota activa. */
    seleccionarNota: (panelId, nota) => {
        persistirNotaActivaPanel(panelId, nota.id);
        if (panelId === PANEL_SCRATCHPAD) {
            emitirCambioNotaActiva(nota.id);
        }
        set(state => ({
            notasActivaPorPanel: {
                ...state.notasActivaPorPanel,
                [panelId]: {
                    id: nota.id,
                    contenido: nota.contenido,
                    modificada: false
                }
            }
        }));
    },

    crearNuevaNota: (panelId, carpetaId?) => {
        persistirNotaActivaPanel(panelId, null);
        set(state => ({
            notasActivaPorPanel: {
                ...state.notasActivaPorPanel,
                [panelId]: {
                    id: null,
                    contenido: CONTENIDO_NOTA_NUEVA,
                    modificada: false,
                    carpetaId: carpetaId ?? null
                }
            }
        }));
    },

    actualizarContenidoNotaActiva: (panelId, contenido) => {
        set(state => {
            const notaActual = state.notasActivaPorPanel[panelId];
            if (!notaActual) return state;
            return {
                notasActivaPorPanel: {
                    ...state.notasActivaPorPanel,
                    [panelId]: {
                        ...notaActual,
                        contenido,
                        modificada: true
                    }
                }
            };
        });
    },

    establecerNotaActivaDesdeId: (panelId, id) => {
        const {notas, notasActivaPorPanel} = get();
        const notaActual = notasActivaPorPanel[panelId];

        if (notaActual?.id === id) return;

        if (id === null) {
            get().crearNuevaNota(panelId);
            return;
        }

        const nota = notas.find(n => n.id === id);
        if (nota) {
            set(state => ({
                notasActivaPorPanel: {
                    ...state.notasActivaPorPanel,
                    [panelId]: {
                        id: nota.id,
                        contenido: nota.contenido,
                        modificada: false
                    }
                }
            }));
        }
    },

    restaurarNotaActivaGuardada: (panelId) => {
        const {notas, notasActivaPorPanel} = get();
        const notaActual = notasActivaPorPanel[panelId] ?? NOTA_VACIA;
        const idGuardado = obtenerNotaActivaPanelGuardada(panelId);

        if (idGuardado !== null) {
            const nota = notas.find(n => n.id === idGuardado);
            if (nota) {
                set(state => ({
                    notasActivaPorPanel: {
                        ...state.notasActivaPorPanel,
                        [panelId]: {
                            id: nota.id,
                            contenido: nota.contenido,
                            modificada: false
                        }
                    }
                }));
                return;
            }
        }

        /*
         * Si no hay nota guardada previamente y no hay notas en el servidor,
         * mostrar la nota de bienvenida para usuarios nuevos
         */
        if (notas.length === 0 && notaActual.contenido === CONTENIDO_NOTA_NUEVA) {
            set(state => ({
                notasActivaPorPanel: {
                    ...state.notasActivaPorPanel,
                    [panelId]: {
                        id: null,
                        contenido: notasIniciales,
                        modificada: true
                    }
                }
            }));
        }
    },

    guardarNotaActiva: async (panelId) => {
        const notaActiva = get().notasActivaPorPanel[panelId];
        if (!notaActiva) return null;
        const contenido = notaActiva.contenido;

        if (!contenido.trim()) return null;

        set({guardando: true, error: null});
        const titulo = extraerTitulo(contenido);

        try {
            let notaGuardada: Nota;

            if (notaActiva.id) {
                // Actualizar
                notaGuardada = await notasService.actualizarNota(notaActiva.id, titulo, contenido);

                set(state => ({
                    guardando: false,
                    notas: state.notas.map(n => (n.id === notaGuardada.id ? notaGuardada : n)),
                    notasActivaPorPanel: {
                        ...state.notasActivaPorPanel,
                        [panelId]: {...(state.notasActivaPorPanel[panelId] ?? NOTA_VACIA), modificada: false}
                    }
                }));
            } else {
                // Crear
                notaGuardada = await notasService.crearNota(titulo, contenido);

                /*
                 * Si la nota se creó desde una carpeta activa, moverla ahí.
                 * La API de crearNota no acepta carpetaId, así que hacemos un
                 * segundo paso: mover la nota recién creada a su carpeta destino.
                 */
                if (notaActiva.carpetaId) {
                    try {
                        await notasService.moverNota(notaGuardada.id, notaActiva.carpetaId);
                        notaGuardada = {...notaGuardada, carpetaId: notaActiva.carpetaId};
                    } catch {
                        /* Si falla el mover, la nota queda en General - no es crítico */
                    }
                }

                persistirNotaActivaPanel(panelId, notaGuardada.id);
                set(state => ({
                    guardando: false,
                    notas: [notaGuardada, ...state.notas],
                    total: state.total + 1,
                    notasActivaPorPanel: {
                        ...state.notasActivaPorPanel,
                        [panelId]: {
                            id: notaGuardada.id,
                            contenido: notaGuardada.contenido,
                            modificada: false,
                            carpetaId: notaGuardada.carpetaId
                        }
                    }
                }));
            }
            return notaGuardada;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error al guardar';
            set({guardando: false, error: mensaje});
            return null;
        }
    },

    /* [263A-12] Al eliminar, resetear TODOS los paneles que tengan esa nota abierta */
    eliminarNota: async id => {
        const {notas, notasActivaPorPanel, total} = get();
        const notaAEliminar = notas.find(n => n.id === id);
        const notasPorPanelAnterior = {...notasActivaPorPanel};

        // Optimistic Update
        const nuevasNotas = notas.filter(n => n.id !== id);
        const nuevasNotasPorPanel: Record<string, NotaActiva> = {};
        for (const [pid, nota] of Object.entries(notasActivaPorPanel)) {
            nuevasNotasPorPanel[pid] = nota.id === id
                ? {id: null, contenido: CONTENIDO_NOTA_NUEVA, modificada: false}
                : nota;
        }

        set({
            eliminando: true,
            error: null,
            notas: nuevasNotas,
            total: total > 0 ? total - 1 : 0,
            notasActivaPorPanel: nuevasNotasPorPanel
        });

        try {
            await notasService.eliminarNota(id);
            set({eliminando: false});
            return true;
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error al eliminar';

            // Rollback
            const notasRestauradas = notaAEliminar ? [...nuevasNotas, notaAEliminar].sort((a, b) => new Date(b.fechaModificacion).getTime() - new Date(a.fechaModificacion).getTime()) : notas;

            set({
                eliminando: false,
                error: mensaje,
                notas: notasRestauradas,
                total: total,
                notasActivaPorPanel: notasPorPanelAnterior
            });
            return false;
        }
    },

    limpiarError: () => set({error: null})
}));
