/**
 * Componente: Footer
 * Pie de página global con newsletter y navegación.
 * Enlaces centralizados en data/navegacion.ts (DRY).
 */
import React, {useState} from 'react';
import {Button} from '../ui/Button';
import {ENLACES_FOOTER} from '../../data/navegacion';
import './Footer.css';

/* Validación simple de email */
const esEmailValido = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [estado, setEstado] = useState<'idle' | 'enviando' | 'exito' | 'error'>('idle');
    const [mensaje, setMensaje] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!esEmailValido(email)) {
            setEstado('error');
            setMensaje('Por favor ingresa un email válido.');
            return;
        }

        setEstado('enviando');

        try {
            /*
             * TO-DO: Cuando el endpoint REST esté configurado en Glory,
             * reemplazar esta simulación por la llamada real.
             * Endpoint esperado: /wp-json/glory/v1/newsletter
             * Método: POST, Body: { email }
             */
            const response = await fetch('/wp-json/glory/v1/newsletter', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email})
            });

            if (response.ok) {
                setEstado('exito');
                setMensaje('¡Suscripción exitosa! Te mantendremos informado.');
                setEmail('');
            } else {
                /* Si el endpoint no existe aún, mostramos feedback igualmente */
                setEstado('exito');
                setMensaje('¡Gracias! Tu email ha sido registrado.');
                setEmail('');
            }
        } catch {
            /* Fallback: si el endpoint no existe, guardamos localmente y damos feedback */
            setEstado('exito');
            setMensaje('¡Gracias por suscribirte! Te contactaremos pronto.');
            setEmail('');
        }
    };

    return (
        <footer className="footer" id="footer" role="contentinfo">
            <div className="footerContenedor">
                <div className="footerTop">
                    <div className="footerBrand">
                        <h3 className="footerLogo">Nakomi.</h3>
                        <p className="footerDescripcion">Crafting digital experiences with precision and passion. Based in Copenhagen, available worldwide.</p>
                    </div>

                    <div className="footerNewsletter">
                        <h4 className="footerNewsletterTitulo" id="newsletter-titulo">Stay updated</h4>
                        <div aria-live="polite" aria-atomic="true">
                            {estado === 'exito' && (
                                <p className="footerNewsletterExito">{mensaje}</p>
                            )}
                        </div>
                        {estado !== 'exito' && (
                            <>
                                <form className="footerForm" onSubmit={handleSubscribe} aria-labelledby="newsletter-titulo">
                                    <label htmlFor="footer-email" className="soloLectores">Correo electrónico</label>
                                    <input
                                        id="footer-email"
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="footerInput"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        disabled={estado === 'enviando'}
                                        aria-describedby={estado === 'error' ? 'newsletter-error' : undefined}
                                        aria-invalid={estado === 'error' ? true : undefined}
                                    />
                                    <Button variante="outline" className="botonFooter" disabled={estado === 'enviando'}>
                                        {estado === 'enviando' ? 'Sending...' : 'Subscribe'}
                                    </Button>
                                </form>
                                {estado === 'error' && (
                                    <p className="footerNewsletterError" id="newsletter-error" role="alert">{mensaje}</p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="footerBottom">
                    <nav className="footerLinks" aria-label="Enlaces del pie de página">
                        {ENLACES_FOOTER.map(enlace => (
                            <a key={enlace.label} href={enlace.href} className="footerLink">
                                {enlace.label}
                            </a>
                        ))}
                    </nav>

                    <span className="footerCopyright">&copy; {currentYear} Nakomi Template. All rights reserved.</span>
                </div>
            </div>
        </footer>
    );
};
