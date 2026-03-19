/*
 * [183A-73][183A-92][183A-95] Utilidad de descarga cross-platform para Kamples.
 * En web: usa el patrón clásico <a download>.
 * En Capacitor (Android/iOS): fetch → base64 chunked → Filesystem.writeFile(Documents).
 * Directory.Documents no requiere permisos y es accesible desde el gestor de archivos.
 */

import { esCapacitor } from './plataforma';

/* [183A-95] Convierte ArrayBuffer a base64 en chunks para evitar
 * stack overflow en btoa() con archivos grandes (WAV 5-20MB).
 * String.fromCharCode.apply con slices de 8KB es seguro en WebViews Android. */
function arrayBufferABase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const tamanoChunk = 8192;
    let binario = '';
    for (let i = 0; i < bytes.length; i += tamanoChunk) {
        const chunk = bytes.subarray(i, Math.min(i + tamanoChunk, bytes.length));
        binario += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binario);
}

/**
 * Descarga un archivo dado su URL.
 * - En web: dispara <a href download>.
 * - En nativo (Capacitor): fetch → base64 → writeFile(Documents).
 * Retorna la URI del archivo guardado (nativo) o void (web).
 */
export async function descargarArchivo(url: string, nombreArchivo: string): Promise<string | void> {
    if (!esCapacitor()) {
        /* Descarga web estándar */
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
    }

    /* Descarga nativa en Capacitor (Android / iOS) */
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    /* Fetch del archivo — usar XMLHttpRequest con blob para evitar que el
     * WebView Android intercepte Content-Disposition: attachment */
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response as ArrayBuffer);
            } else {
                reject(new Error(`Error al descargar archivo: ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('Error de red al descargar'));
        xhr.send();
    });

    const base64 = arrayBufferABase64(buffer);

    /* [183A-92] Guardar en Documents (accesible vía gestor de archivos, sin permisos).
     * Subcarpeta Kamples/ para organización. */
    await Filesystem.mkdir({
        path: 'Kamples',
        directory: Directory.Documents,
        recursive: true,
    }).catch(() => { /* ya existe — ignorar */ });

    const resultado = await Filesystem.writeFile({
        path: `Kamples/${nombreArchivo}`,
        data: base64,
        directory: Directory.Documents,
        recursive: false,
    });

    return resultado.uri;
}
