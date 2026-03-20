/*
 * PreciosLandingIsland — Página pública de precios.
 *
 * Muestra Free vs Pro con énfasis en el límite de sincronización (100/20.000).
 * No muestra Premium (misma lógica que Pro).
 * Accesible en /precios sin autenticación.
 *
 * [2003A-5] Creada para comunicar el límite de sync por plan.
 */

import { Check, X, Music2, Zap, ArrowRight } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { usePlanesModalStore } from '@app/stores/planesModalStore';
import { useAuthModalStore } from '@app/stores/authModalStore';
import { useAuthStore } from '@app/stores/authStore';
import '../../styles/componentes/preciosLanding.css';
import '../../styles/variables.css';

interface FeatureFila {
    texto: string;
    freeIncluido: boolean;
    proIncluido: boolean;
    destacada?: boolean;
}

const FEATURES: FeatureFila[] = [
    { texto: '100 samples de sincronización', freeIncluido: true,  proIncluido: false, destacada: true },
    { texto: '20.000 samples de sincronización', freeIncluido: false, proIncluido: true, destacada: true },
    { texto: 'Calidad WAV original', freeIncluido: true, proIncluido: true },
    { texto: 'Explorar y descubrir', freeIncluido: true, proIncluido: true },
    { texto: 'Perfil público', freeIncluido: true, proIncluido: true },
    { texto: 'Prueba gratuita 30 días', freeIncluido: true, proIncluido: false },
    { texto: '5 descargas por día', freeIncluido: true, proIncluido: false },
    { texto: '50 descargas por día', freeIncluido: false, proIncluido: true },
    { texto: '1 GB transferencia/mes', freeIncluido: true, proIncluido: false },
    { texto: '10 GB transferencia/mes', freeIncluido: false, proIncluido: true },
    { texto: 'Perfil verificado', freeIncluido: false, proIncluido: true },
    { texto: 'Monetizar samples', freeIncluido: false, proIncluido: true },
    { texto: 'Analytics avanzados', freeIncluido: false, proIncluido: true },
    { texto: 'Revenue share 70/30', freeIncluido: false, proIncluido: true },
];

const IconoCheck = (): JSX.Element => (
    <span className="preciosCheck" aria-label="incluido"><Check size={14} /></span>
);
const IconoX = (): JSX.Element => (
    <span className="preciosX" aria-label="no incluido"><X size={14} /></span>
);

export const PreciosLandingIsland = (): JSX.Element => {
    const autenticado = useAuthStore(s => s.autenticado);
    const abrirAuth = useAuthModalStore(s => s.abrir);
    const abrirPlanes = usePlanesModalStore(s => s.abrir);

    const manejarFree = (): void => {
        if (!autenticado) abrirAuth('registro');
    };

    const manejarPro = (): void => {
        if (autenticado) {
            abrirPlanes();
        } else {
            abrirAuth('registro');
        }
    };

    return (
        <div className="preciosLanding">
            {/* Hero */}
            <div className="preciosHero">
                <h1 className="preciosTitulo">Planes y precios</h1>
                <p className="preciosSubtitulo">
                    Sincroniza tu librería de samples. Empieza gratis, escala cuando lo necesites.
                </p>
            </div>

            {/* Tabla comparativa */}
            <div className="preciosTabla">
                {/* Encabezados */}
                <div className="preciosEncabezados">
                    <div className="preciosColFeature" />
                    <div className="preciosColPlan">
                        <div className="preciosPlanHeader">
                            <Music2 size={20} />
                            <span className="preciosPlanNombre">Free</span>
                        </div>
                        <div className="preciosPlanPrecio">
                            <span className="preciosMonto">$0</span>
                            <span className="preciosPeriodo">para siempre</span>
                        </div>
                        <BotonBase
                            variante="secundario"
                            tamano="sm"
                            className="preciosCta"
                            onClick={manejarFree}
                        >
                            {autenticado ? 'Tu plan actual' : 'Empezar gratis'}
                        </BotonBase>
                    </div>
                    <div className="preciosColPlan preciosColDestacado">
                        <div className="preciosBadgeDestacado">Más popular</div>
                        <div className="preciosPlanHeader">
                            <Zap size={20} />
                            <span className="preciosPlanNombre">Pro</span>
                        </div>
                        <div className="preciosPlanPrecio">
                            <span className="preciosMonto">$5</span>
                            <span className="preciosPeriodo">/mes</span>
                        </div>
                        <BotonBase
                            variante="primario"
                            tamano="sm"
                            className="preciosCta"
                            onClick={manejarPro}
                        >
                            Obtener Pro <ArrowRight size={14} />
                        </BotonBase>
                    </div>
                </div>

                {/* Filas de features */}
                {FEATURES.map((f, i) => (
                    <div key={i} className={`preciosFila${f.destacada ? ' preciosFilaDestacada' : ''}`}>
                        <div className="preciosColFeature">{f.texto}</div>
                        <div className="preciosColPlan preciosIconoCol">
                            {f.freeIncluido ? <IconoCheck /> : <IconoX />}
                        </div>
                        <div className="preciosColPlan preciosColDestacado preciosIconoCol">
                            {f.proIncluido ? <IconoCheck /> : <IconoX />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Nota pie */}
            <p className="preciosNota">
                El plan Premium tiene las mismas capacidades que Pro. Contáctanos para más información.
            </p>
        </div>
    );
};
