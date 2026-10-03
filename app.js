'use strict';
const $ = id => document.getElementById(id);
const LP = window.libphonenumber;

const textFields = ['business', 'tagline', 'phone', 'whatsapp', 'email', 'location', 'hours', 'instagram', 'facebook', 'youtube', 'gmb', 'website'];
const colorFields = ['qrColor', 'pageColor', 'gradientStart', 'gradientEnd'];
const fields = [...textFields, ...colorFields, 'pattern'];
const DRAFT_IDS = ['business', 'tagline', 'phoneCountry', 'phoneLocal', 'email', 'location', 'hours', 'instagram', 'facebook', 'youtube', 'gmb', 'website', 'pattern', ...colorFields];
const COLOR = /^#[0-9a-f]{6}$/i;
const LOGO = /^data:image\/(png|jpeg|webp);base64,[a-z0-9+\/=]+$/i;
const DRAFT_KEY = 'beacon:draft', MINE_KEY = 'beacon:mine';
const web = ['http:', 'https:'];
let logoColor = '', logoData = '', lastUrl = '', lastQr = null, currentTheme = 'sage';

/* ---------- themes ---------- */
const THEMES = [
  { id: 'sage', name: 'Sage', a: '#6b7d6e', b: '#4a5b4e', c: '#2f4a3a' },
  { id: 'midnight', name: 'Midnight', a: '#27345a', b: '#0b1020', c: '#3b6fe0' },
  { id: 'sunset', name: 'Sunset', a: '#f2a65a', b: '#d9485b', c: '#7a1f2b' },
  { id: 'ocean', name: 'Ocean', a: '#2f9fc4', b: '#123f6b', c: '#0b2f4a' },
  { id: 'blush', name: 'Blush', a: '#f6cbd6', b: '#e58fa8', c: '#a8345a' },
  { id: 'lavender', name: 'Lavender', a: '#cbbcf4', b: '#8a74d8', c: '#4b3a8f' },
  { id: 'forest', name: 'Forest', a: '#2f6b4f', b: '#12362a', c: '#0c241a' },
  { id: 'sand', name: 'Sand', a: '#f1e3ca', b: '#d6b98d', c: '#7a5a2c' },
  { id: 'coral', name: 'Coral', a: '#ff9279', b: '#e5485b', c: '#8c2331' },
  { id: 'mono', name: 'Mono', a: '#444444', b: '#111111', c: '#6a6a6a' }
];


/* ---------- background patterns (drawn in code, so they cost nothing in the link) ---------- */
const PATTERNS = [
  { id: 'none', name: 'Plain' }, { id: 'doodles', name: 'Doodles' }, { id: 'dots', name: 'Dots' }, { id: 'waves', name: 'Waves' }, { id: 'leaves', name: 'Leaves' },
  { id: 'stars', name: 'Sparkles' }, { id: 'confetti', name: 'Confetti' }, { id: 'bubbles', name: 'Bubbles' }, { id: 'zigzag', name: 'Zigzag' }, { id: 'grid', name: 'Grid' }
];
const TILES = {
  doodles: [120, '<path d="M20 12l3.4 7.6 8.2.9-6.1 5.5 1.7 8.1L20 30l-7.2 3.9 1.7-8.1-6.1-5.5 8.2-.9z"/><path d="M68 20q5-9 10 0t10 0 10 0"/><circle cx="98" cy="68" r="8"/><path d="M26 88v16M18 96h16"/><path d="M62 98l9 15H53z"/><path d="M58 52c-7-8-17 1-8 9l8 6 8-6c9-8-1-17-8-9z"/><path d="M100 100c-6 0-8-8-2-10s10 6 4 10"/>'],
  dots: [56, '<circle cx="14" cy="14" r="4" fill="currentColor" stroke="none"/><circle cx="42" cy="42" r="4" fill="currentColor" stroke="none"/>'],
  waves: [80, '<path d="M0 20q10-10 20 0t20 0 20 0 20 0M0 60q10-10 20 0t20 0 20 0 20 0"/>'],
  leaves: [100, '<path d="M18 42c0-17 15-28 32-28 0 17-15 28-32 28zM18 42l17-17"/><path d="M60 92c0-14 12-22 26-22 0 14-12 22-26 22zM60 92l14-14"/>'],
  stars: [80, '<path d="M20 6v28M6 20h28"/><path d="M58 48v16M50 56h16"/><circle cx="62" cy="16" r="3"/><circle cx="18" cy="62" r="3"/>'],
  confetti: [100, '<path d="M15 20l8 4M70 15l-6 7M45 55l9-2M20 80l-3-9M80 80l7 4"/><circle cx="55" cy="22" r="3"/><circle cx="85" cy="50" r="3"/><circle cx="30" cy="52" r="3"/>'],
  bubbles: [120, '<circle cx="25" cy="30" r="14"/><circle cx="80" cy="25" r="7"/><circle cx="95" cy="80" r="18"/><circle cx="35" cy="90" r="8"/>'],
  zigzag: [60, '<path d="M0 15l10-10 10 10 10-10 10 10 10-10 10 10M0 45l10-10 10 10 10-10 10 10 10-10 10 10"/>'],
  grid: [40, '<path d="M0 0H40M0 0V40" stroke-width="1"/>']
};
function patternImage(id, col) {
  const t = TILES[id]; if (!t) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${t[0]}" height="${t[0]}" viewBox="0 0 ${t[0]} ${t[0]}" color="${col}"><g opacity=".24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t[1]}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ---------- colour maths (match the QR to the logo) ---------- */
function hexToHsl(hex) {
  const r = parseInt(hex.substr(1, 2), 16) / 255, g = parseInt(hex.substr(3, 2), 16) / 255, b = parseInt(hex.substr(5, 2), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(v * 255).toString(16).padStart(2, '0'); };
  return '#' + f(0) + f(8) + f(4);
}
function darkenForQr(hex) { let [h, s, l] = hexToHsl(hex); while (contrastOnWhite(hslToHex(h, s, l)) < 4.5 && l > .08) l -= .03; return hslToHex(h, s, l); }
function logoDominant(dataUrl) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 40; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 40, 40);
        const px = x.getImageData(0, 0, 40, 40).data, buckets = {};
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], g = px[i + 1], b = px[i + 2]; if (px[i + 3] < 128 || (r > 235 && g > 235 && b > 235)) continue;
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b), w = 1 + (mx ? (mx - mn) / mx : 0) * 4, k = (r >> 5) + ',' + (g >> 5) + ',' + (b >> 5);
          const o = buckets[k] || (buckets[k] = { w: 0, r: 0, g: 0, b: 0 }); o.w += w; o.r += r * w; o.g += g * w; o.b += b * w;
        }
        const best = Object.values(buckets).sort((p, q) => q.w - p.w)[0];
        res(best ? '#' + [best.r, best.g, best.b].map(v => Math.round(v / best.w).toString(16).padStart(2, '0')).join('') : '');
      } catch (e) { res(''); }
    };
    img.onerror = () => res(''); img.src = dataUrl;
  });
}
function syncQr() {
  const auto = $('qrAuto').checked, note = $('qrMatch');
  if (!auto) { note.textContent = 'Using the colour you picked.'; return; }
  $('qrColor').value = darkenForQr(logoColor || $('pageColor').value);
  note.textContent = logoColor ? "Matched to your logo's main colour." : 'Matched to your logo-circle colour. Add a logo and it will use that instead.';
}

/* ---------- safe URL helpers (everything shown on a profile goes through these) ---------- */
function safeUrl(v, protocols) { v = (v || '').trim(); if (!v || v.length > 500) return ''; try { const u = new URL(v); return protocols.includes(u.protocol) ? u.href : ''; } catch (e) { return ''; } }
function webUrl(v) {
  v = (v || '').trim();
  if (v && !/^[a-z][a-z0-9+.-]*:/i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
  const u = safeUrl(v, web);
  if (!u) return '';
  try { return new URL(u).hostname.includes('.') ? u : ''; } catch (e) { return ''; }
}
const SOCIAL = {
  instagram: { base: 'https://instagram.com/', pre: '', hosts: ['instagram.com'] },
  facebook: { base: 'https://facebook.com/', pre: '', hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  youtube: { base: 'https://youtube.com/', pre: '@', hosts: ['youtube.com', 'youtu.be'] }
};
function socialUrl(kind, v) {
  v = (v || '').trim();
  if (!v || v.length > 300) return '';
  const cfg = SOCIAL[kind];
  let u = v;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) {
    const bare = new RegExp('^(www\\.|m\\.)?(' + cfg.hosts.map(h => h.replace('.', '\\.')).join('|') + ')(/|$)', 'i');
    if (bare.test(u)) u = 'https://' + u;
    else {
      const h = u.replace(/^@/, '');
      if (!/^[A-Za-z0-9._-]{1,60}$/.test(h)) return '';
      u = cfg.base + cfg.pre + h;
    }
  }
  u = safeUrl(u, web);
  if (!u) return '';
  const host = new URL(u).hostname.toLowerCase().replace(/^(www|m)\./, '');
  return cfg.hosts.some(x => host === x || host.endsWith('.' + x)) ? u : '';
}
const validE164 = p => /^\+[1-9]\d{7,14}$/.test(p || '');
const telUrl = p => validE164(p) ? 'tel:' + p : '';
const waUrl = p => validE164(p) ? 'https://wa.me/' + p.slice(1) : '';
const mailUrl = e => /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test((e || '').trim()) ? 'mailto:' + e.trim() : '';
const mapsUrl = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
function fmtPhone(p) { try { return LP.parsePhoneNumberFromString(p).formatInternational(); } catch (e) { return p; } }

function buildLinks(d) {
  return {
    phone: telUrl(d.phone), wa: waUrl(d.whatsapp), maps: (d.location || '').trim() ? mapsUrl(d.location.trim()) : '',
    social: [
      ['Instagram', 'instagram', socialUrl('instagram', d.instagram)],
      ['Facebook', 'facebook', socialUrl('facebook', d.facebook)],
      ['YouTube', 'youtube', socialUrl('youtube', d.youtube)],
      ['Email', 'email', mailUrl(d.email)],
      ['Website', 'website', webUrl(d.website)],
      ['Google Business', 'google', webUrl(d.gmb)]
    ].filter(x => x[2])
  };
}

/* ---------- colour helpers ---------- */
const color = (v, fb) => COLOR.test(v || '') ? v : fb;
function luminance(hex) { const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
const contrastOnWhite = hex => 1.05 / (luminance(hex) + .05);
function textColorFor(a, b) { const l = (luminance(a) + luminance(b)) / 2; return 1.05 / (l + .05) >= 3 ? '#fff' : '#14231f'; }

/* ---------- icons ---------- */
const ICONS = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10.5 9.5v5l4.5-2.5z"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  google: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  whatsapp: '<path d="M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.5L3 21z"/><path d="M9 9c0 3.3 2.7 6 6 6l1-1.6-2-1-1 .8a4.2 4.2 0 0 1-1.8-1.8l.8-1-1-2L9 9z"/>',
  call: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  directions: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
  contact: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20a6.5 6.5 0 0 1 13 0M18 8v6M15 11h6"/>'
};
function icon(key) { const t = document.createElement('template'); t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[key] + '</svg>'; return t.content.firstChild; }

/* ---------- toast, clipboard, share ---------- */
let toastT;
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('Link copied ✓'), () => toast('Copy failed — open "Show the link" and copy it by hand.'));
  else toast('Copy not available here — open "Show the link" and copy it by hand.');
}
async function shareLink(url, title) {
  if (navigator.share) { try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  copyText(url);
}

/* ---------- vCard ("Save contact") ---------- */
function downloadVcard(d) {
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/[;,]/g, '\\$&').replace(/\r?\n/g, '\\n');
  const L = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + esc(d.business), 'ORG:' + esc(d.business)];
  if (validE164(d.phone)) L.push('TEL;TYPE=WORK,VOICE:' + d.phone);
  if (mailUrl(d.email)) L.push('EMAIL;TYPE=WORK:' + d.email.trim());
  const site = webUrl(d.website); if (site) L.push('URL:' + site);
  if ((d.location || '').trim()) L.push('ADR;TYPE=WORK:;;' + esc(d.location.trim()) + ';;;;');
  const hp = hoursPlain(d.hours); if (hp) L.push('NOTE:Opening hours: ' + esc(hp));
  L.push('END:VCARD');
  const url = URL.createObjectURL(new Blob([L.join('\r\n')], { type: 'text/vcard;charset=utf-8' }));
  download(url, (slugify(d.business) || 'contact') + '.vcf'); setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Contact file downloaded — open it to save.');
}
function slugify(s) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function download(href, name) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }

/* ---------- the profile renderer (preview + public page) ---------- */
function setAvatar(el, name, logo) {
  el.textContent = '';
  if (logo && LOGO.test(logo)) { const i = document.createElement('img'); i.alt = ''; i.src = logo; el.appendChild(i); }
  else el.textContent = (Array.from(name || '')[0] || '✦').toUpperCase();
}
function renderProfile(root, d, logo, opts) {
  root.textContent = '';
  const g1 = color(d.gradientStart, '#6b7d6e'), g2 = color(d.gradientEnd, '#4a5b4e');
  const fg = textColorFor(g1, g2), grad = `linear-gradient(180deg,${g1},${g2})`, pat = TILES[d.pattern] ? d.pattern : 'none';
  root.style.background = grad;
  if (pat !== 'none') { root.style.backgroundImage = patternImage(pat, fg) + ', ' + grad; root.style.backgroundSize = Math.round(TILES[pat][0] * 1.25) + 'px, 100% 100%'; root.style.backgroundRepeat = 'repeat, no-repeat'; }
  root.style.setProperty('--fg', fg);
  root.style.setProperty('--accent', color(d.pageColor, '#2f4a3a'));
  const hero = document.createElement('div'); hero.className = 'pf-hero';
  const av = document.createElement('div'); av.className = 'pf-avatar'; av.setAttribute('aria-hidden', 'true'); setAvatar(av, d.business, logo); hero.appendChild(av);
  const body = document.createElement('div'); body.className = 'pf-body';
  let step = 0; const add = el => { el.style.setProperty('--i', step++); body.appendChild(el); return el; };
  const L = buildLinks(d);

  const h = document.createElement(opts.heading || 'div'); h.className = 'pf-name'; h.textContent = d.business || 'Your business'; add(h);
  if (d.tagline) { const t = document.createElement('p'); t.className = 'pf-tag'; t.textContent = d.tagline; add(t); }

  const addr = (d.location || '').trim(), hours = (d.hours || '').trim();
  if (addr || hours) {
    const info = document.createElement('div'); info.className = 'pf-info';
    if (addr) { const p = document.createElement('p'), a = document.createElement('a'); a.href = L.maps; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = addr; a.setAttribute('aria-label', 'Open ' + addr + ' in Google Maps'); p.appendChild(a); info.appendChild(p); }
    if (hours) info.appendChild(hoursBlock(hours));
    add(info);
  }

  const pills = [];
  if (L.phone) pills.push(['call', 'Call us', L.phone]);
  if (L.wa) pills.push(['whatsapp', 'WhatsApp us', L.wa]);
  if (L.maps) pills.push(['directions', 'Directions', L.maps]);
  if (pills.length) {
    const box = document.createElement('div'); box.className = 'pf-links';
    pills.forEach(([key, label, href]) => { const a = document.createElement('a'); a.className = 'pf-pill'; a.href = href; a.rel = 'noopener noreferrer'; if (!href.startsWith('tel:')) a.target = '_blank'; a.append(icon(key), label); box.appendChild(a); });
    add(box);
  }
  if (L.social.length) {
    const row = document.createElement('div'); row.className = 'pf-social';
    L.social.forEach(([label, key, href]) => { const a = document.createElement('a'); a.className = 'pf-ico'; a.href = href; if (!href.startsWith('mailto:')) a.target = '_blank'; a.rel = 'noopener noreferrer'; a.setAttribute('aria-label', label); a.appendChild(icon(key)); row.appendChild(a); });
    add(row);
  }
  if (!pills.length && !L.social.length) { const e = document.createElement('div'); e.className = 'pf-empty'; e.textContent = 'Your links will appear here as you fill in the form.'; add(e); }

  const acts = document.createElement('div'); acts.className = 'pf-actions';
  if (L.phone || mailUrl(d.email)) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pf-btn'; b.append(icon('contact'), 'Save contact'); b.addEventListener('click', () => downloadVcard(d)); acts.appendChild(b); }
  const sb = document.createElement('button'); sb.type = 'button'; sb.className = 'pf-btn'; sb.append(icon('share'), 'Share'); sb.addEventListener('click', () => shareLink(opts.url || lastUrl || location.href.split('#')[0], d.business || 'Beacon')); acts.appendChild(sb);
  add(acts);

  if (opts.footer) {
    const f = document.createElement('div'); f.className = 'pf-foot';
    f.append('Created by a Beacon user and not verified — check links before you trust them.', document.createElement('br'));
    const a = document.createElement('a'); a.href = location.href.split('#')[0]; a.textContent = 'Make your own with beacon'; f.append(a);
    if (opts.owner) { f.append(' · '); const b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn'; b.textContent = 'Edit this profile'; b.addEventListener('click', opts.owner); f.append(b); }
    add(f);
  }
  root.append(hero, body);
}


/* ---------- opening hours ---------- */
/* Stored as one compact string:  v1|<time zone>|<Mon>;<Tue>;...;<Sun>
   each day is  -  (closed),  24  (all day)  or  HHMM-HHMM[,HHMM-HHMM]  (up to two periods; a close earlier than the open means "after midnight") */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const emptyDays = () => Array.from({ length: 7 }, () => ({ open: false, all24: false, r: [] }));
const detectTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } };
const pad4 = m => String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0');
const toTimeStr = m => pad4(m).replace(/^(\d\d)/, '$1:');
const fromTimeStr = s => { const m = /^(\d{2}):(\d{2})$/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
function validTz(tz) { try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
function stringifyHours(H) {
  if (!H.days.some(d => d.open)) return '';
  return 'v1|' + H.tz + '|' + H.days.map(d => !d.open ? '-' : d.all24 ? '24' : d.r.map(r => pad4(r[0]) + '-' + pad4(r[1])).join(',')).join(';');
}
function parseHours(s) {
  try {
    if (!s || !s.startsWith('v1|')) return null;
    const [, tz, rest] = s.split('|'); const parts = (rest || '').split(';');
    if (parts.length !== 7 || !validTz(tz)) return null;
    const days = parts.map(p => {
      if (!p || p === '-') return { open: false, all24: false, r: [] };
      if (p === '24') return { open: true, all24: true, r: [] };
      const r = p.split(',').slice(0, 2).map(x => { const m = /^(\d{2})(\d{2})-(\d{2})(\d{2})$/.exec(x); if (!m || +m[1] > 23 || +m[3] > 23 || +m[2] > 59 || +m[4] > 59) throw new Error('t'); return [+m[1] * 60 + +m[2], +m[3] * 60 + +m[4]]; });
      return { open: true, all24: false, r };
    });
    return { tz, days };
  } catch (e) { return null; }
}
const tfmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }), tfmtH = new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' });
const fmtMin = m => (m % 60 ? tfmt : tfmtH).format(new Date(Date.UTC(2000, 0, 1, 0, m)));
function dayText(d) { return !d.open ? 'Closed' : d.all24 ? 'Open 24 hours' : d.r.map(r => fmtMin(r[0]) + ' – ' + fmtMin(r[1])).join(', '); }
function hoursGroups(H) {
  const groups = [];
  H.days.forEach((d, i) => { const key = dayText(d), g = groups[groups.length - 1]; if (g && g.key === key) g.days.push(i); else groups.push({ key, days: [i], text: key }); });
  return groups.map(g => ({ label: g.days.length > 1 ? DAYS[g.days[0]] + ' – ' + DAYS[g.days[g.days.length - 1]] : DAYS[g.days[0]], text: g.text, days: g.days }));
}
function hoursPlain(str) {
  const H = parseHours(str); if (!H) return (str || '').trim();
  return hoursGroups(H).map(g => g.label + ': ' + g.text).join('\n');
}
function nowIn(tz) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { d: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday), m: (+p.hour % 24) * 60 + +p.minute };
  } catch (e) { const n = new Date(); return { d: (n.getDay() + 6) % 7, m: n.getHours() * 60 + n.getMinutes() }; }
}
function hoursStatus(H) {
  const n = nowIn(H.tz), today = H.days[n.d], yest = H.days[(n.d + 6) % 7];
  if (today.all24) return { s: 'open', text: 'Open 24 hours today' };
  for (const r of yest.r) if (r[1] < r[0] && n.m < r[1]) return { s: r[1] - n.m <= 60 ? 'soon' : 'open', text: (r[1] - n.m <= 60 ? 'Closing soon · ' : 'Open now · closes ') + fmtMin(r[1]) };
  for (const r of today.r) {
    const over = r[1] <= r[0];
    if (n.m >= r[0] && n.m < (over ? 1440 : r[1])) { const left = (over ? 1440 + r[1] : r[1]) - n.m; return { s: left <= 60 ? 'soon' : 'open', text: (left <= 60 ? 'Closing soon · ' : 'Open now · closes ') + fmtMin(r[1]) }; }
  }
  for (let i = 0; i <= 7; i++) {
    const di = (n.d + i) % 7, d = H.days[di]; if (!d.open) continue;
    if (d.all24) { if (i === 0) continue; return { s: 'closed', text: 'Closed · opens ' + (i === 1 ? 'tomorrow' : DAYS[di]) }; }
    const starts = d.r.map(r => r[0]).sort((a, b) => a - b).filter(st => i > 0 || st > n.m);
    if (starts.length) return { s: 'closed', text: 'Closed · opens ' + (i === 0 ? 'today ' : i === 1 ? 'tomorrow ' : DAYS[di] + ' ') + fmtMin(starts[0]) };
  }
  return { s: 'closed', text: 'Closed' };
}
function hoursBlock(str) {
  const H = parseHours(str);
  if (!H) { const p = document.createElement('div'), s = document.createElement('strong'); p.className = 'pf-hours'; s.textContent = 'Hours'; p.append(s, str); return p; }
  const det = document.createElement('details'); det.className = 'pf-hrs';
  const sum = document.createElement('summary'), dot = document.createElement('span'), st = hoursStatus(H);
  dot.className = 'hdot ' + st.s; dot.setAttribute('aria-hidden', 'true'); sum.append(dot, st.text);
  const ul = document.createElement('ul'); ul.className = 'pf-hrs-list'; const today = nowIn(H.tz).d;
  hoursGroups(H).forEach(g => { const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span'); if (g.days.includes(today)) li.className = 'today'; a.textContent = g.label; b.textContent = g.text; li.append(a, b); ul.appendChild(li); });
  const tz = document.createElement('div'); tz.className = 'pf-hrs-tz'; tz.textContent = 'Times in ' + H.tz.replace(/_/g, ' ');
  det.append(sum, ul, tz); return det;
}

/* builder UI */
let HS = { tz: detectTz(), days: emptyDays() };
function commitHours() { $('hours').value = stringifyHours(HS); renderPreview(); scheduleSave(); }
function loadHoursFromHidden() { const p = parseHours($('hours').value); HS = p || { tz: HS.tz || detectTz(), days: emptyDays() }; $('tz').value = [...$('tz').options].some(o => o.value === HS.tz) ? HS.tz : detectTz(); syncHoursUI(); }
function defaultRanges() { const first = HS.days.find(d => d.open && !d.all24 && d.r.length); return first ? first.r.map(r => r.slice()) : [[540, 1080]]; }
function buildHoursUI() {
  const tzSel = $('tz'); let zones = []; try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { /* older browsers */ }
  const here = detectTz(); if (!zones.includes(here)) zones.unshift(here);
  zones.forEach(z => { const o = document.createElement('option'); o.value = z; o.textContent = z.replace(/_/g, ' '); tzSel.appendChild(o); }); tzSel.value = HS.tz;
  tzSel.addEventListener('change', () => { HS.tz = tzSel.value; commitHours(); });
  const grid = $('hoursGrid');
  DAYS.forEach((name, i) => {
    const row = document.createElement('div'); row.className = 'hrow'; row.dataset.d = i;
    const day = document.createElement('label'); day.className = 'day'; const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'open'; day.append(cb, name); day.title = DAYS_LONG[i];
    const state = document.createElement('span'); state.className = 'state';
    const ranges = document.createElement('div'); ranges.className = 'ranges';
    const mk = k => { const sp = document.createElement('span'); sp.className = 'range'; const f = document.createElement('input'), t = document.createElement('input'); f.type = t.type = 'time'; f.className = 'from'; t.className = 'to'; f.setAttribute('aria-label', DAYS_LONG[i] + (k ? ' second period opens' : ' opens')); t.setAttribute('aria-label', DAYS_LONG[i] + (k ? ' second period closes' : ' closes')); sp.append(f, '–', t);
      if (k) { const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.textContent = '×'; rm.setAttribute('aria-label', 'Remove second period for ' + DAYS_LONG[i]); sp.appendChild(rm); }
      const note = document.createElement('span'); note.className = 'next'; sp.appendChild(note); return sp; };
    ranges.append(mk(0), mk(1));
    const opts = document.createElement('div'); opts.className = 'opts';
    const add = document.createElement('button'); add.type = 'button'; add.className = 'mini add'; add.textContent = '+ Add hours';
    const l24 = document.createElement('label'), c24 = document.createElement('input'); c24.type = 'checkbox'; c24.className = 'all24'; l24.append(c24, '24 h'); opts.append(add, l24);
    row.append(day, state, ranges, opts); grid.appendChild(row);

    const d = () => HS.days[i];
    cb.addEventListener('change', () => { const x = d(); x.open = cb.checked; if (x.open && !x.all24 && !x.r.length) x.r = defaultRanges(); syncHoursUI(); commitHours(); });
    c24.addEventListener('change', () => { const x = d(); x.all24 = c24.checked; if (!x.all24 && !x.r.length) x.r = defaultRanges(); syncHoursUI(); commitHours(); });
    add.addEventListener('click', () => { const x = d(); if (x.r.length < 2) { const last = x.r[0] ? x.r[0][1] : 540; x.r.push([Math.min(last + 60, 1380), Math.min(last + 240, 1439)]); } syncHoursUI(); commitHours(); });
    ranges.querySelectorAll('.range').forEach((sp, k) => {
      const f = sp.querySelector('.from'), t = sp.querySelector('.to');
      const upd = () => { const a = fromTimeStr(f.value), b = fromTimeStr(t.value), x = d(); if (a == null || b == null || !x.r[k]) return; x.r[k] = [a, b]; t.setCustomValidity(a === b ? 'Closing time must differ from opening time.' : ''); syncHoursUI(); commitHours(); };
      f.addEventListener('input', upd); t.addEventListener('input', upd);
      if (k) sp.querySelector('.rm').addEventListener('click', () => { d().r.splice(1, 1); syncHoursUI(); commitHours(); });
    });
  });
  $('hoursGrid').parentNode.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
  syncHoursUI();
}
function applyPreset(p) {
  const days = emptyDays(), set = (idxs, a, b) => idxs.forEach(i => days[i] = { open: true, all24: false, r: [[a, b]] });
  if (p === 'weekdays') set([0, 1, 2, 3, 4], 540, 1020);
  else if (p === 'sixdays') set([0, 1, 2, 3, 4, 5], 540, 1080);
  else if (p === 'daily') set([0, 1, 2, 3, 4, 5, 6], 540, 1260);
  else if (p === '247') for (let i = 0; i < 7; i++) days[i] = { open: true, all24: true, r: [] };
  else if (p === 'copy') { const src = HS.days.find(d => d.open); if (!src) { toast('Set the hours for one day first.'); return; } for (let i = 0; i < 7; i++) days[i] = { open: true, all24: src.all24, r: src.r.map(r => r.slice()) }; }
  HS.days = days; syncHoursUI(); commitHours();
}
function syncHoursUI() {
  $('hoursGrid').querySelectorAll('.hrow').forEach(row => {
    const x = HS.days[+row.dataset.d];
    row.classList.toggle('on', x.open); row.querySelector('.open').checked = x.open; row.querySelector('.all24').checked = x.all24;
    row.querySelector('.state').hidden = x.open && !x.all24; row.querySelector('.state').textContent = !x.open ? 'Closed' : x.all24 ? 'Open 24 hours' : '';
    row.querySelector('.ranges').hidden = !x.open || x.all24; row.querySelector('.opts').hidden = !x.open;
    row.querySelector('.add').hidden = x.all24 || x.r.length > 1;
    row.querySelectorAll('.range').forEach((sp, k) => {
      const r = x.r[k]; sp.hidden = !r || x.all24; if (!r) return;
      const f = sp.querySelector('.from'), t = sp.querySelector('.to'); if (f.value !== toTimeStr(r[0])) f.value = toTimeStr(r[0]); if (t.value !== toTimeStr(r[1])) t.value = toTimeStr(r[1]);
      sp.querySelector('.next').textContent = r[1] < r[0] ? 'closes next day' : '';
    });
  });
}

/* ---------- sample profile ---------- */
const SAMPLE = { business: 'Hydra Juice', tagline: 'Your daily dose of vitamin C', phone: '+919800000000', whatsapp: '+919800000000', email: 'hello@hydrajuice.com', location: '12 MG Road, Bengaluru', hours: 'v1|Asia/Kolkata|0800-2100;0800-2100;0800-2100;0800-2100;0800-2100;0800-2100;0900-1800', instagram: '@hydrajuice', facebook: 'hydrajuice', youtube: '@hydrajuice', gmb: '', website: 'hydrajuice.com' };

/* ---------- form <-> data ---------- */
function formData() { const d = {}; fields.forEach(id => d[id] = $(id).value); return d; }
function isBlank() { return !['business', 'tagline', 'phoneLocal', 'email', 'location', 'hours', 'instagram', 'facebook', 'youtube', 'gmb', 'website'].some(id => $(id).value.trim()); }
function renderPreview() {
  const blank = isBlank(), d = formData();
  $('exampleBadge').hidden = !blank;
  const data = blank ? Object.assign({}, SAMPLE, { gradientStart: d.gradientStart, gradientEnd: d.gradientEnd, pageColor: d.pageColor, pattern: d.pattern }) : d;
  renderProfile($('previewProfile'), data, blank ? '' : logoData, {});
}

/* ---------- phone (country + number, via libphonenumber) ---------- */
function initCountries() {
  const sel = $('phoneCountry'); let names; try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { names = { of: c => c }; }
  const list = LP.getCountries().map(c => ({ c, name: names.of(c) || c, cc: LP.getCountryCallingCode(c) })).sort((a, b) => a.name.localeCompare(b.name));
  list.forEach(x => { const o = document.createElement('option'); o.value = x.c; o.textContent = x.name + ' (+' + x.cc + ')'; sel.appendChild(o); });
  const region = ((navigator.language || '').split('-')[1] || '').toUpperCase();
  sel.value = list.some(x => x.c === region) ? region : 'IN';
  sel.dataset.def = sel.value;
}
const PHONE_HINT = 'Pick your country, then type the number — no need to add the code.';
function updatePhone() {
  const sel = $('phoneCountry'), input = $('phoneLocal'), raw = input.value.trim();
  let pn = null; if (raw) { try { pn = LP.parsePhoneNumberFromString(raw, sel.value); } catch (e) { pn = null; } }
  const ok = !!(pn && pn.isValid());
  if (ok && raw.startsWith('+') && pn.country && pn.country !== sel.value && [...sel.options].some(o => o.value === pn.country)) sel.value = pn.country;
  input.setCustomValidity(!raw || ok ? '' : "That doesn't look like a valid phone number for the selected country.");
  $('phone').value = ok ? pn.number : '';
  $('whatsapp').value = ok && $('waCheck').checked ? pn.number : '';
  const hint = $('phoneHint'); hint.textContent = ''; if (ok) { hint.append('Saved as '); const b = document.createElement('b'); b.textContent = pn.formatInternational(); hint.append(b); } else hint.textContent = PHONE_HINT;
  renderPreview();
}

/* ---------- link-field validation (handles, bare domains) ---------- */
function checkLinks() {
  [['instagram', 'instagram'], ['facebook', 'facebook'], ['youtube', 'youtube']].forEach(([id, kind]) => { const v = $(id).value.trim(); $(id).setCustomValidity(!v || socialUrl(kind, v) ? '' : 'Enter a @handle, a domain like ' + SOCIAL[kind].hosts[0] + '/you, or a full link.'); });
  [['website', 'a website like yourwebsite.com'], ['gmb', 'a link like https://maps.google.com/…']].forEach(([id, msg]) => { const v = $(id).value.trim(); $(id).setCustomValidity(!v || webUrl(v) ? '' : 'Enter ' + msg + '.'); });
  const e = $('email').value.trim(); $('email').setCustomValidity(!e || mailUrl(e) ? '' : 'Enter a valid email address.');
}

/* ---------- themes UI ---------- */
function renderThemes() {
  const box = $('themes');
  THEMES.forEach(t => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'theme'; b.setAttribute('role', 'radio'); b.dataset.id = t.id; b.setAttribute('aria-checked', 'false');
    const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = `linear-gradient(135deg,${t.a},${t.b})`; sw.style.setProperty('--dot', t.c);
    const n = document.createElement('span'); n.textContent = t.name; b.append(sw, n);
    b.addEventListener('click', () => { applyTheme(t.id); scheduleSave(); });
    box.appendChild(b);
  });
}
function markTheme(id) { currentTheme = id; $('themes').querySelectorAll('.theme').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === id))); }
function applyTheme(id) { const t = THEMES.find(x => x.id === id); if (!t) return; $('gradientStart').value = t.a; $('gradientEnd').value = t.b; $('pageColor').value = t.c; markTheme(id); updateSwatches(); syncQr(); renderPreview(); }
function renderPatterns() {
  const box = $('patterns');
  PATTERNS.forEach(p => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'theme pat'; b.setAttribute('role', 'radio'); b.dataset.id = p.id; b.setAttribute('aria-checked', 'false');
    const sw = document.createElement('span'); sw.className = 'sw'; const n = document.createElement('span'); n.textContent = p.name; b.append(sw, n);
    b.addEventListener('click', () => { setPattern(p.id); scheduleSave(); }); box.appendChild(b);
  });
}
function markPattern(id) { $('patterns').querySelectorAll('.theme').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === id))); }
function setPattern(id) { $('pattern').value = id; markPattern(id); renderPreview(); }
function updateSwatches() {
  const g = `linear-gradient(135deg,${$('gradientStart').value},${$('gradientEnd').value})`, fg = textColorFor($('gradientStart').value, $('gradientEnd').value);
  $('patterns').querySelectorAll('.theme').forEach(b => { const sw = b.firstChild, id = b.dataset.id; if (TILES[id]) { sw.style.backgroundImage = patternImage(id, fg) + ', ' + g; sw.style.backgroundSize = Math.round(TILES[id][0] * .7) + 'px, 100% 100%'; sw.style.backgroundRepeat = 'repeat, no-repeat'; } else sw.style.background = g; });
}
function surprise() {
  const cur = $('pattern').value; let t, p;
  do { t = THEMES[Math.floor(Math.random() * THEMES.length)]; } while (t.id === currentTheme);
  do { p = PATTERNS[1 + Math.floor(Math.random() * (PATTERNS.length - 1))]; } while (p.id === cur);
  applyTheme(t.id); setPattern(p.id); scheduleSave();
}
function detectTheme() { const a = $('gradientStart').value.toLowerCase(), b = $('gradientEnd').value.toLowerCase(), c = $('pageColor').value.toLowerCase(); const t = THEMES.find(x => x.a === a && x.b === b && x.c === c); markTheme(t ? t.id : null); }

/* ---------- draft (localStorage) ---------- */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
let saveT;
function scheduleSave() { clearTimeout(saveT); saveT = setTimeout(saveDraft, 500); }
function saveDraft() {
  const note = $('draftNote');
  if (isBlank()) { lsDel(DRAFT_KEY); note.textContent = ''; return; }
  const v = {}; DRAFT_IDS.forEach(id => v[id] = $(id).value);
  const state = { v, wa: $('waCheck').checked, qa: $('qrAuto').checked, theme: currentTheme, logo: logoData };
  let ok = lsSet(DRAFT_KEY, JSON.stringify(state));
  if (!ok) { state.logo = ''; ok = lsSet(DRAFT_KEY, JSON.stringify(state)); }
  note.textContent = ok ? 'Draft saved on this device' : '';
}
function setLogo(data) {
  logoData = data && LOGO.test(data) ? data : ''; logoColor = ''; const p = $('logoPreview'); p.textContent = '';
  if (logoData) { const i = document.createElement('img'); i.alt = ''; i.src = logoData; p.appendChild(i); } else p.textContent = '✦';
  syncQr(); const mine = logoData; if (mine) logoDominant(mine).then(c => { if (logoData === mine) { logoColor = c; syncQr(); } });
}
function restoreDraft() {
  const raw = lsGet(DRAFT_KEY); if (!raw) return false;
  try {
    const s = JSON.parse(raw); if (!s || typeof s.v !== 'object') return false;
    DRAFT_IDS.forEach(id => { if (typeof s.v[id] === 'string') $(id).value = s.v[id]; });
    loadHoursFromHidden(); $('waCheck').checked = !!s.wa; $('qrAuto').checked = s.qa !== false; markPattern($('pattern').value || 'none'); setLogo(s.logo);
    if (THEMES.some(t => t.id === s.theme)) markTheme(s.theme); else detectTheme(); updateSwatches(); syncQr();
    return true;
  } catch (e) { return false; }
}

/* ---------- encode / decode (UTF-8 safe) ---------- */
function encode(obj) { const bytes = new TextEncoder().encode(JSON.stringify(obj)); let s = ''; bytes.forEach(b => s += String.fromCharCode(b)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decode(s) { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)))); }
function validateProfile(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('shape');
  const out = {};
  textFields.forEach(k => { const v = d[k] == null ? '' : d[k]; if (typeof v !== 'string' || v.length > 500) throw new Error('field'); out[k] = v; });
  if (!out.business.trim()) throw new Error('name');
  out.gradientStart = color(d.gradientStart, '#6b7d6e'); out.gradientEnd = color(d.gradientEnd, '#4a5b4e'); out.pageColor = color(d.pageColor, '#2f4a3a'); out.qrColor = color(d.qrColor, '#0d6b51');
  out.pattern = PATTERNS.some(p => p.id === d.pattern) ? d.pattern : 'none';
  return out;
}
function fillFromProfile(d) {
  ['business', 'tagline', 'email', 'location', 'hours', 'instagram', 'facebook', 'youtube', 'gmb', 'website'].forEach(id => $(id).value = d[id] || '');
  $('phoneLocal').value = '';
  if (validE164(d.phone)) { try { const pn = LP.parsePhoneNumberFromString(d.phone); if (pn && [...$('phoneCountry').options].some(o => o.value === pn.country)) $('phoneCountry').value = pn.country; $('phoneLocal').value = pn ? pn.nationalNumber : ''; } catch (e) { /* ignore */ } }
  $('waCheck').checked = !!d.whatsapp && d.whatsapp === d.phone;
  ['pageColor', 'gradientStart', 'gradientEnd'].forEach(id => { if (d[id]) $(id).value = d[id]; });
  if (d.qrColor && COLOR.test(d.qrColor)) { $('qrColor').value = d.qrColor; $('qrAuto').checked = false; }
  $('pattern').value = PATTERNS.some(p => p.id === d.pattern) ? d.pattern : 'none'; markPattern($('pattern').value);
  detectTheme(); updateSwatches(); syncQr(); loadHoursFromHidden(); checkLinks(); updatePhone(); scheduleSave();
}

/* ---------- QR (generated locally; nothing leaves the browser) ---------- */
function makeQr(url, hasLogo) {
  for (const lv of hasLogo ? ['H', 'Q'] : ['H', 'Q', 'M', 'L']) { try { const q = qrcode(0, lv); q.addData(url); q.make(); return q; } catch (e) { /* try a lower correction level */ } }
  return null;
}
function qrSvg(qr, fg, logo) {
  const n = qr.getModuleCount(), m = 4, size = n + m * 2; let p = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) p += `M${c + m} ${r + m}h1v1h-1z`;
  let extra = '';
  if (logo) { const s = n * .22, x = (size - s) / 2, pad = s * .12; extra = `<rect x="${x - pad}" y="${x - pad}" width="${s + pad * 2}" height="${s + pad * 2}" rx="${pad * 1.5}" fill="#fff"/><image href="${logo}" x="${x}" y="${x}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size * 10}" height="${size * 10}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${p}" fill="${fg}"/>${extra}</svg>`;
}
const qrName = () => (slugify($('business').value) || 'beacon') + '-qr';
$('dlSvg').addEventListener('click', () => { if (!lastQr) return; const url = URL.createObjectURL(new Blob([lastQr], { type: 'image/svg+xml' })); download(url, qrName() + '.svg'); setTimeout(() => URL.revokeObjectURL(url), 1000); });
$('dlPng').addEventListener('click', () => {
  if (!lastQr) return; const img = new Image();
  img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 1000; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#fff'; x.fillRect(0, 0, 1000, 1000); x.drawImage(img, 0, 0, 1000, 1000); c.toBlob(b => { const u = URL.createObjectURL(b); download(u, qrName() + '.png'); setTimeout(() => URL.revokeObjectURL(u), 1000); }); };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lastQr);
});
$('copyLink').addEventListener('click', () => lastUrl && copyText(lastUrl));
$('shareLink').addEventListener('click', () => lastUrl && shareLink(lastUrl, $('business').value.trim() || 'Beacon'));

function showError(m) { const e = $('formError'); e.textContent = m; e.hidden = false; }
function clearError() { $('formError').hidden = true; }

$('profileForm').addEventListener('submit', e => {
  e.preventDefault(); clearError(); checkLinks(); updatePhoneValidityOnly();
  if (!e.target.reportValidity()) return;
  if (contrastOnWhite($('qrColor').value) < 4.5) { showError('That QR colour is too light to scan reliably. Choose a darker colour.'); $('qrColor').focus(); return; }
  const data = {}; fields.forEach(id => data[id] = $(id).value.trim());
  const hash = 'p=' + encode(data), url = location.href.split('#')[0] + '#' + hash;
  const qr = makeQr(url, !!logoData);
  if (!qr) { showError('Your details are too long to fit in a QR code. Shorten the text (for example the opening hours) and try again.'); return; }
  lastUrl = url; lastQr = qrSvg(qr, $('qrColor').value, logoData);
  $('qrImage').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(lastQr);
  $('openLink').href = url; $('shareUrl').textContent = url;
  $('hostWarn').hidden = !(location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));
  lsSet(MINE_KEY, hash); saveDraft();
  const r = $('result'); r.hidden = false;
  r.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  r.focus({ preventScroll: true });
});
function updatePhoneValidityOnly() { updatePhone(); }

$('reset').addEventListener('click', () => {
  if (!confirm('Clear all details?')) return;
  $('profileForm').reset(); $('logo').value = ''; setLogo(''); lastUrl = ''; lastQr = null; $('result').hidden = true; clearError();
  $('phoneCountry').value = $('phoneCountry').dataset.def; $('pattern').value = 'doodles'; $('hours').value = ''; markPattern('doodles'); loadHoursFromHidden(); applyTheme('sage'); checkLinks(); updatePhone(); lsDel(DRAFT_KEY); $('draftNote').textContent = '';
});
$('fillExample').addEventListener('click', () => { fillFromProfile(SAMPLE); toast('Example loaded — change anything you like.'); });

/* ---------- load an existing profile link ---------- */
function parseProfileLink(text) { const i = (text || '').indexOf('#p='); if (i < 0) throw new Error('nolink'); return validateProfile(decode(text.slice(i + 3).trim())); }
$('loadBtn').addEventListener('click', () => {
  const msg = $('loadMsg');
  try { const d = parseProfileLink($('loadUrl').value); fillFromProfile(d); msg.textContent = 'Loaded ✓ — edit anything, then create a new QR code (it will have a new link).'; $('workspace').dataset.view = 'edit'; }
  catch (e) { msg.textContent = "That doesn't look like a Beacon profile link."; }
});

/* ---------- logo upload ---------- */
$('logo').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 500000) { showError('Please choose a logo under 500 KB.'); e.target.value = ''; return; }
  clearError();
  const r = new FileReader();
  r.onload = () => { if (!LOGO.test(r.result)) { showError('That image type is not supported. Use PNG, JPG or WebP.'); return; } setLogo(r.result); renderPreview(); scheduleSave(); };
  r.readAsDataURL(f);
});

/* ---------- mobile Edit / Preview toggle ---------- */
function setView(v) { $('workspace').dataset.view = v; $('tabEdit').setAttribute('aria-selected', String(v === 'edit')); $('tabPreview').setAttribute('aria-selected', String(v === 'preview')); window.scrollTo({ top: 0 }); }
$('tabEdit').addEventListener('click', () => setView('edit'));
$('tabPreview').addEventListener('click', () => setView('preview'));

/* ---------- public profile ---------- */
const BASE_TITLE = document.title;
function showBuilder(d) {
  $('profilePage').hidden = true; $('builder').hidden = false; document.title = BASE_TITLE; document.body.style.background = '';
  const m = $('robotsMeta'); if (m) m.remove();
  fillFromProfile(d); history.replaceState(null, '', location.pathname + location.search); window.scrollTo({ top: 0 });
  toast('Editing your profile. Creating a new QR code will give you a new link.');
}
function showPublic(d, hash) {
  $('builder').hidden = true; $('profilePage').hidden = false;
  document.body.style.background = color(d.gradientEnd, '#4a5b4e');
  document.title = d.business + ' — Beacon';
  const m = document.createElement('meta'); m.id = 'robotsMeta'; m.name = 'robots'; m.content = 'noindex,nofollow'; document.head.appendChild(m);
  const mine = lsGet(MINE_KEY) === hash;
  renderProfile($('publicProfile'), d, '', { heading: 'h1', footer: true, url: location.href, owner: mine ? () => showBuilder(d) : null });
  $('publicProfile').style.minHeight = '100vh';
}

/* ---------- boot ---------- */
initCountries(); renderThemes(); renderPatterns(); buildHoursUI(); markPattern('doodles'); applyTheme('sage');
$('surprise').addEventListener('click', surprise);
$('qrAuto').addEventListener('change', () => { syncQr(); scheduleSave(); });
fields.filter(id => !['phone', 'whatsapp'].includes(id)).forEach(id => $(id).addEventListener('input', () => {
  if (['pageColor', 'gradientStart', 'gradientEnd'].includes(id)) { detectTheme(); updateSwatches(); syncQr(); }
  if (id === 'qrColor') { $('qrAuto').checked = false; syncQr(); }
  checkLinks(); renderPreview(); scheduleSave();
}));
['phoneCountry', 'phoneLocal', 'waCheck'].forEach(id => { $(id).addEventListener('input', () => { updatePhone(); scheduleSave(); }); $(id).addEventListener('change', () => { updatePhone(); scheduleSave(); }); });
window.addEventListener('hashchange', () => location.reload());

let shown = false;
if (location.hash.startsWith('#p=')) {
  try { showPublic(validateProfile(decode(location.hash.slice(3))), location.hash.slice(1)); shown = true; } catch (e) { $('linkError').hidden = false; }
}
if (!shown) { restoreDraft(); checkLinks(); updatePhone(); if (!isBlank()) $('draftNote').textContent = 'Draft restored from this device'; }
