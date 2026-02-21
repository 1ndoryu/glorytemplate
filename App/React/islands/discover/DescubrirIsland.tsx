/*
 * Isla: DescubrirIsland — Kamples (Fase 3.6)
 * Feed personalizado "Para Ti" con carruseles temáticos.
 * Trending, nuevos, similares a tus gustos — conecta al algoritmo.
 */

import { Sparkles, Music2 } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { useDescubrirIsland } from '@app/hooks/useDescubrirIsland';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/descubrir.css';

export const DescubrirIsland = (): JSX.Element => {
    const { secciones, cargando, navegar, menu, manejarLike } = useDescubrirIsland();

    /* Renderizar tarjeta compartida */
    const renderizarTarjeta = (sample: SampleResumen) => (
        <TarjetaSample
            key={sample.id}
            sample={sample}
            onLike={manejarLike}
            onMenu={menu.abrirMenu}
            onClickCreador={(u) => navegar(`/perfil/${u}/`)}
        />
    );

    if (cargando) {
        return (
            <div className="descubrirIsland" id="descubrirIsland">
                <div className="descubrirCargando">
                    <Music2 size={32} />
                    <span>Preparando recomendaciones...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="descubrirIsland" id="descubrirIsland">
            <div className="descubrirHeader">
                <Sparkles size={20} />
                <h1>Descubrir</h1>
                <p>Samples seleccionados para ti basados en tus gustos</p>
            </div>

            {secciones.length === 0 ? (
                <div className="descubrirVacio">
                    <Music2 size={48} />
                    <h2>Aún no tenemos recomendaciones</h2>
                    <p>Escucha y dale like a samples para mejorar tus recomendaciones</p>
                </div>
            ) : (
                <div className="descubrirSecciones">
                    {secciones.map((seccion) => (
                        <section key={seccion.id} className="descubrirSeccion">
                            <div className="descubrirSeccionHeader">
                                {seccion.icono}
                                <h2>{seccion.titulo}</h2>
                            </div>
                            <div className="descubrirSeccionLista">
                                {seccion.samples.map(renderizarTarjeta)}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <MenuContextual
                abierto={menu.estado.abierto}
                onCerrar={menu.cerrarMenu}
                items={menu.items}
                x={menu.estado.x}
                y={menu.estado.y}
            />
        </div>
    );
};

export default DescubrirIsland;
