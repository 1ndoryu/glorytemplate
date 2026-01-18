import React, {useState} from 'react';
import {LayoutDashboard, Server, ShoppingBag, MessageSquare, CreditCard, Settings, LogOut, Plus, X, Search, Bell, Zap, Globe, Cpu, Terminal} from 'lucide-react';

/*
 * PanelCliente: Vista principal del usuario logueado (Fase 3).
 * Rediseño minimalista "Nakomi Dashboard" inspirado en Lucide + Glassmorphism sutil.
 *
 * Estilos: styles/layouts/panel.css
 */

interface PanelClienteProps {
    onLogout: () => void;
}

const Badge = ({children, type = 'default'}: {children: React.ReactNode; type?: 'active' | 'pending' | 'default' | 'accent'}) => {
    // Clases inline para badges (usando variables CSS via style si fuera necesario, aqui simulado con clases genericas si tuviera tailwind,
    // pero usaremos estilos en linea para mapear a variables Nakomi por compatibilidad rapida o clases auxiliares)

    let colorStyle = {};
    switch (type) {
        case 'active':
            colorStyle = {color: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.2)'};
            break;
        case 'pending':
            colorStyle = {color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.2)'};
            break;
        case 'accent':
            colorStyle = {color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)', borderColor: 'rgba(96, 165, 250, 0.2)'};
            break;
        default:
            colorStyle = {color: '#9ca3af', backgroundColor: 'rgba(156, 163, 175, 0.1)', borderColor: 'rgba(156, 163, 175, 0.2)'};
            break;
    }

    return (
        <span
            style={{
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1px solid',
                ...colorStyle
            }}>
            {children}
        </span>
    );
};

/* --- VISTAS INTRA-PANEL --- */

const VistaResumen = () => (
    <div className="animate-fade-in space-y-8">
        {/* Stats Grid */}
        <div className="dashboardGrid">
            <div className="nakomiCard">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <span className="textIndice">Servicios Activos</span>
                    <Zap size={16} style={{color: 'var(--nakomi-acento)'}} />
                </div>
                <div className="dataBig">3</div>
            </div>
            <div className="nakomiCard">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <span className="textIndice">Facturas</span>
                    <CreditCard size={16} style={{color: 'var(--nakomi-textoSecundario)'}} />
                </div>
                <div className="dataBig">0€</div>
            </div>
            <div className="nakomiCard">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <span className="textIndice">Mensajes</span>
                    <MessageSquare size={16} style={{color: 'var(--nakomi-acento)'}} />
                </div>
                <div className="dataBig">1</div>
            </div>
        </div>

        {/* Lista Proyectos */}
        <div>
            <h3 className="textIndice" style={{marginBottom: '1rem'}}>
                En Progreso
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {[
                    {id: 1, nombre: 'task.nakomi.studio', servicio: 'Desarrollo React', estado: 'active', entrega: '3 días'},
                    {id: 2, nombre: 'Mabuhay Viajes', servicio: 'Mantenimiento WordPress', estado: 'active', entrega: 'Mensual'}
                ].map(p => (
                    <div key={p.id} className="nakomiCard" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', cursor: 'pointer'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                            <div style={{width: 40, height: 40, borderRadius: 4, background: 'var(--nakomi-fondoTerciario)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nakomi-textoApagado)'}}>
                                <Globe size={18} />
                            </div>
                            <div>
                                <h4 style={{fontSize: '0.875rem', fontWeight: 500, color: 'var(--nakomi-textoNormal)', margin: 0}}>{p.nombre}</h4>
                                <p style={{fontSize: '0.75rem', color: 'var(--nakomi-textoApagado)', margin: '2px 0 0 0'}}>{p.servicio}</p>
                            </div>
                        </div>
                        <Badge type={p.estado === 'active' ? 'active' : 'pending'}>{p.estado === 'active' ? 'En Desarrollo' : 'Pendiente'}</Badge>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const VistaHosting = () => {
    const [tab, setTab] = useState('general');

    return (
        <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
            <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <div>
                    <h2 style={{fontSize: '1.25rem', color: 'var(--nakomi-textoActivo)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 300, margin: 0}}>
                        <div style={{padding: '6px', background: 'var(--nakomi-fondoTerciario)', borderRadius: '4px', color: 'var(--nakomi-acento)', display: 'flex'}}>
                            <Server size={18} />
                        </div>
                        srv-nakomi-01
                    </h2>
                    <p style={{fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--nakomi-textoApagado)', marginTop: '0.5rem', marginLeft: '4px'}}>IP: 192.168.1.45 • Ubuntu 22.04</p>
                </div>
                <div style={{display: 'flex', gap: '0.75rem'}}>
                    <button style={{padding: '6px 16px', background: 'rgba(153, 27, 27, 0.1)', color: '#f87171', fontSize: '0.75rem', fontWeight: 500, borderRadius: '4px', border: '1px solid rgba(153, 27, 27, 0.2)', cursor: 'pointer'}}>Detener</button>
                    <button style={{padding: '6px 16px', background: 'rgba(22, 101, 52, 0.1)', color: '#4ade80', fontSize: '0.75rem', fontWeight: 500, borderRadius: '4px', border: '1px solid rgba(22, 101, 52, 0.2)', cursor: 'pointer'}}>Reiniciar</button>
                </div>
            </header>

            <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--nakomi-bordePrincipal)', paddingBottom: '0.75rem'}}>
                {['General', 'Archivos', 'Terminal', 'Logs'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t.toLowerCase())}
                        style={{
                            padding: '6px 16px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderRadius: '999px',
                            border: 'none',
                            cursor: 'pointer',
                            color: tab === t.toLowerCase() ? 'var(--nakomi-textoActivo)' : 'var(--nakomi-textoApagado)',
                            backgroundColor: tab === t.toLowerCase() ? 'var(--nakomi-fondoHover)' : 'transparent',
                            transition: 'all 0.2s'
                        }}>
                        {t}
                    </button>
                ))}
            </div>

            <div style={{flex: 1, overflowY: 'auto'}}>
                {tab === 'general' && (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
                        <div className="nakomiCard">
                            <h4 className="textIndice" style={{marginBottom: '1.25rem'}}>
                                Recursos del Sistema
                            </h4>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                                <div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--nakomi-textoApagado)'}}>
                                        <span>CPU Load</span>
                                        <span>45%</span>
                                    </div>
                                    <div style={{height: '6px', width: '100%', background: 'var(--nakomi-fondoTerciario)', borderRadius: '999px', overflow: 'hidden'}}>
                                        <div style={{height: '100%', background: 'var(--nakomi-acento)', width: '45%', borderRadius: '999px'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--nakomi-textoApagado)'}}>
                                        <span>RAM Usage</span>
                                        <span>2.4GB / 4GB</span>
                                    </div>
                                    <div style={{height: '6px', width: '100%', background: 'var(--nakomi-fondoTerciario)', borderRadius: '999px', overflow: 'hidden'}}>
                                        <div style={{height: '100%', background: '#a855f7', width: '60%', borderRadius: '999px'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="nakomiCard">
                            <h4 className="textIndice" style={{marginBottom: '1.25rem'}}>
                                Acceso SSH Rápido
                            </h4>
                            <div style={{background: 'var(--nakomi-fondoPrincipal)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--nakomi-bordeSutil)', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--nakomi-textoApagado)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span>ssh nakomi@192.168.1.45 -p 22</span>
                                <Terminal size={14} />
                            </div>
                            <p style={{fontSize: '10px', color: 'var(--nakomi-textoMuyApagado)', marginTop: '0.75rem'}}>Utiliza tu clave privada configurada en el perfil.</p>
                        </div>
                    </div>
                )}
                {tab === 'terminal' && (
                    <div style={{height: '400px', background: '#050505', border: '1px solid var(--nakomi-bordeSutil)', borderRadius: '6px', padding: '1rem', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6'}}>
                        <div style={{color: '#22c55e', marginBottom: '4px'}}>nakomi@server:~$ status check</div>
                        <div style={{color: '#fff', marginBottom: '8px'}}>All systems operational. Uptime: 14 days, 2 hours.</div>
                        <div style={{color: '#22c55e', marginBottom: '4px'}}>nakomi@server:~$ docker ps</div>
                        <div style={{color: 'var(--nakomi-textoSecundario)', marginBottom: '8px', whiteSpace: 'pre-wrap'}}>
                            CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS{'\n'}
                            a1b2c3d4e5f6 nginx:latest "/docker-entrypoint.…" 2 days ago Up 2 days 0.0.0.0:80{'>'}80/tcp
                        </div>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{color: '#22c55e', marginRight: '8px'}}>nakomi@server:~$</span>
                            <span style={{display: 'inline-block', width: '8px', height: '16px', background: '#fff'}}></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/* --- LAYOUT PRINCIPAL --- */

export const PanelCliente: React.FC<PanelClienteProps> = ({onLogout}) => {
    const [vista, setVista] = useState('resumen');

    // Mapeo vistas a tabs del header (historial de navegación simple)
    const tabs = [
        {id: 'resumen', label: 'Resumen General'},
        {id: 'hosting', label: 'srv-nakomi-01'},
        {id: 'new', label: '', icon: true}
    ];

    const menuItems = [
        {id: 'resumen', icon: <LayoutDashboard size={22} />, label: 'Resumen'},
        {id: 'servicios', icon: <ShoppingBag size={22} />, label: 'Marketplace'},
        {id: 'hosting', icon: <Server size={22} />, label: 'Hosting', badge: true},
        {id: 'proyectos', icon: <Globe size={22} />, label: 'Portafolio'},
        {id: 'mensajes', icon: <MessageSquare size={22} />, label: 'Mensajes'},
        {id: 'pagos', icon: <CreditCard size={22} />, label: 'Facturación'}
    ];

    const getVistaComponent = () => {
        switch (vista) {
            case 'resumen':
                return <VistaResumen />;
            case 'hosting':
                return <VistaHosting />;
            case 'servicios':
                return (
                    <div>
                        <header style={{marginBottom: '2rem'}}>
                            <h2 style={{fontSize: '1.25rem', fontWeight: 300, color: 'var(--nakomi-textoActivo)', margin: 0}}>Marketplace</h2>
                            <p style={{fontSize: '0.75rem', color: 'var(--nakomi-textoApagado)', marginTop: '4px'}}>Explora y contrata servicios digitales premium.</p>
                        </header>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem'}}>
                            <div className="nakomiCard">
                                <div style={{width: 48, height: 48, background: 'var(--nakomi-fondoPrincipal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--nakomi-bordeSutil)'}}>
                                    <Cpu size={24} color="var(--nakomi-textoSecundario)" />
                                </div>
                                <h3 style={{fontSize: '1rem', fontWeight: 500, color: 'var(--nakomi-textoNormal)', marginBottom: '0.5rem'}}>Aplicación React</h3>
                                <p style={{fontSize: '0.75rem', color: 'var(--nakomi-textoSecundario)', lineHeight: 1.6, marginBottom: '1.5rem'}}>Desarrollo de Single Page Application escalable y optimizada.</p>
                                <button style={{width: '100%', padding: '8px', fontSize: '0.75rem', fontWeight: 500, color: 'var(--nakomi-textoActivo)', background: 'var(--nakomi-fondoPrincipal)', border: '1px solid var(--nakomi-bordeSutil)', borderRadius: '4px', cursor: 'pointer'}}>Ver Detalles</button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nakomi-textoApagado)'}}>Sección en construcción</div>;
        }
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
                            {React.cloneElement(item.icon as React.ReactElement, {size: 16})}
                            <span className="tooltip">{item.label}</span>
                            {item.badge && <span className="badgeDot"></span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebarFooter">
                    <button className="navIconBtn">
                        <Settings size={16} />
                        <span className="tooltip">Configuración</span>
                    </button>
                    <button className="navIconBtn" style={{color: '#f87171'}} onClick={onLogout}>
                        <LogOut size={16} />
                        <span className="tooltip">Salir</span>
                    </button>
                </div>
            </aside>

            {/* Contenido */}
            <div className="panelContentWrapper">
                <header className="panelHeader">
                    <div className="headerTabs">
                        {tabs.map(tab => (
                            <div key={tab.id} onClick={() => !tab.icon && setVista(tab.id)} className={`headerTab ${vista === tab.id ? 'active' : ''} ${tab.icon ? 'iconTab' : ''}`}>
                                {tab.icon ? <Plus size={16} style={{color: 'var(--nakomi-textoApagado)'}} /> : <span>{tab.label}</span>}
                                {!tab.icon && vista === tab.id && <X size={12} style={{marginLeft: '6px', opacity: 0.5}} />}
                            </div>
                        ))}
                    </div>

                    <div className="headerTools">
                        <div className="searchBox">
                            <Search className="searchIcon" />
                            <input type="text" placeholder="Buscar en Nakomi..." className="searchInput" />
                        </div>

                        <div className="userProfile">
                            <button style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nakomi-textoApagado)', position: 'relative'}}>
                                <Bell size={16} />
                                <span style={{position: 'absolute', top: 0, right: 0, width: 6, height: 6, background: 'var(--nakomi-acento)', borderRadius: '50%', border: '1px solid var(--nakomi-fondoSecundario)'}}></span>
                            </button>

                            <div style={{display: 'flex', alignItems: 'center', gap: '0.6rem', paddingLeft: '1rem', borderLeft: '1px solid var(--nakomi-bordeSutil)', height: '1.5rem'}}>
                                <div className="userInfo">
                                    <p className="userName">Admin User</p>
                                    <p className="userRole">Nakomi Customer</p>
                                </div>
                                <div className="userAvatar">U</div>
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
