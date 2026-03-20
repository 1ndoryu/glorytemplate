/*
 * Componente: SubirModal — Kamples
 * Modal global de subida de samples con DropZone, preview y metadata.
 * Pasos: 1) Seleccionar archivos → 2) Metadata → 3) Publicar.
 * Se abre desde el Sidebar u otros puntos de la app.
 * Refactorizado: pasos extraídos a sub-componentes (SRP).
 */

import { Check } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { DropZone, BotonBase } from '@app/components/ui';
import { PasoMetadata, PasoSubida } from '@app/components/ui/subir';
import { useSubirModal } from '@app/hooks/useSubirModal';
import { useT } from '@app/utils/i18n/useT';
import '../../styles/componentes/subir.css';

const nombrePaso = (n: number, t: (k: string) => string): string => {
    if (n === 1) return t('subir.archivos');
    if (n === 2) return t('subir.metadata');
    return t('subir.publicar');
};

export const SubirModal = (): JSX.Element | null => {
    const {
        abierto,
        autenticado,
        paso,
        archivos,
        archivoActual,
        progresoCarga,
        subiendo,
        metadata,
        setMetadata,
        manejarCerrar,
        manejarArchivos,
        eliminarArchivo,
        manejarSubida,
        resetearFormulario,
        volverPaso1,
    } = useSubirModal();

    const { t } = useT();

    if (!autenticado && abierto) {
        return (
            <Modal abierto={abierto} onCerrar={manejarCerrar} tamano="grande">
                <div className="subirAuthAviso">
                    <p>{t('subir.iniciarSesion')}</p>
                    <BotonBase variante="primario" onClick={manejarCerrar}>
                        {t('subir.cerrar')}
                    </BotonBase>
                </div>
            </Modal>
        );
    }

    return (
        <Modal abierto={abierto} onCerrar={manejarCerrar} tamano="grande">
            <div className="subirModalContenido">
                {/* Indicador de pasos */}
                <div className="subirPasos">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="subirPasoWrapper">
                            <div
                                className={`subirPaso ${paso === n ? 'subirPasoActivo' : ''} ${paso > n ? 'subirPasoCompletado' : ''}`}
                            >
                                <span className="subirPasoNumero">
                                    {paso > n ? <Check size={12} /> : n}
                                </span>
                                {nombrePaso(n, t)}
                            </div>
                            {n < 3 && <div className="subirPasoLinea" />}
                        </div>
                    ))}
                </div>

                {paso === 1 && (
                    <DropZone
                        onArchivos={manejarArchivos}
                        formatosAceptados={['.wav', '.mp3', '.flac', '.aiff', '.aif']}
                        multiple
                        tamanoMaximoMB={100}
                    />
                )}

                {paso === 2 && (
                    <PasoMetadata
                        archivos={archivos}
                        metadata={metadata}
                        onMetadataChange={setMetadata}
                        onEliminarArchivo={eliminarArchivo}
                        onVolver={volverPaso1}
                        onSubir={manejarSubida}
                    />
                )}

                {paso === 3 && (
                    <PasoSubida
                        archivos={archivos}
                        archivoActual={archivoActual}
                        progresoCarga={progresoCarga}
                        subiendo={subiendo}
                        onCerrar={manejarCerrar}
                        onSubirMas={resetearFormulario}
                    />
                )}
            </div>
        </Modal>
    );
};

export default SubirModal;
