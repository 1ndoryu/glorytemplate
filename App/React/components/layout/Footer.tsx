/**
 * Componente: Footer
 * Pie de página global con newsletter y navegación.
 * Enlaces centralizados en data/navegacion.ts (DRY).
 */
import React from 'react';
import {Button} from '../ui/Button';
import {ENLACES_FOOTER} from '../../data/navegacion';
import './Footer.css';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer" id="footer">
            <div className="footerContenedor">
                <div className="footerTop">
                    <div className="footerBrand">
                        <h3 className="footerLogo">Nakomi.</h3>
                        <p className="footerDescripcion">Crafting digital experiences with precision and passion. Based in Copenhagen, available worldwide.</p>
                    </div>

                    <div className="footerNewsletter">
                        <h4 className="footerNewsletterTitulo">Stay updated</h4>
                        <form className="footerForm" onSubmit={e => e.preventDefault()}>
                            <input type="email" placeholder="Enter your email address" className="footerInput" required />
                            <Button variante="outline" className="botonFooter">
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </div>

                <div className="footerBottom">
                    <div className="footerLinks">
                        {ENLACES_FOOTER.map(enlace => (
                            <a key={enlace.label} href={enlace.href} className="footerLink">
                                {enlace.label}
                            </a>
                        ))}
                    </div>

                    <span className="footerCopyright">&copy; {currentYear} Nakomi Template. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
};
