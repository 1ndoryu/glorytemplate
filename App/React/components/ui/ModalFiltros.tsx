/*
 * Componente: ModalFiltros — Kamples
 * Modal con filtros toggle on/off para el feed de samples.
 * Filtros: Ya reproducidos, Likeados, De personas que sigo, Descargados.
 * Cada filtro es un switch simple, sin selects complejos.
 */

import { useCallback } from 'react';
import { Play, Heart, Users, Download, DollarSign } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { useFiltrosStore, type FiltroPrecio } from '@app/stores/filtrosStore';
import '../../styles/componentes/modalFiltros.css';

interface FiltroToggleDef {
    id: string;
    etiqueta: string;
    descripcion: string;
    icono: React.ReactNode;
    activo: boolean;
    onToggle: () => void;
}

interface ModalFiltrosProps {
    abierto: boolean;
    onCerrar: () => void;
}

export const ModalFiltros = ({ abierto, onCerrar }: ModalFiltrosProps): JSX.Element | null => {
    const yaReproducidos = useFiltrosStore(s => s.yaReproducidos);
    const likeados = useFiltrosStore(s => s.likeados);
    const deSeguidos = useFiltrosStore(s => s.deSeguidos);
    const descargados = useFiltrosStore(s => s.descargados);
    const filtroPrecio = useFiltrosStore(s => s.filtroPrecio);
    const toggleYaReproducidos = useFiltrosStore(s => s.toggleYaReproducidos);
    const toggleLikeados = useFiltrosStore(s => s.toggleLikeados);
    const toggleDeSeguidos = useFiltrosStore(s => s.toggleDeSeguidos);
    const toggleDescargados = useFiltrosStore(s => s.toggleDescargados);
    const setFiltroPrecio = useFiltrosStore(s => s.setFiltroPrecio);
    const resetearFiltros = useFiltrosStore(s => s.resetearFiltros);

    const filtros: FiltroToggleDef[] = [
        { id: 'yaReproducidos', etiqueta: 'Ocultar ya reproducidos', descripcion: 'No mostrar samples que ya escuchaste', icono: <Play size={16} />, activo: yaReproducidos, onToggle: toggleYaReproducidos },
        { id: 'likeados', etiqueta: 'Ocultar ya likeados', descripcion: 'Excluir samples a los que diste like', icono: <Heart size={16} />, activo: likeados, onToggle: toggleLikeados },
        { id: 'deSeguidos', etiqueta: 'Solo de personas que sigo', descripcion: 'Ver únicamente samples de creadores que sigues', icono: <Users size={16} />, activo: deSeguidos, onToggle: toggleDeSeguidos },
        { id: 'descargados', etiqueta: 'Ocultar ya descargados', descripcion: 'Excluir samples que ya tienes descargados', icono: <Download size={16} />, activo: descargados, onToggle: toggleDescargados },
    ];

    const hayFiltrosActivos = yaReproducidos || likeados || deSeguidos || descargados || filtroPrecio !== 'todos';

    /* C274: Opciones del selector de precio */
    const opcionesPrecio: { valor: FiltroPrecio; etiqueta: string }[] = [
        { valor: 'todos', etiqueta: 'Todos' },
        { valor: 'gratis', etiqueta: 'Gratis' },
        { valor: 'premium', etiqueta: 'Premium' },
    ];

    const manejarReset = useCallback(() => {
        resetearFiltros();
    }, [resetearFiltros]);

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="pequeno">
            <div className="filtrosContenido">
                {/* C345: Título eliminado — el Modal ya tiene su propio contexto visual */}

                <div className="filtrosToggles">
                    {filtros.map((f) => (
                        <BotonBase variante="ghost"
                            key={f.id}
                            className={`filtroToggle ${f.activo ? 'filtroToggleActivo' : ''}`}
                            onClick={f.onToggle}
                            type="button"
                        >
                            <span className="filtroToggleIcono">{f.icono}</span>
                            <div className="filtroToggleContenido">
                                <span className="filtroToggleTexto">{f.etiqueta}</span>
                                <span className="filtroToggleDescripcion">{f.descripcion}</span>
                            </div>
                            <span className={`filtroToggleSwitch ${f.activo ? 'filtroToggleSwitchOn' : ''}`}>
                                <span className="filtroToggleSwitchDot" />
                            </span>
                        </BotonBase>
                    ))}
                </div>

                {/* C274: Selector de precio free/premium */}
                <div className="filtroPrecioSeccion">
                    <div className="filtroPrecioEtiqueta">
                        <DollarSign size={16} />
                        <span>Tipo de sample</span>
                    </div>
                    <div className="filtroPrecioOpciones">
                        {opcionesPrecio.map((op) => (
                            <BotonBase variante="ghost"
                                key={op.valor}
                                className={`filtroPrecioBoton ${filtroPrecio === op.valor ? 'filtroPrecioBotonActivo' : ''}`}
                                onClick={() => setFiltroPrecio(op.valor)}
                                type="button"
                            >
                                {op.etiqueta}
                            </BotonBase>
                        ))}
                    </div>
                </div>

                {/* D7: Acciones unificadas */}
                <ModalAcciones>
                    {hayFiltrosActivos && (
                        <BotonBase variante="secundario" onClick={manejarReset}>
                            Limpiar filtros
                        </BotonBase>
                    )}
                    <BotonBase variante="primario" onClick={onCerrar}>
                        Aplicar
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalFiltros;
