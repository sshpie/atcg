// SPDX-License-Identifier: GPL-3.0-or-later
import { detect } from '../core/detect';
import { loadCorpus } from '../core/corpus';
import { assembleSignals } from '../collectors/assemble';
import { collectPage } from '../collectors/page';
import { collectGlobals, globalPaths } from '../collectors/globals';
import { fetchHeaders } from '../collectors/headers';
import type { Corpus } from '../core/types';

const LETTERS = '_abcdefghijklmnopqrstuvwxyz'.split('');
let corpusCache: Corpus | null = null;

async function getCorpus(): Promise<Corpus> {
  if (corpusCache) return corpusCache;
  const layers = await Promise.all(LETTERS.map(async (l) => {
    try { return await (await fetch(chrome.runtime.getURL(`fingerprints/${l}.json`))).json() as Corpus; }
    catch (e) { console.warn('atcg: corpus shard failed to load', l, e); return {} as Corpus; }
  }));
  corpusCache = loadCorpus(layers);
  return corpusCache;
}

async function analyze(tabId: number, url: string) {
  const corpus = await getCorpus();
  const [pageRes] = await chrome.scripting.executeScript({ target: { tabId }, func: collectPage });
  const [globalsRes] = await chrome.scripting.executeScript({
    target: { tabId }, world: 'MAIN', func: collectGlobals, args: [globalPaths(corpus)],
  });
  const headers = await fetchHeaders(url);
  const signals = assembleSignals(url, pageRes!.result!, globalsRes!.result ?? {}, headers);
  return detect(signals, corpus);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'analyze') return false;
  analyze(msg.tabId, msg.url)
    .then((detections) => sendResponse({ ok: true, detections }))
    .catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true; // async response
});
