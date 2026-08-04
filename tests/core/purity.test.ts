// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Strip block + line comments so the guard checks CODE, not prose. A JSDoc
// line like "no browser/DOM types" must not trip the grep; a real reference
// (chrome.foo, window.x, document.y) in code still does.
const stripComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('core purity', () => {
  it('no file under src/core references chrome/window/document in code', () => {
    const dir = 'src/core';
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const code = stripComments(readFileSync(join(dir, f), 'utf8'));
      expect(code, `${f} must not touch browser globals`).not.toMatch(/\b(chrome|window|document)\b/);
    }
  });
});
