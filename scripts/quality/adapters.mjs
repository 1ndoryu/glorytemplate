// Adaptadores de herramientas externas (sentinel/varsense): lanzan el CLI real
// de forma fiable en cualquier shell/node, sin rutas absolutas versionadas.
//
// Los shims .cmd del runtime no son spawnables desde child_process (EINVAL en
// Windows): se lanza el CLI real con `node <runtime>/current.js` (el mismo
// mecanismo que usa el shim). La ruta se resuelve en runtime desde
// GLORY_SENTINEL_RUNTIME (fijada por los shims) o LOCALAPPDATA.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function exec(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...opts.env },
    ...opts.spawn,
  });
  if (opts.capture === false) return res;
  return { ...res, code: res.status, out: String(res.stdout ?? ''), err: String(res.stderr ?? '') };
}

export function sentinelRuntimeRoot() {
  const fromEnv = process.env.GLORY_SENTINEL_RUNTIME;
  if (fromEnv && fs.existsSync(path.join(fromEnv, 'current.js'))) return fromEnv;
  const local = process.env.LOCALAPPDATA
    || (process.platform === 'win32' ? path.join(os.homedir(), 'AppData', 'Local') : null);
  const cand = local ? path.join(local, 'GlorySentinel') : null;
  if (cand && fs.existsSync(path.join(cand, 'current.js'))) return cand;
  return null;
}

export function sentinel(args, opts = {}) {
  const root = sentinelRuntimeRoot();
  if (root) return exec(process.execPath, [path.join(root, 'current.js'), ...args], opts);
  return exec('sentinel', args, opts);
}

export { ROOT };
