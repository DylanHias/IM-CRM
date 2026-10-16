// ================= Icons =================
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  pipeline: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  reports: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  meeting: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  visit: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  call: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checksq: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
  square: '<rect x="3" y="3" width="18" height="18" rx="3"/>',
  chev: '<path d="m9 18 6-6-6-6"/>', chevl: '<path d="m15 18-6-6 6-6"/>', chevd: '<path d="m6 9 6 6 6-6"/>',
  chevsl: '<path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>', chevsr: '<path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  alertc: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  checkc: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  xc: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  board: '<rect x="3" y="3" width="7" height="18" rx="1.5"/><rect x="14" y="3" width="7" height="11" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  ext: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M3 21v-5h5"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  tag: '<path d="M12 2H2v10l9.3 9.3a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7" cy="7" r="1.5"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  phone2: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  trenddown: '<path d="m22 17-8.5-8.5-5 5L2 7"/><path d="M16 17h6v-6"/>',
  minus: '<path d="M5 12h14"/>',
  bar: '<path d="M12 20V10M18 20V4M6 20v-4"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bug: '<path d="M8 2l1.9 1.9M16 2l-1.9 1.9M9 7.1V6a3 3 0 1 1 6 0v1.1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6M12 20v-9M6.5 13H3M21 13h-3.5M6 9 3.5 7M18 9l2.5-2M6 17l-2.5 2M18 17l2.5 2"/>',
  keyboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  play: '<path d="m6 3 14 9-14 9z"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  terminal: '<path d="m4 17 6-6-6-6M12 19h8"/>',
  pie: '<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  hdd: '<path d="M22 12H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1zM6 16h.01M10 16h.01"/>',
  swap: '<path d="m8 3-4 4 4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2a10 10 0 0 0 0 20c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.6-1.6h2A5.6 5.6 0 0 0 22 10.9C22 6 17.5 2 12 2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.8 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.2.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0Z"/>',
  octx: '<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="m15 9-6 6M9 9l6 6"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  wifi: '<path d="M5 12.6a10 10 0 0 1 14 0M1.4 9a15 15 0 0 1 21.2 0M8.5 16.4a5 5 0 0 1 7 0M12 20h.01"/>',
  wifioff: '<path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 5.2-2.8M19 12.6a10 10 0 0 0-2-1.5M1.4 9a15 15 0 0 1 4.3-2.9M22.6 9A15 15 0 0 0 10.7 4.6M12 20h.01"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  arrowud: '<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
  arrowl: '<path d="M19 12H5M12 19l-7-7 7-7"/>', arrowr: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowup: '<path d="m5 12 7-7 7 7M12 19V5"/>', arrowdown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  combine: '<rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4M17 13V9a2 2 0 0 0-2-2h-4"/>',
  split: '<path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.2-2.8L3 3M15 9l6-6"/>',
  columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8M3 3v5h5"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.5M7.8 16.2a6 6 0 0 1 0-8.5M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  window: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20"/>',
};
const ic = (n, s = 16) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
const icI = (n, s = 12) => ic(n, s).replace('class="ic"', 'class="ic" style="display:inline;vertical-align:-2px"');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ================= Logo (no letters) =================
let logoN = 0;
function logoSvg(v, size = 18, flat = false) {
  const id = 'lg' + (logoN++);
  const bg = flat ? 'currentColor' : `url(#${id})`;
  const defs = flat ? '' : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-deep)"/></linearGradient></defs>`;
  const fg = flat ? 'var(--surface)' : '#ffffff';
  const marks = {
    pathway: `<path d="M7.2 17.2C7.2 11.6 16.8 13.4 16.8 7.4" fill="none" stroke="${fg}" stroke-width="2.3" stroke-linecap="round"/><circle cx="7.2" cy="17.2" r="2.3" fill="${fg}" fill-opacity="0.75"/><circle cx="16.8" cy="7" r="2.9" fill="${fg}"/>`,
    stages: `<rect x="5" y="12.5" width="3.6" height="6.5" rx="1.8" fill="${fg}" fill-opacity="0.55"/><rect x="10.2" y="9" width="3.6" height="10" rx="1.8" fill="${fg}" fill-opacity="0.78"/><rect x="15.4" y="5" width="3.6" height="14" rx="1.8" fill="${fg}"/>`,
    orbit: `<ellipse cx="12" cy="12" rx="8" ry="4.2" transform="rotate(-32 12 12)" fill="none" stroke="${fg}" stroke-width="1.7" stroke-opacity="0.8"/><circle cx="12" cy="12" r="3.1" fill="${fg}"/><circle cx="18.6" cy="7.6" r="1.7" fill="${fg}"/>`,
  };
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${defs}<rect width="24" height="24" rx="6.5" fill="${bg}"/>${marks[v] || marks.pathway}</svg>`;
}

// ================= Format =================
const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eurK = (v) => Math.abs(v) >= 1e6 ? `€${(v / 1e6).toFixed(2)}M` : Math.abs(v) >= 1e3 ? `€${Math.round(v / 1e3)}K` : `€${Math.round(v)}`;
const compact = (v) => Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)}k` : String(Math.round(v));
const initials = (n) => n.replace(/\b(NV|SA|BV|vzw|Group)\b/g, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const PASTEL = ['#e3ecff,#2f5bd3', '#e1f4ef,#11805a', '#f5e9ff,#7444d4', '#fff1dc,#b25e09', '#ffe5ea,#c4304f', '#e0f4f8,#0d7c8f', '#eef0d8,#6b7a12', '#ffe9e0,#c2531f', '#e8eaf2,#4a4f66', '#f0e6ff,#5b3fd6'];
const pastel = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const [b, f] = PASTEL[h % PASTEL.length].split(','); return `background:color-mix(in oklch, ${f} 14%, var(--surface));color:${f}`; };

// ================= Sample data (illustrative only) =================
const ME = { first: 'Dylan', name: 'Dylan Hias', email: 'dylan.hias@example.com', title: 'Cloud Sales Specialist', city: 'Mechelen, Belgium', birthday: '14 October', admin: true };
const OWNERS = ['Dylan Hias', 'Lien Verhoeven', 'Thomas Peeters', 'Sarah Dubois'];
const CUSTOMERS = [
  { name: 'Brabant Logistics NV', city: 'Mechelen', country: 'Belgium', lang: 'NL', cloud: true, arr: 184200, chg: 6.4, acct: 'BE-104882', bcn: '1048820', ind: 'Logistics', seg: 'Mid-market', owner: 0, active: true, h: 86, hr: 100, hp: 75, hf: 70, last: 1, fav: true, src: 'live' },
  { name: 'Scheldt Port Systems', city: 'Antwerp', country: 'Belgium', lang: 'NL', cloud: true, arr: 162900, chg: 11.2, acct: 'BE-100417', bcn: '1004170', ind: 'Transport', seg: 'Enterprise', owner: 0, active: true, h: 79, hr: 85, hp: 75, hf: 70, last: 2, fav: true, src: 'live' },
  { name: 'Gentse Zorggroep vzw', city: 'Ghent', country: 'Belgium', lang: 'NL', cloud: true, arr: 141300, chg: 3.0, acct: 'BE-101209', bcn: '1012090', ind: 'Healthcare', seg: 'Public', owner: 0, active: true, h: 74, hr: 100, hp: 55, hf: 70, last: 0, fav: false, src: 'live' },
  { name: 'Liège Medical Imaging', city: 'Liège', country: 'Belgium', lang: 'FR', cloud: false, arr: 118700, chg: -2.1, acct: 'BE-103351', bcn: '1033510', ind: 'Healthcare', seg: 'Mid-market', owner: 1, active: true, h: 61, hr: 85, hp: 55, hf: 40, last: 2, fav: false, src: 'synced' },
  { name: 'Leuven Biotech Campus', city: 'Leuven', country: 'Belgium', lang: 'EN', cloud: true, arr: 109450, chg: 14.8, acct: 'BE-105020', bcn: '1050200', ind: 'Life sciences', seg: 'Enterprise', owner: 0, active: true, h: 82, hr: 100, hp: 75, hf: 70, last: 0, fav: true, src: 'live' },
  { name: 'Maison Delvaux Hôtellerie', city: 'Namur', country: 'Belgium', lang: 'FR', cloud: false, arr: 86200, chg: 1.2, acct: 'BE-102776', bcn: '1027760', ind: 'Hospitality', seg: 'SMB', owner: 2, active: true, h: 58, hr: 65, hp: 75, hf: 40, last: 12, fav: false, src: 'live' },
  { name: 'Kortrijk Textile Works', city: 'Kortrijk', country: 'Belgium', lang: 'NL', cloud: true, arr: 74800, chg: -4.6, acct: 'BE-100965', bcn: '1009650', ind: 'Manufacturing', seg: 'Mid-market', owner: 0, active: true, h: 44, hr: 35, hp: 55, hf: 40, last: 5, fav: false, src: 'synced' },
  { name: 'Limburg Precision Tools', city: 'Hasselt', country: 'Belgium', lang: 'NL', cloud: false, arr: 66300, chg: 2.7, acct: 'BE-104120', bcn: '1041200', ind: 'Manufacturing', seg: 'SMB', owner: 3, active: true, h: 52, hr: 85, hp: 55, hf: 0, last: 1, fav: false, src: 'live' },
  { name: 'Ardennes Bois SA', city: 'Bastogne', country: 'Belgium', lang: 'FR', cloud: false, arr: 41900, chg: 0.4, acct: 'BE-106338', bcn: '1063380', ind: 'Forestry', seg: 'SMB', owner: 2, active: true, h: 21, hr: 0, hp: 55, hf: 0, last: 94, fav: false, src: 'synced' },
  { name: 'Brugse Retail Group', city: 'Bruges', country: 'Belgium', lang: 'NL', cloud: true, arr: 38650, chg: 8.9, acct: 'BE-105874', bcn: '1058740', ind: 'Retail', seg: 'SMB', owner: 0, active: true, h: 63, hr: 65, hp: 10, hf: 70, last: 5, fav: false, src: 'live' },
  { name: 'Waasland Food Partners', city: 'Sint-Niklaas', country: 'Belgium', lang: 'NL', cloud: true, arr: 35200, chg: 5.1, acct: 'BE-107012', bcn: '1070120', ind: 'Food', seg: 'SMB', owner: 1, active: true, h: 36, hr: 15, hp: 55, hf: 40, last: 71, fav: false, src: 'synced' },
  { name: 'Charleroi Steel Services', city: 'Charleroi', country: 'Belgium', lang: 'FR', cloud: false, arr: 29800, chg: -1.3, acct: 'BE-106701', bcn: '', ind: 'Industrial', seg: 'SMB', owner: 3, active: false, h: 12, hr: 0, hp: 10, hf: 40, last: 120, fav: false, src: 'synced' },
];
const CPOOL = [['Pieter', 'Janssens', 'Head of IT'], ['Sofie', 'Claes', 'Procurement lead'], ['Marc', 'Dubois', 'CFO'], ['Elke', 'Peeters', 'Cloud architect'], ['Anke', 'Vermeulen', 'CIO'], ['Tom', 'Wouters', 'Infrastructure manager'], ['Claire', 'Lambert', 'CISO'], ['Jens', 'De Smet', 'DevOps lead'], ['Lotte', 'Maes', 'IT buyer'], ['Nina', 'Hendrickx', 'Marketing manager'], ['Luc', 'Mertens', 'Operations director'], ['Ines', 'Willems', 'Service desk lead']];
const contactsFor = (c) => { const i = CUSTOMERS.indexOf(c); return [0, 1, 2, 3].map((k) => { const [f, l, t] = CPOOL[(i * 3 + k) % CPOOL.length]; return { f, l, t, email: `${f}.${l.replace(/\s/g, '')}@example.be`.toLowerCase(), phone: '+32 15 28 4' + (10 + k * 7), mobile: k % 2 ? '' : '+32 478 22 9' + (10 + k), notes: k === 0 ? 'Prefers calls before 10:00. Decision maker for cloud spend.' : '', primary: k === 0 }; }); };
const STAGES = ['Prospecting', 'Validated', 'Qualified', 'Verbal Received', 'Contract Received', 'Billing Rejection', 'Pending Vendor Confirmation', 'Purchased'];
const PROB = { 'Prospecting': 5, 'Validated': 20, 'Qualified': 40, 'Verbal Received': 80, 'Contract Received': 95, 'Billing Rejection': 95, 'Pending Vendor Confirmation': 95, 'Purchased': 95 };
const VENDORS_D365 = ['AWS - CONSOLIDATED', 'AWS - STANDALONE', 'MICROSOFT - AZURE', 'MICROSOFT - CLOUD', 'MICROSOFT - DYNAMICS 365 NCE', 'MICROSOFT - MODERN WORKPLACE'];
const OPPS = [
  { s: 'BE - Cloud consolidation - Brabant Logistics - AWS - 96K', c: 'Brabant Logistics NV', v: 'AWS - CONSOLIDATED', val: 96500, st: 'Qualified', exp: '2026-11-28', idle: 4, status: 'Open', o2: 'Lien Verhoeven', num: 'OPP-24811' },
  { s: 'BE - NGFW perimeter - Liège Medical - Palo Alto via Azure - 74K', c: 'Liège Medical Imaging', v: 'MICROSOFT - AZURE', val: 74200, st: 'Verbal Received', exp: '2026-10-31', idle: 2, status: 'Open', o2: '', num: 'OPP-24790' },
  { s: 'BE - M365 E5 renewal 420 seats - Gentse Zorggroep - 151K', c: 'Gentse Zorggroep vzw', v: 'MICROSOFT - MODERN WORKPLACE', val: 151200, st: 'Contract Received', exp: '2026-10-19', idle: 1, status: 'Open', o2: 'Thomas Peeters', num: 'OPP-24702' },
  { s: 'BE - vSphere consolidation - Kortrijk Textile - 39K', c: 'Kortrijk Textile Works', v: 'MICROSOFT - AZURE', val: 38900, st: 'Prospecting', exp: '2027-01-15', idle: 41, status: 'Open', o2: '', num: 'OPP-24555' },
  { s: 'BE - Azure landing zone - Leuven Biotech - 128K', c: 'Leuven Biotech Campus', v: 'MICROSOFT - AZURE', val: 128000, st: 'Validated', exp: '2026-12-12', idle: 6, status: 'Open', o2: 'Sarah Dubois', num: 'OPP-24833' },
  { s: 'BE - Storage tier migration - Scheldt Port - AWS - 212K', c: 'Scheldt Port Systems', v: 'AWS - STANDALONE', val: 212400, st: 'Qualified', exp: '2026-12-05', idle: 9, status: 'Open', o2: '', num: 'OPP-24820' },
  { s: 'BE - Acrobat Pro team licences - Brugse Retail - 13K', c: 'Brugse Retail Group', v: 'MICROSOFT - CLOUD', val: 12600, st: 'Purchased', exp: '2026-09-30', idle: 0, status: 'Won', o2: '', num: 'OPP-24401' },
  { s: 'BE - Backup vault - Leuven Biotech - AWS - 27K', c: 'Leuven Biotech Campus', v: 'AWS - STANDALONE', val: 27300, st: 'Prospecting', exp: '2027-01-20', idle: 37, status: 'Open', o2: '', num: 'OPP-24610' },
  { s: 'BE - Defender for Endpoint - Maison Delvaux - 23K', c: 'Maison Delvaux Hôtellerie', v: 'MICROSOFT - CLOUD', val: 22800, st: 'Validated', exp: '2026-11-30', idle: 12, status: 'Open', o2: 'Lien Verhoeven', num: 'OPP-24688' },
  { s: 'BE - Teams Rooms licences - Limburg Precision - 32K', c: 'Limburg Precision Tools', v: 'MICROSOFT - MODERN WORKPLACE', val: 31500, st: 'Billing Rejection', exp: '2026-10-22', idle: 3, status: 'Open', o2: '', num: 'OPP-24750' },
  { s: 'BE - Marketplace private offer - Scheldt Port - AWS - 44K', c: 'Scheldt Port Systems', v: 'AWS - CONSOLIDATED', val: 44100, st: 'Pending Vendor Confirmation', exp: '2026-10-24', idle: 5, status: 'Open', o2: '', num: 'OPP-24799' },
  { s: 'BE - Edge servers - Ardennes Bois - 59K', c: 'Ardennes Bois SA', v: 'MICROSOFT - AZURE', val: 58700, st: 'Prospecting', exp: '2027-02-28', idle: 96, status: 'Open', o2: '', num: 'OPP-24302' },
  { s: 'BE - Azure reserved instances - Brabant Logistics - 64K', c: 'Brabant Logistics NV', v: 'MICROSOFT - AZURE', val: 64000, st: 'Verbal Received', exp: '2026-11-07', idle: 8, status: 'Open', o2: '', num: 'OPP-24805' },
  { s: 'BE - Dynamics 365 Sales - Gentse Zorggroep - 42K', c: 'Gentse Zorggroep vzw', v: 'MICROSOFT - DYNAMICS 365 NCE', val: 41800, st: 'Validated', exp: '2026-12-15', idle: 15, status: 'Open', o2: '', num: 'OPP-24771' },
  { s: 'BE - MFA rollout - Kortrijk Textile - 19K', c: 'Kortrijk Textile Works', v: 'MICROSOFT - CLOUD', val: 18900, st: 'Purchased', exp: '2026-08-14', idle: 0, status: 'Won', o2: '', num: 'OPP-24380' },
  { s: 'BE - Contact centre - Maison Delvaux - AWS - 87K', c: 'Maison Delvaux Hôtellerie', v: 'AWS - STANDALONE', val: 87300, st: 'Qualified', exp: '2026-12-10', idle: 21, status: 'Open', o2: '', num: 'OPP-24722' },
  { s: 'BE - Workplace refresh - Waasland Food - 15K', c: 'Waasland Food Partners', v: 'MICROSOFT - MODERN WORKPLACE', val: 15400, st: 'Prospecting', exp: '2026-09-01', idle: 64, status: 'Lost', o2: '', num: 'OPP-24190' },
];
const TASKS = [
  { t: 'Call back Pieter Janssens about the consolidation quote', c: 'Brabant Logistics NV', due: 'Yesterday', grp: 'Overdue', over: true, d: 'Confirm whether the six AWS accounts can move under one payer before the board meeting.' },
  { t: 'Chase purchase order for the NGFW deal', c: 'Liège Medical Imaging', due: '11 Oct 2026', grp: 'Overdue', over: true, d: 'PO was promised last Friday. Ask Claire who signs off.' },
  { t: 'Send M365 E5 renewal proposal', c: 'Gentse Zorggroep vzw', due: 'Today', grp: 'Upcoming', d: 'Quote 432 seats and add the true-up note.' },
  { t: 'Confirm agenda for Thursday site visit', c: 'Scheldt Port Systems', due: 'Today', grp: 'Upcoming', d: '' },
  { t: 'Prepare quarterly business review deck', c: 'Leuven Biotech Campus', due: '15 Oct 2026', grp: 'Upcoming', d: 'Include ARR movement and the Meraki scope.' },
  { t: 'Send revised Teams Rooms quote to finance', c: 'Limburg Precision Tools', due: '16 Oct 2026', grp: 'Upcoming', d: '' },
  { t: 'Check in on Defender trial results', c: 'Maison Delvaux Hôtellerie', due: '19 Oct 2026', grp: 'Upcoming', d: '' },
  { t: 'Log notes from the MFA demo', c: 'Kortrijk Textile Works', due: '08 Oct 2026', grp: 'Completed', done: true, d: '' },
  { t: 'Send Acrobat licence keys', c: 'Brugse Retail Group', due: '02 Oct 2026', grp: 'Completed', done: true, d: '' },
];
const ACTS = [
  { type: 'meeting', st: 'open', t: 'Quarterly review with IT leadership', c: 'Leuven Biotech Campus', day: 'Today', date: '14 Oct 2026', time: '09:30 – 10:30', who: 'Anke Vermeulen', by: 'Dylan Hias', note: 'Agreed to scope an Azure landing zone for the new lab wing. They want networking and identity quoted separately so they can phase spending over two budget years. Tom will share the architecture by Friday.' },
  { type: 'call', st: 'completed', dir: 'Outgoing', t: 'Renewal timing check', c: 'Gentse Zorggroep vzw', day: 'Today', date: '14 Oct 2026', time: '08:50', who: 'Sofie Claes', by: 'Dylan Hias', note: 'Procurement signs off Friday. Seat count still needs confirming: HR expects 12 new starters in November.' },
  { type: 'visit', st: 'completed', t: 'Warehouse walk-through', c: 'Brabant Logistics NV', day: 'Yesterday', date: '13 Oct 2026', time: '14:00 – 16:00', who: 'Pieter Janssens', by: 'Dylan Hias', note: 'Saw the edge setup in both warehouses. Six separate AWS accounts on personal cards. Strong case for consolidating billing.' },
  { type: 'note', st: 'completed', t: 'Billing contact changed', c: 'Limburg Precision Tools', day: 'Yesterday', date: '13 Oct 2026', time: '11:12', who: '', by: 'Dylan Hias', note: 'Invoices now go to the shared finance mailbox. The billing rejection was caused by the old contact having left.' },
  { type: 'call', st: 'completed', dir: 'Incoming', t: 'Intro call with new CISO', c: 'Liège Medical Imaging', day: 'Mon 12 Oct', date: '12 Oct 2026', time: '16:00', who: 'Claire Lambert', by: 'Lien Verhoeven', note: 'Interested in Prisma Access once the NGFW deal closes. Prefers French. Wants a healthcare reference.' },
  { type: 'meeting', st: 'open', t: 'Kick-off: Marketplace private offer', c: 'Scheldt Port Systems', day: 'Mon 12 Oct', date: '12 Oct 2026', time: '10:00 – 10:45', who: 'Jens De Smet', by: 'Dylan Hias', note: 'Waiting on vendor confirmation of the private offer. Customer wants it to count against their AWS commit.' },
  { type: 'visit', st: 'cancelled', t: 'Showroom refit review', c: 'Brugse Retail Group', day: 'Fri 9 Oct', date: '09 Oct 2026', time: '13:30 – 15:00', who: 'Nina Hendrickx', by: 'Dylan Hias', note: 'Cancelled by customer, moved to next month.' },
  { type: 'note', st: 'completed', t: 'Budget freeze until January', c: 'Kortrijk Textile Works', day: 'Fri 9 Oct', date: '09 Oct 2026', time: '09:05', who: '', by: 'Dylan Hias', note: 'CFO confirmed no new infrastructure spend until the new fiscal year. Revisit vSphere in January.' },
  { type: 'meeting', st: 'completed', t: 'Licensing workshop', c: 'Brabant Logistics NV', day: 'Thu 1 Oct', date: '01 Oct 2026', time: '10:00 – 12:00', who: 'Elke Peeters', by: 'Dylan Hias', note: 'Walked through reserved instances vs savings plans. Elke will send usage exports.' },
];
const ARR = [3.42, 3.45, 3.47, 3.51, 3.50, 3.56, 3.61, 3.64, 3.70, 3.74, 3.81, 3.86];
const MONTHS = ['Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26'];
const VLINES = [['AWS', [61, 63, 66, 64, 68, 70, 69, 72, 74, 73, 77, 80]], ['Microsoft', [52, 50, 53, 55, 54, 56, 58, 57, 59, 61, 60, 63]], ['Cisco', [30, 31, 29, 33, 32, 34, 33, 35, 34, 36, 35, 37]], ['HPE', [22, 21, 23, 22, 24, 23, 22, 24, 25, 24, 26, 25]], ['Palo Alto', [14, 15, 16, 15, 17, 16, 18, 17, 18, 19, 18, 20]], ['Fortinet', [11, 10, 12, 12, 11, 13, 12, 13, 14, 13, 14, 15]], ['Adobe', [7, 8, 7, 8, 8, 9, 8, 9, 9, 10, 9, 10]], ['VMware', [9, 8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 4]]];
const SYNC_HIST = [
  ['Dynamics 365', 'success', '14 Oct 2026 09:41', 1284, 3, ''], ['Push Activities', 'success', '14 Oct 2026 09:41', 0, 2, ''], ['Power BI ARR', 'success', '14 Oct 2026 08:00', 63, 0, ''],
  ['Power BI Insights', 'partial', '14 Oct 2026 08:00', 41, 0, 'Seat metrics missing for Luxembourg'], ['Dynamics 365', 'success', '14 Oct 2026 09:11', 1281, 0, ''], ['Push Opportunities', 'error', '13 Oct 2026 17:02', 0, 0, 'Field im360_payeraccount is required at stage Qualified'],
  ['Power BI ARR Movement', 'success', '13 Oct 2026 16:00', 620, 0, ''], ['Push Follow-Ups', 'success', '13 Oct 2026 15:30', 0, 1, ''], ['Dynamics 365', 'running', '14 Oct 2026 10:11', 0, 0, ''],
];
const USERS = [['Dylan Hias', 'dylan.hias@example.com', 'Cloud Sales Specialist', '14 Oct 2026', true, true], ['Lien Verhoeven', 'lien.verhoeven@example.com', 'Account Manager', '14 Oct 2026', true, false], ['Thomas Peeters', 'thomas.peeters@example.com', 'Customer Success Manager', '13 Oct 2026', true, false], ['Sarah Dubois', 'sarah.dubois@example.com', 'Inside Sales', '12 Oct 2026', true, false], ['Koen De Wilde', 'koen.dewilde@example.com', 'AWS Specialist', '02 Oct 2026', false, false], ['Amélie Laurent', 'amelie.laurent@example.com', 'Azure Specialist', '—', false, false]];
const LOGS = [
  ['10:11:02.114', 'info', 'sync', 'Starting Dynamics 365 sync (full)'], ['10:11:02.540', 'log', 'sync', 'Fetching customers page 1/3'], ['10:11:03.871', 'log', 'sync', 'Fetching customers page 2/3'],
  ['10:11:04.020', 'warn', 'sync', 'Throttled by D365 (429), retrying in 2s'], ['10:11:06.233', 'log', 'sync', 'Fetching customers page 3/3'], ['10:11:07.412', 'info', 'db', 'Upserted 63 customers'],
  ['10:11:08.901', 'error', 'opportunity', 'Push failed for OPP-24811: im360_payeraccount is required'], ['10:11:09.004', 'info', 'activity', 'Pushed 2 pending activities'], ['10:11:10.315', 'log', 'settings', 'Density changed to comfortable'],
  ['10:11:11.002', 'info', 'updater', 'Update v3.0.1 available'], ['10:11:12.660', 'log', 'msal', 'Token refreshed silently'], ['10:11:13.104', 'warn', 'data', 'Customer BE-106701 has no BCN'],
];
const CHANGELOG = [['v3.0.0', ['A fresh new look across the whole app, with a new logo', 'Home, Customers, Pipeline, Activity and Reports replace the old menu', 'Customer details now open next to the list, so you can switch customers without going back', 'A status bar at the bottom shows your sync status at all times', 'Right-click any customer, deal or task to see quick actions']], ['v2.14.0', ['Fixed: opportunities with a billing rejection now show a red outline', 'The Revenue Overview can now be filtered by ARR source']]];
const SHORTCUTS = [['Navigation', [['Go to Home', ['1']], ['Go to Customers', ['2']], ['Go to Pipeline', ['3']], ['Go to Activity', ['4']], ['Go to Reports', ['5']], ['Open Settings', ['S']], ['Toggle Sidebar', ['B']]]], ['General', [['Command Palette', ['Ctrl', 'K']], ['Keyboard Shortcuts', ['?']], ['Close Dialog', ['Esc']]]], ['Page Actions', [['New Item', ['N']], ['Focus Search', ['/']], ['Toggle Filters', ['F']]]], ['List Navigation', [['Move Down', ['↓']], ['Move Up', ['↑']], ['Open Selected', ['↵']]]], ['Data', [['Trigger Sync', ['Ctrl', 'Shift', 'R']]]]];
const kbd = (keys) => `<span class="kbd-g">${keys.map((k) => `<kbd>${k}</kbd>`).join('')}</span>`;

// ================= Charts =================
function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v || 1))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function lineChart({ labels, series, fmt = (v) => v, h = 220, area = false, dots = false, endLabel = false, minZero = true, every }) {
  const W = 640, L = 48, R = endLabel ? 62 : 14, T = 12, B = 24;
  const all = series.flatMap((s) => s.vals);
  let lo = minZero ? 0 : Math.min(...all), hi = Math.max(...all);
  if (!minZero) { const pad = (hi - lo) * 0.15 || 1; lo -= pad; hi += pad; } else hi = niceMax(hi);
  const x = (i) => L + (i * (W - L - R)) / Math.max(labels.length - 1, 1), y = (v) => T + (h - T - B) * (1 - (v - lo) / (hi - lo));
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4);
  const step = every || (labels.length > 8 ? 2 : 1);
  let out = ticks.map((t) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${L - 7}" y="${y(t) + 3.5}" text-anchor="end">${fmt(t)}</text>`).join('');
  out += labels.map((m, i) => (labels.length - 1 - i) % step === 0 ? `<text class="axis-t" x="${x(i)}" y="${h - 6}" text-anchor="middle">${m}</text>` : '').join('');
  series.forEach((s) => {
    const d = s.vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    if (area) out += `<path class="ar" d="${d}L${x(s.vals.length - 1)},${y(lo)}L${L},${y(lo)}Z" style="fill:${s.c};fill-opacity:0.10"/>`;
    out += `<path class="ln" pathLength="1" d="${d}" style="fill:none;stroke:${s.c};stroke-width:${s.w || 2};stroke-linejoin:round"/>`;
    if (dots) out += s.vals.map((v, i) => `<circle class="dotc" cx="${x(i)}" cy="${y(v)}" r="3" style="fill:${s.c}"><title>${labels[i]}: ${fmt(v)}</title></circle>`).join('');
    if (endLabel) { const n = s.vals.length - 1; out += `<circle class="dotc" cx="${x(n)}" cy="${y(s.vals[n])}" r="4.5" style="fill:${s.c}"/><text class="end-t" x="${x(n) + 9}" y="${y(s.vals[n]) + 4}">${fmt(s.vals[n])}</text>`; }
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img">${out}</svg></div>`;
}
function barChart({ labels, series, fmt = (v) => v, h = 200, stacked = false, net = null }) {
  const W = 640, L = 48, R = 12, T = 10, B = 26;
  const sums = labels.map((_, i) => stacked ? [series.reduce((a, s) => a + Math.max(0, s.vals[i]), 0), series.reduce((a, s) => a + Math.min(0, s.vals[i]), 0)] : [Math.max(...series.map((s) => s.vals[i])), Math.min(0, ...series.map((s) => s.vals[i]))]);
  const hi = niceMax(Math.max(...sums.map((s) => s[0]), 1)), loRaw = Math.min(...sums.map((s) => s[1])), lo = loRaw < 0 ? -niceMax(-loRaw) : 0;
  const y = (v) => T + (h - T - B) * (1 - (v - lo) / (hi - lo));
  const bw = (W - L - R) / labels.length, gw = bw * 0.62;
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4);
  let out = ticks.map((t) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text class="axis-t" x="${L - 7}" y="${y(t) + 3.5}" text-anchor="end">${fmt(t)}</text>`).join('');
  if (lo < 0) out += `<line class="zero" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  labels.forEach((lab, i) => {
    const x0 = L + i * bw + (bw - gw) / 2;
    if (stacked) {
      let up = 0, dn = 0;
      series.forEach((s) => { const v = s.vals[i]; if (!v) return; const a = v > 0 ? up : dn, b = a + v; if (v > 0) up = b; else dn = b; out += `<rect class="bar" x="${x0}" y="${Math.min(y(a), y(b))}" width="${gw}" height="${Math.abs(y(a) - y(b))}" rx="2" style="fill:${s.c};--i:${i}"><title>${lab} · ${s.name}: ${fmt(v)}</title></rect>`; });
    } else {
      const sw = gw / series.length;
      series.forEach((s, k) => { const v = s.vals[i]; out += `<rect class="bar${v < 0 ? ' neg' : ''}" x="${x0 + k * sw}" y="${Math.min(y(0), y(v))}" width="${Math.max(sw - 2, 2)}" height="${Math.abs(y(0) - y(v))}" rx="2" style="fill:${s.c};--i:${i}"><title>${lab} · ${s.name}: ${fmt(v)}</title></rect>`; });
    }
    out += `<text class="axis-t" x="${L + i * bw + bw / 2}" y="${h - 8}" text-anchor="middle">${lab}</text>`;
  });
  if (net) { const d = net.map((v, i) => `${i ? 'L' : 'M'}${L + i * bw + bw / 2},${y(v)}`).join(''); out += `<path d="${d}" style="fill:none;stroke:var(--fg);stroke-width:1.6"/>` + net.map((v, i) => `<circle class="dotc" cx="${L + i * bw + bw / 2}" cy="${y(v)}" r="3" style="fill:var(--fg)"><title>${labels[i]} · Net: ${fmt(v)}</title></circle>`).join(''); }
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img">${out}</svg></div>`;
}
function donut(items, size = 170) {
  const tot = items.reduce((a, b) => a + b.val, 0); let a0 = -Math.PI / 2; const r = 62, cx = 85, cy = 85;
  const segs = items.map((it) => { const a1 = a0 + (it.val / tot) * Math.PI * 2; const large = a1 - a0 > Math.PI ? 1 : 0; const p = `M${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)}A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`; const mid = (a0 + a1) / 2; a0 = a1; return `<path class="dseg" pathLength="1" d="${p}" style="fill:none;stroke:${it.c};stroke-width:22"><title>${it.name}: ${it.val}</title></path><text class="pie-t" x="${cx + 92 * Math.cos(mid) * 0.98}" y="${cy + 92 * Math.sin(mid) * 0.98 + 3}" text-anchor="middle">${Math.round((it.val / tot) * 100)}%</text>`; }).join('');
  return `<div class="chart" style="max-width:${size + 40}px;margin:0 auto"><svg viewBox="-20 -14 210 198">${segs}<text class="end-t" x="${cx}" y="${cy + 4}" text-anchor="middle">${tot}</text></svg></div>`;
}
const legend = (items, round) => `<div class="legend">${items.map(([n, c]) => `<span><i class="${round ? 'round' : ''}" style="background:${c}"></i>${n}</span>`).join('')}</div>`;
const hbars = (rows, fmt = (v) => v, lw = 116) => { const m = Math.max(...rows.map((r) => r[1]), 1); return `<div class="hbars">${rows.map(([l, v]) => `<div class="hbar" style="grid-template-columns:${lw}px minmax(0,1fr) 64px"><span title="${esc(l)}">${esc(l)}</span><div class="track"><div class="fill" style="width:${(v / m) * 100}%"></div></div><span class="v">${fmt(v)}</span></div>`).join('')}</div>`; };
const spark = (vals) => { const w = 78, h = 24, mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1; const pts = vals.map((v, i) => [i * (w / (vals.length - 1)), 2 + (h - 4) * (1 - (v - mn) / sp)]); const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(''); const l = pts[pts.length - 1]; return `<svg width="78" height="24" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}L${w},${h}L0,${h}Z" style="fill:var(--accent);fill-opacity:.12"/><path d="${d}" style="fill:none;stroke:var(--accent);stroke-width:1.5"/><circle cx="${l[0]}" cy="${l[1]}" r="2.2" style="fill:var(--accent)"/></svg>`; };

// ================= UI helpers =================
const sel = (opts, val, attrs = '', cls = 'sl') => `<select class="${cls}" ${attrs}>${opts.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
const sw = (on, attrs = '') => `<button type="button" class="sw" role="switch" aria-checked="${!!on}" data-a="sw" ${attrs}></button>`;
const numIn = (v, unit, attrs = '') => `<span class="unit"><input class="in sm num" type="number" value="${v}" ${attrs}>${unit || ''}</span>`;
const fld = (label, ctl, o = {}) => `<div class="f ${o.full ? 'full' : ''} ${o.bad ? 'bad' : ''}"><label>${label}${o.req ? ' <span class="req">(required)</span>' : ''}</label>${ctl}${o.hint ? `<span class="tiny">${o.hint}</span>` : ''}</div>`;
const setRow = (label, desc, ctl) => `<div class="set-row"><div class="lbl"><b>${label}</b>${desc ? `<span>${desc}</span>` : ''}</div><div class="ctl">${ctl}</div></div>`;
const emptyS = (icon, title, sub = '') => `<div class="empty">${ic(icon, 34)}<b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
const pager = (page, pages, size = 10) => pages <= 1 ? '' : `<div class="pager"><span class="num">${(page - 1) * size + 1}–${Math.min(page * size, pages * size)} of ${pages * size}</span><span class="grow"></span><button class="pg-size" type="button" data-a="toast" data-v="Rows per page: 10 · 25 · 50 · 100" title="Rows per page">${size} / page${icI('chevd', 10)}</button><button class="tb-btn" type="button" aria-label="Previous page" ${page === 1 ? 'disabled' : ''}>${ic('chevl', 14)}</button><span class="num pg-n">${page} / ${pages}</span><button class="tb-btn" type="button" aria-label="Next page">${ic('chev', 14)}</button></div>`;
const mcard = (label, icon, value, sub = '', delta = null) => `<div class="panel mcard"><div class="label">${label}${icon ? ic(icon, 14) : ''}</div><div class="v">${value}</div>${sub || delta ? `<div class="sub">${delta ? `<span class="delta ${delta[0] > 0 ? 'up' : delta[0] < 0 ? 'down' : ''}">${icI(delta[0] > 0 ? 'trend' : delta[0] < 0 ? 'trenddown' : 'minus')} ${delta[1]}</span> ` : ''}${sub}</div>` : ''}</div>`;
const healthTier = (h) => h >= 70 ? ['healthy', 'Healthy'] : h >= 40 ? ['risk', 'At risk'] : ['critical', 'Critical'];
const hb = (c, withLabel) => { const [k, l] = healthTier(c.h); return `<span class="hb ${k}" title="Health ${c.h} · ${l}&#10;Recency ${c.hr} × 0.4&#10;Pipeline ${c.hp} × 0.3&#10;Frequency ${c.hf} × 0.3">${icI('heart', 11)} ${c.h}${withLabel ? ` · ${l}` : ''}</span>`; };
const stPill = (s) => s === 'open' ? `<span class="st st-open">${icI('clock', 11)} Open</span>` : s === 'completed' ? `<span class="st st-completed">${icI('checkc', 11)} Completed</span>` : `<span class="st st-cancelled">${icI('ban', 11)} Cancelled</span>`;
const oppSt = (s) => s === 'Won' ? '<span class="chip pos">Won</span>' : s === 'Lost' ? '<span class="chip neg">Lost</span>' : '<span class="chip accent">Open</span>';
const typeIcon = (t, s = 13) => `<span class="type-ic t-${t}">${ic(t === 'opp' ? 'target' : t, s)}</span>`;
const typeName = (a) => a.type === 'call' ? `${a.dir || 'Outgoing'} Call` : a.type[0].toUpperCase() + a.type.slice(1);
const stagePill = (st) => `<span class="stage-pill"><i><b style="width:${((STAGES.indexOf(st) + 1) / STAGES.length) * 100}%"></b></i>${st}</span>`;
const custBy = (n) => CUSTOMERS.find((c) => c.name === n) || CUSTOMERS[0];
const fmtDate = (iso) => { const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
const TODAY = new Date('2026-10-14T00:00:00');
const relDays = (iso) => Math.round((new Date(iso + 'T00:00:00') - TODAY) / 864e5);
