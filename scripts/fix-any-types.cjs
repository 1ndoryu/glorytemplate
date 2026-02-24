/*
 * Reemplaza (window as any).__PROP__ con window.__PROP__
 * y elimina los eslint-disable/enable @typescript-eslint/no-explicit-any.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
let totalFixed = 0;

function fixWindowAny(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules' && item.name !== 'target') {
            fixWindowAny(fullPath);
        } else if (item.isFile() && (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) && !item.name.endsWith('.d.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const orig = content;

            /* Reemplazar (window as any).__PROP__ con window.__PROP__ */
            content = content.replace(/\(window as any\)/g, 'window');

            /* Eliminar lineas eslint-disable/enable @typescript-eslint/no-explicit-any */
            content = content.replace(/\s*\/\* eslint-disable @typescript\/eslint\/no-explicit-any \*\/\s*\n/g, '');
            content = content.replace(/\s*\/\* eslint-enable @typescript\/eslint\/no-explicit-any \*\/\s*\n/g, '');
            /* Con guion correcto */
            content = content.replace(/\s*\/\* eslint-disable @typescript-eslint\/no-explicit-any \*\/\s*\n/g, '');
            content = content.replace(/\s*\/\* eslint-enable @typescript-eslint\/no-explicit-any \*\/\s*\n/g, '');

            if (content !== orig) {
                fs.writeFileSync(fullPath, content);
                const relPath = path.relative(BASE, fullPath).replace(/\\/g, '/');
                totalFixed++;
                console.log(`[ANY FIX] ${relPath}`);
            }
        }
    }
}

const desktopDir = path.join(BASE, 'desktop', 'src');
console.log('=== Eliminando (window as any) en desktop/ ===');
fixWindowAny(desktopDir);
console.log(`Total: ${totalFixed} archivos`);
