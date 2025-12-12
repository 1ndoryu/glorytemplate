/**
 * ImageUploader - Componente para subir y previsualizar imagenes
 *
 * Permite:
 * - Arrastrar y soltar imagenes
 * - Seleccionar desde el explorador
 * - Vista previa de la imagen
 * - Eliminar imagen
 */

import {useState, useCallback, useRef} from 'react';
import {Upload, X, Image as ImageIcon, Loader2} from 'lucide-react';

interface ImageUploaderProps {
    id: string;
    label: string;
    value: string;
    onChange: (url: string) => void;
    onUpload: (file: File) => Promise<string>;
    description?: string;
    aspectRatio?: string;
}

export function ImageUploader({id, label, value, onChange, onUpload, description, aspectRatio = '1/1'}: ImageUploaderProps): JSX.Element {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            // Validar tipo
            if (!file.type.startsWith('image/')) {
                setError('Solo se permiten imagenes');
                return;
            }

            // Validar tamano (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('La imagen no puede superar 5MB');
                return;
            }

            setError(null);
            setIsUploading(true);

            try {
                const url = await onUpload(file);
                onChange(url);
            } catch (err) {
                setError('Error al subir la imagen');
            } finally {
                setIsUploading(false);
            }
        },
        [onUpload, onChange]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);

            const file = e.dataTransfer.files[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                handleFile(file);
            }
        },
        [handleFile]
    );

    const handleRemove = useCallback(() => {
        onChange('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, [onChange]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    return (
        <div className="image-uploader" id={`image-uploader-${id}`}>
            <label className="image-uploader-label">{label}</label>

            <div className={`image-uploader-dropzone ${isDragOver ? 'image-uploader-dropzone--dragover' : ''} ${value ? 'image-uploader-dropzone--has-image' : ''}`} style={{'--aspect-ratio': aspectRatio} as React.CSSProperties} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={!value ? handleClick : undefined}>
                {isUploading ? (
                    <div className="image-uploader-loading">
                        <Loader2 className="image-uploader-spinner" />
                        <span>Subiendo...</span>
                    </div>
                ) : value ? (
                    <>
                        <img src={value} alt="Preview" className="image-uploader-preview" />
                        <button
                            type="button"
                            className="image-uploader-remove"
                            onClick={e => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            title="Eliminar imagen">
                            <X className="image-uploader-remove-icon" />
                        </button>
                    </>
                ) : (
                    <div className="image-uploader-placeholder">
                        {isDragOver ? (
                            <>
                                <Upload className="image-uploader-icon image-uploader-icon--active" />
                                <span>Suelta la imagen aqui</span>
                            </>
                        ) : (
                            <>
                                <ImageIcon className="image-uploader-icon" />
                                <span>Arrastra una imagen o haz clic para seleccionar</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} className="image-uploader-input" />

            {description && !error && <p className="image-uploader-description">{description}</p>}

            {error && <p className="image-uploader-error">{error}</p>}
        </div>
    );
}
