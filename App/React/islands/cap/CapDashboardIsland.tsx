/**
 * CapDashboardIsland
 *
 * Panel principal del sistema CAP.
 * Contiene el layout con sidebar y navegación entre secciones.
 */

import {useState} from 'react';
import {Badge, Boton, Tarjeta, TarjetaHeader, TarjetaBody} from './components/ui';
import './styles/index.css';
import './components/dashboard/dashboard.css';

/* Iconos inline */
function IconoCalendario() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}

function IconoUsuarios() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function IconoConfiguracion() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function IconoCerrarSesion() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    );
}

function IconoMenu() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    );
}

function IconoLogo() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 6v6" />
            <path d="M15 6v6" />
            <path d="M2 12h19.6" />
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
            <circle cx="7" cy="18" r="2" />
            <path d="M9 18h5" />
            <circle cx="16" cy="18" r="2" />
        </svg>
    );
}

type SeccionActiva = 'calendario' | 'alumnos' | 'configuracion';

interface CapDashboardIslandProps {
    user: {
        id: number;
        name: string;
        email: string;
    };
    restNonce: string;
    restUrl: string;
    siteUrl: string;
}

interface ItemNavegacion {
    id: SeccionActiva;
    label: string;
    icono: JSX.Element;
}

const itemsNavegacion: ItemNavegacion[] = [
    {id: 'calendario', label: 'Calendario', icono: <IconoCalendario />},
    {id: 'alumnos', label: 'Alumnos', icono: <IconoUsuarios />},
    {id: 'configuracion', label: 'Configuración', icono: <IconoConfiguracion />}
];

export function CapDashboardIsland({user, restNonce, restUrl, siteUrl}: CapDashboardIslandProps) {
    const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('calendario');
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    const handleCerrarSesion = () => {
        /* Redirigir al logout de WordPress */
        const logoutUrl = `${siteUrl}/wp-login.php?action=logout`;
        window.location.href = logoutUrl;
    };

    const renderContenido = () => {
        switch (seccionActiva) {
            case 'calendario':
                return <SeccionCalendario />;
            case 'alumnos':
                return <SeccionAlumnos />;
            case 'configuracion':
                return <SeccionConfiguracion userName={user.name} userEmail={user.email} />;
            default:
                return <SeccionCalendario />;
        }
    };

    return (
        <div className="capApp capDashboard" id="dashboardCAP">
            {/* Overlay para móvil */}
            {sidebarAbierto && <div className="capDashboard__overlay" onClick={() => setSidebarAbierto(false)} />}

            {/* Sidebar */}
            <aside className={`capDashboard__sidebar ${sidebarAbierto ? 'capDashboard__sidebar--abierto' : ''}`}>
                <div className="capSidebar__header">
                    <div className="capSidebar__logo">
                        <IconoLogo />
                    </div>
                    <span className="capSidebar__titulo">Gestor CAP</span>
                </div>

                <nav className="capSidebar__nav">
                    {itemsNavegacion.map(item => (
                        <button
                            key={item.id}
                            className={`capSidebar__item ${seccionActiva === item.id ? 'capSidebar__item--activo' : ''}`}
                            onClick={() => {
                                setSeccionActiva(item.id);
                                setSidebarAbierto(false);
                            }}>
                            <span className="capSidebar__itemIcono">{item.icono}</span>
                            <span className="capSidebar__itemLabel">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="capSidebar__footer">
                    <div className="capSidebar__usuario">
                        <div className="capSidebar__avatar">{user.name.charAt(0).toUpperCase()}</div>
                        <div className="capSidebar__usuarioInfo">
                            <span className="capSidebar__usuarioNombre">{user.name}</span>
                            <Badge variante="exito" tamano="sm">
                                Activa
                            </Badge>
                        </div>
                    </div>
                    <button className="capSidebar__cerrarSesion" onClick={handleCerrarSesion} title="Cerrar sesión">
                        <IconoCerrarSesion />
                    </button>
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="capDashboard__main">
                {/* Header móvil */}
                <header className="capDashboard__header">
                    <button className="capDashboard__menuBtn" onClick={() => setSidebarAbierto(true)}>
                        <IconoMenu />
                    </button>
                    <h1 className="capDashboard__headerTitulo">{itemsNavegacion.find(i => i.id === seccionActiva)?.label}</h1>
                    <div className="capDashboard__headerAcciones">{/* Acciones contextuales aquí */}</div>
                </header>

                {/* Área de contenido */}
                <div className="capDashboard__contenido">{renderContenido()}</div>
            </main>
        </div>
    );
}

/* Componentes de sección placeholder - se implementarán en fases siguientes */
function SeccionCalendario() {
    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Calendario</h2>
                <p className="capTexto capTexto--secundario">Gestiona las clases del curso CAP</p>
            </div>

            <Tarjeta className="capMt--lg">
                <TarjetaBody>
                    <div className="capPlaceholder">
                        <IconoCalendario />
                        <h3 className="capTitulo capTitulo--sm capMt--md">Próximamente</h3>
                        <p className="capTexto capTexto--secundario capMt--sm">El calendario de clases estará disponible en la siguiente fase de desarrollo.</p>
                        <Boton variante="primario" className="capMt--lg" disabled>
                            Generar Calendario
                        </Boton>
                    </div>
                </TarjetaBody>
            </Tarjeta>
        </div>
    );
}

function SeccionAlumnos() {
    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Alumnos</h2>
                <p className="capTexto capTexto--secundario">Gestiona los alumnos de tu autoescuela</p>
            </div>

            <Tarjeta className="capMt--lg">
                <TarjetaBody>
                    <div className="capPlaceholder">
                        <IconoUsuarios />
                        <h3 className="capTitulo capTitulo--sm capMt--md">Próximamente</h3>
                        <p className="capTexto capTexto--secundario capMt--sm">La gestión de alumnos estará disponible en la siguiente fase de desarrollo.</p>
                        <Boton variante="primario" className="capMt--lg" disabled>
                            Añadir Alumno
                        </Boton>
                    </div>
                </TarjetaBody>
            </Tarjeta>
        </div>
    );
}

interface SeccionConfiguracionProps {
    userName: string;
    userEmail: string;
}

function SeccionConfiguracion({userName, userEmail}: SeccionConfiguracionProps) {
    return (
        <div className="capSeccion capAnimFadeIn">
            <div className="capSeccion__header">
                <h2 className="capTitulo capTitulo--lg">Configuración</h2>
                <p className="capTexto capTexto--secundario">Ajustes de tu centro y suscripción</p>
            </div>

            <div className="capGrid capGrid--2cols capGap--lg capMt--lg">
                <Tarjeta>
                    <TarjetaHeader>
                        <h3 className="capTitulo capTitulo--sm">Perfil</h3>
                    </TarjetaHeader>
                    <TarjetaBody>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Nombre</span>
                            <span className="capConfigItem__value">{userName}</span>
                        </div>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Email</span>
                            <span className="capConfigItem__value">{userEmail}</span>
                        </div>
                    </TarjetaBody>
                </Tarjeta>

                <Tarjeta>
                    <TarjetaHeader>
                        <h3 className="capTitulo capTitulo--sm">Suscripción</h3>
                    </TarjetaHeader>
                    <TarjetaBody>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Plan</span>
                            <Badge variante="exito">Activo</Badge>
                        </div>
                        <div className="capConfigItem">
                            <span className="capConfigItem__label">Próxima facturación</span>
                            <span className="capConfigItem__value">Período de prueba</span>
                        </div>
                        <Boton variante="outline" tamano="sm" className="capMt--md" disabled>
                            Gestionar Pagos
                        </Boton>
                    </TarjetaBody>
                </Tarjeta>
            </div>
        </div>
    );
}

export default CapDashboardIsland;
