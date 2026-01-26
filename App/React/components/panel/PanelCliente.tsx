import React, {useState} from 'react';
import {LayoutDashboard, Server, ShoppingBag, MessageSquare, CreditCard, Settings, LogOut, Bell, Globe, User, HelpCircle, Briefcase, Eye} from 'lucide-react';
import {Boton} from '../ui/Boton';
import {VistaResumen} from './views/VistaResumen';
import {VistaHosting} from './views/VistaHosting';
import {VistaDominios} from './views/VistaDominios';
import {VistaMarketplace} from './views/VistaMarketplace';
import {VistaFacturas} from './views/VistaFacturas';
import {VistaPerfil} from './views/VistaPerfil';
import {VistaServicios} from './views/VistaServicios';
import {PaginaServicio} from './views/PaginaServicio';
import {PaginaServicioContratado} from './views/PaginaServicioContratado';
import {VistaResumenAdmin} from './views/admin';
import {PanelProvider, usePanel} from '../../context/PanelContext';
import {UsuarioProvider, useUsuario} from '../../context/UsuarioContext';
import {ToggleSimulacion} from './ToggleSimulacion';
import {MenuContextual} from '../ui/MenuContextual';

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
        /* Admin sin simulación ve dashboard admin, en simulación ve dashboard cliente */
        const esVistaAdmin = esAdmin && !simulando;

        switch (vistaActual) {
            case 'resumen':
                return esVistaAdmin ? <VistaResumenAdmin /> : <VistaResumen />;
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
            case 'detalle_servicio_contratado':
                return <PaginaServicioContratado />;
            default:
                return <div className="vistaConstruccion">Sección en construcción</div>;
        }
    };

    // Obtener título de la vista actual
    const getActiveTitle = () => {
        if (vistaActual === 'detalle_servicio') return 'Detalle del Servicio';
        if (vistaActual === 'detalle_servicio_contratado') return 'Mi Servicio';
        const item = menuItems.find(i => i.id === vistaActual);
        return item ? item.label : 'Panel';
    };

    return (
        <>
            <div className="panelLayout">
                {/* Sidebar */}
                <aside className="panelSidebar">
                    <div className="sidebarLogoArea">
                        <div className="logoIcon">N</div>
                    </div>

                    <nav className="sidebarNav">
                        {menuItems.map(item => (
                            <Boton key={item.id} onClick={() => navegarA(item.id)} className={`navIconBtn ${vistaActual === item.id ? 'active' : ''}`} variante="ghost" icono={getMenuIcon(item)}>
                                <span className="navLabel">{item.label}</span>
                                {(item.badge || (item.id === 'mensajes' && mensajes > 0)) && <span className="badgeDot"></span>}
                            </Boton>
                        ))}
                    </nav>

                    <div className="sidebarFooter">
                        <Boton variante="ghost" className="navIconBtn">
                            <Settings size={16} />
                            <span className="navLabel">Configuración</span>
                        </Boton>
                        <Boton variante="ghost" className="navIconBtn botonSalir" onClick={onLogout}>
                            <LogOut size={16} />
                            <span className="navLabel">Salir</span>
                        </Boton>
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
                                <Boton className="botonNotificacion" variante="ghost" icono={<Bell size={16} />}>
                                    <span className="notificacionDot"></span>
                                </Boton>

                                <MenuContextual
                                    trigger={
                                        <Boton className="userAvatarBtn" variante="ghost" pill>
                                            <div className="userAvatar">{usuario.avatar && usuario.avatar.includes('http') ? <img src={usuario.avatar} alt={usuario.nombre} style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} /> : usuario.avatar}</div>
                                        </Boton>
                                    }
                                    cabecera={
                                        <div>
                                            <p className="dropdownName">{usuario.nombre}</p>
                                            <p className="dropdownRole">{usuario.email}</p>
                                        </div>
                                    }
                                    anchoMinimo={200}
                                    acciones={[
                                        {
                                            id: 'perfil',
                                            label: 'Mi Perfil',
                                            icono: <User size={14} />,
                                            onClick: () => navegarA('perfil')
                                        },
                                        {
                                            id: 'config',
                                            label: 'Configuración',
                                            icono: <Settings size={14} />,
                                            onClick: () => {}
                                        },
                                        {
                                            id: 'ayuda',
                                            label: 'Ayuda',
                                            icono: <HelpCircle size={14} />,
                                            onClick: () => {}
                                        },
                                        {
                                            id: 'salir',
                                            label: 'Cerrar Sesión',
                                            icono: <LogOut size={14} />,
                                            onClick: onLogout,
                                            peligroso: true,
                                            separadorAntes: true
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                    </header>

                    <main className="mainView">{getVistaComponent()}</main>
                </div>
            </div>
            {/* Contenedor para modales - fuera del panelLayout para evitar overflow:hidden */}
            <div id="modal-root"></div>
        </>
    );
};

export default PanelCliente;
