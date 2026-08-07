#!/usr/bin/env node
// Setup del gate: inicializa submódulos en los commits fijados, asegura el dist
// de varsense y regenera sentinel.lock.json. Idempotente.
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, readJson, run, git, submoduleHead, printOk, printFail, printWarn } from './common.mjs';

const tools = readJson('quality-tools.json');
if (!tools?.tools) {
  printFail('quality-tools.json inválido');
  process.exit(1);
}

// 1. Submódulos en el commit fijado.
for (const [name, tool] of Object.entries(tools.tools)) {
  if (!tool.sourcePath) continue;
  const abs = path.resolve(ROOT, tool.sourcePath);
  run('git', ['submodule', 'update', '--init', tool.sourcePath], { capture: false });
  const head = submoduleHead(tool.sourcePath);
  if (!head) {
    printFail(`${name}: submódulo ${tool.sourcePath} no disponible`);
    process.exit(1);
  }
  if (head !== tool.commit) {
    const co = git(['checkout', '--detach', tool.commit], abs);
    if (co.code !== 0) {
      printFail(`${name}: no se pudo fijar ${tool.commit.slice(0, 12)} en ${tool.sourcePath}: ${co.err}`);
      process.exit(1);
    }
    printOk(`${name} fijado en ${tool.commit.slice(0, 12)}`);
  } else {
    printOk(`${name} ya en ${tool.commit.slice(0, 12)} (${tool.version})`);
  }
}

// 2. dist de varsense (la CLI se ejecuta desde el submódulo).
const varsenseCli = path.resolve(ROOT, tools.tools.varsense.sourcePath, 'dist/cli/index.js');
if (!fs.existsSync(varsenseCli)) {
  printWarn('varsense sin dist: compilando (npm ci + compile)...');
  const ci = run('npm', ['ci', '--no-audit', '--no-fund'], { spawn: { cwd: path.dirname(path.dirname(varsenseCli)) } });
  if (ci.code !== 0) {
    printFail(`npm ci en varsense falló: ${ci.err}`);
    process.exit(1);
  }
  const compile = run('npm', ['run', 'compile'], { spawn: { cwd: path.dirname(path.dirname(varsenseCli)) } });
  if (compile.code !== 0) {
    printFail(`npm run compile en varsense falló: ${compile.err}`);
    process.exit(1);
  }
  printOk('varsense compilado');
} else {
  printOk('varsense dist presente');
}

// 3. Lock reproducible.
const lock = run('node', ['scripts/quality/lock.mjs', '--write'], { capture: false });
process.exit(lock.status ?? 1);
