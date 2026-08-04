import {spawn} from 'node:child_process';
import {resolve} from 'node:path';

const [from = 'http://glory.local', to = process.env.WP_ENV_URL || 'http://localhost:8888', mode = '--dry-run'] = process.argv.slice(2);
const wpEnvBin = resolve('node_modules/@wordpress/env/bin/wp-env');
const allowedModes = new Set(['--dry-run', '--apply']);

if (!allowedModes.has(mode)) {
    console.error('Modo inválido. Usa --dry-run o --apply.');
    process.exit(2);
}

const args = [
    wpEnvBin, 'run', 'cli', 'wp', 'search-replace', from, to,
    '--all-tables-with-prefix', '--precise', '--skip-columns=guid',
];
if (mode === '--dry-run') args.push('--dry-run');

console.warn(`${mode === '--dry-run' ? 'Previsualizando' : 'Aplicando'} reemplazo serializado: ${from} -> ${to}`);
const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    shell: false,
});

const exitCode = await new Promise(resolveExit => child.once('exit', code => resolveExit(code ?? 1)));
process.exitCode = exitCode;
