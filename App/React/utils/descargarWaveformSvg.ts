/*
 * [183A-94] Genera SVG blanco de la waveform de un sample y dispara descarga.
 * Replica la lógica de dibujo de useWaveformPlayer (barras simétricas).
 */

const SVG_WIDTH = 800;
const SVG_HEIGHT = 120;
const ANCHO_BARRA = 2;
const ESPACIO_BARRA = 1;

function remuestrear(datos: number[], barrasDeseadas: number): number[] {
    if (datos.length <= barrasDeseadas) return datos;
    const tamGrupo = datos.length / barrasDeseadas;
    const resultado: number[] = [];
    for (let i = 0; i < barrasDeseadas; i++) {
        const inicio = Math.floor(i * tamGrupo);
        const fin = Math.floor((i + 1) * tamGrupo);
        let max = 0;
        for (let j = inicio; j < fin && j < datos.length; j++) {
            if (datos[j] > max) max = datos[j];
        }
        resultado.push(max);
    }
    return resultado;
}

function normalizar(datos: number[]): number[] {
    const maximo = Math.max(...datos);
    if (maximo <= 0) return datos.map(() => 0.03);
    if (maximo > 1) return datos.map(p => Math.max(0.03, p / maximo));
    return datos;
}

export async function descargarWaveformSvg(
    rutaWaveform: string,
    nombreArchivo: string
): Promise<boolean> {
    const resp = await fetch(rutaWaveform);
    if (!resp.ok) return false;

    const json = await resp.json();
    const picosRaw: number[] | null = Array.isArray(json)
        ? json
        : (json.peaks ?? json.picos ?? json.data ?? null);

    if (!picosRaw || picosRaw.length === 0) return false;

    const paso = ANCHO_BARRA + ESPACIO_BARRA;
    const barrasDeseadas = Math.floor(SVG_WIDTH / paso);
    const datos = normalizar(remuestrear(picosRaw, barrasDeseadas));
    const mitad = SVG_HEIGHT / 2;

    let rects = '';
    for (let i = 0; i < datos.length; i++) {
        const alto = datos[i] * mitad * 0.9;
        const x = i * paso;
        const y = mitad - alto;
        rects += `<rect x="${x}" y="${y}" width="${ANCHO_BARRA}" height="${alto * 2}" fill="white" rx="1"/>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">${rects}</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}_waveform.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
}
