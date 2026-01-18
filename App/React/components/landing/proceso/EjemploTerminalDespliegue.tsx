import React from 'react';
import {VentanaEjemplo} from '../../ui/VentanaEjemplo';

export const EjemploTerminalDespliegue: React.FC = () => {
    return (
        <VentanaEjemplo titulo="Terminal">
            <div className="ejemploTerminal">
                <div className="terminalContenido">
                    <div className="terminalLinea">
                        <span className="terminalPrompt">$</span>
                        <span className="terminalComando">nakomi deploy --prod</span>
                    </div>
                    <div className="terminalLinea terminalInfo">
                        <span className="terminalTexto">→ Verificando configuración...</span>
                    </div>
                    <div className="terminalLinea terminalInfo">
                        <span className="terminalTexto">→ Optimizando assets...</span>
                    </div>
                    <div className="terminalLinea terminalExito">
                        <span className="terminalTexto">✓ Desplegado en tudominio.com</span>
                    </div>
                </div>
            </div>
        </VentanaEjemplo>
    );
};
