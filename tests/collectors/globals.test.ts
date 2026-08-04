// SPDX-License-Identifier: GPL-3.0-or-later
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { collectGlobals, globalPaths } from '../../src/collectors/globals';

afterEach(() => {
  delete (globalThis as any).Shopify;
  delete (globalThis as any).jQuery;
  delete (globalThis as any).Vue;
});

describe('collectGlobals', () => {
  it('resolves top-level and dotted paths against globalThis, omitting absent ones', () => {
    (globalThis as any).Shopify = {};
    const jq = function () {} as unknown as { fn: { jquery: string } };
    jq.fn = { jquery: '3.6.0' };
    (globalThis as any).jQuery = jq;
    const out = collectGlobals(['Shopify', 'jQuery.fn.jquery', 'Missing.Path']);
    expect(out).toHaveProperty('Shopify');
    expect(out['jQuery.fn.jquery']).toBe('3.6.0');
    expect(out).not.toHaveProperty('Missing.Path');
  });

  it('is self-contained — its source references no module-scope identifiers', () => {
    const src = collectGlobals.toString();
    expect(src).not.toMatch(/readGlobals|\bimport\b|\brequire\b/);
  });

  it('returns structured-clone-safe leaves for function/object globals', () => {
    (globalThis as any).jQuery = function () {};            // function-valued global
    (globalThis as any).Vue = { version: '3', mount() {} }; // method-bearing object global
    const out = collectGlobals(['jQuery', 'Vue']);
    expect(out['jQuery']).toBe(true);   // summarized, not the raw function
    expect(out['Vue']).toBe(true);
    expect(() => structuredClone(out)).not.toThrow(); // the real guard: raw values throw DataCloneError
  });
});

describe('globalPaths', () => {
  it('collects unique js keys across the corpus', () => {
    const paths = globalPaths({ A: { cats: [1], js: { Shopify: '' } }, B: { cats: [1], js: { Shopify: '', Vue: '' } } });
    expect(paths.sort()).toEqual(['Shopify', 'Vue']);
  });
});
