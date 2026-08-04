// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { detect } from '../../src/core/detect';
import { loadCorpus } from '../../src/core/corpus';
import type { Corpus, Signals } from '../../src/core/types';

const corpus: Corpus = {
  WordPress: { cats: [1], scriptSrc: '/wp-(?:content|includes)/', implies: 'PHP',
    _meta: { source: 'seed-webappanalyzer', verified: '2026-08-03' } },
  PHP: { cats: [27] },
  Cloudflare: { cats: [31], headers: { server: 'cloudflare\\;confidence:50' } },
};
const signals: Signals = {
  url: 'https://ex.com/', html: '', headers: { server: 'cloudflare' }, cookies: {},
  meta: {}, scriptSrc: ['https://ex.com/wp-content/a.js'], scripts: [], css: [], js: {},
};

describe('detect', () => {
  it('detects direct + implied technologies, sorted by confidence', () => {
    const out = detect(signals, corpus);
    const names = out.map((d) => d.name);
    expect(names).toContain('WordPress');
    expect(names).toContain('Cloudflare');
    expect(names).toContain('PHP'); // implied
    expect(out.find((d) => d.name === 'PHP')!.implied).toBe(true);
    // Order proves the sort: WordPress (direct, 100) + PHP (implied, 100) tie on
    // confidence and break by name asc (PHP before WordPress); Cloudflare (50) is
    // last, exercising the confidence-descending branch — not just the tie-break.
    expect(names).toEqual(['PHP', 'WordPress', 'Cloudflare']);
  });
  it('returns empty for signals that match nothing', () => {
    const blank: Signals = { ...signals, headers: {}, scriptSrc: [] };
    expect(detect(blank, corpus)).toEqual([]);
  });
});

describe('loadCorpus', () => {
  it('later layers override earlier same-named entries', () => {
    const merged = loadCorpus([
      { X: { cats: [1], _meta: { source: 'seed-webappanalyzer', verified: '2026-01-01' } } },
      { X: { cats: [2], _meta: { source: 'atcg-original', verified: '2026-08-03' } } },
    ]);
    expect(merged.X!.cats).toEqual([2]);
    expect(merged.X!._meta!.source).toBe('atcg-original');
  });
});
