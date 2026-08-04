import {createReadStream} from 'node:fs';
import {access} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';

const wpEnvBin = resolve('node_modules/@wordpress/env/bin/wp-env');
const input = process.argv[2];
if (!input) {
    console.error('Uso: npm run wp:import -- .wp-env/backups/wordpress.sql');
    process.exit(2);
}

const inputPath = resolve(process.cwd(), input);
try {
    await access(inputPath);
} catch {
    console.error(`No existe el dump SQL: ${inputPath}`);
    process.exit(2);
}

console.warn(`Importando ${inputPath} en wp-env. Esta operación reemplaza los datos actuales.`);
const child = spawn(process.execPath, [wpEnvBin, 'run', 'cli', 'wp', 'db', 'import', '-'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: false,
});

createReadStream(inputPath).pipe(child.stdin);
const exitCode = await new Promise(resolveExit => child.once('exit', code => resolveExit(code ?? 1)));
process.exitCode = exitCode;
