/*
 * Componente: LayoutPrincipal
 * Wrapper del layout completo: sidebar + topbar + contenido + reproductor + modal subida.
 * Envuelve cada isla para proporcionar la estructura base de Kamples.
 * Detecta la página activa de forma reactiva vía el navigationStore de Glory.
 * Si el usuario NO está autenticado, oculta sidebar/topbar/reproductor
 * y muestra el contenido a pantalla completa (ideal para LandingPublica).
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PanelLateral } from './PanelLateral';
import { ReproductorGlobal } from '../ui/ReproductorGlobal';
import { BarraSeleccionMultiple } from '../ui/BarraSeleccionMultiple';
import { useSeleccionSamplesStore } from '@app/stores/seleccionSamplesStore';
import { useMotorAudio } from '@app/hooks/useMotorAudio';
import { useMediaSession } from '@app/hooks/useMediaSession';
import { ModalCrear } from '../social/ModalCrear';
import { ModalPublicar } from '../social/ModalPublicar';
import { ModalSeleccionColeccion } from '../social/ModalSeleccionColeccion';
import { ModalConfiguracion } from '../social/ModalConfiguracion';
import { ModalSeguidores } from '../social/ModalSeguidores';
import { ModalGeneros } from '../social/ModalGeneros';
import { ModalArticulo } from '../blog/ModalArticulo';
import { useGenerosModalStore } from '@app/stores/generosModalStore';
import { useReproducidosStore } from '@app/stores/reproducidosStore';
import { ModalEditar } from '../social/ModalEditar';
import { ModalCorregirIA } from '../social/ModalCorregirIA';
import { ModalExtenderRecorte } from '../social/ModalExtenderRecorte';
import { ModalReportar } from '../social/ModalReportar';
import { ModalCompra } from '../social/ModalCompra';
import { ModalSolicitudWhatsapp } from '../social/ModalSolicitudWhatsapp';
import { VisorImagen } from '../ui/VisorImagen';
import { TooltipPerfil } from '../social/TooltipPerfil';
import { TooltipGlobal } from '../ui/TooltipGlobal';
import { ChatFlotante } from '../social/ChatFlotante';
import { OverlaySuspension } from '../social/OverlaySuspension';
import { PlanesIsland } from '@app/islands/planes/PlanesIsland';
import { ModalAuth } from '../auth/ModalAuth';
import { ModalAlgoTiming } from '../ui/ModalAlgoTiming';
import { ModalVersionDesactualizada } from '../ui/ModalVersionDesactualizada';
import { useVersionStore } from '@app/stores/versionStore';
import { NavPublico } from './NavPublico';
import { ContenedorToasts } from '../ui/ContenedorToasts';
import { NotificacionesToastBridge } from '../ui/NotificacionesToastBridge';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { inicializarTemaApp } from '@app/services/tema';
import '../../styles/variables.css';
import '../../styles/reset.css';
import '../../styles/layout.css';

interface LayoutPrincipalProps {
    children: ReactNode;
    paginaActiva?: string;
}

/* Mapeo de rutas a IDs de sidebar */
const MAPA_RUTAS: Record<string, string> = {
    '/': 'inicio',
    '/perfil': 'perfil',
    '/libreria': 'libreria',
    '/reproductor': 'reproductor',
    '/notificaciones': 'notificaciones',
    '/comunidad': 'comunidad',
    '/samples': 'samples',
    '/musica': 'musica',
    '/sample': 'inicio',
    '/coleccion': 'libreria',
    '/publicacion': 'comunidad',
    '/descargas': 'descargas',
    '/favoritos': 'favoritos',
    '/explorador': 'explorador',
    '/mensajes': 'inicio',
    '/planes': 'inicio',
    '/componentes': 'componentes',
    '/dev/componentes': 'componentes',
    '/admin/panel': 'admin',
    '/admin/dashboard': 'admin',
    '/blog': 'inicio',
};

/* Detectar página activa desde la ruta (SPA o URL) */
function detectarPaginaActiva(ruta: string): string {
    const path = ruta.replace(/\/$/, '') || '/';

    if (MAPA_RUTAS[path]) return MAPA_RUTAS[path];

    for (const [rutaKey, id] of Object.entries(MAPA_RUTAS)) {
        if (rutaKey !== '/' && path.startsWith(rutaKey)) return id;
    }

    return 'inicio';
}

/* TO-DO: Extraer logica (auth, ruta, overrides, generos, reproducidos) a useLayoutPrincipal.ts */
export const LayoutPrincipal = ({
    children,
    paginaActiva,
}: LayoutPrincipalProps): JSX.Element => {
    useEffect(() => {
        inicializarTemaApp();
    }, []);

    /* [Tarea Final] Cargar versiones de plataformas al montar (1 vez por sesión).
     * Detecta si la app desktop/APK está desactualizada y abre el modal. */
    const cargarVersiones = useVersionStore(s => s.cargarVersiones);
    useEffect(() => {
        void cargarVersiones();
    }, [cargarVersiones]);

    /* QQ49: Motor de audio global — crea y gestiona el unico HTMLAudioElement persistente */
    useMotorAudio();

    /* QL17: Sincroniza metadatos del reproductor con MediaSession API.
     * Muestra notificacion "now playing" con portada y controles en Android / lock screen. */
    useMediaSession();

    /* Se suscribe al store SPA para reaccionar a cambios de ruta sin recarga */
    const rutaActual = useNavigationStore((s) => s.rutaActual);
    const autenticado = useAuthStore(s => s.autenticado);
    const cargandoAuth = useAuthStore(s => s.cargando);
    const usuario = useAuthStore(s => s.usuario);

    /* QL116: Mostrar barra de selección múltiple en lugar del reproductor */
    const haySeleccion = useSeleccionSamplesStore(s => s.seleccionados.size > 0);

    /* QQ45+QK3: Auto-abrir modal de generos para usuarios sin preferencias.
     * Solo se abre si perfilVerificado=true (datos de API /me, no de cache parcial).
     * Sin esta guarda, el modal destella brevemente con datos del Tauri Store
     * que no incluyen generosPreferidos (campo agregado después del cache). */
    const perfilVerificado = useAuthStore(s => s.perfilVerificado);
    useEffect(() => {
        if (!autenticado || !usuario || cargandoAuth || !perfilVerificado) return;
        const sinGeneros = !usuario.generosPreferidos || usuario.generosPreferidos.length === 0;
        if (sinGeneros) {
            useGenerosModalStore.getState().abrir();
        }
    }, [autenticado, usuario, cargandoAuth, perfilVerificado]);

    /* QQ46: Cargar IDs de samples reproducidos al autenticar */
    useEffect(() => {
        if (!autenticado || cargandoAuth) return;
        useReproducidosStore.getState().cargar();
    }, [autenticado, cargandoAuth]);

    /* QL116: Limpiar selección múltiple al cambiar de ruta */
    useEffect(() => {
        useSeleccionSamplesStore.getState().limpiarSeleccion();
    }, [rutaActual]);

    /* [183A-48] DevTools eliminado — auth real siempre */

    const activa = useMemo(
        () => paginaActiva ?? detectarPaginaActiva(rutaActual),
        [paginaActiva, rutaActual]
    );

    /* Si no está autenticado y no está cargando, mostrar contenido público (landing).
     * F11: Durante carga de auth, mostrar layout completo con sidebar/topbar para evitar
     * flash público → privado. El skeleton del contenido lo maneja cada island. */
    if (!autenticado && !cargandoAuth) {
        return (
            <div className="layoutPublico">
                <NavPublico />
                <main className="areaContenidoPublico">
                    {children}
                </main>
                <ModalAuth />
                <NotificacionesToastBridge />
                <ContenedorToasts />
                <TooltipGlobal />
            </div>
        );
    }

    return (
        <div className="layoutPrincipal">
            <aside className="areaSidebar">
                <Sidebar activa={activa} />
            </aside>

            <header className="areaTopbar">
                <TopBar />
            </header>

            <main className="areaContenido">
                <div className="contenedorContenidoConPanel">
                    <div className="contenedorContenido">
                        {children}
                    </div>
                    <PanelLateral />
                </div>
            </main>

            <div className="areaReproductor">
                {haySeleccion ? <BarraSeleccionMultiple /> : <ReproductorGlobal />}
            </div>

            {/* Modal unificado de creación (subir sample + publicar) */}
            <ModalCrear />

            {/* [183A-109] Modal de escritura de artículos del blog */}
            <ModalArticulo />

            {/* Modal de publicación social (posts comunidad) */}
            <ModalPublicar />

            {/* Modal selector de colección (menú contextual → añadir a colección) */}
            <ModalSeleccionColeccion />

            {/* Modal de configuración de perfil */}
            <ModalConfiguracion />

            {/* QQ32: Modal de seguidores */}
            <ModalSeguidores />

            {/* QQ45: Modal de seleccion de generos favoritos */}
            <ModalGeneros />

            {/* C126: Modal de edicion unificado (samples/publicaciones/colecciones) */}
            <ModalEditar />

            {/* C800: Modal de correccion de metadata IA */}
            <ModalCorregirIA />

            {/* QQ130: Modal de extension de recorte de audio */}
            <ModalExtenderRecorte />

            {/* QQ38: Modal centralizado de reportes (usuario, publicacion, comentario, sample, error) */}
            <ModalReportar />

            {/* QQ63: Modal de solicitud de ingreso al grupo de WhatsApp */}
            <ModalSolicitudWhatsapp />

            {/* QQ60: Modal de confirmacion de compra de sample */}
            <ModalCompra />

            {/* QQ52: Visor modal de imágenes (chat, publicaciones, etc.) */}
            <VisorImagen />

            {/* QQ47: Tooltip flotante de perfil (hover card estilo Twitter/X) */}
            <TooltipPerfil />

            {/* Modal de planes (overlay, sin cambiar de isla) */}
            <PlanesIsland />

            {/* Chats flotantes tipo Messenger */}
            <ChatFlotante />

            {/* Modal de auth (login/registro) */}
            <ModalAuth />

            {/* QQ65: Overlay de suspensión — bloquea toda la UI si el usuario está suspendido */}
            <OverlaySuspension />

            {/* Puente store -> toast para nuevas notificaciones */}
            <NotificacionesToastBridge />

            {/* Toast notifications — esquina inferior derecha */}
            <ContenedorToasts />

            {/* [2003A-3] Modal de métricas del algoritmo — admin only */}
            <ModalAlgoTiming />

            {/* [Tarea Final] Modal de versión desactualizada — solo apps nativas (windows/apk) */}
            <ModalVersionDesactualizada />

            {/* QK54: Tooltip global — cualquier elemento con data-tooltip muestra tooltip */}
            <TooltipGlobal />
        </div>
    );
};

export default LayoutPrincipal;
