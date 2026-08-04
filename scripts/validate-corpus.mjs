// SPDX-License-Identifier: GPL-3.0-or-later
import { readdir, readFile } from 'node:fs/promises';

const errors = [];
const dir = 'fingerprints';
const files = (await readdir(dir)).filter((f) => /^[_a-z]\.json$/.test(f));
const all = {};
for (const f of files) Object.assign(all, JSON.parse(await readFile(`${dir}/${f}`, 'utf8')));

const STRING_FIELDS = ['html', 'scriptSrc', 'scripts', 'css', 'url', 'text'];
const REC_FIELDS = ['headers', 'cookies', 'meta', 'js'];
const asArr = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const body = (p) => String(p).split('\\;')[0];

for (const [name, fp] of Object.entries(all)) {
  if (!fp._meta?.source) errors.push(`${name}: missing _meta.source`);
  if (!Array.isArray(fp.cats)) errors.push(`${name}: missing cats[]`);
  for (const field of STRING_FIELDS)
    for (const p of asArr(fp[field])) tryRe(name, field, body(p));
  for (const field of REC_FIELDS)
    for (const p of Object.values(fp[field] ?? {})) if (p) tryRe(name, field, body(p));
  for (const rel of ['implies', 'excludes', 'requires'])
    for (const t of asArr(fp[rel])) if (!all[body(t)]) errors.push(`${name}: ${rel} -> unknown "${t}"`);
}
function tryRe(name, field, src) { try { new RegExp(src, 'i'); } catch { errors.push(`${name}.${field}: bad regex ${JSON.stringify(src)}`); } }

if (errors.length) { console.error(`corpus lint: ${errors.length} error(s)`); for (const e of errors.slice(0, 50)) console.error(' -', e); process.exit(1); }
console.log(`corpus lint OK: ${Object.keys(all).length} fingerprints across ${files.length} files`);
