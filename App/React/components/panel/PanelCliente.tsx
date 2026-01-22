import React, {useState} from 'react';
import {LayoutDashboard, Server, ShoppingBag, MessageSquare, CreditCard, Settings, LogOut, Plus, X, Search, Bell, Globe, User, HelpCircle, ChevronDown, Briefcase} from 'lucide-react';
import {VistaResumen} from './views/VistaResumen';
import {VistaHosting} from './views/VistaHosting';
import {VistaMarketplace} from './views/VistaMarketplace';
import {VistaFacturas} from './views/VistaFacturas';
import {VistaPerfil} from './views/VistaPerfil';
import {VistaServicios} from './views/VistaServicios';
import {PanelProvider, usePanel} from '../../context/PanelContext';

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
        <PanelProvider>
            <PanelLayout {...props} />
        </PanelProvider>
    );
};

const PanelLayout: React.FC<PanelClienteProps> = ({onLogout}) => {
    const {mensajes} = usePanel();
    const [vista, setVista] = useState('resumen');
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuItems = [
        {id: 'resumen', icon: <LayoutDashboard size={22} />, label: 'Resumen'},
        {id: 'marketplace', icon: <ShoppingBag size={22} />, label: 'Marketplace'},
        {id: 'misServicios', icon: <Briefcase size={22} />, label: 'Mis Servicios'},
        {id: 'hosting', icon: <Server size={22} />, label: 'Mis Hostings'},
        {id: 'mensajes', icon: <MessageSquare size={22} />, label: 'Mensajes', badge: mensajes > 0},
        {id: 'pagos', icon: <CreditCard size={22} />, label: 'Facturación'}
    ];

    // Icono Globe dinámico para evitar error de importación si no se usa arriba
    function getMenuIcon(item: any) {
        return React.cloneElement(item.icon, {size: 16});
    }

    const getVistaComponent = () => {
        switch (vista) {
            case 'resumen':
                return <VistaResumen />;
            case 'hosting':
                return <VistaHosting />;
            case 'marketplace':
                return <VistaMarketplace />;
            case 'misServicios':
                return <VistaServicios />;
            case 'pagos':
                return <VistaFacturas />;
            case 'perfil':
                return <VistaPerfil />;
            default:
                return <div className="vistaConstruccion">Sección en construcción</div>;
        }
    };

    // Obtener título de la vista actual
    const getActiveTitle = () => {
        const item = menuItems.find(i => i.id === vista);
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
                        <button key={item.id} onClick={() => setVista(item.id)} className={`navIconBtn ${vista === item.id ? 'active' : ''}`}>
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
                            <button className="botonNotificacion">
                                <Bell size={16} />
                                <span className="notificacionDot"></span>
                            </button>

                            <div className="userMenuWrapper" style={{position: 'relative'}}>
                                <button className="userAvatarBtn" onClick={() => setShowUserMenu(!showUserMenu)}>
                                    <div className="userAvatar">G</div>
                                </button>

                                {showUserMenu && (
                                    <div className="dropdownMenu">
                                        <div className="dropdownHeader">
                                            <p className="dropdownName">Guillermo</p>
                                            <p className="dropdownRole">guillermo@example.com</p>
                                        </div>
                                        <div className="dropdownDivider"></div>
                                        <button
                                            className="dropdownItem"
                                            onClick={() => {
                                                setVista('perfil');
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
