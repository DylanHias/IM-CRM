// ================= Config / nav =================
const NAV = [['home', 'Home', 'home'], ['customers', 'Customers', 'users'], ['pipeline', 'Pipeline', 'pipeline'], ['activity', 'Activity', 'activity'], ['reports', 'Reports', 'reports']];
const ACCENTS = [['Cobalt', '#2f5bd3'], ['Indigo', '#4c46d6'], ['Violet', '#7444d4'], ['Teal', '#0e7f86'], ['Emerald', '#11805a'], ['Ember', '#c2531f'], ['Graphite', '#34343c']];
const FONTS = [['Geist', '"Geist", "Inter", "Segoe UI Variable", "Segoe UI", Arial, sans-serif'], ['Inter', '"Inter", "Segoe UI Variable", "Segoe UI", Arial, sans-serif'], ['Segoe UI (system)', '"Segoe UI Variable", "Segoe UI", -apple-system, Arial, sans-serif'], ['DM Sans', '"DM Sans", "Segoe UI", Arial, sans-serif'], ['Manrope', '"Manrope", "Segoe UI", Arial, sans-serif'], ['IBM Plex Sans', '"IBM Plex Sans", "Segoe UI", Arial, sans-serif'], ['Figtree', '"Figtree", "Segoe UI", Arial, sans-serif']];
const DEFAULTS = { theme: 'system', accent: '#2f5bd3', font: 'Geist', radius: 6, density: 'comfortable', elev: 'border', win: 'windowed', logo: 'pathway' };
const KEY = 'imcrm-redesign-tokens';
let cfg = { ...DEFAULTS };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) cfg = { ...DEFAULTS, ...s }; } catch (e) { /* storage unavailable: defaults */ }
if (!FONTS.some((f) => f[0] === cfg.font)) cfg.font = DEFAULTS.font;
const hist = { stack: [{ route: 'home', customer: state.customer }], i: 0 };
const $ = (id) => document.getElementById(id);

// ================= Modals =================
let M = null; // { name, arg, ms }
const foot = (...btns) => btns.join('');
const dateBtn = (v, ph = 'Select date') => `<button class="in" type="button" data-a="datePick" style="display:flex;align-items:center;gap:8px;text-align:left">${ic('calendar', 14)}<span style="${v ? '' : 'color:var(--faint)'}">${v || ph}</span></button>`;
const dtPick = (d, t) => `<div class="row-flex" style="flex-wrap:nowrap">${dateBtn(d)}<span class="iw r" style="width:110px;flex:none"><input class="in num" value="${t}" placeholder="HH:MM" aria-label="Time"><button class="tb-btn" type="button" data-a="timePick" style="position:absolute;right:2px;top:1px;width:26px;height:26px">${ic('clock', 13)}</button></span></div>`;
const rte = (html) => `<div class="rte"><div class="rte-bar">${['H1', 'H2', 'H3'].map((h) => `<button class="tb-btn" type="button" title="Heading ${h[1]}">${h}</button>`).join('')}<i></i><button class="tb-btn" type="button" title="Bold"><b>B</b></button><button class="tb-btn" type="button" title="Italic"><em>I</em></button><button class="tb-btn" type="button" title="Strikethrough"><s>S</s></button><i></i><button class="tb-btn" type="button" title="Bullet list">${ic('list', 13)}</button><button class="tb-btn" type="button" title="Numbered list">1.</button><i></i><button class="tb-btn" type="button" title="Undo">${ic('undo', 13)}</button><button class="tb-btn" type="button" title="Redo" disabled>${ic('undo', 13).replace('<path', '<path transform="scale(-1,1) translate(-24,0)"')}</button></div><div class="rte-body" contenteditable="true">${html}</div></div>`;
const custSel = (val) => `<span class="iw r">${sel([['', 'Select customer…'], ...CUSTOMERS.map((c) => [c.name, c.name])], val || '', 'data-mre="cust" aria-label="Customer"')}</span>`;
const MODALS = {
  quickPick: (kind) => ({ title: kind === 'followup' ? 'New Follow-up' : 'Log Activity', sub: 'Pick a customer to continue.', w: 440, body: fld('Customer', custSel(M.ms.cust)), foot: foot('<span class="grow"></span>', `<button class="btn" type="button" data-a="close">Cancel</button>`, `<button class="btn primary" type="button" data-a="modal" data-v="${kind === 'followup' ? 'followupForm' : 'activityForm'}" ${M.ms.cust ? '' : 'disabled'}>Continue</button>`) }),
  activityForm: (edit) => { const ty = M.ms.type || (edit ? 'meeting' : 'meeting'); const appt = ty === 'meeting' || ty === 'visit'; const c = custBy(M.ms.cust || state.customer);
    return { title: edit ? 'Edit Activity' : 'Add Activity', sub: c.name, w: 1080, tall: true, body: `<div style="display:grid;grid-template-columns:minmax(0,3fr) minmax(0,7fr);gap:18px;height:100%"><div style="display:grid;gap:12px;align-content:start">
      <div class="f"><label>Type</label><div class="type-seg">${[['meeting', 'Meeting'], ['visit', 'Visit'], ['call', 'Call'], ['note', 'Note']].map(([k, l]) => `<button type="button" class="t-${k}" data-a="actType" data-v="${k}" aria-pressed="${ty === k}">${ic(k, 15)}<span>${l}</span></button>`).join('')}</div></div>
      ${ty === 'call' ? fld('Direction', sel(['Outgoing', 'Incoming'], 'Outgoing')) : ''}
      ${appt ? fld('Start <span class="req">*</span>', dtPick('14 Oct 2026', '14:00')) + fld('End <span class="req">*</span>', dtPick('14 Oct 2026', '15:00')) : fld('Date <span class="req">*</span>', dateBtn('14 Oct 2026'))}
      ${fld('Contact', sel([['', 'No contact'], ...contactsFor(c).map((p) => [p.f, `${p.f} ${p.l} — ${p.t}`])], edit ? contactsFor(c)[0].f : ''))}
      ${edit ? fld('Status', sel(['Open', 'Completed', 'Cancelled'], 'Open')) : ''}</div>
      <div style="display:grid;grid-template-rows:auto minmax(0,1fr);gap:12px">${fld('Subject <span class="req">*</span>', `<input class="in" value="${edit ? 'Quarterly review with IT leadership' : ''}" placeholder="${ty === 'note' ? 'Note title...' : 'Meeting / call subject...'}">`)}
      <div class="f" style="grid-template-rows:auto minmax(0,1fr)"><label>Description</label>${ty === 'call' ? '<textarea class="ta" style="height:100%" placeholder="What was discussed? Key outcomes, next steps..."></textarea>' : rte(edit ? '<p>Agreed to scope an Azure landing zone for the new lab wing.</p><ul><li>Networking and identity quoted separately</li><li>Tom shares the architecture by Friday</li></ul>' : '<p style="color:var(--faint)">What was discussed? Key outcomes, next steps...</p>')}</div></div></div>`,
      foot: foot(`<button class="btn flex" type="button" data-a="close">Cancel</button>`, `<button class="btn primary flex" type="button" data-a="save" data-v="${edit ? 'Activity updated' : 'Activity logged successfully!'}">${edit ? 'Save Changes' : 'Add Activity'}</button>`) }; },
  activityEdit: () => MODALS.activityForm(true),
  actPreview: (i) => { const a = ACTS[i] || ACTS[0]; return { title: `${typeIcon(a.type, 13)} ${esc(a.t)}`, w: 680, body: `<div style="display:grid;gap:14px"><div class="row-flex"><span class="chip">${typeName(a)}</span>${a.type !== 'note' ? stPill(a.st) : ''}</div><dl class="kv"><dt>Date</dt><dd>${a.date} ${a.time.includes('–') ? `${a.time.split(' – ')[0]} – ${a.date} ${a.time.split(' – ')[1]}` : a.time}</dd>${a.who ? `<dt>Contact</dt><dd>${a.who}</dd>` : ''}<dt>Created by</dt><dd>${a.by}</dd></dl><div class="f"><label>Description</label><div class="selectable" style="max-height:420px;overflow:auto;background:var(--sunken);border:1px solid var(--border);border-radius:var(--r);padding:12px;line-height:1.6">${esc(a.note)}</div></div></div>`, foot: foot('<span class="grow"></span>', `<button class="btn danger" type="button" data-a="confirm" data-v="Delete &quot;${esc(a.t)}&quot;?">${ic('trash', 13)}Delete</button>`, `<button class="btn primary" type="button" data-a="modal" data-v="activityEdit">${ic('edit', 13)}Edit</button>`) }; },
  followupForm: (edit) => ({ title: edit ? 'Edit Follow-Up' : 'Add Follow-Up', sub: custBy(M.ms.cust || state.customer).name, w: edit ? 640 : 460, body: `<div style="display:grid;gap:12px">${fld('Title <span class="req">*</span>', `<input class="in" placeholder="What needs to be done?" value="${edit ? esc(TASKS[state.selTask].t) : ''}">`)}${fld('Description', `<textarea class="ta" rows="7" style="min-height:180px">${edit ? esc(TASKS[state.selTask].d) : ''}</textarea>`)}${fld('Due Date <span class="req">*</span>', dateBtn(edit ? '15 Oct 2026' : '15 Oct 2026', 'Select due date'))}</div>`, foot: foot('<span class="grow"></span>', `<button class="btn" type="button" data-a="close">Cancel</button>`, `<button class="btn primary" type="button" data-a="save" data-v="${edit ? 'Follow-up updated' : 'Follow-up created!'}">${edit ? 'Save Changes' : 'Add Follow-Up'}</button>`) }),
  followupEdit: () => MODALS.followupForm(true),
  taskPreview: (i) => { const t = TASKS[i], dn = isDone(+i); return { title: `<span class="type-ic t-fu ${dn ? 'done' : ''}" style="border-radius:50%">${ic('checksq', 13)}</span><span style="${dn ? 'text-decoration:line-through' : ''}">${esc(t.t)}</span>`, w: 680, body: `<div style="display:grid;gap:14px"><div class="row-flex"><span class="chip ${t.over && !dn ? 'neg' : ''}">${t.over && !dn ? icI('alertc', 11) + ' ' : ''}${t.due}</span>${dn ? '<span class="chip pos">Completed</span>' : ''}${+i === 2 ? '<span class="chip warn">Pending sync</span>' : ''}</div><dl class="kv"><dt>Customer</dt><dd>${esc(t.c)}</dd></dl><div class="f"><label>Description</label><div class="selectable" style="max-height:420px;overflow:auto;background:var(--sunken);border:1px solid var(--border);border-radius:var(--r);padding:12px;min-height:80px">${esc(t.d) || '<span class="sub">No description</span>'}</div></div></div>`, foot: dn ? foot('<span class="grow"></span>', '<button class="btn" type="button" data-a="close">Close</button>') : foot('<span class="grow"></span>', `<button class="btn danger" type="button" data-a="confirm" data-v="Delete &quot;${esc(t.t)}&quot;?">${ic('trash', 13)}Delete</button>`, `<button class="btn primary" type="button" data-a="modal" data-v="followupEdit">${ic('edit', 13)}Edit</button>`) }; },
  contactForm: (edit) => M.ms.ok ? { title: edit ? 'Edit Contact' : 'Add Contact', w: 460, body: `<div class="okbox">${ic('checkc', 36)}<b>${edit ? 'Contact updated!' : 'Contact added!'}</b></div>`, foot: '' } : { title: edit ? 'Edit Contact' : 'Add Contact', sub: edit ? 'Update contact details.' : 'Add a new contact for this customer.', w: 480, body: `<div class="form-grid">${fld('First Name <span class="req">*</span>', `<input class="in" placeholder="First name" value="${edit ? 'Pieter' : ''}">`)}${fld('Last Name <span class="req">*</span>', `<input class="in" placeholder="Last name" value="${edit ? 'Janssens' : ''}">`)}${fld('Job Title', `<input class="in" placeholder="e.g. IT Director" value="${edit ? 'Head of IT' : ''}">`, { full: 1 })}${fld('Country', sel([['', 'Select country'], 'Belgium', 'Netherlands', 'Luxembourg'], edit ? 'Belgium' : ''))}${fld('Contact Type', sel([['', 'Select type'], 'Decision maker', 'Technical', 'Finance', 'End user'], edit ? 'Decision maker' : ''))}${fld('Cloud Contact', sel(['No', 'Yes'], edit ? 'Yes' : 'No'), { full: 1 })}${fld('Email', `<input class="in" type="email" placeholder="email@example.com" value="${edit ? 'pieter.janssens@example.be' : ''}">`, { full: 1 })}${fld('Phone', '<input class="in" type="tel" placeholder="+32 ...">')}${fld('Mobile', '<input class="in" type="tel" placeholder="+32 ...">')}${fld('Notes', '<textarea class="ta" rows="3" placeholder="Any notes about this contact..."></textarea>', { full: 1 })}</div>`, foot: foot('<span class="grow"></span>', `<button class="btn" type="button" data-a="close">Cancel</button>`, `<button class="btn primary" type="button" data-a="contactSave">${edit ? 'Save Changes' : 'Add Contact'}</button>`) },
  contactEdit: () => MODALS.contactForm(true),
  vendorEdit: () => ({ title: 'Vendor Related', w: 440, body: `<div style="display:grid;gap:12px">${fld('MPN ID', '<input class="in" placeholder="MPN ID" value="6112874">')}${fld('APN ID', '<input class="in" placeholder="APN ID">')}</div>`, foot: foot('<span class="grow"></span>', `<button class="btn" type="button" data-a="close">Cancel</button>`, `<button class="btn primary" type="button" data-a="save" data-v="Saved">Save</button>`) }),
  cloudEdit: () => ({ title: 'Cloud and Services Contacts', w: 480, body: `<div style="display:grid;gap:12px">${[['Customer Success Manager', 'Thomas Peeters'], ['AWS Owner', 'Koen De Wilde'], ['Azure Owner', '—'], ['Inside Sales Owner', 'Sarah Dubois']].map(([l, v]) => fld(l, `<span class="iw r">${sel(['—', ...USERS.map((u) => u[0])], v)}</span>`)).join('')}</div>`, foot: foot('<span class="grow"></span>', `<button class="btn" type="button" data-a="close">Cancel</button>`, `<button class="btn primary" type="button" data-a="save" data-v="Saved">Save</button>`) }),
  opp: (i) => oppWizard(i),
  closeOpp: (kind) => { const won = kind === 'won', o = OPPS[M.ms.opp ?? 0]; return { title: `<span style="color:var(--${won ? 'pos' : 'neg'})">${ic(won ? 'trophy' : 'octx', 16)}</span>Close as ${won ? 'Won' : 'Lost'}`, sub: 'Provide the following information about why this opportunity is being closed.', w: 460, body: `<div style="display:grid;gap:12px">${fld('Status reason *', sel([['', 'Select reason'], ...(won ? ['Purchased', 'Bulk Closed', 'Won', 'PO received', 'Invoiced to Reseller', 'Deal Analyzer-Approved'] : ['Returned', 'Auto-Created', 'Budgetary Only', 'No Stock', 'Lost/Not Pursued', 'Duplicate Opportunity', 'Reseller / Partner Lost Opportunity', 'Duplicate Vendor', 'Not Interested', 'Won with Another Reseller', 'Gone Direct', 'Won by Cloud', 'No Feedback from Customer', 'Lack of Credit', 'Bulk Closed', 'Declined', 'Canceled', 'Out-Sold', 'Lost to IM Competitor', 'Postponed / Put On Hold', 'Price', 'Solution', 'Partner Taken In house', 'Service not Required', 'Kit Decommissioned', 'System Bulk Close Job', 'Deal Analyzer-Rejected'])], won ? 'PO received' : ''))}${fld('Actual revenue * (EUR)', `<span class="iw"><span class="pre">€</span><input class="in num" value="${won ? o.val : 0}"></span>`)}${fld('Close date *', dateBtn('14 Oct 2026'))}${fld('Description', '<textarea class="ta" rows="3" placeholder="Optional notes"></textarea>')}</div>`, foot: foot(`<button class="btn flex" type="button" data-a="close">Cancel</button>`, `<button class="btn flex ${won ? 'won' : 'danger-fill'}" type="button" data-a="closeDeal" data-v="${kind}">Confirm ${won ? 'Won' : 'Lost'}</button>`) }; },
  account: () => ({ custom: true, head: '', w: 380, body: `<div class="acct">
    <div class="acct-h"><span class="avatar">DH</span><div style="min-width:0"><b>${ME.name}</b><span>${ME.email}</span></div></div>
    <div class="acct-grid">${[['sync', 'sync', 'Sync'], ['settings', 'settings', 'Settings'], ['help', 'help', 'Help'], ['admin', 'shield', 'Admin'], ['debug', 'bug', 'Debug'], ['keys', 'keyboard', 'Shortcuts']].map(([k, i2, l]) => `<button type="button" ${k === 'keys' ? 'data-a="modal" data-v="shortcuts"' : `data-a="go" data-v="${k}"`}>${ic(i2, 18)}<span>${l}</span></button>`).join('')}</div>
    <div class="acct-f"><span class="tiny">v3.0.0</span><span class="grow"></span><button class="btn sm ghost danger" type="button" data-a="logout">${ic('logout', 13)}Log out</button></div></div>`, foot: '' }),
  changelog: () => ({ title: 'Changelog', sub: "What's new in v3.0.0", w: 620, body: `<div style="display:grid;gap:14px">${CHANGELOG.map(([v, items], i) => `<div>${i ? `<h4 style="font-size:13px;margin-bottom:6px">${v}</h4>` : ''}<ul style="margin:0;padding-left:18px;line-height:1.75">${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>`, foot: foot('<span class="grow"></span>', '<button class="btn primary" type="button" data-a="close">Got it</button>') }),
  profile: () => ({ title: '', w: 440, body: `<div style="display:grid;gap:14px"><div class="row-flex" style="flex-wrap:nowrap;gap:14px"><span class="avatar" style="width:64px;height:64px;font-size:20px">DH</span><div><div class="row-flex"><b style="font-size:16px">${ME.name}</b><span class="chip accent">Admin</span></div><div class="sub">${ME.title}</div></div></div>
    <div style="background:var(--sunken);border-radius:var(--r-card);padding:10px 12px;display:grid;gap:6px;font-size:12.5px"><span class="row-flex">${ic('mail', 13)}${ME.email}</span><span class="row-flex">${ic('pin', 13)}${ME.city}</span><span class="row-flex">${ic('cake', 13)}${ME.birthday}</span></div>
    <div class="prof-grid"><button type="button" data-a="goClose" data-v="admin">${ic('shield', 18)}Admin panel</button><button type="button" data-a="goClose" data-v="settings">${ic('settings', 18)}Account settings</button><button type="button" data-a="goClose" data-v="debug">${ic('bug', 18)}Debug</button><button type="button" data-a="modal" data-v="shortcuts">${ic('keyboard', 18)}Shortcuts</button><button type="button" data-a="goClose" data-v="help">${ic('help', 18)}Help</button><button type="button" class="danger" data-a="logout">${ic('logout', 18)}Log out</button></div><div class="tiny" style="text-align:center">v3.0.0</div></div>`, foot: '' }),
  shortcuts: () => ({ title: 'Keyboard Shortcuts', w: 480, body: `<div style="display:grid;gap:14px">${SHORTCUTS.map(([g, rows]) => `<div><div class="sec-h" style="margin-bottom:6px">${g}</div>${rows.map(([l, k]) => `<div class="f-row" style="padding:5px 0;border-bottom:1px solid var(--border)"><span>${l}</span>${kbd(k)}</div>`).join('')}</div>`).join('')}</div>`, foot: '' }),
  birthday: () => ({ title: '', w: 440, body: `<div style="display:grid;justify-items:center;gap:10px;text-align:center;padding:10px 0"><div style="font-size:56px;line-height:1">🎂</div><b style="font-size:19px">Happy birthday, ${ME.first}!</b><p class="sub" style="font-size:13px;max-width:34ch">Another trip around the sun, another excuse for cake. We hope today is loud, sweet, and exactly your kind of fun.</p></div>`, foot: foot('<span class="grow"></span>', '<button class="btn primary" type="button" data-a="close">Thanks!</button><span class="grow"></span>') }),
  initialSync: () => { const ph = ['Preparing...', 'Fetching customers...', 'Syncing customers...', 'Fetching from Dynamics 365...', 'Syncing contacts...', 'Syncing activities...', 'Syncing tasks...', 'Syncing opportunities...', 'Finishing up...']; const s = M.ms.step || 0, done = s >= ph.length;
    return { dark: true, noClose: true, w: 440, title: '', body: done ? `<div style="display:grid;justify-items:center;gap:10px;text-align:center;padding:18px 8px"><div class="sync-ic done">${ic('check', 26)}</div><b style="font-size:18px">Welcome, ${ME.first}!</b><span class="sub">Your workspace is ready</span><button class="btn primary" type="button" data-a="getStarted" style="height:40px;width:100%;margin-top:8px">Get started</button></div>` : `<div style="display:grid;justify-items:center;gap:10px;text-align:center;padding:18px 8px"><div class="sync-ic">${'<span class="spin lg" style="border-color:rgb(255 255 255 / .35);border-top-color:#fff"></span>'}</div><b style="font-size:17px">Setting up your workspace</b><span class="sub">${ph[s]}</span><span class="tiny" style="max-width:34ch">This usually takes around 5 minutes but don't worry, you'll only have to do this once.</span><div class="prog ${s < 3 ? 'indet' : ''}" style="width:100%;height:8px"><i style="${s < 3 ? '' : `width:${Math.round(((s - 2) / 7) * 100)}%`}"></i></div><span class="tiny num">${s < 3 ? 'Fetching data from Dynamics 365…' : `${Math.round(((s - 2) / 7) * 1284)} / 1284 records`}</span></div>`, foot: '' }; },
};
function oppWizard(i) {
  const isNew = i == null || i === 'new' || i === 'locked'; const o = isNew ? null : OPPS[+i];
  const ms = M.ms; if (ms.stage == null) ms.stage = o ? o.st : 'Prospecting'; if (ms.vendor == null) ms.vendor = o ? o.v : ''; if (ms.eut == null) ms.eut = 'Commercial'; if (ms.sec == null) ms.sec = isNew ? 'customer' : 'review';
  const aws = ms.vendor.startsWith('AWS'), msft = ms.vendor.startsWith('MICROSOFT'), q = STAGES.indexOf(ms.stage) >= 2, locked = i === 'locked';
  const cust = o ? o.c : locked ? state.customer : '';
  const miss = { customer: ms.missing && !o ? ['Customer', 'Contact'] : [], deal: ms.missing && !o ? ['Subject', 'Opp Type', 'Customer Need'] : [], vendor: ms.missing && !o ? ['Primary Vendor'] : (o && aws && q ? ['Payer Account'] : []), money: ms.missing && !o ? ['Estimated MRR', 'Annual Revenue'] : [], review: [] };
  const bad = (sec, l) => miss[sec].includes(l);
  const f = (sec, l, ctl, r = true, full) => `<div class="f ${full ? 'full' : ''} ${bad(sec, l) ? 'bad' : ''}"><label>${l}${r ? ' <span class="req">*</span>' : ''}</label>${ctl}</div>`;
  const v = (x) => (o ? x : '');
  const SECS = [['customer', 'Customer', 'building', 4], ['deal', 'Deal', 'target', 6], ['vendor', 'Vendor', 'layers', 1 + (aws ? 7 : 0) + (msft ? 6 : 0)], ['money', 'Financials', 'wallet', 4], ['review', 'Review', 'checkc', 0]];
  const secBody = {
    customer: `<div class="form-grid">${f('customer', 'Customer', cust ? `<div class="locked">${ic('lock', 13)}${esc(cust)}</div>` : `<span class="iw r">${sel([['', 'Select customer'], ...CUSTOMERS.map((c) => c.name)], '', `class="sl ${bad('customer', 'Customer') ? 'err' : ''}"`)}</span>`, true, true)}
      ${f('customer', 'Contact', sel([['', cust ? 'Select contact' : 'Pick a customer first'], ...(cust ? contactsFor(custBy(cust)).map((p) => `${p.f} ${p.l}`) : [])], o ? `${contactsFor(custBy(cust))[0].f} ${contactsFor(custBy(cust))[0].l}` : '', `class="sl ${bad('customer', 'Contact') ? 'err' : ''}"`))}
      ${f('customer', 'BCN', `<input class="in" placeholder="Auto-filled from customer" value="${cust ? custBy(cust).bcn : ''}">`)}
      ${f('customer', 'Secondary Owner', `<span class="iw r">${sel(['—', ...OWNERS.slice(1)], o?.o2 || '—')}</span>`, false, true)}</div>`,
    deal: `<div class="form-grid">${f('deal', 'Subject', `<input class="in ${bad('deal', 'Subject') ? 'err' : ''}" placeholder="BE - #Service Name - Reseller - Vendor - End Customer - ARR" value="${esc(v(o?.s))}">`, true, true)}
      <div class="f full"><label>Stage</label><div class="stage-pick">${STAGES.map((s, k) => { const cur = s === ms.stage, past = k < STAGES.indexOf(ms.stage) && ms.stage !== 'Billing Rejection' && s !== 'Billing Rejection'; return `<button type="button" class="${cur ? 'cur' : past ? 'past' : ''} ${s === 'Billing Rejection' ? 'branch' : ''}" data-a="stage" data-v="${s}" title="${s} (${PROB[s]}%)">${past ? icI('check', 11) : ''}${s}<small>${PROB[s]}%</small></button>`; }).join('')}</div></div>
      ${f('deal', 'Single or Cross Sell', sel(['Single', 'Cross Sell'], 'Single'))}${f('deal', 'Type', sel(['New', 'Install'], 'New'))}
      ${f('deal', 'Opp Type', sel([['', 'Select'], ...(aws ? ['Trad', 'Services', 'SPA', 'CMP'] : ['Services', 'SPA', 'SPA - Partner Agreement', 'CMP', 'Trad', 'MPO2Connect', 'Azure Private Offer', 'Breath'])], o ? 'Services' : '', `class="sl ${bad('deal', 'Opp Type') ? 'err' : ''}"`), true, true)}
      ${f('deal', 'Customer Need', `<textarea class="ta ${bad('deal', 'Customer Need') ? 'err' : ''}" rows="4" placeholder="What does the customer need?">${o ? 'Consolidate billing and reduce cloud spend across business units.' : ''}</textarea>`, true, true)}</div>`,
    vendor: `<div class="form-grid">${f('vendor', 'Primary Vendor', `<span class="iw r">${sel([['', 'Select vendor'], ...VENDORS_D365], ms.vendor, `data-mre="vendor" class="sl ${bad('vendor', 'Primary Vendor') ? 'err' : ''}"`)}</span>`, true, true)}
      ${aws ? `<div class="f-sec"><h3>AWS configuration ${q ? '<span class="chip warn">Required from Qualified</span>' : '<span class="chip">Optional until Qualified</span>'}</h3></div>
        ${f('vendor', 'APN ID', '<input class="in" value="APN-55120">', q)}${f('vendor', 'AWS Partner Type', sel([['', 'Select'], 'Service', 'Software'], 'Service'), q)}
        ${f('vendor', 'AWS Service Type', sel([['', 'Select'], 'Direct Consolidation', 'Direct Consolidation – Cloud Marketplace (CMP)', 'New Reseller Account – No Root Access', 'New Sub Account – No Root Access', 'RI Program Management'], 'Direct Consolidation'), q, true)}
        ${f('vendor', 'APN Tagging', sel([['', 'Select'], 'Internal', 'End User'], ''), q)}${f('vendor', 'Support Type', sel([['', 'Select'], 'Developer', 'Business', 'Enterprise', 'Partner Led', 'Basic'], 'Business'), q)}
        ${f('vendor', 'Payer Account', `<input class="in ${bad('vendor', 'Payer Account') ? 'err' : ''}">`, q)}${f('vendor', 'Existing Payee Account', '<input class="in">', q)}
        ${f('vendor', 'Consolidation Acceptance Date', dateBtn(''), false)}` : ''}
      ${msft ? `<div class="f-sec"><h3>Microsoft configuration ${q ? '<span class="chip warn">Required from Qualified</span>' : '<span class="chip">Optional until Qualified</span>'}</h3></div>
        ${f('vendor', 'MS CSP Tenant', '<input class="in" value="contoso.onmicrosoft.com">', q)}${f('vendor', 'MPN ID', '<input class="in" value="6112874">', q)}
        ${f('vendor', 'Migration Type', sel([['', 'Select'], 'CSP to CSP', 'Current Partner Growth Transition', 'EA to CSP', 'ISV', 'New Reseller', 'PAYG', 'Tier 1'], 'EA to CSP'), q)}${f('vendor', 'Service Name', `<span class="iw r">${sel([['', 'Select service'], 'Azure Plan', 'Microsoft 365 E5', 'Defender for Endpoint P2'], 'Azure Plan')}</span>`, q)}
        ${f('vendor', 'Competitive Winback', sel(['Yes', 'No', 'Unknown'], 'Unknown'), q)}` : ''}
      ${aws || msft ? `${f('vendor', 'End User Type', sel(['Commercial', 'Public Sector'], ms.eut, 'data-mre="eut"'), q)}${ms.eut === 'Public Sector' ? f('vendor', 'Public Sector Segment', sel([['', 'Select'], 'SLG – IMGSA', 'EDU – IMGSA', 'Federal – IMGSA', 'Healthcare – IMGSA', 'SLG – IMNCPA', 'EDU – IMNCPA', 'Federal – IMNCPA', 'Healthcare – IMNCPA', 'SLG – No Contract', 'EDU – No Contract', 'Federal – No Contract', 'Healthcare – No Contract', 'Non-Profit', 'SLG – IM OMNIA', 'EDU – IM OMNIA', 'Healthcare – IM OMNIA'], ''), false) : ''}` : ''}</div>`,
    money: `<div class="form-grid">${f('money', 'Country', sel(['Belgium', 'Netherlands'], 'Belgium'))}${f('money', 'Currency', sel(['EUR', 'USD'], o ? 'EUR' : 'USD'))}
      ${f('money', 'Estimated MRR', `<span class="iw"><span class="pre">€</span><input class="in num ${bad('money', 'Estimated MRR') ? 'err' : ''}" placeholder="0.00" value="${o ? (o.val / 12).toFixed(2) : ''}"></span>`)}
      ${f('money', 'Annual Revenue', `<span class="iw"><span class="pre">€</span><input class="in num ${bad('money', 'Annual Revenue') ? 'err' : ''}" placeholder="0.00" value="${o ? o.val.toLocaleString('en') + '.00' : ''}"></span>`)}
      ${f('money', 'Est. Margin', '<span class="iw"><span class="pre">€</span><input class="in num" placeholder="0.00"></span>', false)}${f('money', 'Expiration Date', dateBtn(o ? fmtDate(o.exp) : '21 Oct 2026'), false)}</div>`,
  };
  const reviewRows = [['customer', [['Customer', cust || '—'], ['Contact', o ? `${contactsFor(custBy(cust))[0].f} ${contactsFor(custBy(cust))[0].l}` : '—'], ['BCN', cust ? custBy(cust).bcn || '—' : '—'], ['Secondary owner', o?.o2 || '—']]], ['deal', [['Subject', o ? o.s : '—'], ['Stage', `${ms.stage} (${PROB[ms.stage]}%)`], ['Sell / type', 'Single · New'], ['Opp type', o ? 'Services' : '—']]], ['vendor', [['Primary vendor', ms.vendor || '—'], ['End user type', ms.eut]]], ['money', [['Annual revenue', o ? eur.format(o.val) : '—'], ['Estimated MRR', o ? eur.format(o.val / 12) : '—'], ['Expiration', o ? fmtDate(o.exp) : '21 Oct 2026'], ['Country · currency', o ? 'Belgium · EUR' : 'Belgium · USD']]]];
  secBody.review = `<div style="display:grid;gap:10px">${Object.values(miss).flat().length ? `<div class="errbox">${ic('alertc', 15)}<span>Still needed: ${Object.values(miss).flat().join(', ')}</span></div>` : `<div class="hintbox ok">${ic('checkc', 15)}<span>Everything required for <b>${ms.stage}</b> is filled in.</span></div>`}
    ${reviewRows.map(([sec, rows]) => `<section class="panel"><div class="panel-h"><h2>${SECS.find((s) => s[0] === sec)[1]}</h2>${miss[sec].length ? `<span class="chip neg">${miss[sec].length} missing</span>` : ''}<button class="link" type="button" data-a="wizSec" data-v="${sec}">Edit</button></div><div class="panel-b"><dl class="kv">${rows.map(([k, val]) => `<dt>${k}</dt><dd>${esc(val)}</dd>`).join('')}</dl></div></section>`).join('')}</div>`;
  const order = SECS.map((s) => s[0]), si = order.indexOf(ms.sec);
  const totalReq = SECS.reduce((a, s) => a + s[3], 0), missCount = Object.values(miss).flat().length;
  return { custom: true, w: 1000, tall: true,
    head: `<div class="modal-h" style="padding-bottom:12px;border-bottom:1px solid var(--border)"><div class="ht"><span class="tiny">${isNew ? 'New opportunity' : `Edit opportunity · ${o.num}`}</span><h2 style="font-size:17px">${o ? esc(o.s) : 'Untitled opportunity'}</h2></div>${o ? oppSt(o.status) : ''}<span class="chip accent">${ms.stage} · ${PROB[ms.stage]}%</span><button class="tb-btn" type="button" data-a="close" aria-label="Close">${ic('x', 15)}</button></div>`,
    body: `<div class="wiz"><nav class="wiz-rail">${SECS.map(([k, l, icn, n], idx) => { const m = miss[k].length, done = !m && (o || idx < si); return `<button type="button" class="${k === ms.sec ? 'cur' : ''}" data-a="wizSec" data-v="${k}"><span class="wiz-n ${m ? 'bad' : done ? 'ok' : ''}">${m ? '!' : done ? icI('check', 11) : idx + 1}</span><span style="flex:1"><b>${l}</b><span class="tiny">${k === 'review' ? 'Check and save' : m ? `${m} missing` : `${n} required`}</span></span></button>`; }).join('')}
      ${o && o.status === 'Open' ? `<div class="wiz-close"><span class="tiny">Close this deal</span><button class="btn sm" type="button" style="color:var(--pos)" data-a="closeOpp" data-v="won">${ic('trophy', 13)}Close as Won</button><button class="btn sm" type="button" style="color:var(--neg)" data-a="closeOpp" data-v="lost">${ic('octx', 13)}Close as Lost</button></div>` : ''}</nav>
      <div class="wiz-body"><h3 class="wiz-h">${SECS[si][1]}</h3>${secBody[ms.sec]}</div></div>`,
    foot: `<span class="sub num" style="color:${missCount ? 'var(--neg)' : 'var(--muted)'}">${totalReq - missCount} / ${totalReq} required filled</span><span class="grow"></span><button class="btn ghost" type="button" data-a="close">Cancel</button>${si > 0 ? `<button class="btn" type="button" data-a="wizSec" data-v="${order[si - 1]}">Back</button>` : ''}${si < order.length - 1 ? `<button class="btn" type="button" data-a="wizSec" data-v="${order[si + 1]}">Next</button>` : ''}<button class="btn primary" type="button" data-a="oppSave">${ic('save', 13)}${isNew ? 'Create opportunity' : 'Save'}</button>` };
}
let modalFresh = false, modalTok = 0;
function openModal(name, arg, ms = {}) { const was = !!M || !!$('modalRoot').querySelector('.modal-root:not(.out)'); M = { name, arg, ms: { ...ms } }; modalFresh = !was; modalTok++; renderModal(); }
function closeModal() {
  M = null; const root = $('modalRoot'), mr = root.querySelector('.modal-root'); const tok = ++modalTok;
  if (!mr) return; mr.classList.remove('anim'); mr.classList.add('out'); setTimeout(() => { if (tok === modalTok) root.innerHTML = ''; }, 150);
}
function renderModal() {
  const root = $('modalRoot'); if (!M) { root.innerHTML = ''; return; }
  const m = MODALS[M.name](M.arg);
  root.innerHTML = `<div class="modal-root ${m.dark ? 'dark' : ''} ${modalFresh ? 'anim' : ''}" data-modalbg="${m.noClose ? '' : '1'}"><div class="modal ${m.tall ? 'tall' : ''}" style="--mw:${m.w || 520}px" role="dialog" aria-modal="true">${m.custom ? m.head : `<div class="modal-h"><div class="ht">${m.title ? `<h2>${m.title}</h2>` : ''}${m.sub ? `<p>${m.sub}</p>` : ''}</div>${m.noClose ? '' : `<button class="tb-btn" type="button" data-a="close" aria-label="Close">${ic('x', 15)}</button>`}</div>`}<div class="modal-b">${m.body}</div>${m.foot ? `<div class="modal-f">${m.foot}</div>` : ''}</div></div>`;
  modalFresh = false;
  if (m.custom) root.querySelector('.modal').style.gridTemplateRows = 'auto minmax(0,1fr) auto';
}

// ================= Pickers / popovers =================
function openPicker(anchor, html, opts = {}) {
  const p = $('picker'); p.innerHTML = html; p.hidden = false; p.dataset.kind = opts.kind || ''; p.style.maxWidth = opts.wide ? '600px' : '';
  const r = anchor ? anchor.getBoundingClientRect() : { left: opts.x, bottom: opts.y, right: opts.x, top: opts.y };
  const pr = p.getBoundingClientRect();
  let x = opts.alignRight ? r.right - pr.width : r.left, y = opts.above ? r.top - pr.height - 6 : (r.bottom ?? r.top) + 4;
  if (opts.side === 'right') { x = r.right + 6; y = r.top; }
  p.style.left = Math.max(8, Math.min(x, innerWidth - pr.width - 8)) + 'px';
  p.style.top = Math.max(8, Math.min(y, innerHeight - pr.height - 8)) + 'px';
}
const closePicker = () => { $('picker').hidden = true; $('picker').dataset.kind = ''; };
function filterPopover(kind) {
  const head = (title, n) => `<div class="fp-h"><b>${title}</b>${n >= 2 ? `<div class="seg" style="margin-left:auto"><button type="button" data-a="matchSet" data-v="all" aria-pressed="${state.match === 'all'}">${ic('combine', 12)}Match all</button><button type="button" data-a="matchSet" data-v="any" aria-pressed="${state.match === 'any'}">${ic('split', 12)}Match any</button></div>` : ''}</div>`;
  const foot = (clr) => `<div class="fp-f"><button class="link" type="button" data-a="${clr}">Clear all</button><span class="grow"></span><button class="btn sm primary" type="button" data-a="pickClose">Done</button></div>`;
  if (kind === 'filters:cust') { const n = activeCustFilters().length; return `<div class="fp">${head('Filter customers', n)}<div class="fp-g">${[['Status', ['All statuses', 'Active', 'Inactive']], ['Owner', ['All owners', ...OWNERS]], ['Industry', ['All industries', ...new Set(CUSTOMERS.map((x) => x.ind))]], ['Segment', ['All segments', 'Enterprise', 'Mid-market', 'SMB', 'Public']], ['Country', ['All countries', 'Belgium', 'Netherlands']], ['City', ['All cities', ...new Set(CUSTOMERS.map((x) => x.city))]]].map(([l, o]) => fld(l, sel(o, o[0], '', 'sl sm'))).join('')}${fld('Health', sel([['all', 'All health'], ['healthy', 'Healthy (70+)'], ['risk', 'At risk (40–69)'], ['critical', 'Critical (<40)']], state.healthF, 'id="healthF"', 'sl sm'))}${fld('Activity', `<button class="btn sm" type="button" data-a="noAct" aria-pressed="${state.noAct}" style="justify-content:flex-start">No activity in 90+ days</button>`)}</div><div class="fp-sub">Account team</div><div class="fp-g">${[['Customer Success Manager', ['All CSMs', 'Thomas Peeters']], ['AWS Owner', ['All AWS owners', 'Koen De Wilde']], ['Azure Owner', ['All Azure owners', 'Amélie Laurent']], ['Inside Sales Owner', ['All inside sales owners', 'Sarah Dubois']], ['Account Manager', ['All account managers', 'Lien Verhoeven']]].map(([l, o]) => fld(l, sel(o, o[0], '', 'sl sm'))).join('')}</div>${foot('clearCust')}</div>`; }
  if (kind === 'filters:opp') { const n = [state.oppStatus !== 'all', state.oppExp !== 'all', state.oppStage !== 'all'].filter(Boolean).length; return `<div class="fp">${head('Filter opportunities', n)}<div class="fp-g">${fld('Stage', sel([['all', 'All stages'], ...STAGES], state.oppStage, 'id="oppStage"', 'sl sm'))}${fld('Company', sel(['All companies', ...new Set(OPPS.map((o) => o.c))], '', '', 'sl sm'))}${fld('Status', sel([['all', 'All statuses'], 'Open', 'Won', 'Lost'], state.oppStatus, 'id="oppStatus"', 'sl sm'))}${fld('Expiration', sel([['all', 'All'], ['active', 'Not expired'], ['expired', 'Expired']], state.oppExp, 'id="oppExp"', 'sl sm'))}${fld('Primary owner', sel(['All primary owners', 'Dylan Hias'], '', '', 'sl sm'))}${fld('Secondary owner', sel(['All secondary owners', ...OWNERS.slice(1)], '', '', 'sl sm'))}</div>${foot('clearOpp')}</div>`; }
  return `<div class="fp">${head('Filter customers', 0)}<div class="fp-g">${fld('Country', sel(['All', 'BE', 'NL'], 'All', '', 'sl sm'))}${fld('City', sel(['All', ...new Set(CUSTOMERS.map((x) => x.city))], 'All', '', 'sl sm'))}${fld('Cloud Customer', sel(['All', 'Yes', 'No'], 'All', '', 'sl sm'))}${fld('ARR source', sel(['All', 'Live (Power BI)', 'Synced (D365)'], 'All', '', 'sl sm'))}${fld('ARR min (€)', '<input class="in sm" placeholder="Min">')}${fld('ARR max (€)', '<input class="in sm" placeholder="Max">')}</div>${foot('pickClose')}</div>`;
}
function togglePop(kind, el, html) { const p = $('picker'); if (!p.hidden && p.dataset.kind === kind) { closePicker(); return; } openPicker(el, html || filterPopover(kind), { kind, wide: true, alignRight: false }); }
let pickerOk = null;
function confirmPop(anchor, msg, okLabel = 'Delete', onOk, primary) { pickerOk = onOk; openPicker(anchor, `<div class="confirm"><div class="msg">${ic('alert', 15)}<span>${msg}</span></div><div class="row-flex"><button class="btn" type="button" data-a="pickClose">Cancel</button><button class="btn ${primary ? 'primary' : 'danger-fill'}" type="button" data-a="pickOk">${okLabel}</button></div></div>`, { alignRight: true }); }
const menuHtml = (items) => items.map((it) => it === '-' ? '<hr>' : typeof it === 'string' ? `<div class="ph">${it}</div>` : `<button class="mi ${it[4] ? 'danger' : ''}" type="button" data-a="${it[2]}" data-v="${esc(it[3] ?? '')}">${ic(it[1], 14)}${it[0]}${it[5] ? `<span class="k">${it[5]}</span>` : ''}</button>`).join('');
function calendarHtml() { const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']; let g = days.map((d) => `<span>${d}</span>`).join(''); for (let d = 28; d <= 30; d++) g += `<button type="button" class="out" data-a="pickDate" data-v="${d} Sep 2026">${d}</button>`; for (let d = 1; d <= 31; d++) g += `<button type="button" class="${d === 14 ? 'today' : ''} ${d === 15 ? 'sel' : ''}" data-a="pickDate" data-v="${String(d).padStart(2, '0')} Oct 2026">${d}</button>`; for (let d = 1; d <= 1; d++) g += `<button type="button" class="out">${d}</button>`; return `<div class="cal"><div class="cal-h"><button class="tb-btn" type="button">${ic('chevl', 13)}</button><b>October 2026</b><button class="tb-btn" type="button">${ic('chev', 13)}</button></div><div class="cal-g">${g}</div></div>`; }
const timeHtml = () => `<div class="timecols"><div>${Array.from({ length: 24 }, (_, h) => `<button type="button" class="${h === 14 ? 'sel' : ''}" data-a="pickClose">${String(h).padStart(2, '0')}</button>`).join('')}</div><span style="align-self:center;font-weight:600">:</span><div>${Array.from({ length: 12 }, (_, m) => `<button type="button" class="${m === 0 ? 'sel' : ''}" data-a="pickClose">${String(m * 5).padStart(2, '0')}</button>`).join('')}</div></div>`;
const CTX = {
  cust: (n) => ['Customer', ['Open', 'ext', 'cust', n], ['Add Activity', 'plus', 'modal', 'activityForm', 0, 'N'], ['Add Follow-Up', 'clock', 'modal', 'followupForm'], ['Add Opportunity', 'target', 'oppNew', 'locked'], '-', [state.favs.has(n) ? 'Remove from favorites' : 'Add to favorites', 'bookmark', 'fav', n], ['Copy account number', 'copy', 'toast', 'Copied account number', 0, 'Ctrl+C'], ['Open in Dynamics 365', 'ext', 'toast', 'Opens the record in Dynamics 365']],
  opp: (i) => ['Opportunity', ['Open', 'ext', 'oppEdit', i], ['Close as Won', 'trophy', 'closeFrom', 'won:' + i], ['Close as Lost', 'octx', 'closeFrom', 'lost:' + i], '-', ['Copy opportunity ID', 'copy', 'toast', 'Copied ' + (OPPS[i]?.num || '')]],
  act: (i) => ['Activity', ['Open', 'ext', 'actPreview', i], ['Edit', 'edit', 'modal', 'activityEdit'], ['Create follow-up', 'clock', 'modal', 'followupForm'], '-', ['Delete', 'trash', 'toast', 'Activity deleted', 1, 'Del']],
  task: (i) => ['Follow-up', [isDone(+i) ? 'Reopen' : 'Mark as complete', 'check', 'toggleDone', i, 0, 'Space'], ['Edit', 'edit', 'modal', 'followupEdit'], '-', ['Delete', 'trash', 'toast', 'Removing follow-up from Dynamics 365…', 1, 'Del']],
  contact: () => ['Contact', ['Send email', 'mail', 'toast', 'Opens Outlook'], ['Call', 'call', 'toast', 'Starts a Teams call'], ['Set as primary contact', 'star', 'toast', 'Primary contact saved locally. Will sync to D365 once the contact itself syncs.'], ['Edit', 'edit', 'modal', 'contactEdit'], '-', ['Delete', 'trash', 'toast', 'Contact deleted', 1]],
};

// ================= Custom dropdown menu (replaces the native select popup) =================
let selEl = null;
function openSelMenu(s) {
  const m = $('selMenu'); selEl = s; const r = s.getBoundingClientRect();
  m.innerHTML = [...s.options].map((o, i) => `<button type="button" class="mi ${o.selected ? 'on' : ''}" data-si="${i}">${o.selected ? icI('check', 12) : '<span class="ck"></span>'}<span>${esc(o.text)}</span></button>`).join('');
  m.hidden = false; m.style.minWidth = r.width + 'px';
  const mr = m.getBoundingClientRect(); let y = r.bottom + 4; if (y + mr.height > innerHeight - 8) y = Math.max(8, r.top - mr.height - 4);
  m.style.left = Math.max(8, Math.min(r.left, innerWidth - mr.width - 8)) + 'px'; m.style.top = y + 'px';
  m.querySelector('.on')?.scrollIntoView({ block: 'nearest' });
}
const closeSelMenu = () => { $('selMenu').hidden = true; selEl = null; };
document.addEventListener('mousedown', (e) => { const s = e.target.closest('select'); if (s && !s.disabled) { e.preventDefault(); s.focus(); $('selMenu').hidden || selEl !== s ? openSelMenu(s) : closeSelMenu(); } else if (!e.target.closest('#selMenu')) closeSelMenu(); }, true);
document.addEventListener('click', (e) => { const b = e.target.closest('#selMenu [data-si]'); if (!b || !selEl) return; e.stopPropagation(); const s = selEl; s.selectedIndex = +b.dataset.si; closeSelMenu(); s.dispatchEvent(new Event('change', { bubbles: true })); }, true);
document.addEventListener('scroll', (e) => { if (!e.target.closest?.('#selMenu')) closeSelMenu(); }, true);

// ================= Toasts / confetti =================
function toast(title, desc = '', kind = 'success', dur = 3800) {
  const el = document.createElement('div'); el.className = `tst ${kind}`;
  el.innerHTML = `${ic({ success: 'checkc', info: 'alertc', warning: 'alert', error: 'xc' }[kind], 16)}<div><b>${title}</b>${desc ? `<span>${desc}</span>` : ''}</div><button class="x" type="button" aria-label="Dismiss">${ic('x', 13)}</button>`;
  const out = () => { el.classList.add('out'); setTimeout(() => el.remove(), 170); };
  el.querySelector('.x').onclick = out; $('toasts').appendChild(el); setTimeout(out, dur);
}
function confetti(big) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c); c.width = innerWidth; c.height = innerHeight; const g = c.getContext('2d');
  const cols = [cfg.accent, '#16a34a', '#f59e0b', '#ec4899', '#7c3aed', '#06b6d4'];
  const ps = Array.from({ length: big ? 260 : 140 }, (_, i) => ({ x: i % 2 ? innerWidth * 0.1 : innerWidth * 0.9, y: innerHeight * 0.8, vx: (i % 2 ? 1 : -1) * (3 + Math.random() * 7), vy: -(9 + Math.random() * 9), r: 3 + Math.random() * 4, c: cols[i % cols.length], a: Math.random() * 6 }));
  let t = 0; (function tick() { g.clearRect(0, 0, c.width, c.height); ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.vx *= 0.99; p.a += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); g.restore(); }); if (++t < 170) requestAnimationFrame(tick); else c.remove(); })();
}

// ================= Full-screen states =================
function loginHtml() {
  const s = state.loginState;
  return `<div class="login2">
    <div class="lg-side">
      <div class="lg-brand">${logoSvg(cfg.logo, 28)}<b>Ingram Micro CRM</b></div>
      <div class="lg-form">
        <h1>Sign in</h1>
        <p class="sub">Use your Ingram Micro work account.</p>
        ${s === 'error' ? `<div class="errbox">${ic('alertc', 15)}<span>Login was cancelled or failed. Please try again.</span></div>` : ''}
        <button class="ms-btn2" type="button" data-a="signIn" ${s === 'signing' ? 'disabled' : ''}>${s === 'signing' ? '<span class="spin"></span>Signing in…' : `<svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>Sign in with Microsoft`}</button>
        ${s === 'signing' ? '<p class="sub">Finish signing in in the Microsoft window.</p>' : ''}
        <button class="link" type="button" data-a="skipLogin" style="color:var(--faint);font-size:12px">Skip login (dev only)</button>
      </div>
      <div class="lg-foot"><span>v3.0.0</span><span class="grow"></span><span>${icI(state.online ? 'wifi' : 'wifioff', 11)} ${state.online ? 'Online' : 'Offline'}</span></div>
    </div>
    <div class="lg-art" aria-hidden="true">${loginArt()}<div class="lg-copy"><b>Field Sales CRM</b><span>Customers, pipeline and follow-ups for the Benelux cloud team.</span></div></div>
  </div>`;
}
function loginArt() {
  let s = '';
  for (let k = 0; k < 14; k++) { const y = 80 + k * 46, o = (0.05 + (k % 5) * 0.025).toFixed(3); s += `<path d="M-40 ${y + 240}C${220 + k * 12} ${y + 120} ${420 - k * 8} ${y - 60} ${880} ${y - 180 - k * 6}" fill="none" style="stroke:var(--accent);stroke-opacity:${o}" stroke-width="${1 + (k % 3) * 0.6}"/>`; }
  s += '<circle cx="640" cy="210" r="120" style="fill:var(--accent);fill-opacity:.06"/><circle cx="640" cy="210" r="64" style="fill:var(--accent);fill-opacity:.10"/><circle cx="640" cy="210" r="22" style="fill:var(--accent);fill-opacity:.55"/>';
  s += '<circle cx="190" cy="560" r="10" style="fill:var(--accent);fill-opacity:.35"/><circle cx="420" cy="380" r="6" style="fill:var(--accent);fill-opacity:.35"/>';
  return `<svg class="lg-svg" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">${s}</svg>`;
}
const splashHtml = () => `<div class="center-state">${logoSvg(cfg.logo, 48)}<span class="spin lg"></span><span class="sub">Loading...</span></div>`;
const errorHtml = () => `<div class="center-state"><div class="err-ic">${ic('alertc', 24)}</div><b style="font-size:15px">Database failed to initialize</b><span class="sub" style="max-width:46ch">SQLITE_CANTOPEN: unable to open database file at %APPDATA%\\im-crm\\crm.db</span><button class="btn sm" type="button" data-a="retry">Retry</button></div>`;

// ================= Chat (Iris) =================
let chatLog = [{ me: 1, t: 'Which of my customers have had no activity in 60 days?' }, { ai: 1, tool: 'Searched customers for "no activity 60 days"', t: '<p>Two of your customers have had no logged activity for more than 60 days:</p><p>• <b>Ardennes Bois SA</b> — last activity 94 days ago<br>• <b>Waasland Food Partners</b> — last activity 71 days ago</p><p>Want me to open one of them?</p>' }];
function chatHtml() {
  const st = state.chat, dot = { ready: 'var(--pos)', unavailable: 'var(--neg)' }[st] || 'var(--faint)', sub = { ready: 'Local AI assistant', checking: 'Waking up…', pulling: 'Setting up…', unavailable: 'Offline' }[st];
  const greet = `<div class="bub ai"><p>Hi, I'm Iris. 👋</p><p>Your assistant for Ingram Micro CRM. I can help you find your way around the app, explain how features work, or look up details about your customers and contacts.</p><p>What can I help you with?</p></div>`;
  const extra = st === 'pulling' ? `<div class="bub ai" style="display:grid;gap:8px;min-width:280px"><b class="row-flex">${ic('download', 14)}Getting set up for the first time</b><span class="sub">Downloading my local model (qwen2.5:3b-instruct-q4_K_M). This is a one-time download.</span><div class="prog"><i style="width:42%"></i></div><div class="f-row tiny"><span>Downloading…</span><span>42%</span></div></div>` : st === 'unavailable' ? `<div class="bub ai"><p>I can't reach my local engine right now. Make sure the app finished starting, then try again.</p><button class="btn sm" type="button" data-a="chatState" data-v="ready" style="margin-top:8px">${ic('rotate', 12)}Retry</button></div>` : chatLog.map((m) => m.me ? `<div class="bub me">${esc(m.t)}</div>` : m.typing ? '<div class="bub ai"><span class="dots3"><i></i><i></i><i></i></span></div>' : `<div class="bub ai">${m.tool ? `<span class="toolchip">${icI('search', 10)} ${esc(m.tool)}</span>` : ''}${m.t}</div>`).join('');
  return `<div class="chat-root" data-a="chatBg"><div class="chat" role="dialog" aria-label="Iris assistant"><div class="chat-h"><span class="iris">${ic('sparkles', 16)}</span><div style="flex:1"><b class="row-flex" style="gap:6px">Iris <span class="dot" style="background:${dot}"></span></b><span class="tiny">${sub}</span></div><button class="tb-btn" type="button" data-a="chatClear" title="Clear chat">${ic('trash', 14)}</button><button class="tb-btn" type="button" data-a="chat" title="Close assistant">${ic('x', 15)}</button></div>
    <div class="chat-b" id="chatB">${greet}${extra}</div>
    <div class="composer"><textarea id="chatIn" rows="1" placeholder="${st === 'ready' ? 'Ask Iris anything…' : 'Assistant is starting up…'}" ${st === 'ready' ? '' : 'disabled'}></textarea><button class="send" type="button" data-a="chatSend" title="Send (Enter)">${ic('send', 16)}</button></div></div></div>`;
}
const openChat = (on) => { $('chatRoot').innerHTML = on ? chatHtml() : ''; if (on) { const b = $('chatB'); b.scrollTop = b.scrollHeight; $('chatIn')?.focus(); } };
function chatSend() {
  const inp = $('chatIn'); const v = inp?.value.trim(); if (!v) return;
  chatLog.push({ me: 1, t: v }, { typing: 1 }); openChat(true);
  setTimeout(() => { chatLog.pop(); chatLog.push({ ai: 1, tool: `Looked up "${v.slice(0, 32)}"`, t: '<p>This is a design preview, so I can\'t look that up yet. In the app I answer from your local customer data.</p>' }); openChat(true); }, 1100);
}

// ================= Walkthrough =================
const WALK = [
  ['Welcome to Ingram Micro CRM', "Let's take a quick tour so you know where everything is. This won't take long.", '.side', 'home'],
  ['Navigation', 'Switch between Home, Customers, Pipeline, Activity and Reports from here.', '#navList', 'home'],
  ['Your Customers', "All your accounts are listed here. Use search and filters to quickly find who you're looking for.", '.pane.list', 'customers'],
  ['Favourites', 'Hover over any customer and click the bookmark to pin them to the sidebar.', '.c-row', 'customers'],
  ['Customer Detail', 'The selected customer opens right next to the list, with everything about the account in one place.', '.record', 'customers'],
  ['Tabs', 'Overview, Activities, Contacts, Follow-Ups, Opportunities, Revenue and Details for this customer.', '.record .tabs', 'customers'],
  ['Details', 'Account numbers, the account team and vendor IDs live on the Details tab.', '[data-a="recTab"][data-v="details"]', 'customers'],
  ['Your Follow-Ups', 'All your follow-ups across every customer. Overdue items come first.', '.pane.list', 'activity', { actMode: 'tasks' }],
  ['Pipeline', 'Pick a deal on the left to see everything about it on the right. Switch to Board to see deals by stage.', '.pane.list', 'pipeline', { pipeView: 'list' }],
  ['Reports', "Revenue, pipeline, customer health and your own activity, each on one dashboard with a shared period.", '.view-bar .seg', 'reports', { repTab: 'revenue' }],
  ['Export to Excel', 'Export the current view to Excel at any time.', '[data-a="export"]', 'reports', { repTab: 'revenue' }],
  ['Sync', 'Your sync status, Sync, Settings, Admin and Debug all live behind your name.', '#profileBtn', 'home'],
  ["You're all set!", 'Your profile, Admin panel, Debug, settings and shortcuts are under your name at the bottom left. Press Ctrl+K anytime to search or navigate.', '#profileBtn', 'home'],
];
let walkI = -1;
function renderWalk() {
  const ring = $('wtRing'), card = $('wtCard');
  if (walkI < 0) { ring.hidden = card.hidden = true; return; }
  const [t, b, selector, route, extra] = WALK[walkI];
  if (state.route !== route || extra) { Object.assign(state, extra || {}); state.route = route; render(); }
  const el = document.querySelector(selector); const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 2 - 40, width: 200, height: 80 };
  ring.hidden = card.hidden = false;
  Object.assign(ring.style, { left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
  card.innerHTML = `<div class="f-row"><b>${t}</b><button class="tb-btn" type="button" data-a="walkEnd" aria-label="Close tour">${ic('x', 14)}</button></div><span class="tiny">${walkI + 1} of ${WALK.length}</span><p style="color:var(--fg-2);line-height:1.55">${b}</p><div class="f-row" style="margin-top:4px"><button class="link" type="button" data-a="walkEnd" style="color:var(--muted)">Skip tour</button><div class="row-flex">${walkI ? '<button class="btn sm" type="button" data-a="walkBack">Back</button>' : ''}<button class="btn sm primary" type="button" data-a="walkNext">${walkI === WALK.length - 1 ? 'Done' : 'Next'}</button></div></div>`;
  const cr = card.getBoundingClientRect(); let x = r.left + r.width + 14, y = r.top;
  if (x + cr.width > innerWidth - 8) { x = Math.max(8, r.left + r.width - cr.width); y = r.top + r.height + 14; }
  if (y + cr.height > innerHeight - 8) y = Math.max(8, r.top - cr.height - 14);
  card.style.left = Math.max(8, x) + 'px'; card.style.top = Math.max(8, y) + 'px';
}

// ================= Screen index =================
const IDX = [
  ['Start-up', [['Login', 'screen:login'], ['Login · signing in', 'screen:login-signing'], ['Login · error', 'screen:login-error'], ['Loading', 'screen:splash'], ['Database error', 'screen:error'], ['First-run sync', 'modal:initialSync'], ['Guided tour', 'walk'], ['Launch reminders', 'digest'], ['Birthday surprise', 'birthday'], ['Go offline / online', 'online']]],
  ['Home', [['Home', 'go:home'], ['Quick add menu', 'quickAdd'], ['Customer picker', 'modal:quickPick']]],
  ['Customers', [['Customer list + record', 'go:customers'], ['Filters popover', 'custFiltersOn'], ['Overview tab', 'tab:overview'], ['Activities tab (kanban)', 'tab:activities'], ['Contacts tab', 'tab:contacts'], ['Follow-Ups tab', 'tab:followups'], ['Opportunities tab', 'tab:opportunities'], ['Revenue tab', 'tab:revenue'], ['Details tab', 'tab:details'], ['Add Activity', 'modal:activityForm'], ['Edit Activity', 'modal:activityEdit'], ['Activity preview', 'modal:actPreview:0'], ['Add Follow-Up', 'modal:followupForm'], ['Edit Follow-Up', 'modal:followupEdit'], ['Follow-up preview', 'modal:taskPreview:0'], ['Add Contact', 'modal:contactForm'], ['Edit Contact', 'modal:contactEdit'], ['Vendor Related edit', 'modal:vendorEdit'], ['Cloud contacts edit', 'modal:cloudEdit']]],
  ['Pipeline', [['List + detail', 'pipe:list'], ['Board view', 'pipe:board'], ['Filters popover', 'oppFiltersOn'], ['New opportunity', 'oppNew'], ['Edit · AWS deal', 'oppEdit:0'], ['Edit · Microsoft deal', 'oppEdit:2'], ['Close as Won', 'close:won'], ['Close as Lost', 'close:lost'], ['Won celebration', 'confetti']]],
  ['Activity', [['Timeline', 'act:feed'], ['Your Follow-Ups', 'act:tasks']]],
  ['Reports', [['Revenue', 'rep:revenue'], ['Pipeline', 'rep:pipeline'], ['Customers', 'rep:customers'], ['My activity', 'rep:me'], ['Columns picker', 'columnsDemo']]],
  ['Sync', [['Sync page', 'go:sync'], ['Run a sync', 'runSync']]],
  ['Settings', [['Settings home', 'set:home'], ...SET_TABS.map(([k, l]) => [l, 'set:' + k]), ['Settings search', 'setSearch']]],
  ['Admin', [...ADMIN_TABS.filter(Array.isArray).map(([k, l]) => [l, 'adm:' + k]), ['Access denied', 'admDenied']]],
  ['Debug', [['Console', 'dbg:console'], ['Sync Logs', 'dbg:synclogs'], ['Revenue Cache', 'dbg:cache']]],
  ['Help', [['Help', 'go:help']]],
  ['Loading', [['Customers loading', 'load:customers'], ['Customer record loading', 'load:record'], ['Page loading', 'load:page'], ['Customer not found', 'missing'], ['Changes waiting to sync', 'pending'], ['Syncing', 'syncing']]],
  ['Window', [['Keyboard shortcuts', 'modal:shortcuts'], ['Changelog', 'modal:changelog'], ['Command palette', 'palette'], ['Update available', 'updatePop'], ['Right-click menu', 'ctxDemo'], ['Confirm popover', 'confirmDemo'], ['Date picker', 'dateDemo'], ['Collapsed sidebar', 'rail']]],
];
const idxHtml = () => `<div class="idx-root" data-a="idxBg"><div class="idx" role="dialog" aria-label="All screens"><div class="idx-h">${ic('grid', 16)}<h2>All screens</h2><span class="sub">Every view, tab, dialog and popup in the app</span><button class="tb-btn" type="button" data-a="idx" aria-label="Close">${ic('x', 15)}</button></div><div class="idx-b">${IDX.map(([g, items]) => `<div class="idx-g"><h3>${g}</h3>${items.map(([l, a]) => `<button type="button" data-a="idxGo" data-v="${a}">${ic('chev', 11)}${l}</button>`).join('')}</div>`).join('')}</div></div></div>`;
function idxGo(a) {
  $('idxRoot').innerHTML = ''; const [k, v, w] = a.split(':');
  const goApp = () => { if (state.screen !== 'app') { state.screen = 'app'; } };
  if (k === 'screen') { state.screen = v.startsWith('login') ? 'login' : v; state.loginState = v === 'login-signing' ? 'signing' : v === 'login-error' ? 'error' : 'idle'; closeModal(); render(); if (v === 'splash') setTimeout(() => { state.screen = 'app'; render(); }, 1800); return; }

  goApp();
  ({
    modal: () => { render(); openModal(v, w ?? (v === 'quickPick' ? 'activity' : undefined)); if (v === 'initialSync') runInitialSync(); },
    go: () => go(v), tab: () => { state.recTab = v; go('customers'); }, pipe: () => { state.pipeView = v; go('pipeline'); }, act: () => { state.actMode = v; go('activity'); },
    rep: () => { state.repTab = v; go('reports'); }, set: () => { state.setTab = v; state.setQ = ''; go('settings'); }, adm: () => { state.adminDenied = false; state.adminTab = v; go('admin'); }, dbg: () => { state.debugTab = v; go('debug'); },
    admDenied: () => { state.adminDenied = true; go('admin'); }, chat: () => { render(); state.chat = v; openChat(true); },
    walk: () => { render(); startWalk(); }, digest: () => { render(); launchToasts(); }, birthday: () => { render(); openModal('birthday'); confetti(); }, online: () => { toggleOnline(); },
    quickAdd: () => { go('home'); setTimeout(() => ACTIONS.quickAdd(null, document.querySelector('[data-a="quickAdd"]')), 30); },
    gsDemo: () => { go('home'); const i = $('gsearch'); i.value = 'br'; i.dispatchEvent(new Event('input')); i.focus(); },
    custFiltersOn: () => { go('customers'); ACTIONS.custFilters(); }, oppFiltersOn: () => { state.pipeView = 'list'; go('pipeline'); ACTIONS.oppFilters(); }, setSearch: () => { state.setQ = 'sync'; go('settings'); },
    oppNew: () => { go('pipeline'); openModal('opp', 'new'); }, oppEdit: () => { go('pipeline'); openModal('opp', v); },
    close: () => { go('pipeline'); openModal('closeOpp', v, { opp: 0 }); }, confetti: () => { render(); confetti(true); toast('Deal won!', 'BE - Cloud consolidation - Brabant Logistics - AWS - 96K'); },
    columnsDemo: () => { state.repTab = 'revenue'; go('reports'); setTimeout(() => ACTIONS.columns(null, document.querySelector('[data-a="columns"]')), 30); },
    runSync: () => { if (M && M.name === 'account') closeModal(); go('sync'); ACTIONS.runSync(); }, palette: () => { render(); openPalette(); },
    updatePop: () => { render(); ACTIONS.updatePop(null, document.querySelector('.update-btn')); }, ctxDemo: () => { go('customers'); const el = document.querySelector('.c-row'); const r = el.getBoundingClientRect(); showCtx(r.left + 80, r.top + 20, 'cust', el.dataset.cn); },
    confirmDemo: () => { state.recTab = 'followups'; go('customers'); const el = document.querySelector('.r-item .check'); confirmPop(el, `Mark "${TASKS[4].t}" as complete?`, 'Complete', () => toast('Follow-up completed'), true); },
    dateDemo: () => { render(); openModal('followupForm'); setTimeout(() => openPicker(document.querySelector('.modal [data-a="datePick"]'), calendarHtml()), 30); },
    rail: () => { $('win').classList.toggle('rail'); render(); },
    load: () => { if (v === 'page') { state.repTab = 'revenue'; state.route = 'reports'; } else state.route = 'customers'; showLoading(v, 2400); },
    missing: () => { state.custMissing = true; go('customers'); },
    pending: () => { state.pending = Math.max(state.pending, 4); render(); },
    syncing: () => { state.pending = Math.max(state.pending, 4); render(); ACTIONS.runSync(); },
  }[k] || (() => render()))();
}
function startWalk() { walkI = 0; renderWalk(); }
function runInitialSync() { let s = 0; const tick = () => { if (!M || M.name !== 'initialSync') return; s++; M.ms.step = s; renderModal(); if (s < 9) setTimeout(tick, s < 3 ? 700 : 450); }; setTimeout(tick, 700); }
function launchToasts() { toast('Daily digest', '2 overdue • 2 due today • 3 upcoming • 3 stale • 2 expiring', 'warning', 7000); }
function toggleOnline() { state.online = !state.online; render(); state.online ? toast('Back online', 'Your changes will sync automatically') : toast("You're offline", 'Changes will be saved locally and sync when you reconnect', 'warning', 6000); }

// ================= Command palette =================
let pSel = 0, pItems = [];
function renderPalette() {
  const q = $('pIn').value.trim().toLowerCase();
  const nav = NAV.map(([k, l, i], n) => ({ g: 'Navigation', l: `Go to ${l}`, i, k: String(n + 1), run: () => go(k) })).concat([{ g: 'Navigation', l: 'Open Settings', i: 'settings', k: 'S', run: () => go('settings') }, { g: 'Navigation', l: 'Toggle Sidebar', i: 'columns', k: 'B', run: () => $('win').classList.toggle('rail') }, { g: 'Navigation', l: 'Go to Sync', i: 'sync', k: '', run: () => go('sync') }, { g: 'Navigation', l: 'Open Admin panel', i: 'shield', k: '', run: () => go('admin') }, { g: 'Navigation', l: 'Open Debug', i: 'bug', k: '', run: () => go('debug') }]);
  const general = [{ g: 'General', l: 'Keyboard Shortcuts', i: 'keyboard', k: '?', run: () => openModal('shortcuts') }, { g: 'Page Actions', l: 'New Item', i: 'plus', k: 'N', run: () => ACTIONS.quickAdd(null, document.querySelector('[data-a="quickAdd"]') || $('newBtn')) }, { g: 'Data', l: 'Trigger Sync', i: 'sync', k: 'Ctrl+Shift+R', run: () => ACTIONS.runSync() }, { g: 'Other', l: 'Help', i: 'help', k: '', run: () => go('help') }];
  const custs = CUSTOMERS.map((c) => ({ g: 'Customers', l: c.name, i: 'building', k: c.city, run: () => go('customers', { customer: c.name }) })).slice(0, q ? 5 : 0);
  const cons = q ? CPOOL.map(([f, l], n) => ({ g: 'Contacts', l: `${f} ${l}`, i: 'user', k: CUSTOMERS[n % CUSTOMERS.length].name, run: () => go('customers', { customer: CUSTOMERS[n % CUSTOMERS.length].name, recTab: 'contacts' }) })) : [];
  pItems = (q ? [...nav.filter((x) => x.l.toLowerCase().includes(q)), ...custs, ...cons] : [...nav, ...general]).filter((x) => !q || x.l.toLowerCase().includes(q)).slice(0, 14);
  pSel = Math.min(pSel, Math.max(pItems.length - 1, 0)); let last = '';
  $('pList').innerHTML = pItems.map((x, i) => { const h = x.g !== last ? `<li class="grp">${x.g}</li>` : ''; last = x.g; return `${h}<li><button type="button" class="${i === pSel ? 'sel' : ''}" data-pi="${i}">${ic(x.i, 15)}${esc(x.l)}<span class="k">${x.k && /^[\w+?]+$/.test(x.k) && x.g !== 'Customers' && x.g !== 'Contacts' ? kbd(x.k.split('+')) : esc(x.k)}</span></button></li>`; }).join('') || '<li class="grp">No results found.</li>';
}
function openPalette() { $('pRoot').hidden = false; $('pIn').value = ''; pSel = 0; renderPalette(); $('pIn').focus(); }
const closePalette = () => { $('pRoot').hidden = true; };

// ================= Shell =================
function sideHtml() {
  const overdue = TASKS.filter((t, i) => t.over && !isDone(i)).length;
  const favs = CUSTOMERS.filter((c) => state.favs.has(c.name));
  return `<button class="new-btn" type="button" id="newBtn" data-a="quickAdd" title="New (N)">${ic('plus', 15)}<span>New</span></button>
    <div id="navList" style="display:grid;gap:2px">${NAV.map(([k, l, i], n) => `<button class="nav-item" type="button" data-a="go" data-v="${k}" title="${l} (${n + 1})" ${state.route === k ? 'aria-current="page"' : ''}>${ic(i, 16)}<span class="lbl">${l}</span>${k === 'activity' && overdue ? `<span class="count">${overdue}</span>` : ''}</button>`).join('')}</div>
    ${favs.length ? `<div class="side-label"><span>${icI('bookmark', 11)} Favorites</span></div><div class="pinned">${favs.map((c) => `<button class="nav-item" type="button" data-a="cust" data-v="${esc(c.name)}" data-ctx="cust" data-cn="${esc(c.name)}" title="${esc(c.name)}"><span class="pin-init" style="${pastel(c.name)}">${initials(c.name)}</span><span class="lbl">${esc(c.name)}</span></button>`).join('')}</div>` : ''}
    ${state.recent.length ? `<div class="side-label"><span>${icI('clock', 11)} Recent</span><button type="button" data-a="clearRecent">✕ Clear</button></div><div class="pinned">${state.recent.map((n) => `<button class="nav-item" type="button" data-a="cust" data-v="${esc(n)}" data-ctx="cust" data-cn="${esc(n)}" title="${esc(n)}"><span class="pin-init" style="${pastel(n)}">${initials(n)}</span><span class="lbl">${esc(n)}</span></button>`).join('')}</div>` : ''}
    <div class="spacer"></div>
    ${state.update ? `<button class="update-btn" type="button" data-a="updatePop" title="Update available">${ic('download', 15)}<span>Update</span></button>` : ''}
    <button class="nav-item" type="button" data-a="rail" title="${$('win').classList.contains('rail') ? 'Expand sidebar' : 'Collapse sidebar'} (B)">${ic($('win').classList.contains('rail') ? 'chevsr' : 'chevsl', 16)}<span class="lbl">Collapse</span></button>
    <div class="side-sep"></div>
    <button class="nav-item me-row" type="button" id="profileBtn" data-a="profileMenu" title="${ME.name}" ${['admin', 'debug', 'sync', 'settings', 'help'].includes(state.route) ? 'aria-current="page"' : ''}><span class="avatar">DH</span><span class="lbl"><b>${ME.name}</b></span><span class="lbl" style="flex:none">${ic('dots', 14)}</span></button>`;
}
function titleHtml(v) {
  const bare = state.screen !== 'app';
  return `<div class="tb-left"><div class="app-id">${logoSvg(cfg.logo, 18)}<span>Ingram Micro CRM</span></div>${bare ? '' : ``}</div>
    ${bare ? '' : `<button class="search" type="button" data-a="palette" aria-label="Search">${ic('search', 14)}<span>Search</span><kbd>Ctrl K</kbd></button>`}
    <div class="tb-right">${bare ? '' : `<span class="online ${state.online ? '' : 'off'}">${icI(state.online ? 'wifi' : 'wifioff', 11)} ${state.online ? 'Online' : 'Offline'}</span>${state.syncing ? `<span class="pend sync"><span class="spin"></span>Syncing…</span>` : state.pending ? `<button class="pend" type="button" data-a="go" data-v="sync" title="2 activities · 1 follow-up · 1 opportunity waiting to sync">${icI('upload', 11)} ${state.pending} pending</button>` : ''}<button class="tb-btn" type="button" data-a="idx" title="All screens" aria-label="All screens">${ic('grid', 15)}</button>`}<button class="tb-btn" type="button" data-a="tune" title="Design controls" aria-label="Design controls" aria-pressed="${!$('tuner').hidden}">${ic('palette', 15)}</button>
    <div class="wc"><button type="button" data-a="wc" data-v="min" title="Minimize" aria-label="Minimize">${'<svg class="ic" width="10" height="10" viewBox="0 0 10 10"><path d="M0 5h10" stroke="currentColor" stroke-width="1"/></svg>'}</button><button type="button" data-a="wc" data-v="max" title="${cfg.win === 'max' ? 'Restore' : 'Maximize'}" aria-label="Maximize">${cfg.win === 'max' ? '<svg class="ic" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x="0.5" y="2.5" width="7" height="7"/><path d="M2.5 2.5V.5h7v7h-2"/></svg>' : '<svg class="ic" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1"><rect x="0.5" y="0.5" width="9" height="9"/></svg>'}</button><button type="button" class="close" data-a="wc" data-v="close" title="Close" aria-label="Close"><svg class="ic" width="10" height="10" viewBox="0 0 10 10"><path d="M0 0l10 10M10 0 0 10" stroke="currentColor" stroke-width="1"/></svg></button></div></div>`;
}
let focusId = null, focusPos = 0, lastVK = '', lastCK = '', lastRK = '';
function enterClass() {
  const ld = state.loading && state.loading !== 'record' ? state.loading : '';
  const vk = state.screen === 'app' ? [state.route, state.route === 'customers' ? '' : [state.repTab, state.setTab, state.adminTab, state.debugTab, state.helpTab, state.actMode, state.pipeView].join(), ld].join('|') : state.screen;
  const ck = state.customer, rk = [state.recTab, state.loading === 'record', state.custMissing].join('|');
  const cls = vk !== lastVK ? 'enter-view' : ck !== lastCK ? 'enter-rec enter-cust' : rk !== lastRK ? 'enter-rec' : '';
  lastVK = vk; lastCK = ck; lastRK = rk; return cls;
}
function showLoading(kind, ms = 1100) { state.loading = kind; render(); setTimeout(() => { if (state.loading === kind) { state.loading = null; render(); } }, ms); }
function render() {
  const win = $('win');
  const keep = {}; document.querySelectorAll('[data-sk]').forEach((el) => { keep[el.dataset.sk] = [el.scrollTop, el.scrollLeft]; });
  const ae = document.activeElement; if (ae && ae.id && ae.tagName === 'INPUT') { focusId = ae.id; focusPos = ae.selectionStart; } else focusId = null;
  const bare = state.screen !== 'app'; win.classList.toggle('bare', bare);
  const ec = enterClass(); $('sheet').className = 'sheet ' + ec;
  if (bare) {
    $('titlebar').innerHTML = titleHtml({ crumbs: [] }); $('side').hidden = true;
    $('sheet').innerHTML = state.screen === 'login' ? loginHtml() : state.screen === 'splash' ? splashHtml() : errorHtml();
    return;
  }
  $('side').hidden = false;
  const v = views[state.route]();
  if (state.route === 'customers' && (state.loading === 'customers' || state.loading === 'record' || state.custMissing)) v.body = v.body.replace(/<div class="record">[\s\S]*$/, `<div class="record">${state.custMissing ? missingRecord() : skelRecord()}</div></div>`);
  else if (state.loading === 'page') v.body = skelPage();
  $('titlebar').innerHTML = titleHtml(v); $('side').innerHTML = sideHtml();
  $('sheet').innerHTML = `<div class="view-bar">${v.bar}</div>${v.body}`;
  document.querySelectorAll('[data-sk]').forEach((el) => { const k = keep[el.dataset.sk]; if (k) { el.scrollTop = k[0]; el.scrollLeft = k[1]; } });
  const pk = $('picker'); if (!pk.hidden && (pk.dataset.kind || '').startsWith('filters:')) pk.innerHTML = filterPopover(pk.dataset.kind);
  if (focusId && $(focusId)) { const el = $(focusId); el.focus(); try { el.setSelectionRange(focusPos, focusPos); } catch (e) { /* not a text input */ } }
}
function go(route, extra = {}, push = true) {
  const changed = route !== state.route || (extra.customer && extra.customer !== state.customer);
  if (M && M.name === 'account') closeModal();
  if (route !== 'customers' || extra.customer) state.custMissing = false;
  state.loading = null;
  Object.assign(state, { route }, extra);
  if (extra.customer && !state.recent.includes(extra.customer)) state.recent = [extra.customer, ...state.recent].slice(0, 4);
  if (push && changed) { hist.stack = hist.stack.slice(0, hist.i + 1); hist.stack.push({ route, customer: state.customer }); hist.i = hist.stack.length - 1; }
  closePicker(); render();
}
const travel = (d) => { const n = hist.i + d; if (n < 0 || n >= hist.stack.length) return; hist.i = n; Object.assign(state, hist.stack[n]); render(); };
function showCtx(x, y, kind, arg) { openPicker(null, menuHtml(CTX[kind](arg)), { x, y }); }

// ================= Actions =================
const ACTIONS = {
  go: (v) => go(v), cust: (v) => go('customers', { customer: v }), custRev: (v) => go('customers', { customer: v, recTab: 'revenue' }),
  goClose: (v) => { closeModal(); go(v); }, back: () => travel(-1), fwd: () => travel(1),
  fav: (v) => { state.favs.has(v) ? state.favs.delete(v) : state.favs.add(v); closePicker(); render(); },
  custCloud: (v) => { state.custCloud = v; render(); },
  matchSet: (v) => { state.match = v; render(); },
  selOpp: (v) => { state.selOpp = +v; render(); }, stageF: (v) => { state.oppStage = v; render(); },
  wizSec: (v) => { M.ms.sec = v; renderModal(); }, actType: (v) => { M.ms.type = v; renderModal(); },
  repPeriod: (v) => { state.repPeriod = v; render(); },
  setExp: (v, el, e) => { if (e.target.closest('.ctl button, .ctl select, .ctl input')) return; state.setOpen[v] = !(state.setOpen[v] ?? false); render(); },
  profileMenu: () => openModal('account'),
  sortMenu: (v, el) => openPicker(el, `<div class="ph">Sort by</div>` + SORTS.map((s) => `<button class="mi" type="button" data-a="setSort" data-v="${s}">${s === state.custSort ? icI('check', 12) : '<span style="width:12px;display:inline-block"></span>'}${s}</button>`).join('') + '<hr>' + [['desc', 'Descending', 'arrowdown'], ['asc', 'Ascending', 'arrowup']].map(([k, l, i]) => `<button class="mi" type="button" data-a="setDir" data-v="${k}">${state.custDir === k ? icI('check', 12) : '<span style="width:12px;display:inline-block"></span>'}${l}</button>`).join(''), { alignRight: true }),
  setSort: (v) => { state.custSort = v; closePicker(); render(); }, setDir: (v) => { state.custDir = v; closePicker(); render(); },
  logLevel: (v) => { state.logLevel = v; render(); }, logSel: (v) => { state.logSel = +v; render(); },
  copy: (v) => { const [k, val] = v.split('|'); try { navigator.clipboard?.writeText(val).catch(() => {}); } catch (e) { /* clipboard unavailable in preview */ } toast(`Copied ${k.toLowerCase()}`, val, 'success', 1800); },
  slLevel: (v) => { state.slLevel = v; render(); }, slSel: (v) => { state.slSel = +v; render(); },
  favOnly: () => { state.favOnly = !state.favOnly; render(); }, custFilters: (v, el) => togglePop('filters:cust', el || document.querySelector('[data-a="custFilters"]')), noAct: () => { state.noAct = !state.noAct; render(); },
  match: () => { state.match = state.match === 'all' ? 'any' : 'all'; render(); }, clearCust: () => { Object.assign(state, { favOnly: false, noAct: false, healthF: 'all' }); render(); },
  rmFilter: (k) => { state[k] = k === 'healthF' ? 'all' : false; render(); }, custDir: () => { state.custDir = state.custDir === 'desc' ? 'asc' : 'desc'; render(); },
  recTab: (v) => { state.recTab = v; render(); }, kbCollapse: (v) => { state.collapsed[v] = true; render(); }, kbExpand: (v) => { state.collapsed[v] = false; render(); },
  actPreview: (v) => openModal('actPreview', v), taskOpen: (v) => openModal('taskPreview', v),
  selTask: (v) => { state.selTask = +v; render(); }, selAct: (v) => { state.selAct = +v; render(); },
  toggleDone: (v) => { const i = +v; state.done.has(i) ? state.done.delete(i) : state.done.add(i); closePicker(); if (M?.name === 'taskPreview') renderModal(); render(); },
  confirmDone: (v, el) => confirmPop(el, `Mark "${esc(TASKS[+v].t)}" as complete?`, 'Complete', () => { state.done.add(+v); render(); if (M) closeModal(); toast('Follow-up completed'); }, true),
  confirm: (v, el) => confirmPop(el, v, el.dataset.ok || 'Delete', () => { toast(el.dataset.ok ? 'Done' : 'Deleted'); }),
  pickOk: () => { closePicker(); pickerOk?.(); }, pickClose: () => closePicker(),
  modal: (v) => { const ms = M?.ms?.cust ? { cust: M.ms.cust } : {}; closePicker(); openModal(v, undefined, ms); }, close: () => closeModal(),
  save: (v) => { closeModal(); state.pending++; render(); toast(v); }, contactSave: () => { M.ms.ok = true; renderModal(); setTimeout(closeModal, 900); },
  oppEdit: (v) => { closePicker(); openModal('opp', v); }, oppNew: (v) => { closePicker(); openModal('opp', v === 'locked' ? 'locked' : 'new'); },
  stage: (v) => { M.ms.stage = v; renderModal(); }, oppSave: () => { const isNew = M.arg === 'new' || M.arg === 'locked'; if (isNew && !M.ms.missing) { M.ms.missing = true; M.ms.sec = 'review'; renderModal(); return; } closeModal(); toast(isNew ? 'Opportunity created' : 'Opportunity saved'); },
  closeOpp: (v) => { const opp = isNaN(+M?.arg) ? 0 : +M.arg; openModal('closeOpp', v, { opp }); }, closeFrom: (v) => { const [k, i] = v.split(':'); closePicker(); openModal('closeOpp', k, { opp: +i }); },
  closeDeal: (v) => { closeModal(); if (v === 'won') { confetti(true); toast('Closed as Won', 'Nice work. That one goes on the board.'); } else toast('Closed as Lost', '', 'info'); },
  pipeView: (v) => { state.pipeView = v; render(); }, oppDir: () => { state.oppDir = state.oppDir === 'desc' ? 'asc' : 'desc'; render(); }, mine: () => { state.mine = !state.mine; render(); },
  oppFilters: (v, el) => togglePop('filters:opp', el || document.querySelector('[data-a="oppFilters"]')), clearOpp: () => { Object.assign(state, { oppStatus: 'all', oppStage: 'all', oppExp: 'all' }); render(); }, rmOpp: (k) => { state[k] = k === 'mine' ? false : 'all'; render(); },
  actMode: (v) => { state.actMode = v; render(); }, goTasks: () => go('activity', { actMode: 'tasks' }), repTab: (v) => { state.repTab = v; render(); }, revFilters: (v, el) => togglePop('filters:rev', el),
  setTab: (v) => { state.setTab = v; state.setQ = ''; render(); }, adminTab: (v) => { state.adminTab = v; render(); }, debugTab: (v) => { state.debugTab = v; render(); }, helpTab: (v) => { state.helpTab = v; render(); },
  lbOpen: (v) => { state.lbOpen = state.lbOpen === +v ? -1 : +v; render(); }, pbiTab: (v) => { state.pbiTab = v; render(); }, runSql: () => { state.dbRan = true; render(); },
  kbRec: (v) => { state.kbRec = state.kbRec === +v ? -1 : +v; render(); },
  sw: (v, el) => { el.setAttribute('aria-checked', el.getAttribute('aria-checked') !== 'true'); if (el.dataset.x) { state[el.dataset.x] = !state[el.dataset.x]; render(); } },
  toast: (v) => { closePicker(); toast(v); },
  export: () => { toast('Exporting…', '', 'info', 1400); setTimeout(() => toast('Export complete', 'Saved to Downloads\\revenue-overview-2026-10-14.xlsx'), 1400); },
  refresh: () => { showLoading('page', 900); setTimeout(() => toast('Revenue refreshed', '56 customers updated from Power BI'), 900); },
  runSync: () => {
    if (state.syncing) return; if (!state.online) { toast('You\'re offline', 'Connect to sync.', 'warning'); return; }
    const n = state.pending; state.syncing = true; render(); toast('Sync started', 'Pulling from Dynamics 365…', 'info', 1800);
    setTimeout(() => { state.syncing = false; state.pending = 0; render(); toast('Sync complete', `1,284 records pulled · ${n} pushed`); }, 1900);
  },
  custBack: () => { state.custMissing = false; state.customer = CUSTOMERS[0].name; render(); },
  updatePop: (v, el) => openPicker(el, `<div class="confirm"><div class="msg">${ic('alert', 15)}<span>The application will restart after updating.</span></div><button class="btn primary" type="button" data-a="updateNow">Update now</button></div>`, { side: 'right' }),
  updateNow: () => { closePicker(); toast('Downloading update…', 'Version 3.0.1', 'info'); },
  quickAdd: (v, el) => openPicker(el, menuHtml([['Log activity', 'activity', 'qp', 'activity'], ['New follow-up', 'calendar', 'qp', 'followup'], ['New opportunity', 'target', 'oppNew', 'new']]), { alignRight: el?.closest('.view-bar') != null }),
  qp: (v) => { closePicker(); openModal('quickPick', v); },
  columns: (v, el) => openPicker(el, `<div style="padding:6px;width:240px"><div class="ph">Columns</div>${['Customer Name', 'Contact', 'Phone', 'Email', 'Cloud Customer', 'ARR'].map((c) => `<div class="row-flex" style="padding:5px 4px;flex-wrap:nowrap"><span style="color:var(--faint)">${ic('grip', 13)}</span><button class="check" type="button" role="checkbox" aria-checked="${c !== 'Phone'}" data-a="chk">${ic('check', 11)}</button><span>${c}</span></div>`).join('')}<hr><button class="link" type="button" style="padding:4px">${icI('rotate', 11)} Reset to defaults</button></div>`),
  chk: (v, el) => el.setAttribute('aria-checked', el.getAttribute('aria-checked') !== 'true'),
  datePick: (v, el) => openPicker(el, calendarHtml()), timePick: (v, el) => openPicker(el, timeHtml()), pickDate: () => closePicker(),
  cityFilter: (v) => go('customers', { custQ: v }),
  ctxBtn: (v, el) => { const r = el.getBoundingClientRect(); showCtx(r.left - 150, r.bottom + 4, v, el.dataset.cn); },
  clearRecent: () => { state.recent = []; render(); },
  rail: () => { $('win').classList.toggle('rail'); render(); }, palette: () => openPalette(),
  idx: () => { $('idxRoot').innerHTML = $('idxRoot').innerHTML ? '' : idxHtml(); }, idxGo: (v) => idxGo(v), idxBg: (v, el, e) => { if (e.target === el) $('idxRoot').innerHTML = ''; },
  tune: () => { setTuner($('tuner').hidden); render(); },
  wc: (v) => { if (v === 'max') { cfg.win = cfg.win === 'max' ? 'windowed' : 'max'; applyCfg(); } else toast(v === 'min' ? 'Minimize is handled by Windows' : 'Close is handled by Windows', '', 'info'); },
  chat: () => openChat(!$('chatRoot').innerHTML), chatBg: (v, el, e) => { if (e.target === el) openChat(false); }, chatSend: () => chatSend(), chatClear: () => { chatLog = []; openChat(true); }, chatState: (v) => { state.chat = v; openChat(true); },
  walk: () => startWalk(), walkNext: () => { walkI = walkI >= WALK.length - 1 ? -1 : walkI + 1; renderWalk(); }, walkBack: () => { walkI = Math.max(0, walkI - 1); renderWalk(); }, walkEnd: () => { walkI = -1; renderWalk(); },
  getStarted: () => { closeModal(); startWalk(); setTimeout(launchToasts, 400); },
  signIn: () => { state.loginState = 'signing'; render(); setTimeout(() => { state.screen = 'app'; state.loginState = 'idle'; render(); openModal('initialSync'); runInitialSync(); }, 1300); },
  skipLogin: () => { state.screen = 'app'; showLoading('page', 700); }, logout: () => { closeModal(); state.screen = 'login'; render(); },
  retry: () => { state.screen = 'splash'; render(); setTimeout(() => { state.screen = 'app'; render(); }, 1200); },
  cfg: (v, el) => { cfg[el.dataset.k] = v; applyCfg(); render(); }, hexApply: () => { const v = $('hexIn').value.trim(); if (/^#[0-9a-f]{6}$/i.test(v)) { cfg.accent = v; applyCfg(); render(); } else toast('Enter a colour like #ff6b35', '', 'error'); },
  confetti: (v) => confetti(v === 'whale'),
};

// ================= Events =================
document.addEventListener('click', (e) => {
  const pick = $('picker');
  if (!pick.hidden && !e.target.closest('#picker') && !e.target.closest('[data-a="quickAdd"],[data-a="datePick"],[data-a="timePick"],[data-a="columns"],[data-a="updatePop"],[data-a="ctxBtn"],[data-a="confirm"],[data-a="confirmDone"],[data-a="custFilters"],[data-a="oppFilters"],[data-a="revFilters"],[data-a="sortMenu"]')) closePicker();
  const bg = e.target.closest('[data-modalbg]'); if (bg && e.target === bg && bg.dataset.modalbg) { closeModal(); return; }
  const pi = e.target.closest('[data-pi]'); if (pi) { closePalette(); pItems[+pi.dataset.pi].run(); return; }
  if (e.target.id === 'pRoot') { closePalette(); return; }
  const gr = e.target.closest('[data-gr]'); if (gr) { const [k, v] = gr.dataset.gr.split('|'); if (k === 'c') go('customers', { customer: v }); else if (k === 'o') openModal('opp', v); else if (k === 'a') openModal('actPreview', v); else if (k === 't') openModal('taskPreview', v); return; }
  const t = e.target.closest('[data-a]'); if (!t) return;
  const fn = ACTIONS[t.dataset.a]; if (!fn) return;
  if (t.tagName === 'A') e.preventDefault();
  fn(t.dataset.v, t, e);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.mre && M) { M.ms[el.dataset.mre] = el.value; renderModal(); return; }
  if (el.dataset.cfgsel) { cfg[el.dataset.cfgsel] = el.value; applyCfg(); render(); return; }
  const map = { custSort: 'custSort', healthF: 'healthF', oppStage: 'oppStage', oppStatus: 'oppStatus', oppExp: 'oppExp', anPeriod: 'anPeriod', region: 'region', period: 'period', revSort: 'revSort', logLevel: 'logLevel' };
  if (map[el.id]) { state[map[el.id]] = el.value; render(); }
});
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id === 'custSearch') { state.custQ = el.value; $('custList').innerHTML = custListHtml(filteredCustomers()); }
  if (el.id === 'oppSearch') { state.oppQ = el.value; render(); }
  if (el.id === 'feedSearch') { state.feedQ = el.value; render(); }
  if (el.id === 'setSearch') { state.setQ = el.value; render(); }
  if (el.id === 'logSearch') { state.logQ = el.value; render(); }
  if (el.id === 'slSearch') { state.slQ = el.value; render(); }
  if (el.id === 'gsearch') {
    const q = el.value.trim().toLowerCase(), box = $('gres'); if (!q) { box.hidden = true; return; }
    const grp = [['Customers', CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4).map((c) => ['c|' + c.name, 'building', c.name, `${c.acct} · ${c.bcn} · ${c.city}`])], ['Contacts', CPOOL.filter(([f, l]) => (f + ' ' + l).toLowerCase().includes(q)).slice(0, 3).map(([f, l], n) => ['c|' + CUSTOMERS[n].name, 'user', `${f} ${l}`, CUSTOMERS[n].name])], ['Opportunities', OPPS.filter((o) => o.s.toLowerCase().includes(q)).slice(0, 3).map((o) => ['o|' + OPPS.indexOf(o), 'target', o.s, o.c])], ['Activities', ACTS.filter((a) => (a.t + a.c).toLowerCase().includes(q)).slice(0, 3).map((a) => ['a|' + ACTS.indexOf(a), a.type, a.t, a.c])], ['Follow-Ups', TASKS.filter((x) => (x.t + x.c).toLowerCase().includes(q)).slice(0, 3).map((x) => ['t|' + TASKS.indexOf(x), 'calendar', x.t, x.due])]].filter((g) => g[1].length);
    box.innerHTML = grp.length ? grp.map(([g, rows]) => `<div class="gh">${g}</div>${rows.map(([k, i, a, b]) => `<button type="button" data-gr="${esc(k)}">${ic(i, 14)}<b style="font-weight:550">${esc(a)}</b><span class="sec">${esc(b)}</span></button>`).join('')}`).join('') : `<div class="empty">No results for "${esc(el.value)}"</div>`;
    box.hidden = false;
  }
  if (el.id === 'pIn') { pSel = 0; renderPalette(); }
});
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('input, textarea, .selectable, [contenteditable]')) return;
  e.preventDefault(); const t = e.target.closest('[data-ctx]'); if (!t) { closePicker(); return; }
  showCtx(e.clientX, e.clientY, t.dataset.ctx, t.dataset.cn || t.dataset.ci);
});
document.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-drag]'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.drag); e.dataTransfer.effectAllowed = 'move'; } });
document.addEventListener('dragover', (e) => { const col = e.target.closest('[data-drop]'); if (col) { e.preventDefault(); document.querySelectorAll('.kb-col.over').forEach((x) => x !== col && x.classList.remove('over')); col.classList.add('over'); } });
document.addEventListener('drop', (e) => { const col = e.target.closest('[data-drop]'); if (!col) return; e.preventDefault(); const i = +e.dataTransfer.getData('text/plain'); if (ACTS[i]) { ACTS[i].st = col.dataset.drop; state.collapsed[col.dataset.drop] = false; render(); toast(`Moved to ${col.dataset.drop[0].toUpperCase() + col.dataset.drop.slice(1)}`); } });
let listW = 300;
document.addEventListener('pointerdown', (e) => {
  const s = e.target.closest('.splitter'); if (!s) return; e.preventDefault(); s.classList.add('drag'); s.setPointerCapture(e.pointerId);
  const x0 = e.clientX, w0 = listW, win = $('win');
  const mv = (ev) => { listW = Math.max(240, Math.min(480, w0 + ev.clientX - x0)); win.style.setProperty('--list-w', listW + 'px'); };
  const up = () => { s.classList.remove('drag'); s.removeEventListener('pointermove', mv); s.removeEventListener('pointerup', up); };
  s.addEventListener('pointermove', mv); s.addEventListener('pointerup', up);
});
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let kPos = 0, armed = false;
document.addEventListener('keydown', (e) => {
  kPos = e.key === KONAMI[kPos] ? kPos + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (kPos === KONAMI.length) { kPos = 0; armed ? toast('🎯 Sales Mode already armed — go close a deal!', '', 'info') : toast('🎯 Sales Mode armed', "Your next won opportunity gets a hero's welcome."); armed = true; }
  if (e.target.id === 'chatIn' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); return; }
  if (e.target.id === 'pIn') {
    if (e.key === 'ArrowDown') { pSel = Math.min(pSel + 1, pItems.length - 1); renderPalette(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { pSel = Math.max(pSel - 1, 0); renderPalette(); e.preventDefault(); }
    else if (e.key === 'Enter' && pItems[pSel]) { closePalette(); pItems[pSel].run(); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('pRoot').hidden ? openPalette() : closePalette(); return; }
  if (e.key === 'Escape' && !$('selMenu').hidden) { closeSelMenu(); return; }
  if (e.key === 'Escape') { if (!$('pRoot').hidden) closePalette(); else if (!$('picker').hidden) closePicker(); else if ($('idxRoot').innerHTML) $('idxRoot').innerHTML = ''; else if (walkI >= 0) ACTIONS.walkEnd(); else if (M && M.name !== 'initialSync') closeModal(); else if ($('chatRoot').innerHTML) openChat(false); return; }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') { e.preventDefault(); ACTIONS.runSync(); return; }
  if (e.altKey && e.key === 'ArrowLeft') { travel(-1); return; } if (e.altKey && e.key === 'ArrowRight') { travel(1); return; }
  if (e.target.closest('input, textarea, select, [contenteditable]') || M || !$('pRoot').hidden || state.screen !== 'app' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^[1-5]$/.test(e.key)) { go(NAV[+e.key - 1][0]); return; }
  const k = e.key.toLowerCase();
  if (k === 's') go('settings'); else if (k === 'b') ACTIONS.rail(); else if (e.key === '?') openModal('shortcuts');
  else if (k === 'n') ACTIONS.quickAdd(null, document.querySelector('.view-bar [data-a="quickAdd"]') || $('newBtn'));
  else if (e.key === '/') { e.preventDefault(); (document.querySelector('#gsearch, #custSearch, #oppSearch, #feedSearch'))?.focus(); }
  else if (k === 'f') { if (state.route === 'customers') ACTIONS.custFilters(); else if (state.route === 'pipeline') ACTIONS.oppFilters(); }
  else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && state.route === 'customers') { e.preventDefault(); const l = filteredCustomers(), i = l.findIndex((c) => c.name === state.customer), n = l[Math.max(0, Math.min(l.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]; if (n) { go('customers', { customer: n.name }, false); document.querySelector('.c-row[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }); } }
});
addEventListener('resize', () => { if (walkI >= 0) renderWalk(); });

// ================= Design controls =================
const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
const rgbToHsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`; };
const hsl = (hex) => rgbToHsl(hexToRgb(hex));
function exportTokens() {
  const a = hexToRgb(cfg.accent), W = [255, 255, 255], aD = mix(a, W, 0.2);
  const L = { background: '#f7f7f9', foreground: '#17171c', card: '#ffffff', popover: '#ffffff', muted: '#f1f1f4', 'muted-foreground': '#6b6b76', border: '#e2e2e8', input: '#cfcfd7', 'sidebar-bg': '#eceef2', 'titlebar-bg': '#eceef2', 'sidebar-hover-bg': '#e1e3e9' };
  const D = { background: '#212227', foreground: '#f0f0f3', card: '#28292f', popover: '#2d2e35', muted: '#1e1f24', 'muted-foreground': '#9c9da8', border: '#36373f', input: '#464750', 'sidebar-bg': '#1c1d21', 'titlebar-bg': '#1c1d21', 'sidebar-hover-bg': '#27282d' };
  const lines = (o) => Object.entries(o).map(([k, v]) => `    --${k}: ${hsl(v)};`).join('\n');
  return `/* IM CRM redesign — logo: ${cfg.logo}; font: ${cfg.font}; density: ${cfg.density}; panels: ${cfg.elev} */\n@layer base {\n  :root {\n${lines(L)}\n    --primary: ${rgbToHsl(a)};\n    --primary-foreground: 0 0% 100%;\n    --accent: ${rgbToHsl(mix(a, W, 0.9))};\n    --accent-foreground: ${rgbToHsl(mix(a, [23, 23, 28], 0.18))};\n    --ring: ${rgbToHsl(a)};\n    --radius: ${+(cfg.radius / 16).toFixed(3)}rem;\n  }\n  .dark {\n${lines(D)}\n    --primary: ${rgbToHsl(aD)};\n    --primary-foreground: 0 0% 100%;\n    --accent: ${rgbToHsl(mix([40, 41, 47], aD, 0.18))};\n    --accent-foreground: ${rgbToHsl(mix(aD, W, 0.2))};\n    --ring: ${rgbToHsl(aD)};\n  }\n}`;
}
const hostTheme = document.documentElement.getAttribute('data-theme');
function applyCfg() {
  const root = document.documentElement;
  root.style.setProperty('--accent-base', cfg.accent); root.style.setProperty('--font', FONTS.find((f) => f[0] === cfg.font)[1]);
  root.style.setProperty('--r', cfg.radius + 'px'); root.style.setProperty('--d', { compact: 0.78, cozy: 0.89, comfortable: 1 }[cfg.density]);
  $('win').dataset.elev = cfg.elev; $('win').classList.toggle('windowed', cfg.win === 'windowed');
  if (cfg.theme === 'system') { hostTheme ? root.setAttribute('data-theme', hostTheme) : root.removeAttribute('data-theme'); } else root.setAttribute('data-theme', cfg.theme);
  [['themeSeg', 'theme'], ['densitySeg', 'density'], ['elevSeg', 'elev'], ['winSeg', 'win']].forEach(([id, k]) => document.querySelectorAll(`#${id} button`).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === cfg[k])));
  document.querySelectorAll('#swatches .swatch').forEach((b) => b.setAttribute('aria-pressed', b.dataset.hex.toLowerCase() === cfg.accent.toLowerCase()));
  document.querySelectorAll('#logoPick button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === cfg.logo));
  const named = ACCENTS.find((x) => x[1].toLowerCase() === cfg.accent.toLowerCase());
  $('accentVal').textContent = `${named ? named[0] : 'Custom'} ${cfg.accent}`; $('customColor').value = cfg.accent; $('fontSel').value = cfg.font;
  $('radius').value = cfg.radius; $('radiusVal').textContent = cfg.radius + 'px'; $('export').value = exportTokens();
  try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* storage unavailable: settings last for this visit only */ }
}
function setTuner(open) { $('tuner').hidden = !open; }
function initTuner() {
  $('swatches').innerHTML = ACCENTS.map(([n, h]) => `<button class="swatch" type="button" style="background:${h}" data-hex="${h}" aria-label="${n}" title="${n}"></button>`).join('') + '<input type="color" class="custom-color" id="customColor" aria-label="Custom accent colour" title="Custom colour">';
  $('fontSel').innerHTML = FONTS.map(([n]) => `<option value="${n}">${n}</option>`).join('');
  $('logoPick').innerHTML = [['pathway', 'Pathway'], ['stages', 'Stages'], ['orbit', 'Orbit']].map(([k, l]) => `<button type="button" data-v="${k}">${logoSvg(k, 34)}${l}</button>`).join('');
  $('logoPick').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cfg.logo = b.dataset.v; applyCfg(); render(); } });
  $('swatches').addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) { cfg.accent = b.dataset.hex; applyCfg(); if (state.route === 'settings') render(); } });
  $('customColor').addEventListener('input', (e) => { cfg.accent = e.target.value; applyCfg(); });
  $('fontSel').addEventListener('change', (e) => { cfg.font = e.target.value; applyCfg(); });
  $('radius').addEventListener('input', (e) => { cfg.radius = +e.target.value; applyCfg(); });
  [['themeSeg', 'theme'], ['densitySeg', 'density'], ['elevSeg', 'elev'], ['winSeg', 'win']].forEach(([id, k]) => $(id).addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cfg[k] = b.dataset.v; applyCfg(); render(); } }));
  $('resetTokens').addEventListener('click', () => { cfg = { ...DEFAULTS }; applyCfg(); render(); toast('Reset to defaults'); });
  $('copyTokens').addEventListener('click', () => { const ta = $('export'); const fb = () => { ta.focus(); ta.select(); toast('Selected', 'Press Ctrl+C to copy', 'info'); }; if (navigator.clipboard?.writeText) navigator.clipboard.writeText(ta.value).then(() => toast('Tokens copied'), fb); else fb(); });
  $('closeTuner').addEventListener('click', () => { setTuner(false); render(); });
  const tn = $('tuner'); tn.style.left = Math.max(8, innerWidth - 290 - 60) + 'px'; tn.style.top = '80px';
  $('tunerBar').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; const bar = e.currentTarget; bar.setPointerCapture(e.pointerId); const r = tn.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; const mv = (ev) => { tn.style.left = Math.max(0, Math.min(innerWidth - r.width, ev.clientX - dx)) + 'px'; tn.style.top = Math.max(0, Math.min(innerHeight - 40, ev.clientY - dy)) + 'px'; }; const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); }; bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); });
  if (innerWidth < 1100) setTuner(false);
}

// ================= Boot =================
$('titlebar').addEventListener('dblclick', (e) => { if (e.target.closest('button')) return; cfg.win = cfg.win === 'max' ? 'windowed' : 'max'; applyCfg(); render(); });
initTuner(); applyCfg(); render();
