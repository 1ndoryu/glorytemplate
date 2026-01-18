import React from 'react';

/*
 * Input de búsqueda minimalista y reutilizable.
 * Estilo 'pill' compacto con icono integrado.
 */

interface InputBusquedaProps extends React.InputHTMLAttributes<HTMLInputElement> {
    anchoMaximo?: string;
}

export const InputBusqueda: React.FC<InputBusquedaProps> = ({anchoMaximo = '100%', className = '', ...props}) => {
    return (
        <div className={`contenedorInputBusqueda ${className}`} style={{maxWidth: anchoMaximo}}>
            <svg className="iconoInput" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" className="campoInput" {...props} />
        </div>
    );
};
