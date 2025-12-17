import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';

const inter = Inter({
    variable: '--fuente-inter',
    subsets: ['latin']
});

export const metadata: Metadata = {
    title: 'Glory Builder - Soluciones Digitales',
    description: 'Creamos experiencias digitales excepcionales con tecnologia moderna'
};

/*
 * Layout global de la aplicacion
 * Incluye Header y Footer en todas las paginas
 */
export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.variable}>
                <Header />
                <main id="contenido-principal">{children}</main>
                <Footer />
            </body>
        </html>
    );
}

/*
 * Componente Header
 */
function Header() {
    return (
        <header id="cabecera-global" className="cabeceraGlobal">
            <div className="contenedor cabeceraContenido">
                <a href="/" className="logoSitio">
                    <span>Glory</span> Builder
                </a>
                <nav className="navegacionPrincipal">
                    <a href="/" className="enlaceNavegacion">
                        Inicio
                    </a>
                    <a href="/blog" className="enlaceNavegacion">
                        Blog
                    </a>
                    <a href="/servicios" className="enlaceNavegacion">
                        Servicios
                    </a>
                    <a href="/contacto" className="enlaceNavegacion">
                        Contacto
                    </a>
                </nav>
            </div>
        </header>
    );
}

/*
 * Componente Footer
 */
function Footer() {
    const anioActual = new Date().getFullYear();

    return (
        <footer id="pie-global" className="pieGlobal">
            <div className="contenedor pieContenido">
                <p className="pieCopyright">&copy; {anioActual} Glory Builder. Todos los derechos reservados.</p>
                <nav className="pieEnlaces">
                    <a href="/privacidad" className="pieEnlace">
                        Privacidad
                    </a>
                    <a href="/terminos" className="pieEnlace">
                        Terminos
                    </a>
                </nav>
            </div>
        </footer>
    );
}
