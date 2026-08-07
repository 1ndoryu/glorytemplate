#!/usr/bin/env node
/* Shims universales del quality gate (legacy-compat): el guard de comandos del
 * launcher legacy (~/bin de glory-rust-template) y BASH_ENV buscan este archivo
 * en la raíz del proyecto (find_root: quality.config.json + este archivo) para
 * decidir si un comando directo debe bloquearse (exit 78) o pasar.
 *
 * La política NO vive aquí: este shim reenvía la decisión al guard canónico del
 * runtime global de Sentinel (current.js guard, sentinel.config.json v2).
 * Fail-open si el runtime no está disponible. Ver scripts/quality/stage-typecheck.mjs
 * (misma regla: el launcher legado no debe duplicar la autoridad del runtime). */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const projectRoot = argValue('--project-root', process.cwd());
const executable = argValue('--executable', '');
const dash = process.argv.indexOf('--');
const toolArgs = dash >= 0 ? process.argv.slice(dash + 1) : [];

const runtime =
  process.env.GLORY_SENTINEL_RUNTIME ??
  'C:/Users/Owner/AppData/Local/GlorySentinel';
const currentJs = path.join(runtime, 'current.js');

/* Fail-open: sin runtime Sentinel no hay política que aplicar y el comando pasa. */
if (!existsSync(currentJs)) process.exit(0);

const argv = [currentJs, 'guard', '--project-root', projectRoot];
if (executable) argv.push('--executable', executable);
if (toolArgs.length > 0) argv.push('--', ...toolArgs);

const res = spawnSync(process.execPath, argv, { stdio: 'inherit' });
process.exit(res.status ?? 0);
