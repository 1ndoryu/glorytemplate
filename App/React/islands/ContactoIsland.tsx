/*
 * ContactoIsland - Pagina de contacto de Cosmo Revenue
 * Secciones: Hero, Info cards, Formulario
 */

import React from 'react';
import '@app/styles/variables.css';
import '@app/styles/global.css';
import '@app/styles/contacto.css';

import { CosmoHeader } from '@app/components/layout/CosmoHeader';
import { PaginaHero } from '@app/components/layout/PaginaHero';
import { TarjetaInfo } from '@app/components/ui/TarjetaInfo';
import { FormularioContacto } from '@app/components/forms/FormularioContacto';

export function ContactoIsland(): React.JSX.Element {
    return (
        <div className="contenedorPaginaContacto" id="contactoCosmo">
            <CosmoHeader />
            <PaginaHero
                titulo="Contacto"
                subtitulo="Estamos aquí para ayudarte a maximizar la rentabilidad de tu hotel."
            />

            {/* Info cards */}
            <section className="seccionInfoContacto" id="infoContacto">
                <div className="gridInfoContacto">
                    <TarjetaInfo
                        icono={<span>✉</span>}
                        titulo="Email"
                        contenido={
                            <p><a href="mailto:info@cosmorevenue.com">info@cosmorevenue.com</a></p>
                        }
                    />
                    <TarjetaInfo
                        icono={<span>☎</span>}
                        titulo="Teléfono"
                        contenido={
                            <p><a href="tel:+34600000000">+34 600 000 000</a></p>
                        }
                    />
                    <TarjetaInfo
                        icono={<span>◎</span>}
                        titulo="Ubicación"
                        contenido={<p>Valencia, España</p>}
                    />
                </div>
            </section>

            {/* Formulario */}
            <section className="seccionFormContacto" id="formContacto">
                <h2 className="tituloFormContacto">Solicita tu auditoría gratuita</h2>
                <FormularioContacto formId="contacto-pagina" />
            </section>
        </div>
    );
}

export default ContactoIsland;
