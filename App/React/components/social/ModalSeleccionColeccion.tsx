/*
 * Componente: ModalSeleccionColeccion — Kamples
 * Modal sin cabecera para seleccionar colección y añadir un sample.
 * Lógica extraída a useModalSeleccionColeccion (SRP).
 */

import { Check, Loader, Plus, Search, X } from 'lucide-react';
import { obtenerImagenColor } from '@app/services/imagenesColor';
import { useModalSeleccionColeccion } from '@app/hooks/useModalSeleccionColeccion';
import '../../styles/componentes/modalSeleccionColeccion.css';
import { BotonBase } from '../ui/BotonBase';
import { CampoTexto } from '../ui/CampoTexto';
import { ImgOptimizada } from '../ui/ImgOptimizada';
import { useT } from '@app/utils/i18n/useT';

export const ModalSeleccionColeccion = (): JSX.Element | null => {
    const {
        abierto, sample, posicion, cerrar,
        colecciones, cargando, agregando, agregados, yaGuardadoEn,
        busqueda, setBusqueda, existeConNombre,
        manejarAgregar, manejarCrear,
    } = useModalSeleccionColeccion();

    /* [193A-66] useT DEBE ir antes de cualquier return condicional — Rules of Hooks */
    const { t } = useT();

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
                    <CampoTexto  value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder={t('coleccion.buscarOCrear')} className="seleccionColeccionInput"
                        maxLength={100} autoFocus
                        onKeyDown={e => {
                            if (e.key === 'Enter' && busqueda.trim() && !existeConNombre) manejarCrear();
                            if (e.key === 'Escape') cerrar();
                        }} />
                    {busqueda && (
                        <BotonBase variante="ghost" className="seleccionColeccionLimpiar" onClick={() => setBusqueda('')} type="button">
                            <X size={12} />
                        </BotonBase>
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
                                <BotonBase variante="ghost" key={col.id}
                                    className={`seleccionColeccionItem ${yaGuardado ? 'seleccionColeccionItemGuardado' : ''}`}
                                    onClick={() => !yaGuardado && manejarAgregar(col.id)}
                                    disabled={yaGuardado || agregandoEste} type="button">
                                    {/* [183A-88] Photon CDN para thumbnails en picker */}
                                    <ImgOptimizada className="seleccionColeccionItemImg"
                                        src={col.imagenUrl || obtenerImagenColor(col.id)} alt="" w={48} quality={75} />
                                    <span className="seleccionColeccionItemNombre">{col.nombre}</span>
                                    {yaGuardado && <span className="seleccionColeccionYaGuardado"><Check size={12} /></span>}
                                    {agregandoEste && <Loader size={14} className="seleccionColeccionSpinner" />}
                                </BotonBase>
                            );
                        })}
                        {colecciones.length === 0 && !cargando && (
                            <div className="seleccionColeccionVacio">
                                {busqueda.trim() ? t('coleccion.sinResultados') : t('coleccion.sinColecciones')}
                            </div>
                        )}
                    </div>
                )}

                {busqueda.trim() && !existeConNombre && (
                    <BotonBase variante="ghost" className="seleccionColeccionCrearBtn" onClick={manejarCrear}
                        disabled={agregando === -1} type="button">
                        <Plus size={14} /><span>Crear "{busqueda.trim()}"</span>
                        {agregando === -1 && <Loader size={12} className="seleccionColeccionSpinner" />}
                    </BotonBase>
                )}

                {busqueda.trim() && existeConNombre && (
                    <div className="seleccionColeccionAlerta">{t('coleccion.nombreDuplicado')}</div>
                )}
            </div>
        </div>
    );
};

export default ModalSeleccionColeccion;
