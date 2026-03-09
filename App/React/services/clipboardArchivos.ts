const MAPA_EXTENSIONES_POR_MIME: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/flac': 'flac',
    'audio/x-aiff': 'aiff',
    'audio/aiff': 'aiff',
};

const normalizarArchivoClipboard = (archivo: File, indice: number): File => {
    if (archivo.name && archivo.name.trim() !== '') {
        return archivo;
    }

    const extension = MAPA_EXTENSIONES_POR_MIME[archivo.type] ?? 'bin';
    const prefijo = archivo.type.startsWith('audio/') ? 'audio-pegado' : 'imagen-pegada';
    return new File([archivo], `${prefijo}-${Date.now()}-${indice}.${extension}`, {
        type: archivo.type,
        lastModified: Date.now(),
    });
};

export const extraerArchivosClipboard = (clipboardData: DataTransfer | null): File[] => {
    if (!clipboardData) {
        return [];
    }

    const archivosDesdeItems = Array.from(clipboardData.items ?? [])
        .filter((item) => item.kind === 'file')
        .map((item, indice) => item.getAsFile() ? normalizarArchivoClipboard(item.getAsFile() as File, indice) : null)
        .filter((archivo): archivo is File => archivo instanceof File);

    if (archivosDesdeItems.length > 0) {
        return archivosDesdeItems;
    }

    return Array.from(clipboardData.files ?? []).map(normalizarArchivoClipboard);
};