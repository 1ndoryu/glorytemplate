#!/usr/bin/env node
// Gestión del lock reproducible del gate.
//   npm run quality:lock -- --write   → regenera sentinel.lock.json desde quality-tools.json
//   npm run quality:lock -- --check   → valida que el lock coincida con tools y submódulos
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readJson, submoduleHead, printOk, printFail } from './common.mjs';

const flag = process.argv[2];
if (!['--write', '--check'].includes(flag ?? '')) {
  console.error('Uso: npm run quality:lock -- --write|--check');
  process.exit(2);
}

const tools = readJson('quality-tools.json');
const lockPath = path.resolve(ROOT, 'sentinel.lock.json');

if (!tools?.tools?.sentinel?.commit || !tools?.tools?.varsense?.commit) {
  printFail('quality-tools.json debe declarar tools.sentinel y tools.varsense con commit');
  process.exit(1);
}

function verifyPinned() {
  const problems = [];
  for (const [name, tool] of Object.entries(tools.tools)) {
    if (!tool.sourcePath) continue;
    const head = submoduleHead(tool.sourcePath);
    if (!head) {
      problems.push(`${name}: submódulo ${tool.sourcePath} no inicializado`);
    } else if (head !== tool.commit) {
      problems.push(`${name}: HEAD ${head.slice(0, 12)} != ${tool.commit.slice(0, 12)}`);
    }
  }
  return problems;
}

function buildLock() {
  return {
    schemaVersion: 1,
    analyzers: {
      sentinel: {
        version: tools.tools.sentinel.version,
        commit: tools.tools.sentinel.commit,
      },
      varsense: {
        version: tools.tools.varsense.version,
        commit: tools.tools.varsense.commit,
      },
    },
  };
}

if (flag === '--write') {
  const problems = verifyPinned();
  if (problems.length > 0) {
    for (const p of problems) printFail(p);
    printFail('No se regenera el lock: alinea los submódulos con quality-tools.json primero.');
    process.exit(1);
  }
  const lock = buildLock();
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  printOk(`sentinel.lock.json regenerado (sentinel ${lock.analyzers.sentinel.version} @ ${lock.analyzers.sentinel.commit.slice(0, 12)})`);
  process.exit(0);
}

// --check
const lock = readJson('sentinel.lock.json');
if (!lock) {
  printFail('Falta sentinel.lock.json: ejecuta npm run quality:lock -- --write');
  process.exit(1);
}
const expected = buildLock();
const problems = verifyPinned();
const mismatches = [];
for (const key of ['sentinel', 'varsense']) {
  const a = lock.analyzers?.[key];
  const e = expected.analyzers[key];
  if (!a || a.version !== e.version || a.commit !== e.commit) {
    mismatches.push(`${key}: lock ${a?.version}/${a?.commit?.slice(0, 12)} != tools ${e.version}/${e.commit.slice(0, 12)}`);
  }
}
for (const p of [...problems, ...mismatches]) printFail(p);
if (problems.length === 0 && mismatches.length === 0) {
  printOk('lock consistente con quality-tools.json y submódulos');
  process.exit(0);
}
process.exit(1);
