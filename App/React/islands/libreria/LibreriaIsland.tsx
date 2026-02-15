/*
 * LibreriaIsland — Kamples (Fase 5.1)
 * Librería personal del usuario: descargas, favoritos, colecciones y subidos.
 * Cada tab muestra una lista filtrable de samples.
 */

import { useState, useCallback, useEffect } from 'react';
import { Download, Heart, FolderOpen, Upload, Music, Plus } from 'lucide-react';
import {
    TabBar,
    BotonBase,
    InputBusqueda,
} from '@app/components/ui';
import type { TabDefinicion } from '@app/components/ui';
import { TarjetaSample } from '@app/components/ui/TarjetaSample';
import { MenuContextual } from '@app/components/ui/MenuContextual';
import { listarSamples } from '@app/services/apiSamples';
import { darLike, quitarLike } from '@app/services/apiSocial';
import { useReproductorStore } from '@app/stores/reproductorStore';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useNavigationStore } from '@/core/router';
import { useMenuContextualSample } from '@app/hooks/useMenuContextualSample';
import { conAutenticacion } from '@app/components/auth/ConAutenticacion';
import type { SampleResumen } from '@app/types';
import '../../styles/componentes/libreria.css';

const TABS_LIBRERIA: TabDefinicion[] = [
    { id: 'descargas', etiqueta: 'Descargas' },
    { id: 'favoritos', etiqueta: 'Favoritos' },
    { id: 'colecciones', etiqueta: 'Colecciones' },
    { id: 'subidos', etiqueta: 'Subidos' },
];

/* Iconos para cada tab */
const ICONOS_TAB: Record<string, JSX.Element> = {
    descargas: <Download size={16} />,
    favoritos: <Heart size={16} />,
    colecciones: <FolderOpen size={16} />,
    subidos: <Upload size={16} />,
};

export const LibreriaIsland = (): JSX.Element => {
    const [tabActiva, setTabActiva] = useState('descargas');
    const [samples, setSamples] = useState<SampleResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');

    const { sampleActual, reproduciendo, progreso, setSample, play, pause } =
        useReproductorStore();
    const { navegar } = useNavigationStore();
    const { abrir: abrirSubirModal } = useSubirModalStore();
    const menu = useMenuContextualSample();

    /* Cargar datos según tab activa — usa mock data por ahora */
    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            /* TO-DO: endpoints dedicados para cada tab (/libreria/descargas, /favoritos, etc.) */
            const resp = await listarSamples({
                busqueda: busqueda || undefined,
                perPage: 20,
            });
            if (resp.ok && resp.data) {
                setSamples(resp.data.data ?? []);
            } else {
                setSamples([]);
            }
            setCargando(false);
        };
        cargar();
    }, [tabActiva, busqueda]);

    const manejarPlay = useCallback(
        (sample: SampleResumen) => {
            if (sampleActual?.id === sample.id) {
                reproduciendo ? pause() : play();
            } else {
                setSample(sample);
            }
        },
        [sampleActual, reproduciendo, pause, play, setSample]
    );

    const manejarLike = useCallback(async (sampleId: number) => {
        setSamples((prev) =>
            prev.map((s) =>
                s.id === sampleId
                    ? { ...s, liked: !s.liked, totalLikes: s.totalLikes + (s.liked ? -1 : 1) }
                    : s
            )
        );
        const sample = samples.find((s) => s.id === sampleId);
        if (sample?.liked) {
            await quitarLike('sample', sampleId);
        } else {
            await darLike('sample', sampleId);
        }
    }, [samples]);

    const manejarTab = useCallback((tabId: string) => {
        setTabActiva(tabId);
        setBusqueda('');
    }, []);

    /* Mensajes vacíos por tab */
    const mensajeVacio: Record<string, { titulo: string; texto: string }> = {
        descargas: { titulo: 'Sin descargas', texto: 'Los samples que descargues aparecerán aquí.' },
        favoritos: { titulo: 'Sin favoritos', texto: 'Dale like a un sample para guardarlo aquí.' },
        colecciones: { titulo: 'Sin colecciones', texto: 'Crea tu primera colección para organizar samples.' },
        subidos: { titulo: 'Sin samples subidos', texto: 'Sube tu primer sample para compartirlo.' },
    };

    return (
        <div className="libreriaContenedor" id="seccionLibreria">
            <div className="libreriaCabecera">
                <h1 className="libreriaTitulo">Tu Librería</h1>
                <div className="libreriaAcciones">
                    {tabActiva === 'colecciones' && (
                        <BotonBase variante="ghost" tamano="sm">
                            <Plus size={14} /> Nueva colección
                        </BotonBase>
                    )}
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>
                            <Upload size={14} /> Subir sample
                        </BotonBase>
                    )}
                </div>
            </div>

            <TabBar tabs={TABS_LIBRERIA} activa={tabActiva} onChange={manejarTab} />

            <div className="libreriaBusqueda">
                <InputBusqueda
                    onChange={setBusqueda}
                    placeholder={`Buscar en ${tabActiva}...`}
                />
            </div>

            {cargando ? (
                <div className="libreriaVacio">
                    <Music size={32} className="libreriaVacioIcono" />
                    <p>Cargando...</p>
                </div>
            ) : samples.length === 0 ? (
                <div className="libreriaVacio">
                    {ICONOS_TAB[tabActiva]}
                    <h3 className="libreriaVacioTitulo">{mensajeVacio[tabActiva]?.titulo}</h3>
                    <p className="libreriaVacioTexto">{mensajeVacio[tabActiva]?.texto}</p>
                    {tabActiva === 'subidos' && (
                        <BotonBase variante="primario" tamano="sm" onClick={abrirSubirModal}>
                            Subir sample
                        </BotonBase>
                    )}
                </div>
            ) : (
                <div className="libreriaLista">
                    {samples.map((sample) => (
                        <TarjetaSample
                            key={sample.id}
                            sample={sample}
                            activa={sampleActual?.id === sample.id}
                            reproduciendo={sampleActual?.id === sample.id && reproduciendo}
                            progreso={sampleActual?.id === sample.id ? progreso : 0}
                            onPlay={() => manejarPlay(sample)}
                            onPause={pause}
                            onLike={manejarLike}
                            onMenu={menu.abrirMenu}
                            onClickCreador={(u) => navegar(`/perfil/${u}`)}
                        />
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

export default conAutenticacion(LibreriaIsland as React.ComponentType<Record<string, unknown>>);
