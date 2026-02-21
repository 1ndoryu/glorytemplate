/*
 * Isla: DescubrirIsland — Kamples (Fase 3.6)
 * Feed personalizado "Para Ti" con carruseles temáticos.
 * Trending, nuevos, similares a tus gustos — conecta al algoritmo.
 */

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, Flame, Clock, Music2 } from 'lucide-react';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { obtenerFeed } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import type { TipoReaccion } from '@app/types';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/descubrir.css';

interface SeccionDescubrir {
    id: string;
    titulo: string;
    icono: React.ReactNode;
    samples: SampleResumen[];
}

export const DescubrirIsland = (): JSX.Element => {
    const [secciones, setSecciones] = useState<SeccionDescubrir[]>([]);
    const [cargando, setCargando] = useState(true);

    const navegar = useNavigationStore(s => s.navegar);
    const menu = useMenuContextualSample();

    /* Like con optimistic UI sobre todas las secciones */
    const manejarLike = useCallback(
        async (sampleId: number, reaccion?: TipoReaccion) => {
            const todas = secciones.flatMap((s) => s.samples);
            const sample = todas.find((s) => s.id === sampleId);

            const actualizarSecciones = (transformar: (s: SampleResumen) => SampleResumen) =>
                setSecciones((prev) =>
                    prev.map((sec) => ({
                        ...sec,
                        samples: sec.samples.map((s) => (s.id === sampleId ? transformar(s) : s)),
                    }))
                );

            /* Snapshot para rollback */
            const snapshot = secciones;

            try {
                if (reaccion) {
                    const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                    const esPositivo = reaccion !== 'dislike';
                    const delta = (esPositivo ? 1 : 0) - (eraPositivo ? 1 : 0);
                    actualizarSecciones((s) => ({ ...s, liked: esPositivo, reaccion, totalLikes: Math.max(0, s.totalLikes + delta) }));
                    await darLike('sample', sampleId, reaccion);
                } else if (sample?.liked || sample?.reaccion) {
                    const eraPositivo = sample?.reaccion === 'like' || sample?.reaccion === 'encanta';
                    actualizarSecciones((s) => ({ ...s, liked: false, reaccion: null, totalLikes: Math.max(0, s.totalLikes - (eraPositivo ? 1 : 0)) }));
                    await quitarLike('sample', sampleId);
                } else {
                    actualizarSecciones((s) => ({ ...s, liked: true, reaccion: 'like' as const, totalLikes: s.totalLikes + 1 }));
                    await darLike('sample', sampleId, 'like');
                }
            } catch {
                setSecciones(snapshot);
            }
        },
        [secciones]
    );

    /* Cargar secciones */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const [resTrending, resRecientes, resDescubrir] = await Promise.all([
                    obtenerFeed('trending'),
                    obtenerFeed('recientes'),
                    obtenerFeed('descubrir'),
                ]);

                const nuevasSecciones: SeccionDescubrir[] = [];

                if (resDescubrir.ok && resDescubrir.data?.length) {
                    nuevasSecciones.push({
                        id: 'para-ti',
                        titulo: 'Para ti',
                        icono: <Sparkles size={18} />,
                        samples: resDescubrir.data,
                    });
                }

                if (resTrending.ok && resTrending.data?.length) {
                    nuevasSecciones.push({
                        id: 'trending',
                        titulo: 'Trending',
                        icono: <Flame size={18} />,
                        samples: resTrending.data,
                    });
                }

                if (resRecientes.ok && resRecientes.data?.length) {
                    nuevasSecciones.push({
                        id: 'nuevos',
                        titulo: 'Nuevos',
                        icono: <Clock size={18} />,
                        samples: resRecientes.data,
                    });
                }

                setSecciones(nuevasSecciones);
            } catch {
                /* Fallo de carga — secciones quedan vacías */
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

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
