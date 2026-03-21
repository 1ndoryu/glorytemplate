import type { Coleccion } from '@app/types';

/* [2103A-3] 'inteligente' = orden del backend (scoring multi-factor). No aplica re-sort cliente. */
export type OrdenColecciones = 'inteligente' | 'recientes' | 'nombre' | 'totalSamples';
export type VistaColecciones = 'cuadricula' | 'lista' | 'arbol';

export const LS_KEY_ORDEN = 'kamples:libreria:orden';
export const LS_KEY_VISTA = 'kamples:libreria:vista';
export const ORDENES_VALIDOS: OrdenColecciones[] = ['inteligente', 'recientes', 'nombre', 'totalSamples'];
export const VISTAS_VALIDAS: VistaColecciones[] = ['cuadricula', 'lista', 'arbol'];

export const leerPreferencia = <T extends string>(clave: string, validos: readonly T[], fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    const valor = window.localStorage.getItem(clave);
    return valor && validos.includes(valor as T) ? valor as T : fallback;
};

export const guardarPreferencia = (clave: string, valor: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(clave, valor);
};

const crearColeccionDesdeResumen = (coleccion: Coleccion, sub: NonNullable<Coleccion['subcolecciones']>[number]): Coleccion => ({
    id: sub.id,
    usuarioId: coleccion.usuarioId,
    nombre: sub.nombre,
    slug: sub.slug,
    descripcion: '',
    esPublica: sub.esPublica,
    imagenUrl: sub.imagenUrl,
    totalSamples: sub.totalSamples,
    creadoAt: coleccion.creadoAt,
    actualizadoAt: coleccion.actualizadoAt,
    parentId: sub.parentId,
    tags: sub.tags,
    usuario: coleccion.usuario,
    estaGuardada: coleccion.estaGuardada,
});

export const normalizarColecciones = (colecciones: Coleccion[]): Coleccion[] => {
    const mapa = new Map<number, Coleccion>();
    for (const coleccion of colecciones) {
        if (!mapa.has(coleccion.id)) mapa.set(coleccion.id, coleccion);
        for (const sub of coleccion.subcolecciones ?? []) {
            if (!mapa.has(sub.id)) {
                mapa.set(sub.id, crearColeccionDesdeResumen(coleccion, sub));
            }
        }
    }
    return [...mapa.values()];
};

export const coincideTagColeccion = (coleccion: Coleccion, tagActivo: string | null): boolean => {
    if (!tagActivo) return true;
    const tagLower = tagActivo.toLowerCase();
    return coleccion.tags.some(tag => tag.toLowerCase() === tagLower);
};

export const coincideBusquedaColeccion = (coleccion: Coleccion, busqueda: string): boolean => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return true;
    return [
        coleccion.nombre,
        coleccion.descripcion,
        coleccion.usuario?.nombreVisible,
        coleccion.usuario?.username,
        ...(coleccion.tags ?? []),
    ].some(valor => String(valor ?? '').toLowerCase().includes(termino));
};

export const ordenarColecciones = (colecciones: Coleccion[], orden: OrdenColecciones): Coleccion[] => {
    const copia = [...colecciones];
    switch (orden) {
        case 'nombre':
            copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
            break;
        case 'totalSamples':
            copia.sort((a, b) => b.totalSamples - a.totalSamples);
            break;
        /* 'inteligente' y 'recientes' preservan el orden del backend (sin re-sort) */
        case 'inteligente':
        case 'recientes':
        default:
            break;
    }
    return copia;
};

export const construirArbolEstricto = (colecciones: Coleccion[], orden: OrdenColecciones, tagActivo: string | null, busqueda: string): Coleccion[] => {
    if (colecciones.length === 0) return [];

    const mapa = new Map(colecciones.map(coleccion => [coleccion.id, coleccion]));
    const idsIncluidos = new Set<number>();
    const hayFiltro = Boolean(tagActivo) || busqueda.trim().length > 0;

    if (hayFiltro) {
        for (const coleccion of colecciones) {
            if (!coincideTagColeccion(coleccion, tagActivo) || !coincideBusquedaColeccion(coleccion, busqueda)) continue;
            let actual: Coleccion | undefined = coleccion;
            while (actual) {
                idsIncluidos.add(actual.id);
                actual = actual.parentId !== null ? mapa.get(actual.parentId) : undefined;
            }
        }
    } else {
        for (const coleccion of colecciones) idsIncluidos.add(coleccion.id);
    }

    const hijosPorPadre = new Map<number | null, Coleccion[]>();
    for (const coleccion of colecciones) {
        if (!idsIncluidos.has(coleccion.id)) continue;
        const lista = hijosPorPadre.get(coleccion.parentId) ?? [];
        lista.push(coleccion);
        hijosPorPadre.set(coleccion.parentId, lista);
    }

    const resultado: Coleccion[] = [];
    const recorrer = (parentId: number | null) => {
        for (const coleccion of ordenarColecciones(hijosPorPadre.get(parentId) ?? [], orden)) {
            resultado.push(coleccion);
            recorrer(coleccion.id);
        }
    };

    recorrer(null);
    return resultado;
};