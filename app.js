/* Item Master Creation App - screens (vanilla JavaScript). No keys or data live here. */
(function () {
  'use strict';

  const API = (function () {
    try { const o = localStorage.getItem('im_api'); if (o) return o; } catch (e) { /* ignore */ }
    return /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:8788' : 'https://itemmaster-api.candb-otto.workers.dev';
  })();

  // ------------------------------------------------------------ icons (24px line icons)
  const P = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.6"/>',
    truck: '<path d="M2 6h11v10H2zM13 9.5h4.5L21 13v3h-8"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.7 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
    shirt: '<path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3c-.6 1.8-2.2 3-4 3S8.6 4.8 8 3z"/>',
    ruler: '<path d="m3 16.5 13.5-13.5 4.5 4.5L7.5 21z"/><path d="m7 12.5 2 2M10 9.5l2 2M13 6.5l2 2"/>',
    coins: '<ellipse cx="9" cy="6.5" rx="6" ry="3"/><path d="M3 6.5v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/><path d="M9 16.5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="m10.5 12.5 9-9M16 6l3 3M14 8l2 2"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.8 0 3.4-.5 4.7-1.3"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    login: '<path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    logout: '<path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L3 9"/><path d="M3 4v5h5M4 13a8 8 0 0 0 14.6 4.5L21 15"/><path d="M21 20v-5h-5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M14 10l2 2-2 2"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.5M12 17.5v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.01"/>',
    filePlus: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/>',
    scroll: '<path d="M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 1-2-2v-1h4"/><path d="M7 4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h11a2 2 0 0 0 2-2V7"/><path d="M11 9h5M11 13h5"/>',
    inbox: '<path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',
    checkSquare: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
    barcode: '<path d="M4 5v14M7 5v14M10.5 5v14M13 5v14M16.5 5v14M20 5v14"/>',
    database: '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    loader: '<path d="M12 3a9 9 0 1 0 9 9"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 9v12"/>',
  };
  const icon = (n, cls) => '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.info) + '</svg>';
  function hydrate(root) { (root || document).querySelectorAll('[data-icon]').forEach(el => { if (!el.firstElementChild) el.innerHTML = icon(el.dataset.icon); }); }

  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const splitIds = v => Array.isArray(v) ? v : String(v || '').split(',').map(s => s.trim()).filter(Boolean);

  const S = { token: store.get('im_token'), user: null, schema: null, order: [], data: {}, problems: [], lists: {}, route: '' };

  // ------------------------------------------------------------ API
  async function api(path, body) {
    let r;
    try {
      r = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ 'Content-Type': 'application/json' }, S.token ? { Authorization: 'Bearer ' + S.token } : {}), body: body ? JSON.stringify(body) : undefined });
    } catch (e) { throw new Error('Cannot reach the server. Check your internet connection and try again.'); }
    const j = await r.json().catch(() => ({ ok: false, error: 'Unexpected reply from the server (' + r.status + ').' }));
    if (r.status === 401 && path !== '/api/login' && path !== '/api/password') { logout(j.error); throw new Error(j.error); }
    if (j.code === 'MUST_CHANGE') { showPwForm(true); throw new Error(j.error); }
    if (!j.ok) throw new Error(j.error || 'Something went wrong.');
    return j;
  }

  // ------------------------------------------------------------ toast + dialog
  function toast(msg, err) {
    const t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : '');
    t.innerHTML = icon(err ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(t); setTimeout(() => t.remove(), err ? 6000 : 3200);
  }
  function dialog(html, onOpen) {
    const w = $('#dialogWrap'), d = $('#dialog');
    d.innerHTML = html; hydrate(d); w.hidden = false;
    const close = () => { w.hidden = true; d.innerHTML = ''; };
    d.querySelectorAll('[data-dclose]').forEach(b => b.addEventListener('click', close));
    if (onOpen) onOpen(d, close);
    const f = d.querySelector('input,button'); if (f) f.focus();
    return close;
  }

  // ------------------------------------------------------------ login screens
  function showAuth() { $('#app').hidden = true; $('#auth').hidden = false; }
  function showLogin(msg) {
    showAuth(); $('#pwForm').hidden = true; $('#loginForm').hidden = false;
    const e = $('#loginError'); e.hidden = !msg; e.textContent = msg || '';
    setTimeout(() => $('#loginForm [name=username]').focus(), 30);
  }
  function showPwForm(forced) {
    showAuth(); $('#loginForm').hidden = true; $('#pwForm').hidden = false; $('#pwForm').reset(); $('#pwError').hidden = true;
    $('#pwIntro').textContent = forced ? 'Your password was set by an admin. Please choose your own password before you continue.' : 'Choose a new password.';
  }
  function logout(msg) {
    S.token = null; S.user = null; store.set('im_token', null);
    showLogin(msg && !/log in\.?$/i.test(msg) ? msg : '');
  }

  $('#loginForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const f = ev.target, b = f.querySelector('[type=submit]'), err = $('#loginError');
    err.hidden = true;
    if (!f.username.value.trim() || !f.password.value) { err.textContent = 'Please enter your username and password.'; err.hidden = false; return; }
    b.disabled = true; b.innerHTML = icon('loader', 'spin-i') + 'Signing in...';
    try {
      const r = await api('/api/login', { username: f.username.value, password: f.password.value });
      S.token = r.token; store.set('im_token', r.token); S.user = r.user; f.password.value = '';
      if (r.user.MustChangePassword) { showPwForm(true); $('#pwForm [name=oldPassword]').focus(); }
      else await startApp();
    } catch (e) { err.textContent = e.message; err.hidden = false; }
    finally { b.disabled = false; b.innerHTML = icon('login') + 'Sign in'; }
  });
  $('#pwForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const f = ev.target, err = $('#pwError'), b = f.querySelector('[type=submit]');
    err.hidden = true;
    const msg = pwCheck(f.oldPassword.value, f.newPassword.value, f.confirm.value);
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    b.disabled = true;
    try {
      const r = await api('/api/password', { oldPassword: f.oldPassword.value, newPassword: f.newPassword.value });
      S.token = r.token; store.set('im_token', r.token); S.user = r.user;
      toast('Password saved.'); await startApp();
    } catch (e) { err.textContent = e.message; err.hidden = false; }
    finally { b.disabled = false; }
  });
  function pwCheck(o, n, c) {
    if (!o || !n) return 'Please fill in all the fields.';
    if (n.length < 8) return 'The new password must have at least 8 characters.';
    if (n !== c) return 'The two new passwords do not match.';
    return '';
  }
  document.querySelectorAll('[data-eye]').forEach(btn => btn.addEventListener('click', () => {
    const inp = btn.parentElement.querySelector('input'), show = inp.type === 'password';
    inp.type = show ? 'text' : 'password'; btn.innerHTML = icon(show ? 'eyeOff' : 'eye'); btn.title = show ? 'Hide password' : 'Show password';
  }));
  document.addEventListener('click', ev => { if (ev.target.closest('[data-logout]')) { closeMenu(); logout(); } });

  // ------------------------------------------------------------ app start
  async function startApp() {
    $('#auth').hidden = true; $('#app').hidden = false;
    $('#content').innerHTML = '<div class="loading">' + icon('loader') + 'Loading...</div>';
    try { await loadData(); }
    catch (e) { $('#content').innerHTML = '<div class="card empty">' + icon('alert') + '<p>' + esc(e.message) + '</p><button class="btn" id="retry">' + icon('refresh') + 'Try again</button></div>'; const r = $('#retry'); if (r) r.onclick = startApp; return; }
    const u = S.user, initials = (u.FullName || u.Username).split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    $('#avatar').textContent = initials; $('#userName').textContent = u.FullName || u.Username;
    $('#menuName').textContent = u.FullName || u.Username; $('#menuRole').textContent = u.Role + ' · ' + u.Username;
    buildNav(); route();
  }
  async function loadData(fresh) {
    const r = await api('/api/data' + (fresh ? '?fresh=1' : ''));
    S.user = r.user; S.schema = r.schema; S.order = r.order; S.data = r.data; S.problems = r.problems || [];
    const b = $('#banner');
    b.hidden = !S.problems.length;
    b.innerHTML = S.problems.length ? icon('alert') + '<div><strong>Please check the Google Sheet:</strong><br>' + S.problems.map(esc).join('<br>') + '</div>' : '';
  }
  const isAdmin = () => S.user && S.user.Role === 'Admin';

  // ------------------------------------------------------------ navigation
  const SOON = {
    fg: { label: 'FG Entry', icon: 'filePlus', phase: 'Phase 2', text: 'Create Finished Goods designs: season, supplier and category pick, auto design number, colours, fits, size range, MRP to WSP with rounding, item description and the duplicate check.' },
    fabric: { label: 'Fabric Entry', icon: 'scroll', phase: 'Phase 3', text: 'Create fabric designs with colours, metres and width, and a "Create FG" button on each approved line.' },
    requests: { label: 'My Requests', icon: 'inbox', phase: 'Phase 2', text: 'See your pending, approved and rejected requests, and edit pending or rejected ones.' },
    approvals: { label: 'Approvals', icon: 'checkSquare', phase: 'Phase 4', text: 'Download pending requests to Excel, mark Yes / No, and upload them back. Approved requests are expanded into item lines.' },
    erp: { label: 'ERP Export & Codes', icon: 'barcode', phase: 'Phase 5', text: 'Export approved items in the ERP bulk upload format and upload the ERP item codes back. Waiting for the ERP template from the client.' },
    search: { label: 'Item Search', icon: 'search', phase: 'Phase 6', text: 'Search active and archived items, and download a season.' },
  };
  function navModel() {
    const m = [{ items: [{ href: '#/home', label: 'Home', icon: 'home' }] },
      { group: 'Item entry', items: ['fg', 'fabric', 'requests', 'approvals'].map(k => ({ href: '#/soon/' + k, label: SOON[k].label, icon: SOON[k].icon, soon: true })) },
      { group: 'ERP', items: ['erp', 'search'].map(k => ({ href: '#/soon/' + k, label: SOON[k].label, icon: SOON[k].icon, soon: true })) }];
    if (isAdmin()) ['Masters', 'Settings', 'Admin'].forEach(g => m.push({ group: g, items: S.order.filter(t => S.schema[t].group === g).map(t => ({ href: '#/m/' + t, label: S.schema[t].title, icon: S.schema[t].icon })) }));
    return m;
  }
  function buildNav() {
    const nav = $('#sideNav');
    nav.innerHTML = navModel().map(g => (g.group ? '<div class="nav-group">' + esc(g.group) + '</div>' : '') + g.items.map(i =>
      '<a class="nav-btn' + (i.soon ? ' soon' : '') + '" href="' + i.href + '" title="' + esc(i.label) + '">' + icon(i.icon) + '<span class="nav-label">' + esc(i.label) + '</span>' + (i.soon ? '<span class="nav-soon">Soon</span>' : '') + '</a>').join('')).join('');
    nav.querySelectorAll('a').forEach(a => a.style.textDecoration = 'none');
  }
  function markNav() { document.querySelectorAll('#sideNav .nav-btn').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#/' + S.route.split('/').slice(0, 2).join('/'))); }
  function setSide(open) {
    $('#app').classList.toggle('side-open', open); store.set('im_side', open ? '1' : '0');
    $('#sideToggle').title = open ? 'Collapse menu' : 'Expand menu';
    $('#sideToggle .nav-label').textContent = open ? 'Collapse menu' : 'Expand menu';
  }
  setSide(store.get('im_side') === '1');
  $('#sideToggle').addEventListener('click', () => setSide(!$('#app').classList.contains('side-open')));
  $('#mobileMenu').addEventListener('click', () => { $('#app').classList.add('mobile-open'); $('#scrim').hidden = false; });
  $('#scrim').addEventListener('click', closeMobile);
  function closeMobile() { $('#app').classList.remove('mobile-open'); $('#scrim').hidden = true; }
  $('#refreshBtn').addEventListener('click', async () => {
    const b = $('#refreshBtn'); b.classList.add('spin'); b.disabled = true;
    try { await loadData(isAdmin()); route(); toast('Reloaded from the Google Sheet.'); } catch (e) { toast(e.message, true); }
    finally { b.classList.remove('spin'); b.disabled = false; }
  });
  $('#userBtn').addEventListener('click', ev => { ev.stopPropagation(); $('#userMenu').hidden = !$('#userMenu').hidden; });
  function closeMenu() { $('#userMenu').hidden = true; }
  document.addEventListener('click', ev => { if (!ev.target.closest('.user-menu')) closeMenu(); });
  $('[data-action=changePw]').addEventListener('click', () => { closeMenu(); changePwDialog(); });

  window.addEventListener('hashchange', route);
  function route() {
    if (!S.user || !S.schema) return;
    closeMobile();
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    S.route = h;
    const [a, b] = h.split('/');
    if (a === 'm' && S.schema[b] && isAdmin()) renderList(b);
    else if (a === 'soon' && SOON[b]) renderSoon(b);
    else { S.route = 'home'; renderHome(); }
    markNav();
    $('#content').scrollTop = 0; window.scrollTo(0, 0);
  }
  function setTitle(t, crumb) { $('#pageTitle').textContent = t; $('#crumb').textContent = crumb || ''; document.title = t + ' | Item Master'; }

  // ------------------------------------------------------------ labels
  function labelOf(tab, id) {
    const def = S.schema[tab]; if (!def) return id;
    const idk = def.cols.find(c => c.t === 'id').k;
    const r = (S.data[tab] || []).find(x => x[idk] === id);
    if (!r) return id;
    if (tab === 'Categories') return r.Brand + ' - ' + r.Category;
    if (tab === 'Users') return r.FullName;
    const c = def.cols.find(c => c.t === 'text' || c.t === 'code');
    return String(r[c.k]);
  }
  function chipsHtml(tab, ids, max) {
    ids = splitIds(ids); max = max || 3;
    if (!ids.length) return '<span class="muted">-</span>';
    return '<div class="chips">' + ids.slice(0, max).map(id => '<span class="chip">' + esc(labelOf(tab, id)) + '</span>').join('') + (ids.length > max ? '<span class="chip more">+' + (ids.length - max) + '</span>' : '') + '</div>';
  }

  // ------------------------------------------------------------ pages
  function renderHome() {
    setTitle('Home');
    const u = S.user, d = S.data;
    const cats = isAdmin() ? '<span class="chip">All categories (admin)</span>' : (u.Categories.length ? u.Categories.map(id => '<span class="chip">' + esc(labelOf('Categories', id)) + '</span>').join('') : '<span class="chip">No categories assigned yet - ask your admin</span>');
    const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const active = t => (d[t] || []).filter(r => r.Active !== 'No').length;
    const tiles = ['Seasons', 'Categories', 'Suppliers', 'FabricTypes', 'Colours', 'Fits', 'Sizes'].concat(isAdmin() ? ['Users'] : [])
      .map(t => '<button class="tile" data-go="' + (isAdmin() ? '#/m/' + t : '') + '"><span class="tile-ico">' + icon(S.schema[t].icon) + '</span><span><b>' + active(t) + '</b><span>' + esc(S.schema[t].title) + '</span></span></button>').join('');
    let side = '';
    if (isAdmin()) {
      const merch = (d.Users || []).filter(r => r.Role === 'Merchandiser' && r.Active !== 'No').length;
      const mapped = t => (d[t] || []).some(r => splitIds(r.Categories).length);
      const steps = [
        ['Seasons', active('Seasons') > 0, 'Add the current season with its 2-letter code', '#/m/Seasons'],
        ['Categories', active('Categories') > 0, 'Brand, category, code, margin %, HSN', '#/m/Categories'],
        ['Colours, fits and sizes', mapped('Colours') && mapped('Fits') && mapped('Sizes'), 'Map each one to its categories', '#/m/Sizes'],
        ['Category defaults', (d.Categories || []).some(r => splitIds(r.DefaultSizes).length), 'Default fits, sizes and big sizes per category', '#/m/Categories'],
        ['Suppliers', active('Suppliers') > 0, 'Name, 1-3 letter prefix and categories', '#/m/Suppliers'],
        ['WSP rounding table', (d.WSPRounding || []).length > 1, 'Placeholder is "nearest ₹5" until the client shares the table', '#/m/WSPRounding'],
        ['Merchandiser logins', merch > 0, 'Create users and assign their categories', '#/m/Users'],
      ];
      side = '<div class="card card-pad"><h3 class="section-title">Setup checklist</h3><div class="steps">' + steps.map(s =>
        '<a class="step' + (s[1] ? ' done' : '') + '" href="' + s[3] + '" style="color:inherit;text-decoration:none"><span class="step-dot">' + icon(s[1] ? 'check' : 'chevronRight') + '</span><div><strong>' + esc(s[0]) + '</strong><small>' + esc(s[2]) + '</small></div></a>').join('') + '</div></div>';
    }
    const road = '<div class="card card-pad"><h3 class="section-title">What is coming</h3><ul class="roadmap">' +
      ['Phase 1 - Login, masters, settings and users (this version)', 'Phase 2 - FG entry and My Requests', 'Phase 3 - Fabric entry and "Create FG"', 'Phase 4 - Excel approval and notifications', 'Phase 5 - ERP export and ERP code mapping', 'Phase 6 - Nightly archive and item search']
        .map((t, i) => '<li>' + (i === 0 ? '<strong>' + esc(t) + '</strong>' : esc(t)) + '</li>').join('') + '</ul></div>';
    $('#content').innerHTML =
      '<div class="card hero"><div><h2>' + greet + ', ' + esc((u.FullName || u.Username).split(' ')[0]) + '</h2><p>' + (isAdmin() ? 'Set up the masters below, then merchandisers can start creating items.' : 'Your item entry screens are being built. Your categories:') + '</p><div class="chips">' + cats + '</div></div></div>' +
      '<div class="tiles">' + tiles + '</div>' +
      '<div class="grid-2">' + (side || road) + (side ? road : '') + '</div>';
    $('#content').querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { if (b.dataset.go) location.hash = b.dataset.go; }));
  }

  function renderSoon(k) {
    const s = SOON[k]; setTitle(s.label, s.phase);
    $('#content').innerHTML = '<div class="card empty" style="padding:64px 24px"><div class="tile-ico" style="margin:0 auto 14px;width:56px;height:56px">' + icon(s.icon) + '</div><h2 style="margin:0 0 8px">' + esc(s.label) + '</h2><p style="max-width:520px;margin:0 auto 6px;line-height:1.6">' + esc(s.text) + '</p><p><span class="chip">Coming in ' + esc(s.phase) + '</span></p></div>';
  }

  // ------------------------------------------------------------ list page
  function renderList(tab) {
    const def = S.schema[tab];
    setTitle(def.title, def.group);
    const st = S.lists[tab] = S.lists[tab] || { q: '', status: 'All', cat: '', page: 1 };
    const hasCats = def.cols.some(c => c.k === 'Categories');
    const hasActive = def.cols.some(c => c.k === 'Active');
    const catOpts = (S.data.Categories || []).map(c => '<option value="' + esc(c.CategoryID) + '"' + (st.cat === c.CategoryID ? ' selected' : '') + '>' + esc(c.Brand + ' - ' + c.Category) + '</option>').join('');
    $('#content').innerHTML = '<div class="card">' +
      '<div class="toolbar">' +
      '<div class="search input-icon">' + icon('search') + '<input id="q" placeholder="Search ' + esc(def.title.toLowerCase()) + '" value="' + esc(st.q) + '"></div>' +
      (hasActive ? '<select id="fStatus" title="Status">' + ['All', 'Active', 'Inactive'].map(o => '<option' + (st.status === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>' : '') +
      (hasCats ? '<select id="fCat" title="Category"><option value="">All categories</option>' + catOpts + '</select>' : '') +
      '<span class="grow"></span>' +
      (def.keyed ? '' : '<button class="btn btn-primary" id="addBtn">' + icon('plus') + 'Add ' + esc(singular(def.title)) + '</button>') +
      '</div><div id="listBody"></div></div>';
    const q = $('#q');
    q.addEventListener('input', () => { st.q = q.value; st.page = 1; drawRows(tab); });
    if (hasActive) $('#fStatus').addEventListener('change', e => { st.status = e.target.value; st.page = 1; drawRows(tab); });
    if (hasCats) $('#fCat').addEventListener('change', e => { st.cat = e.target.value; st.page = 1; drawRows(tab); });
    if (!def.keyed) $('#addBtn').addEventListener('click', () => openEditor(tab, null));
    drawRows(tab);
  }
  function singular(t) { return t.replace(/ies$/, 'y').replace(/(Seasons|Suppliers|Types|Colours|Fits|Sizes|Users)$/, m => m.slice(0, -1)).replace(/ Rounding$/, ' rounding rule').toLowerCase(); }

  function drawRows(tab) {
    const def = S.schema[tab], st = S.lists[tab];
    const idk = (def.cols.find(c => c.t === 'id') || {}).k;
    const show = def.keyed ? ['Key', 'Value', 'Note'] : (idk ? [idk] : []).concat(def.show);
    const colOf = k => def.cols.find(c => c.k === k) || { k: k, t: 'text', label: k === 'LastLoginAt' ? 'Last login' : k };
    let rows = (S.data[tab] || []).slice();
    if (st.status === 'Active') rows = rows.filter(r => r.Active !== 'No');
    if (st.status === 'Inactive') rows = rows.filter(r => r.Active === 'No');
    if (st.cat) rows = rows.filter(r => splitIds(r.Categories).includes(st.cat));
    if (st.q.trim()) {
      const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      rows = rows.filter(r => { const hay = show.map(k => colOf(k).t === 'refs' ? splitIds(r[k]).map(id => labelOf(colOf(k).ref, id)).join(' ') : r[k]).join(' ').toLowerCase(); return words.every(w => hay.includes(w)); });
    }
    if (def.sort) rows.sort((a, b) => (Number(a[def.sort]) || 0) - (Number(b[def.sort]) || 0));
    const per = 10, pages = Math.max(1, Math.ceil(rows.length / per));
    st.page = Math.min(st.page, pages);
    const pageRows = rows.slice((st.page - 1) * per, st.page * per);
    const head = show.map(k => { const c = colOf(k); return '<th class="' + (c.t === 'num' || c.t === 'int' ? 'num' : '') + '">' + esc(c.t === 'id' ? 'ID' : (c.label || k).replace(/ \(.*\)$/, '')) + '</th>'; }).join('');
    const body = pageRows.map(r => '<tr data-id="' + esc(def.keyed ? r.Key : r[idk]) + '">' + show.map(k => cell(colOf(k), r[k], r, tab)).join('') + '</tr>').join('');
    const total = (S.data[tab] || []).length;
    $('#listBody').innerHTML = rows.length
      ? '<div class="table-wrap"><table class="grid"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>' + pager(st.page, pages, rows.length, total)
      : '<div class="empty">' + icon(total ? 'search' : 'database') + '<p>' + (total ? 'Nothing matches your search or filters.' : 'No ' + esc(def.title.toLowerCase()) + ' yet. Click "Add" to create the first one.') + '</p></div>';
    $('#listBody').querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', () => {
      const row = (S.data[tab] || []).find(r => (def.keyed ? r.Key : r[idk]) === tr.dataset.id);
      if (row) openEditor(tab, row);
    }));
    $('#listBody').querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { st.page = Number(b.dataset.page); drawRows(tab); }));
  }
  function cell(c, v, r, tab) {
    if (c.t === 'id') return '<td class="id-cell">' + esc(v) + '</td>';
    if (c.t === 'refs') return '<td>' + chipsHtml(c.ref, v) + '</td>';
    if (c.t === 'bool') return '<td><span class="pill ' + (v === 'No' ? 'no">Inactive' : 'yes">Active') + '</span></td>';
    if (c.t === 'code') return '<td class="code-cell">' + esc(v) + '</td>';
    if (c.t === 'num' || c.t === 'int') return '<td class="num">' + esc(v === '' ? '-' : Number(v).toLocaleString('en-IN')) + '</td>';
    if (c.k === 'Role') return '<td><span class="pill ' + (v === 'Admin' ? 'admin' : 'no') + '">' + esc(v) + '</span></td>';
    if (tab === 'Settings' && c.k === 'Note') return '<td class="muted" style="max-width:420px">' + esc(v) + '</td>';
    if (tab === 'Settings' && c.k === 'Value') return '<td><strong>' + esc(v) + '</strong></td>';
    return '<td>' + esc(v === '' ? '-' : v) + '</td>';
  }
  function pager(page, pages, count, total) {
    const nums = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '...') nums.push('...');
    return '<div class="pager"><span class="info">Page ' + page + ' of ' + pages + ' · ' + count + ' record' + (count === 1 ? '' : 's') + (count !== total ? ' (of ' + total + ')' : '') + '</span>' +
      '<button data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' title="Previous">' + icon('chevronLeft') + '</button>' +
      nums.map(n => n === '...' ? '<span class="gap">...</span>' : '<button data-page="' + n + '" class="' + (n === page ? 'on' : '') + '">' + n + '</button>').join('') +
      '<button data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' title="Next">' + icon('chevronRight') + '</button></div>';
  }

  // ------------------------------------------------------------ editor drawer
  let closeDrawer = () => {};
  function openEditor(tab, row) {
    const def = S.schema[tab], isNew = !row;
    const idc = def.cols.find(c => c.t === 'id');
    const val = {};
    def.cols.forEach(c => { if (c.t !== 'audit') val[c.k] = row ? row[c.k] : (c.def !== undefined ? c.def : (c.t === 'refs' ? '' : '')); });
    if (isNew && def.cols.some(c => c.k === 'Categories') && S.lists[tab] && S.lists[tab].cat) val.Categories = S.lists[tab].cat;
    $('#drawerKicker').textContent = def.title + (row && idc ? ' · ' + row[idc.k] : '');
    $('#drawerTitle').textContent = isNew ? 'Add ' + singular(def.title) : (def.keyed ? row.Key : 'Edit ' + singular(def.title));
    const form = $('#drawerForm'); form.innerHTML = '';
    const fields = def.keyed ? [{ k: 'Value', t: 'text', label: 'Value', hint: row.Note }] : def.cols.filter(c => !['id', 'audit', 'hidden'].includes(c.t));
    fields.forEach(c => form.appendChild(fieldEl(tab, c, val, row)));
    if (row && !def.keyed) {
      const a = document.createElement('div'); a.className = 'audit';
      a.innerHTML = (row.CreatedAt ? '<span>Created by ' + esc(row.CreatedBy) + ' on ' + esc(row.CreatedAt) + '</span>' : '') + (row.UpdatedAt ? '<span>Last changed by ' + esc(row.UpdatedBy) + ' on ' + esc(row.UpdatedAt) + '</span>' : '') + (row.LastLoginAt ? '<span>Last login ' + esc(row.LastLoginAt) + '</span>' : '');
      form.appendChild(a);
    }
    const err = document.createElement('div'); err.className = 'form-error'; err.hidden = true; form.appendChild(err);
    const foot = $('#drawerFoot');
    foot.innerHTML = (tab === 'Users' && row ? '<button class="btn btn-ghost" type="button" id="resetPw">' + icon('key') + 'Reset password</button>' : '') +
      '<span class="grow"></span><button class="btn" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" id="saveBtn">' + icon('check') + (isNew ? 'Add' : 'Save') + '</button>';
    const wrap = $('#drawerWrap'); wrap.hidden = false; hydrate(wrap);
    closeDrawer = () => { wrap.hidden = true; form.innerHTML = ''; };
    wrap.querySelectorAll('[data-close]').forEach(b => b.onclick = closeDrawer);
    form.onsubmit = e => { e.preventDefault(); save(); };
    $('#saveBtn').onclick = save;
    const rp = $('#resetPw'); if (rp) rp.onclick = () => resetPassword(row);
    const first = form.querySelector('input:not([type=checkbox]):not([readonly])'); if (first) setTimeout(() => first.focus(), 60);

    async function save() {
      err.hidden = true;
      const missing = fields.filter(c => c.req && (c.t === 'refs' ? !splitIds(val[c.k]).length : String(val[c.k] === undefined ? '' : val[c.k]).trim() === '')).map(c => c.label || c.k);
      if (missing.length) { err.textContent = 'Please fill in: ' + missing.join(', ') + '.'; err.hidden = false; return; }
      const b = $('#saveBtn'); b.disabled = true; b.innerHTML = icon('loader', 'spin-i') + 'Saving...';
      try {
        const payload = Object.assign({}, val);
        if (def.keyed) payload.Key = row.Key; else if (row && idc) payload[idc.k] = row[idc.k];
        const r = await api('/api/save', { tab, row: payload });
        S.data[tab] = r.rows;
        closeDrawer(); drawRows(tab);
        toast((isNew ? 'Added ' : 'Saved ') + (r.id || ''));
        if (r.tempPassword) showTempPassword(String(payload.Username).trim().toLowerCase(), r.tempPassword, true);
      } catch (e) { err.textContent = e.message; err.hidden = false; b.disabled = false; b.innerHTML = icon('check') + (isNew ? 'Add' : 'Save'); }
    }
  }

  function fieldEl(tab, c, val, row) {
    const w = document.createElement('div'); w.className = 'field';
    const lab = '<span>' + esc(c.label || c.k) + (c.req ? '<i class="req">*</i>' : '') + '</span>';
    const hint = c.hint ? '<small>' + esc(c.hint) + '</small>' : '';
    const v = val[c.k] === undefined ? '' : val[c.k];
    if (c.t === 'bool') {
      w.innerHTML = lab + '<label class="switch"><input type="checkbox"' + (v !== 'No' ? ' checked' : '') + '><i></i><b>' + (v !== 'No' ? 'Active' : 'Inactive') + '</b></label>' + '<small>Inactive entries stay in the sheet but are hidden from new item entry.</small>';
      const cb = w.querySelector('input'); cb.onchange = () => { val[c.k] = cb.checked ? 'Yes' : 'No'; w.querySelector('b').textContent = cb.checked ? 'Active' : 'Inactive'; };
    } else if (c.t === 'select') {
      w.innerHTML = lab + '<div class="seg">' + c.options.map(o => '<button type="button" class="' + (o === v ? 'on' : '') + '">' + esc(o) + '</button>').join('') + '</div>' + hint;
      w.querySelectorAll('.seg button').forEach(b => b.onclick = () => { val[c.k] = b.textContent; w.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); });
    } else if (c.t === 'refs') {
      w.innerHTML = lab + '<div class="pick"></div>' + hint;
      picker(w.querySelector('.pick'), tab, c, val, row);
    } else {
      const type = (c.t === 'int' || c.t === 'num') ? 'number' : 'text';
      w.innerHTML = lab + '<input class="input' + (c.t === 'code' ? ' code' : '') + '" type="' + type + '"' + (c.max && c.t === 'code' ? ' maxlength="' + c.max + '"' : '') + (type === 'number' ? ' step="any" inputmode="decimal"' : '') + ' value="' + esc(v) + '"' + (c.lower ? ' autocapitalize="off" autocomplete="off"' : '') + '>' + hint;
      const inp = w.querySelector('input');
      inp.oninput = () => { val[c.k] = c.t === 'code' ? inp.value.toUpperCase() : inp.value; };
    }
    return w;
  }

  // chip multi-select: click to pick, search, all / none
  function picker(box, tab, c, val, row) {
    const ref = c.ref, rdef = S.schema[ref], ridk = rdef.cols.find(x => x.t === 'id').k;
    let opts = (S.data[ref] || []).filter(r => r.Active !== 'No' || splitIds(val[c.k]).includes(r[ridk]));
    let note = '';
    if (c.byCategory) {
      const catId = row && row.CategoryID;
      const mapped = catId ? opts.filter(r => splitIds(r.Categories).includes(catId)) : [];
      if (mapped.length) opts = mapped;
      else note = catId ? 'Nothing is mapped to this category yet, so all ' + rdef.title.toLowerCase() + ' are shown. Map them in ' + rdef.title + '.' : 'Save the category first, then map ' + rdef.title.toLowerCase() + ' to it. All are shown for now.';
    }
    if (rdef.sort) opts.sort((a, b) => (Number(a[rdef.sort]) || 0) - (Number(b[rdef.sort]) || 0));
    let q = '';
    box.innerHTML = '<div class="pick-head"><input placeholder="Search"><button type="button" class="link" data-all>All</button><button type="button" class="link" data-none>None</button><span class="pick-count"></span></div><div class="pick-list"></div>' + (note ? '<div class="pick-empty" style="border-top:1px solid var(--ash-200)">' + icon('info') + ' ' + esc(note) + '</div>' : '');
    const list = box.querySelector('.pick-list'), count = box.querySelector('.pick-count');
    const sel = () => splitIds(val[c.k]);
    function draw() {
      const s = sel();
      const shown = opts.filter(r => !q || labelOf(ref, r[ridk]).toLowerCase().includes(q));
      list.innerHTML = shown.length ? shown.map(r => { const on = s.includes(r[ridk]); return '<button type="button" class="opt' + (on ? ' on' : '') + '" data-id="' + esc(r[ridk]) + '">' + (on ? icon('check') : '') + esc(labelOf(ref, r[ridk])) + '</button>'; }).join('') : '<div class="pick-empty">' + (opts.length ? 'No match.' : 'No ' + esc(rdef.title.toLowerCase()) + ' yet. Add them in ' + esc(rdef.title) + ' first.') + '</div>';
      count.textContent = s.length + ' selected';
      list.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const cur = sel(), id = b.dataset.id;
        val[c.k] = (cur.includes(id) ? cur.filter(x => x !== id) : cur.concat(id)).join(', ');
        draw();
      });
    }
    box.querySelector('input').oninput = e => { q = e.target.value.toLowerCase().trim(); draw(); };
    box.querySelector('[data-all]').onclick = () => { const cur = sel(); opts.forEach(r => { if (!cur.includes(r[ridk])) cur.push(r[ridk]); }); val[c.k] = cur.join(', '); draw(); };
    box.querySelector('[data-none]').onclick = () => { val[c.k] = ''; draw(); };
    draw();
  }

  function showTempPassword(username, pw, isNew) {
    dialog('<h3>' + icon('key') + (isNew ? 'User created' : 'Password reset') + '</h3><p>Give these details to <strong>' + esc(username) + '</strong>. They will be asked to choose their own password at first login. This password is shown only once.</p>' +
      '<div class="secret">' + esc(pw) + '</div><div class="actions"><button class="btn" id="copyPw">' + icon('sheet') + 'Copy</button><button class="btn btn-primary" data-dclose>Done</button></div>', d => {
      d.querySelector('#copyPw').onclick = () => { try { navigator.clipboard.writeText('Item Master login\nUsername: ' + username + '\nTemporary password: ' + pw + '\n' + location.href.split('#')[0]); toast('Copied.'); } catch (e) { toast('Copy did not work. Please note it down.', true); } };
    });
  }
  function resetPassword(row) {
    dialog('<h3>' + icon('key') + 'Reset password?</h3><p>' + esc(row.FullName) + ' (' + esc(row.Username) + ') will get a new temporary password and will be logged out everywhere.</p><div class="actions"><button class="btn" data-dclose>Cancel</button><button class="btn btn-primary" id="doReset">Reset password</button></div>', (d, close) => {
      d.querySelector('#doReset').onclick = async () => {
        try { const r = await api('/api/reset-password', { UserID: row.UserID }); close(); closeDrawer(); showTempPassword(row.Username, r.tempPassword, false); }
        catch (e) { close(); toast(e.message, true); }
      };
    });
  }
  function changePwDialog() {
    dialog('<h3>' + icon('key') + 'Change password</h3><form id="cpw" class="steps" style="gap:12px" novalidate>' +
      '<label class="field"><span>Current password</span><input class="input" type="password" name="o" autocomplete="current-password"></label>' +
      '<label class="field"><span>New password (at least 8 characters)</span><input class="input" type="password" name="n" autocomplete="new-password"></label>' +
      '<label class="field"><span>Type the new password again</span><input class="input" type="password" name="c" autocomplete="new-password"></label>' +
      '<div class="form-error" hidden></div><div class="actions"><button type="button" class="btn" data-dclose>Cancel</button><button class="btn btn-primary" type="submit">Save password</button></div></form>', (d, close) => {
      const f = d.querySelector('#cpw'), e = f.querySelector('.form-error');
      f.onsubmit = async ev => {
        ev.preventDefault(); e.hidden = true;
        const m = pwCheck(f.o.value, f.n.value, f.c.value); if (m) { e.textContent = m; e.hidden = false; return; }
        try { const r = await api('/api/password', { oldPassword: f.o.value, newPassword: f.n.value }); S.token = r.token; store.set('im_token', r.token); close(); toast('Password changed.'); }
        catch (x) { e.textContent = x.message; e.hidden = false; }
      };
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#dialogWrap').hidden) { $('#dialogWrap').hidden = true; return; }
    if (!$('#drawerWrap').hidden) closeDrawer();
  });

  // ------------------------------------------------------------ boot
  hydrate();
  (async function boot() {
    if (!S.token) return showLogin();
    try {
      const r = await api('/api/me'); S.user = r.user;
      if (r.user.MustChangePassword) return showPwForm(true);
      await startApp();
    } catch (e) { if (!S.user) showLogin(); }
  })();
})();
