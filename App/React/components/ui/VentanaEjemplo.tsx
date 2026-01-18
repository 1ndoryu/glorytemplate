import React from 'react';

interface VentanaEjemploProps {
    titulo?: string;
    children: React.ReactNode;
    contenedorClase?: string;
    cuerpoClase?: string;
}

/*
 * VentanaEjemplo: Contenedor tipo ventana de sistema operativo
 * con barra de título y botones de control (cerrar, minimizar, maximizar).
 */
export const VentanaEjemplo: React.FC<VentanaEjemploProps> = ({titulo = 'Aplicación', children, contenedorClase = '', cuerpoClase = ''}) => {
    return (
        <div className={`ventanaEjemplo ${contenedorClase}`}>
            <div className="ventanaHeader">
                <div className="ventanaControles">
                    <span className="ventanaPunto ventanaRojo"></span>
                    <span className="ventanaPunto ventanaAmarillo"></span>
                    <span className="ventanaPunto ventanaVerde"></span>
                </div>
                {titulo && <span className="ventanaTitulo">{titulo}</span>}
            </div>
            <div className={`ventanaContenido ${cuerpoClase}`}>{children}</div>
        </div>
    );
};
