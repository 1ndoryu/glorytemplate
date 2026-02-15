/*
 * Componente: ModalFiltros — Kamples
 * Modal con filtros toggle on/off para el feed de samples.
 * Filtros: Ya reproducidos, Likeados, De personas que sigo, Descargados.
 * Cada filtro es un switch simple, sin selects complejos.
 */

import { useCallback } from 'react';
import { Play, Heart, Users, Download } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { useFiltrosStore } from '@app/stores/filtrosStore';
import '../../styles/componentes/modalFiltros.css';

interface FiltroToggleDef {
    id: string;
    etiqueta: string;
    icono: React.ReactNode;
    activo: boolean;
    onToggle: () => void;
}

interface ModalFiltrosProps {
    abierto: boolean;
    onCerrar: () => void;
}

export const ModalFiltros = ({ abierto, onCerrar }: ModalFiltrosProps): JSX.Element | null => {
    const {
        yaReproducidos,
        likeados,
        deSeguidos,
        descargados,
        toggleYaReproducidos,
        toggleLikeados,
        toggleDeSeguidos,
        toggleDescargados,
        resetearFiltros,
    } = useFiltrosStore();

    const filtros: FiltroToggleDef[] = [
        { id: 'yaReproducidos', etiqueta: 'Ya reproducidos', icono: <Play size={16} />, activo: yaReproducidos, onToggle: toggleYaReproducidos },
        { id: 'likeados', etiqueta: 'Likeados', icono: <Heart size={16} />, activo: likeados, onToggle: toggleLikeados },
        { id: 'deSeguidos', etiqueta: 'De personas que sigo', icono: <Users size={16} />, activo: deSeguidos, onToggle: toggleDeSeguidos },
        { id: 'descargados', etiqueta: 'Descargados', icono: <Download size={16} />, activo: descargados, onToggle: toggleDescargados },
    ];

    const hayFiltrosActivos = yaReproducidos || likeados || deSeguidos || descargados;

    const manejarReset = useCallback(() => {
        resetearFiltros();
    }, [resetearFiltros]);

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="pequeno">
            <div className="filtrosContenido">
                <h3 className="filtrosTitulo">Filtros</h3>

                <div className="filtrosToggles">
                    {filtros.map((f) => (
                        <button
                            key={f.id}
                            className={`filtroToggle ${f.activo ? 'filtroToggleActivo' : ''}`}
                            onClick={f.onToggle}
                            type="button"
                        >
                            <span className="filtroToggleIcono">{f.icono}</span>
                            <span className="filtroToggleTexto">{f.etiqueta}</span>
                            <span className={`filtroToggleSwitch ${f.activo ? 'filtroToggleSwitchOn' : ''}`}>
                                <span className="filtroToggleSwitchDot" />
                            </span>
                        </button>
                    ))}
                </div>

                <div className="filtrosAcciones">
                    {hayFiltrosActivos && (
                        <BotonBase variante="ghost" onClick={manejarReset}>
                            Limpiar filtros
                        </BotonBase>
                    )}
                    <BotonBase variante="primario" onClick={onCerrar}>
                        Aplicar
                    </BotonBase>
                </div>
            </div>
        </Modal>
    );
};

export default ModalFiltros;
