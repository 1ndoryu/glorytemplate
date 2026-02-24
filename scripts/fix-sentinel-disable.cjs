/*
 * Agrega sentinel-disable-next-line a inputs nativos
 * que no tienen componente equivalente (file, checkbox, range).
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
let totalFixed = 0;

function addSentinelDisable(relPath) {
    const fp = path.join(BASE, relPath);
    if (!fs.existsSync(fp)) {
        console.log(`[SKIP] No existe: ${relPath}`);
        return;
    }
    let content = fs.readFileSync(fp, 'utf8');
    const orig = content;
    const lines = content.split('\n');
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimStart();

        /* Detectar <input nativo sin sentinel-disable previo */
        if (line.startsWith('<input') && !line.includes('CampoTexto')) {
            /* Verificar que la linea anterior no tenga sentinel-disable */
            const prevLine = i > 0 ? lines[i - 1].trim() : '';
            if (!prevLine.includes('sentinel-disable')) {
                /* Determinar tipo de input */
                const context = lines.slice(i, Math.min(i + 5, lines.length)).join(' ');
                let tipo = 'generico';
                if (context.includes('type="file"') || context.includes("type='file'")) tipo = 'file';
                else if (context.includes('type="checkbox"') || context.includes("type='checkbox'")) tipo = 'checkbox';
                else if (context.includes('type="range"') || context.includes("type='range'")) tipo = 'range';
                else if (context.includes('type="hidden"') || context.includes("type='hidden'")) tipo = 'hidden';
                else if (context.includes('type="color"') || context.includes("type='color'")) tipo = 'color';
                else if (context.includes('type="radio"') || context.includes("type='radio'")) tipo = 'radio';
                else continue; /* text/number/email ya deberian ser CampoTexto */

                const indent = lines[i].match(/^(\s*)/)[1];
                const comment = `${indent}{/* sentinel-disable-next-line html-nativo: input type="${tipo}" sin equivalente UI */}`;
                lines.splice(i, 0, comment);
                i++; /* Saltar la linea insertada */
                changed = true;
            }
        }
    }

    if (changed) {
        fs.writeFileSync(fp, lines.join('\n'));
        totalFixed++;
        console.log(`[SENTINEL] ${relPath}`);
    }
}

/* Archivos con input type="file" */
const inputFileFiles = [
    'Mezclador/components/MezcladorPanel.tsx',
    'App/React/islands/social/EditarPerfilIsland.tsx',
    'App/React/islands/mensajes/ChatIsland.tsx',
    'App/React/components/social/ChatFlotante.tsx',
    'App/React/components/social/ContenidoCrear.tsx',
    'App/React/components/social/ListaComentarios.tsx',
    'App/React/components/social/ModalConfiguracion.tsx',
    'App/React/components/social/ModalPublicar.tsx',
];

/* Archivos con input type="checkbox" */
const inputCheckboxFiles = [
    'App/React/components/social/ModalEditar.tsx',
    'App/React/components/social/ModalColeccion.tsx',
];

/* Archivos con input type="range" */
const inputRangeFiles = [
    'App/React/islands/player/ReproductorIsland.tsx',
];

console.log('=== Agregando sentinel-disable para inputs nativos ===');
[...inputFileFiles, ...inputCheckboxFiles, ...inputRangeFiles].forEach(addSentinelDisable);
console.log(`\nTotal archivos actualizados: ${totalFixed}`);
