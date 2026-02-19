/**
 * Utilidades compartidas para normalización y formato de horas.
 */

export const normalizarNumero = (valor: number | string | undefined): number => {
    if (valor === undefined || valor === null) return 0;
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    return Number.isFinite(numero) ? numero : 0;
};

export const formatearHoras = (valor: number | string | undefined): string => {
    const numero = normalizarNumero(valor);
    const redondeado = Math.round(numero * 10) / 10;
    return Number.isInteger(redondeado) ? redondeado.toString() : redondeado.toFixed(1);
};
