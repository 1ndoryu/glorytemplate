/*
 * Isla: ColeccionesIsland — Kamples (QQ88)
 * Pagina publica /colecciones/ con grid de colecciones.
 * Barra de busqueda + grid responsive de TarjetaColeccion.
 * No requiere autenticacion.
 */

import { FolderOpen } from 'lucide-react';
import { TarjetaColeccion } from '@app/components/social/TarjetaColeccion';
import { SkeletonFeed } from '@app/components/skeletons';
import { useColeccionesPublicas } from '@app/hooks/useColeccionesPublicas';
import '../../styles/componentes/coleccionesPublicas.css';

export const ColeccionesIsland = (): JSX.Element => {
    const { colecciones, cargando } = useColeccionesPublicas();

    return (
        <div className="coleccionesPublicas" id="seccionColecciones">
            {cargando ? (
                <SkeletonFeed cantidad={6} />
            ) : colecciones.length === 0 ? (
                <div className="coleccionesPublicasVacio">
                    <FolderOpen size={48} />
                    <h2>No se encontraron colecciones</h2>
                    <p>Intenta con otra búsqueda</p>
                </div>
            ) : (
                <div className="coleccionesPublicasGrid">
                    {colecciones.map((col) => (
                        <TarjetaColeccion key={col.id} coleccion={col} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ColeccionesIsland;
