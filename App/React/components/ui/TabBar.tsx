/*
 * Componente: TabBar
 * Tabs de navegación interna con indicador activo.
 */

import { type ReactNode } from 'react';
import '../styles/componentes/tabBar.css';

export interface TabDefinicion {
    id: string;
    etiqueta: string;
    icono?: ReactNode;
    contador?: number;
}

interface TabBarProps {
    tabs: TabDefinicion[];
    activa: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export const TabBar = ({
    tabs,
    activa,
    onChange,
    className = '',
}: TabBarProps): JSX.Element => {
    return (
        <div className={`contenedorTabBar ${className}`} role="tablist">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tabItem ${activa === tab.id ? 'tabActivo' : ''}`}
                    onClick={() => onChange(tab.id)}
                    role="tab"
                    aria-selected={activa === tab.id}
                    type="button"
                >
                    {tab.icono}
                    {tab.etiqueta}
                    {tab.contador !== undefined && (
                        <span className="tabContador">{tab.contador}</span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default TabBar;
