import {mkdir} from 'node:fs/promises';
import {spawn, spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const dockerCheck = spawnSync('docker', ['info'], {
    stdio: 'ignore',
    shell: process.platform === 'win32',
});

if (dockerCheck.status !== 0) {
    console.error('Docker Desktop no está iniciado. Ábrelo y vuelve a ejecutar npm run dev.');
    process.exit(1);
}

await mkdir(resolve('.wp-env/uploads'), {recursive: true});
await mkdir(resolve('.wp-env/backups'), {recursive: true});

const wpEnvBin = resolve('node_modules/@wordpress/env/bin/wp-env');
const child = spawn(process.execPath, [wpEnvBin, 'start', ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: false,
});

const exitCode = await new Promise(resolveExit => child.once('exit', code => resolveExit(code ?? 1)));
process.exitCode = exitCode;
