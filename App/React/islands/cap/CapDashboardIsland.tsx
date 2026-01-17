/**
 * CapDashboardIsland
 *
 * Panel principal del sistema CAP.
 * Contiene el layout con sidebar y navegación entre secciones.
 */

import {useState} from 'react';
import {Badge, Boton, Tarjeta, TarjetaHeader, TarjetaBody} from './components/ui';
import {IconoCalendario, IconoUsuarios, IconoConfiguracion, IconoCerrarSesion, IconoMenu, IconoLogoCap} from './components/icons';
import './styles/index.css';
import './components/dashboard/dashboard.css';

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
                        <IconoLogoCap />
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
                        <IconoCalendario size={48} />
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
                        <IconoUsuarios size={48} />
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
