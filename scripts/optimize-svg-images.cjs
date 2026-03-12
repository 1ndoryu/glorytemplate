/*
 * Script para optimizar imágenes base64 embebidas en SVGs.
 * Extrae cada <image> con data URI, recomprime con sharp,
 * y reemplaza el base64 en el SVG original.
 *
 * Uso: node scripts/optimize-svg-images.cjs
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVG_DIR = path.join(__dirname, '..', 'App', 'Assets', 'svg');
const SVG_FILES = ['Kamples.svg', 'Sync.svg', 'MiniDaw.svg', 'Rolas.svg'];

/* Calidad objetivo para recompresion */
const JPEG_QUALITY = 68;
const WEBP_QUALITY = 72;

/* Regex para encontrar data URIs dentro de atributos href o xlink:href */
const DATA_URI_RE = /(xlink:href|href)="data:image\/(jpeg|png);base64,([^"]+)"/g;

async function optimizarImagen(base64, tipoOriginal) {
    const buffer = Buffer.from(base64, 'base64');
    const metadata = await sharp(buffer).metadata();

    let procesado;
    if (tipoOriginal === 'jpeg') {
        procesado = await sharp(buffer)
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer();
    } else {
        /* PNG: si no tiene alpha, convertir a JPEG. Si tiene alpha, usar WebP */
        if (metadata.channels === 4 && metadata.hasAlpha) {
            procesado = await sharp(buffer)
                .webp({ quality: WEBP_QUALITY })
                .toBuffer();
            return {
                base64: procesado.toString('base64'),
                tipo: 'webp',
                original: buffer.length,
                final: procesado.length,
            };
        }
        procesado = await sharp(buffer)
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer();
        return {
            base64: procesado.toString('base64'),
            tipo: 'jpeg',
            original: buffer.length,
            final: procesado.length,
        };
    }

    return {
        base64: procesado.toString('base64'),
        tipo: tipoOriginal,
        original: buffer.length,
        final: procesado.length,
    };
}

async function procesarSvg(archivo) {
    const ruta = path.join(SVG_DIR, archivo);
    let contenido = fs.readFileSync(ruta, 'utf8');
    const tamanoOriginal = Buffer.byteLength(contenido, 'utf8');

    const coincidencias = [];
    let match;
    while ((match = DATA_URI_RE.exec(contenido)) !== null) {
        coincidencias.push({
            fullMatch: match[0],
            atributo: match[1],
            tipo: match[2],
            base64: match[3],
            index: match.index,
        });
    }

    console.log(`\n${archivo}: ${coincidencias.length} imagenes, ${(tamanoOriginal / 1024 / 1024).toFixed(1)} MB`);

    let totalOriginal = 0;
    let totalFinal = 0;

    for (let i = 0; i < coincidencias.length; i++) {
        const c = coincidencias[i];
        try {
            const result = await optimizarImagen(c.base64, c.tipo);
            totalOriginal += result.original;
            totalFinal += result.final;

            const nuevoDataUri = `${c.atributo}="data:image/${result.tipo};base64,${result.base64}"`;
            contenido = contenido.replace(c.fullMatch, nuevoDataUri);

            const reduccion = ((1 - result.final / result.original) * 100).toFixed(0);
            console.log(`  [${i + 1}/${coincidencias.length}] ${c.tipo} -> ${result.tipo}: ${(result.original / 1024).toFixed(0)}KB -> ${(result.final / 1024).toFixed(0)}KB (-${reduccion}%)`);
        } catch (err) {
            console.error(`  [${i + 1}] ERROR: ${err.message}`);
        }
    }

    fs.writeFileSync(ruta, contenido, 'utf8');
    const tamanoFinal = Buffer.byteLength(contenido, 'utf8');

    console.log(`  Imagenes: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB -> ${(totalFinal / 1024 / 1024).toFixed(1)}MB`);
    console.log(`  SVG total: ${(tamanoOriginal / 1024 / 1024).toFixed(1)}MB -> ${(tamanoFinal / 1024 / 1024).toFixed(1)}MB (-${((1 - tamanoFinal / tamanoOriginal) * 100).toFixed(0)}%)`);
}

async function main() {
    console.log('Optimizando imagenes embebidas en SVGs...');
    for (const archivo of SVG_FILES) {
        await procesarSvg(archivo);
    }
    console.log('\nOptimizacion completada.');
}

main().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
