/*
 * ModalCrearRecordatorio
 * Modal para crear recordatorios rápidamente.
 * Reutiliza las clases CSS de creacionRapidaContenedor para el efecto glass.
 * Soporta: texto simple, arrastrar imágenes (individuales o agrupadas).
 */

import {useState, useCallback, useRef, useEffect} from 'react';
import {ArrowRight, ImagePlus, Loader2, AlertCircle} from 'lucide-react';
import {Boton} from '../ui';
import {Input} from '../ui/Input';
import type {Adjunto} from '../../types/dashboard';
import {useAdjuntos} from '../../hooks/useAdjuntos';
import '../../styles/dashboard/componentes/modalCreacionRapida.css';

interface ModalCrearRecordatorioProps {
    abierto: boolean;
    onCerrar: () => void;
    onGuardar: (texto: string, adjuntos: Adjunto[], crearIndividuales: boolean) => void;
}

export function ModalCrearRecordatorio({abierto, onCerrar, onGuardar}: ModalCrearRecordatorioProps): JSX.Element | null {
    const [texto, setTexto] = useState('');
    const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
    const [arrastrando, setArrastrando] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {subirArchivo, estado: estadoSubida} = useAdjuntos();

    useEffect(() => {
        if (abierto && inputRef.current) {
            inputRef.current.focus();
        }
    }, [abierto]);

    /* Reset al cerrar */
    useEffect(() => {
        if (!abierto) {
            setTexto('');
            setAdjuntos([]);
        }
    }, [abierto]);

    const tieneContenido = texto.trim().length > 0 || adjuntos.length > 0;

    const handleSubmit = useCallback((e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!tieneContenido) return;
        /* Sin texto + múltiples imágenes → cada una es un recordatorio individual */
        if (!texto.trim() && adjuntos.length > 1) {
            onGuardar('', adjuntos, true);
        } else {
            onGuardar(texto.trim(), adjuntos, false);
        }
        setTexto('');
        setAdjuntos([]);
    }, [texto, adjuntos, tieneContenido, onGuardar]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onCerrar();
    }, [onCerrar]);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onCerrar();
    }, [onCerrar]);

    /* Subir archivos (uno o varios → cada uno es su propio adjunto) */
    const handleArchivoSeleccionado = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            const adjunto = await subirArchivo(file);
            if (adjunto) setAdjuntos(prev => [...prev, adjunto]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [subirArchivo]);

    /* Drag & Drop */
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setArrastrando(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setArrastrando(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setArrastrando(false);

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) return;

        for (const file of files) {
            const adjunto = await subirArchivo(file);
            if (adjunto) setAdjuntos(prev => [...prev, adjunto]);
        }
    }, [subirArchivo]);



    if (!abierto) return null;

    return (
        <div className="creacionRapidaOverlay" onClick={handleOverlayClick}>
            <div
                className={`creacionRapidaContenedor${arrastrando ? ' recordatorioDropActivo' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Zona de drop visual */}
                {arrastrando && (
                    <div className="recordatorioDropIndicador">
                        <ImagePlus size={24} />
                        <div>Suelta las imágenes aquí</div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                        <div className="creacionRapidaInputWrapper">
                            <Input
                                ref={inputRef}
                                tipo="text"
                                value={texto}
                                onChange={e => setTexto(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe un recordatorio..."
                                claseAdicional="creacionRapidaInput"
                                autoFocus
                            />
                            <Boton
                                type="submit"
                                disabled={!tieneContenido || estadoSubida.subiendo}
                                icono={<ArrowRight size={20} />}
                                claseAdicional="creacionRapidaBotonEnviar"
                            />
                        </div>

                        {/* Adjuntos subidos */}
                        {adjuntos.length > 0 && (
                            <div className="recordatorioAdjuntosPreview">
                                {adjuntos.map((adj, i) => (
                                    <div key={adj.id ?? i} className="recordatorioAdjuntoThumb">
                                        <img src={adj.thumbnailUrl || adj.url} alt={adj.nombre} />
                                        <button
                                            type="button"
                                            className="recordatorioAdjuntoEliminar"
                                            onClick={() => setAdjuntos(prev => prev.filter((_, idx) => idx !== i))}
                                        >×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Opciones: subir imagen - mismo patrón que OpcionesCreacionRapida */}
                        <div className="creacionRapidaOpciones">
                            <Boton type="button" variante="opcion" soloIcono activo={adjuntos.length > 0} onClick={() => fileInputRef.current?.click()} icono={estadoSubida.subiendo ? <Loader2 size={14} className="iconoGirando" /> : <ImagePlus size={14} />} title={adjuntos.length > 0 ? `${adjuntos.length} imagen${adjuntos.length !== 1 ? 'es' : ''}` : 'Subir imagen(s)'} disabled={estadoSubida.subiendo} />
                            {estadoSubida.error && (
                                <span className="creacionRapidaInfo recordatorioErrorSubida">
                                    <AlertCircle size={12} /> {estadoSubida.error}
                                </span>
                            )}
                        </div>

                        <input type="file" ref={fileInputRef as React.RefObject<HTMLInputElement>} className="inputOculto" accept="image/*" multiple onChange={handleArchivoSeleccionado} />
                </form>
            </div>
        </div>
    );
}
