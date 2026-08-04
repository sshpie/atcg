// SPDX-License-Identifier: GPL-3.0-or-later
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { collectPage } from '../../src/collectors/page';

describe('collectPage', () => {
  it('extracts scriptSrc, meta, inline scripts, css, and text from the live document', () => {
    document.documentElement.innerHTML = `
      <head>
        <meta name="generator" content="WordPress 6.4.2">
        <script src="https://cdn/jquery-3.6.0.js"></script>
        <script>window.__X=1</script>
        <link rel="stylesheet" href="/style.css">
      </head><body><p>hello world</p></body>`;
    const r = collectPage();
    expect(r.scriptSrc.some((s) => s.includes('jquery-3.6.0.js'))).toBe(true);
    expect(r.meta.generator).toBe('WordPress 6.4.2');
    expect(r.scripts.join(' ')).toContain('window.__X=1');
    expect(r.css.some((h) => h.includes('style.css'))).toBe(true);
    expect(r.text).toContain('hello world');
    expect(r.html).toContain('WordPress 6.4.2');
  });

  it('is self-contained — its source references no module-scope identifiers', () => {
    // Guards the executeScript({ func }) serialization contract: no imported helpers.
    const src = collectPage.toString();
    expect(src).not.toMatch(/extractFromDocument|\bimport\b|\brequire\b/);
  });
});
