/*
 * Sección Showcase: Inputs, búsqueda, TabBar y BarraProgreso.
 * Agrupa los componentes de formulario del design system.
 */

import type { ChangeEvent } from 'react';
import {
    CampoTexto,
    InputBusqueda,
    TabBar,
    BarraProgreso,
    DropZone,
} from '@app/components/ui';
import { useShowcaseFormularios } from '@app/hooks/useShowcaseFormularios';
import type { TabDefinicion } from '@app/components/ui';
import {
    Music,
    Heart,
    Layers,
    Zap,
} from 'lucide-react';

const TABS_DEMO: TabDefinicion[] = [
    { id: 'samples', etiqueta: 'Samples', icono: <Music size={14} />, contador: 128 },
    { id: 'packs', etiqueta: 'Packs', icono: <Layers size={14} />, contador: 12 },
    { id: 'favoritos', etiqueta: 'Favoritos', icono: <Heart size={14} />, contador: 45 },
    { id: 'activos', etiqueta: 'Activos', icono: <Zap size={14} /> },
];

interface Props {
    onToast: (tipo: 'exito' | 'error' | 'advertencia' | 'info') => void;
}

export const ShowcaseFormularios = ({ onToast }: Props): JSX.Element => {
    const {
        busqueda,
        setBusqueda,
        tabActiva,
        setTabActiva,
        campoTexto,
        setCampoTexto,
        campoArea,
        setCampoArea,
    } = useShowcaseFormularios();

    return (
        <>
            {/* Campos de texto */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">CampoTexto</h2>
                <p className="showcaseSeccionDesc">Inputs y textareas con etiqueta y error.</p>

                <div className="showcaseAnchoCompleto">
                    <div className="showcaseFilaVertical">
                        <CampoTexto
                            etiqueta="Nombre de usuario"
                            placeholder="@tu_nombre"
                            value={campoTexto}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setCampoTexto(e.target.value)}
                        />
                        <CampoTexto
                            etiqueta="Email"
                            type="email"
                            placeholder="tu@email.com"
                        />
                        <CampoTexto
                            etiqueta="Con error"
                            error="Este campo es obligatorio"
                            value=""
                            readOnly
                        />
                        <CampoTexto
                            etiqueta="Biografía"
                            multilínea
                            placeholder="Cuéntanos sobre ti..."
                            rows={3}
                            value={campoArea}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCampoArea(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Input búsqueda */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">InputBusqueda</h2>
                <p className="showcaseSeccionDesc">Input con debounce de 300ms, icono y botón limpiar.</p>

                <div className="showcaseAnchoCompleto">
                    <div className="showcaseFilaVertical">
                        <InputBusqueda
                            valor={busqueda}
                            onChange={setBusqueda}
                            placeholder="Buscar samples, packs, artistas..."
                        />
                        <InputBusqueda
                            onChange={() => {}}
                            compacto
                            placeholder="Búsqueda compacta"
                        />
                        {busqueda && (
                            <p className="showcaseTextoAyuda">
                                Buscando: &ldquo;{busqueda}&rdquo;
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* TabBar */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">TabBar</h2>
                <p className="showcaseSeccionDesc">Tabs de navegación con icono y contador.</p>

                <TabBar
                    tabs={TABS_DEMO}
                    activa={tabActiva}
                    onChange={setTabActiva}
                />
                <p className="showcaseTextoAyudaConMargen">
                    Tab activa: {tabActiva}
                </p>
            </section>

            {/* BarraProgreso */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">BarraProgreso</h2>
                <p className="showcaseSeccionDesc">4 estados: normal, éxito, error, indeterminado.</p>

                <div className="showcaseAnchoCompleto">
                    <div className="showcaseFilaVertical">
                        <BarraProgreso porcentaje={35} etiqueta="Subiendo kick_808.wav" />
                        <BarraProgreso porcentaje={72} etiqueta="Procesando audio" />
                        <BarraProgreso porcentaje={100} estado="exito" etiqueta="Completado" />
                        <BarraProgreso porcentaje={45} estado="error" etiqueta="Error de red" />
                        <BarraProgreso estado="indeterminado" />
                    </div>
                </div>
            </section>

            {/* DropZone */}
            <section className="showcaseSeccion">
                <h2 className="showcaseSeccionTitulo">DropZone</h2>
                <p className="showcaseSeccionDesc">Drag & drop para archivos de audio.</p>

                <DropZone
                    onArchivos={() => {
                        onToast('exito');
                    }}
                />
            </section>
        </>
    );
};
