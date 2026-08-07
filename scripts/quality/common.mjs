// Helper compartido por scripts/quality/*.mjs
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...opts.env },
    ...opts.spawn,
  });
  if (opts.capture !== false) {
    return { ...res, code: res.status, out: String(res.stdout ?? ''), err: String(res.stderr ?? '') };
  }
  return res;
}

export function readJson(file) {
  const abs = path.resolve(ROOT, file);
  if (!fs.existsSync(abs)) return null;
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (error) {
    throw new Error(`${file}: JSON inválido (${error.message})`);
  }
}

export function git(cmdArgs, cwd = ROOT) {
  const res = spawnSync('git', cmdArgs, { cwd, encoding: 'utf8' });
  return { code: res.status ?? 1, out: String(res.stdout ?? '').trim(), err: String(res.stderr ?? '').trim() };
}

export function submoduleHead(relPath) {
  const res = git(['rev-parse', 'HEAD'], path.resolve(ROOT, relPath));
  return res.code === 0 ? res.out : null;
}

export function printOk(msg) {
  console.log(`\x1b[32m[ok]\x1b[0m ${msg}`);
}

export function printFail(msg) {
  console.error(`\x1b[31m[fail]\x1b[0m ${msg}`);
}

export function printWarn(msg) {
  console.warn(`\x1b[33m[warn]\x1b[0m ${msg}`);
}

/* Lanzadores de herramientas (sentinel/varsense) viven en adapters.mjs. */
export { sentinel, sentinelRuntimeRoot } from './adapters.mjs';
