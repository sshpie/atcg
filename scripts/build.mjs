// SPDX-License-Identifier: GPL-3.0-or-later
import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const OUT = 'dist';
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

// Bundle entry points that exist (later tasks add them).
// Object form: the KEY is the output basename, so files land at dist root
// (dist/service-worker.js, dist/popup.js) — matching manifest + popup.html refs.
// An array of paths would emit dist/popup/popup.js (nested), breaking the html ref.
const candidates = {
  'service-worker': 'src/ext/service-worker.ts',
  'popup': 'src/ext/popup/popup.ts',
};
const entryPoints = Object.fromEntries(Object.entries(candidates).filter(([, p]) => existsSync(p)));
if (Object.keys(entryPoints).length) {
  await build({
    entryPoints,
    outdir: OUT,
    bundle: true, format: 'esm', target: 'chrome102',
    sourcemap: true, logLevel: 'info',
  });
}
// Copy static assets that exist.
for (const [from, to] of [
  ['src/ext/manifest.json', `${OUT}/manifest.json`],
  ['src/ext/popup/popup.html', `${OUT}/popup.html`],
  ['src/ext/popup/popup.css', `${OUT}/popup.css`],
  ['src/ext/icons', `${OUT}/icons`],
  ['fingerprints', `${OUT}/fingerprints`],
]) { if (existsSync(from)) await cp(from, to, { recursive: true }); }

console.log('build: wrote', OUT);

if (process.argv.includes('--zip')) {
  const { execFileSync } = await import('node:child_process');
  execFileSync('zip', ['-r', '-q', 'atcg-1.0.0.zip', '.'], { cwd: OUT });
  console.log('package: wrote dist/atcg-1.0.0.zip');
}
