/**
 * Componente: SeccionContacto (CTA)
 * Section "Have a project in mind?" reutilizable.
 * Acepta prop compacto para reducir padding cuando el contenedor padre ya tiene gap.
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {Button} from '../ui/Button';
import {navegar} from '../../navegacionSPA';
import './SeccionContacto.css';

interface SeccionContactoProps {
    compacto?: boolean;
}

export const SeccionContacto: React.FC<SeccionContactoProps> = ({compacto = false}) => {
    const claseExtra = compacto ? 'seccionContactoCompacta' : '';

    return (
        <section className={`seccionContacto ${claseExtra}`} id="contacto">
            <div className="contactoContenedor">
                <SeccionHeader titulo="Get in Touch" />
                <h2 className="contactoTitulo">Have a project in mind?</h2>

                <div className="contactoDescripcion">
                    <p>Send some details about your project or inquiry. We can help your business designing a website, digital product, or building a custom solution.</p>
                </div>

                <div className="contactoBotones">
                    <Button variante="primario" onClick={() => navegar('/contacto/')}>
                        Contact
                    </Button>
                    <Button variante="outline" onClick={() => navegar('/servicios/')}>
                        Hire Service
                    </Button>
                </div>
            </div>
        </section>
    );
};
