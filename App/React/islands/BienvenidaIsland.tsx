/*
 * BienvenidaIsland — Kamples
 * Flujo de onboarding para nuevos usuarios.
 * Muestra pasos de introducción a la plataforma y redirige al inicio.
 * Nota del roadmap: "Flujo onboarding primer uso" (#6 ideas pendientes).
 */

import { useState } from 'react';
import { useAuthStore } from '../stores';
import '../styles/variables.css';
import '../styles/bienvenida.css';
import { BotonBase } from '../components/ui/BotonBase';

interface PasoOnboarding {
    icono: string;
    titulo: string;
    descripcion: string;
}

const PASOS: PasoOnboarding[] = [
    {
        icono: '🎵',
        titulo: 'Descubre samples',
        descripcion: 'Explora miles de loops y one-shots de creadores de todo el mundo. Filtra por BPM, tonalidad y género.',
    },
    {
        icono: '📤',
        titulo: 'Sube tu música',
        descripcion: 'Comparte tus samples con la comunidad. Agrega metadata, tags y deja que otros productores los encuentren.',
    },
    {
        icono: '📚',
        titulo: 'Crea tu librería',
        descripcion: 'Guarda tus samples favoritos en colecciones organizadas. Accede a ellos cuando los necesites.',
    },
];

export const BienvenidaIsland = (): JSX.Element => {
    const [pasoActual, setPasoActual] = useState(0);
    const usuario = useAuthStore((s) => s.usuario);
    const nombre = usuario?.nombreVisible ?? usuario?.username ?? 'Productor';

    const esUltimoPaso = pasoActual === PASOS.length - 1;
    const paso = PASOS[pasoActual];

    const avanzar = () => {
        if (esUltimoPaso) {
            /* Redirige al feed principal al terminar onboarding */
            window.location.href = '/';
            return;
        }
        setPasoActual((prev) => prev + 1);
    };

    const saltar = () => {
        window.location.href = '/';
    };

    return (
        <div className="contenedorBienvenida">
            <div className="onboardingCard">
                <h1 className="tituloBienvenida">
                    Bienvenido, {nombre}
                </h1>

                <div className="onboardingPaso" key={pasoActual}>
                    <span className="onboardingIcono">{paso.icono}</span>
                    <h2 className="onboardingPasoTitulo">{paso.titulo}</h2>
                    <p className="onboardingPasoDesc">{paso.descripcion}</p>
                </div>

                <div className="onboardingIndicadores">
                    {PASOS.map((paso, i) => (
                        <span
                            key={paso.titulo}
                            className={`onboardingDot ${i === pasoActual ? 'onboardingDotActivo' : ''}`}
                        />
                    ))}
                </div>

                <div className="onboardingAcciones">
                    <BotonBase variante="ghost"
                        className="onboardingBotonSaltar"
                        onClick={saltar}
                        type="button"
                    >
                        Saltar
                    </BotonBase>
                    <BotonBase variante="ghost"
                        className="onboardingBotonSiguiente"
                        onClick={avanzar}
                        type="button"
                    >
                        {esUltimoPaso ? 'Empezar' : 'Siguiente'}
                    </BotonBase>
                </div>
            </div>
        </div>
    );
};

export default BienvenidaIsland;
