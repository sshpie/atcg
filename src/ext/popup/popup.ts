// SPDX-License-Identifier: GPL-3.0-or-later
import { groupByCategory, confidenceDots, toJSON, toCSV, reasonLine } from './render';
import type { Detection } from '../../core/types';

async function main() {
  const app = document.getElementById('app')!;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) { app.textContent = 'No analyzable page.'; return; }

  const host = document.getElementById('host')!; host.textContent = new URL(tab.url).host;
  const catNames = await fetch(chrome.runtime.getURL('fingerprints/categories.json'))
    .then((r) => r.json()).then((c: Record<string, { name: string }>) =>
      Object.fromEntries(Object.entries(c).map(([id, v]) => [Number(id), v.name]))).catch(() => ({}));

  const resp = await chrome.runtime.sendMessage({ type: 'analyze', tabId: tab.id, url: tab.url });
  if (!resp?.ok) { app.textContent = 'Analysis failed.'; return; }
  const dets: Detection[] = resp.detections;
  render(app, dets, catNames);
  wireExport(dets);
}

function render(app: HTMLElement, dets: Detection[], catNames: Record<number, string>) {
  app.innerHTML = '';
  if (!dets.length) { app.textContent = 'No technologies detected.'; return; }
  for (const { cat, items } of groupByCategory(dets, catNames)) {
    const h = document.createElement('h3'); h.textContent = cat; app.append(h);
    for (const d of items) {
      if (d.reasons.length === 0) {
        const row = document.createElement('div'); row.className = 'row';
        row.textContent = `${d.name}${d.version ? ' ' + d.version : ''}  ${confidenceDots(d.confidence)}`;
        app.append(row);
        continue;
      }
      const row = document.createElement('details'); row.className = 'row';
      const sum = document.createElement('summary');
      sum.textContent = `${d.name}${d.version ? ' ' + d.version : ''}  ${confidenceDots(d.confidence)}`;
      row.append(sum);
      for (const hit of d.reasons) {
        const li = document.createElement('div'); li.className = 'reason';
        li.textContent = reasonLine(hit);
        row.append(li);
      }
      app.append(row);
    }
  }
}

function wireExport(dets: Detection[]) {
  const dl = (name: string, text: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click();
  };
  document.getElementById('export-json')!.addEventListener('click', () => dl('atcg.json', toJSON(dets), 'application/json'));
  document.getElementById('export-csv')!.addEventListener('click', () => dl('atcg.csv', toCSV(dets), 'text/csv'));
}

main();
