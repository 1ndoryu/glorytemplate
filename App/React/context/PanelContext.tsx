/*
 * Contexto del Panel Cliente.
 * Provee datos filtrados según el rol del usuario actual.
 * Usa facturacionService para obtener datos reales de WordPress/BD.
 */

import React, {createContext, useContext, useState, useEffect, useMemo, ReactNode} from 'react';
import {useUsuario} from './UsuarioContext';
import {facturacionService} from '../services/facturacionService';
import {formatearFecha} from '../utils/fechaUtils';

/* Tipos */
import {ServicioPublicado} from '../data/types/servicio';
import {Factura, FacturaSimple} from '../data/types/facturacion';
import {HostingContratado} from '../data/types/hosting';
import {DominioContratado} from '../data/types/dominio';
import {ServicioContratado} from '../data/types/servicio';
import {Cliente} from '../data/types/cliente';

export interface Proyecto {
    id: number;
    nombre: string;
    servicio: string;
    estado: 'active' | 'pending';
    entrega: string;
}

export interface ServerStats {
    cpu: number;
    ram: number;
    ramTotal: number;
    uptime: string;
    ip: string;
    os: string;
}

export interface UserProfile {
    name: string;
    email: string;
    role: string;
    avatar: string;
}

interface PanelContextType {
    proyectos: Proyecto[];
    servicios: ServicioPublicado[];
    serverStats: ServerStats;
    mensajes: number;
    facturas: Factura[];
    hostingsContratados: HostingContratado[];
    dominiosContratados: DominioContratado[];
    serviciosContratados: ServicioContratado[];
    clientes: Cliente[];
    user: UserProfile;
    loading: boolean;
    esVistaAdmin: boolean;
    refreshData: () => Promise<void>;
    actualizarHosting: (hosting: HostingContratado) => void;
    actualizarDominio: (dominio: DominioContratado) => void;
    marcarProductosComoPagados: (productosRef: string[]) => void;
    vistaActual: string;
    parametrosVista: any;
    navegarA: (vista: string, params?: any) => void;
}

const defaultStats: ServerStats = {
    cpu: 0,
    ram: 0,
    ramTotal: 4,
    uptime: '-',
    ip: '0.0.0.0',
    os: 'Linux'
};

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export const PanelProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const {usuario, clienteId, esAdmin, simulando} = useUsuario();

    // Data States
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [servicios, setServicios] = useState<ServicioPublicado[]>([]);
    const [facturasRaw, setFacturasRaw] = useState<Factura[]>([]);
    const [allHostings, setAllHostings] = useState<HostingContratado[]>([]);
    const [allDominios, setAllDominios] = useState<DominioContratado[]>([]);
    const [allServiciosContratados, setAllServiciosContratados] = useState<ServicioContratado[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    // UI States
    const [serverStats, setServerStats] = useState<ServerStats>(defaultStats);
    const [mensajes, setMensajes] = useState(0);
    const [loading, setLoading] = useState(true);
    const [vistaActual, setVistaActual] = useState('resumen');
    const [parametrosVista, setParametrosVista] = useState<any>(null);

    const navegarA = (vista: string, params?: any) => {
        setVistaActual(vista);
        setParametrosVista(params || null);
    };

    /* Determinar si estamos en vista admin (ve todos los recursos) */
    const esVistaAdmin = useMemo(() => esAdmin && !simulando, [esAdmin, simulando]);

    /* Carga de datos inicial */
    const refreshData = async () => {
        setLoading(true);
        try {
            // Cargar datos básicos siempre (servicios públicos)
            const serviciosData = await facturacionService.getServiciosPublicados();
            setServicios(serviciosData.filter(s => s.activo !== false));

            // Cargar recursos
            const [hostings, dominios, trabajos, facturasData] = await Promise.all([facturacionService.getHostingsContratados(), facturacionService.getDominiosContratados(), facturacionService.getServiciosContratados(), facturacionService.getFacturas()]);

            setAllHostings(hostings);
            setAllDominios(dominios);
            setAllServiciosContratados(trabajos);
            setFacturasRaw(facturasData);

            // Cargar clientes solo si es admin
            if (esAdmin) {
                const clientesData = await facturacionService.getClientes();
                setClientes(clientesData);
            }

            // Mocks para stats (Backend no provee endpoint aun o es simulado)
            setServerStats({
                cpu: 45,
                ram: 2.4,
                ramTotal: 4,
                uptime: '14 days, 2 hours',
                ip: '192.168.1.45',
                os: 'Ubuntu 22.04'
            });
            setMensajes(1);
        } catch (error) {
            console.error('Error cargando datos del panel:', error);
            // Podríamos mostrar notificación de error aquí
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [esAdmin]); // Recargar si cambia rol (aunque requiere reload usualmente)

    /* Filtrado de recursos según rol y simulación */

    // Hostings
    const hostingsContratados = useMemo(() => {
        if (esVistaAdmin) {
            return allHostings;
        }
        return allHostings.filter(h => h.clienteId === clienteId);
    }, [esVistaAdmin, clienteId, allHostings]);

    const actualizarHosting = (hosting: HostingContratado) => {
        setAllHostings(prev => prev.map(h => (h.id === hosting.id ? hosting : h)));
    };

    // Dominios
    const dominiosContratados = useMemo(() => {
        if (esVistaAdmin) {
            return allDominios;
        }
        return allDominios.filter(d => d.clienteId === clienteId);
    }, [esVistaAdmin, clienteId, allDominios]);

    const actualizarDominio = (dominio: DominioContratado) => {
        setAllDominios(prev => prev.map(d => (d.id === dominio.id ? dominio : d)));
    };

    // Services Contratados
    const serviciosContratados = useMemo(() => {
        if (esVistaAdmin) {
            return allServiciosContratados;
        }
        return allServiciosContratados.filter(s => s.clienteId === clienteId);
    }, [esVistaAdmin, clienteId, allServiciosContratados]);

    // Facturas
    const facturas = useMemo<Factura[]>(() => {
        if (!esVistaAdmin) {
            return facturasRaw.filter(f => f.clienteId === clienteId);
        }
        return facturasRaw;
    }, [esVistaAdmin, clienteId, facturasRaw]);

    /* Helpers */
    const marcarProductosComoPagados = (productosRef: string[]) => {
        setAllHostings(prev => prev.map(h => (productosRef.includes(h.id) ? {...h, pagado: true} : h)));
        setAllDominios(prev => prev.map(d => (productosRef.includes(d.id) ? {...d, pagado: true} : d)));
    };

    /* User profile */
    const user = useMemo<UserProfile>(
        () => ({
            name: usuario.nombre,
            email: usuario.email,
            role: usuario.rol === 'admin' ? 'Administrador' : 'Cliente',
            avatar: usuario.avatar
        }),
        [usuario]
    );

    return (
        <PanelContext.Provider
            value={{
                proyectos,
                servicios,
                serverStats,
                mensajes,
                facturas,
                hostingsContratados,
                dominiosContratados,
                serviciosContratados,
                clientes,
                user,
                loading,
                esVistaAdmin,
                refreshData,
                actualizarHosting,
                actualizarDominio,
                marcarProductosComoPagados,
                vistaActual,
                parametrosVista,
                navegarA
            }}>
            {children}
        </PanelContext.Provider>
    );
};

export const usePanel = () => {
    const context = useContext(PanelContext);
    if (!context) {
        throw new Error('usePanel debe usarse dentro de un PanelProvider');
    }
    return context;
};
