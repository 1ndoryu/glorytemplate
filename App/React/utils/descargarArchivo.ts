/*
 * [183A-73] Utilidad de descarga cross-platform para Kamples.
 * En web: usa el patrón clásico <a download>.
 * En Capacitor (Android/iOS): hace fetch → base64 → Filesystem.writeFile (Cache) → Share.share.
 * No se usa Directory.Downloads porque en Android 11+ requiere WRITE_EXTERNAL_STORAGE.
 * Directory.Cache no requiere ningún permiso y Share permite al usuario guardar/compartir.
 */

import { esCapacitor } from './plataforma';

/**
 * Descarga un archivo dado su URL.
 * - En web: dispara <a href download>.
 * - En nativo (Capacitor): fetch → base64 → writeFile(Cache) → Share.
 */
export async function descargarArchivo(url: string, nombreArchivo: string): Promise<void> {
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
    const { Share } = await import('@capacitor/share');

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

    /* Escribir al cache (no requiere permisos en ninguna versión de Android) */
    const resultado = await Filesystem.writeFile({
        path: nombreArchivo,
        data: base64,
        directory: Directory.Cache,
        recursive: false,
    });

    /* Obtener URI para compartir/guardar */
    const uriInfo = await Filesystem.getUri({
        path: nombreArchivo,
        directory: Directory.Cache,
    });

    /* Invocar el diálogo nativo de share/guardar */
    await Share.share({
        title: nombreArchivo,
        url: uriInfo.uri || resultado.uri,
        dialogTitle: 'Guardar o compartir sample',
    });
}
