/*
 * Componente: FilaColecciones — Kamples (C180)
 * Fila horizontal de colecciones con scroll invisible.
 * Máximo 8 colecciones, navegación al hacer click.
 */

import { useEffect, useState } from 'react';
import { listarColeccionesPublicas } from '@app/services/apiColecciones';
import { obtenerImagenColorPorTexto } from '@app/services/imagenesColor';
import { useScrollHorizontal } from '@app/hooks/useScrollHorizontal';
import type { Coleccion } from '@app/types';
import { Avatar } from '../ui/Avatar';
import { EnlaceNavegacion } from '../ui/EnlaceNavegacion';
import { ImgOptimizada } from '../ui/ImgOptimizada';
import '../../styles/componentes/filaColecciones.css';

/* QK101: Subido a 20 para mostrar más variedad con scroll horizontal */
const MAX_COLECCIONES = 20;

export const FilaColecciones = (): JSX.Element | null => {
    const [colecciones, setColecciones] = useState<Coleccion[]>([]);
    const { contenedorRef, iniciarArrastre, moverArrastre, finalizarArrastre } = useScrollHorizontal();

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
        <div
            className="filaColecciones"
            ref={contenedorRef}
            onMouseDown={(e) => iniciarArrastre(e.clientX)}
            onMouseMove={(e) => moverArrastre(e.clientX)}
            onMouseUp={finalizarArrastre}
            onMouseLeave={finalizarArrastre}
        >
            {colecciones.map((col) => (
                <EnlaceNavegacion
                    key={col.id}
                    href={`/coleccion/${col.slug ?? col.id}/`}
                    className="filaColeccionChip"
                    title={col.nombre}
                >
                    {/* [183A-88] Photon CDN para portadas de colección — antes era <img> sin optimizar */}
                    <ImgOptimizada
                        className="filaColeccionImg"
                        src={col.imagenUrl || obtenerImagenColorPorTexto(col.nombre)}
                        alt=""
                        w={200}
                        quality={75}
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
