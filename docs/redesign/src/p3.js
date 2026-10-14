// ================= State =================
const state = {
  screen: 'app', loginState: 'idle', pending: 4, syncing: false, loading: null, custMissing: false, route: 'home', online: true, update: true,
  customer: CUSTOMERS[0].name, custQ: '', custCloud: 'all', selOpp: 0, setQ: '', setOpen: {}, autoTheme: false, quiet: true, repPeriod: '12M', custSort: 'Last Activity', custDir: 'desc', favOnly: false, custFilters: false, noAct: false, healthF: 'all',
  recTab: 'overview', actRange: 'Last 3 months', contactQ: '', collapsed: {},
  pipeView: 'list', oppQ: '', oppSort: 'Created', oppDir: 'desc', mine: false, oppFilters: false, oppStatus: 'all', oppStage: 'all', oppExp: 'all', match: 'all',
  actMode: 'feed', feedQ: '', selAct: 0, selTask: 0, done: new Set(TASKS.map((t, i) => t.done ? i : -1).filter((i) => i >= 0)),
  repTab: 'revenue', revFilters: false, revSort: 'ARR', region: 'All Benelux', period: 'Last 12 months', anPeriod: 'Last 30 days', dim: 'Industry', expWin: 'Next 30 days',
  setTab: 'home', adminTab: 'analytics', adminDenied: false, lbOpen: -1, pbiTab: 'Tables', dbRan: false, debugTab: 'console', logLevel: 'all', helpTab: 'getting-started',
  favs: new Set(CUSTOMERS.filter((c) => c.fav).map((c) => c.name)), recent: ['Liège Medical Imaging', 'Scheldt Port Systems', 'Gentse Zorggroep vzw'],
  kbRec: -1, chat: 'ready', logQ: '', logSel: 6, slQ: '', slLevel: 'all', slSel: 0,
};
const isDone = (i) => state.done.has(i);

// ================= Views =================
const views = {};

// ---------- Home (Dashboard) ----------
const CITY_XY = { Antwerp: [4.40, 51.22], Ghent: [3.72, 51.05], Mechelen: [4.48, 51.03], Liège: [5.57, 50.63], Leuven: [4.70, 50.88], Namur: [4.87, 50.47], Kortrijk: [3.27, 50.83], Hasselt: [5.34, 50.93], Bastogne: [5.72, 50.0], Bruges: [3.22, 51.21], 'Sint-Niklaas': [4.14, 51.17], Charleroi: [4.44, 50.41], Brussels: [4.35, 50.85] };
const BE = [[2.54, 51.09], [3.37, 51.37], [3.83, 51.29], [4.24, 51.37], [4.53, 51.48], [5.10, 51.43], [5.24, 51.27], [5.85, 51.15], [5.64, 50.85], [5.70, 50.76], [6.02, 50.75], [6.27, 50.62], [6.40, 50.33], [6.13, 50.13], [5.97, 49.98], [5.81, 49.55], [5.47, 49.50], [4.87, 49.80], [4.83, 50.15], [4.53, 49.96], [4.15, 49.98], [4.23, 50.25], [3.67, 50.36], [3.29, 50.53], [3.16, 50.79], [2.84, 50.70], [2.60, 50.85]];
const prj = ([lon, lat]) => [((lon - 2.45) * 0.636 * 150).toFixed(1), ((51.55 - lat) * 150).toFixed(1)];
function beMap() {
  const counts = {}; CUSTOMERS.forEach((c) => { counts[c.city] = (counts[c.city] || 0) + 1; }); counts.Brussels = 4; counts.Antwerp += 3; counts.Ghent += 2;
  const land = BE.map((p, i) => (i ? 'L' : 'M') + prj(p).join(',')).join('') + 'Z';
  const lang = [[2.9, 50.72], [3.6, 50.72], [4.2, 50.73], [4.7, 50.76], [5.2, 50.73], [5.7, 50.77], [6.0, 50.75]].map((p, i) => (i ? 'L' : 'M') + prj(p).join(',')).join('');
  const pins = Object.entries(counts).map(([city, n]) => { const [x, y] = prj(CITY_XY[city]); const r = 3 + Math.log2(n + 1) * 2.6; return `<g data-a="cityFilter" data-v="${city}"><circle class="pin" cx="${x}" cy="${y}" r="${r.toFixed(1)}"><title>${city} · ${n} customers</title></circle><text class="city" x="${x}" y="${(+y + r + 10).toFixed(1)}" text-anchor="middle">${city}</text></g>`; }).join('');
  return `<div class="map"><svg viewBox="0 0 390 320" role="img" aria-label="Customers in Belgium"><path class="land" d="${land}"/><path class="lang" d="${lang}"/>${pins}</svg></div>`;
}
const GREETS = ['Good to see you, {n}.', 'Welcome back, {n}.', '{n} has entered the chat. Everyone relax.', 'Hi {n}. Please ignore the previous greeting.'];
views.home = () => {
  const stale = OPPS.filter((o) => o.status === 'Open' && o.idle >= 30);
  const today = TASKS.map((t, i) => [t, i]).filter(([t]) => t.grp !== 'Completed' && (t.over || t.due === 'Today' || t.due === '15 Oct 2026'));
  const openToday = today.filter(([, i]) => !isDone(i)).length;
  const overdue = TASKS.filter((t, i) => t.over && !isDone(i)).length;
  const days = [['Mon', 12, 3], ['Tue', 13, 5], ['Wed', 14, 6, 1], ['Thu', 15, 4], ['Fri', 16, 2]];
  const kpi = (label, value, delta, up, sub, sp) => `<div class="mcard"><span class="label">${label}</span><span class="v">${value}</span><div class="f-row"><span><span class="delta ${up ? 'up' : 'down'}">${delta}</span> <span class="sub">${sub}</span></span>${sp}</div></div>`;
  const open = OPPS.filter((o) => o.status === 'Open');
  const stageRows = STAGES.filter((s) => s !== 'Purchased' && s !== 'Billing Rejection').map((s) => [s, open.filter((o) => o.st === s).reduce((a, o) => a + o.val, 0)]);
  return {
    crumbs: ['Home'],
    bar: `<h1>Home</h1><span class="meta">Wednesday 14 October · Week 42</span><span class="grow"></span>
      <button class="btn" type="button" data-a="modal" data-v="followupForm">${ic('clock', 14)}New follow-up</button>
      <button class="btn primary" type="button" data-a="modal" data-v="activityForm">${ic('plus', 14)}Log activity</button>`,
    body: `<div class="view-body" data-sk="home"><div class="pad">
      <section class="panel strip" aria-label="Key figures">
        ${kpi('Open pipeline', '€1.24M', '+8.2%', true, 'vs last month', spark([0.98, 1.02, 1.05, 1.01, 1.09, 1.14, 1.12, 1.24]))}
        ${kpi('Portfolio ARR', '€3.86M', '+3.1%', true, 'vs last quarter', spark(ARR))}
        ${kpi('Win rate · 90 days', '38%', '−2 pts', false, 'vs prior 90 days', spark([41, 43, 40, 42, 39, 40, 38]))}
        <div class="mcard"><span class="label">Follow-ups due today</span><span class="v">${openToday}</span><div class="f-row">${overdue ? `<span class="chip neg">${icI('alert', 11)} ${overdue} overdue</span>` : '<span class="chip pos">Nothing overdue</span>'}<button class="link" type="button" data-a="goTasks">Open tasks</button></div></div>
      </section>
      <div class="dash">
        <div class="col-stack">
          <section class="panel"><div class="panel-h"><h2>Due today</h2><span class="sub num">${openToday} open</span></div>
            <div class="rows">${today.map(([t, i]) => { const dn = isDone(i); return `<div class="r-item ${dn ? 'done' : ''}" data-a="taskOpen" data-v="${i}" data-ctx="task" data-ci="${i}"><button class="check" type="button" role="checkbox" aria-checked="${dn}" data-a="${dn ? 'toggleDone' : 'confirmDone'}" data-v="${i}" title="Mark as complete">${ic('check', 11)}</button><div class="grow"><div class="t">${esc(t.t)}</div><div class="m">${esc(t.c)}</div></div><span class="due ${t.over && !dn ? 'over' : ''}">${t.over ? (t.due === 'Yesterday' ? '1 day overdue' : '3 days overdue') : t.due}</span></div>`; }).join('')}</div></section>
          <section class="panel"><div class="panel-h"><h2>Recent activity</h2><button class="link" type="button" data-a="go" data-v="activity">Open timeline</button></div>
            <div>${ACTS.slice(0, 4).map((a, i) => `<div class="tl-item" data-a="actPreview" data-v="${i}" data-ctx="act" data-ci="${i}">${typeIcon(a.type)}<div style="min-width:0"><div class="t">${esc(a.t)}</div><p>${esc(a.c)}</p></div><span class="when">${a.day === 'Today' ? a.time.split(' ')[0] : a.day}</span></div>`).join('')}</div></section>
        </div>
        <div class="col-stack">
          <section class="panel"><div class="panel-h"><h2>This week</h2><span class="sub">Follow-ups per day</span></div>
            <div class="panel-b"><div class="week">${days.map(([dn, dd, n, td]) => `<button class="day ${td ? 'today' : ''}" type="button" data-a="goTasks"><span class="dn">${dn}</span><span class="dd">${dd}</span><span class="dots">${'<i></i>'.repeat(n)}</span></button>`).join('')}</div></div></section>
          <section class="panel"><div class="panel-h"><h2>Deals going quiet</h2><span class="chip warn">30+ days idle</span></div>
            <div class="rows">${stale.map((o) => `<div class="r-item" data-a="oppEdit" data-v="${OPPS.indexOf(o)}" data-ctx="opp" data-ci="${OPPS.indexOf(o)}"><div class="grow"><div class="t">${esc(o.s)}</div><div class="m">${esc(o.c)} · ${o.st}</div></div><div style="text-align:right"><div class="money">${eurK(o.val)}</div><div class="stale">${o.idle} days</div></div></div>`).join('')}</div></section>
          <section class="panel"><div class="panel-h"><h2>Open pipeline by stage</h2><button class="link" type="button" data-a="go" data-v="pipeline">Open pipeline</button></div>
            <div class="panel-b">${hbars(stageRows, eurK)}</div></section>
        </div>
      </div>
    </div></div>`,
    status: `${openToday} open tasks today · ${stale.length} quiet deals`,
  };
};
const cobweb = (s) => `<svg class="cobweb" width="${s}" height="${s}" viewBox="0 0 36 36" style="opacity:${s > 30 ? 0.45 : 0.25}" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="0.7"><path d="M0 0 36 36M0 0 18 36M0 0 36 18M0 0 8 36M0 0 36 8"/><path d="M0 9Q5 7 9 0M0 18Q10 14 18 0M0 27Q15 21 27 0M0 36Q20 28 36 0"/></g></svg>`;

// ---------- Customers ----------
const SORTS = ['Last Activity', 'Health', 'Name', 'City', 'Industry'];
function filteredCustomers() {
  let l = CUSTOMERS.filter((c) => (!state.custQ || (c.name + c.city + c.acct + c.bcn + c.ind).toLowerCase().includes(state.custQ.toLowerCase())) && (!state.favOnly || state.favs.has(c.name)) && (!state.noAct || c.last >= 90) && (state.healthF === 'all' || healthTier(c.h)[0] === state.healthF) && (state.custCloud === 'all' || (state.custCloud === 'cloud') === c.cloud));
  const k = { 'Last Activity': (c) => -c.last, Health: (c) => c.h, Name: (c) => c.name, City: (c) => c.city, Industry: (c) => c.ind }[state.custSort];
  l = l.slice().sort((a, b) => (k(a) > k(b) ? 1 : -1) * (state.custDir === 'desc' ? -1 : 1));
  return l;
}
const relLast = (d) => d === 0 ? 'Today' : d === 1 ? 'Yesterday' : d >= 120 ? 'No activity' : `${d} days ago`;
function custListHtml(list) {
  return list.map((c) => { const [hk] = healthTier(c.h); return `<div class="r-item c-row" data-a="cust" data-v="${esc(c.name)}" data-ctx="cust" data-cn="${esc(c.name)}" role="option" aria-selected="${c.name === state.customer}">
    <span class="c-init">${initials(c.name)}</span>
    <div class="grow"><div class="t">${esc(c.name)}</div><div class="m"><span class="hdot ${hk}" title="Health ${c.h} · ${healthTier(c.h)[1]}"></span>${c.h} · ${c.city} · ${relLast(c.last)}</div></div>
    <button class="bm ${state.favs.has(c.name) ? 'on' : ''}" type="button" data-a="fav" data-v="${esc(c.name)}" title="${state.favs.has(c.name) ? 'Remove from favorites' : 'Add to favorites'}">${ic('bookmark', 14).replace('fill="none"', state.favs.has(c.name) ? 'fill="currentColor"' : 'fill="none"')}</button>
    <span class="money" style="font-size:12px">${eurK(c.arr)}</span></div>`; }).join('') || emptyS('building', 'No customers found', 'Try adjusting your search or filters');
}
const activeCustFilters = () => [state.favOnly && ['Favorites', 'favOnly'], state.noAct && ['No recent activity', 'noAct'], state.healthF !== 'all' && [{ healthy: 'Healthy (70+)', risk: 'At risk (40–69)', critical: 'Critical (<40)' }[state.healthF], 'healthF']].filter(Boolean);
views.customers = () => {
  const c = custBy(state.customer); const list = filteredCustomers();
  const opps = OPPS.filter((o) => o.c === c.name), cons = contactsFor(c);
  const acts = ACTS.filter((a) => a.c === c.name).concat(ACTS.filter((a) => a.c !== c.name && a.type !== 'note').slice(0, 4).map((a) => ({ ...a, c: c.name })));
  const ftasks = TASKS.map((t, i) => [t, i]).filter(([t]) => t.c === c.name).concat([[TASKS[4], 4], [TASKS[7], 7]]);
  const nextF = ftasks.find(([, i]) => !isDone(i));
  const openOpps = opps.filter((o) => o.status === 'Open'), openVal = openOpps.reduce((a, o) => a + o.val, 0);
  const af = activeCustFilters();
  const [hk, hl] = healthTier(c.h);
  const tabs = [['overview', 'Overview'], ['activities', 'Activities', acts.length], ['contacts', 'Contacts', cons.length], ['followups', 'Follow-Ups', ftasks.filter(([, i]) => !isDone(i)).length], ['opportunities', 'Opportunities', opps.length], ['revenue', 'Revenue'], ['details', 'Details']];
  return {
    crumbs: ['Customers', c.name],
    bar: `<h1>Customers</h1><span class="meta num">${list.length === CUSTOMERS.length ? `${CUSTOMERS.length} customers` : `${list.length} of ${CUSTOMERS.length}`}</span><span class="vsep"></span>
      <div class="seg" role="group" aria-label="Cloud filter">${[['all', 'All'], ['cloud', 'Cloud'], ['onprem', 'Non-cloud']].map(([k, l]) => `<button type="button" data-a="custCloud" data-v="${k}" aria-pressed="${state.custCloud === k}">${l}</button>`).join('')}</div>
      <button class="btn" type="button" data-a="favOnly" aria-pressed="${state.favOnly}">${ic('bookmark', 14)}Favorites</button>
      <button class="btn" type="button" data-a="custFilters" aria-pressed="${af.filter(([, k]) => k !== 'favOnly').length > 0}">${ic('filter', 14)}Filters${af.filter(([, k]) => k !== 'favOnly').length ? ` <span class="badge-n">${af.filter(([, k]) => k !== 'favOnly').length}</span>` : ''}${ic('chevd', 12)}</button>
      <span class="grow"></span>`,
    body: `<div class="split two">
      <div class="pane list">
        <div class="list-tools">
          <div class="row-flex" style="flex-wrap:nowrap;gap:4px"><div class="iw" style="flex:1">${ic('search', 14)}<input class="in" id="custSearch" placeholder="Search customers…" value="${esc(state.custQ)}" aria-label="Search customers"></div><button class="tb-btn" type="button" data-a="sortMenu" title="Sort: ${state.custSort} (${state.custDir === 'desc' ? 'descending' : 'ascending'})" aria-label="Sort">${ic('arrowud', 15)}</button></div>
          ${af.length ? `<div class="chips">${af.map(([l, k]) => `<button class="chip" type="button" data-a="rmFilter" data-v="${k}">${l} ${icI('x', 10)}</button>`).join('')}<button class="link" type="button" data-a="clearCust" style="font-size:11px">Clear all</button></div>` : ''}
        </div>
        <div class="scroller" data-sk="custlist"><div class="rows" id="custList" role="listbox" aria-label="Customers">${state.loading === 'customers' ? skelRows(10) : custListHtml(list)}</div></div>
        ${pager(1, 7)}
      </div>
      <div class="splitter" data-split="list" role="separator" aria-orientation="vertical" aria-label="Resize list"></div>
      <div class="record">
        <div class="rec-head">
          <div class="logo">${initials(c.name)}</div>
          <div class="rec-title"><h2>${esc(c.name)} <span class="chip ${c.active ? 'pos' : ''}">${c.active ? 'Active' : 'Inactive'}</span></h2>
            <div class="rec-links"><button class="rl" type="button" data-a="copy" data-v="Email|info@${c.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.be" title="Copy email">${icI('mail', 12)} info@${c.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.be</button><button class="rl" type="button" data-a="copy" data-v="Phone|+32 15 28 41 00" title="Copy phone">${icI('call', 12)} +32 15 28 41 00</button><button class="rl" type="button" data-a="toast" data-v="Opens the website">${icI('globe', 12)} ${c.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.be</button></div></div>
          <button class="btn" type="button" data-a="toast" data-v="Opens ${esc(c.name)} in Dynamics 365" title="Open in Dynamics 365">${ic('ext', 13)}Open in Dynamics</button>
          <button class="btn" type="button" data-a="modal" data-v="followupForm">${ic('clock', 13)}Follow-up</button>
          <button class="btn primary" type="button" data-a="modal" data-v="activityForm">${ic('plus', 13)}Log activity</button>
        </div>
        <div class="stats">
          <div title="Recency ${c.hr} × 0.4 · Pipeline ${c.hp} × 0.3 · Frequency ${c.hf} × 0.3"><span class="label">Health</span><span class="v" style="color:var(--${hk === 'healthy' ? 'pos' : hk === 'risk' ? 'warn' : 'neg'})">${c.h} · ${hl}</span></div>
          <div><span class="label">ARR</span><span class="v">${eur.format(c.arr)}</span></div>
          <div><span class="label">Activities</span><span class="v">${acts.length}</span></div>
          <div><span class="label">Open follow-ups</span><span class="v">${ftasks.filter(([, i]) => !isDone(i)).length}</span></div>
          <div><span class="label">Contacts</span><span class="v">${cons.length}</span></div>
        </div>
        <div class="tabs" role="tablist">${tabs.map(([k, l, n]) => `<button type="button" role="tab" aria-selected="${state.recTab === k}" data-a="recTab" data-v="${k}">${l}${n ? `<span class="n">${n}</span>` : ''}</button>`).join('')}</div>
        <div class="rec-body" data-sk="rec"><div class="pad">${recTab(c, { opps, cons, acts, ftasks })}</div></div>
      </div>
    </div>`,
    status: `${list.length} customers · ${c.name} · last activity ${relLast(c.last).toLowerCase()} · ↑↓ to move`,
  };
};
function timelineHtml(items) {
  return items.length ? items.map((e) => {
    if (e.k === 'a') { const a = e.a; return `<div class="tl-item" data-a="actPreview" data-v="${ACTS.indexOf(a) >= 0 ? ACTS.indexOf(a) : 0}" data-ctx="act" data-ci="0">${typeIcon(a.type)}<div style="min-width:0">${e.showCust ? `<button class="tl-cust" type="button" data-a="cust" data-v="${esc(a.c)}">${icI('building', 11)} ${esc(a.c)}</button>` : ''}<div class="t">${esc(a.t)}</div><p>${esc(a.note)}</p><span class="tiny">${icI('msg', 11)} ${a.by}</span></div><span class="when">${a.date}</span></div>`; }
    if (e.k === 'f') { const [t, i] = e.f; const dn = isDone(i); return `<div class="tl-item" data-a="taskOpen" data-v="${i}">${`<span class="type-ic t-fu ${dn ? 'done' : ''}">${ic(dn ? 'checksq' : 'calendar', 13)}</span>`}<div style="min-width:0">${e.showCust ? `<button class="tl-cust" type="button" data-a="cust" data-v="${esc(t.c)}">${icI('building', 11)} ${esc(t.c)}</button>` : ''}<div class="t" style="${dn ? 'text-decoration:line-through' : ''}">${esc(t.t)} <span class="chip ${dn ? 'pos' : 'warn'}">${dn ? 'Done' : 'Open'}</span></div>${t.d ? `<p>${esc(t.d)}</p>` : ''}<span class="tiny">Due ${t.due} · Dylan Hias</span></div><span class="when">${t.due}</span></div>`; }
    const o = e.o; return `<div class="tl-item" data-a="oppEdit" data-v="${OPPS.indexOf(o)}">${typeIcon('opp')}<div style="min-width:0">${e.showCust ? `<button class="tl-cust" type="button" data-a="cust" data-v="${esc(o.c)}">${icI('building', 11)} ${esc(o.c)}</button>` : ''}<div class="t">${esc(o.s)} ${oppSt(o.status)}</div><p>${o.st} · ${o.v} · ${eur.format(o.val)}</p></div><span class="when">${fmtDate(o.exp)}</span></div>`;
  }).join('') : emptyS('clock', 'No events in the timeline yet.', 'Log activities and add follow-ups to get started.');
}
const oppRowHtml = (o, selected) => { const i = OPPS.indexOf(o); return `<div class="r-item" data-a="${selected === undefined ? 'oppEdit' : 'selOpp'}" data-v="${i}" data-ctx="opp" data-ci="${i}" ${selected !== undefined ? `aria-selected="${selected}"` : ''} style="align-items:flex-start"><span class="c-init" style="${pastel(o.c)};margin-top:2px">${ic('target', 13)}</span><div class="grow"><div class="t">${esc(o.c)}</div><div class="m">${esc(o.s.replace(/^BE - /, ''))}</div><div class="row-flex" style="gap:6px;margin-top:3px"><span class="chip">${o.st}</span>${relExp(o)}</div></div><div style="display:grid;justify-items:end;gap:3px"><span class="money" style="font-size:12px">${eurK(o.val)}</span>${o.status !== 'Open' ? oppSt(o.status) : o.idle >= 30 ? `<span class="chip warn">${o.idle}d</span>` : ''}</div></div>`; };
function oppCards(list) {
  return list.length ? list.map((o) => { const i = OPPS.indexOf(o), r = relDays(o.exp); const rel = o.status !== 'Open' ? '' : r < 0 ? `<span style="color:var(--neg)">· ${-r}d overdue</span>` : r === 0 ? '<span style="color:var(--warn)">· today</span>' : `<span style="color:${r <= 7 ? 'var(--warn)' : 'var(--muted)'}">· in ${r}d</span>`;
    return `<div class="oc" data-a="oppEdit" data-v="${i}" data-ctx="opp" data-ci="${i}"><span class="c-init" style="${pastel(o.c)};width:32px;height:32px">${ic('target', 15)}</span>
      <div style="min-width:0;display:grid;gap:3px"><div class="t" style="font-weight:600">${esc(o.s)}</div>
        <div class="meta">${icI('building', 11)}<span class="co">${esc(o.c)}</span>·<span>${o.st} ${PROB[o.st]}%</span>·${icI('calendar', 11)}<span>${fmtDate(o.exp)}</span>${rel}${o.status === 'Open' && o.idle >= 30 ? `<span class="chip warn" title="No updates in 30+ days">${icI('alert', 10)} Stale</span>` : ''}</div>
        <div class="row-flex" style="gap:12px"><span class="own"><i class="p">1</i>${icI('user', 11)} Dylan Hias</span><span class="own"><i>2</i>${icI('user', 11)} ${o.o2 ? o.o2 : '<em class="sub">No secondary owner</em>'}</span></div></div>
      <div style="display:grid;justify-items:end;gap:4px">${oppSt(o.status)}<span class="money">${eur.format(o.val)}</span></div>${ic('chev', 14)}</div>`; }).join('') : emptyS('target', 'No opportunities found', 'Try adjusting your search or filters');
}
function recTab(c, { opps, cons, acts, ftasks }) {
  const t = state.recTab;
  if (t === 'overview') {
    const prim = cons.find((p) => p.primary);
    const items = [...acts.slice(0, 4).map((a) => ({ k: 'a', a })), ...ftasks.slice(0, 1).map((f) => ({ k: 'f', f }))];
    const oo = opps.filter((o) => o.status === 'Open');
    return `<div class="grid2" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)">
      <section class="panel"><div class="panel-h"><h2>Recent activity</h2><button class="link" type="button" data-a="recTab" data-v="activities">All activities</button></div><div class="selectable">${timelineHtml(items)}</div></section>
      <div style="display:grid;gap:12px">
        <section class="panel"><div class="panel-h"><h2>Primary contact</h2><button class="link" type="button" data-a="recTab" data-v="contacts">All contacts</button></div><div class="panel-b">${prim ? `<div class="person" style="padding:0"><span class="avatar">${prim.f[0]}${prim.l[0]}</span><div style="flex:1;min-width:0"><div style="font-weight:550">${prim.f} ${prim.l}</div><div class="sub">${prim.t}</div></div></div><div class="selectable" style="display:grid;gap:3px;font-size:12px;margin-top:8px"><span style="color:var(--accent-text)">${icI('mail', 11)} ${prim.email}</span><span>${icI('call', 11)} ${prim.phone}</span></div>` : '<span class="sub">No primary contact yet.</span>'}</div></section>
        <section class="panel"><div class="panel-h"><h2>Open opportunities</h2><span class="sub">${oo.length}</span></div>${oo.length ? `<div class="rows">${oo.map((o) => `<div class="r-item" data-a="oppEdit" data-v="${OPPS.indexOf(o)}" data-ctx="opp" data-ci="${OPPS.indexOf(o)}"><div class="grow"><div class="t">${esc(o.s)}</div><div class="m">${o.st} · ${PROB[o.st]}%</div></div><span class="money">${eurK(o.val)}</span></div>`).join('')}</div>` : '<div class="panel-b sub">None open.</div>'}</section>
      </div></div>`;
  }
  if (t === 'details') {
    const dom = c.name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const props = (rows) => `<div class="props">${rows.filter((r) => r[1]).map(([k, v]) => `<button class="prop" type="button" data-a="copy" data-v="${esc(k)}|${esc(v)}" title="Copy ${esc(k)}"><span class="pk">${k}</span><span class="pv">${esc(v)}</span><span class="pc">${ic('copy', 13)}</span></button>`).join('')}</div>`;
    const sect = (title, rows, edit) => `<section class="panel"><div class="panel-h"><h2>${title}</h2>${edit ? `<button class="btn sm ghost" type="button" data-a="modal" data-v="${edit}">${ic('edit', 12)}Edit</button>` : ''}</div>${props(rows)}</section>`;
    return `<div class="details">
      ${sect('Company', [['Name', c.name], ['Status', c.active ? 'Active' : 'Inactive'], ['Industry', c.ind], ['Segment', c.seg], ['Cloud customer', c.cloud ? 'Yes' : 'No']])}
      ${sect('Identifiers', [['Account number', c.acct], ['BCN', c.bcn || '—'], ['Reseller ID', c.bcn ? 'RS-' + c.bcn.slice(0, 5) : '—'], ['MPN ID', '6112874'], ['APN ID', '—']], 'vendorEdit')}
      ${sect('Contact', [['Email', `info@${dom}.be`], ['Phone', '+32 15 28 41 00'], ['Website', `${dom}.be`], ['Address', `Kontichsesteenweg 38, 2800 ${c.city}`], ['Country', c.country]])}
      ${sect('Account team', [['Account owner', OWNERS[c.owner]], ['Customer Success Manager', 'Thomas Peeters'], ['AWS owner', 'Koen De Wilde'], ['Azure owner', '—'], ['Inside sales owner', 'Sarah Dubois'], ['Account manager', 'Lien Verhoeven']], 'cloudEdit')}
    </div>`;
  }
  if (t === 'activities') {
    const notes = acts.filter((a) => a.type === 'note'); const cols = [['open', 'Open'], ['completed', 'Completed'], ['cancelled', 'Cancelled']];
    return `${notes.length ? `<section class="panel"><div class="panel-h"><h2>Notes</h2><span class="sub">${notes.length}</span></div><div class="tbl"><table><thead><tr><th>Subject</th><th>Description</th><th>Date</th><th>Contact</th><th></th></tr></thead><tbody>${notes.map((n) => `<tr data-a="actPreview" data-v="${ACTS.indexOf(n)}"><td>${icI('note')} <b style="font-weight:550">${esc(n.t)}</b> ${n === notes[0] ? `<span class="chip warn">${icI('clock', 10)} Pending</span>` : ''}</td><td class="sub" style="max-width:280px;overflow:hidden;text-overflow:ellipsis">${esc(n.note)}</td><td class="num">${n.date}</td><td>—</td><td class="r"><button class="tb-btn" type="button" data-a="modal" data-v="activityEdit" title="Edit">${ic('edit', 13)}</button><button class="tb-btn" type="button" data-a="confirm" data-v="Delete &quot;${esc(n.t)}&quot;?" title="Delete">${ic('trash', 13)}</button></td></tr>`).join('')}</tbody></table></div>${pager(1, 1, 5)}</section>` : ''}
      <div class="row-flex"><h3 style="font-size:13px;font-weight:600">Activities</h3><span class="sub">Jul 2026 – Oct 2026</span><span class="grow"></span><span class="iw" style="width:170px">${sel(['Last 3 months', 'Last 6 months', 'Last year', 'All time'], state.actRange, 'aria-label="Date range"', 'sl sm')}</span><button class="btn sm primary" type="button" data-a="modal" data-v="activityForm">${ic('plus', 13)}Add Activity</button></div>
      <div class="kb" id="kb">${cols.map(([k, l]) => { const items = acts.filter((a) => a.type !== 'note' && a.st === k); const coll = state.collapsed[k] ?? items.length === 0;
        return coll ? `<div class="kb-col collapsed" data-drop="${k}" data-a="kbExpand" data-v="${k}" title="Expand ${l}"><span class="badge-n">${items.length}</span><span class="vlabel">${l}</span></div>` :
        `<div class="kb-col" data-drop="${k}"><div class="kb-head">${stPill(k).replace(/(Open|Completed|Cancelled)</, `$1 (${items.length})<`)}<span class="grow"></span><button class="tb-btn" type="button" data-a="kbCollapse" data-v="${k}" aria-label="Collapse ${l} column">${ic('chevl', 13)}</button></div><div class="kb-cards">${items.map((a) => `<article class="kcard" ${k === 'open' ? 'draggable="true"' : ''} data-drag="${ACTS.indexOf(a)}" data-a="actPreview" data-v="${ACTS.indexOf(a)}" data-ctx="act" data-ci="${ACTS.indexOf(a)}"><div class="hover-act"><button class="tb-btn" type="button" data-a="modal" data-v="activityEdit" title="Edit">${ic('edit', 12)}</button><button class="tb-btn" type="button" data-a="confirm" data-v="Delete &quot;${esc(a.t)}&quot;?">${ic('trash', 12)}</button></div><div class="row-flex" style="gap:6px"><span class="type-ic t-${a.type}" style="width:22px;height:22px">${ic(a.type, 12)}</span><span class="chip">${typeName(a)}</span>${a.who ? `<span style="color:var(--act-${a.type});font-size:11.5px">· ${a.who}</span>` : ''}</div><b style="font-weight:550">${esc(a.t)}</b><p>${esc(a.note)}</p><div class="f-row tiny"><span>${a.by}</span><span>${a.date}</span></div></article>`).join('')}</div></div>`; }).join('')}</div>`;
  }
  if (t === 'contacts') return `<div class="row-flex"><div class="iw" style="flex:1;max-width:320px">${ic('search', 14)}<input class="in" placeholder="Search contacts…" aria-label="Search contacts"></div><span class="grow"></span><button class="btn primary" type="button" data-a="modal" data-v="contactForm">${ic('plus', 13)}Add Contact</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">${cons.map((p) => `<div class="panel" style="padding:12px;display:grid;gap:8px;position:relative" data-ctx="contact"><div class="row-flex" style="flex-wrap:nowrap"><span class="avatar" style="width:36px;height:36px;position:relative;background:var(--sunken);color:var(--fg-2);border-color:var(--border)">${p.f[0]}${p.l[0]}${p.primary ? `<span style="position:absolute;right:-3px;bottom:-3px;color:var(--warn)">${ic('star', 11).replace('fill="none"', 'fill="currentColor"')}</span>` : ''}</span><div style="min-width:0;flex:1"><div style="font-weight:600">${p.f} ${p.l} ${p.primary ? '<span style="color:var(--warn);font-size:11px;font-weight:550">Primary</span>' : ''}</div><div class="tiny">${p.t}</div></div>${!p.primary ? `<button class="tb-btn" type="button" data-a="toast" data-v="Primary contact saved locally. Will sync to D365 once the contact itself syncs." title="Set as primary contact">${ic('star', 13)}</button>` : ''}<button class="tb-btn" type="button" data-a="modal" data-v="contactEdit" title="Edit">${ic('edit', 13)}</button><button class="tb-btn" type="button" data-a="confirm" data-v="Delete ${p.f} ${p.l}?" title="Delete">${ic('trash', 13)}</button></div><div class="selectable" style="display:grid;gap:3px;font-size:12px"><span style="color:var(--accent-text)">${icI('mail', 11)} ${p.email}</span><span>${icI('call', 11)} ${p.phone}</span>${p.mobile ? `<span>${icI('smartphone', 11)} ${p.mobile}</span>` : ''}</div>${p.notes ? `<p class="sub" style="font-style:italic;border-top:1px solid var(--border);padding-top:6px">${p.notes}</p>` : ''}</div>`).join('')}</div>`;
  if (t === 'followups') { const open = ftasks.filter(([, i]) => !isDone(i)), dn = ftasks.filter(([, i]) => isDone(i));
    return `<div class="row-flex"><span class="grow"></span><button class="btn primary" type="button" data-a="modal" data-v="followupForm">${ic('plus', 13)}Add Follow-Up</button></div><div class="sec-h">Scheduled (${open.length})</div><section class="panel"><div class="rows">${open.map(([t, i]) => taskRow(t, i)).join('')}</div></section><div class="sec-h">Completed (${dn.length})</div><section class="panel"><div class="rows">${dn.map(([t, i]) => taskRow(t, i)).join('') || '<div class="empty">No completed follow-ups yet.</div>'}</div></section>`; }
  if (t === 'opportunities') return `<div class="row-flex"><span class="sub">${opps.filter((o) => o.status === 'Open').length} open · ${eurK(opps.filter((o) => o.status === 'Open').reduce((a, o) => a + o.val, 0))}</span><span class="grow"></span><button class="btn primary" type="button" data-a="oppNew" data-v="locked">${ic('plus', 13)}New opportunity</button></div><section class="panel">${opps.length ? `<div class="rows">${opps.map((o) => oppRowHtml(o)).join('')}</div>` : emptyS('target', 'No opportunities yet')}</section>`;
  const mv = { ns: [4, 0, 6, 2, 0, 8, 3, 0, 5, 2, 7, 4], up: [2, 3, 1, 4, 2, 1, 3, 5, 2, 3, 1, 2], dn: [-1, 0, -2, -1, 0, -3, 0, -1, -2, 0, -1, -1], cx: [0, -2, 0, 0, -1, 0, 0, -4, 0, -1, 0, 0] };
  const net = mv.ns.map((v, i) => v + mv.up[i] + mv.dn[i] + mv.cx[i]);
  return `<div class="row-flex"><span class="iw" style="width:160px">${sel(['Last 3 months', 'Last 6 months', 'Last 12 months', 'Last 24 months'], 'Last 12 months', 'aria-label="Period"', 'sl sm')}</span><span class="grow"></span>${refreshed()}</div>
    ${strip([['Current ARR', `${eur.format(c.arr)}`, 'as of October 2026'], ['Change', `${c.chg >= 0 ? '+' : '−'}${Math.abs(c.chg)}%`, 'year on year', [c.chg, c.chg >= 0 ? '▲' : '▼']], ['Active end customers', '37', 'this month'], ['Source', c.src === 'live' ? 'Live' : 'Synced', c.src === 'live' ? 'Power BI' : 'Dynamics 365']])}
    <section class="panel"><div class="panel-h"><h2>ARR movement</h2><span class="sub">last 12 months</span></div><div class="panel-b">${c.bcn ? barChart({ labels: MONTHS.map((m) => m.slice(0, 3)), series: [{ name: 'NewSale', vals: mv.ns.map((v) => v * 1000), c: 'var(--pos)' }, { name: 'Upgrade', vals: mv.up.map((v) => v * 1000), c: 'var(--accent)' }, { name: 'Downgrade', vals: mv.dn.map((v) => v * 1000), c: 'var(--warn)' }, { name: 'Cancellation', vals: mv.cx.map((v) => v * 1000), c: 'var(--neg)' }], stacked: true, net: net.map((v) => v * 1000), fmt: compact, h: 240 }) + legend([['New sale', 'var(--pos)'], ['Upgrade', 'var(--accent)'], ['Downgrade', 'var(--warn)'], ['Cancellation', 'var(--neg)'], ['Net', 'var(--fg)']]) : emptyS('alertc', 'No movement data', 'This customer has no BCN in Dynamics 365.')}</div></section>`;
}
const refreshed = () => `<span class="chip" title="14 Oct 2026, 08:00:12">${icI('clock', 11)} Updated 2h ago</span><button class="btn sm" type="button" data-a="refresh">${ic('sync', 13)}Refresh</button>`;
function taskRow(t, i, sel) {
  const dn = isDone(i);
  return `<div class="r-item ${dn ? 'done' : ''}" ${sel ? `data-a="selTask" data-v="${i}" aria-selected="${state.selTask === i}"` : `data-a="taskOpen" data-v="${i}"`} data-ctx="task" data-ci="${i}">
    <button class="check" type="button" role="checkbox" aria-checked="${dn}" data-a="${dn ? 'toggleDone' : 'confirmDone'}" data-v="${i}" title="Mark as complete">${ic('check', 11)}</button>
    <div class="grow"><div class="t">${esc(t.t)}</div><div class="m">${sel ? esc(t.c) : esc(t.d || t.c)}</div></div>
    ${!dn && i === 2 ? '<span class="chip warn">Pending sync</span>' : ''}
    <span class="due ${t.over && !dn ? 'over' : ''}">${t.over && !dn ? icI('alertc', 11) : icI('calendar', 11)} ${t.due}</span>
    ${!dn ? `<span class="hover-act"><button class="tb-btn" type="button" data-a="modal" data-v="followupEdit" title="Edit">${ic('edit', 12)}</button><button class="tb-btn" type="button" data-a="confirm" data-v="Delete &quot;${esc(t.t)}&quot;?" title="Delete">${ic('trash', 12)}</button></span>` : ''}</div>`;
}

// ---------- Pipeline (Opportunities) ----------
function filteredOpps(ignoreStage) {
  return OPPS.filter((o) => (!state.oppQ || (o.s + o.c + o.v + o.num).toLowerCase().includes(state.oppQ.toLowerCase())) && (state.oppStatus === 'all' || o.status === state.oppStatus) && (ignoreStage || state.oppStage === 'all' || o.st === state.oppStage) && (state.oppExp === 'all' || (state.oppExp === 'expired') === (relDays(o.exp) < 0)) && (!state.mine || !o.o2));
}
const relExp = (o) => { const r = relDays(o.exp); if (o.status !== 'Open') return `<span class="tiny">${o.status === 'Won' ? 'Won' : 'Lost'} · ${fmtDate(o.exp)}</span>`; return r < 0 ? `<span class="tiny" style="color:var(--neg)">${-r}d overdue</span>` : r === 0 ? '<span class="tiny" style="color:var(--warn)">Expires today</span>' : `<span class="tiny" style="color:${r <= 7 ? 'var(--warn)' : 'var(--muted)'}">Expires in ${r}d</span>`; };
function oppDetail(o) {
  const i = OPPS.indexOf(o), k = STAGES.indexOf(o.st), c = custBy(o.c);
  const acts = ACTS.filter((a) => a.c === o.c).slice(0, 2);
  return `<div class="pad" style="max-width:900px;padding:18px 22px 28px">
    <div class="row-flex" style="align-items:flex-start;flex-wrap:nowrap"><div style="flex:1;min-width:0;display:grid;gap:4px"><span class="tiny">${o.num} · created by Dylan Hias</span><h2 style="font-size:18px;font-weight:650;letter-spacing:-0.015em">${esc(o.s)}</h2><div class="row-flex">${oppSt(o.status)}<button class="link" type="button" data-a="cust" data-v="${esc(o.c)}">${icI('building', 11)} ${esc(o.c)}</button>${o.status === 'Open' && o.idle >= 30 ? `<span class="chip warn">${icI('alert', 10)} Stale · ${o.idle}d</span>` : ''}</div></div>
      <button class="btn" type="button" data-a="oppEdit" data-v="${i}">${ic('edit', 13)}Edit</button>${o.status === 'Open' ? `<button class="btn" type="button" style="color:var(--pos)" data-a="closeFrom" data-v="won:${i}">${ic('trophy', 13)}Won</button><button class="btn" type="button" style="color:var(--neg)" data-a="closeFrom" data-v="lost:${i}">${ic('octx', 13)}Lost</button>` : ''}</div>
    <div class="track-steps">${STAGES.filter((s) => s !== 'Billing Rejection' || o.st === s).map((s) => { const n = STAGES.indexOf(s); return `<div class="ts ${n < k && o.st !== 'Billing Rejection' ? 'past' : ''} ${s === o.st ? 'cur' : ''}" title="${s} (${PROB[s]}%)"><i></i><span>${s}</span></div>`; }).join('')}</div>
    <div class="grid4">${[['Annual revenue', eur.format(o.val)], ['Estimated MRR', eur.format(o.val / 12)], ['Probability', PROB[o.st] + '%'], ['Weighted', eur.format(o.val * PROB[o.st] / 100)]].map(([l, v]) => `<div class="panel mcard"><div class="label">${l}</div><div class="v" style="font-size:17px">${v}</div></div>`).join('')}</div>
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>Deal</h2></div><div class="panel-b"><dl class="kv selectable"><dt>Primary vendor</dt><dd>${o.v}</dd><dt>Opp type</dt><dd>Services</dd><dt>Single / Cross</dt><dd>Single</dd><dt>Type</dt><dd>New</dd><dt>Expiration</dt><dd>${fmtDate(o.exp)}</dd><dt>Country</dt><dd>Belgium · EUR</dd></dl></div></section>
      <section class="panel"><div class="panel-h"><h2>People</h2></div><div class="panel-b"><dl class="kv"><dt>Contact</dt><dd>${contactsFor(c)[0].f} ${contactsFor(c)[0].l}</dd><dt>BCN</dt><dd class="num">${c.bcn || '—'}</dd><dt>Primary owner</dt><dd>Dylan Hias</dd><dt>Secondary owner</dt><dd>${o.o2 || '—'}</dd></dl></div></section></div>
    <section class="panel"><div class="panel-h"><h2>Customer need</h2></div><div class="panel-b selectable" style="color:var(--fg-2);line-height:1.6">Consolidate billing and reduce cloud spend across business units, with one invoice and central cost reporting.</div></section>
    <section class="panel"><div class="panel-h"><h2>Latest activity with ${esc(o.c)}</h2></div>${acts.length ? timelineHtml(acts.map((a) => ({ k: 'a', a }))) : '<div class="panel-b sub">Nothing logged yet.</div>'}</section>
  </div>`;
}
views.pipeline = () => {
  const base = filteredOpps(true), list = filteredOpps(), open = base.filter((o) => o.status === 'Open');
  if (!list.includes(OPPS[state.selOpp]) && list.length) state.selOpp = OPPS.indexOf(list[0]);
  const fCount = [state.oppStatus !== 'all', state.oppExp !== 'all', state.oppStage !== 'all'].filter(Boolean).length;
  const stageSum = (s) => base.filter((o) => o.st === s && o.status !== 'Lost');
  const maxV = Math.max(...STAGES.map((s) => stageSum(s).reduce((a, o) => a + o.val, 0)), 1);
  const stagebar = `<div class="stagebar" role="tablist" aria-label="Stages"><button type="button" data-a="stageF" data-v="all" aria-selected="${state.oppStage === 'all'}"><span class="sn">All stages</span><span class="sv">${base.length} · ${eurK(base.reduce((a, o) => a + o.val, 0))}</span></button>${STAGES.map((s) => { const it = stageSum(s), v = it.reduce((a, o) => a + o.val, 0); return `<button type="button" class="${s === 'Billing Rejection' && it.length ? 'bad' : ''}" data-a="stageF" data-v="${s}" aria-selected="${state.oppStage === s}" title="${s} · ${PROB[s]}%"><span class="sn">${s}</span><span class="sv">${it.length} · ${eurK(v)}</span><i style="width:${(v / maxV) * 100}%"></i></button>`; }).join('')}</div>`;
  const board = `<div style="display:grid;grid-template-rows:auto minmax(0,1fr);min-height:0;height:100%"><div class="board-tools"><div style="width:280px"><div class="iw">${ic('search', 14)}<input class="in" id="oppSearch" placeholder="Search deals…" value="${esc(state.oppQ)}" aria-label="Search deals"></div></div></div><div class="board-host" data-sk="board"><div class="board">${STAGES.filter((s) => state.oppStage === 'all' || s === state.oppStage).map((s) => { const items = list.filter((o) => o.st === s && o.status !== 'Lost'); const sum = items.reduce((a, o) => a + o.val, 0);
    return `<section class="col"><div class="col-head"><h2>${s}</h2><span class="tiny">${PROB[s]}%</span><span class="sum">${items.length} · ${eurK(sum)}</span></div><div class="col-bar"><i style="width:${(sum / maxV) * 100}%"></i></div><div class="col-cards">${items.map((o) => `<article class="deal ${o.st === 'Billing Rejection' ? 'flag' : ''}" data-a="oppEdit" data-v="${OPPS.indexOf(o)}" data-ctx="opp" data-ci="${OPPS.indexOf(o)}"><b style="font-weight:550;line-height:1.35">${esc(o.s)}</b><span class="tiny">${esc(o.c)}</span><div class="f-row"><span class="chip">${o.v.split(' - ')[0]}</span><span class="money">${eur.format(o.val)}</span></div><div class="f-row">${relExp(o)}${o.idle >= 30 && o.status === 'Open' ? `<span class="chip warn">${o.idle}d idle</span>` : ''}</div></article>`).join('') || '<p class="tiny" style="padding:2px 4px">No deals</p>'}</div></section>`; }).join('')}</div></div></div>`;
  const listView = `<div class="split two"><div class="pane list"><div class="list-tools"><div class="iw">${ic('search', 14)}<input class="in" id="oppSearch" placeholder="Search deals…" value="${esc(state.oppQ)}" aria-label="Search deals"></div></div><div class="scroller" data-sk="opplist"><div class="rows" role="listbox">${list.map((o) => oppRowHtml(o, state.selOpp === OPPS.indexOf(o))).join('') || emptyS('target', 'No opportunities found', 'Try adjusting your search or filters')}</div></div>${pager(1, 2)}</div><div class="splitter" data-split="list"></div><div class="pane" data-sk="oppdetail" style="background:var(--sheet)">${list.length ? oppDetail(OPPS[state.selOpp]) : ''}</div></div>`;
  return {
    crumbs: ['Pipeline', state.oppStage === 'all' ? 'All stages' : state.oppStage],
    bar: `<h1>Pipeline</h1><span class="meta num">${open.length} open · ${eurK(open.reduce((a, o) => a + o.val, 0))} · weighted ${eurK(open.reduce((a, o) => a + o.val * PROB[o.st] / 100, 0))}</span><span class="vsep"></span>
      <div class="seg" role="group" aria-label="View"><button type="button" data-a="pipeView" data-v="list" aria-pressed="${state.pipeView === 'list'}">${ic('list', 13)}List</button><button type="button" data-a="pipeView" data-v="board" aria-pressed="${state.pipeView === 'board'}">${ic('board', 13)}Board</button></div>
      <button class="btn" type="button" data-a="mine" aria-pressed="${state.mine}" title="Show only opportunities you created">${ic('user', 14)}Mine</button>
      <button class="btn" type="button" data-a="oppFilters" aria-pressed="${fCount > 0}">${ic('filter', 14)}Filters${fCount ? ` <span class="badge-n">${fCount}</span>` : ''}${ic('chevd', 12)}</button>
      <span class="grow"></span><button class="btn primary" type="button" data-a="oppNew">${ic('plus', 14)}New opportunity</button>`,
    body: `<div style="display:grid;grid-template-rows:minmax(0,1fr);min-height:0;height:100%">${state.pipeView === 'list' ? listView : board}</div>`,
    status: `${list.length} shown · right-click a deal for actions`,
  };
};

// ---------- Activity (Timeline + Follow-ups) ----------
views.activity = () => {
  const feed = state.actMode === 'feed';
  let list, reader;
  if (feed) {
    const ev = [...ACTS.map((a) => ({ k: 'a', a, day: a.day })), { k: 'f', f: [TASKS[2], 2], day: 'Today' }, { k: 'o', o: OPPS[2], day: 'Yesterday' }].filter((e) => !state.feedQ || JSON.stringify(e).toLowerCase().includes(state.feedQ.toLowerCase()));
    let last = '';
    list = ev.map((e) => { const h = e.day !== last ? `<div class="group-h">${e.day}</div>` : ''; last = e.day;
      if (e.k === 'a') { const i = ACTS.indexOf(e.a); return `${h}<div class="r-item lb-${e.a.type}" data-a="selAct" data-v="${i}" data-ctx="act" data-ci="${i}" aria-selected="${state.selAct === i}" style="align-items:flex-start">${typeIcon(e.a.type)}<div class="grow"><div class="t">${esc(e.a.t)}</div><div class="m">${esc(e.a.c)}</div></div><span class="when">${e.a.time.split(' ')[0]}</span></div>`; }
      if (e.k === 'f') return `${h}<div class="r-item" data-a="taskOpen" data-v="2"><span class="type-ic t-fu">${ic('calendar', 13)}</span><div class="grow"><div class="t">${esc(e.f[0].t)}</div><div class="m">${esc(e.f[0].c)} · Due ${e.f[0].due}</div></div><span class="chip warn">Open</span></div>`;
      return `${h}<div class="r-item lb-opp" data-a="oppEdit" data-v="${OPPS.indexOf(e.o)}">${typeIcon('opp')}<div class="grow"><div class="t">${esc(e.o.s)}</div><div class="m">${e.o.st} · ${eur.format(e.o.val)}</div></div>${oppSt(e.o.status)}</div>`; }).join('') || emptyS('clock', 'No events in the timeline yet.', 'Log activities and add follow-ups to get started.');
    const a = ACTS[state.selAct];
    reader = `<div class="pad" style="max-width:860px;padding:18px 22px"><div class="row-flex">${typeIcon(a.type, 14)}<span class="chip">${typeName(a)}</span>${a.type !== 'note' ? stPill(a.st) : ''}<span class="sub">${a.date}, ${a.time}</span></div>
      <h2 style="font-size:18px;font-weight:650;letter-spacing:-0.015em">${esc(a.t)}</h2>
      <dl class="kv selectable"><dt>Customer</dt><dd><button class="link" type="button" data-a="cust" data-v="${esc(a.c)}">${esc(a.c)}</button></dd><dt>Contact</dt><dd>${a.who || '—'}</dd><dt>Created by</dt><dd>${a.by}</dd></dl>
      <div class="selectable" style="font-size:13.5px;line-height:1.65;color:var(--fg-2);max-width:68ch;background:var(--sunken);border:1px solid var(--border);border-radius:var(--r);padding:12px">${esc(a.note)}</div>
      <div class="row-flex"><button class="btn primary" type="button" data-a="modal" data-v="activityEdit">${ic('edit', 13)}Edit</button><button class="btn" type="button" data-a="modal" data-v="followupForm">${ic('clock', 13)}Create follow-up</button><button class="btn danger" type="button" data-a="confirm" data-v="Delete &quot;${esc(a.t)}&quot;?">${ic('trash', 13)}Delete</button><button class="btn ghost" type="button" data-a="cust" data-v="${esc(a.c)}">${ic('ext', 13)}Open customer</button></div></div>`;
  } else {
    const groups = [['Overdue', TASKS.map((t, i) => [t, i]).filter(([t, i]) => t.over && !isDone(i))], ['Upcoming', TASKS.map((t, i) => [t, i]).filter(([t, i]) => !t.over && !isDone(i))], ['Completed', TASKS.map((t, i) => [t, i]).filter(([, i]) => isDone(i))]];
    list = groups.map(([g, items]) => items.length || g === 'Completed' ? `<div class="group-h ${g === 'Overdue' ? 'neg' : ''}">${g} <span class="chip ${g === 'Overdue' ? 'neg' : ''}">${items.length}</span></div>${items.map(([t, i]) => taskRow(t, i, true)).join('') || '<div class="empty" style="padding:14px">No completed follow-ups yet.</div>'}` : '').join('');
    const t = TASKS[state.selTask], dn = isDone(state.selTask);
    reader = `<div class="pad" style="max-width:860px;padding:18px 22px"><div class="row-flex"><span class="type-ic t-fu ${dn ? 'done' : ''}">${ic('checksq', 14)}</span><span class="chip ${t.over && !dn ? 'neg' : ''}">${t.over && !dn ? icI('alertc', 11) + ' ' : ''}Due ${t.due}</span>${dn ? '<span class="chip pos">Completed</span>' : ''}${state.selTask === 2 && !dn ? '<span class="chip warn">Pending sync</span>' : ''}</div>
      <h2 style="font-size:18px;font-weight:650;${dn ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(t.t)}</h2>
      <dl class="kv"><dt>Customer</dt><dd><button class="link" type="button" data-a="cust" data-v="${esc(t.c)}">${esc(t.c)}</button></dd><dt>Created by</dt><dd>Dylan Hias</dd></dl>
      <div class="selectable" style="font-size:13.5px;line-height:1.65;color:var(--fg-2);background:var(--sunken);border:1px solid var(--border);border-radius:var(--r);padding:12px;min-height:80px">${esc(t.d) || '<span class="sub">No description</span>'}</div>
      ${dn ? '' : `<div class="row-flex"><button class="btn primary" type="button" data-a="confirmDone" data-v="${state.selTask}">${ic('check', 13)}Mark as complete</button><button class="btn" type="button" data-a="modal" data-v="followupEdit">${ic('edit', 13)}Edit</button><button class="btn danger" type="button" data-a="confirm" data-v="Delete &quot;${esc(t.t)}&quot;?">${ic('trash', 13)}Delete</button></div>`}</div>`;
  }
  return {
    crumbs: ['Activity', feed ? 'Timeline' : 'Follow-Ups'],
    bar: `<h1>Activity</h1><span class="vsep"></span><div class="seg" role="group" aria-label="Mode"><button type="button" data-a="actMode" data-v="feed" aria-pressed="${feed}">Timeline</button><button type="button" data-a="actMode" data-v="tasks" aria-pressed="${!feed}">Your Follow-Ups <span class="num" style="color:var(--neg)">${TASKS.filter((t, i) => t.over && !isDone(i)).length}</span></button></div><span class="meta">${feed ? 'All activities, follow-ups, and opportunities across your customers.' : 'Track your open tasks and next actions across all customers.'}</span><span class="grow"></span><button class="btn primary" type="button" data-a="quickAdd">${ic('plus', 14)}${feed ? 'Log activity' : 'New follow-up'}</button>`,
    body: `<div class="split two"><div class="pane list"><div class="list-tools"><div class="iw">${ic('filter', 14)}<input class="in" id="feedSearch" placeholder="${feed ? 'Filter by subject or customer…' : 'Filter follow-ups…'}" value="${esc(state.feedQ)}" aria-label="Filter"></div></div><div class="scroller" data-sk="actlist"><div class="rows" role="listbox">${list}</div></div>${pager(1, 3)}</div><div class="splitter" data-split="list"></div><div class="pane" data-sk="reader" style="background:var(--surface)">${reader}</div></div>`,
    status: feed ? `${ACTS.length + 2} events` : `${TASKS.filter((t, i) => !isDone(i)).length} open · ${TASKS.filter((t, i) => t.over && !isDone(i)).length} overdue`,
  };
};

// ---------- Sub-layout helper ----------
const subLayout = (items, cur, act, content, key, narrow) => `<div class="sub-layout"><nav class="subnav">${items.map((it) => it === '-' ? '<hr>' : typeof it === 'string' ? `<div class="snl">${it}</div>` : `<button class="nav-item" type="button" data-a="${act}" data-v="${it[0]}" ${cur === it[0] ? 'aria-current="page"' : ''}>${ic(it[2], 15)}<span class="lbl">${it[1]}</span></button>`).join('')}</nav><div class="sub-content" data-sk="${key}"><div class="pad ${narrow ? 'narrow' : ''}">${content}</div></div></div>`;

// ---------- Reports (one dashboard per tab) ----------
const REP_TABS = [['revenue', 'Revenue'], ['pipeline', 'Pipeline'], ['customers', 'Customers'], ['me', 'My activity']];
const strip = (cells) => `<section class="panel strip" style="grid-template-columns:repeat(${cells.length},minmax(0,1fr))">${cells.map(([l, v, s, d]) => `<div class="mcard"><span class="label">${l}</span><span class="v">${v}</span><span class="sub">${d ? `<span class="delta ${d[0] > 0 ? 'up' : 'down'}">${d[1]}</span> ` : ''}${s || ''}</span></div>`).join('')}</section>`;
views.reports = () => {
  const t = state.repTab, name = REP_TABS.find((x) => x[0] === t)[1];
  let c = '';
  if (t === 'revenue') c = `${strip([['Total ARR', '€3.86M', 'in period', [1, '+12.9%']], ['Active customers', '63', '71 in scope'], ['Average ARR', '€61.3K', 'per active customer'], ['Live coverage', '89%', '56 / 63 matched']])}
    ${strip([['Active resellers', '214', 'as of Oct 26'], ['Active seats', '18,420', 'as of Oct 26'], ['Reseller growth', '+4.2%', 'Oct 25 → Oct 26', [1, '▲']], ['Seat growth', '+9.8%', 'Oct 25 → Oct 26', [1, '▲']]])}
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>ARR trend</h2><span class="sub">${state.region} · month-end</span></div><div class="panel-b">${lineChart({ labels: MONTHS, series: [{ name: 'ARR', vals: ARR, c: 'var(--accent)' }], fmt: (v) => `€${v.toFixed(2)}M`, dots: true, minZero: false, h: 240 })}</div></section>
      <section class="panel"><div class="panel-h"><h2>Net sales by vendor</h2><span class="sub">top 8 · local currency</span></div><div class="panel-b">${lineChart({ labels: MONTHS, series: VLINES.map(([n, v], i) => ({ name: n, vals: v.map((x) => x * 1000), c: `var(--c${i + 1})`, w: 1.6 })), fmt: (v) => '€' + compact(v), h: 240 })}${legend(VLINES.map(([n], i) => [n, `var(--c${i + 1})`]), true)}</div></section></div>
    <section class="panel"><div class="panel-h"><h2>All customers</h2><span class="sub">${CUSTOMERS.length} · sorted by ARR</span><div class="iw" style="width:200px;flex:none">${ic('search', 13)}<input class="in sm" placeholder="Search by name…" aria-label="Search"></div><button class="btn sm" type="button" data-a="revFilters">${ic('filter', 12)}Filters${ic('chevd', 11)}</button><button class="btn sm" type="button" data-a="columns">${ic('columns', 12)}Columns</button></div>
      <div class="tbl"><table><thead><tr><th>#</th><th class="sort">Customer ${icI('arrowdown', 10)}</th><th>BCN</th><th>Contact</th><th>Phone</th><th>Email</th><th class="c">Cloud</th><th class="r sort">ARR ${icI('arrowdown', 10)}</th></tr></thead><tbody>${CUSTOMERS.map((x, i) => { const p = contactsFor(x)[0]; return `<tr data-ctx="cust" data-cn="${esc(x.name)}"><td class="sub num">${i + 1}</td><td><button class="link" type="button" data-a="custRev" data-v="${esc(x.name)}" style="font-size:12.5px">${esc(x.name)}</button></td><td class="mono">${x.bcn || '—'}</td><td>${p.f} ${p.l}</td><td class="num">${p.phone}</td><td class="sub">${i % 5 === 4 ? '—' : p.email}</td><td class="c">${x.cloud ? '<span class="chip solid">Yes</span>' : '<span class="chip">No</span>'}</td><td class="r money"><span class="ldot" style="background:${x.src === 'live' ? 'var(--pos)' : 'var(--faint)'}" title="${x.src === 'live' ? 'Live from Power BI · 14 Oct 2026' : 'Synced from D365 (no live value)'}"></span>${eur.format(x.arr)}</td></tr>`; }).join('')}</tbody></table></div>${pager(1, 7)}</section>`;
  if (t === 'pipeline') { const open = OPPS.filter((o) => o.status === 'Open'); const fs = STAGES.slice(0, 7).map((s) => open.filter((o) => o.st === s).length);
    c = `${strip([['Open deals', open.length], ['Total pipeline', eurK(open.reduce((a, o) => a + o.val, 0))], ['Weighted forecast', eurK(open.reduce((a, o) => a + o.val * PROB[o.st] / 100, 0)), 'probability-adjusted'], ['Multi-vendor rate', '21%', 'of open deals']])}
    <section class="panel"><div class="panel-h"><h2>Forecast by month</h2><span class="sub">Weighted vs total revenue from open deals expiring per month</span></div><div class="panel-b">${lineChart({ labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'], series: [{ name: 'Total', vals: [301, 223, 410, 66, 59, 0].map((v) => v * 1000), c: 'var(--accent)' }, { name: 'Weighted', vals: [270, 112, 98, 3, 3, 0].map((v) => v * 1000), c: 'var(--pos)' }], area: true, fmt: (v) => '€' + compact(v), h: 210 })}${legend([['Total', 'var(--accent)'], ['Weighted', 'var(--pos)']])}</div></section>
    <div class="grid2" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)"><section class="panel"><div class="panel-h"><h2>Stage funnel</h2><span class="sub">Open deals per stage</span></div><div class="panel-b">${barChart({ labels: ['Prosp.', 'Valid.', 'Qualif.', 'Verbal', 'Contract', 'Billing rej.', 'Pending'], series: [{ name: 'Deals', vals: fs, c: 'var(--accent)' }], h: 210 })}</div></section>
      <section class="panel"><div class="panel-h"><h2>Win rate</h2><span class="sub">all time</span></div><div class="panel-b">${donut([{ name: 'Won', val: 31, c: 'var(--pos)' }, { name: 'Lost', val: 50, c: 'var(--neg)' }, { name: 'Open', val: 14, c: 'var(--accent)' }])}${legend([['Won', 'var(--pos)'], ['Lost', 'var(--neg)'], ['Open', 'var(--accent)']], true)}</div></section></div>
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>Expiring soon</h2>${sel(['Next 7 days', 'Next 30 days'], state.expWin, 'aria-label="Window"', 'sl sm w-auto')}</div><div class="rows">${OPPS.filter((o) => o.status === 'Open' && relDays(o.exp) >= 0 && relDays(o.exp) <= 30).map((o) => `<div class="r-item" data-a="oppEdit" data-v="${OPPS.indexOf(o)}"><div class="grow"><div class="t">${esc(o.c)}</div><div class="m">${o.st} · ${fmtDate(o.exp)}</div></div><span class="money">${eurK(o.val)}</span></div>`).join('')}</div></section>
      <section class="panel"><div class="panel-h"><h2>Average deal size</h2></div><div class="panel-b" style="display:grid;gap:14px"><div class="sec-h">By sell type</div>${hbars([['Single', 61200], ['Cross Sell', 88400]], eurK)}<div class="sec-h">By reseller · top 10</div>${hbars([['AWS - STANDALONE', 109000], ['MICROSOFT - AZURE', 72760], ['AWS - CONSOLIDATED', 70300], ['MICROSOFT - MODERN WORKPLACE', 66000], ['MICROSOFT - DYNAMICS 365 NCE', 41800], ['MICROSOFT - CLOUD', 18100]], eurK, 190)}</div></section></div>`; }
  if (t === 'customers') c = `${strip([['30+ days inactive', '9', 'of 63 active'], ['60+ days inactive', '5'], ['90+ days inactive', '3'], ['Cloud rate', '65%', '41 cloud customers'], ['Avg contacts / customer', '3.4', '5 without contacts']])}
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>Customer health</h2></div><div class="panel-b">${donut([{ name: 'Healthy', val: 38, c: 'var(--pos)' }, { name: 'At risk', val: 17, c: 'var(--warn)' }, { name: 'Critical', val: 8, c: 'var(--neg)' }])}${legend([['Healthy · 70+', 'var(--pos)'], ['At risk · 40–69', 'var(--warn)'], ['Critical · under 40', 'var(--neg)']], true)}</div></section>
      <section class="panel"><div class="panel-h"><h2>By segment</h2></div><div class="panel-b">${donut([{ name: 'Enterprise', val: 11, c: 'var(--c1)' }, { name: 'Mid-market', val: 24, c: 'var(--c2)' }, { name: 'SMB', val: 22, c: 'var(--c3)' }, { name: 'Public', val: 6, c: 'var(--c4)' }])}${legend([['Enterprise', 'var(--c1)'], ['Mid-market', 'var(--c2)'], ['SMB', 'var(--c3)'], ['Public', 'var(--c4)']], true)}</div></section></div>
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>Customers by ARR bucket</h2><span class="sub">58 with ARR · 5 without</span></div><div class="panel-b">${barChart({ labels: ['< €10k', '€10k–50k', '€50k–200k', '€200k+'], series: [{ name: 'Customers', vals: [14, 26, 16, 2], c: 'var(--accent)' }], h: 200 })}</div></section>
      <section class="panel"><div class="panel-h"><h2>ARR by</h2>${sel(['Industry', 'Segment', 'Country'], state.dim, 'aria-label="Dimension"', 'sl sm w-auto')}</div><div class="panel-b">${hbars([['Healthcare', 642000], ['Logistics', 510000], ['Manufacturing', 486000], ['Transport', 402000], ['Life sciences', 331000], ['Retail', 214000], ['Hospitality', 166000], ['Food', 98000]], eurK)}</div></section></div>
    <div class="grid2"><section class="panel"><div class="panel-h"><h2>Cloud adoption by segment</h2></div><div class="panel-b" style="display:grid;gap:10px">${[['Enterprise', 9, 11], ['Mid-market', 17, 24], ['SMB', 12, 22], ['Public', 3, 6]].map(([s, a, b]) => `<div style="display:grid;gap:4px"><div class="f-row" style="font-size:12px"><span>${s}</span><span class="sub num">${a}/${b} (${Math.round((a / b) * 100)}%)</span></div><div class="prog"><i style="width:${(a / b) * 100}%"></i></div></div>`).join('')}</div></section>
      <section class="panel"><div class="panel-h"><h2>Top 10 by ARR</h2></div><div class="tbl"><table><thead><tr><th>#</th><th>Customer</th><th>Industry</th><th class="r">ARR</th></tr></thead><tbody>${CUSTOMERS.slice(0, 10).map((x, i) => `<tr><td class="sub num">${i + 1}</td><td><button class="link" type="button" data-a="cust" data-v="${esc(x.name)}" style="font-size:12.5px">${esc(x.name)}</button></td><td>${x.ind}</td><td class="r money">${eurK(x.arr)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  if (t === 'me') c = `${strip([['My activities', '42', 'vs prior period', [1, '+6']], ['Follow-up completion', '87%', '26 / 30 · avg 2.4 days'], ['Open pipeline', '€1.24M', '14 open deals'], ['Weighted forecast', '€486K', 'probability-adjusted'], ['Win rate', '38%', '5 won / 8 lost']])}
    <section class="panel"><div class="panel-h"><h2>Activities per day</h2></div><div class="panel-b">${lineChart({ labels: Array.from({ length: 30 }, (_, i) => `${((i + 14) % 30) + 1} ${i < 17 ? 'Sep' : 'Oct'}`), series: [{ name: 'Activities', vals: [1, 2, 0, 3, 1, 0, 0, 2, 4, 1, 2, 3, 0, 0, 1, 2, 2, 3, 1, 0, 0, 2, 1, 3, 2, 1, 0, 0, 2, 3], c: 'var(--accent)' }], area: true, h: 180, every: 5 })}</div></section>
    <div class="grid3"><section class="panel"><div class="panel-h"><h2>Type mix</h2><span class="sub">me vs team</span></div><div class="panel-b">${barChart({ labels: ['Meeting', 'Visit', 'Call', 'Note'], series: [{ name: 'Mine', vals: [12, 7, 15, 8], c: 'var(--accent)' }, { name: 'Team', vals: [9, 5, 18, 11], c: 'var(--c4)' }], h: 200 })}${legend([['Mine', 'var(--accent)'], ['Team', 'var(--c4)']])}</div></section>
      <section class="panel"><div class="panel-h"><h2>Call direction</h2><span class="sub">15 calls</span></div><div class="panel-b">${donut([{ name: 'Outgoing', val: 10, c: 'var(--accent)' }, { name: 'Incoming', val: 4, c: 'var(--c2)' }, { name: 'Unknown', val: 1, c: 'var(--c8)' }], 150)}${legend([['Outgoing', 'var(--accent)'], ['Incoming', 'var(--c2)'], ['Unknown', 'var(--c8)']], true)}</div></section>
      <section class="panel"><div class="panel-h"><h2>By weekday</h2></div><div class="panel-b">${barChart({ labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], series: [{ name: 'Activities', vals: [0, 9, 11, 8, 10, 4, 0], c: 'var(--accent)' }], h: 200 })}</div></section></div>
    <section class="panel"><div class="panel-h"><h2>Most active customers</h2></div><div class="panel-b">${hbars(CUSTOMERS.slice(0, 6).map((x, i) => [x.name, 9 - i], (v) => `${v} activities`), (v) => `${v} activities`, 220)}</div></section>`;
  return {
    crumbs: ['Reports', name],
    bar: `<h1>Reports</h1><div class="seg" role="tablist" aria-label="Report">${REP_TABS.map(([k, l]) => `<button type="button" role="tab" data-a="repTab" data-v="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div><span class="grow"></span>
      ${t === 'revenue' ? sel(['All Benelux', 'Belgium', 'Netherlands', 'Luxembourg'], state.region, 'id="region" aria-label="Region"', 'sl w-auto') : ''}
      <div class="seg" role="group" aria-label="Period">${['30D', '3M', '6M', '12M'].map((p) => `<button type="button" data-a="repPeriod" data-v="${p}" aria-pressed="${state.repPeriod === p}">${p}</button>`).join('')}</div>
      <span class="chip" title="14 Oct 2026, 08:00:12">${icI('clock', 11)} 2h ago</span><button class="tb-btn" type="button" data-a="refresh" title="Refresh">${ic('sync', 14)}</button><button class="btn" type="button" data-a="export">${ic('download', 14)}Export</button>`,
    body: `<div class="view-body" data-sk="rep-${t}"><div class="pad" style="max-width:1400px">${c}</div></div>`,
    status: `${name} · ${state.repPeriod} · data as of last sync`,
  };
};

// ---------- Sync ----------
const SYNC_ST = { success: ['checkc', 'pos', 'Success'], partial: ['alert', 'warn', 'Partial'], error: ['xc', 'neg', 'Error'], running: ['sync', 'info', 'Running'] };
views.sync = () => {
  const pending = [['Activities', ACTS.slice(0, 2).map((a) => [a.type, typeName(a), a.t, `${a.c} · ${a.date}`])], ['Follow-ups', [['fu', 'Follow-up', TASKS[2].t, `${TASKS[2].c} · due 14 Oct 2026`]]], ['Opportunities', [['opp', OPPS[4].st, OPPS[4].s, `${OPPS[4].c} · ${eur.format(OPPS[4].val)}`]]]];
  return {
    crumbs: ['Sync'],
    bar: `<h1>Sync</h1><span class="grow"></span><button class="btn" type="button" data-a="runSync" ${state.online && state.pending && !state.syncing ? '' : 'disabled'}>${ic('upload', 14)}Push pending</button><button class="btn primary" type="button" data-a="runSync" ${state.online && !state.syncing ? '' : 'disabled'}>${state.syncing ? '<span class="spin"></span>Syncing…' : `${ic('sync', 14)}Run full sync`}</button>`,
    body: `<div class="view-body" data-sk="sync"><div class="pad" style="max-width:1280px">
      ${state.online ? '' : `<div class="warnbox">${ic('wifioff', 15)}You are offline. Connect to sync.</div>`}
      ${strip([['Last sync', '4 min ago', 'Dynamics 365 · 09:41'], ['Next sync', '10:41', 'every 30 min'], ['Pending changes', String(state.pending), state.pending ? '2 activities · 1 follow-up · 1 opp' : 'all changes synced'], ['Last 24 hours', '98%', '1 error · 1 partial']])}
      <div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(0,1.5fr)">
        <section class="panel"><div class="panel-h"><h2>Waiting to sync</h2>${state.pending ? `<span class="chip warn">${state.pending}</span>` : ''}</div><div class="rows">${!state.pending ? emptyS('checkc', 'Nothing waiting', 'Every change is in Dynamics 365.') : pending.map(([g, items]) => `<div class="group-h">${g} <span class="num" style="color:var(--faint)">${items.length}</span></div>${items.map(([ty, lbl, t, m]) => `<div class="r-item">${ty === 'fu' ? `<span class="type-ic t-fu">${ic('calendar', 13)}</span>` : typeIcon(ty)}<div class="grow"><div class="t">${esc(t)}</div><div class="m">${esc(m)}</div></div><span class="chip">${lbl}</span></div>`).join('')}`).join('')}</div></section>
        <section class="panel"><div class="panel-h"><h2>History</h2><span class="sub">last 200 runs</span></div><div class="tbl"><table><thead><tr><th>Status</th><th>Type</th><th>When</th><th class="r">Pulled</th><th class="r">Pushed</th></tr></thead><tbody>${SYNC_HIST.map(([ty, st, dt, pl, pu, er]) => { const [i, k, l] = SYNC_ST[st]; return `<tr title="${esc(er)}"><td><span class="chip ${k}">${icI(i, 11)} ${l}</span></td><td>${ty}${er ? `<div class="m" style="color:var(--neg);white-space:normal;max-width:280px">${esc(er)}</div>` : ''}</td><td class="num sub">${dt}</td><td class="r num">${pl.toLocaleString('en')}</td><td class="r num">${pu}</td></tr>`; }).join('')}</tbody></table></div>${pager(1, 20)}</section>
      </div>
    </div></div>`,
    status: state.online ? 'Auto-sync every 30 min · next run 10:41' : 'Offline · changes are saved locally',
  };
};

// ---------- Settings (home + category pages, setting cards) ----------
const SET_TABS = [['general', 'General', 'settings', 'Updates, startup and data reset'], ['appearance', 'Appearance', 'palette', 'Theme, colour, layout and sidebar'], ['data', 'Data & Defaults', 'db', 'Pre-filled values for new records'], ['notifications', 'Notifications', 'bell', 'Reminders, toasts and quiet hours'], ['syncset', 'Sync', 'sync', 'Intervals, scope and history'], ['keys', 'Keybindings', 'keyboard', 'Change keyboard shortcuts']];
const ivCtl = (presets, val, unit) => `<div class="row-flex">${presets.map((p) => `<button class="btn sm ${p === val ? '' : 'ghost'}" type="button" ${p === val ? 'aria-pressed="true"' : ''}>${p}</button>`).join('')}${numIn(val, unit)}</div>`;
// [group, icon, label, desc, control, expandHtml?]
function settingsData() {
  return {
    general: [
      ['App', 'download', 'Updates', 'Version 3.0.1 is available', `<button class="btn" type="button" data-a="updateNow">${ic('download', 13)}Install update</button>`],
      ['App', 'rocket', 'Launch on startup', 'Automatically start the app when you log in to Windows', sw(true)],
      ['App', 'copy', 'App info', '<span class="mono">Version 3.0.0 · Schema v14</span>', `<button class="btn sm ghost" type="button" data-a="toast" data-v="Copied">${ic('copy', 12)}Copy</button>`],
      ['App', 'play', 'Begin walkthrough', 'Restart the onboarding tour', `<button class="btn" type="button" data-a="walk">Begin tour</button>`],
      ['Reset', 'rotate', 'Reset all settings', 'Restore every setting to its default value', `<button class="btn danger" type="button" data-a="confirm" data-v="Reset all settings to defaults? This cannot be undone." data-ok="Reset all">Reset all</button>`],
      ['Reset', 'trash', 'Clear local database', 'Delete all synced data (customers, contacts, activities, etc.)', `<button class="btn danger" type="button" data-a="confirm" data-v="Delete all local data? You'll need to re-sync from D365." data-ok="Clear">Clear data</button>`],
    ],
    appearance: [
      ['Theme & colours', 'sun', 'Theme', 'Light, dark, or follow your system', `<div class="seg">${[['light', 'Light', 'sun'], ['dark', 'Dark', 'moon'], ['system', 'System', 'monitor']].map(([k, l, i]) => `<button type="button" data-a="cfg" data-k="theme" data-v="${k}" aria-pressed="${cfg.theme === k}">${ic(i, 13)}${l}</button>`).join('')}</div>`],
      ['Theme & colours', 'moon', 'Auto-theme by time of day', 'Switch to dark in the evening, light in the morning', sw(state.autoTheme, 'data-x="autoTheme"'), state.autoTheme ? setRow('Dark from / light from', 'Hour (0–23) to switch to each theme', `${numIn(19, '')} / ${numIn(7, '')}`) : '', true],
      ['Theme & colours', 'palette', 'Accent colour', 'Primary colour used across the app', `<div class="sw8">${ACCENTS.slice(0, 6).map(([n, h]) => `<button type="button" style="background:${h}" title="${n}" data-a="cfg" data-k="accent" data-v="${h}" aria-pressed="${cfg.accent === h}"></button>`).join('')}</div>`, setRow('Custom accent (hex)', 'Override presets with a custom colour, e.g. #ff6b35', `<input class="in sm mono" style="width:110px" placeholder="#2f5bd3" id="hexIn"><button class="btn sm" type="button" data-a="hexApply">Apply</button>`)],
      ['Theme & colours', 'eye', 'High contrast', 'Stronger borders and muted text for readability', sw(false)],
      ['Layout & typography', 'layers', 'Density', 'Controls spacing across the app', sel([['comfortable', 'Comfortable'], ['cozy', 'Cozy'], ['compact', 'Compact']], cfg.density, 'data-cfgsel="density"')],
      ['Layout & typography', 'note', 'Font size', 'Scale all text proportionally', sel(['Small', 'Medium', 'Large'], 'Medium')],
      ['Layout & typography', 'note', 'UI font', 'Font family used across the app', sel(FONTS.map((f) => f[0]), cfg.font, 'data-cfgsel="font"')],
      ['Layout & typography', 'table', 'Table row density', 'Row padding in all data tables', sel(['Comfortable', 'Cozy', 'Compact'], 'Comfortable')],
      ['Layout & typography', 'activity', 'Reduce motion', 'Disable transitions and animations', sw(false)],
      ['Sidebar & navigation', 'home', 'Default landing page', 'The page that opens when you launch the app', sel(NAV.map((n) => n[1]), 'Home')],
      ['Sidebar & navigation', 'columns', 'Remember last sidebar state', 'When off, the sidebar starts in the default state on every launch', sw(true)],
      ['Sidebar & navigation', 'columns', 'Sidebar expanded by default', "Used when 'remember last state' is off", sw(false)],
      ['Sidebar & navigation', 'grip', 'Sidebar order', 'Drag to reorder or hide pages in the sidebar', '', `<div class="drag-list" style="padding:4px 0">${NAV.map(([k, l, i]) => `<div class="drag-item"><span class="grip">${ic('grip', 14)}</span>${ic(i, 15)}<span style="flex:1">${l}</span><button class="tb-btn" type="button" title="Hide from sidebar">${ic('eye', 14)}</button></div>`).join('')}</div>`, true],
      ['Easter eggs', 'sparkles', 'Celebrate wins', 'Confetti on your first won opp of the day, fireworks for >€1M ARR, and a birthday surprise.', sw(true), setRow('Preview', 'See what each animation looks like', `<button class="btn sm" type="button" data-a="confetti">Confetti</button><button class="btn sm" type="button" data-a="confetti" data-v="whale">Whale</button><button class="btn sm" type="button" data-a="modal" data-v="birthday">Birthday</button>`)],
    ],
    data: [
      ['Customers', 'arrowud', 'Default customer sort', 'Initial sort when viewing the customer list', sel(SORTS, 'Last Activity')],
      ['Customers', 'user', 'Show only my customers by default', 'Pre-filter the customer list to records you own', sw(false)],
      ['Customers', 'clock', 'No recent activity threshold', "Customers with no activity in this many days appear under the 'No activity' filter", numIn(90, 'days')],
      ['Activities', 'activity', 'Default activity type', 'Pre-selected type when logging a new activity', sel(['Meeting', 'Visit', 'Call', 'Note'], 'Meeting')],
      ['Activities', 'checkc', 'Default activity status', 'Pre-selected status for new meetings, visits, and calls', sel(['Open', 'Completed'], 'Open')],
      ['Activities', 'call', 'Default call direction', 'Pre-selected direction when logging a new call', sel(['Outgoing', 'Incoming'], 'Outgoing')],
      ['Activities', 'clock', 'Default appointment duration', 'How long a new meeting or visit lasts by default', numIn(1, 'hours', 'step="0.5"')],
      ['Opportunities', 'dollar', 'Default currency', 'Pre-selected currency on new opportunities', sel(['EUR', 'USD'], 'USD')],
      ['Opportunities', 'globe', 'Default country', 'Pre-selected country on new opportunities', sel(['Belgium', 'Netherlands'], 'Belgium')],
      ['Opportunities', 'target', 'Default stage', 'Initial stage assigned to new opportunities', sel(STAGES, 'Prospecting')],
      ['Opportunities', 'calendar', 'Default expiration offset', 'Days from today when a new opportunity expires', numIn(7, 'days')],
      ['Follow-ups', 'calendar', 'Default due date offset', 'Days from today when a new follow-up is due', numIn(1, 'days')],
    ],
    notifications: [
      ['Toasts', 'bell', 'Mute non-critical toasts', 'Suppress success/info toasts everywhere; errors still come through', sw(false)],
      ['Toasts', 'clock', 'Toast duration', 'How long toasts stay on screen', numIn(4, 'seconds')],
      ['Toasts', 'monitor', 'Native OS notifications', 'Also show alerts in the Windows notification centre (visible when minimised)', sw(false)],
      ['Toasts', 'bell', 'Play sound on warnings/errors', 'Short beep when a warning or error toast fires', sw(false)],
      ['Toasts', 'moon', 'Quiet hours', 'Suppress non-critical toasts during this window', sw(state.quiet, 'data-x="quiet"'), state.quiet ? setRow('Quiet hours range', 'Start and end (24h)', '<input class="in sm num" style="width:80px" value="22:00"> to <input class="in sm num" style="width:80px" value="08:00">') : '', true],
      ['On launch', 'inbox', 'Daily digest on launch', 'Combine all launch reminders into a single rollup toast', sw(true)],
      ['On launch', 'alert', 'Overdue alerts on launch', 'Alert when follow-ups are past their due date', sw(true)],
      ['On launch', 'calendar', 'Due today alerts on launch', 'Alert when follow-ups are due today', sw(true)],
      ['Reminders', 'bell', 'Follow-up reminder', 'Remind before a follow-up is due', numIn(1, 'days before')],
      ['Reminders', 'alert', 'Opportunity stale reminder', 'Flag opportunities with no updates after this many days', numIn(30, 'days')],
      ['Reminders', 'calendar', 'Opportunity expiring soon', 'Flag opportunities expiring within this window (0 = off)', numIn(14, 'days')],
      ['Sync & system', 'sync', 'Show sync toasts', 'Display notifications when sync completes or fails', sw(true), setRow('Sync toast verbosity', 'Which sync outcomes show up as toasts', sel(['Success + errors', 'Errors only', 'Silent'], 'Success + errors')) + setRow('Sync failure threshold', 'Only show a failure toast after this many consecutive failures', numIn(1, 'failures'))],
      ['Sync & system', 'wifi', 'Connectivity alerts', 'Notify when you go offline or come back online', sw(true)],
      ['Sync & system', 'download', 'Update available alerts', 'Notify when a new version of the app is available', sw(true)],
    ],
    syncset: [
      ['General', 'stop', 'Pause auto-sync', 'Temporarily stop background syncs without changing intervals', sw(false)],
      ['General', 'rocket', 'Auto-sync on launch', 'Automatically sync data when the app starts', sw(true)],
      ['General', 'window', 'Sync on window focus', 'Run a sync when you return to the app (max once every 5 min)', sw(false)],
      ['Intervals', 'sync', 'Full sync interval', 'Every 30 min · last run 4 minutes ago', '', setRow('Minutes between full background syncs', '5–120 min', ivCtl([15, 30, 60], 30, 'min'))],
      ['Intervals', 'upload', 'Pending push interval', 'Every 15 min · last run 9 minutes ago', '', setRow('Minutes between automatic pushes of pending changes', '5–120 min', ivCtl([5, 15, 30], 15, 'min'))],
      ['Intervals', 'pie', 'Power BI refresh interval', 'Every 120 min · last run 2 hours ago', '', setRow('Minutes between standalone Power BI revenue refreshes', '30–720 min', ivCtl([60, 120, 240], 120, 'min'))],
      ['Scope', 'db', 'Customers & activities (Dynamics 365)', 'Pull customers, contacts, activities, opportunities, follow-ups', sw(true)],
      ['Scope', 'pie', 'Revenue & insights (Power BI)', 'Pull ARR totals, insights, and ARR movement snapshots', sw(true)],
      ['Scope', 'upload', 'Push pending changes', 'Send your local edits back to Dynamics 365', sw(true)],
      ['History', 'clock', 'Keep sync history', 'Entries older than 90 days are deleted on app start', '', setRow('Days to keep', '7–365 days', ivCtl([30, 90, 180], 90, 'days'))],
    ],
  };
}
const scard = (cat, r, k) => { const [, icon, label, desc, ctl, exp, openDefault] = r; const id = `${cat}:${k}`; const open = exp && (state.setOpen[id] ?? openDefault ?? false);
  return `<div class="scard ${exp ? 'has-exp' : ''}"><div class="scard-main" ${exp ? `data-a="setExp" data-v="${id}"` : ''}><span class="scard-ic">${ic(icon, 16)}</span><div class="lbl"><b>${label}</b><span>${desc}</span></div><div class="ctl">${ctl}${exp ? `<span class="exp-chev ${open ? 'open' : ''}">${ic('chevd', 14)}</span>` : ''}</div></div>${open ? `<div class="scard-exp">${exp}</div>` : ''}</div>`; };
views.settings = () => {
  const t = state.setTab, data = settingsData(); let c = '';
  const q = state.setQ.trim().toLowerCase();
  if (q) {
    const hits = Object.entries(data).flatMap(([cat, rows]) => rows.map((r, k) => [cat, r, k]).filter(([, r]) => (r[2] + ' ' + r[3]).toLowerCase().includes(q)));
    c = `<div class="sec-h">${hits.length} result${hits.length === 1 ? '' : 's'} for "${esc(state.setQ)}"</div>${hits.map(([cat, r, k]) => `<div style="display:grid;gap:4px"><button class="link" type="button" data-a="setTab" data-v="${cat}" style="font-size:11px">${SET_TABS.find((x) => x[0] === cat)[1]}</button>${scard(cat, r, k)}</div>`).join('') || emptyS('search', 'No settings found', 'Try another word, like "theme" or "sync"')}`;
  } else if (t === 'home') {
    c = `<section class="panel" style="padding:16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span class="avatar" style="width:60px;height:60px;font-size:19px">DH</span><div style="flex:1;min-width:200px"><div style="font-weight:650;font-size:16px">${ME.name}</div><div class="sub">${ME.title} · ${ME.email}</div></div><div style="display:grid;gap:4px;justify-items:end"><span class="sub">${icI('cake', 11)} Birthday</span><div class="row-flex"><button class="btn sm" type="button" data-a="datePick">${ic('calendar', 12)}14 Oct 1996</button><button class="btn sm" type="button" data-a="toast" data-v="Birthday saved">${ic('save', 12)}Save</button></div></div></section>
      <div class="set-tiles">${SET_TABS.map(([k, l, i, d]) => `<button class="set-tile" type="button" data-a="setTab" data-v="${k}"><span class="scard-ic">${ic(i, 18)}</span><span><b>${l}</b><span class="sub">${k === 'appearance' ? `${cfg.theme[0].toUpperCase() + cfg.theme.slice(1)} · ${(ACCENTS.find((a) => a[1] === cfg.accent) || ['Custom'])[0]} · ${cfg.density}` : d}</span></span>${ic('chev', 14)}</button>`).join('')}</div>`;
  } else if (t === 'keys') {
    c = SHORTCUTS.map(([g, rows], gi) => `<div class="sec-h">${g}</div><div class="scard-group">${rows.map(([l, k], ri) => { const id = gi * 10 + ri, rec = state.kbRec === id, custom = l === 'Toggle Filters'; return `<div class="scard"><div class="scard-main ${rec ? 'rec' : ''}"><div class="lbl"><b>${l}</b>${custom ? '<span>Default: F</span>' : ''}</div><div class="ctl">${rec ? '<span class="sub" style="color:var(--accent-text)">Press keys…</span>' : kbd(custom ? ['Shift', 'F'] : k)}<button class="tb-btn" type="button" data-a="kbRec" data-v="${id}" title="Change">${ic('edit', 13)}</button>${custom ? `<button class="tb-btn" type="button" title="Reset to default">${ic('undo', 13)}</button>` : ''}</div></div></div>`; }).join('')}</div>`).join('');
  } else {
    const rows = data[t]; let last = '';
    c = rows.map((r, k) => { const h = r[0] !== last ? `${last ? '</div>' : ''}<div class="sec-h">${r[0]}</div><div class="scard-group">` : ''; last = r[0]; return h + scard(t, r, k); }).join('') + '</div>';
  }
  const cur = SET_TABS.find((x) => x[0] === t);
  return {
    crumbs: t === 'home' ? ['Settings'] : ['Settings', cur[1]],
    bar: `${t !== 'home' && !q ? `<button class="tb-btn" type="button" data-a="setTab" data-v="home" aria-label="Back to settings">${ic('arrowl', 15)}</button>` : ''}<h1>${t === 'home' || q ? 'Settings' : `<span class="sub" style="font-size:15px;font-weight:500">Settings ›</span> ${cur[1]}`}</h1><span class="grow"></span>
      ${t !== 'home' && t !== 'general' && !q ? `<button class="btn" type="button" data-a="confirm" data-v="Reset ${cur[1].toLowerCase()} settings to defaults?" data-ok="Reset">${ic('rotate', 13)}Reset to defaults</button>` : ''}`,
    body: `<div class="view-body" data-sk="set-${t}"><div class="pad" style="max-width:860px"><div class="iw" style="max-width:420px">${ic('filter', 14)}<input class="in" id="setSearch" placeholder="Find a setting" value="${esc(state.setQ)}" aria-label="Find a setting"></div>${c}</div></div>`,
    status: 'Changes are saved automatically',
  };
};

const tabbedBody = (content, key, wide) => `<div class="view-body" data-sk="${key}"><div class="pad" style="max-width:${wide ? 1400 : 1120}px">${content.replace(/<div class="h2row"><h2>[^<]*<\/h2>/g, '<div class="h2row"><span class="grow"></span>')}</div></div>`;
const toolbarTabs = (tabs, cur, act) => `<div class="seg" role="tablist">${tabs.filter(Array.isArray).map(([k, l]) => `<button type="button" role="tab" data-a="${act}" data-v="${k}" aria-pressed="${cur === k}">${l}</button>`).join('')}</div>`;
// ---------- Admin ----------
const ADMIN_TABS = [['analytics', 'Analytics', 'bar'], ['users', 'Users', 'users'], '-', ['data', 'Data', 'hdd'], ['database', 'Database', 'terminal'], ['powerbi', 'PowerBI', 'pie'], ['discovery', 'Discovery', 'search'], ['revsync', 'Revenue Sync', 'sync']];
views.admin = () => {
  const tabs = toolbarTabs(ADMIN_TABS, state.adminTab, 'adminTab');
  if (state.adminDenied) return { crumbs: ['Admin'], bar: `<h1>Admin</h1>`, body: `<div class="center-state">${ic('shield', 40)}<b style="font-size:15px">Access denied</b><span class="sub">You need admin privileges to view this page.</span></div>`, status: '' };
  const t = state.adminTab; let c = '', actions = '', status = '';
  if (t === 'analytics') {
    const lb = USERS.slice(0, 4).map((u, i) => [u[0], u[2], [42, 35, 28, 19][i], [12, 9, 6, 4][i], [15, 14, 12, 8][i], [7, 6, 4, 3][i], [8, 6, 6, 4][i], [11, 9, 7, 6][i], [87, 64, 38, 52][i], [6, 4, 3, 2][i], [486, 310, 122, 88][i], [2, 1, 0, 1][i], [40, 33, 0, 50][i], [18, 14, 11, 9][i]]);
    actions = `${sel(['Last 7 days', 'Last 30 days', 'Last 90 days', 'Quarter to date'], 'Last 30 days', 'aria-label="Range"', 'sl w-auto')}<button class="btn" type="button" data-a="refresh">${ic('sync', 13)}Refresh from D365</button>`;
    c = `${strip([['Team activities', '124', '4 tracked users'], ['Follow-up completion', '71%', '37 / 52'], ['Opps created', '15', '€1.01M'], ['Opps won', '4', '6 lost'], ['Win rate', '40%', '10 closed deals']])}
      <div class="grid2"><section class="panel"><div class="panel-h"><h2>Zero activities this period</h2><span class="chip pos">${icI('check', 11)} None</span></div><div class="panel-b sub">Every tracked user logged at least one activity.</div></section>
        <section class="panel"><div class="panel-h"><h2>Overdue follow-ups</h2><span class="chip neg">3</span></div><div class="rows">${[['Dylan Hias', 2], ['Sarah Dubois', 1]].map(([n, k]) => `<div class="r-item"><span class="avatar">${n.split(' ').map((w) => w[0]).join('')}</span><div class="grow">${n}</div><span class="chip neg">${k} overdue</span></div>`).join('')}</div></section></div>
      <section class="panel"><div class="panel-h"><h2>Leaderboard</h2><div class="iw" style="width:220px;flex:none">${ic('search', 13)}<input class="in sm" placeholder="Search user…" aria-label="Search user"></div></div><div class="tbl"><table><thead><tr>${['User', 'Total', 'Mtg', 'Call', 'Visit', 'Note', 'FU new', 'FU %', 'Opps', 'Pipe €', 'Won', 'Win %', 'Cust.', ''].map((h, i) => `<th class="${i ? 'r' : ''} ${i === 1 ? 'sort' : ''}">${h}${i === 1 ? ' ' + icI('arrowdown', 10) : ''}</th>`).join('')}</tr></thead><tbody>${lb.map((r, i) => `<tr data-a="lbOpen" data-v="${i}" aria-selected="${state.lbOpen === i}"><td><div class="row-flex" style="flex-wrap:nowrap"><span class="avatar">${r[0].split(' ').map((w) => w[0]).join('')}</span><div><div style="font-weight:550">${r[0]}</div><div class="tiny">${r[1]}</div></div></div></td>${r.slice(2).map((v, k) => `<td class="r num" style="${k === 6 ? `color:var(--${v >= 75 ? 'pos' : v >= 40 ? 'fg' : 'warn'})` : k === 9 && v > 0 ? 'color:var(--pos)' : ''}">${k === 6 || k === 10 ? v + '%' : k === 8 ? '€' + v + 'k' : v}</td>`).join('')}<td>${ic(state.lbOpen === i ? 'chevd' : 'chev', 13)}</td></tr>${state.lbOpen === i ? `<tr><td colspan="14" style="white-space:normal;background:var(--sheet);padding:12px;height:auto"><div style="display:grid;gap:12px">${strip([['Activities', r[2], '18 customers touched'], ['Follow-ups', '13 / 15', '87% completion'], ['Open pipeline', '€1.24M', '14 open deals'], ['Won / lost', '2 / 3', '40% win rate']])}<section class="panel"><div class="panel-h"><h2>Daily output</h2></div><div class="panel-b">${lineChart({ labels: Array.from({ length: 14 }, (_, k) => `${k + 1} Oct`), series: [['Meeting', 'var(--c7)'], ['Call', 'var(--c2)'], ['Visit', 'var(--c6)'], ['Note', 'var(--c4)'], ['Follow-up', 'var(--c5)'], ['Opportunity', 'var(--c3)']].map(([n, col], k) => ({ name: n, c: col, w: 1.5, vals: Array.from({ length: 14 }, (_, d) => Math.max(0, Math.round(2 + Math.sin(d + k) * 2 - k * 0.3))) })), area: true, h: 180, every: 2 })}${legend([['Meeting', 'var(--c7)'], ['Call', 'var(--c2)'], ['Visit', 'var(--c6)'], ['Note', 'var(--c4)'], ['Follow-up', 'var(--c5)'], ['Opportunity', 'var(--c3)']])}</div></section></div></td></tr>` : ''}`).join('')}</tbody></table></div></section>`;
    status = '4 tracked users · last 30 days';
  }
  if (t === 'users') {
    actions = `<button class="btn" type="button" data-a="refresh">${ic('sync', 13)}Refresh from D365</button>`;
    c = `<section class="panel"><div class="panel-h"><div class="iw" style="flex:1;max-width:340px">${ic('search', 13)}<input class="in sm" placeholder="Search name, email or title…" aria-label="Search users"></div>${sel(['All users', 'Tracked only', 'Untracked only'], 'All users', 'aria-label="Tracked"', 'sl sm w-auto')}<span class="grow"></span><button class="btn sm" type="button">Track all</button><button class="btn sm" type="button">Untrack all</button></div>
      <div class="tbl"><table><thead><tr><th class="sort">Name ${icI('arrowup', 10)}</th><th>Email</th><th>Title</th><th>Last accessed</th><th class="c">In analytics</th></tr></thead><tbody>${USERS.map(([n, e, ti, la, tr], i) => `<tr><td><div class="row-flex" style="flex-wrap:nowrap"><span class="avatar">${n.split(' ').map((w) => w[0]).join('')}</span><b style="font-weight:550">${n}</b>${i === 0 ? '<span class="chip accent">You · Admin</span>' : ''}</div></td><td class="sub">${e}</td><td>${ti}</td><td class="num">${la}</td><td class="c">${sw(tr)}</td></tr>`).join('')}</tbody></table></div></section>`;
    status = `${USERS.length} users · 4 tracked in analytics`;
  }
  if (t === 'data') {
    actions = `<button class="btn" type="button" data-a="export">${ic('download', 13)}Export all data</button>`;
    c = `<div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><section class="panel"><div class="panel-h"><h2>Tables</h2><span class="sub">8</span></div><div class="tbl"><table><thead><tr><th>Table</th><th class="r">Rows</th></tr></thead><tbody>${[['customers', 63], ['contacts', 214], ['activities', 1204], ['follow_ups', 312], ['opportunities', 214], ['sync_records', 2841], ['users', 6], ['revenue_cache', 63]].map(([n, k]) => `<tr><td class="mono">${n}</td><td class="r num">${k.toLocaleString('en')}</td></tr>`).join('')}</tbody></table></div></section>
      <div class="scard-group" style="align-content:start"><div class="scard"><div class="scard-main"><span class="scard-ic">${ic('trash', 16)}</span><div class="lbl"><b>Purge old sync records</b><span>Delete sync history older than the number of days you choose</span></div><div class="ctl">${numIn(90, 'days')}<button class="btn danger" type="button" data-a="confirm" data-v="Delete sync records older than 90 days?" data-ok="Purge">Purge</button></div></div></div></div></div>`;
    status = '8 tables · 4,917 rows';
  }
  if (t === 'database') {
    actions = `${sel(['Saved queries…', 'Customers without BCN', 'Pending activities'], 'Saved queries…', 'aria-label="Saved queries"', 'sl w-auto')}<button class="btn" type="button" data-a="toast" data-v="Query saved">${ic('save', 13)}Save</button>`;
    c = `<section class="panel"><textarea class="sql" id="sql" spellcheck="false" aria-label="SQL">SELECT name, city, arr FROM customers WHERE cloud_customer = 1 ORDER BY arr DESC LIMIT 10;</textarea><div class="panel-f"><button class="btn primary" type="button" data-a="runSql">${ic('play', 13)}Run</button><kbd>Ctrl+Enter</kbd><span class="grow"></span>${state.dbRan ? '<span class="sub">12 ms</span><span class="chip">7 rows</span>' : ''}</div></section>
      <section class="panel"><div class="panel-h"><h2>Results</h2></div>${state.dbRan ? `<div class="tbl"><table class="mono"><thead><tr><th>name</th><th>city</th><th class="r">arr</th></tr></thead><tbody>${CUSTOMERS.filter((x) => x.cloud).map((x) => `<tr><td>${esc(x.name)}</td><td>${x.city}</td><td class="r">${x.arr}</td></tr>`).join('')}</tbody></table></div>` : emptyS('terminal', 'No results yet', 'Run a query to see results here.')}</section>`;
    status = 'Local SQLite database';
  }
  if (t === 'powerbi') {
    actions = `<button class="btn" type="button" data-a="toast" data-v="Copied">${ic('copy', 13)}Copy JSON</button><button class="btn primary" type="button" data-a="toast" data-v="Scanning model…">${ic('sync', 13)}Rescan</button>`;
    c = `<div class="warnbox">${ic('alert', 15)}<span>This dataset doesn't support live schema reads. Showing the bundled snapshot from 02 Sep 2026.</span></div>
      ${strip([['Tables', '18 / 24', 'visible / total'], ['Columns', '212 / 301', 'visible / total'], ['Measures', '64 / 71', 'visible / total'], ['Relationships', '22']])}
      <section class="panel"><div class="panel-h"><div class="seg" role="tablist">${['Tables', 'Columns', 'Measures', 'Relationships'].map((l) => `<button type="button" data-a="pbiTab" data-v="${l}" aria-pressed="${state.pbiTab === l}">${l}</button>`).join('')}</div><span class="grow"></span><div class="iw" style="width:220px;flex:none">${ic('search', 13)}<input class="in sm" placeholder="Search…" aria-label="Search schema"></div><button class="btn sm" type="button" data-a="sw" role="switch" aria-checked="false">Show hidden</button></div>
        <div class="rows">${(state.pbiTab === 'Measures' ? [['FactARR · Total ARR', 'Revenue', 'currency'], ['FactARR · Active Customers', 'Customers', 'int'], ['FactSales · Net Sales LC', 'Sales', 'currency']] : state.pbiTab === 'Relationships' ? [['FactARR[BCN] → DimCustomer[BCN]', 'many-to-one', ''], ['FactSales[VendorKey] → DimVendor[VendorKey]', 'many-to-one', ''], ['FactARR[DateKey] → DimDate[DateKey]', 'inactive', '']] : state.pbiTab === 'Columns' ? [['DimCustomer · BCN', 'string', 'key'], ['DimCustomer · Name', 'string', ''], ['FactARR · ARR_LC', 'decimal', '']] : [['DimCustomer', 'dimension', 'Customer master by BCN'], ['FactARR', 'fact', 'Monthly ARR per end customer'], ['DimVendor', 'dimension', 'Vendor hierarchy'], ['FactSales', 'fact', 'Net sales by vendor']]).map(([a, b, d]) => `<div class="r-item"><div class="grow"><div class="t mono">${a}</div>${d ? `<div class="m">${d}</div>` : ''}</div><span class="chip">${b}</span></div>`).join('')}</div></section>`;
    status = 'Global Dashboard by CSM · snapshot 02 Sep 2026';
  }
  if (t === 'discovery') {
    actions = `<button class="btn" type="button" data-a="toast" data-v="Copied results">${ic('copy', 13)}Copy results</button><button class="btn primary" type="button" data-a="toast" data-v="Probing endpoints…">${ic('play', 13)}Run discovery</button>`;
    c = `<section class="panel"><div class="rows">${[['/v1.0/myorg/datasets/8f2c…a91e', 200, '{ "id": "8f2c…a91e", "name": "Global Dashboard by CSM", "isRefreshable": true }'], ['/v1.0/myorg/groups', 200, '{ "value": [ { "name": "Cloud BELUX" }, { "name": "Finance EMEA" } ] }'], ['/v1.0/myorg/datasets/8f2c…a91e/executeQueries', 403, '{ "error": { "code": "PowerBINotAuthorizedException" } }']].map(([p, s, j]) => `<div class="r-item" style="display:grid;gap:6px;align-items:start"><div class="row-flex"><span class="chip ${s < 300 ? 'pos' : 'neg'} num">${s}</span><span class="mono" style="font-weight:500">${p}</span></div><pre class="json selectable">${j}</pre></div>`).join('')}</div></section>`;
    status = '3 endpoints probed · 1 not authorised';
  }
  if (t === 'revsync') {
    actions = `<button class="btn primary" type="button" data-a="refresh">${ic('sync', 13)}Refresh now</button>`;
    c = `${strip([['Customers cached', '56', 'of 63 with a BCN'], ['Last refreshed', '08:00', '14 Oct 2026'], ['Duration', '6.4s', 'server-side aggregation'], ['Source', 'Power BI', 'Global Dashboard by CSM']])}
      <section class="panel"><div class="panel-h"><h2>Recent refreshes</h2></div><div class="tbl"><table><thead><tr><th>Status</th><th>When</th><th class="r">Customers</th><th class="r">Duration</th></tr></thead><tbody>${[['success', '14 Oct 2026 08:00', 56, '6.4s'], ['success', '14 Oct 2026 06:00', 56, '6.1s'], ['error', '13 Oct 2026 22:00', 0, '—'], ['success', '13 Oct 2026 20:00', 55, '7.0s']].map(([st, w, n, d]) => { const [i, k, l] = SYNC_ST[st]; return `<tr><td><span class="chip ${k}">${icI(i, 11)} ${l}</span></td><td class="num">${w}</td><td class="r num">${n}</td><td class="r num">${d}</td></tr>`; }).join('')}</tbody></table></div></section>`;
    status = 'Power BI revenue cache';
  }
  return { crumbs: ['Admin', ADMIN_TABS.find((x) => Array.isArray(x) && x[0] === t)[1]], bar: `<h1>Admin</h1>${tabs}<span class="grow"></span>${actions}`, body: `<div class="view-body" data-sk="adm-${t}"><div class="pad" style="max-width:${t === 'analytics' ? 1400 : 1120}px">${c}</div></div>`, status };
};
// ---------- Debug ----------
views.debug = () => {
  const t = state.debugTab; let c = '';
  if (t === 'synclogs') {
    const rows = [['13 Oct 17:02:11', 'error', 'Push Opportunities', 'Field im360_payeraccount is required at stage Qualified', 'OPP-24811 was not pushed. Fill in Payer Account on the deal and it is retried on the next sync.'], ['14 Oct 10:11:02', 'running', 'Dynamics 365', 'Full sync started', 'Pulling customers, contacts, activities, follow-ups and opportunities.'], ['14 Oct 09:41:30', 'success', 'Dynamics 365', '1,284 pulled · 3 pushed in 3.1s', ''], ['14 Oct 09:41:31', 'success', 'Push Activities', '2 pushed', ''], ['14 Oct 08:00:12', 'partial', 'Power BI Insights', 'Seat metrics missing for Luxembourg', 'Reseller and seat counts for LU were empty in the dataset.'], ['14 Oct 08:00:06', 'success', 'Power BI ARR', '63 pulled in 6.4s', ''], ['13 Oct 16:00:44', 'success', 'Power BI ARR Movement', '620 pulled', ''], ['09 Oct 10:41:09', 'error', 'Dynamics 365', 'Request throttled (429) after 3 retries', 'D365 rejected the request because of rate limits. The next scheduled sync succeeded.']];
    const k2 = { success: 'info', partial: 'warn', error: 'err', running: 'log' };
    const list = rows.map((r, i) => [...r, i]).filter((r) => (state.slLevel === 'all' || r[1] === state.slLevel) && (!state.slQ || (r[2] + r[3]).toLowerCase().includes(state.slQ.toLowerCase())));
    const cur = rows[state.slSel] || rows[0];
    return { crumbs: ['Debug', 'Sync Logs'], bar: `<h1>Debug</h1>${toolbarTabs([['console', 'Console'], ['synclogs', 'Sync Logs'], ['cache', 'Revenue Cache']], t, 'debugTab')}<span class="grow"></span><button class="btn" type="button" data-a="confirm" data-v="Delete sync records older than 90 days?" data-ok="Purge">${ic('trash', 13)}Purge old</button><button class="btn primary" type="button" data-a="runSync">${ic('sync', 13)}Force re-sync</button>`,
      body: `<div class="logview"><div class="log-tools"><div class="iw" style="flex:1;max-width:420px">${ic('search', 14)}<input class="in" id="slSearch" placeholder="Search sync logs…" value="${esc(state.slQ)}" aria-label="Search sync logs"></div><div class="seg" role="group" aria-label="Status">${[['all', 'All'], ['error', 'Errors'], ['partial', 'Partial'], ['success', 'Success']].map(([k, l]) => `<button type="button" data-a="slLevel" data-v="${k}" aria-pressed="${state.slLevel === k}">${k !== 'all' ? `<span class="lv-dot ${k2[k]}"></span>` : ''}${l} <span class="num" style="color:var(--faint)">${k === 'all' ? rows.length : rows.filter((r) => r[1] === k).length}</span></button>`).join('')}</div></div>
        <div class="log-table" data-sk="sl"><div class="log-row head"><span>Time</span><span>Status</span><span>Source</span><span>Message</span></div>${list.map(([ts, st, ty, msg, , i]) => `<div class="log-row ${k2[st]}" data-a="slSel" data-v="${i}" aria-selected="${state.slSel === i}"><span class="num">${ts}</span><span><span class="lv ${k2[st]}">${st.toUpperCase()}</span></span><span class="src">${ty}</span><span class="msg">${esc(msg)}</span></div>`).join('') || emptyS('sync', 'No sync logs', 'Nothing matches this search or status.')}</div>
        <div class="log-detail selectable"><div class="row-flex"><span class="lv ${k2[cur[1]]}">${cur[1].toUpperCase()}</span><span class="mono">${cur[0]}</span><span class="src mono">${cur[2]}</span><span class="grow"></span><button class="btn sm" type="button" data-a="toast" data-v="Copied log entry">${ic('copy', 12)}Copy</button></div><pre class="json">${esc(cur[3])}${cur[4] ? '\n' + esc(cur[4]) : ''}</pre></div></div>`,
      status: `${list.length} of ${rows.length} entries` };
  }
  if (t === 'console') {
    const lv = (l) => l === 'error' ? 'err' : l;
    const counts = { all: LOGS.length, info: LOGS.filter((l) => l[1] === 'info').length, warn: LOGS.filter((l) => l[1] === 'warn').length, error: LOGS.filter((l) => l[1] === 'error').length, log: LOGS.filter((l) => l[1] === 'log').length };
    const logs = LOGS.map((l, i) => [...l, i]).filter((l) => (state.logLevel === 'all' || l[1] === state.logLevel) && (!state.logQ || (l[2] + l[3]).toLowerCase().includes(state.logQ.toLowerCase()))).reverse();
    const sel = LOGS[state.logSel] || LOGS[LOGS.length - 1];
    return { crumbs: ['Debug', 'Console'], bar: `<h1>Debug</h1>${toolbarTabs([['console', 'Console'], ['synclogs', 'Sync Logs'], ['cache', 'Revenue Cache']], t, 'debugTab')}<span class="grow"></span><button class="btn" type="button" data-a="toast" data-v="Copied ${logs.length} entries">${ic('copy', 13)}Copy all</button><button class="btn" type="button" data-a="confirm" data-v="Clear all ${LOGS.length} log entries?" data-ok="Clear">${ic('trash', 13)}Clear</button>`,
      body: `<div class="logview"><div class="log-tools"><div class="iw" style="flex:1;max-width:420px">${ic('search', 14)}<input class="in" id="logSearch" placeholder="Search logs…" value="${esc(state.logQ)}" aria-label="Search logs"></div><div class="seg" role="group" aria-label="Level">${[['all', 'All'], ['error', 'Errors'], ['warn', 'Warnings'], ['info', 'Info'], ['log', 'Log']].map(([k, l]) => `<button type="button" data-a="logLevel" data-v="${k}" aria-pressed="${state.logLevel === k}">${k !== 'all' ? `<span class="lv-dot ${lv(k)}"></span>` : ''}${l} <span class="num" style="color:var(--faint)">${counts[k]}</span></button>`).join('')}</div></div>
        <div class="log-table" data-sk="logs"><div class="log-row head"><span>Time</span><span>Level</span><span>Source</span><span>Message</span></div>${logs.map(([ts, l, tag, msg, i]) => `<div class="log-row ${lv(l)}" data-a="logSel" data-v="${i}" aria-selected="${state.logSel === i}"><span class="num">${ts}</span><span><span class="lv ${lv(l)}">${l === 'error' ? 'ERROR' : l.toUpperCase()}</span></span><span class="src">${tag}</span><span class="msg">${esc(msg)}</span></div>`).join('') || emptyS('terminal', 'No log entries', 'Nothing matches this search or level.')}</div>
        <div class="log-detail selectable"><div class="row-flex"><span class="lv ${lv(sel[1])}">${sel[1] === 'error' ? 'ERROR' : sel[1].toUpperCase()}</span><span class="mono">${sel[0]}</span><span class="src mono">[${sel[2]}]</span><span class="grow"></span><button class="btn sm" type="button" data-a="toast" data-v="Copied log entry">${ic('copy', 12)}Copy</button></div><pre class="json">${esc(sel[3])}</pre></div></div>`,
      status: `${logs.length} of ${LOGS.length} entries · ${counts.error} errors · ${counts.warn} warnings` };
  }
  if (t === 'console') { const logs = LOGS.filter((l) => state.logLevel === 'all' || l[1] === state.logLevel); c = `<div class="h2row"><h2>Console</h2><span class="sub">${logs.length} entries${logs.length !== LOGS.length ? ` of ${LOGS.length} total` : ''}</span><button class="btn" type="button">${ic('trash', 13)}Clear</button></div>
    <div class="row-flex"><div class="iw" style="flex:1;max-width:320px">${ic('search', 14)}<input class="in" placeholder="Search logs…"></div>${sel([['all', 'All levels'], ['log', 'Log'], ['info', 'Info'], ['warn', 'Warn'], ['error', 'Error']], state.logLevel, 'id="logLevel"', 'sl w-auto')}</div>
    <div class="console selectable">${logs.slice().reverse().map(([ts, lv, tag, msg]) => `<div class="log ${lv === 'error' ? 'error' : lv === 'warn' ? 'warn' : ''}"><span class="sub">${ts}</span><span class="lv ${lv === 'error' ? 'err' : lv}">${lv === 'error' ? 'ERR' : lv.toUpperCase()}</span><span style="color:var(--accent-text)">[${tag}]</span><span>${esc(msg)}</span><button class="tb-btn" type="button" title="Copy log entry" style="width:22px;height:20px">${ic('copy', 11)}</button></div>`).join('')}</div>`; }
  if (t === 'synclogs') c = `<div class="h2row"><h2>Sync Administration</h2><button class="btn" type="button" data-a="runSync">${ic('sync', 13)}Force Re-sync</button></div>
    <div class="grid4">${mcard('Total Syncs', '', '2,841')}${mcard('Success Rate', '', '98.0%')}${mcard('Avg Duration', '', '3.2s')}${mcard('Records Processed', '', '1.8M')}</div>
    <div class="row-flex"><div class="sec-h" style="flex:1">Recent errors</div><span class="sub">3 errors</span></div>
    <div class="row-flex"><div class="iw" style="flex:1;max-width:300px">${ic('search', 14)}<input class="in" placeholder="Search error messages…"></div>${sel(['Date', 'Type', 'Error'], 'Date', '', 'sl w-auto')}<button class="tb-btn" type="button">${ic('arrowdown', 14)}</button><button class="btn" type="button">${ic('filter', 13)}Filters</button></div>
    <section class="panel"><div class="tbl"><table><thead><tr><th>Type</th><th>Error</th><th>Date</th></tr></thead><tbody>${[['Push Opportunities', 'Field im360_payeraccount is required at stage Qualified', '13 Oct 2026 17:02'], ['Dynamics 365', 'Request throttled (429) after 3 retries', '09 Oct 2026 10:41'], ['Power BI Insights', 'Seat metrics missing for Luxembourg', '14 Oct 2026 08:00']].map(([a, b, d]) => `<tr><td>${a} <span class="chip neg">error</span></td><td style="color:var(--neg);white-space:normal">${b}</td><td class="num">${d}</td></tr>`).join('')}</tbody></table></div></section>
    <div class="row-flex">Purge sync records older than ${numIn(90, 'days')}<button class="btn danger" type="button" data-a="toast" data-v="Purged 412 sync records.">Purge</button></div>`;
  if (t === 'cache') c = `<div class="h2row"><h2>Revenue Cache Transfer</h2></div><p class="sub" style="max-width:70ch">Export your locally cached Power BI revenue data to a file you can send to a colleague. On their machine, importing the file fills in the same ARR numbers without needing Power BI access.</p>
    <div class="row-flex"><button class="btn primary" type="button" data-a="export">${ic('download', 13)}Export to file</button><button class="btn" type="button" data-a="toast" data-v="Imported 56 customers">${ic('upload', 13)}Import from file</button></div><div class="row-flex sub">${ic('db', 13)}56 customers cached · last refreshed 14 Oct 2026, 08:00</div>
    <div class="warnbox">${ic('alert', 15)}<span>Importing replaces the existing revenue cache. Your colleague's Refresh button stays available — running it will overwrite the imported data with fresh Power BI numbers.</span></div>`;
  return { crumbs: ['Debug', { console: 'Console', synclogs: 'Sync Logs', cache: 'Revenue Cache' }[t]], bar: `<h1>Debug</h1>${toolbarTabs([['console', 'Console'], ['synclogs', 'Sync Logs'], ['cache', 'Revenue Cache']], t, 'debugTab')}<span class="grow"></span>`, body: tabbedBody(c, 'dbg-' + t), status: `${LOGS.length} log entries captured` };
};

// ---------- Help ----------
const HELP = {
  home: ['Home', 'home', [['At the top', 'A greeting, Quick add for activities, follow-ups and opportunities, and a search box that looks through everything at once.'], ['The main row', 'A map of your customers in Belgium, four key numbers, your latest activity and opportunities that have gone quiet.'], ['Next 7 days', 'Your follow-ups for the coming week, one column per day.'], ['Tips', 'Press / to jump straight into search. Click a city on the map to see its customers.']]],
  'getting-started': ['Getting Started', 'rocket', [['First Launch', 'Sign in with your Microsoft account. The first sync downloads your customers from Dynamics 365 and takes around five minutes.'], ['Navigating the App', 'Use the menu on the left: Home, Customers, Pipeline, Activity and Reports. The status bar at the bottom always shows whether you are online and synced.'], ['Quick Actions', 'Press Ctrl+K to search or jump anywhere. Right-click a customer, deal or task to see what you can do with it.'], ['User Menu', 'Click your initials in the top-right corner for your profile, settings, shortcuts and help.'], ['Working Offline', 'You can keep working without a connection. Changes are saved on your device and sent to Dynamics 365 when you are back online.']]],
  customers: ['Customers', 'users', [['Viewing Your Customers', 'The list sits on the left; the selected customer opens on the right, so you can move between customers without going back.'], ['Health Score', 'Each customer gets a score from 0 to 100 based on how recently you were in touch, open opportunities and how often you talk. 70 and up is healthy, below 40 is critical.'], ['Filtering', 'Use Filters to narrow by owner, industry, city, health and more. Choose whether customers must match all filters or any of them.'], ['Bookmarking Favorites', 'Click the bookmark on a customer to pin it in the menu on the left.']]],
  activities: ['Activities', 'calendar', [['Activity Types', 'Meetings, visits, calls and notes.'], ['Logging a New Activity', 'Open a customer and click Add Activity, or use Quick add on Home.'], ['Kanban Board', 'Drag open meetings, visits and calls to Completed or Cancelled when they are done.']]],
  'follow-ups': ['Follow-Ups', 'checksq', [['Creating a Follow-Up', 'Click Add Follow-Up on a customer, give it a title and a due date.'], ['Completing a Follow-Up', 'Tick the box next to it and confirm.'], ['Overdue Alerts', 'Overdue follow-ups show in red and are counted on the Activity menu item.']]],
  contacts: ['Contacts', 'user', [['Viewing Contacts', 'Open a customer and choose the Contacts tab.'], ['Primary Contact', 'Click the star on a contact to make them the main person for that customer.']]],
  opportunities: ['Opportunities', 'target', [['Viewing Opportunities', 'Pipeline shows every deal as a list or as a board grouped by stage.'], ['Creating an Opportunity', 'Click Add Opportunity. The form tells you which fields are still needed before you can save.'], ['Closing a Deal', 'Open the deal and choose Close as Won or Close as Lost, then pick a reason.'], ['Stale Opportunities', 'Deals with no update in 30 days get a Stale label.']]],
  'revenue-overview': ['Revenue Overview', 'bar', [['What You\'ll See', 'Every customer with their contact details, whether they use cloud services, and their yearly recurring revenue.'], ['Exporting to Excel', 'Click Export to Excel to save the current view.']]],
  analytics: ['Analytics', 'reports', [['My Performance', 'Your own activity, follow-up completion, pipeline and win rate.'], ['Pipeline & Forecast', 'Deals per stage and the revenue you can expect each month.'], ['Customer Health', 'Which customers have gone quiet and how revenue is spread.'], ['Activity Patterns', 'How you work compared with the team.']]],
  sync: ['Sync', 'sync', [['How Sync Works', 'Your data is copied from Dynamics 365 to your device and your changes are sent back.'], ['Sync Status', 'The status bar shows the last sync. Click it to open the Sync page.'], ['Pending Items', 'Changes waiting to be sent show a Pending label until they reach Dynamics 365.']]],
  settings: ['Settings', 'settings', [['Appearance', 'Choose light or dark mode, an accent colour and how compact the app looks.'], ['Notifications', 'Decide which reminders you get when the app starts.']]],
  timeline: ['Timeline', 'clock', [['What\'s in the Timeline', 'Activity → Timeline shows activities, follow-ups and opportunities across all customers, newest first.']]],
  shortcuts: ['Keyboard Shortcuts', 'keyboard', [['Command Palette', 'Press Ctrl+K anywhere to search customers and contacts or run a command.'], ['Customizing Shortcuts', 'Go to Settings → Keybindings and click the pencil next to any shortcut.']]],
};
views.help = () => {
  const [title, , secs] = HELP[state.helpTab];
  const c = `<article class="doc selectable"><h1>${title}</h1>${secs.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}</article>`;
  return { crumbs: ['Help', title], bar: `<h1>Help</h1><span class="grow"></span>`, body: subLayout(Object.entries(HELP).map(([k, [l, i]]) => [k, l, i]), state.helpTab, 'helpTab', c, 'help', true), status: 'Help' };
};

// ---------- Loading states ----------
const sk = (w, h = 10, r) => `<span class="skel" style="width:${w};height:${h}px${r ? `;border-radius:${r}` : ''}"></span>`;
const skelRows = (n = 8) => Array.from({ length: n }, (_, i) => `<div class="sk-row" style="--i:${i}">${sk('28px', 28, '50%')}<span class="sk-lines">${sk(`${58 + ((i * 17) % 30)}%`, 11)}${sk(`${30 + ((i * 11) % 25)}%`, 9)}</span>${sk('36px', 9)}</div>`).join('');
const skelPanel = (rows = 4, chart) => `<section class="panel"><div class="panel-h">${sk('120px', 12)}</div><div class="panel-b sk-pb">${chart ? sk('100%', 150, '4px') : Array.from({ length: rows }, (_, i) => `<div class="sk-line">${sk('22px', 22, '50%')}${sk(`${50 + ((i * 13) % 35)}%`, 10)}</div>`).join('')}</div></section>`;
const skelStrip = (n = 4) => `<div class="sk-strip">${Array.from({ length: n }, () => `<div>${sk('60%', 9)}${sk('45%', 18)}${sk('70%', 8)}</div>`).join('')}</div>`;
const skelRecord = () => `<div class="rec-head sk-head">${sk('40px', 40, '8px')}<span class="sk-lines">${sk('240px', 16)}${sk('180px', 10)}</span></div><div class="tabs sk-tabs">${['64px', '70px', '62px', '72px', '88px', '58px', '52px'].map((w) => sk(w, 10)).join('')}</div><div class="rec-body"><div class="pad">${skelStrip(5)}${skelPanel(5)}</div></div>`;
const skelPage = () => `<div class="view-body"><div class="pad" style="max-width:1400px">${skelStrip(4)}<div class="grid2">${skelPanel(0, true)}${skelPanel(0, true)}</div><div class="grid2">${skelPanel(5)}${skelPanel(5)}</div></div></div>`;
const missingRecord = () => `<div class="center-state miss">${emptyS('users', 'Customer not found', 'It may have been removed in Dynamics 365, or it isn\'t synced to this device yet.')}<div class="row-flex" style="justify-content:center"><button class="btn" type="button" data-a="custBack">${ic('arrowl', 13)}Back to customers</button><button class="btn primary" type="button" data-a="runSync">${ic('sync', 13)}Run sync</button></div></div>`;
