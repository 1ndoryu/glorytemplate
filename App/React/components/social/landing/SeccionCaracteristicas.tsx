/*
 * SeccionCaracteristicas — Grid de 9 bloques de features Kamples.
 * Layout: grid responsivo 3x4 basado en el diseño original (temp/inicio.php).
 * Cada bloque muestra icono + overlay descriptivo al hover.
 * TO-DO: Reemplazar iconos Lucide por SVGs custom cuando estén disponibles.
 */

import {
    Lightbulb,
    Brain,
    Users,
    FolderSync,
    Library,
    Sparkles,
    Globe,
    DollarSign,
    Palette,
} from 'lucide-react';
import '../../styles/componentes/landingCaracteristicas.css';

interface Caracteristica {
    id: string;
    icono: JSX.Element;
    titulo: string;
    descripcion: string;
}

const CARACTERISTICAS: Caracteristica[] = [
    {
        id: 'bloquePlataforma',
        icono: <Lightbulb size={40} />,
        titulo: 'Todo en un solo lugar',
        descripcion: 'Kamples centraliza herramientas de producción musical dispersas en una sola plataforma optimizada para cada etapa del proceso creativo.',
    },
    {
        id: 'bloqueIA',
        icono: <Brain size={32} />,
        titulo: 'Inteligencia artificial',
        descripcion: 'Usamos inteligencia artificial para reconocimiento de patrones, mejora de algoritmos y supervisión. Kamples aprende de los usuarios para mejorar continuamente.',
    },
    {
        id: 'bloqueSocial',
        icono: <Users size={32} />,
        titulo: 'Enfoque social',
        descripcion: 'Plataforma optimizada para la comunicación entre productores, artistas y fans, ofreciendo una experiencia que facilita los procesos creativos y la colaboración.',
    },
    {
        id: 'bloqueSync',
        icono: <FolderSync size={32} />,
        titulo: 'Sync automático',
        descripcion: 'Herramienta de escritorio que sincroniza y organiza tus samples automáticamente. Accede a ellos fácilmente cuando los necesites desde cualquier dispositivo.',
    },
    {
        id: 'bloqueColecciones',
        icono: <Library size={32} />,
        titulo: 'Colecciones',
        descripcion: 'Organiza tus recursos musicales en colecciones personalizables. Compártelas con la comunidad o de forma privada y descubre nuevas colecciones.',
    },
    {
        id: 'bloqueAlgoritmo',
        icono: <Sparkles size={32} />,
        titulo: 'Recomendaciones',
        descripcion: 'Algoritmos inteligentes de recomendación: Kamples entiende tus gustos, te ayuda a organizar ideas y recomienda recursos apropiados para ti.',
    },
    {
        id: 'bloqueRed',
        icono: <Globe size={32} />,
        titulo: 'Red de creadores',
        descripcion: 'Comparte tus creaciones, colabora con otros artistas, descubre oportunidades y sigue la trayectoria de tus productores favoritos.',
    },
    {
        id: 'bloqueIngresos',
        icono: <DollarSign size={32} />,
        titulo: 'Monetización',
        descripcion: 'Múltiples fuentes de ingresos con algoritmos inteligentes que compensan tu esfuerzo. Revenue share, suscripciones y servicios en un solo lugar.',
    },
    {
        id: 'bloqueExpresion',
        icono: <Palette size={32} />,
        titulo: 'Múltiples formatos',
        descripcion: 'Exprésate a través de música, samples, kits, posts y colaboraciones. Kamples comprende que el arte tiene múltiples formas de expresión.',
    },
];

export const SeccionCaracteristicas = (): JSX.Element => (
    <section className="landingCaracteristicas" id="landingCaracteristicas">
        <h2 className="landingCaracteristicasTitulo">Todo lo que necesitas para producir</h2>
        <div className="landingCaracteristicasGrid">
            {CARACTERISTICAS.map((c, i) => (
                <div key={c.id} className={`landingBloque landingBloque${i + 1}`}>
                    <div className="landingBloqueIcono">{c.icono}</div>
                    <h3 className="landingBloqueTitulo">{c.titulo}</h3>
                    <div className="landingBloqueOverlay">
                        <p>{c.descripcion}</p>
                    </div>
                </div>
            ))}
        </div>
    </section>
);
