/**
 * Componente: Footer
 * Pie de página global con newsletter integrada y enlaces de navegación.
 */
import React from 'react';
import {Button} from '../ui/Button';
import './Footer.css';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer" id="footer">
            <div className="footerContenedor">
                {/* Top Section: Brand & Newsletter */}
                <div className="footerTop">
                    <div className="footerBrand">
                        <h3 className="footerLogo">Nakomi.</h3>
                        <p className="footerDescripcion">Crafting digital experiences with precision and passion. Based in Copenhagen, available worldwide.</p>
                    </div>

                    <div className="footerNewsletter">
                        <h4 className="footerNewsletterTitulo">Stay updated</h4>
                        <form className="footerForm" onSubmit={e => e.preventDefault()}>
                            <input type="email" placeholder="Enter your email address" className="footerInput" required />
                            {/* Reusing existing Button component but forcing outline variant logic manually via CSS or creating a new prop if needed. 
                                For now, primary button on dark bg works well. */}
                            <Button variante="outline" className="footerButton" style={{borderColor: 'var(--bg-primary)', color: 'var(--bg-primary)'}}>
                                Subscribe
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Bottom Section: Links & Copyright */}
                <div className="footerBottom">
                    <div className="footerLinks">
                        <a href="#" className="footerLink">
                            Home
                        </a>
                        <a href="#servicios" className="footerLink">
                            Services
                        </a>
                        <a href="#contacto" className="footerLink">
                            Contact
                        </a>
                        <a href="#" className="footerLink">
                            Privacy Policy
                        </a>
                    </div>

                    <span className="footerCopyright">© {currentYear} Nakomi Template. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
};
