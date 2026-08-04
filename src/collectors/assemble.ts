// SPDX-License-Identifier: GPL-3.0-or-later
import type { PageResult } from './page';
import type { Signals } from '../core/types';

export function assembleSignals(
  url: string, page: PageResult,
  globals: Record<string, unknown>, headers: Record<string, string>,
): Signals {
  return {
    url, html: page.html, headers, cookies: page.cookies, meta: page.meta,
    scriptSrc: page.scriptSrc, scripts: page.scripts, css: page.css,
    js: globals, text: page.text, dom: [],
  };
}
