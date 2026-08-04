// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { resolveRelations } from '../../src/core/relations';
import type { Corpus, Detection } from '../../src/core/types';

const det = (name: string, cats = [1], extra: Partial<Detection> = {}): Detection =>
  ({ name, cats, confidence: 100, reasons: [], ...extra });

describe('resolveRelations', () => {
  it('adds implied technologies flagged as implied', () => {
    const corpus: Corpus = { WordPress: { cats: [1], implies: ['PHP', 'MySQL'] }, PHP: { cats: [27] }, MySQL: { cats: [34] } };
    const out = resolveRelations([det('WordPress')], corpus);
    const php = out.find((d) => d.name === 'PHP')!;
    expect(php.implied).toBe(true);
    expect(out.map((d) => d.name).sort()).toEqual(['MySQL', 'PHP', 'WordPress']);
  });

  it('does not duplicate an implied tech already detected directly', () => {
    const corpus: Corpus = { A: { cats: [1], implies: 'B' }, B: { cats: [1] } };
    const out = resolveRelations([det('A'), det('B')], corpus);
    expect(out.filter((d) => d.name === 'B')).toHaveLength(1);
    expect(out.find((d) => d.name === 'B')!.implied).toBeUndefined();
  });

  it('drops an excluded technology', () => {
    const corpus: Corpus = { Nginx: { cats: [22], excludes: 'Apache' }, Apache: { cats: [22] } };
    const out = resolveRelations([det('Nginx'), det('Apache')], corpus);
    expect(out.map((d) => d.name)).toEqual(['Nginx']);
  });

  it('drops a detection whose required tech is absent', () => {
    const corpus: Corpus = { 'WP Plugin': { cats: [1], requires: 'WordPress' } };
    const out = resolveRelations([det('WP Plugin')], corpus);
    expect(out).toEqual([]);
  });

  it('keeps a detection whose required tech is present', () => {
    const corpus: Corpus = { 'WP Plugin': { cats: [1], requires: 'WordPress' }, WordPress: { cats: [1] } };
    const out = resolveRelations([det('WP Plugin'), det('WordPress')], corpus);
    expect(out.map((d) => d.name).sort()).toEqual(['WP Plugin', 'WordPress']);
  });
});
