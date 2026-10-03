# Beacon — UX & "Linktree effect" Audit (round 2)

Scope: current `index.html` (deployed at qr-sigma-gold.vercel.app). Round 1 (`AUDIT.md`) security/bug issues are fixed; this round is about product quality, friendliness and how close the public page feels to Linktree.

## Verdict

Solid foundation: correct, safe, fast, no backend. But today it's a *form that makes a QR*, not yet a *profile people love*. The three biggest gaps:

1. **The public page is thin** — one name, tagline, address, 5 tiny icons. Linktree's pull comes from big tappable link buttons, a cover/photo, and motion.
2. **No logo or photo on the page people actually see** (only on the QR) — the page looks anonymous.
3. **The builder is a long one-shot form** with no guidance, no examples, no saved state — first-time users must fill ~13 fields blind.

---

## A. Public profile page — "more Linktree"

| # | Gap | Why it matters | Suggestion |
|---|---|---|---|
| A1 | **Only icon links.** 34px glyphs are the sole way to act. | Linktree = big full-width pill buttons. Icons-only is easy to miss and below the comfortable 44px tap size. | Bring back **pill buttons** for primary actions (Call us, WhatsApp us, Find us, Visit website) and keep the icon row only for socials. Icons ≥44×44px. |
| A2 | **No custom links.** Fixed set of 5. | Real businesses need "Our menu", "Book a table", "Order online", "Reviews". Biggest Linktree feature. | Add **"Add a link"** rows (label + URL), up to ~8, reorderable. |
| A3 | **No logo/photo on the public page.** Initial in a circle only (logo can't fit in the URL). | The page looks generic; reference has a real logo + cover image. | Needs server/storage (see D1). Short term: let users pick an **emoji or icon** for the avatar. |
| A4 | **Hero is a flat dark band.** | Reference has a photo cover/background. | Offer preset **cover patterns / gradients / textures** (no upload needed), later a real image. |
| A5 | **No motion.** | Linktree feels alive: staggered fade-in of buttons, hover lift, press feedback. | Staggered entrance animation, `:active` scale, respect `prefers-reduced-motion`. |
| A6 | **No themes.** User must hand-pick 4 colours. | Most people can't make a good palette; results can look bad. | **6–10 one-click themes** (Sage, Midnight, Sunset, Mono, Pastel…) + "customise" as advanced. |
| A7 | **Primary action buried.** Phone is plain text; WhatsApp is one small icon among five. | For a local business, "call / WhatsApp / directions" are the conversions. | Primary button row: **Call · WhatsApp · Directions** (map link from address). |
| A8 | **Address isn't tappable.** | Visitors expect tap → Google Maps. | Link address to `https://www.google.com/maps/search/?api=1&query=…`. |
| A9 | **Missing common socials**: TikTok, YouTube, X, LinkedIn, Telegram, Email, Snapchat. (Reference shows TikTok/YouTube/X.) | Coverage = relevance. | Generic "social" picker: choose platform → paste handle (auto-builds URL). |
| A10 | **No email, opening hours, "Save contact".** | Typical business needs. | Add optional email, hours (Mon–Sun), and a **vCard "Save to contacts"** button (works offline, no server). |
| A11 | **Verification footer is long** and sits where Linktree puts a small brand. | Safety notice is needed but heavy. | Shorter, smaller footer; keep "Make your own" CTA. |
| A12 | **No share button on the public page.** | Visitors can't pass it on. | Web Share API button ("Share") with copy fallback. |
| A13 | **Weak link metadata** when pasted in WhatsApp/Instagram: no OG image/title per profile (static host, hash URL). | Link previews are the "first impression". | Needs server-side rendering (D1) or a tiny Vercel function that reads the profile and returns OG tags. |

## B. Builder — friendliness

| # | Gap | Suggestion |
|---|---|---|
| B1 | **Preview is below the fold on mobile**, and it's a miniature of the page. | Sticky bottom "Preview" button / tabs (Edit · Preview) on mobile. |
| B2 | **Everything on one page, 13+ inputs.** Only two fields required but all look equal. | Group into steps/sections ("Basics → Contact → Social → Style"), collapse optional ones. Show progress. |
| B3 | **URL inputs are strict** (full `https://…` required for Instagram/Facebook). Users type `@handle` or `instagram.com/x`. | Accept handles and bare domains; auto-build and show the resolved URL. |
| B4 | **Validation only on submit**; errors are native browser bubbles. | Inline, friendly messages as the user leaves each field (green tick / red hint). |
| B5 | **Nothing is saved.** Refresh = everything lost. | Auto-save draft to `localStorage`; "Edit this profile" button that reloads data from a profile link. |
| B6 | **No way to edit an existing profile.** Opening a profile link only shows it. | "Edit" action when the link is yours (loads into builder) — at minimum paste-a-link-to-edit. |
| B7 | **Sample/demo missing.** First visit shows an empty preview. | "See an example" / pre-filled sample so the value is obvious in 3 seconds. |
| B8 | **Result area is hidden under the preview** and shows a raw 400-char URL. | After creation: clear success card — big QR, Download, Copy, **Share**, "Print poster". Hide the raw URL behind "Show link". |
| B9 | **QR is only a QR.** | Add **print-ready poster/table-tent** (QR + business name + "Scan to connect") as PDF/PNG; A6/A4 sizes. Huge for storefronts. |
| B10 | **Colour pickers are native and cryptic** ("Logo circle"). | Swatches + presets; label what each colour affects, show contrast warning for text. |
| B11 | **No undo for "Clear all"** (only a confirm dialog). | Fine as is; consider restoring last draft. |
| B12 | **Landing copy doesn't explain.** No "how it works", examples, FAQ, pricing/"free", or privacy statement. | 3-step explainer, example profiles, short FAQ, privacy line ("nothing is stored on our servers"). |

## C. Technical, SEO & performance

| # | Finding | Suggestion |
|---|---|---|
| C1 | **Security headers**: only HSTS. No CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`. | Add a `vercel.json` with headers; CSP allowing only self + cdnjs + Google Fonts. |
| C2 | **Third-party dependencies**: QR library from cdnjs, fonts from Google. Single point of failure; GDPR flag. | Vendor `qrcode.min.js` and self-host fonts; add SRI hash meanwhile. |
| C3 | **No PWA/manifest, no social image, no canonical, no `og:image`.** | Add manifest, 1200×630 OG image, canonical URL, `robots.txt`/`sitemap.xml` for the builder page. |
| C4 | **Single 33 KB file** mixing CSS/JS/HTML; 223-country list inline. | Fine for now; split into files when it grows. Add minimal tests for `updatePhone`, `validateProfile`, `safeUrl`. |
| C5 | **Phone logic edge cases**: strips leading `0` for every country (wrong for e.g. Italy `+39 06…`, where the 0 is part of the number); no formatting as the user types. | Use `libphonenumber-js` (≈ small build) for validation/formatting per country. |
| C6 | **Analytics: none.** | Privacy-friendly counts (Vercel Analytics/Plausible). With a profile ID later: scans & clicks per link — the #1 Linktree feature owners want. |
| C7 | **Hash-based profiles are not indexable and not trackable.** | Move to short IDs (D1). |
| C8 | **Misc**: small 11–12px text in the footer and hints; no skip link; the country `<select>` with 223 options is long on mobile (consider typeahead). | Min 12–13px, searchable country combobox. |

## D. Architecture (unlocks the best features)

**D1. Add a tiny backend/storage** (Vercel KV / Upstash Redis / Supabase + a Vercel function). One change unlocks: real logo & cover images, short URLs (`beacon.app/hydra`), editing after printing, per-profile OG previews (A13), scan/click analytics (C6), moderation/reporting for abuse (phishing risk from round 1), and unlimited links (A2).
Without it, A3/A13/B6/C6/C7 stay impossible.

---

## Recommended roadmap

**Phase 1 — quick wins (no backend, ~1–2 days):** A1 pill buttons, A5 animation, A6 themes, A7/A8 primary action + maps link, A9 more socials, B3 handle input, B5 auto-save, B7 sample, B8 result card, B9 poster download, A12 share, C1 headers, C2 vendor assets.

**Phase 2 — custom links & content (no backend):** A2 custom links, A10 email/hours/vCard, B1–B2 stepped/tabbed builder on mobile, C5 libphonenumber.

**Phase 3 — product (backend):** D1 storage → logos/covers (A3/A4), short URLs, edit-after-print, OG previews, analytics, abuse reporting.

## What's already good
Clean visual identity, correct phone/QR flow for every country, safe rendering (no XSS), contrast-checked QR, downloads (PNG/SVG), works offline of any server, fast (single request + fonts), mobile-first public page.
