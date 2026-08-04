// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { assembleSignals } from '../../src/collectors/assemble';
import type { PageResult } from '../../src/collectors/page';

const page: PageResult = { html: '<html>', scriptSrc: ['a.js'], scripts: ['x'],
  meta: { generator: 'WordPress' }, cookies: { sid: '1' }, css: ['/s.css'], text: 'hi' };

describe('assembleSignals', () => {
  it('merges collector outputs into a Signals object', () => {
    const s = assembleSignals('https://ex.com/', page, { Shopify: {} }, { server: 'nginx' });
    expect(s.url).toBe('https://ex.com/');
    expect(s.scriptSrc).toEqual(['a.js']);
    expect(s.meta.generator).toBe('WordPress');
    expect(s.js.Shopify).toEqual({});
    expect(s.headers.server).toBe('nginx');
    expect(s.html).toBe('<html>');
  });
});
