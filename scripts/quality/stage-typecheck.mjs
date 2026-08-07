#!/usr/bin/env node
// Etapa "stack" del gate (type-check): ejecuta `npm run type-check` y escribe
// el reporte JSON del contrato de etapas (schemaVersion + entries[].findings[]).
// Uso: node stage-typecheck.mjs --report <ruta-json>
// El guard intercepta npm run type-check, pero el lease emitido por el gate
// (GLORY_QUALITY_GATE_LEASE) exime las etapas internas.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const reportIdx = args.indexOf('--report');
const reportPath = reportIdx >= 0 ? args[reportIdx + 1] : path.join(ROOT, '.quality-reports', 'stack-typecheck.json');

/* Defensa contra launchers legacy: algunos equipos tienen un `~/bin/npm`
 * pre-exec (orquestador anterior, ej. glory-rust-template) que sourcea un
 * guard viejo y crashea con MODULE_NOT_FOUND al buscar
 * quality-command-guard.mjs desde el cwd. Se retira el dir bin del usuario
 * del PATH de la etapa para que npm resuelva el shim del runtime o el npm
 * real (misma regla que documenta la skill: retirar el launcher legado). */
const cleanedPath = (process.env.PATH ?? '')
  .split(path.delimiter)
  .filter((entry) => {
    const normalized = entry.trim().replace(/\\$/u, '').toLowerCase();
    const homeBin = path.join(os.homedir(), 'bin').toLowerCase();
    return normalized !== homeBin && !normalized.includes('glory-rust-template');
  })
  .join(path.delimiter);

const res = spawnSync('cmd.exe', ['/d', '/s', '/c', 'npm run type-check'], {
  cwd: ROOT,
  env: { ...process.env, PATH: cleanedPath },
  encoding: 'utf8',
  windowsHide: true,
  timeout: 600_000,
});
const ok = res.status === 0;
const tail = String(res.stdout ?? '').split('\n').slice(-12).join('\n').trim()
  + '\n' + String(res.stderr ?? '').split('\n').slice(-4).join('\n').trim();

const entries = ok
  ? []
  : [{
      ruta: '.',
      findings: [{
        ruleId: 'stack-typecheck',
        severity: 'error',
        message: `npm run type-check falló (exit ${res.status ?? 1})\n${tail}`.slice(0, 2000),
      }],
    }];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({ schemaVersion: '1', entries }, null, 2)}\n`, 'utf8');
process.exit(ok ? 0 : 1);
