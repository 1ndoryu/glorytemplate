/*
 * Componente: DropZone
 * Área de drag&drop para subida de archivos de audio.
 */

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import '../../styles/componentes/dropZone.css';
import { Input } from './Input';

interface DropZoneProps {
    onArchivos: (archivos: File[]) => void;
    formatosAceptados?: string[];
    multiple?: boolean;
    tamanoMaximoMB?: number;
    className?: string;
}

const FORMATOS_AUDIO_DEFECTO = ['.wav', '.mp3', '.flac', '.aiff', '.aif'];

export const DropZone = ({
    onArchivos,
    formatosAceptados = FORMATOS_AUDIO_DEFECTO,
    multiple = true,
    tamanoMaximoMB = 100,
    className = '',
}: DropZoneProps): JSX.Element => {
    const [arrastrando, setArrastrando] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const contadorDrag = useRef(0);

    const validarArchivos = useCallback(
        (archivos: FileList | File[]): File[] => {
            const lista = Array.from(archivos);
            return lista.filter((archivo) => {
                const extension = '.' + archivo.name.split('.').pop()?.toLowerCase();
                const formatoValido = formatosAceptados.includes(extension);
                const tamanoValido = archivo.size <= tamanoMaximoMB * 1024 * 1024;
                return formatoValido && tamanoValido;
            });
        },
        [formatosAceptados, tamanoMaximoMB]
    );

    const manejarDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            contadorDrag.current = 0;
            setArrastrando(false);

            const archivosValidos = validarArchivos(e.dataTransfer.files);
            if (archivosValidos.length > 0) {
                onArchivos(archivosValidos);
            }
        },
        [onArchivos, validarArchivos]
    );

    const manejarDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        contadorDrag.current++;
        setArrastrando(true);
    };

    const manejarDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        contadorDrag.current--;
        if (contadorDrag.current === 0) {
            setArrastrando(false);
        }
    };

    const manejarDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const manejarClick = () => {
        inputRef.current?.click();
    };

    const manejarCambioInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const archivosValidos = validarArchivos(e.target.files);
            if (archivosValidos.length > 0) {
                onArchivos(archivosValidos);
            }
        }
        /* Reset para permitir reseleccionar el mismo archivo */
        e.target.value = '';
    };

    const clases = [
        'contenedorDropZone',
        arrastrando ? 'dropZoneActiva' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            className={clases}
            onDrop={manejarDrop}
            onDragEnter={manejarDragEnter}
            onDragLeave={manejarDragLeave}
            onDragOver={manejarDragOver}
            onClick={manejarClick}
            role="button"
            tabIndex={0}
        >
            <Upload size={40} className="dropZoneIcono" />
            <p className="dropZoneTexto">
                Arrastra archivos aquí o <strong>haz clic para seleccionar</strong>
            </p>
            <p className="dropZoneFormatos">
                Formatos: {formatosAceptados.join(', ')} — Máximo {tamanoMaximoMB}MB
            </p>
            <Input
                ref={inputRef}
                type="file"
                className="dropZoneInput"
                accept={formatosAceptados.join(',')}
                multiple={multiple}
                onChange={manejarCambioInput}
            />
        </div>
    );
};

export default DropZone;
