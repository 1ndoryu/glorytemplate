#!/usr/bin/env node
// Preflight del gate: valida política v2, rama primaria, versión del runtime,
// commits fijados de las herramientas, rutas, lock y estado del árbol. No muta nada.
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, readJson, git, submoduleHead, sentinel, printOk, printFail, printWarn } from './common.mjs';

const branch = git(['branch', '--show-current']).out;
const policy = readJson('sentinel.config.json');
const tools = readJson('quality-tools.json');
const versionOut = sentinel(['--version']).out.trim();

let ok = true;
const hardFails = [];
const warns = [];

// 1. Política v2 presente y válida en forma.
if (!policy) {
  hardFails.push('falta sentinel.config.json');
} else {
  if (policy.schemaVersion !== 2) hardFails.push(`schemaVersion debe ser 2 (actual: ${String(policy.schemaVersion)})`);
  if (!['enforce', 'observe', 'pass-through'].includes(policy.mode)) hardFails.push(`mode inválido: ${String(policy.mode)}`);
  if (!policy.project?.primaryBranch) hardFails.push('falta project.primaryBranch');
  if (!policy.gate?.taskIdRequired) warns.push('gate.taskIdRequired no está en true');
  if (!policy.guard?.directCommands) hardFails.push('falta guard.directCommands (requerido por readV2GuardPolicy)');
}

// 2. Rama primaria coincide con la rama operativa.
const primary = policy?.project?.primaryBranch;
if (primary && branch !== primary) {
  hardFails.push(`rama actual '${branch}' != project.primaryBranch '${primary}'`);
} else if (primary) {
  printOk(`rama primaria '${branch}' coincide con project.primaryBranch`);
}

// 3. Versión del runtime cumple el mínimo.
const minimum = policy?.runtime?.minimumVersion ?? '0.5.0';
const numeric = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
const verOk = numeric(versionOut || '0') >= numeric(minimum);
if (!verOk) hardFails.push(`sentinel ${versionOut || 'desconocido'} < mínimo ${minimum}`);
else printOk(`sentinel ${versionOut} >= mínimo ${minimum}`);

// 4. Submódulos fijados en el commit declarado de quality-tools.json.
if (tools?.tools) {
  for (const [name, tool] of Object.entries(tools.tools)) {
    if (!tool.sourcePath) continue;
    const head = submoduleHead(tool.sourcePath);
    if (!head) {
      warns.push(`${name}: submódulo ${tool.sourcePath} no inicializado`);
      continue;
    }
    if (head !== tool.commit) {
      hardFails.push(`${name}: HEAD ${head.slice(0, 12)} != commit fijado ${tool.commit.slice(0, 12)} (${tool.sourcePath})`);
    } else {
      printOk(`${name} fijado en ${head.slice(0, 12)} (${tool.version})`);
    }
  }
}

// 5. Árbol de trabajo: aviso si hay cambios sin commitear (el flujo claim/start exige limpio).
const dirty = git(['status', '--porcelain']).out;
if (dirty) warns.push('árbol de trabajo con cambios pendientes (necesario para claim/start del flujo coordinado)');

// 6. Rutas de las herramientas y lock reproducible.
const varsenseCli = path.resolve(ROOT, '.agent', 'varsense', 'dist', 'cli', 'index.js');
if (fs.existsSync(varsenseCli)) {
  printOk('varsense dist presente');
} else {
  warns.push('varsense sin dist: ejecuta npm run quality:setup');
}
if (fs.existsSync(path.resolve(ROOT, 'sentinel.lock.json'))) {
  printOk('sentinel.lock.json presente');
} else {
  warns.push('falta sentinel.lock.json: npm run quality:lock -- --write');
}

if (hardFails.length > 0) {
  for (const f of hardFails) printFail(f);
  ok = false;
}
for (const w of warns) printWarn(w);

console.log(ok ? '\nPreflight: OK' : '\nPreflight: ERRORES');
process.exit(ok ? 0 : 1);
