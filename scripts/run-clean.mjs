#!/usr/bin/env node
/* Ejecuta un comando (npm/tool) con el PATH limpio de launchers legacy:
 * elimina ~/bin (launchers pre-exec de glory-rust-template) y cualquier dir de
 * ese repo del PATH del hijo. Sin el launcher, npm/node resuelven los shims
 * canónicos del runtime de Sentinel (GlorySentinel\shims) y el gate v2 aplica.
 * Misma regla que scripts/quality/stage-typecheck.mjs (retirar el launcher
 * legado; la autoridad vive en el runtime, no en shims de otro proyecto).
 * Uso: node scripts/run-clean.mjs -- <comando...> */
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const dash = process.argv.indexOf('--');
if (dash < 0) {
  console.error('uso: node scripts/run-clean.mjs -- <comando...>');
  process.exit(2);
}
const args = process.argv.slice(dash + 1);
if (args.length === 0) process.exit(0);

const homeBin = path.join(os.homedir(), 'bin').toLowerCase();
const cleanedPath = (process.env.PATH ?? '')
  .split(path.delimiter)
  .filter((entry) => {
    const normalized = entry.trim().replace(/\\$/u, '').toLowerCase();
    return normalized !== homeBin && !normalized.includes('glory-rust-template');
  })
  .join(path.delimiter);

const env = { ...process.env, PATH: cleanedPath };
const res = spawnSync(args[0], args.slice(1), {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(res.status ?? 1);
