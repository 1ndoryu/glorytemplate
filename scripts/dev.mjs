import {spawn} from 'node:child_process';
import process from 'node:process';
import {resolve} from 'node:path';

const WORDPRESS_URL = process.env.WP_ENV_URL || `http://localhost:${process.env.WP_ENV_PORT || '8888'}`;
const WORDPRESS_READY_URL = `${WORDPRESS_URL.replace(/\/$/, '')}/wp-json/`;
const VITE_URL = process.env.GLORY_VITE_DEV_SERVER_PUBLIC_URL || 'http://localhost:5174';
const WP_ENV_BIN = resolve('node_modules/@wordpress/env/bin/wp-env');
const VITE_BIN = resolve('Glory/assets/react/node_modules/vite/bin/vite.js');
const WP_ENV_EXECUTION_ENV = {...process.env};
const MAX_WAIT_MS = Number(process.env.WP_ENV_READY_TIMEOUT_MS || 120_000);
const POLL_MS = 1_000;

let viteProcess;
let stopping = false;

function log(message) {
    console.log(`[dev] ${message}`);
}

function fail(message, error) {
    console.error(`[dev] ERROR: ${message}`);
    if (error) {
        console.error(error instanceof Error ? error.message : error);
    }
    process.exitCode = 1;
}

function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: false,
            ...options,
        });

        child.once('error', reject);
        child.once('exit', (code, signal) => {
            resolve({code: code ?? 1, signal});
        });
    });
}

async function waitForWordPress() {
    const deadline = Date.now() + MAX_WAIT_MS;
    let lastError = '';

    while (Date.now() < deadline) {
        try {
            const response = await fetch(WORDPRESS_READY_URL);
            if (response.ok) {
                return;
            }
            lastError = `HTTP ${response.status}`;
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }

        await new Promise(resolve => setTimeout(resolve, POLL_MS));
    }

    throw new Error(`WordPress no respondió en ${WORDPRESS_READY_URL} (${lastError || 'timeout'})`);
}

async function stopVite() {
    if (!viteProcess || viteProcess.exitCode !== null) {
        return;
    }

    if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(viteProcess.pid), '/t', '/f'], {stdio: 'ignore'});
    } else {
        viteProcess.kill('SIGINT');
    }
    await new Promise(resolve => viteProcess.once('exit', resolve));
}

async function shutdown(code = 0) {
    if (stopping) {
        return;
    }
    stopping = true;
    await stopVite();
    process.exitCode = code;
}

async function main() {
    const uploadsDirectory = resolve('.wp-env/uploads');
    await import('node:fs/promises').then(({mkdir}) => mkdir(uploadsDirectory, {recursive: true}));

    log('Iniciando WordPress con wp-env...');
    const wpResult = await run(process.execPath, [resolve('scripts/wp-start.mjs')], {env: WP_ENV_EXECUTION_ENV});
    if (wpResult.code !== 0) {
        throw new Error(`wp-env start terminó con código ${wpResult.code}`);
    }

    log('Activando el tema del checkout...');
    const activateResult = await run(process.execPath, [WP_ENV_BIN, 'run', 'cli', 'wp', 'theme', 'activate', 'glorytemplate'], {env: WP_ENV_EXECUTION_ENV});
    if (activateResult.code !== 0) {
        throw new Error(`La activación del tema terminó con código ${activateResult.code}`);
    }

    log(`Esperando WordPress en ${WORDPRESS_URL}...`);
    await waitForWordPress();
    log(`WordPress disponible: ${WORDPRESS_URL}`);

    log(`Iniciando Vite en ${VITE_URL}...`);
    viteProcess = spawn(process.execPath, [VITE_BIN], {
        stdio: 'inherit',
        shell: false,
        cwd: resolve('Glory/assets/react'),
        env: {...process.env},
    });

    viteProcess.once('exit', async code => {
        if (!stopping) {
            await shutdown(code ?? 0);
        }
    });

    log('Entorno listo. Pulsa Ctrl+C para detener Vite (los contenedores permanecen disponibles).');
}

process.once('SIGINT', () => void shutdown(0));
process.once('SIGTERM', () => void shutdown(0));

main().catch(error => {
    fail('No se pudo iniciar el entorno de desarrollo.', error);
    void shutdown(1);
});
