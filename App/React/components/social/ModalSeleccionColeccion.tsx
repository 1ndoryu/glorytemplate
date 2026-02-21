/*
 * Componente: ModalSeleccionColeccion — Kamples
 * Modal sin cabecera para seleccionar colección y añadir un sample.
 * Lógica extraída a useModalSeleccionColeccion (SRP).
 */

import { Check, Loader, Plus, Search, X } from 'lucide-react';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useModalSeleccionColeccion } from '@app/hooks/useModalSeleccionColeccion';
import '../../styles/componentes/modalSeleccionColeccion.css';

export const ModalSeleccionColeccion = (): JSX.Element | null => {
    const {
        abierto, sample, posicion, cerrar,
        colecciones, cargando, agregando, agregados, yaGuardadoEn,
        busqueda, setBusqueda, existeConNombre,
        manejarAgregar, manejarCrear,
    } = useModalSeleccionColeccion();

    if (!abierto || !sample) return null;

    /* Posición contextual ajustada al viewport */
    const estiloPanel: React.CSSProperties | undefined = posicion
        ? {
            position: 'fixed',
            top: Math.max(8, Math.min(posicion.y, window.innerHeight - 428)),
            left: Math.max(8, Math.min(posicion.x, window.innerWidth - 328)),
        }
        : undefined;

    return (
        <div className={`seleccionColeccionOverlay ${posicion ? 'seleccionColeccionOverlayContextual' : ''}`}
            onClick={cerrar}>
            <div className="seleccionColeccionPanel" style={estiloPanel} onClick={e => e.stopPropagation()}>
                <div className="seleccionColeccionBuscador">
                    <Search size={14} className="seleccionColeccionBuscadorIcono" />
                    <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar o crear colección..." className="seleccionColeccionInput"
                        maxLength={100} autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Enter' && busqueda.trim() && !existeConNombre) manejarCrear();
                            if (e.key === 'Escape') cerrar();
                        }} />
                    {busqueda && (
                        <button className="seleccionColeccionLimpiar" onClick={() => setBusqueda('')} type="button">
                            <X size={12} />
                        </button>
                    )}
                </div>

                {cargando ? (
                    <div className="seleccionColeccionCargando">
                        <Loader size={18} className="seleccionColeccionSpinner" />
                    </div>
                ) : (
                    <div className="seleccionColeccionLista">
                        {colecciones.map(col => {
                            const yaGuardado = yaGuardadoEn.has(col.id) || agregados.has(col.id);
                            const agregandoEste = agregando === col.id;
                            return (
                                <button key={col.id}
                                    className={`seleccionColeccionItem ${yaGuardado ? 'seleccionColeccionItemGuardado' : ''}`}
                                    onClick={() => !yaGuardado && manejarAgregar(col.id)}
                                    disabled={yaGuardado || agregandoEste} type="button">
                                    <img className="seleccionColeccionItemImg"
                                        src={col.imagenUrl || obtenerImagenColor(col.id)} alt="" />
                                    <span className="seleccionColeccionItemNombre">{col.nombre}</span>
                                    {yaGuardado && <span className="seleccionColeccionYaGuardado"><Check size={12} /></span>}
                                    {agregandoEste && <Loader size={14} className="seleccionColeccionSpinner" />}
                                </button>
                            );
                        })}
                        {colecciones.length === 0 && !cargando && (
                            <div className="seleccionColeccionVacio">
                                {busqueda.trim() ? 'Sin resultados' : 'No tienes colecciones'}
                            </div>
                        )}
                    </div>
                )}

                {busqueda.trim() && !existeConNombre && (
                    <button className="seleccionColeccionCrearBtn" onClick={manejarCrear}
                        disabled={agregando === -1} type="button">
                        <Plus size={14} /><span>Crear "{busqueda.trim()}"</span>
                        {agregando === -1 && <Loader size={12} className="seleccionColeccionSpinner" />}
                    </button>
                )}

                {busqueda.trim() && existeConNombre && (
                    <div className="seleccionColeccionAlerta">Ya tienes una colección con ese nombre</div>
                )}
            </div>
        </div>
    );
};

export default ModalSeleccionColeccion;
