/*
 * Componente: SubirModal — Kamples
 * Modal global de subida de samples con DropZone, preview y metadata.
 * Pasos: 1) Seleccionar archivos → 2) Metadata → 3) Publicar.
 * Se abre desde el Sidebar u otros puntos de la app.
 * Refactorizado: pasos extraídos a sub-componentes (SRP).
 */

import { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@app/components/ui/Modal';
import { DropZone, BotonBase } from '@app/components/ui';
import { PasoMetadata, PasoSubida, metadataInicial } from '@app/components/ui/subir';
import type { MetadataSample } from '@app/components/ui/subir';
import { useSubirModalStore } from '@app/stores/subirModalStore';
import { useAuthStore } from '@app/stores/authStore';
import '../../styles/componentes/subir.css';

interface ArchivoSubida {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const extraerFormato = (nombre: string): string => {
    return nombre.split('.').pop()?.toLowerCase() ?? '';
};

const nombrePaso = (n: number): string => {
    if (n === 1) return 'Archivos';
    if (n === 2) return 'Metadata';
    return 'Publicar';
};

export const SubirModal = (): JSX.Element | null => {
    const abierto = useSubirModalStore(s => s.abierto);
    const cerrar = useSubirModalStore(s => s.cerrar);
    const autenticado = useAuthStore(s => s.autenticado);

    const [paso, setPaso] = useState<1 | 2 | 3>(1);
    const [archivos, setArchivos] = useState<ArchivoSubida[]>([]);
    const [archivoActual, setArchivoActual] = useState(0);
    const [progresoCarga, setProgresoCarga] = useState(0);
    const [subiendo, setSubiendo] = useState(false);
    const [metadata, setMetadata] = useState<MetadataSample>({ ...metadataInicial });

    const resetearFormulario = useCallback(() => {
        setPaso(1);
        setArchivos([]);
        setArchivoActual(0);
        setProgresoCarga(0);
        setMetadata({ ...metadataInicial });
    }, []);

    const manejarCerrar = useCallback(() => {
        if (subiendo) return;
        cerrar();
        setTimeout(resetearFormulario, 200);
    }, [cerrar, subiendo, resetearFormulario]);

    /* Paso 1: Recibir archivos */
    const manejarArchivos = useCallback((files: File[]) => {
        const nuevos: ArchivoSubida[] = files.map((f) => ({
            archivo: f,
            nombre: f.name,
            tamano: formatearTamano(f.size),
            formato: extraerFormato(f.name),
        }));
        setArchivos((prev) => [...prev, ...nuevos]);

        if (archivos.length === 0 && nuevos.length > 0) {
            const nombreSinExt = nuevos[0].nombre.replace(/\.[^/.]+$/, '');
            setMetadata((prev) => ({
                ...prev,
                titulo: prev.titulo || nombreSinExt,
            }));
        }
        setPaso(2);
    }, [archivos.length]);

    const eliminarArchivo = useCallback((indice: number) => {
        setArchivos((prev) => prev.filter((_, i) => i !== indice));
        if (archivos.length <= 1) setPaso(1);
    }, [archivos.length]);

    /* Paso 3: Subir */
    const manejarSubida = useCallback(async () => {
        setSubiendo(true);
        setPaso(3);

        for (let i = 0; i < archivos.length; i++) {
            setArchivoActual(i);
            for (let pct = 0; pct <= 100; pct += 10) {
                setProgresoCarga(pct);
                await new Promise((r) => setTimeout(r, 100));
            }
        }

        setSubiendo(false);
        /* TO-DO: llamar a subirSample con FormData real */
    }, [archivos.length]);

    if (!autenticado && abierto) {
        return (
            <Modal abierto={abierto} onCerrar={manejarCerrar} titulo="Subir Samples" tamano="grande">
                <div className="subirAuthAviso">
                    <p>Inicia sesión para subir samples.</p>
                    <BotonBase variante="primario" onClick={manejarCerrar}>
                        Cerrar
                    </BotonBase>
                </div>
            </Modal>
        );
    }

    return (
        <Modal abierto={abierto} onCerrar={manejarCerrar} titulo="Subir Samples" tamano="grande">
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
                                {nombrePaso(n)}
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
                        onVolver={() => setPaso(1)}
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
