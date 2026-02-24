/*
 * ErrorBoundaryMezclador — Captura errores del mezclador sin afectar la app
 * Si el mezclador falla, muestra un mensaje y botón de reinicio
 */

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BotonBase } from '@app/components/ui/BotonBase';

interface Props {
    children: ReactNode;
}

interface State {
    tieneError: boolean;
    error: Error | null;
}

export class ErrorBoundaryMezclador extends Component<Props, State> {
    state: State = { tieneError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { tieneError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[Mezclador] Error atrapado por boundary:', error, info.componentStack);
    }

    reiniciar = (): void => {
        this.setState({ tieneError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.tieneError) {
            return (
                <div className="mezcladorError">
                    <p className="mezcladorErrorTitulo">Error en el mezclador</p>
                    <p className="mezcladorErrorDetalle">
                        {this.state.error?.message ?? 'Error desconocido'}
                    </p>
                    <BotonBase variante="ghost" className="mezcladorErrorBoton" onClick={this.reiniciar}>
                        Reiniciar mezclador
                    </BotonBase>
                </div>
            );
        }

        return this.props.children;
    }
}
