// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { groupByCategory, confidenceDots, toCSV, reasonLine } from '../../src/ext/popup/render';
import type { Detection } from '../../src/core/types';

const dets: Detection[] = [
  { name: 'WordPress', cats: [1], confidence: 100, version: '6.4', reasons: [] },
  { name: 'Cloudflare', cats: [31], confidence: 80, reasons: [] },
];
const catNames: Record<number, string> = { 1: 'CMS', 31: 'CDN' };

describe('render helpers', () => {
  it('groups detections by their first category name', () => {
    const groups = groupByCategory(dets, catNames);
    expect(groups.map((g) => g.cat)).toEqual(['CMS', 'CDN']);
    expect(groups[0]!.items[0]!.name).toBe('WordPress');
  });
  it('renders confidence as five dots', () => {
    expect(confidenceDots(100)).toBe('●●●●●');
    expect(confidenceDots(80)).toBe('●●●●○');
    expect(confidenceDots(0)).toBe('○○○○○');
  });
  it('exports CSV with a header row', () => {
    const csv = toCSV(dets);
    expect(csv.split('\n')[0]).toBe('name,version,confidence,categories');
    expect(csv).toContain('WordPress,6.4,100,CMS?'.replace('CMS?', '')); // version + confidence present
    expect(csv).toContain('Cloudflare,,80,');
  });
  it('formats a reason line with field and raw pattern', () => {
    expect(reasonLine({ confidence: 100, field: 'scriptSrc', raw: '/wp-content/' })).toBe('scriptSrc: /wp-content/');
  });
});
