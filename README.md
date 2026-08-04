# ATCG — Technology Fingerprinter

ATCG identifies the technologies a website is built with — CMS, frameworks,
analytics, CDNs, servers, JS libraries, and more — the same job Wappalyzer
does, but free, open source, fully local, and zero-telemetry. It reads a
site's stack like a genome: the four DNA bases (Adenine, Thymine, Cytosine,
Guanine) name the extension.

Wappalyzer's fingerprint database was GPL-3.0 open source until it went
closed-source in August 2023 and moved its value behind a paid API. ATCG's
answer is not to reinvent the detection engine (a few hundred lines of
pattern matching) but to be better on the axes the closed tools are weak on:
privacy, transparency, minimal permissions, and a maintainable, provenance-
tracked corpus.

## Privacy and permissions posture

ATCG requests exactly three permissions: `activeTab`, `scripting`, and
`storage`. No `host_permissions`, no `webRequest`, no background page that
watches your browsing. Analysis is **click-to-analyze**: nothing runs until
you click the toolbar action on a page. There is no telemetry, no analytics,
no phone-home of any kind — after install, everything runs fully local and
offline. The source is public specifically so that claim is verifiable, not
just asserted.

## Install

- **Chrome Web Store:** TBD (link will be added on first publish).
- **Load unpacked (supported local/dev install):**
  1. `npm install && npm run build`
  2. Open `chrome://extensions`, enable **Developer mode**.
  3. Click **Load unpacked** and select the `dist/` directory.
  4. Click the ATCG toolbar action on any page to analyze it.

  **Chrome 151+ caveat:** command-line unpacked loading
  (`--load-extension`, including with
  `--disable-features=DisableLoadExtensionCommandLineSwitch`) is hard-disabled
  starting in Chrome 151 — passing those flags is silently ignored, so
  automated/CLI loading of an unpacked extension no longer works. Use the
  manual **Load unpacked** path above; this is expected behavior, not a bug
  in the build, and there is no command-line workaround.

## Build

```sh
npm install
npm run build      # writes dist/
npm run package     # writes dist/atcg-1.0.0.zip (Web Store artifact)
```

## How detection works

Each page load produces a `Signals` object — HTML, response headers,
cookies, meta tags, script sources/bodies, stylesheets, and JS globals
gathered from the page. Every fingerprint in the corpus is matched against
those signals; each matching field contributes a confidence weight, and a
fingerprint's total confidence is the sum of its matched-field weights
(capped at 100). After matching, a relations pass resolves `implies`
(add an inferred technology), `excludes` (drop a technology ruled out by
another), and `requires`/`requiresCategory` (drop a detection whose
prerequisite isn't also present), then results are sorted by confidence.
Each detection carries its matched reasons (which field, which pattern) and
its provenance (which corpus layer it came from), so a result is never a
bare guess — it is why-explained and where-explained.

Response-header signals depend on one same-origin re-fetch of the active
tab's URL (`fetchHeaders`); this is best-effort. Cross-origin policy can
block that re-fetch, in which case header-based signals are simply skipped
and detection degrades gracefully to page/DOM/JS-global signals alone. That
is expected, correct behavior, not a bug to chase — ATCG never requests
`host_permissions` to work around it.

## Corpus provenance — three layers

The fingerprint corpus is bundled with the extension and is itself the
product. Every fingerprint carries a `_meta.source` tag identifying which
layer it came from, and layers are merged additively (later layers override
same-named entries) so all three can coexist:

| Layer | Source | `_meta.source` tag | Purpose |
|-------|--------|---------------------|---------|
| 1 — Seed | `enthec/webappanalyzer` (maintained GPL-3.0 Wappalyzer-continuation corpus) | `seed-webappanalyzer` | Usable coverage on day one |
| 2 — Freshness | Curated pulls from the same GPL-3.0 upstreams + re-validation | `upstream-fork` | Keep patterns current; catch drift |
| 3 — Original | Fingerprints authored directly for ATCG | `atcg-original` | Fill coverage gaps |

*v1.0.0 ships layer 1 only; layers 2–3 are the maintenance and contribution path, not yet populated.*

## Licensing

The shipped extension is licensed **GPL-3.0-or-later** (see `LICENSE`), which
also covers the bundled fingerprint corpus. The original engine source
(`src/core/**` — the pattern-matching and detection logic, independent of
the corpus and of any browser API) is additionally offered under the
**MIT** license (see `LICENSE.engine.MIT`), so the detection algorithm
itself can be reused permissively even though the shipped corpus is
copyleft. The bundled corpus is seeded from `enthec/webappanalyzer`
(GPL-3.0) — see `NOTICE` for attribution and how modifications are tracked.

## Contributing

To add or improve a fingerprint, edit the appropriate letter-keyed file
under `fingerprints/` and give the entry `"_meta": { "source":
"atcg-original", "verified": "<date>", "notes": "" }` so its provenance
is tracked correctly alongside the seeded corpus. Run `npm run lint:corpus`
to validate the entry (required fields, well-formed regexes, and resolvable
`implies`/`excludes`/`requires` targets) before submitting.
