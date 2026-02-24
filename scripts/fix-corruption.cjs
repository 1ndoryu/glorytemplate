/*
 * Script para corregir problemas del script sentinel-fix.cjs:
 * 1. Arrow functions rotas: `= />` → `=>`
 * 2. Lineas vacias donde type="..." fue eliminado
 * 3. Restaurar type="number" y type="email" donde aplique
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

/* Archivos con type="number" que necesitan restauracion */
const restaurarTypeNumber = [
    'Mezclador/components/InputTempo.tsx',
    'Mezclador/components/ChannelRack/CanalStrip.tsx',
    'App/React/components/social/ContenidoCrear.tsx',
    'App/React/components/ui/SelectorBPM.tsx',
];

/* Archivos con type="email" que necesitan restauracion */
const restaurarTypeEmail = [
    'App/React/components/social/ModalConfiguracion.tsx',
];

/* Fix 1: Corregir `= />` en todas partes */
function fixBrokenArrows(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'vendor') {
            fixBrokenArrows(fullPath);
        } else if (item.isFile() && (item.name.endsWith('.tsx') || item.name.endsWith('.ts'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            /* Match `= />` que es un arrow roto (debe ser `=>`) */
            if (content.includes('= />')) {
                const count = (content.match(/= \/>/g) || []).length;
                content = content.replace(/= \/>/g, '=>');
                fs.writeFileSync(fullPath, content);
                console.log(`[ARROW FIX] ${path.relative(BASE, fullPath)} — ${count} ocurrencias`);
            }
        }
    }
}

/* Fix 2: Limpiar lineas vacias despues de <CampoTexto */
function fixEmptyTypeLines(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'vendor') {
            fixEmptyTypeLines(fullPath);
        } else if (item.isFile() && (item.name.endsWith('.tsx') || item.name.endsWith('.ts'))) {
            const relPath = path.relative(BASE, fullPath).replace(/\\/g, '/');
            let content = fs.readFileSync(fullPath, 'utf8');
            const orig = content;

            /* Eliminar lineas vacias (solo whitespace) despues de <CampoTexto */
            content = content.replace(/(<CampoTexto[^\n]*\n)(\s*\n)/g, '$1');

            if (content !== orig) {
                fs.writeFileSync(fullPath, content);
                console.log(`[EMPTY LINE FIX] ${relPath}`);
            }
        }
    }
}

/* Fix 3: Restaurar type="number" en CampoTexto donde corresponde */
function restaurarTypes() {
    for (const rel of restaurarTypeNumber) {
        const fp = path.join(BASE, rel);
        if (!fs.existsSync(fp)) { console.log(`[SKIP] No existe: ${rel}`); continue; }
        let content = fs.readFileSync(fp, 'utf8');
        const orig = content;
        /* Agregar type="number" a CampoTexto que no lo tiene y tiene min/max/step */
        content = content.replace(/<CampoTexto\n(\s+)(className=)/g, '<CampoTexto\n$1type="number"\n$1$2');
        if (content !== orig) {
            fs.writeFileSync(fp, content);
            console.log(`[TYPE NUMBER] ${rel}`);
        }
    }

    for (const rel of restaurarTypeEmail) {
        const fp = path.join(BASE, rel);
        if (!fs.existsSync(fp)) { console.log(`[SKIP] No existe: ${rel}`); continue; }
        let content = fs.readFileSync(fp, 'utf8');
        /* Buscar CampoTexto cerca de "email" y agregar type="email" */
        const lines = content.split('\n');
        let changed = false;
        for (let i = 0; i < lines.length; i++) {
            /* Buscar CampoTexto seguido de className que contenga "email" en lineas cercanas */
            if (lines[i].includes('<CampoTexto') && !lines[i].includes('type=') && !lines[i].includes('multilínea')) {
                /* Revisar las siguientes 5 lineas por indicador de email */
                const context = lines.slice(i, i + 8).join(' ');
                if (context.toLowerCase().includes('email')) {
                    /* Insertar type="email" en la siguiente linea */
                    const indent = lines[i + 1]?.match(/^(\s*)/)?.[1] || '                                ';
                    lines.splice(i + 1, 0, `${indent}type="email"`);
                    changed = true;
                    console.log(`[TYPE EMAIL] ${rel}:${i + 1}`);
                }
            }
        }
        if (changed) {
            fs.writeFileSync(fp, lines.join('\n'));
        }
    }
}

console.log('=== Corrigiendo arrows rotas ===');
fixBrokenArrows(BASE);

console.log('\n=== Limpiando lineas vacias ===');
fixEmptyTypeLines(BASE);

console.log('\n=== Restaurando types ===');
restaurarTypes();

console.log('\nHecho.');
