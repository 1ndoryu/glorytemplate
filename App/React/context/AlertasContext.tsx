/*
 * AlertasContext
 * Contexto global para acceder al sistema de alertas desde cualquier componente
 * Provee toasts y confirmaciones en toda la aplicacion
 */

import {createContext, useContext} from 'react';
import {useAlertas, UseAlertasReturn} from '../hooks/useAlertas';
import {ContenedorAlertas} from '../components/shared/ContenedorAlertas';
import {AlertaConfirmacion} from '../components/shared/AlertaConfirmacion';

const AlertasContext = createContext<UseAlertasReturn | null>(null);

interface ProveedorAlertasProps {
    children: React.ReactNode;
}

export function ProveedorAlertas({children}: ProveedorAlertasProps): JSX.Element {
    const alertas = useAlertas();

    return (
        <AlertasContext.Provider value={alertas}>
            {children}
            <ContenedorAlertas toasts={alertas.toasts} onCerrarToast={alertas.cerrarToast} />
            {alertas.confirmacion && <AlertaConfirmacion alerta={alertas.confirmacion} onResponder={alertas.responderConfirmacion} />}
        </AlertasContext.Provider>
    );
}

/*
 * Hook para consumir el contexto de alertas
 * Lanza error si se usa fuera del proveedor
 */
export function useAlertasContext(): UseAlertasReturn {
    const contexto = useContext(AlertasContext);

    if (!contexto) {
        throw new Error('useAlertasContext debe usarse dentro de ProveedorAlertas');
    }

    return contexto;
}
