import {mkdir, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join, resolve} from 'node:path';

const wpEnvBin = resolve('node_modules/@wordpress/env/bin/wp-env');
const backupDirectory = join(process.cwd(), '.wp-env', 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = join(backupDirectory, `wordpress-${stamp}.sql`);

await mkdir(backupDirectory, {recursive: true});

const child = spawn(process.execPath, [wpEnvBin, 'run', 'cli', 'wp', 'db', 'export', '-', '--quiet'], {
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: false,
});

const chunks = [];
for await (const chunk of child.stdout) {
    chunks.push(chunk);
}

const exitCode = await new Promise(resolveExit => child.once('exit', code => resolveExit(code ?? 1)));
if (exitCode !== 0) {
    process.exitCode = exitCode;
} else {
    await writeFile(outputPath, Buffer.concat(chunks));
    console.log(`Base de datos exportada a ${outputPath}`);
}
