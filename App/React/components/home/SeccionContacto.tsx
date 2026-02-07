/**
 * Componente: SeccionContacto (CTA)
 * Section "Have a project in mind?" above Blog.
 */
import React from 'react';
import {SeccionHeader} from '../ui/SeccionHeader';
import {Button} from '../ui/Button';
import './SeccionContacto.css';

export const SeccionContacto: React.FC = () => {
    return (
        <section className="seccionContacto" id="contacto">
            <div className="contactoContenedor">
                <SeccionHeader titulo="Get in Touch" />
                <h2 className="contactoTitulo">Have a project in mind?</h2>

                <div className="contactoDescripcion">
                    <p>Send some details about your project or inquiry. We can help your business designing a website, digital product, or building a custom solution.</p>
                </div>

                <div className="contactoBotones">
                    <Button variante="primario" onClick={() => (window.location.href = '#contacto')}>
                        Contact
                    </Button>
                    <Button variante="outline" onClick={() => (window.location.href = '#servicios')}>
                        Hire Service
                    </Button>
                </div>
            </div>
        </section>
    );
};
