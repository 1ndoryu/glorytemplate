/*
 * TablaComparativa — Comparación de funciones Kamples vs competidores.
 * Static data, sin lógica de negocio.
 */

import { Check, X, Minus } from 'lucide-react';
import '../../../styles/componentes/landingComparativa.css';

type Soporte = 'si' | 'no' | 'parcial';

interface FilaComparativa {
    funcion: string;
    kamples: Soporte;
    splice: Soporte;
    beatstar: Soporte;
    samplefocus: Soporte;
    looperman: Soporte;
}

const FILAS: FilaComparativa[] = [
    { funcion: 'Descargas gratis', kamples: 'si', splice: 'no', beatstar: 'si', samplefocus: 'si', looperman: 'si' },
    { funcion: 'App de escritorio y móvil', kamples: 'si', splice: 'si', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Sync automático', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Filtros inteligentes', kamples: 'si', splice: 'parcial', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Publicar samples fácilmente', kamples: 'si', splice: 'no', beatstar: 'si', samplefocus: 'parcial', looperman: 'no' },
    { funcion: 'Publicar kits', kamples: 'si', splice: 'no', beatstar: 'si', samplefocus: 'si', looperman: 'no' },
    { funcion: 'Enviar mensajes', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Feed inteligente', kamples: 'si', splice: 'no', beatstar: 'si', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Suscripción a productores', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Monetización', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Streaming de audio', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
    { funcion: 'Encontrar colaboraciones', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'parcial' },
    { funcion: 'Recomendaciones inteligentes', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'parcial', looperman: 'no' },
    { funcion: 'Comentarios', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'si', looperman: 'si' },
    { funcion: 'Publicar plugins y VSTs', kamples: 'si', splice: 'si', beatstar: 'no', samplefocus: 'no', looperman: 'si' },
    { funcion: 'Publicar servicios gratis', kamples: 'si', splice: 'no', beatstar: 'no', samplefocus: 'no', looperman: 'no' },
];

const COMPETIDORES = ['Kamples', 'Splice', 'Beatstar', 'Samplefocus', 'Looperman'] as const;

const IconoSoporte = ({ valor }: { valor: Soporte }): JSX.Element => {
    if (valor === 'si') return <Check size={16} className="comparativaIconoSi" />;
    if (valor === 'parcial') return <Minus size={16} className="comparativaIconoParcial" />;
    return <X size={16} className="comparativaIconoNo" />;
};

export const TablaComparativa = (): JSX.Element => (
    <section className="landingComparativa" id="landingComparativa">
        <h2 className="landingComparativaTitulo">Por qué Kamples</h2>
        <div className="landingComparativaTabla">
            <table>
                <thead>
                    <tr>
                        <th>Funciones</th>
                        {COMPETIDORES.map(c => (
                            <th key={c} className={c === 'Kamples' ? 'comparativaDestacado' : ''}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {FILAS.map(fila => (
                        <tr key={fila.funcion}>
                            <td>{fila.funcion}</td>
                            <td className="comparativaDestacado"><IconoSoporte valor={fila.kamples} /></td>
                            <td><IconoSoporte valor={fila.splice} /></td>
                            <td><IconoSoporte valor={fila.beatstar} /></td>
                            <td><IconoSoporte valor={fila.samplefocus} /></td>
                            <td><IconoSoporte valor={fila.looperman} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </section>
);
