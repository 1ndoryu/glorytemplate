/*
 * Componente: FilaColecciones — Kamples (C180)
 * Fila horizontal de colecciones con scroll invisible.
 * Máximo 8 colecciones, navegación al hacer click.
 */

import { useEffect, useState } from 'react';
import { listarColeccionesPublicas } from '@app/services/apiColecciones';
import { useNavigationStore } from '@/core/router';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/filaColecciones.css';

const MAX_COLECCIONES = 8;

export const FilaColecciones = (): JSX.Element | null => {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const navegar = useNavigationStore(s => s.navegar);

    useEffect(() => {
        const cargar = async () => {
            try {
                const resp = await listarColeccionesPublicas();
                if (resp.ok && resp.data) {
                    setColecciones(resp.data.slice(0, MAX_COLECCIONES));
                }
            } catch {
                /* Error cargando colecciones — fila no se muestra */
            }
        };
        cargar();
    }, []);

    if (!colecciones.length) return null;

    return (
        <div className="filaColecciones">
            {colecciones.map((col) => (
                <button
                    key={col.id}
                    className="filaColeccionChip"
                    onClick={() => navegar(`/coleccion/${col.id}/`)}
                    type="button"
                    title={col.nombre}
                >
                    <img
                        className="filaColeccionImg"
                        src={col.imagenUrl || obtenerImagenColorPorTexto(col.nombre)}
                        alt=""
                        loading="lazy"
                    />
                    <span className="filaColeccionNombre">{col.nombre}</span>
                    <span className="filaColeccionMeta">
                        {col.totalSamples ?? 0}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default FilaColecciones;
