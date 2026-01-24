import React, {useState} from 'react';
import {LayoutDashboard, Server, ShoppingBag, MessageSquare, CreditCard, Settings, LogOut, Bell, Globe, User, HelpCircle, Briefcase, Eye} from 'lucide-react';
import {VistaResumen} from './views/VistaResumen';
import {VistaHosting} from './views/VistaHosting';
import {VistaDominios} from './views/VistaDominios';
import {VistaMarketplace} from './views/VistaMarketplace';
import {VistaFacturas} from './views/VistaFacturas';
import {VistaPerfil} from './views/VistaPerfil';
import {VistaServicios} from './views/VistaServicios';
import {PaginaServicio} from './views/PaginaServicio';
import {PanelProvider, usePanel} from '../../context/PanelContext';
import {UsuarioProvider, useUsuario} from '../../context/UsuarioContext';
import {ToggleSimulacion} from './ToggleSimulacion';

/*
 * PanelCliente: Vista principal del usuario logueado (Fase 3).
 * Refactorizado para usar vistas modulares y CSS classes.
 *
 * Estilos: styles/layouts/panel.css
 */

interface PanelClienteProps {
    onLogout: () => void;
}

export const PanelCliente: React.FC<PanelClienteProps> = props => {
    return (
        <UsuarioProvider>
            <PanelProvider>
                <PanelLayout {...props} />
            </PanelProvider>
        </UsuarioProvider>
    );
};

const PanelLayout: React.FC<PanelClienteProps> = ({onLogout}) => {
    const {mensajes, vistaActual, navegarA} = usePanel();
    const {usuario, esAdmin, simulando} = useUsuario();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuItems = [
        {id: 'resumen', icon: <LayoutDashboard size={22} />, label: 'Resumen'},
        {id: 'marketplace', icon: <ShoppingBag size={22} />, label: 'Marketplace'},
        {id: 'misServicios', icon: <Briefcase size={22} />, label: 'Mis Servicios'},
        {id: 'hosting', icon: <Server size={22} />, label: 'Mis Hostings'},
        {id: 'dominios', icon: <Globe size={22} />, label: 'Mis Dominios'},
        {id: 'mensajes', icon: <MessageSquare size={22} />, label: 'Mensajes', badge: mensajes > 0},
        {id: 'pagos', icon: <CreditCard size={22} />, label: 'Facturación'}
    ];

    // Icono Globe dinámico para evitar error de importación si no se usa arriba
    function getMenuIcon(item: any) {
        return React.cloneElement(item.icon, {size: 16});
    }

    const getVistaComponent = () => {
        switch (vistaActual) {
            case 'resumen':
                return <VistaResumen />;
            case 'hosting':
                return <VistaHosting />;
            case 'dominios':
                return <VistaDominios />;
            case 'marketplace':
                return <VistaMarketplace />;
            case 'misServicios':
                return <VistaServicios />;
            case 'pagos':
                return <VistaFacturas />;
            case 'perfil':
                return <VistaPerfil />;
            case 'detalle_servicio':
                return <PaginaServicio />;
            default:
                return <div className="vistaConstruccion">Sección en construcción</div>;
        }
    };

    // Obtener título de la vista actual
    const getActiveTitle = () => {
        if (vistaActual === 'detalle_servicio') return 'Detalle del Servicio';
        const item = menuItems.find(i => i.id === vistaActual);
        return item ? item.label : 'Panel';
    };

    return (
        <div className="panelLayout">
            {/* Sidebar */}
            <aside className="panelSidebar">
                <div className="sidebarLogoArea">
                    <div className="logoIcon">N</div>
                </div>

                <nav className="sidebarNav">
                    {menuItems.map(item => (
                        <button key={item.id} onClick={() => navegarA(item.id)} className={`navIconBtn ${vistaActual === item.id ? 'active' : ''}`}>
                            {getMenuIcon(item)}
                            <span className="tooltip">{item.label}</span>
                            {(item.badge || (item.id === 'mensajes' && mensajes > 0)) && <span className="badgeDot"></span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebarFooter">
                    <button className="navIconBtn">
                        <Settings size={16} />
                        <span className="tooltip">Configuración</span>
                    </button>
                    <button className="navIconBtn botonSalir" onClick={onLogout}>
                        <LogOut size={16} />
                        <span className="tooltip">Salir</span>
                    </button>
                </div>
            </aside>

            {/* Contenido */}
            <div className="panelContentWrapper">
                <header className="panelHeader">
                    <div className="headerTabs">
                        <div className="headerTab active">
                            <span>{getActiveTitle()}</span>
                        </div>
                    </div>

                    <div className="headerTools">
                        <div className="userProfile">
                            <ToggleSimulacion />
                            <button className="botonNotificacion">
                                <Bell size={16} />
                                <span className="notificacionDot"></span>
                            </button>

                            <div className="userMenuWrapper" style={{position: 'relative'}}>
                                <button className="userAvatarBtn" onClick={() => setShowUserMenu(!showUserMenu)}>
                                    <div className="userAvatar">{usuario.avatar}</div>
                                </button>

                                {showUserMenu && (
                                    <div className="dropdownMenu">
                                        <div className="dropdownHeader">
                                            <p className="dropdownName">{usuario.nombre}</p>
                                            <p className="dropdownRole">{usuario.email}</p>
                                        </div>
                                        <div className="dropdownDivider"></div>
                                        <button
                                            className="dropdownItem"
                                            onClick={() => {
                                                navegarA('perfil');
                                                setShowUserMenu(false);
                                            }}>
                                            <User size={14} />
                                            <span>Mi Perfil</span>
                                        </button>
                                        <button className="dropdownItem">
                                            <Settings size={14} />
                                            <span>Configuración</span>
                                        </button>
                                        <button className="dropdownItem">
                                            <HelpCircle size={14} />
                                            <span>Ayuda</span>
                                        </button>
                                        <div className="dropdownDivider"></div>
                                        <button className="dropdownItem text-red" onClick={onLogout}>
                                            <LogOut size={14} />
                                            <span>Cerrar Sesión</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mainView">{getVistaComponent()}</main>
            </div>
        </div>
    );
};

export default PanelCliente;
