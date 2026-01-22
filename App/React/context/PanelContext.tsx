import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {Servicio} from '../components/landing/GridServicios';
import {serviciosEjemplo} from '../data/mocks/servicios';
import {FacturaSimple, facturasEjemplo} from '../data/mocks/facturas';
import {hostingsContratados as hostingsMock} from '../data/mocks/hostingsContratados';
import {serviciosContratados as serviciosMock} from '../data/mocks/serviciosContratados';
import {HostingContratado} from '../data/types/hosting';
import {ServicioContratado} from '../data/types/servicio';

// Interfaces
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
    serviciosContratados: ServicioContratado[];
    user: UserProfile;
    loading: boolean;
    refreshData: () => Promise<void>;
}

// Default State
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
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [serverStats, setServerStats] = useState<ServerStats>(defaultStats);
    const [mensajes, setMensajes] = useState(0);
    const [facturas, setFacturas] = useState<FacturaSimple[]>([]);
    const [hostingsContratados, setHostingsContratados] = useState<HostingContratado[]>([]);
    const [serviciosContratados, setServiciosContratados] = useState<ServicioContratado[]>([]);
    const [user, setUser] = useState<UserProfile>(defaultUser);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        setLoading(true);
        // Simular llamada API
        await new Promise(resolve => setTimeout(resolve, 600));

        setProyectos([]);
        setServicios(serviciosEjemplo);
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
        setHostingsContratados(hostingsMock);
        setServiciosContratados(serviciosMock);
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
                serviciosContratados,
                user,
                loading,
                refreshData
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
