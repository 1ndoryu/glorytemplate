import {useState, useEffect, useCallback, useRef} from 'react';

/*
 * Tipos para el sistema de imágenes Glory
 */

export interface ImagenGlory {
    filename: string;
    ref: string;
    url: string;
    urlCdn: string;
}

export interface OpcionesGloryImages {
    alias: string;
    cantidad?: number;
    tamanoMinimo?: number;
    aleatorio?: boolean;
    excluir?: string[];
    usarCdn?: boolean;
}

interface EstadoImagenes {
    imagenes: ImagenGlory[];
    cargando: boolean;
    error: string | null;
}

/*
 * Contexto global para tracking de imágenes usadas.
 * Evita repetición de imágenes entre diferentes componentes.
 */
const imagenesUsadasGlobal = new Set<string>();

/*
 * Obtiene la URL base de la API de WordPress.
 * Intenta usar wpApiSettings si está disponible (definido por wp_localize_script).
 */
function obtenerApiBase(): string {
    if (typeof window !== 'undefined' && (window as any).wpApiSettings?.root) {
        return (window as any).wpApiSettings.root;
    }
    /* Fallback a ruta relativa común de WordPress */
    return '/wp-json/';
}

/*
 * Hook para obtener imágenes del sistema Glory.
 * Consume el endpoint REST /glory/v1/images con cache y tracking de imágenes usadas.
 *
 * @param opciones - Configuración del hook
 * @returns Estado con imágenes, loading y error + funciones de control
 */
export function useGloryImages(opciones: OpcionesGloryImages) {
    const {alias, cantidad = 10, tamanoMinimo = 0, aleatorio = false, excluir = [], usarCdn = true} = opciones;

    const [estado, setEstado] = useState<EstadoImagenes>({
        imagenes: [],
        cargando: true,
        error: null
    });

    /* Referencia para evitar duplicados en strict mode */
    const fetchRealizado = useRef(false);
    /* Referencia para tracking de imágenes ya solicitadas en esta instancia */
    const imagenesLocales = useRef<Set<string>>(new Set());

    /*
     * Construye la URL del endpoint según si se requieren aleatorias o listado
     */
    const construirUrl = useCallback(() => {
        const apiBase = obtenerApiBase();
        const endpoint = aleatorio ? 'glory/v1/images/random' : 'glory/v1/images';
        const params = new URLSearchParams();

        params.set('alias', alias);

        if (aleatorio) {
            params.set('count', String(cantidad));
        } else {
            params.set('limit', String(cantidad));
        }

        if (tamanoMinimo > 0) {
            params.set('minSize', String(tamanoMinimo));
        }

        /* Combinar exclusiones locales y globales */
        const todasExclusiones = [...excluir, ...Array.from(imagenesUsadasGlobal)];

        if (todasExclusiones.length > 0 && aleatorio) {
            params.set('exclude', todasExclusiones.join(','));
        }

        return `${apiBase}${endpoint}?${params.toString()}`;
    }, [alias, cantidad, tamanoMinimo, aleatorio, excluir]);

    /*
     * Fetch de imágenes con manejo de errores
     */
    const cargarImagenes = useCallback(async () => {
        if (fetchRealizado.current && !aleatorio) return;
        fetchRealizado.current = true;

        setEstado(prev => ({...prev, cargando: true, error: null}));

        try {
            const url = construirUrl();
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error desconocido al obtener imágenes');
            }

            /* Procesar imágenes y registrar como usadas */
            const imagenesProcesadas: ImagenGlory[] = data.images.map((img: ImagenGlory) => {
                imagenesUsadasGlobal.add(img.filename);
                imagenesLocales.current.add(img.filename);
                return {
                    ...img,
                    /* Usar URL de CDN si está habilitado */
                    url: usarCdn ? img.urlCdn : img.url
                };
            });

            setEstado({
                imagenes: imagenesProcesadas,
                cargando: false,
                error: null
            });
        } catch (err) {
            const mensaje = err instanceof Error ? err.message : 'Error al cargar imágenes';
            setEstado({
                imagenes: [],
                cargando: false,
                error: mensaje
            });
        }
    }, [construirUrl, usarCdn, aleatorio]);

    /*
     * Efecto para cargar imágenes al montar o cambiar opciones
     */
    useEffect(() => {
        fetchRealizado.current = false;
        cargarImagenes();
    }, [alias, cantidad, tamanoMinimo, aleatorio]);

    /*
     * Función para recargar imágenes manualmente
     */
    const recargar = useCallback(() => {
        fetchRealizado.current = false;
        cargarImagenes();
    }, [cargarImagenes]);

    /*
     * Función para limpiar tracking de imágenes usadas
     */
    const limpiarUsadas = useCallback(() => {
        imagenesLocales.current.forEach(img => {
            imagenesUsadasGlobal.delete(img);
        });
        imagenesLocales.current.clear();
    }, []);

    /*
     * Cleanup al desmontar (opcional: liberar imágenes del tracking global)
     */
    useEffect(() => {
        return () => {
            /* No limpiamos automáticamente para mantener consistencia entre navegaciones */
        };
    }, []);

    return {
        ...estado,
        recargar,
        limpiarUsadas,
        /* Utilidad: obtener una imagen por índice */
        obtenerImagen: (indice: number) => estado.imagenes[indice] ?? null,
        /* Utilidad: obtener URL de imagen por índice */
        obtenerUrl: (indice: number) => estado.imagenes[indice]?.url ?? null
    };
}

/*
 * Hook simplificado para obtener una sola imagen aleatoria
 */
export function useImagenAleatoria(alias: string, tamanoMinimo = 0) {
    const {imagenes, cargando, error, recargar} = useGloryImages({
        alias,
        cantidad: 1,
        tamanoMinimo,
        aleatorio: true
    });

    return {
        imagen: imagenes[0] ?? null,
        url: imagenes[0]?.url ?? null,
        cargando,
        error,
        recargar
    };
}

/*
 * Función utilitaria para obtener URL directa de una referencia
 * (sin hook, útil para contextos donde no se puede usar hooks)
 */
export async function obtenerUrlImagen(ref: string, opciones?: {ancho?: number; alto?: number; calidad?: number}): Promise<string | null> {
    const apiBase = obtenerApiBase();
    const params = new URLSearchParams({ref});

    if (opciones?.ancho) params.set('width', String(opciones.ancho));
    if (opciones?.alto) params.set('height', String(opciones.alto));
    if (opciones?.calidad) params.set('quality', String(opciones.calidad));

    try {
        const response = await fetch(`${apiBase}glory/v1/images/url?${params.toString()}`);
        const data = await response.json();
        return data.success ? data.urlCdn : null;
    } catch {
        return null;
    }
}

/*
 * Utilidad para limpiar todo el tracking global de imágenes usadas
 */
export function limpiarImagenesUsadasGlobal(): void {
    imagenesUsadasGlobal.clear();
}

export default useGloryImages;
