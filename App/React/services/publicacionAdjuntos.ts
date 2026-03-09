export const FORMATOS_AUDIO_PUBLICACION = ['.wav', '.mp3', '.flac', '.aiff', '.aif'];
export const MAX_IMAGENES_PUBLICACION = 4;
export const MAX_MB_AUDIO_PUBLICACION = 100;

export interface ArchivoAudioPublicacion {
    archivo: File;
    nombre: string;
    tamano: string;
    formato: string;
}

export interface ImagenPreviewPublicacion {
    archivo: File;
    url: string;
}

export const formatearTamanoArchivo = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const esArchivoAudioPublicacion = (archivo: File): boolean => {
    const extension = '.' + (archivo.name.split('.').pop()?.toLowerCase() ?? '');
    return FORMATOS_AUDIO_PUBLICACION.includes(extension) && archivo.size <= MAX_MB_AUDIO_PUBLICACION * 1024 * 1024;
};

export const crearAudioAdjuntoPublicacion = (archivo: File): ArchivoAudioPublicacion => ({
    archivo,
    nombre: archivo.name,
    tamano: formatearTamanoArchivo(archivo.size ?? 0),
    formato: archivo.name.split('.').pop()?.toUpperCase() ?? '',
});

export const crearImagenesPreviewPublicacion = (archivos: File[], disponibles: number): ImagenPreviewPublicacion[] => {
    return archivos
        .filter((archivo) => archivo.type.startsWith('image/'))
        .slice(0, disponibles)
        .map((archivo) => ({
            archivo,
            url: URL.createObjectURL(archivo),
        }));
};