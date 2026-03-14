/*
 * Componente: CadenaSamples — Kamples
 * Widget que visualiza la cadena de sampling: A sampleó B sampleó C...
 * Se usa en CancionDetalleIsland para mostrar la genealogía de samples.
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Music, GitBranch } from 'lucide-react';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useNavigationStore } from '@/core/router';
import { obtenerCadenaSamples } from '@app/services/apiCanciones';
import type { NodoCadena } from '@app/services/apiCanciones';

interface CadenaSamplesProps {
    slug: string;
    titulo: string;
}

/* Nodo visual en la cadena */
const NodoCancion = ({
    titulo,
    artista,
    slug,
    esRaiz,
}: {
    titulo: string;
    artista: string;
    slug: string;
    esRaiz?: boolean;
}): JSX.Element => {
    const navegar = useNavigationStore((s) => s.navegar);

    return (
        <BotonBase
            variante="ghost"
            tamano="ninguno"
            className={`cadenaNodo ${esRaiz ? 'cadenaNodoRaiz' : ''}`}
            onClick={() => navegar(`/cancion/${slug}`)}
        >
            <Music size={14} />
            <span className="cadenaNodoTitulo">{titulo}</span>
            {artista && <span className="cadenaNodoArtista">— {artista}</span>}
        </BotonBase>
    );
};

export const CadenaSamples = ({ slug, titulo }: CadenaSamplesProps): JSX.Element | null => {
    const [cadena, setCadena] = useState<NodoCadena[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const cargar = async () => {
            setCargando(true);
            const resp = await obtenerCadenaSamples(slug, 5);
            if (controller.signal.aborted) return;
            if (resp.ok && resp.data) {
                setCadena(resp.data.cadena);
            }
            setCargando(false);
        };

        cargar();
        return () => { controller.abort(); };
    }, [slug]);

    if (cargando || cadena.length === 0) return null;

    return (
        <div className="cadenaContenedor">
            <h3 className="cadenaTitulo">
                <GitBranch size={16} />
                Cadena de samples
            </h3>
            <div className="cadenaLista">
                {/* Nodo raíz: la canción actual */}
                <NodoCancion
                    titulo={titulo}
                    artista=""
                    slug={slug}
                    esRaiz
                />
                {/* Nodos de la cadena */}
                {cadena.map((nodo) => (
                    <div key={nodo.id} className="cadenaFila">
                        <ArrowRight
                            size={12}
                            className="cadenaFlecha"
                            style={{ marginLeft: `${(nodo.nivel - 1) * 16 + 8}px` }}
                        />
                        <NodoCancion
                            titulo={nodo.destino_titulo}
                            artista={nodo.destino_artista}
                            slug={nodo.destino_slug}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
