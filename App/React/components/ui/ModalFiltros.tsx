/*
 * Componente: ModalFiltros — Kamples
 * Modal con filtros toggle on/off reutilizable.
 * QL87: Acepta filtros como props (via useFiltrosContenido) o usa store global (legacy).
 * Cada filtro es un switch simple, sin selects complejos.
 */

import { useCallback } from 'react';
import { Play, Heart, Users, Download, DollarSign } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { useFiltrosStore, type FiltroPrecio } from '@app/stores/filtrosStore';
import { useT } from '@app/utils/i18n/useT';
import type { FiltroContenidoDef, FiltroContenidoId } from '@app/hooks/useFiltrosContenido';
import '../../styles/componentes/modalFiltros.css';

interface FiltroToggleDef {
    id: string;
    etiqueta: string;
    descripcion: string;
    icono: React.ReactNode;
    activo: boolean;
    onToggle: () => void;
}

/*
 * QL87: Props extendidas — acepta filtros externos de useFiltrosContenido
 * para independencia por pagina (no depende del store global).
 * Si no se pasan filtrosContenido, usa el store global como antes.
 */
interface ModalFiltrosProps {
    abierto: boolean;
    onCerrar: () => void;
    /** QL87: Filtros inyectados desde useFiltrosContenido */
    filtrosContenido?: FiltroContenidoDef[];
    estaActivo?: (id: FiltroContenidoId) => boolean;
    onToggleFiltro?: (id: FiltroContenidoId) => void;
    hayFiltrosContenidoActivos?: boolean;
    onResetContenido?: () => void;
    /** [193A-104] Pendiente: selector de precio desactivado. Restaurar default a true cuando se reactive.  */
    mostrarPrecio?: boolean;
}

export const ModalFiltros = ({
    abierto, onCerrar,
    filtrosContenido, estaActivo, onToggleFiltro, hayFiltrosContenidoActivos, onResetContenido,
    /* [193A-104] Pendiente: forzado a false. Restaurar default a true */
    mostrarPrecio = false,
}: ModalFiltrosProps): JSX.Element | null => {
    const { t } = useT();
    /* Store global — solo se lee si NO se pasan filtrosContenido */
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

    /* QL87: Si se pasaron filtros externos, usarlos. Si no, legacy store global. */
    const usarContenido = !!(filtrosContenido && estaActivo && onToggleFiltro);

    const filtros: FiltroToggleDef[] = usarContenido
        ? filtrosContenido.map(f => ({
            id: f.id,
            etiqueta: f.etiqueta,
            descripcion: f.descripcion,
            icono: f.icono,
            activo: estaActivo(f.id),
            onToggle: () => onToggleFiltro(f.id),
        }))
        : [
            { id: 'yaReproducidos', etiqueta: t('filtros.ocultarReproducidos'), descripcion: t('filtros.ocultarReproducidosDesc'), icono: <Play size={16} />, activo: yaReproducidos, onToggle: toggleYaReproducidos },
            { id: 'likeados', etiqueta: t('filtros.ocultarLikeados'), descripcion: t('filtros.ocultarLikeadosDesc'), icono: <Heart size={16} />, activo: likeados, onToggle: toggleLikeados },
            { id: 'deSeguidos', etiqueta: t('filtros.soloDeSeguidos'), descripcion: t('filtros.soloDeSeguidosDesc'), icono: <Users size={16} />, activo: deSeguidos, onToggle: toggleDeSeguidos },
            { id: 'descargados', etiqueta: t('filtros.ocultarDescargados'), descripcion: t('filtros.ocultarDescargadosDesc'), icono: <Download size={16} />, activo: descargados, onToggle: toggleDescargados },
        ];

    const hayActivos = usarContenido
        ? (hayFiltrosContenidoActivos ?? false)
        : (yaReproducidos || likeados || deSeguidos || descargados || filtroPrecio !== 'todos');

    /* C274: Opciones del selector de precio */
    const opcionesPrecio: { valor: FiltroPrecio; etiqueta: string }[] = [
        { valor: 'todos', etiqueta: t('filtros.todos') },
        { valor: 'gratis', etiqueta: t('filtros.gratis') },
        { valor: 'premium', etiqueta: t('filtros.premium') },
    ];

    const manejarReset = useCallback(() => {
        if (usarContenido && onResetContenido) {
            onResetContenido();
        } else {
            resetearFiltros();
        }
    }, [usarContenido, onResetContenido, resetearFiltros]);

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="pequeno">
            <div className="filtrosContenido">
                <div className="filtrosToggles">
                    {filtros.map((f) => (
                        <BotonBase variante="ghost" tamano="ninguno"
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

                {/* C274: Selector de precio free/premium (solo si visible) */}
                {mostrarPrecio && (
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
                )}

                {/* D7: Acciones unificadas */}
                <ModalAcciones>
                    {hayActivos && (
                        <BotonBase variante="secundario" onClick={manejarReset}>
                            {t('filtros.resetear')}
                        </BotonBase>
                    )}
                    <BotonBase variante="primario" onClick={onCerrar}>
                        {t('filtros.aplicar')}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalFiltros;
