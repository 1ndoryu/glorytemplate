/*
 * Contexto del Panel Cliente.
 * Provee datos filtrados según el rol del usuario actual.
 * Admin: ve todos los recursos de todos los clientes.
 * Cliente: ve solo sus propios recursos.
 */

import React, {createContext, useContext, useState, useEffect, useMemo, ReactNode} from 'react';
import {Servicio} from '../components/landing/GridServicios';
import {serviciosEjemplo} from '../data/mocks/servicios';
import {FacturaSimple, facturasEjemplo} from '../data/mocks/facturas';
import {facturasCompletas} from '../data/mocks/facturas';
import {hostingsContratados as hostingsMock} from '../data/mocks/hostingsContratados';
import {dominiosContratados as dominiosMock} from '../data/mocks/dominiosContratados';
import {serviciosContratados as serviciosMock} from '../data/mocks/serviciosContratados';
import {clientesEjemplo} from '../data/mocks/clientes';
import {HostingContratado} from '../data/types/hosting';
import {DominioContratado} from '../data/types/dominio';
import {ServicioContratado} from '../data/types/servicio';
import {Cliente} from '../data/types/cliente';
import {useUsuario} from './UsuarioContext';

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
    servicios: Servicio[];
    serverStats: ServerStats;
    mensajes: number;
    facturas: FacturaSimple[];
    hostingsContratados: HostingContratado[];
    dominiosContratados: DominioContratado[];
    serviciosContratados: ServicioContratado[];
    clientes: Cliente[];
    user: UserProfile;
    loading: boolean;
    esVistaAdmin: boolean;
    refreshData: () => Promise<void>;
    actualizarHosting: (hosting: HostingContratado) => void;
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

const defaultUser: UserProfile = {
    name: 'Guillermo',
    email: 'guillermo@example.com',
    role: 'Cliente',
    avatar: 'G'
};

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export const PanelProvider: React.FC<{children: ReactNode}> = ({children}) => {
    const {usuario, clienteId, esAdmin, simulando} = useUsuario();

    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [serverStats, setServerStats] = useState<ServerStats>(defaultStats);
    const [mensajes, setMensajes] = useState(0);
    const [facturas, setFacturas] = useState<FacturaSimple[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado de navegación
    const [vistaActual, setVistaActual] = useState('resumen');
    const [parametrosVista, setParametrosVista] = useState<any>(null);

    const navegarA = (vista: string, params?: any) => {
        setVistaActual(vista);
        setParametrosVista(params || null);
    };

    /* Determinar si estamos en vista admin (ve todos los recursos) */
    const esVistaAdmin = useMemo(() => esAdmin && !simulando, [esAdmin, simulando]);

    /* Filtrar hostings según rol */
    const [allHostings, setAllHostings] = useState<HostingContratado[]>(hostingsMock);

    /* Filtrar hostings según rol */
    const hostingsContratados = useMemo(() => {
        if (esVistaAdmin) {
            return allHostings;
        }
        return allHostings.filter(h => h.clienteId === clienteId);
    }, [esVistaAdmin, clienteId, allHostings]);

    const actualizarHosting = (hosting: HostingContratado) => {
        setAllHostings(prev => prev.map(h => (h.id === hosting.id ? hosting : h)));
    };

    /* Filtrar dominios según rol */
    const dominiosContratados = useMemo(() => {
        if (esVistaAdmin) {
            return dominiosMock;
        }
        return dominiosMock.filter(d => d.clienteId === clienteId);
    }, [esVistaAdmin, clienteId]);

    /* Filtrar servicios contratados según rol */
    const serviciosContratados = useMemo(() => {
        if (esVistaAdmin) {
            return serviciosMock;
        }
        return serviciosMock.filter(s => s.clienteId === clienteId);
    }, [esVistaAdmin, clienteId]);

    /* Lista de clientes (solo útil para admin) */
    const clientes = useMemo(() => clientesEjemplo, []);

    /* User profile basado en el usuario actual */
    const user = useMemo<UserProfile>(
        () => ({
            name: usuario.nombre,
            email: usuario.email,
            role: usuario.rol === 'admin' ? 'Administrador' : 'Cliente',
            avatar: usuario.avatar
        }),
        [usuario]
    );

    const refreshData = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        setProyectos([]);
        setServicios(serviciosEjemplo.filter(s => s.activo !== false));
        setServerStats({
            cpu: 45,
            ram: 2.4,
            ramTotal: 4,
            uptime: '14 days, 2 hours',
            ip: '192.168.1.45',
            os: 'Ubuntu 22.04'
        });

        setMensajes(1);
        setFacturas(facturasEjemplo);
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

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
