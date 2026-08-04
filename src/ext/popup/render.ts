// SPDX-License-Identifier: GPL-3.0-or-later
import type { Detection, PatternHit } from '../../core/types';

export function groupByCategory(dets: Detection[], catNames: Record<number, string>) {
  const groups = new Map<string, Detection[]>();
  for (const d of dets) {
    const cat = catNames[d.cats[0] ?? -1] ?? 'Other';
    (groups.get(cat) ?? groups.set(cat, []).get(cat)!).push(d);
  }
  return [...groups.entries()].map(([cat, items]) => ({ cat, items }));
}

export function confidenceDots(c: number): string {
  const filled = Math.round(Math.max(0, Math.min(100, c)) / 20);
  return '●'.repeat(filled) + '○'.repeat(5 - filled);
}

export function reasonLine(hit: PatternHit): string {
  return `${hit.field}: ${hit.raw}`;
}

export function toJSON(dets: Detection[]): string {
  return JSON.stringify(
    dets.map((d) => ({ name: d.name, version: d.version ?? null, confidence: d.confidence, cats: d.cats, reasons: d.reasons })),
    null, 2,
  );
}

export function toCSV(dets: Detection[]): string {
  const rows = [['name', 'version', 'confidence', 'categories'].join(',')];
  for (const d of dets) rows.push([d.name, d.version ?? '', String(d.confidence), d.cats.join(' ')].map(csvCell).join(','));
  return rows.join('\n');
}
const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
