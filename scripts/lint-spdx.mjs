// SPDX-License-Identifier: GPL-3.0-or-later
import { readdir, readFile } from 'node:fs/promises';

const ROOTS = ['src', 'tests', 'scripts'];
const EXT = /\.(ts|mjs)$/;
const TAG = 'SPDX-License-Identifier:';
const missing = [];

async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(p);
    else if (EXT.test(e.name) && !(await readFile(p, 'utf8')).slice(0, 200).includes(TAG))
      missing.push(p);
  }
}
for (const r of ROOTS) await walk(r);
if (missing.length) {
  console.error(`SPDX lint: ${missing.length} file(s) missing a ${TAG} header`);
  for (const m of missing) console.error(' -', m);
  process.exit(1);
}
console.log(`SPDX lint OK: every src/tests/scripts source file carries an SPDX header`);
