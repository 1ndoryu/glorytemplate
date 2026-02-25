/*
 * Utilidad: tiempo.ts — Kamples
 * Formateadores de fechas relativas reutilizables.
 * Centraliza la logica duplicada entre ComunidadIsland, TarjetaPublicacion y otras vistas.
 */

/**
 * Devuelve una cadena de tiempo relativo legible desde una fecha ISO.
 * Ej: "3m", "5h", "2d", "1sem", "12 ene"
 */
export const formatearTiempoRelativo = (fecha: string): string => {
    if (!fecha) return '';
    const timestamp = new Date(fecha).getTime();
    if (isNaN(timestamp)) return '';
    const diff = Date.now() - timestamp;
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    const dias = Math.floor(horas / 24);
    if (dias < 7) return `${dias}d`;
    const semanas = Math.floor(dias / 7);
    if (semanas < 4) return `${semanas}sem`;
    return new Date(fecha).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};
