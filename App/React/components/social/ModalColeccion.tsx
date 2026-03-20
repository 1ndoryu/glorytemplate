/*
 * Componente: ModalColeccion — Kamples
 * Modal para crear o editar una colección de samples.
 * Edit mode: sin header del modal, widget de imagen en lugar del icono.
 * Create mode: icono FolderPlus + header con título.
 */

import { useRef } from 'react';
import { FolderPlus, Camera } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { CampoTexto } from '@app/components/ui/CampoTexto';
import { BotonBase } from '@app/components/ui/BotonBase';
import { ModalAcciones } from '@app/components/ui/ModalAcciones';
import { Checkbox } from '@app/components/ui/Checkbox';
import { Input } from '@app/components/ui/Input';
import { SelectorMenu } from '@app/components/ui/SelectorMenu';
import { useModalColeccion } from '@app/hooks/useModalColeccion';
import { useT } from '@app/utils/i18n/useT';
import type { Coleccion } from '@app/types';
import '../../styles/componentes/modalColeccion.css';

interface ModalColeccionProps {
    abierto: boolean;
    onCerrar: () => void;
    onGuardar?: (coleccion: Coleccion) => void;
    /* Si se pasa, modo edición */
    coleccion?: Coleccion | null;
}

export const ModalColeccion = ({
    abierto,
    onCerrar,
    onGuardar,
    coleccion = null,
}: ModalColeccionProps): JSX.Element | null => {
    const inputImagenRef = useRef<HTMLInputElement>(null);
    const { t } = useT();
    const {
        esEdicion,
        nombre,
        setNombre,
        descripcion,
        setDescripcion,
        esPublica,
        setEsPublica,
        guardando,
        manejarGuardar,
        manejarSeleccionImagen,
        previewImagen,
        parentId,
        setParentId,
        opcionesPadre,
    } = useModalColeccion({ abierto, onCerrar, onGuardar, coleccion });

    return (
        <Modal abierto={abierto} onCerrar={onCerrar} tamano="pequeno">
            <div className="modalColeccionContenido">

                {esEdicion ? (
                    /* Widget de imagen — solo en modo edición */
                    <div className="modalColeccionImagenWrapper">
                        <div
                            className="modalColeccionImagenPreview"
                            onClick={() => inputImagenRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && inputImagenRef.current?.click()}
                            title={t('coleccion.cambiarPortada')}
                        >
                            {previewImagen ? (
                                <img src={previewImagen} alt={t('coleccion.portadaAlt')} className="modalColeccionImagenImg" />
                            ) : (
                                <div className="modalColeccionImagenPlaceholder">
                                    <Camera size={28} />
                                </div>
                            )}
                            <div className="modalColeccionImagenOverlay">
                                <Camera size={16} />
                                <span>{t('coleccion.cambiarImagen')}</span>
                            </div>
                        </div>
                        <Input
                            ref={inputImagenRef}
                            type="file"
                            accept="image/*"
                            className="modalColeccionImagenInput"
                            onChange={(e) => {
                                const archivo = e.target.files?.[0];
                                if (archivo) manejarSeleccionImagen(archivo);
                                /* Limpiar valor para permitir re-seleccion del mismo archivo */
                                e.target.value = '';
                            }}
                        />
                    </div>
                ) : (
                    /* Icono decorativo — solo en modo creación */
                    <div className="modalColeccionIcono">
                        <FolderPlus size={32} />
                    </div>
                )}

                <CampoTexto
                    etiqueta={t('coleccion.nombre')}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder={t('coleccion.nombrePlaceholder')}
                    maxLength={100}
                    autoFocus
                />

                <CampoTexto
                    etiqueta={t('coleccion.descripcion')}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder={t('coleccion.descripcionPlaceholder')}
                    maxLength={300}
                />

                <label className="modalColeccionPublica">
                    <Checkbox
                        checked={esPublica}
                        onChange={(e) => setEsPublica(e.target.checked)}
                    />
                    <span>{t('coleccion.publica')}</span>
                    <span className="modalColeccionPublicaHint">
                        {t('coleccion.publicaHint')}
                    </span>
                </label>

                {/* QL114: Selector de colección padre — solo en modo edición, con opciones cargadas */}
                {esEdicion && opcionesPadre.length > 1 && (
                    <div className="modalColeccionCampoPadre">
                        <span className="modalColeccionCampoPadreEtiqueta">{t('coleccion.padre')}</span>
                        <SelectorMenu
                            opciones={opcionesPadre}
                            valor={parentId !== null ? String(parentId) : ''}
                            onChange={(val) => setParentId(val ? Number(val) : null)}
                            placeholder={t('coleccion.sinPadre')}
                        />
                    </div>
                )}

                <ModalAcciones>
                    <BotonBase variante="secundario" onClick={onCerrar}>
                        {t('comun.cancelar')}
                    </BotonBase>
                    <BotonBase
                        variante="primario"
                        onClick={manejarGuardar}
                        disabled={!nombre.trim() || guardando}
                    >
                        {guardando ? t('comun.guardando') : esEdicion ? t('comun.guardar') : t('coleccion.crear')}
                    </BotonBase>
                </ModalAcciones>
            </div>
        </Modal>
    );
};

export default ModalColeccion;
