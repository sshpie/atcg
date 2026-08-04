// SPDX-License-Identifier: GPL-3.0-or-later

export interface PageResult {
  html: string;
  scriptSrc: string[];
  scripts: string[];
  meta: Record<string, string>;
  cookies: Record<string, string>;
  css: string[];
  text: string;
}

/**
 * Injected into the page's ISOLATED world via chrome.scripting.executeScript({ func }).
 * MUST stay self-contained: reference only globals (`document`) and its own locals.
 * executeScript serializes THIS function's source alone — no imports, no closures survive.
 * Unit-tested by calling directly under jsdom.
 */
export function collectPage(): PageResult {
  const scriptSrc: string[] = [];
  const scripts: string[] = [];
  for (const s of Array.from(document.scripts)) {
    if (s.src) scriptSrc.push(s.src);
    else if (s.textContent) scripts.push(s.textContent);
  }
  const meta: Record<string, string> = {};
  for (const m of Array.from(document.querySelectorAll('meta[name][content]'))) {
    const name = m.getAttribute('name'); const content = m.getAttribute('content');
    if (name && content) meta[name.toLowerCase()] = content;
  }
  const css = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
    .map((l) => l.getAttribute('href') || '').filter(Boolean);
  const cookies: Record<string, string> = {};
  for (const c of (document.cookie || '').split(';')) {
    const [k, ...v] = c.trim().split('='); if (k) cookies[k] = v.join('=');
  }
  return {
    html: document.documentElement.outerHTML,
    scriptSrc, scripts, meta, cookies, css,
    text: (document.body?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 20000),
  };
}
