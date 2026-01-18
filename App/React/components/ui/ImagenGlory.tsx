import React, {useState, useEffect, useRef, ImgHTMLAttributes} from 'react';
import {refAUrl} from '../../utils/imagenUtils';

/*
 * Tipos para el componente ImagenGlory
 */

type VarianteImagen = 'cover' | 'contain' | 'fill' | 'none';

interface ImagenGloryProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /* Referencia de imagen en formato alias::archivo (ej: colors::imagen.jpg) */
    src: string;
    /* Ancho deseado para redimensionar en CDN */
    ancho?: number;
    /* Alto deseado para redimensionar en CDN */
    alto?: number;
    /* Calidad de compresión (1-100) */
    calidad?: number;
    /* Variante de ajuste del objeto */
    variante?: VarianteImagen;
    /* Si usar URL de CDN optimizada */
    usarCdn?: boolean;
    /* Mostrar placeholder de carga */
    placeholder?: boolean;
    /* Color de fondo del placeholder */
    colorPlaceholder?: string;
    /* Callback cuando la imagen carga correctamente */
    onCargada?: () => void;
    /* Callback cuando hay error al cargar */
    onErrorCarga?: () => void;
}

/*
 * Mapeo de variantes a object-fit CSS
 */
const VARIANTE_A_OBJECT_FIT: Record<VarianteImagen, string> = {
    cover: 'cover',
    contain: 'contain',
    fill: 'fill',
    none: 'none'
};

/*
 * Cache en memoria para URLs resueltas y promesas en vuelo (deduplicación)
 */
const cacheUrls = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

/*
 * Obtiene la URL base de la API
 */
function obtenerApiBase(): string {
    if (typeof window !== 'undefined' && (window as any).wpApiSettings?.root) {
        return (window as any).wpApiSettings.root;
    }
    return '/wp-json/';
}

/*
 * Resuelve una referencia (alias::archivo) a URL usando API o fallback
 * Implementa deduplicación de peticiones para evitar waterfalls.
 */
async function resolverReferenciaAUrl(ref: string, opciones: {ancho?: number; alto?: number; calidad?: number; usarCdn?: boolean}): Promise<string> {
    /* Si no es una referencia con alias, devolver como URL directa */
    if (!ref.includes('::')) {
        return ref;
    }

    /* Clave de cache incluye dimensiones */
    const cacheKey = `${ref}|${opciones.ancho || 0}|${opciones.alto || 0}|${opciones.calidad || 80}|${opciones.usarCdn}`;

    /* 1. Verificar Caché de Resultado */
    if (cacheUrls.has(cacheKey)) {
        return cacheUrls.get(cacheKey)!;
    }

    /* 2. Verificar Solicitud en Progreso (Deduplicación) */
    if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey)!;
    }

    /* 3. Crear Nueva Solicitud */
    const promise = (async () => {
        try {
            const apiBase = obtenerApiBase();
            const params = new URLSearchParams({ref});

            if (opciones.ancho) params.set('width', String(opciones.ancho));
            if (opciones.alto) params.set('height', String(opciones.alto));
            if (opciones.calidad) params.set('quality', String(opciones.calidad));

            const response = await fetch(`${apiBase}glory/v1/images/url?${params.toString()}`);
            const data = await response.json();

            // Usar fallback local si la API falla o devuelve error
            let urlFinal = refAUrl(ref) || '';

            if (data.success) {
                // Si la API es exitosa, usamos su URL (CDN o local resuelta por backend)
                urlFinal = opciones.usarCdn !== false ? data.urlCdn : data.url;
            }

            cacheUrls.set(cacheKey, urlFinal);
            return urlFinal;
        } catch {
            /* Fallback silencioso a URL construida localmente */
            const fallback = refAUrl(ref) || '';
            cacheUrls.set(cacheKey, fallback);
            return fallback;
        } finally {
            pendingRequests.delete(cacheKey);
        }
    })();

    pendingRequests.set(cacheKey, promise);
    return promise;
}

/*
 * Componente ImagenGlory
 *
 * Renderiza imágenes del sistema Glory con soporte para:
 * - Referencias alias::archivo
 * - Lazy loading nativo
 * - Placeholder durante carga
 * - CDN optimizado (Jetpack Photon)
 * - Redimensionamiento dinámico
 */
export function ImagenGlory({src, ancho, alto, calidad = 80, variante = 'cover', usarCdn = true, placeholder = true, colorPlaceholder = 'var(--nakomi-fondoTerciario, #1a1a1a)', onCargada, onErrorCarga, className = '', style, alt = '', ...restProps}: ImagenGloryProps) {
    /*
     * Inicialización Optimista:
     * Intentamos resolver síncronamente la URL local usando refAUrl.
     * Esto asegura que la imagen se muestre inmediatamente en local sin esperar al fetch.
     */
    const [urlResuelta, setUrlResuelta] = useState<string | null>(() => {
        if (!src) return null;
        if (!src.includes('::')) return src;
        /* Si falla refAUrl, devolvemos null y dejamos que el effect intente resolverlo */
        return refAUrl(src) || null;
    });

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    /*
     * Resolver referencia a URL al montar o cambiar src
     */
    useEffect(() => {
        let cancelado = false;

        // Si ya tenemos una URL resuelta síncronamente (local), no marcamos "cargando" como true
        // para evitar que aparezca el placeholder si la imagen ya es válida.
        if (!urlResuelta) {
            setCargando(true);
        }

        setError(false);

        resolverReferenciaAUrl(src, {ancho, alto, calidad, usarCdn})
            .then(url => {
                if (!cancelado) {
                    setUrlResuelta(url);
                    // Si la imagen ya se cargó (por cache o local), cargando se gestionará via onLoad
                }
            })
            .catch(() => {
                if (!cancelado) {
                    setError(true);
                    setCargando(false);
                }
            });

        return () => {
            cancelado = true;
        };
    }, [src, ancho, alto, calidad, usarCdn]);

    /*
     * Manejar carga exitosa de imagen
     */
    const handleLoad = () => {
        setCargando(false);
        onCargada?.();
    };

    /*
     * Manejar error de carga
     */
    const handleError = () => {
        setError(true);
        setCargando(false);
        onErrorCarga?.();
    };

    /*
     * Estilos base del contenedor
     */
    const estilosContenedor: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: placeholder ? colorPlaceholder : 'transparent',
        ...style
    };

    /*
     * Estilos de la imagen
     */
    const estilosImagen: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: VARIANTE_A_OBJECT_FIT[variante] as React.CSSProperties['objectFit'],
        opacity: cargando ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out'
    };

    /*
     * Renderizar placeholder de error si la imagen falla
     */
    if (error) {
        return (
            <div
                className={`imagenGlory imagenGloryError ${className}`}
                style={{
                    ...estilosContenedor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--nakomi-textoApagado, #666)'
                }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                </svg>
            </div>
        );
    }

    return (
        <div className={`imagenGlory ${cargando ? 'imagenGloryCargando' : ''} ${className}`} style={estilosContenedor}>
            {urlResuelta && <img ref={imgRef} src={urlResuelta} alt={alt} loading="lazy" decoding="async" onLoad={handleLoad} onError={handleError} style={estilosImagen} {...restProps} />}

            {/* Indicador de carga con animación */}
            {placeholder && cargando && (
                <div
                    className="imagenGloryPlaceholder"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(
                            90deg,
                            ${colorPlaceholder} 0%,
                            var(--nakomi-fondoSecundario, #222) 50%,
                            ${colorPlaceholder} 100%
                        )`,
                        backgroundSize: '200% 100%',
                        animation: 'imagenGloryShimmer 1.5s infinite'
                    }}
                />
            )}
        </div>
    );
}

export default ImagenGlory;
