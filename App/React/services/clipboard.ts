/*
 * clipboard.ts — Kamples (C176)
 * Utilidad centralizada para copiar texto al portapapeles.
 * Incluye fallback para contextos no seguros (http://).
 */

import { toast } from '@app/stores/toastStore';

/* Fallback para navegadores sin Clipboard API o sin contexto seguro */
function copiarConFallback(texto: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let exito = false;
    try {
        exito = document.execCommand('copy');
    } catch {
        exito = false;
    }
    document.body.removeChild(textarea);
    return exito;
}

/*
 * Copia texto al portapapeles y muestra un toast.
 * Intenta Clipboard API primero, luego execCommand('copy').
 */
export async function copiarAlPortapapeles(texto: string, mensajeExito = 'Enlace copiado'): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            toast.exito(mensajeExito);
            return true;
        }
        /* Fallback para http:// o navegadores viejos */
        const ok = copiarConFallback(texto);
        if (ok) toast.exito(mensajeExito);
        else toast.error('No se pudo copiar el enlace');
        return ok;
    } catch {
        /* Clipboard API falló, intentar fallback */
        const ok = copiarConFallback(texto);
        if (ok) toast.exito(mensajeExito);
        else toast.error('No se pudo copiar el enlace');
        return ok;
    }
}
