// Alcance del stack: determina qué stacks (frontend/php/docs) están afectados
// por los cambios actuales (committed vs primaryBranch + staged + unstaged +
// untracked). En modo local-light la etapa stack solo corre el alcance afectado;
// --full/--ci corren el alcance completo.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, readJson, git } from './common.mjs';

const DEFAULT_STACKS = {
  frontend: [
    'App/React/', 'Glory/assets/', '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.vue', '.mjs',
  ],
  docs: ['.md', 'docs/', 'roadmap.md', 'PLAN_', 'README.md'],
  php: [
    '.php', 'App/', 'Glory/', 'functions.php', 'header.php', 'footer.php',
    'index.php', 'TemplateGlory.php', 'TemplateReact.php',
  ],
};

function stacksConfig() {
  return readJson('quality.config.json')?.scope?.stacks ?? DEFAULT_STACKS;
}

function changedPaths() {
  const out = new Set();
  const addOut = (res) => {
    if (res.code === 0) {
      for (const l of res.out.split('\n')) {
        const t = l.trim();
        if (t) out.add(t);
      }
    }
  };
  addOut(git(['diff', '--name-only']));
  addOut(git(['diff', '--name-only', '--cached']));
  const primary = readJson('sentinel.config.json')?.project?.primaryBranch;
  if (primary) addOut(git(['diff', '--name-only', `${primary}...HEAD`]));
  const st = git(['status', '--porcelain']);
  for (const l of st.out.split('\n')) {
    const t = l.trim();
    if (!t || t.startsWith('!!')) continue;
    let f = t.replace(/^[^ ]+ +/, '').replace(/^"|"$/g, '');
    const arrow = f.indexOf(' -> ');
    if (arrow >= 0) f = f.slice(arrow + 4); // renames: clasificar por el destino
    out.add(f);
  }
  return [...out];
}

export function classifyPath(p, stacks = stacksConfig()) {
  p = p.replace(/\\/g, '/');
  // Infraestructura y herramientas: no tienen stack de build propio.
  if (p.startsWith('.agent/') || p.startsWith('.quality')
    || p.startsWith('.sentinel/') || p.startsWith('scripts/quality/')
    || p === 'package-lock.json' || p === '.gitmodules') return null;
  for (const [stack, rules] of Object.entries(stacks)) {
    for (const rule of rules) {
      if (rule.startsWith('.')) {
        if (p.endsWith(rule)) return stack;
      } else if (p.startsWith(rule)) {
        return stack;
      }
    }
  }
  return null;
}

export function affectedStacks() {
  const affected = new Set();
  for (const p of changedPaths()) {
    const s = classifyPath(p);
    if (s) affected.add(s);
  }
  return [...affected];
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const stacks = affectedStacks();
  console.log(stacks.length > 0 ? stacks.join(', ') : '(ningún stack afectado)');
}
