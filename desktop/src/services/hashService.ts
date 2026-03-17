/*
 * Servicio: hashService — Cálculo de hash SHA-256 para archivos de audio.
 *
 * Provee hashing de archivos via Web Crypto API (disponible en Tauri WebView).
 * Soporta hash completo y hash parcial (para dedup rápido en uploads).
 *
 * Inspirado en: content-addressed storage de Dropbox (cada archivo identificado por su hash).
 */

const TAMANO_BLOQUE_PARCIAL = 8192;

/**
 * Calcula SHA-256 completo de un archivo.
 * Usa Web Crypto API para eficiencia (implementación nativa del navegador).
 */
export async function calcularHashArchivo(ruta: string): Promise<string> {
    const { readFile } = await import('@tauri-apps/plugin-fs');
    const datos = await readFile(ruta);
    /* QL107: TS 5.9 no acepta Uint8Array<ArrayBufferLike> como BufferSource — crear vista con ArrayBuffer concreto */
    const buffer = await crypto.subtle.digest('SHA-256', new Uint8Array(datos));
    return bufferAHex(buffer);
}

/**
 * Calcula hash parcial: SHA-256 de (primeros 8KB + últimos 8KB + tamaño).
 * Suficiente para detectar duplicados con muy baja probabilidad de colisión.
 * Mucho más rápido que hash completo para archivos grandes.
 */
export async function calcularHashParcial(ruta: string): Promise<string> {
    const { readFile, stat } = await import('@tauri-apps/plugin-fs');
    const info = await stat(ruta);
    const tamano = info.size ?? 0;

    if (tamano <= TAMANO_BLOQUE_PARCIAL * 2) {
        return calcularHashArchivo(ruta);
    }

    const datos = await readFile(ruta);
    const inicio = datos.slice(0, TAMANO_BLOQUE_PARCIAL);
    const fin = datos.slice(datos.length - TAMANO_BLOQUE_PARCIAL);
    const tamanoBytes = new TextEncoder().encode(String(tamano));

    const combinado = new Uint8Array(inicio.length + fin.length + tamanoBytes.length);
    combinado.set(inicio, 0);
    combinado.set(fin, inicio.length);
    combinado.set(tamanoBytes, inicio.length + fin.length);

    const buffer = await crypto.subtle.digest('SHA-256', combinado);
    return bufferAHex(buffer);
}

/**
 * Verifica integridad de un archivo comparando su hash con el esperado.
 * Retorna true si coincide, false si difiere.
 */
export async function verificarIntegridad(ruta: string, hashEsperado: string): Promise<boolean> {
    try {
        const hashReal = await calcularHashArchivo(ruta);
        return hashReal === hashEsperado;
    } catch {
        return false;
    }
}

/**
 * Verifica tamaño de un archivo contra el esperado.
 * Más rápido que hash completo para verificación básica post-descarga.
 */
export async function verificarTamano(ruta: string, tamanoEsperado: number): Promise<boolean> {
    try {
        const { stat } = await import('@tauri-apps/plugin-fs');
        const info = await stat(ruta);
        return (info.size ?? 0) === tamanoEsperado;
    } catch {
        return false;
    }
}

function bufferAHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
