/**
 * Componente: SeccionClientes
 * Muestra una cuadricula de logos de clientes/marcas.
 * Datos desde backend (MARCAS_DATA) con fallback a import.meta.glob.
 */
import React, {useState} from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {MARCAS_DATA} from '../../data/marcas';
import './SeccionClientes.css';

/* Wrapper de logo con fallback a texto si la imagen falla */
const LogoMarca: React.FC<{nombre: string; logo: string}> = ({nombre, logo}) => {
    const [error, setError] = useState(false);

    if (!logo || error) {
        return <span className="clienteLogoTexto">{nombre}</span>;
    }

    return (
        <img
            src={logo}
            alt={nombre}
            className="clienteLogoImg"
            loading="lazy"
            onError={() => setError(true)}
        />
    );
};

export const SeccionClientes: React.FC = () => {
    if (MARCAS_DATA.length === 0) return null;

    return (
        <section className="seccionClientes" id="seccionClientes">
            <div className="clientesContenedor">
                <SeccionHeader titulo="Ultimos clientes" />

                <div className="clientesGrid">
                    {MARCAS_DATA.map((marca) => (
                        <div key={marca.id} className="clienteLogoCard">
                            <LogoMarca nombre={marca.nombre} logo={marca.logo} />
                        </div>
                    ))}
                </div>

                <footer className="clientesFooter">
                    <p className="clientesDescripcion">Cada proyecto es una oportunidad para crear algo único. Trabajamos de cerca con nuestros clientes para entender sus necesidades y transformarlas en soluciones digitales que destacan.</p>
                </footer>
            </div>
        </section>
    );
};
