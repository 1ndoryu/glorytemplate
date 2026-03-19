/*
 * [183A-73][183A-92] Utilidad de descarga cross-platform para Kamples.
 * En web: usa el patrón clásico <a download>.
 * En Capacitor (Android/iOS): fetch → base64 → Filesystem.writeFile(Documents).
 * Directory.Documents no requiere permisos y es accesible desde el gestor de archivos.
 * Ya no usa Share.share() — el usuario quiere "guardar", no "compartir".
 */

import { esCapacitor } from './plataforma';

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

    /* Fetch del archivo */
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
        throw new Error(`Error al descargar archivo: ${respuesta.status}`);
    }

    const buffer = await respuesta.arrayBuffer();

    /* Convertir ArrayBuffer a base64 */
    const bytes = new Uint8Array(buffer);
    let binario = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binario += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binario);

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
