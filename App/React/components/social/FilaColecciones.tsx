/*
 * Componente: FilaColecciones — Kamples (C180)
 * Fila horizontal de colecciones con scroll invisible.
 * Máximo 8 colecciones, navegación al hacer click.
 */

import { useEffect, useState } from 'react';
import { listarColeccionesPublicas } from '@app/services/apiColecciones';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import type { Coleccion } from '@app/types';
import { Avatar } from '../ui/Avatar';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import '../../styles/componentes/filaColecciones.css';

const MAX_COLECCIONES = 8;

export const FilaColecciones = (): JSX.Element | null => {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);

    useEffect(() => {
        let activo = true;
        const cargar = async () => {
            try {
                const resp = await listarColeccionesPublicas();
                if (activo && resp.ok && resp.data) {
                    setColecciones(resp.data.colecciones.slice(0, MAX_COLECCIONES));
                }
            } catch {
                /* Error cargando colecciones — fila no se muestra */
            }
        };
        cargar();
        return () => { activo = false; };
    }, []);

    if (!colecciones.length) return null;

    return (
        <div className="filaColecciones">
            {colecciones.map((col) => (
                <EnlaceNavegacion
                    key={col.id}
                    href={`/coleccion/${col.slug ?? col.id}/`}
                    className="filaColeccionChip"
                    title={col.nombre}
                >
                    <img
                        className="filaColeccionImg"
                        src={col.imagenUrl || obtenerImagenColorPorTexto(col.nombre)}
                        alt=""
                        loading="lazy"
                    />
                    <div className="filaColeccionOverlay">
                        <div className="filaColeccionAutor">
                            <Avatar
                                src={col.usuario?.avatarUrl}
                                nombre={col.usuario?.nombreVisible ?? col.usuario?.username ?? 'Autor'}
                                tamano="xs"
                                className="filaColeccionAutorAvatar"
                            />
                            <span className="filaColeccionAutorNombre">
                                {col.usuario?.nombreVisible ?? col.usuario?.username ?? 'Autor'}
                            </span>
                        </div>
                        <span className="filaColeccionNombre">{col.nombre}</span>
                    </div>
                </EnlaceNavegacion>
            ))}
        </div>
    );
};

export default FilaColecciones;
