/* Item Master - Approvals (Excel download / upload) and the notification bell. Uses window.IM from app.js. */
(function () {
  'use strict';
  const IM = window.IM, S = IM.S, $ = IM.$, esc = IM.esc, icon = IM.icon, ids = IM.splitIds;
  const XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
  const rows = t => S.data[t] || [];
  const byId = (t, k, id) => rows(t).find(r => r[k] === id);
  const nm = {
    cat: id => { const r = byId('Categories', 'CategoryID', id); return r ? r.Brand + ' - ' + r.Category : id; },
    sup: id => { const r = byId('Suppliers', 'SupplierID', id); return r ? r.SupplierName : id; },
    fab: id => { const r = id && byId('FabricTypes', 'FabricTypeID', id); return r ? r.FabricType : ''; },
    col: id => { const r = byId('Colours', 'ColourID', id); return r ? r.Colour : id; },
    fit: id => { const r = byId('Fits', 'FitID', id); return r ? r.Fit : id; },
    size: id => { const r = byId('Sizes', 'SizeID', id); return r ? String(r.Size) : id; },
    season: id => { const r = byId('Seasons', 'SeasonID', id); return r ? r.SeasonCode + ' · ' + r.SeasonName + ' ' + r.Year : id; },
  };
  const money = v => (v === '' || v === null || v === undefined || isNaN(v)) ? '-' : '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  let xlsxLoading = null;
  IM.loadXlsx = () => loadXlsx();
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!xlsxLoading) xlsxLoading = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = XLSX_URL;
      s.onload = () => res(window.XLSX); s.onerror = () => { xlsxLoading = null; rej(new Error('Could not load the Excel tool. Check your internet connection.')); };
      document.head.appendChild(s);
    });
    return xlsxLoading;
  }

  // ================================================================ APPROVALS PAGE
  const AP = { kind: '', season: '', cat: '', page: 1, rows: [] };
  IM.pages.approvals = function () {
    IM.setTitle('Approvals', 'Item entry');
    const seasons = rows('Seasons'), cats = rows('Categories');
    $('#content').innerHTML =
      '<div class="tiles ap-tiles" id="apTiles"></div>' +
      '<div class="card card-pad ap-steps">' +
      '<div class="ap-step"><span class="ap-num">1</span><div><strong>Download</strong><small>Pending requests go to Excel with Approve = Yes on every row.</small></div></div>' +
      '<div class="ap-step"><span class="ap-num">2</span><div><strong>Mark rejections</strong><small>Change Approve to No for the rows you reject. Other edits in Excel are ignored.</small></div></div>' +
      '<div class="ap-step"><span class="ap-num">3</span><div><strong>Upload</strong><small>Check the summary and confirm. Approved designs become item lines; rejected ones go back for editing.</small></div></div>' +
      '</div>' +
      '<div class="card">' +
      '<div class="toolbar">' +
      '<div class="seg" id="apKind">' + [['', 'All'], ['FG', 'Finished goods'], ['Fabric', 'Fabric']].map(k => '<button type="button" data-k="' + k[0] + '" class="' + (AP.kind === k[0] ? 'on' : '') + '">' + k[1] + '</button>').join('') + '</div>' +
      '<select id="apSeason"><option value="">All seasons</option>' + seasons.map(s => '<option value="' + esc(s.SeasonID) + '"' + (AP.season === s.SeasonID ? ' selected' : '') + '>' + esc(nm.season(s.SeasonID)) + '</option>').join('') + '</select>' +
      '<select id="apCat"><option value="">All categories</option>' + cats.map(c => '<option value="' + esc(c.CategoryID) + '"' + (AP.cat === c.CategoryID ? ' selected' : '') + '>' + esc(nm.cat(c.CategoryID)) + '</option>').join('') + '</select>' +
      '<span class="grow"></span>' +
      '<button class="btn" id="apDown">' + icon('download') + 'Download pending (Excel)</button>' +
      '<label class="btn btn-primary" id="apUpLabel">' + icon('upload') + 'Upload approval file<input type="file" id="apFile" accept=".xlsx,.xls,.csv" hidden></label>' +
      '</div><div id="apBody"><div class="loading">' + icon('loader') + 'Loading...</div></div></div>';
    $('#apKind').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { AP.kind = b.dataset.k; AP.page = 1; IM.pages.approvals(); });
    $('#apSeason').onchange = e => { AP.season = e.target.value; AP.page = 1; loadPending(); };
    $('#apCat').onchange = e => { AP.cat = e.target.value; AP.page = 1; loadPending(); };
    $('#apDown').onclick = download;
    $('#apFile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) upload(f); };
    loadPending();
  };

  async function loadPending() {
    let r;
    try { r = await IM.api('/api/approvals/pending?' + new URLSearchParams({ kind: AP.kind, season: AP.season, cat: AP.cat })); }
    catch (e) { const b = $('#apBody'); if (b) b.innerHTML = '<div class="empty">' + icon('alert') + '<p>' + esc(e.message) + '</p></div>'; return; }
    AP.rows = r.rows;
    const body = $('#apBody'); if (!body) return;
    const lines = AP.rows.reduce((s, x) => s + (Number(x.LineCount) || 0), 0);
    const fg = AP.rows.filter(x => x.ItemKind === 'FG').length;
    $('#apTiles').innerHTML =
      tile('inbox', AP.rows.length, 'designs pending approval') + tile('layers', lines.toLocaleString('en-IN'), 'item lines in them') +
      tile('filePlus', fg, 'finished goods') + tile('scroll', AP.rows.length - fg, 'fabric');
    $('#apDown').disabled = !AP.rows.length;
    if (!AP.rows.length) { body.innerHTML = '<div class="empty">' + icon('checkSquare') + '<p>Nothing is waiting for approval' + (AP.kind || AP.season || AP.cat ? ' with these filters' : '') + '.</p></div>'; return; }
    const per = 10, pages = Math.max(1, Math.ceil(AP.rows.length / per)); AP.page = Math.min(AP.page, pages);
    const show = AP.rows.slice((AP.page - 1) * per, AP.page * per);
    body.innerHTML = '<div class="table-wrap"><table class="grid"><thead><tr><th>Request</th><th>Design no.</th><th>Kind</th><th>Season</th><th>Category</th><th>Supplier</th><th>Supplier item code</th><th class="num">Lines</th><th class="num">MRP</th><th>Created</th></tr></thead><tbody>' +
      show.map(x => '<tr data-id="' + esc(x.RequestID) + '"><td class="id-cell">' + esc(x.RequestID) + '</td><td class="code-cell">' + esc(x.DesignNo) + (x.SourceDesign ? '<small class="from-fab">from fabric</small>' : '') + '</td><td>' + esc(x.ItemKind) + ' · ' + esc(x.ItemType) + '</td><td>' + esc(x.SeasonCode) + '</td><td>' + esc(nm.cat(x.CategoryID)) + '</td><td>' + esc(nm.sup(x.SupplierID)) + '</td><td>' + esc(x.SupplierItemCode) + '</td><td class="num">' + esc(x.LineCount) + '</td><td class="num">' + (x.ItemKind === 'FG' ? money(x.BaseMRP) : '-') + '</td><td><span class="who">' + esc(x.CreatedBy) + '</span><small class="muted">' + esc(x.CreatedAt) + '</small></td></tr>').join('') +
      '</tbody></table></div>' + IM.pager(AP.page, pages, AP.rows.length, AP.rows.length);
    body.querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => IM.openRequest(tr.dataset.id));
    body.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { AP.page = Number(b.dataset.page); loadPending(); });
  }
  const tile = (ic, n, label) => '<div class="tile" style="cursor:default"><span class="tile-ico">' + icon(ic) + '</span><span><b>' + esc(n) + '</b><span>' + esc(label) + '</span></span></div>';

  // ---------------------------------------------------------------- download
  const COLS = [
    ['Request ID', 13], ['Approve (Yes / No)', 16], ['Kind', 8], ['Item type', 10], ['Design no.', 14], ['Season', 9], ['Category', 20], ['Supplier (FG)', 22], ['Fabric supplier', 20],
    ['Supplier item code', 18], ['Fabric type', 14], ['Colours (supplier colour no.)', 32], ['Fits', 18], ['Sizes', 22], ['Item lines', 9], ['MRP', 9],
    ['Margin %', 9], ['CP / Rate', 10], ['Width', 10], ['Metres', 10], ['From fabric', 12], ['Created by', 13], ['Created at', 17]];
  async function download() {
    const b = $('#apDown'); b.disabled = true; b.innerHTML = icon('loader', 'spin-i') + 'Preparing...';
    try {
      const X = await loadXlsx();
      const data = AP.rows.map(x => [
        x.RequestID, 'Yes', x.ItemKind, x.ItemType, x.DesignNo, x.SeasonCode, nm.cat(x.CategoryID), nm.sup(x.SupplierID), x.FabricSupplier ? nm.sup(x.FabricSupplier) : '', x.SupplierItemCode, nm.fab(x.FabricTypeID),
        x.Colours.map(c => nm.col(c.c) + (c.n ? ' (' + c.n + ')' : '') + (x.ItemKind === 'Fabric' ? ' ' + c.m + ' m' : '')).join(', '),
        ids(x.Fits).map(nm.fit).join(', '), ids(x.Sizes).map(nm.size).join(', '), Number(x.LineCount) || 0,
        x.ItemKind === 'FG' ? Number(x.BaseMRP) : '', x.ItemKind === 'FG' ? Number(x.MarginUsed) : '', x.Cost === '' || x.Cost === undefined ? '' : Number(x.Cost), x.Width || '', x.ItemKind === 'Fabric' ? x.TotalMetres : '',
        x.SourceDesign || '', x.CreatedBy, x.CreatedAt]);
      const ws = X.utils.aoa_to_sheet([COLS.map(c => c[0])].concat(data));
      ws['!cols'] = COLS.map(c => ({ wch: c[1] }));
      ws['!freeze'] = { xSplit: 2, ySplit: 1 };
      ws['!views'] = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];
      ws['!autofilter'] = { ref: 'A1:' + X.utils.encode_col(COLS.length - 1) + (data.length + 1) };
      const head = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '13254A' } }, alignment: { vertical: 'center', wrapText: true }, border: { bottom: { style: 'thin', color: { rgb: '7C8492' } } } };
      const approve = { font: { bold: true, color: { rgb: '13254A' } }, fill: { fgColor: { rgb: 'FFF4CC' } }, alignment: { horizontal: 'center' }, border: { left: { style: 'thin', color: { rgb: 'C7CCD4' } }, right: { style: 'thin', color: { rgb: 'C7CCD4' } } } };
      for (let c = 0; c < COLS.length; c++) { const a = X.utils.encode_cell({ r: 0, c }); if (ws[a]) ws[a].s = c === 1 ? Object.assign({}, head, { fill: { fgColor: { rgb: 'B8860B' } } }) : head; }
      for (let r = 1; r <= data.length; r++) { const a = X.utils.encode_cell({ r, c: 1 }); if (ws[a]) ws[a].s = approve; const id = X.utils.encode_cell({ r, c: 0 }); if (ws[id]) ws[id].s = { font: { bold: true } }; }
      const help = X.utils.aoa_to_sheet([
        ['How to use this file'], [''],
        ['1. Every request is set to Approve = Yes.'],
        ['2. Change Approve to No for each request you reject. Leave Yes for the ones you approve.'],
        ['3. Save the file and upload it on the Approvals page of the Item Master app.'], [''],
        ['Only the Request ID and Approve columns are read. Changes to any other column are ignored:'],
        ['all values are taken from the request saved in the app and recalculated.'],
        ['Rows you delete are simply left Pending.'], [''],
        ['Downloaded by ' + (S.user.FullName || S.user.Username) + ' on ' + new Date().toLocaleString('en-IN')]]);
      help['!cols'] = [{ wch: 100 }]; if (help.A1) help.A1.s = { font: { bold: true, sz: 14, color: { rgb: '13254A' } } };
      const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, ws, 'Pending approval');
      X.utils.book_append_sheet(wb, help, 'How to use');
      const d = new Date(), stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      X.writeFile(wb, 'Pending approval ' + stamp + '.xlsx');
      IM.toast('Downloaded ' + data.length + ' pending request' + (data.length === 1 ? '' : 's') + '.');
    } catch (e) { IM.toast(e.message, true); }
    finally { b.disabled = !AP.rows.length; b.innerHTML = icon('download') + 'Download pending (Excel)'; }
  }

  // ---------------------------------------------------------------- upload
  async function upload(file) {
    let found;
    try {
      const X = await loadXlsx();
      const wb = X.read(await file.arrayBuffer(), { type: 'array' });
      found = readApprovals(X, wb);
    } catch (e) { IM.dialog('<h3>' + icon('alert') + 'Cannot read this file</h3><p>' + esc(e.message) + '</p><div class="actions"><button class="btn btn-primary" data-dclose>OK</button></div>'); return; }
    const yes = found.rows.filter(r => /^(yes|y)$/i.test(r.Approve)), no = found.rows.filter(r => /^(no|n)$/i.test(r.Approve));
    const bad = found.rows.filter(r => !/^(yes|y|no|n)$/i.test(r.Approve));
    IM.dialog('<h3>' + icon('upload') + 'Upload approvals?</h3>' +
      '<p>File <strong>' + esc(file.name) + '</strong>, sheet "' + esc(found.sheet) + '": ' + found.rows.length + ' request' + (found.rows.length === 1 ? '' : 's') + '.</p>' +
      '<div class="ap-sum"><div class="ok"><b>' + yes.length + '</b><span>to approve</span></div><div class="no"><b>' + no.length + '</b><span>to reject</span></div>' + (bad.length ? '<div class="bad"><b>' + bad.length + '</b><span>not Yes / No (skipped)</span></div>' : '') + '</div>' +
      (no.length ? '<p class="muted" style="font-size:13px">Reject: ' + esc(no.slice(0, 12).map(r => r.RequestID).join(', ')) + (no.length > 12 ? ' and ' + (no.length - 12) + ' more' : '') + '</p>' : '') +
      '<p class="muted" style="font-size:13px">Only Request ID and Approve are used. This cannot be undone from the app.</p>' +
      '<div class="actions"><button class="btn" data-dclose>Cancel</button><button class="btn btn-primary" id="apGo"' + (yes.length + no.length ? '' : ' disabled') + '>' + icon('check') + 'Apply</button></div>', (d, close) => {
      d.querySelector('#apGo').onclick = async () => {
        const b = d.querySelector('#apGo'); b.disabled = true; b.innerHTML = icon('loader', 'spin-i') + 'Applying...';
        try {
          const r = await IM.api('/api/approvals/apply', { rows: found.rows });
          close(); showResult(r); loadPending(); if (IM.refreshBell) IM.refreshBell();
        } catch (e) { close(); IM.toast(e.message, true); }
      };
    });
  }
  // Finds the header row with "Request ID" and "Approve" in any sheet, then reads those two columns only.
  function readApprovals(X, wb) {
    for (const name of wb.SheetNames) {
      const aoa = X.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '' });
      for (let h = 0; h < Math.min(aoa.length, 10); h++) {
        const head = aoa[h].map(v => String(v).trim().toLowerCase());
        const ci = head.findIndex(v => /^request\s*id$/.test(v) || v === 'request no.' || v === 'request'), ai = head.findIndex(v => v.startsWith('approve'));
        if (ci < 0 || ai < 0) continue;
        const out = [];
        for (let r = h + 1; r < aoa.length; r++) {
          const id = String(aoa[r][ci] || '').trim();
          if (id) out.push({ RequestID: id, Approve: String(aoa[r][ai] || '').trim() });
        }
        if (!out.length) throw new Error('The sheet "' + name + '" has no request rows.');
        return { sheet: name, rows: out };
      }
    }
    throw new Error('No sheet has both a "Request ID" and an "Approve" column. Please upload the file downloaded from this page.');
  }
  function showResult(r) {
    const sk = r.skipped || [];
    IM.dialog('<h3>' + icon('check') + 'Approvals applied</h3>' +
      '<div class="ap-sum"><div class="ok"><b>' + r.approved.length + '</b><span>approved</span></div><div class="no"><b>' + r.rejected.length + '</b><span>rejected</span></div><div><b>' + (r.lines || 0).toLocaleString('en-IN') + '</b><span>item lines created</span></div></div>' +
      (r.approved.length ? '<p>Approved items now wait for an ERP code.</p>' : '') +
      (sk.length ? '<details class="ap-skip" open><summary>' + sk.length + ' row' + (sk.length === 1 ? ' was' : 's were') + ' skipped</summary><ul>' + sk.slice(0, 50).map(s => '<li><strong>' + esc(s.RequestID) + '</strong>: ' + esc(s.reason) + '</li>').join('') + (sk.length > 50 ? '<li>and ' + (sk.length - 50) + ' more</li>' : '') + '</ul></details>' : '') +
      '<div class="actions"><button class="btn btn-primary" data-dclose>Done</button></div>');
  }

  // ================================================================ NOTIFICATION BELL
  let bellTimer = null, lastBell = null;
  const seenKey = () => 'im_seen_' + (S.user && S.user.UserID);
  const seen = () => { try { return new Set(JSON.parse(IM.store.get(seenKey()) || '[]')); } catch (e) { return new Set(); } };
  IM.refreshBell = async function () {
    if (!S.user) return;
    try { lastBell = await IM.api('/api/notifications'); } catch (e) { return; }
    const s = seen(), unread = lastBell.items.filter(i => !s.has(i.NotifID)).length;
    const badge = $('#bellBadge'); badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : String(unread);
    if (!$('#bellPanel').hidden) drawBell();
  };
  function drawBell() {
    const p = $('#bellPanel'), b = lastBell || { items: [], counts: {} }, c = b.counts || {}, s = seen();
    const ago = t => esc(t || '');
    p.innerHTML = '<div class="bell-head"><strong>Notifications</strong><button class="link" id="bellAll">Mark all as read</button></div>' +
      '<div class="bell-counts"><a href="#/approvals"><b>' + (c.pendingDesigns || 0) + '</b><span>designs pending approval</span><small>' + (c.pendingLines || 0).toLocaleString('en-IN') + ' item lines</small></a>' +
      '<a href="#/requests"><b>' + (c.awaitingLines || 0).toLocaleString('en-IN') + '</b><span>items awaiting ERP code</span><small>' + (c.awaitingDesigns || 0) + ' designs</small></a></div>' +
      '<div class="bell-list">' + (b.items.length ? b.items.map(i => '<button class="bell-item' + (s.has(i.NotifID) ? '' : ' unread') + '" data-req="' + esc(i.RequestID) + '" data-id="' + esc(i.NotifID) + '"><span class="bell-dot t-' + esc(String(i.Type).toLowerCase()) + '">' + icon(i.Type === 'Approved' ? 'check' : i.Type === 'Rejected' ? 'xCircle' : 'inbox') + '</span><span><span class="bell-msg">' + esc(i.Message) + '</span><small>' + ago(i.CreatedAt) + '</small></span></button>').join('')
        : '<div class="pick-empty" style="padding:18px">No notifications yet for your categories.</div>') + '</div>';
    p.querySelector('#bellAll').onclick = () => { markRead(b.items.map(i => i.NotifID)); drawBell(); };
    p.querySelectorAll('.bell-counts a').forEach(a => a.onclick = () => { p.hidden = true; });
    p.querySelectorAll('.bell-item').forEach(el => el.onclick = () => {
      markRead([el.dataset.id]); p.hidden = true;
      if (el.dataset.req) { if (!/^#\/requests/.test(location.hash)) location.hash = '#/requests'; setTimeout(() => IM.openRequest(el.dataset.req), 250); }
    });
  }
  function markRead(list) {
    const s = seen(); list.forEach(id => s.add(id));
    IM.store.set(seenKey(), JSON.stringify(Array.from(s).slice(-300)));
    const unread = ((lastBell && lastBell.items) || []).filter(i => !s.has(i.NotifID)).length;
    const badge = $('#bellBadge'); badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : String(unread);
  }
  $('#bellBtn').addEventListener('click', ev => {
    ev.stopPropagation();
    const p = $('#bellPanel'); p.hidden = !p.hidden;
    if (!p.hidden) { drawBell(); IM.refreshBell(); }
  });
  document.addEventListener('click', ev => { if (!ev.target.closest('.bell-wrap')) $('#bellPanel').hidden = true; });
  IM.afterStart = function () {
    IM.refreshBell();
    clearInterval(bellTimer);
    bellTimer = setInterval(() => { if (S.user && !document.hidden) IM.refreshBell(); }, 90000);
  };
})();
