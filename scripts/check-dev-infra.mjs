import {readFile} from 'node:fs/promises';

const failures = [];

try {
    const config = JSON.parse(await readFile('.wp-env.json', 'utf8'));
    for (const key of ['core', 'phpVersion', 'port', 'themes', 'config']) {
        if (!(key in config)) failures.push(`.wp-env.json no define ${key}`);
    }
    if (!Array.isArray(config.themes) || !config.themes.includes('.')) {
        failures.push('.wp-env.json debe montar el tema actual en themes');
    }
    if (!config.core || !/^WordPress\/WordPress#\d+\.\d+(\.\d+)?$/.test(config.core)) {
        failures.push('.wp-env.json debe fijar una versión portable de WordPress');
    }
} catch (error) {
    failures.push(`.wp-env.json inválido: ${error.message}`);
}

try {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
    for (const script of ['dev', 'dev:vite', 'dev:wp', 'wp:start', 'wp:stop', 'wp:export', 'wp:import', 'wp:replace-url']) {
        if (!packageJson.scripts?.[script]) failures.push(`package.json no define npm run ${script}`);
    }
    if (packageJson.devDependencies?.['@wordpress/env'] !== '11.12.0') {
        failures.push('@wordpress/env debe permanecer fijado en 11.12.0');
    }
} catch (error) {
    failures.push(`package.json inválido: ${error.message}`);
}

if (failures.length) {
    console.error(failures.map(failure => `- ${failure}`).join('\n'));
    process.exit(1);
}

console.log('Infraestructura wp-env válida.');
