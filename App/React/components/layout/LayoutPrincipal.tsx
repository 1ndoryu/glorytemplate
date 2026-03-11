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
import { ModalCrear } from '../social/ModalCrear';
import { ModalPublicar } from '../social/ModalPublicar';
import { ModalSeleccionColeccion } from '../social/ModalSeleccionColeccion';
import { ModalConfiguracion } from '../social/ModalConfiguracion';
import { ModalEditar } from '../social/ModalEditar';
import { ModalCorregirIA } from '../social/ModalCorregirIA';
import { ChatFlotante } from '../social/ChatFlotante';
import { PlanesIsland } from '@app/islands/planes/PlanesIsland';
import { BotonDevTools } from '../ui/BotonDevTools';
import { ModalAuth } from '../auth/ModalAuth';
import { ContenedorToasts } from '../ui/ContenedorToasts';
import { NotificacionesToastBridge } from '../ui/NotificacionesToastBridge';
import { useNavigationStore } from '@/core/router';
import { useAuthStore } from '@app/stores/authStore';
import { useDevToolsStore } from '@app/stores/devToolsStore';
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

export const LayoutPrincipal = ({
    children,
    paginaActiva,
}: LayoutPrincipalProps): JSX.Element => {
    useEffect(() => {
        inicializarTemaApp();
    }, []);

    /* Se suscribe al store SPA para reaccionar a cambios de ruta sin recarga */
    const rutaActual = useNavigationStore((s) => s.rutaActual);
    const autenticado = useAuthStore(s => s.autenticado);
    const cargandoAuth = useAuthStore(s => s.cargando);
    const override = useDevToolsStore((s) => s.override);

    /* Modo de autenticación efectivo: real o simulado */
    const autenticadoEfectivo = override?.simulaDeslogueado ? false : autenticado;

    const activa = useMemo(
        () => paginaActiva ?? detectarPaginaActiva(rutaActual),
        [paginaActiva, rutaActual]
    );

    /* Si no está autenticado y no está cargando, mostrar contenido público (landing).
     * F11: Durante carga de auth, mostrar layout completo con sidebar/topbar para evitar
     * flash público → privado. El skeleton del contenido lo maneja cada island. */
    if (!autenticadoEfectivo && !cargandoAuth) {
        return (
            <div className="layoutPublico">
                <main className="areaContenidoPublico">
                    {children}
                </main>
                {/* Dev tools siempre visible para admin real */}
                <ModalAuth />
                <NotificacionesToastBridge />
                <ContenedorToasts />
                <BotonDevTools />
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
                <ReproductorGlobal />
            </div>

            {/* Modal unificado de creación (subir sample + publicar) */}
            <ModalCrear />

            {/* Modal de publicación social (posts comunidad) */}
            <ModalPublicar />

            {/* Modal selector de colección (menú contextual → añadir a colección) */}
            <ModalSeleccionColeccion />

            {/* Modal de configuración de perfil */}
            <ModalConfiguracion />

            {/* C126: Modal de edicion unificado (samples/publicaciones/colecciones) */}
            <ModalEditar />

            {/* C800: Modal de correccion de metadata IA */}
            <ModalCorregirIA />

            {/* Modal de planes (overlay, sin cambiar de isla) */}
            <PlanesIsland />

            {/* Chats flotantes tipo Messenger */}
            <ChatFlotante />

            {/* Modal de auth (login/registro) */}
            <ModalAuth />

            {/* Puente store -> toast para nuevas notificaciones */}
            <NotificacionesToastBridge />

            {/* Toast notifications — esquina inferior derecha */}
            <ContenedorToasts />

            {/* Dev tools: cambio de modo (solo admin) */}
            <BotonDevTools />
        </div>
    );
};

export default LayoutPrincipal;
