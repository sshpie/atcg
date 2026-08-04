// SPDX-License-Identifier: GPL-3.0-or-later
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://raw.githubusercontent.com/enthec/webappanalyzer/main';
const LETTERS = '_abcdefghijklmnopqrstuvwxyz'.split('');

export function transformEntry(fp, sourceTag, date) {
  if (fp._meta) return fp;
  return { ...fp, _meta: { source: sourceTag, verified: date, notes: '' } };
}

async function getJSON(path) {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.json();
}

async function main() {
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  await mkdir('fingerprints', { recursive: true });
  for (const letter of LETTERS) {
    let raw;
    try { raw = await getJSON(`src/technologies/${letter}.json`); }
    catch (e) { console.error(`skip ${letter}.json: ${e.message}`); continue; }
    const tagged = Object.fromEntries(
      Object.entries(raw).map(([name, fp]) => [name, transformEntry(fp, 'seed-webappanalyzer', date)]),
    );
    await writeFile(`fingerprints/${letter}.json`, JSON.stringify(tagged, null, 2));
    console.log(`imported ${letter}.json (${Object.keys(tagged).length})`);
  }
  for (const meta of ['categories', 'groups']) {
    await writeFile(`fingerprints/${meta}.json`, JSON.stringify(await getJSON(`src/${meta}.json`), null, 2));
  }
  const shaRes = await fetch('https://api.github.com/repos/enthec/webappanalyzer/commits/main');
  const upstreamSha = shaRes.ok ? (await shaRes.json()).sha : 'unknown';
  await writeFile('fingerprints/SOURCE.txt',
    `Seeded from enthec/webappanalyzer (GPL-3.0) on ${date}.\nUpstream commit: ${upstreamSha}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
