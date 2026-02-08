/**
 * Motor de Navegación SPA (Single Page Application)
 *
 * Intercepta clicks en enlaces internos, fetch de la página destino,
 * extrae la isla React correspondiente y la monta sin recargar.
 *
 * Funcionalidades:
 * - Intercepción global de <a> clicks internos
 * - Fetch + parsing de HTML para extraer data-island y data-props
 * - Unmount de isla actual y mount de la nueva via createRoot
 * - History API (pushState/popstate) para botones atrás/adelante
 * - Transición fade-out/fade-in entre páginas con LOADER
 * - Función navegar() exportable para navegación programática
 *
 * Exclusiones automáticas:
 * - Links externos, archivos, wp-admin, wp-json, #anchors en misma página
 * - Clicks con Ctrl/Cmd/Shift (abrir en nueva pestaña)
 * - Links con target="_blank" o download
 */

import React from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {Logo} from './components/ui/Logo';

type MapaIslas = Record<string, React.ComponentType<Record<string, unknown>>>;
type ProviderType = React.ComponentType<{children: React.ReactNode}> | undefined;

/* Duración de la transición fade (ms) */
const DURACION_TRANSICION = 300; // Aumentado para dar tiempo al loader

/* Estado interno del motor SPA */
interface EstadoSPA {
    raizActual: Root | null;
    contenedorActual: HTMLElement | null;
    islas: MapaIslas;
    provider: ProviderType;
    navegando: boolean;
    inicializado: boolean;
}

const estado: EstadoSPA = {
    raizActual: null,
    contenedorActual: null,
    islas: {},
    provider: undefined,
    navegando: false,
    inicializado: false
};

/* Referencias independientes para el Loader */
let loaderRoot: Root | null = null;
let loaderElement: HTMLElement | null = null;

/**
 * Crea o muestra el loader overlay
 */
function mostrarLoader() {
    if (!loaderElement) {
        loaderElement = document.createElement('div');
        loaderElement.className = 'spaLoader';
        document.body.appendChild(loaderElement);
        loaderRoot = createRoot(loaderElement);
        loaderRoot.render(<Logo className="spaLoaderLogo" width={64} height={64} />);
    }

    // Force reflow para asegurar transicion
    void loaderElement.offsetWidth;
    loaderElement.classList.add('visible');
}

/**
 * Oculta el loader overlay
 */
function ocultarLoader() {
    if (loaderElement) {
        loaderElement.classList.remove('visible');
    }
}

/*
 * Verifica si una URL es interna y debe ser interceptada.
 * Excluye archivos estáticos, wp-admin, wp-json, API, etc.
 */
function esEnlaceInterno(href: string): boolean {
    try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return false;
        if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|doc|docx|xls|xlsx|mp4|mp3)$/i.test(url.pathname)) return false;
        if (/^\/(wp-admin|wp-login|wp-content|wp-json|wp-includes|api)\//i.test(url.pathname)) return false;
        return true;
    } catch {
        return false;
    }
}

/*
 * Parsea el HTML de respuesta para extraer información de la isla React.
 * Busca el elemento con data-island y extrae nombre, props y título.
 */
function extraerIslaDeHTML(html: string): {nombre: string; props: Record<string, unknown>; titulo: string} | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const contenedor = doc.querySelector<HTMLElement>('[data-island]');

    if (!contenedor) return null;

    const nombre = contenedor.dataset.island || '';
    let props: Record<string, unknown> = {};

    if (contenedor.dataset.props) {
        try {
            props = JSON.parse(contenedor.dataset.props);
        } catch {
            console.error('[SPA] Error parseando props de la respuesta');
        }
    }

    return {nombre, props, titulo: doc.title || document.title};
}

/* Envuelve un elemento JSX con el AppProvider si está definido */
function envolver(element: React.JSX.Element): React.JSX.Element {
    if (estado.provider) {
        const Provider = estado.provider;
        return <Provider>{element}</Provider>;
    }
    return element;
}

/* Espera un tiempo determinado (para transiciones) */
function esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
 * Navega a una URL interna via SPA.
 * Maneja fetch, parsing, unmount/mount y History API.
 */
async function navegarA(url: string, pushToHistory = true): Promise<void> {
    if (estado.navegando) return;

    /* No navegar a la misma página */
    const urlNormalizada = url.replace(/\/+$/, '') || '/';
    const actualNormalizada = window.location.pathname.replace(/\/+$/, '') || '/';
    if (urlNormalizada === actualNormalizada && !window.location.search) return;

    estado.navegando = true;
    const contenedor = estado.contenedorActual;

    try {
        mostrarLoader();

        // 1. Iniciar fetch y fade-out simultaneos
        const fetchPromise = fetch(url, {
            headers: {'X-SPA-Request': '1'},
            credentials: 'same-origin'
        });

        if (contenedor) {
            contenedor.style.opacity = '0';
            contenedor.style.transition = `opacity ${DURACION_TRANSICION}ms ease-out`;
        }

        // Esperar fetch y mínimo tiempo de transición visual
        const [response] = await Promise.all([
            fetchPromise,
            esperar(DURACION_TRANSICION * 1.5) // Espera extra para ver el loader
        ]);

        if (!response.ok) {
            window.location.href = url;
            return;
        }

        const html = await response.text();
        const islaInfo = extraerIslaDeHTML(html);

        if (!islaInfo) {
            window.location.href = url;
            return;
        }

        const Componente = estado.islas[islaInfo.nombre];
        if (!Componente) {
            console.warn(`[SPA] Isla "${islaInfo.nombre}" no registrada, recarga normal`);
            window.location.href = url;
            return;
        }

        /* Desmontar la raiz actual si existe */
        if (estado.raizActual) {
            estado.raizActual.unmount();
        } else if (contenedor) {
            /*
             * Primera navegación SPA: no tenemos referencia al root original
             * creado por main.tsx. Limpiamos el contenedor manualmente.
             */
            contenedor.innerHTML = '';
        }

        /* Crear nuevo contenedor */
        const nuevoContenedor = document.createElement('div');
        nuevoContenedor.id = `react-island-${islaInfo.nombre.toLowerCase()}-spa`;
        nuevoContenedor.setAttribute('data-island', islaInfo.nombre);
        nuevoContenedor.setAttribute('data-props', JSON.stringify(islaInfo.props));

        /* Estilo inicial para fade-in */
        nuevoContenedor.style.opacity = '0';
        nuevoContenedor.style.transition = `opacity ${DURACION_TRANSICION}ms ease-in`;

        /* Reemplazar en el DOM */
        if (contenedor && contenedor.parentNode) {
            contenedor.parentNode.replaceChild(nuevoContenedor, contenedor);
        } else {
            /* Fallback: insertar al inicio del body */
            const primerScript = document.body.querySelector('script');
            if (primerScript) {
                document.body.insertBefore(nuevoContenedor, primerScript);
            } else {
                document.body.appendChild(nuevoContenedor);
            }
        }

        /* Montar nueva isla */
        const root = createRoot(nuevoContenedor);
        const element = <React.StrictMode>{envolver(<Componente {...islaInfo.props} />)}</React.StrictMode>;
        root.render(element);

        /* Actualizar estado interno */
        estado.raizActual = root;
        estado.contenedorActual = nuevoContenedor;

        /* Actualizar título de la página */
        document.title = islaInfo.titulo;

        /* History API */
        if (pushToHistory) {
            window.history.pushState({spa: true, isla: islaInfo.nombre}, '', url);
        }

        /* Scroll al inicio */
        window.scrollTo({top: 0, behavior: 'instant' as ScrollBehavior});

        /* Fade-in nueva página */
        // requestAnimationFrame asegura que el render inicial ocurra
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                nuevoContenedor.style.opacity = '1';
                // Ocultar loader una vez que el contenido empieza a aparecer
                ocultarLoader();
            });
        });

        console.log(`[SPA] Navegación: ${islaInfo.nombre}`);
    } catch (error) {
        console.error('[SPA] Error en navegación:', error);
        window.location.href = url;
    } finally {
        estado.navegando = false;
    }
}

/**
 * Función pública para navegación programática.
 * Si SPA está activo y el enlace es interno, navega sin recarga.
 * Si no, hace navegación tradicional.
 */
export function navegar(url: string): void {
    if (estado.inicializado && esEnlaceInterno(new URL(url, window.location.origin).href)) {
        navegarA(url);
    } else {
        window.location.href = url;
    }
}

/**
 * Inicializa el motor SPA.
 * Debe llamarse después de que main.tsx haya montado la isla inicial.
 * Recibe el mapa de islas y opcionalmente el AppProvider.
 */
export function inicializarSPA(islas: MapaIslas, provider?: ProviderType): void {
    if (estado.inicializado) return;

    estado.islas = islas;
    estado.provider = provider;

    const contenedor = document.querySelector<HTMLElement>('[data-island]');
    if (!contenedor) {
        console.warn('[SPA] No se encontró contenedor de isla, SPA desactivado');
        return;
    }

    estado.contenedorActual = contenedor;
    estado.inicializado = true;

    /* Interceptor global de clicks en <a> internos */
    document.addEventListener('click', e => {
        const objetivo = e.target as HTMLElement;
        const ancla = objetivo.closest('a');

        if (!ancla) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        if (ancla.target === '_blank') return;
        if (ancla.hasAttribute('download')) return;

        const href = ancla.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        let urlCompleta: URL;
        try {
            urlCompleta = new URL(href, window.location.origin);
        } catch {
            return;
        }

        if (!esEnlaceInterno(urlCompleta.href)) return;

        /* Hash en la misma página: dejar que el navegador maneje */
        if (urlCompleta.pathname === window.location.pathname && urlCompleta.hash) return;

        e.preventDefault();
        navegarA(urlCompleta.pathname + urlCompleta.search);
    });

    /* Manejar botones atrás/adelante */
    window.addEventListener('popstate', () => {
        navegarA(window.location.pathname + window.location.search, false);
    });

    /* Marcar estado actual en el historial */
    window.history.replaceState({spa: true, isla: contenedor.dataset.island}, '');

    console.log('[SPA] Navegación SPA inicializada');
}
