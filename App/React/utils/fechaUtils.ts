/*
 * Utilidades de formateo de fechas.
 * Centraliza la lógica de transformación de fechas ISO a formatos legibles.
 * Todos los formatos usan locale español (es-ES).
 */

export type FormatoFecha = 'corto' | 'medio' | 'largo' | 'completo';

/* Opciones de formato predefinidas */
const OPCIONES_FORMATO: Record<FormatoFecha, Intl.DateTimeFormatOptions> = {
    /* Formato corto: "23 ene 2026" */
    corto: {day: '2-digit', month: 'short', year: 'numeric'},
    /* Formato medio: "23 ene 2026" (igual a corto, por compatibilidad) */
    medio: {day: '2-digit', month: 'short', year: 'numeric'},
    /* Formato largo: "23 de enero de 2026" */
    largo: {day: '2-digit', month: 'long', year: 'numeric'},
    /* Formato completo: "viernes, 23 de enero de 2026" */
    completo: {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'}
};

/*
 * Formatea una fecha ISO a un formato legible en español.
 * @param fechaIso - Fecha en formato ISO (ej: "2026-01-23")
 * @param formato - Tipo de formato deseado (por defecto "corto")
 * @returns Fecha formateada (ej: "23 ene 2026")
 */
export const formatearFecha = (fechaIso: string, formato: FormatoFecha = 'corto'): string => {
    if (!fechaIso) return '';

    try {
        const fecha = new Date(fechaIso);

        /* Verifica que la fecha sea válida */
        if (isNaN(fecha.getTime())) {
            console.warn(`fechaUtils: Fecha inválida recibida: ${fechaIso}`);
            return fechaIso;
        }

        return fecha.toLocaleDateString('es-ES', OPCIONES_FORMATO[formato]);
    } catch (error) {
        console.error('fechaUtils: Error al formatear fecha:', error);
        return fechaIso;
    }
};

/*
 * Calcula los días entre hoy y una fecha futura.
 * @param fechaIso - Fecha en formato ISO
 * @returns Número de días restantes (negativo si ya pasó)
 */
export const diasHastaFecha = (fechaIso: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); /* Normalizar a medianoche */

    const objetivo = new Date(fechaIso);
    objetivo.setHours(0, 0, 0, 0);

    return Math.ceil((objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

/*
 * Verifica si una fecha está próxima (dentro de X días).
 * @param fechaIso - Fecha en formato ISO
 * @param diasUmbral - Número de días para considerar "próximo" (default 30)
 * @returns true si la fecha está dentro del umbral
 */
export const fechaProxima = (fechaIso: string, diasUmbral = 30): boolean => {
    const dias = diasHastaFecha(fechaIso);
    return dias > 0 && dias <= diasUmbral;
};

/*
 * Verifica si una fecha ya pasó.
 * @param fechaIso - Fecha en formato ISO
 * @returns true si la fecha es anterior a hoy
 */
export const fechaPasada = (fechaIso: string): boolean => {
    return diasHastaFecha(fechaIso) < 0;
};

/*
 * Formatea días restantes a texto legible.
 * @param fechaIso - Fecha en formato ISO
 * @returns Texto como "en 5 días", "mañana", "hoy", "hace 3 días"
 */
export const diasRestantesTexto = (fechaIso: string): string => {
    const dias = diasHastaFecha(fechaIso);

    if (dias === 0) return 'hoy';
    if (dias === 1) return 'mañana';
    if (dias === -1) return 'ayer';
    if (dias > 1) return `en ${dias} días`;
    return `hace ${Math.abs(dias)} días`;
};
