# Beacon QR Profile Builder — Site Audit

Scope: `index.html` (single static file, 59 lines). Date: 2026-10-03.
Method: full code read + live checks in a browser (items marked ✅ were reproduced).

## Verdict

**Not shippable.** The core flow (fill form → create QR) cannot complete for a normal user, the live preview crashes, and shared profile links are an XSS/phishing vector. Even if those are fixed, the QR design cannot carry a logo and depends on a third-party service.

| Severity | Count |
|---|---|
| Critical | 4 |
| High | 5 |
| Medium | 9 |
| Low | 8 |

---

## Critical

**C1 ✅ Form can never be submitted — regex escaping in `pattern` attributes** (lines 31, 33, 34)
HTML attributes don't process backslashes, so `pattern="^\\+[1-9]\\d{7,14}$"` means "one or more literal backslashes, then `\d`…". Valid input `+919876543210` fails (`validity.valid === false`). Same for the Instagram and Facebook patterns. `reportValidity()` blocks submit, so "Create QR code" never works.
Fix: use single backslashes (`\+[1-9]\d{7,14}`) — `pattern` is anchored automatically.

**C2 ✅ Live preview throws on every keystroke** (line 51)
`$('previewCard')` — no element has that id (it's the `<aside class="card preview-card">`). `TypeError: Cannot read properties of null (reading 'style')` fires in `renderPreview()` after the name is set but before the links render, so the preview's link list never appears and the page-colour/gradient controls do nothing in the preview.
Fix: add `id="previewCard"` to the aside (and decide whether the gradient should apply to the whole card or just `.phone`).

**C3 ✅ Stored/reflected XSS via the share link** (lines 51, 56)
`showPublic()` decodes attacker-controlled data from `location.hash` and writes it with `innerHTML`:
- `logo` → `<img src="${data.logo}">` — `x" onerror="…"` executes script (✅ `window.__xss` set).
- `instagram`/`facebook`/`gmb` → `<a href="${…}">` with no scheme check — `javascript:` URLs are accepted (✅ rendered as-is).
Anyone can craft a link on your domain that runs script when opened/scanned. Impact grows with whatever origin hosts this (cookies, storage, future features).
Fix: build DOM with `createElement`/`textContent`, set `href`/`src` as properties, allow-list schemes (`https:`, `http:`, `tel:`; `data:image/(png|jpeg|webp)` for logos only), and validate decoded JSON shape/length.

**C4 Open phishing/impersonation vector**
Because the whole profile lives in the URL and is rendered under your domain, anyone can mint a convincing page ("Your Bank — Call us / Visit website") on a trusted origin with arbitrary outbound links. No reporting, expiry, or link-safety cue exists. Mitigate with a visible "created by a user, unverified" notice, an interstitial on outbound links, and ideally server-side storage with moderation instead of hash-encoded data.

---

## High

**H1 Logo makes the QR code impossible** (line 54, 37)
The logo (up to 500 KB → ~670 KB base64) is embedded in the URL, which is then encoded into the QR. A QR holds max ≈2,950 bytes; the free API also limits GET URLs. Even a 3 KB logo or long text fields overflow. The "keep it compact" hint is not enough; there's no size check on the final URL and no error state — the image just breaks.
Fix: store profiles server-side (or in a small KV/DB) and encode only a short URL. Failing that, drop the logo from the shared data and enforce a hard length limit with a clear message.

**H2 ✅ Website field contradicts its own validation** (line 36)
`type="url"` requires a scheme, but the placeholder is `yourwebsite.com` and `cleanUrl()` exists to add `https://`. Typing the placeholder value fails validation (✅ `websiteValid === false`). Use `type="text"` + normalise, or change the placeholder.

**H3 QR depends on, and leaks data to, a third party** (line 54)
The full profile URL (name, phone, links, logo) is sent as a query string to `api.qrserver.com`. That's a privacy leak (their logs), a single point of failure/rate limit, and it's undisclosed. Generate QR client-side (e.g. `qrcode` / `qr-code-styling`, vendored) — also enables SVG/PNG download and logo overlay.

**H4 Share link isn't shareable unless hosted**
The URL is `location.origin + pathname + '#p=…'`. From `file://` the origin is `"null"`; on localhost the QR points to localhost. There's no check or warning, so QR codes generated in dev/preview are dead on any other device.

**H5 QR accent colour can make the code unscannable** (line 38, 54)
The hint says the QR accent "stays high-contrast", but nothing enforces it — a pale colour yields a dead QR. Compute contrast against white and reject/clamp below ~4.5:1 (dark-on-light only).

---

## Medium

- **M1 ✅ Business-name auto-capitalisation corrupts names** (line 49, 52): `mcdonald's cafe` → `Mcdonald'S Cafe`; `iPhone Repair` becomes `IPhone`. It also rewrites the input mid-typing. Remove it or use CSS `text-transform` for display only.
- **M2 No actions after generating**: no Copy button, Download PNG/SVG, Print, or "Open profile". The link is silently copied to the clipboard (promise unhandled; fails without HTTPS/permission) while the UI says "Profile ready ✓".
- **M3 Public page has no metadata**: `<title>` stays "Beacon — QR profile builder", no per-profile description/OG tags, no `noindex`; the hidden builder is still in the DOM. Set `document.title` and add `<meta name="robots" content="noindex">` for profile views.
- **M4 Public page theming incomplete** (line 56): gradient is applied to `<main>` only, so on wide screens it's a narrow strip over the cream body; text colour contrast against user-picked gradients isn't checked. `pageColor` only changes `--green` (logo mark/hover) — it doesn't visibly theme the page.
- **M5 Silent failure on bad/old links**: `catch(e){}` falls back to the builder with no message; a missing `business` field throws at `data.business[0]`.
- **M6 Link handling is inconsistent**: Instagram/Facebook accept only full URLs (no `@handle` support although `cleanUrl` suggests it); the `!x[1].endsWith('://')` filter is a no-op hack; "Call us" is always shown even if phone is empty in the decoded data.
- **M7 Accessibility — logo upload not keyboard-reachable**: the file input is `hidden`, the label isn't focusable, so keyboard/screen-reader users can't upload. The group label "Logo" points at nothing. Make the input visually hidden (not `hidden`) with a visible focus ring on the label.
- **M8 Accessibility — contrast & feedback**: `--muted #6f7e79` (~4.1:1) and `#a0aaa6`/`#a5b2ad` (~2.3:1) fail WCAG AA; eyebrow orange `#ed8151` on cream ≈2.7:1; many 11px text sizes. Success message and preview have no `aria-live`; errors use `alert()`; buttons lack `:focus-visible` styling.
- **M9 No persistence/editing**: refresh loses everything; there's no way to edit a published profile, and QR codes can never be updated after printing (a core expectation for printed QR).

## Low

- Inputs are 14px → iOS Safari zooms on focus; use ≥16px on mobile.
- "01 — 02" step indicator and "01" eyebrow imply a multi-step flow that doesn't exist.
- Deprecated `escape`/`unescape` in encode/decode — use `TextEncoder`/`TextDecoder`.
- Preview links use `target="_blank"` without `rel="noopener noreferrer"` and are live links inside a preview.
- `name[0]` splits emoji surrogate pairs for the avatar initial; use `Array.from(name)[0]`.
- Missing: favicon, `theme-color`, OG/Twitter tags, canonical, privacy policy/terms, CSP.
- Google Fonts loaded from a third party (GDPR/privacy, render-blocking); self-host or accept and disclose.
- "Clear all" has no confirmation and doesn't reset the logo input value.
- Decorative glyphs (`⌁ ✦ ☎ ◎ ⌖`) inside links aren't `aria-hidden`; the QR `alt` is generic and the QR isn't accompanied by the plain URL for screen-reader users.
- Single 20-line minified CSS block and inline script: hard to maintain/test; no tests.

---

## What's good

- Clean, coherent visual design; responsive breakpoint handled; sticky preview.
- Semantic basics: `lang`, viewport, labels on most inputs, `inputmode`/`type=tel`.
- Public view uses `rel="noopener"` on outbound links.
- Zero dependencies / simple to deploy (a strength once the architecture issues are fixed).

## Recommended order of work

1. Fix C1, C2 (an hour; restores the core flow).
2. Fix C3: DOM-based rendering + URL scheme allow-list + decoded-data validation.
3. Decide architecture for H1/H3/H4/C4/M9: server-side (or KV) storage with short URLs, client-side QR generation. This resolves the logo, privacy, hosting, editing and abuse issues together.
4. H2, H5, M1–M8 UX/accessibility pass.
5. Low-severity polish and metadata.
