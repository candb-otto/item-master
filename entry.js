/* Item Master - FG Entry and My Requests screens. Uses the shared helpers in app.js (window.IM). */
(function () {
  'use strict';
  const IM = window.IM, S = IM.S, $ = IM.$, esc = IM.esc, icon = IM.icon, ids = IM.splitIds;
  const money = v => (v === '' || v === null || v === undefined || isNaN(v)) ? '-' : '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const rows = t => S.data[t] || [];
  const act = r => r.Active !== 'No';
  const byId = (t, k, id) => rows(t).find(r => r[k] === id);
  const inCat = (r, cat) => ids(r.Categories).includes(cat);
  const sizeSort = (a, b) => (Number(a.SortOrder) || 0) - (Number(b.SortOrder) || 0);
  const setting = k => (rows('Settings').find(r => r.Key === k) || {}).Value;
  const name = {
    season: id => { const r = byId('Seasons', 'SeasonID', id); return r ? r.SeasonCode + ' · ' + r.SeasonName + ' ' + r.Year : id; },
    cat: id => { const r = byId('Categories', 'CategoryID', id); return r ? r.Brand + ' - ' + r.Category : id; },
    sup: id => { const r = byId('Suppliers', 'SupplierID', id); return r ? r.SupplierName : id; },
    fab: id => { const r = byId('FabricTypes', 'FabricTypeID', id); return r ? r.FabricType : id; },
    col: id => { const r = byId('Colours', 'ColourID', id); return r ? r.Colour : id; },
    fit: id => { const r = byId('Fits', 'FitID', id); return r ? r.Fit : id; },
    size: id => { const r = byId('Sizes', 'SizeID', id); return r ? r.Size : id; },
  };
  const statusPill = s => '<span class="pill st-' + esc(String(s).toLowerCase()) + '">' + esc(s) + '</span>';

  // same rule as the server: WSP = MRP / (1 + margin%), rounded by the WSP Rounding table
  function wspFor(mrp, m) {
    const raw = mrp / (1 + m / 100);
    const r = rows('WSPRounding').find(x => act(x) && raw >= Number(x.FromAmount) && raw <= Number(x.ToAmount));
    if (!r || !(Number(r.RoundTo) > 0)) return Math.round(raw * 100) / 100;
    const step = Number(r.RoundTo), q = raw / step;
    const n = r.Method === 'Up' ? Math.ceil(q - 1e-9) : r.Method === 'Down' ? Math.floor(q + 1e-9) : Math.round(q);
    return Math.round(n * step * 100) / 100;
  }
  function describe(cat, fitId, colId, sizeId, fabId) {
    const c = byId('Categories', 'CategoryID', cat); if (!c) return '';
    return String(c.DescTemplate || '{Brand} {Category} {Fit} {Colour}')
      .replace(/\{Brand\}/g, c.Brand).replace(/\{Category\}/g, c.Category)
      .replace(/\{Fit\}/g, fitId ? name.fit(fitId) : '').replace(/\{Colour\}/g, colId ? name.col(colId) : '')
      .replace(/\{Size\}/g, sizeId ? name.size(sizeId) : '').replace(/\{FabricType\}/g, fabId ? name.fab(fabId) : '')
      .replace(/\s+/g, ' ').trim();
  }

  // ================================================================ FG ENTRY
  let F = null;             // form state
  let previewTimer = null, previewSeq = 0;
  const lastKey = () => 'im_last_' + S.user.UserID;

  IM.pages.fg = async function (reqId) {
    IM.setTitle(reqId ? 'Edit FG design' : 'New FG design', 'Item entry');
    const content = $('#content');
    if (!rows('Categories').length) { content.innerHTML = emptyCard('tag', 'No categories are assigned to you yet. Please ask your admin to assign your categories.'); return; }
    if (reqId) {
      content.innerHTML = '<div class="loading">' + icon('loader') + 'Loading ' + esc(reqId) + '...</div>';
      let r;
      try { r = (await IM.api('/api/request?id=' + encodeURIComponent(reqId))).request; }
      catch (e) { content.innerHTML = emptyCard('alert', e.message); return; }
      if (!r.CanEdit) { content.innerHTML = emptyCard('lock', reqId + ' is ' + r.Status + ' and can no longer be edited.'); return; }
      F = { RequestID: r.RequestID, Status: r.Status, Remarks: r.Remarks, locked: true, ItemType: r.ItemType, SeasonID: r.SeasonID, CategoryID: r.CategoryID, SupplierID: r.SupplierID,
        FabricTypeID: r.FabricTypeID, DesignNo: r.DesignNo, SupplierItemCode: r.SupplierItemCode, Colours: r.Colours || [], Fits: ids(r.Fits), Sizes: ids(r.Sizes),
        BaseMRP: r.BaseMRP, MarginPct: r.MarginPct };
    } else {
      let last = {}; try { last = JSON.parse(IM.store.get(lastKey()) || '{}'); } catch (e) { /* ignore */ }
      F = { locked: false, ItemType: 'Non-core', SeasonID: '', CategoryID: '', SupplierID: '', FabricTypeID: '', DesignNo: '', SupplierItemCode: '', Colours: [], Fits: [], Sizes: [], BaseMRP: '', MarginPct: '' };
      const seasons = rows('Seasons').filter(act);
      F.SeasonID = seasons.some(s => s.SeasonID === last.SeasonID) ? last.SeasonID : (seasons.length === 1 ? seasons[0].SeasonID : '');
      const cats = rows('Categories').filter(act);
      if (cats.some(c => c.CategoryID === last.CategoryID)) setCategory(last.CategoryID); else if (cats.length === 1) setCategory(cats[0].CategoryID);
      if (last.SupplierID && suppliersFor(F.CategoryID).some(s => s.SupplierID === last.SupplierID)) F.SupplierID = last.SupplierID;
      if (last.FabricTypeID && fabricsFor(F.CategoryID).some(s => s.FabricTypeID === last.FabricTypeID)) F.FabricTypeID = last.FabricTypeID;
    }
    drawForm();
  };

  const suppliersFor = cat => rows('Suppliers').filter(s => act(s) && cat && inCat(s, cat)).sort((a, b) => String(a.SupplierName).localeCompare(b.SupplierName));
  const fabricsFor = cat => rows('FabricTypes').filter(s => act(s) && cat && inCat(s, cat));
  const coloursFor = cat => rows('Colours').filter(s => act(s) && cat && inCat(s, cat)).sort((a, b) => String(a.Colour).localeCompare(b.Colour));
  const fitsFor = cat => rows('Fits').filter(s => act(s) && cat && inCat(s, cat));
  const sizesFor = cat => rows('Sizes').filter(s => act(s) && cat && inCat(s, cat)).sort(sizeSort);
  const catRow = () => byId('Categories', 'CategoryID', F.CategoryID);
  const fabricRule = () => (catRow() || {}).FabricTypeRule || 'Off';

  // a new category brings its defaults: fits, sizes; choices that do not belong to it are dropped
  function setCategory(cat) {
    F.CategoryID = cat;
    const c = catRow() || {};
    const fitIds = fitsFor(cat).map(x => x.FitID), sizeIds = sizesFor(cat).map(x => x.SizeID), colIds = coloursFor(cat).map(x => x.ColourID);
    F.Fits = ids(c.DefaultFits).filter(x => fitIds.includes(x));
    F.Sizes = ids(c.DefaultSizes).filter(x => sizeIds.includes(x));
    F.Colours = F.Colours.filter(x => colIds.includes(x.c));
    if (!suppliersFor(cat).some(s => s.SupplierID === F.SupplierID)) F.SupplierID = '';
    if (!fabricsFor(cat).some(s => s.FabricTypeID === F.FabricTypeID) || (c.FabricTypeRule || 'Off') === 'Off') F.FabricTypeID = '';
  }

  function drawForm() {
    const c = catRow() || {}, L = F.locked;
    const seasons = rows('Seasons').filter(s => act(s) || s.SeasonID === F.SeasonID);
    const cats = rows('Categories').filter(s => act(s) || s.CategoryID === F.CategoryID);
    const lockedVal = (label, v) => '<div class="field"><span>' + label + '</span><div class="locked">' + icon('lock') + esc(v || '-') + '</div></div>';
    const segs = (key, list, val, label) => '<div class="seg seg-wrap" data-seg="' + key + '">' + list.map(o => '<button type="button" data-v="' + esc(o.v) + '" class="' + (o.v === val ? 'on' : '') + '">' + esc(o.t) + '</button>').join('') + '</div>' + (list.length ? '' : '<small class="warn">' + esc(label) + '</small>');

    const head = L
      ? '<div class="form-grid">' + lockedVal('Item type', F.ItemType) + lockedVal('Season', name.season(F.SeasonID)) + lockedVal('Category', name.cat(F.CategoryID)) + lockedVal('Supplier', name.sup(F.SupplierID)) + (F.FabricTypeID ? lockedVal('Fabric type', name.fab(F.FabricTypeID)) : '') + '</div>' +
        '<p class="note">' + icon('info') + 'The design number is fixed, so item type, season, category, supplier and fabric type cannot be changed. Make a new design if one of these is wrong.</p>'
      : '<div class="field"><span>Item type</span>' + segs('ItemType', [{ v: 'Non-core', t: 'Non-core' }, { v: 'Core', t: 'Core' }], F.ItemType) + '</div>' +
        '<div class="field"><span>Season<i class="req">*</i></span>' + segs('SeasonID', seasons.map(s => ({ v: s.SeasonID, t: s.SeasonCode + ' · ' + s.SeasonName + ' ' + s.Year })), F.SeasonID, 'No active season. Ask your admin to add one.') + '</div>' +
        '<div class="field"><span>Category<i class="req">*</i></span>' + segs('CategoryID', cats.map(s => ({ v: s.CategoryID, t: s.Brand + ' - ' + s.Category })), F.CategoryID, 'No category.') + '</div>' +
        '<div class="form-grid">' +
        '<label class="field"><span>Supplier<i class="req">*</i></span><select class="input" id="fSupplier"' + (F.CategoryID ? '' : ' disabled') + '><option value="">' + (F.CategoryID ? 'Choose supplier' : 'Choose a category first') + '</option>' +
        suppliersFor(F.CategoryID).map(s => '<option value="' + esc(s.SupplierID) + '"' + (s.SupplierID === F.SupplierID ? ' selected' : '') + '>' + esc(s.SupplierName + ' (' + s.Prefix + ')') + '</option>').join('') + '</select>' +
        (F.CategoryID && !suppliersFor(F.CategoryID).length ? '<small class="warn">No supplier is mapped to this category yet.</small>' : '') + '</label>' +
        (fabricRule() !== 'Off' ? '<div class="field"><span>Fabric type' + (fabricRule() === 'Mandatory' ? '<i class="req">*</i>' : ' (optional)') + '</span>' +
          segs('FabricTypeID', [].concat(fabricRule() === 'Optional' ? [{ v: '', t: 'None' }] : []).concat(fabricsFor(F.CategoryID).map(s => ({ v: s.FabricTypeID, t: s.FabricType + ' (' + s.FabricCode + ')' }))), F.FabricTypeID, 'No fabric type is mapped to this category.') + '</div>' : '') +
        '</div>';

    const dn = (F.ItemType === 'Core' && !L)
      ? '<label class="field"><span>Design number<i class="req">*</i></span><input class="input code" id="fDesignNo" value="' + esc(F.DesignNo) + '" maxlength="30" placeholder="Type the design number"><small>Core items: type the design number.</small></label>'
      : '';
    const sizeList = sizesFor(F.CategoryID), big = ids(c.BigSizes);
    const fromIdx = sizeList.findIndex(s => F.Sizes.includes(s.SizeID)), toIdx = sizeList.length - 1 - sizeList.slice().reverse().findIndex(s => F.Sizes.includes(s.SizeID));
    const sizeOpt = (sel) => sizeList.map((s, i) => '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + esc(s.Size) + '</option>').join('');

    $('#content').innerHTML =
      (F.Status === 'Rejected' ? '<div class="banner banner-red" style="margin:0 0 16px">' + icon('alert') + '<div><strong>This request was rejected.</strong>' + (F.Remarks ? '<br>' + esc(F.Remarks) : '') + '<br>Make your changes and submit again; it goes back to Pending.</div></div>' : '') +
      '<div class="entry">' +
      '<div class="entry-main">' +
      '<section class="card card-pad"><h3 class="section-title">' + icon('tag') + 'Design</h3>' + head +
      '<div class="form-grid">' + dn +
      '<label class="field"><span>Supplier item code<i class="req">*</i></span><input class="input" id="fSupCode" value="' + esc(F.SupplierItemCode) + '" maxlength="60" placeholder="As on the supplier\'s quote"></label></div></section>' +

      '<section class="card card-pad"><h3 class="section-title">' + icon('palette') + 'Colours</h3>' +
      (F.CategoryID ? '<div class="pick"><div class="pick-head"><input id="colSearch" placeholder="Search colours"><span class="pick-count">' + F.Colours.length + ' selected</span></div><div class="pick-list" id="colList"></div></div>' +
        '<div id="colTable"></div>' : '<p class="muted">Choose a category first.</p>') + '</section>' +

      '<section class="card card-pad"><h3 class="section-title">' + icon('shirt') + 'Fits and sizes</h3>' +
      (F.CategoryID ? '<div class="field"><span>Fits<i class="req">*</i></span><div class="chips-pick" id="fitList">' +
        (fitsFor(F.CategoryID).map(f => '<button type="button" class="opt' + (F.Fits.includes(f.FitID) ? ' on' : '') + '" data-fit="' + esc(f.FitID) + '">' + (F.Fits.includes(f.FitID) ? icon('check') : '') + esc(f.Fit) + '</button>').join('') || '<small class="warn">No fit is mapped to this category yet.</small>') + '</div></div>' +
        '<div class="field"><span>Sizes<i class="req">*</i></span>' +
        (sizeList.length ? '<div class="range"><label>From <select id="szFrom">' + sizeOpt(fromIdx < 0 ? 0 : fromIdx) + '</select></label><label>To <select id="szTo">' + sizeOpt(fromIdx < 0 ? sizeList.length - 1 : toIdx) + '</select></label><button type="button" class="btn btn-sm" id="szApply">' + icon('check') + 'Use this range</button><button type="button" class="link" id="szDefault">Category default</button></div>' +
          '<div class="chips-pick" id="sizeList">' + sizeList.map(s => '<button type="button" class="opt' + (F.Sizes.includes(s.SizeID) ? ' on' : '') + '" data-size="' + esc(s.SizeID) + '">' + (F.Sizes.includes(s.SizeID) ? icon('check') : '') + esc(s.Size) + (big.includes(s.SizeID) ? '<em class="big">+' + money(c.BigSizeExtra || 0) + '</em>' : '') + '</button>').join('') + '</div>' +
          '<small>Click a size to add or remove it. Sizes marked + get the big-size extra on MRP.</small>' : '<small class="warn">No size is mapped to this category yet.</small>') + '</div>'
        : '<p class="muted">Choose a category first.</p>') + '</section>' +

      '<section class="card card-pad"><h3 class="section-title">' + icon('coins') + 'Price</h3><div class="form-grid">' +
      '<label class="field"><span>MRP (₹)<i class="req">*</i></span><input class="input" id="fMrp" type="number" min="1" step="any" inputmode="decimal" value="' + esc(F.BaseMRP) + '" placeholder="Base MRP"></label>' +
      '<label class="field"><span>Margin % (optional)</span><input class="input" id="fMargin" type="number" min="0" step="any" inputmode="decimal" value="' + esc(F.MarginPct) + '" placeholder="' + (c.MarginPct !== undefined && c.MarginPct !== '' ? 'Standard ' + esc(c.MarginPct) + '%' : 'Category standard') + '"></label></div>' +
      '<div id="priceBox"></div></section>' +
      '</div>' +

      '<aside class="entry-side"><div class="card summary" id="summary"></div></aside></div>';

    IM.hydrate($('#content'));
    bindForm();
    drawColours(); drawPrices(); drawSummary(); schedulePreview(0);
  }

  function bindForm() {
    document.querySelectorAll('[data-seg]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.onclick = () => {
      const k = seg.dataset.seg, v = b.dataset.v;
      if (k === 'CategoryID') { if (v !== F.CategoryID) setCategory(v); }
      else F[k] = v;
      drawForm();
    }));
    const on = (id, ev, fn) => { const el = $('#' + id); if (el) el.addEventListener(ev, fn); };
    on('fSupplier', 'change', e => { F.SupplierID = e.target.value; drawSummary(); schedulePreview(); });
    on('fDesignNo', 'input', e => { F.DesignNo = e.target.value.toUpperCase(); drawSummary(); schedulePreview(); });
    on('fSupCode', 'input', e => { F.SupplierItemCode = e.target.value; drawSummary(); schedulePreview(); });
    on('fMrp', 'input', e => { F.BaseMRP = e.target.value; drawPrices(); drawSummary(); schedulePreview(); });
    on('fMargin', 'input', e => { F.MarginPct = e.target.value; drawPrices(); drawSummary(); });
    on('colSearch', 'input', () => drawColours(true));
    document.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => { toggle(F.Fits, b.dataset.fit); redrawPick(b, F.Fits.includes(b.dataset.fit)); drawPrices(); drawSummary(); schedulePreview(); });
    document.querySelectorAll('[data-size]').forEach(b => b.onclick = () => {
      toggle(F.Sizes, b.dataset.size);
      const order = sizesFor(F.CategoryID).map(s => s.SizeID); F.Sizes.sort((a, z) => order.indexOf(a) - order.indexOf(z));
      redrawPick(b, F.Sizes.includes(b.dataset.size)); drawPrices(); drawSummary(); schedulePreview();
    });
    on('szApply', 'click', () => {
      const list = sizesFor(F.CategoryID); let a = Number($('#szFrom').value), z = Number($('#szTo').value); if (a > z) [a, z] = [z, a];
      F.Sizes = list.slice(a, z + 1).map(s => s.SizeID); drawForm();
    });
    on('szDefault', 'click', () => { const ok = sizesFor(F.CategoryID).map(s => s.SizeID); F.Sizes = ids((catRow() || {}).DefaultSizes).filter(x => ok.includes(x)); drawForm(); });
  }
  function toggle(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function redrawPick(b, onState) { b.classList.toggle('on', onState); const old = b.querySelector('svg'); if (onState && !old) b.insertAdjacentHTML('afterbegin', icon('check')); if (!onState && old) old.remove(); }

  function drawColours(listOnly) {
    const list = $('#colList'); if (!list) return;
    const q = ($('#colSearch').value || '').toLowerCase().trim();
    const all = coloursFor(F.CategoryID), chosen = F.Colours.map(x => x.c);
    const shown = all.filter(r => !q || r.Colour.toLowerCase().includes(q));
    list.innerHTML = shown.length ? shown.map(r => '<button type="button" class="opt' + (chosen.includes(r.ColourID) ? ' on' : '') + '" data-col="' + esc(r.ColourID) + '">' + (chosen.includes(r.ColourID) ? icon('check') : '') + esc(r.Colour) + '</button>').join('')
      : '<div class="pick-empty">' + (all.length ? 'No match.' : 'No colour is mapped to this category yet.') + '</div>';
    list.querySelectorAll('[data-col]').forEach(b => b.onclick = () => {
      const id = b.dataset.col, i = F.Colours.findIndex(x => x.c === id);
      if (i >= 0) F.Colours.splice(i, 1); else F.Colours.push({ c: id, n: '' });
      drawColours(); drawSummary(); schedulePreview();
    });
    document.querySelector('.pick-count').textContent = F.Colours.length + ' selected';
    if (listOnly) return;
    const mand = (catRow() || {}).SupplierColourRule === 'Mandatory';
    $('#colTable').innerHTML = F.Colours.length ? '<table class="grid mini"><thead><tr><th>#</th><th>Colour</th><th>Supplier colour no.' + (mand ? '<i class="req">*</i>' : ' (optional)') + '</th><th></th></tr></thead><tbody>' +
      F.Colours.map((x, i) => '<tr><td class="id-cell">' + (i + 1) + '</td><td><strong>' + esc(name.col(x.c)) + '</strong></td><td><input class="input input-sm" data-cno="' + i + '" value="' + esc(x.n) + '" maxlength="20" placeholder="e.g. ' + (i + 1) + '"></td><td class="num"><button type="button" class="icon-btn" data-crm="' + i + '" title="Remove">' + icon('x') + '</button></td></tr>').join('') +
      '</tbody></table>' : '<p class="muted" style="margin:10px 0 0">Click colours above to add them.</p>';
    $('#colTable').querySelectorAll('[data-cno]').forEach(inp => inp.oninput = () => { F.Colours[Number(inp.dataset.cno)].n = inp.value.trim(); drawSummary(); });
    $('#colTable').querySelectorAll('[data-crm]').forEach(b => b.onclick = () => { F.Colours.splice(Number(b.dataset.crm), 1); drawColours(); drawSummary(); schedulePreview(); });
  }

  function margin() { const c = catRow() || {}; return F.MarginPct !== '' && F.MarginPct !== null && !isNaN(F.MarginPct) ? Number(F.MarginPct) : Number(c.MarginPct) || 0; }
  function drawPrices() {
    const box = $('#priceBox'); if (!box) return;
    const c = catRow() || {}, mrp = Number(F.BaseMRP), m = margin();
    if (!(mrp > 0)) { box.innerHTML = '<p class="muted" style="margin:10px 0 0">Enter the MRP to see WSP for each size group.</p>'; return; }
    const big = ids(c.BigSizes), extra = Number(c.BigSizeExtra) || 0;
    const normal = F.Sizes.filter(s => !big.includes(s)), bigSel = F.Sizes.filter(s => big.includes(s));
    const line = (label, list, p) => '<tr><td>' + esc(label) + '</td><td>' + (list.length ? esc(list.map(name.size).join(', ')) : '<span class="muted">-</span>') + '</td><td class="num">' + money(p) + '</td><td class="num"><strong>' + money(wspFor(p, m)) + '</strong></td></tr>';
    box.innerHTML = '<table class="grid mini" style="margin-top:12px"><thead><tr><th>Size group</th><th>Sizes</th><th class="num">MRP</th><th class="num">WSP</th></tr></thead><tbody>' +
      line('Regular', normal, mrp) + (big.length ? line('Big (+' + money(extra) + ')', bigSel, mrp + extra) : '') + '</tbody></table>' +
      '<small class="muted">Margin used: ' + m + '%' + (F.MarginPct === '' ? ' (category standard)' : '') + '. WSP = MRP ÷ (1 + margin %), rounded with the WSP rounding table.</small>';
  }

  let lastPreview = { designNo: '', errors: [] };
  function drawSummary() {
    const box = $('#summary'); if (!box) return;
    const nCol = F.Colours.length, nFit = F.Fits.length, nSize = F.Sizes.length, lines = nCol * nFit * nSize;
    const dn = F.locked ? F.DesignNo : (F.ItemType === 'Core' ? (F.DesignNo || '') : (lastPreview.designNo || ''));
    const desc = describe(F.CategoryID, F.Fits[0], F.Colours[0] && F.Colours[0].c, F.Sizes[0], F.FabricTypeID);
    const local = localErrors();
    const errs = local.concat((lastPreview.errors || []).filter(e => !local.length || /Already exists|already used/.test(e)));
    box.innerHTML =
      '<div class="sum-head"><small>' + (F.locked ? esc(F.RequestID) + ' · ' + esc(F.Status) : 'Design number') + '</small>' +
      '<div class="dn">' + (dn ? esc(dn) : '<span class="muted">-</span>') + '</div>' +
      (!F.locked && F.ItemType === 'Non-core' ? '<small>' + (dn ? 'Next free number. It is reserved when you submit.' : 'Built from season, supplier, category' + (fabricRule() !== 'Off' ? ', fabric' : '') + ' and the next number.') + '</small>' : '') + '</div>' +
      '<dl class="sum-list">' +
      '<dt>Season</dt><dd>' + esc(F.SeasonID ? name.season(F.SeasonID) : '-') + '</dd>' +
      '<dt>Category</dt><dd>' + esc(F.CategoryID ? name.cat(F.CategoryID) : '-') + '</dd>' +
      '<dt>Supplier</dt><dd>' + esc(F.SupplierID ? name.sup(F.SupplierID) : '-') + '</dd>' +
      '<dt>Supplier item code</dt><dd>' + esc(F.SupplierItemCode || '-') + '</dd></dl>' +
      '<div class="sum-count"><div><b>' + nCol + '</b><span>colours</span></div><i>×</i><div><b>' + nFit + '</b><span>fits</span></div><i>×</i><div><b>' + nSize + '</b><span>sizes</span></div><i>=</i><div class="tot"><b>' + lines + '</b><span>item lines</span></div></div>' +
      (desc ? '<div class="sum-desc"><small>Item description (first line)</small><div>' + esc(desc) + '</div></div>' : '') +
      (errs.length ? '<ul class="sum-errs">' + errs.map(e => '<li>' + icon(/Already exists|already used/.test(e) ? 'alert' : 'info') + '<span>' + esc(e) + '</span></li>').join('') + '</ul>' : '<div class="sum-ok">' + icon('check') + 'Ready to submit</div>') +
      '<button class="btn btn-primary btn-block" id="submitBtn"' + (errs.length ? ' disabled' : '') + '>' + icon('check') + (F.locked ? 'Save and resubmit' : 'Submit for approval') + '</button>' +
      (F.locked ? '<a class="btn btn-ghost btn-block" href="#/requests">Cancel</a>' : '<button class="btn btn-ghost btn-block" id="clearBtn">' + icon('refresh') + 'Clear item details</button>');
    IM.hydrate(box);
    $('#submitBtn').onclick = submit;
    const cb = $('#clearBtn'); if (cb) cb.onclick = () => { clearDetails(); drawForm(); };
  }
  function localErrors() {
    const E = [], c = catRow() || {};
    if (!F.locked) {
      if (!F.SeasonID) E.push('Choose a season.');
      if (!F.CategoryID) E.push('Choose a category.');
      if (!F.SupplierID) E.push('Choose a supplier.');
      if (fabricRule() === 'Mandatory' && !F.FabricTypeID) E.push('Choose a fabric type.');
      if (F.ItemType === 'Core' && !String(F.DesignNo).trim()) E.push('Type the design number.');
    }
    if (!String(F.SupplierItemCode).trim()) E.push('Enter the supplier item code.');
    if (!F.Colours.length) E.push('Choose at least one colour.');
    else if (c.SupplierColourRule === 'Mandatory' && F.Colours.some(x => !x.n)) E.push('Enter the supplier colour no. for every colour.');
    if (!F.Fits.length) E.push('Choose at least one fit.');
    if (!F.Sizes.length) E.push('Choose at least one size.');
    if (!(Number(F.BaseMRP) > 0)) E.push('Enter the MRP.');
    return E;
  }
  function payload() {
    return { RequestID: F.RequestID, ItemKind: 'FG', ItemType: F.ItemType, SeasonID: F.SeasonID, CategoryID: F.CategoryID, SupplierID: F.SupplierID, FabricTypeID: F.FabricTypeID,
      DesignNo: F.DesignNo, SupplierItemCode: F.SupplierItemCode, Colours: F.Colours, Fits: F.Fits.join(', '), Sizes: F.Sizes.join(', '), BaseMRP: F.BaseMRP, MarginPct: F.MarginPct };
  }
  // ask the server for the next design number and the duplicate check (it has every request)
  function schedulePreview(delay) {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      if (!F.CategoryID || !F.SeasonID) { lastPreview = { designNo: '', errors: [] }; drawSummary(); return; }
      const seq = ++previewSeq;
      try { const r = await IM.api('/api/request/preview', { row: payload() }); if (seq === previewSeq) { lastPreview = r; drawSummary(); } }
      catch (e) { /* the summary still shows local checks */ }
    }, delay === undefined ? 450 : delay);
  }
  function clearDetails() { F.SupplierItemCode = ''; F.DesignNo = ''; F.BaseMRP = ''; F.MarginPct = ''; F.Colours = []; const c = catRow() || {}; F.Fits = ids(c.DefaultFits).filter(x => fitsFor(F.CategoryID).some(f => f.FitID === x)); F.Sizes = ids(c.DefaultSizes).filter(x => sizesFor(F.CategoryID).some(s => s.SizeID === x)); }

  async function submit() {
    const b = $('#submitBtn'); b.disabled = true; b.innerHTML = icon('loader', 'spin-i') + 'Submitting...';
    try {
      const r = (await IM.api('/api/request/save', { row: payload() })).request;
      if (!F.locked) IM.store.set(lastKey(), JSON.stringify({ SeasonID: F.SeasonID, CategoryID: F.CategoryID, SupplierID: F.SupplierID, FabricTypeID: F.FabricTypeID }));
      const wasEdit = F.locked;
      IM.dialog('<h3>' + icon('check') + (wasEdit ? 'Saved and resubmitted' : 'Submitted for approval') + '</h3>' +
        '<p>Design <strong>' + esc(r.DesignNo) + '</strong> (' + esc(r.RequestID) + ') with <strong>' + esc(r.LineCount) + '</strong> item lines is now <strong>Pending</strong> approval.</p>' +
        '<div class="actions">' + (wasEdit ? '' : '<button class="btn" id="dAnother">' + icon('plus') + 'Create another</button>') + '<button class="btn btn-primary" id="dList">' + icon('inbox') + 'My requests</button></div>', (d, close) => {
        const a = d.querySelector('#dAnother');
        if (a) a.onclick = () => { close(); clearDetails(); lastPreview = { designNo: '', errors: [] }; drawForm(); };
        d.querySelector('#dList').onclick = () => { close(); location.hash = '#/requests'; };
      });
      if (!wasEdit) { clearDetails(); lastPreview = { designNo: '', errors: [] }; drawForm(); }
    } catch (e) {
      IM.toast(e.message.split('\n')[0], true);
      lastPreview = { designNo: lastPreview.designNo, errors: e.message.split('\n') }; drawSummary();
    }
  }

  function emptyCard(ic, text) { return '<div class="card empty">' + icon(ic) + '<p>' + esc(text) + '</p></div>'; }

  // ================================================================ MY REQUESTS
  const RQ = { status: 'All', q: '', season: '', cat: '', mine: true, page: 1 };
  let reqTimer = null;
  IM.pages.requests = function () {
    IM.setTitle('My Requests', 'Item entry');
    const cats = rows('Categories'), seasons = rows('Seasons');
    $('#content').innerHTML = '<div class="card">' +
      '<div class="toolbar"><div class="seg" id="rqStatus"></div><span class="grow"></span><a class="btn btn-primary" href="#/fg">' + icon('plus') + 'New FG design</a></div>' +
      '<div class="toolbar">' +
      '<div class="search input-icon">' + icon('search') + '<input id="rqQ" placeholder="Design no., request no., supplier item code" value="' + esc(RQ.q) + '"></div>' +
      '<select id="rqSeason"><option value="">All seasons</option>' + seasons.map(s => '<option value="' + esc(s.SeasonID) + '"' + (RQ.season === s.SeasonID ? ' selected' : '') + '>' + esc(s.SeasonCode + ' · ' + s.SeasonName + ' ' + s.Year) + '</option>').join('') + '</select>' +
      '<select id="rqCat"><option value="">All categories</option>' + cats.map(c => '<option value="' + esc(c.CategoryID) + '"' + (RQ.cat === c.CategoryID ? ' selected' : '') + '>' + esc(c.Brand + ' - ' + c.Category) + '</option>').join('') + '</select>' +
      '<label class="switch"><input type="checkbox" id="rqMine"' + (RQ.mine ? ' checked' : '') + '><i></i><b>Only mine</b></label>' +
      '</div><div id="rqBody"><div class="loading">' + icon('loader') + 'Loading...</div></div></div>';
    $('#rqQ').oninput = e => { RQ.q = e.target.value; RQ.page = 1; clearTimeout(reqTimer); reqTimer = setTimeout(loadRequests, 350); };
    $('#rqSeason').onchange = e => { RQ.season = e.target.value; RQ.page = 1; loadRequests(); };
    $('#rqCat').onchange = e => { RQ.cat = e.target.value; RQ.page = 1; loadRequests(); };
    $('#rqMine').onchange = e => { RQ.mine = e.target.checked; RQ.page = 1; loadRequests(); };
    loadRequests();
  };
  async function loadRequests() {
    const qs = new URLSearchParams({ status: RQ.status, q: RQ.q, season: RQ.season, cat: RQ.cat, mine: RQ.mine ? '1' : '', page: RQ.page, kind: 'FG' });
    let r;
    try { r = await IM.api('/api/requests?' + qs); } catch (e) { const b = $('#rqBody'); if (b) b.innerHTML = emptyCard('alert', e.message); return; }
    const body = $('#rqBody'); if (!body) return;
    $('#rqStatus').innerHTML = ['All', 'Pending', 'Approved', 'Rejected'].map(s => '<button type="button" class="' + (RQ.status === s ? 'on' : '') + '" data-st="' + s + '">' + s + ' <span class="count">' + (r.counts[s] || 0) + '</span></button>').join('');
    $('#rqStatus').querySelectorAll('[data-st]').forEach(b => b.onclick = () => { RQ.status = b.dataset.st; RQ.page = 1; loadRequests(); });
    if (!r.rows.length) { body.innerHTML = '<div class="empty">' + icon(r.counts.All ? 'search' : 'inbox') + '<p>' + (r.counts.All ? 'Nothing matches your filters.' : 'No requests yet. <a href="#/fg">Create your first FG design</a>.') + '</p></div>'; return; }
    body.innerHTML = '<div class="table-wrap"><table class="grid"><thead><tr><th>Design no.</th><th>Request</th><th>Type</th><th>Season</th><th>Category</th><th>Supplier</th><th>Supplier item code</th><th class="num">Lines</th><th class="num">MRP</th><th>Status</th><th>Created</th></tr></thead><tbody>' +
      r.rows.map(x => '<tr data-id="' + esc(x.RequestID) + '"><td class="code-cell">' + esc(x.DesignNo) + '</td><td class="id-cell">' + esc(x.RequestID) + '</td><td>' + esc(x.ItemType) + '</td><td>' + esc(x.SeasonCode) + '</td><td>' + esc(name.cat(x.CategoryID)) + '</td><td>' + esc(name.sup(x.SupplierID)) + '</td><td>' + esc(x.SupplierItemCode) + '</td><td class="num">' + esc(x.LineCount) + '</td><td class="num">' + money(x.BaseMRP) + '</td><td>' + statusPill(x.Status) + '</td><td><span class="who">' + esc(x.CreatedBy) + '</span><small class="muted">' + esc(x.CreatedAt) + '</small></td></tr>').join('') +
      '</tbody></table></div>' + IM.pager(r.page, r.pages, r.total, r.total);
    body.querySelectorAll('tbody tr').forEach(tr => tr.onclick = () => openRequest(tr.dataset.id));
    body.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { RQ.page = Number(b.dataset.page); loadRequests(); });
  }

  async function openRequest(id) {
    const d = IM.showDrawer({ kicker: 'Request ' + id, title: 'Loading...', body: '<div class="loading">' + icon('loader') + '</div>' });
    let r;
    try { r = (await IM.api('/api/request?id=' + encodeURIComponent(id))).request; } catch (e) { d.form.innerHTML = '<div class="form-error">' + esc(e.message) + '</div>'; return; }
    $('#drawerTitle').textContent = r.DesignNo;
    const c = byId('Categories', 'CategoryID', r.CategoryID) || {}, big = ids(c.BigSizes), m = Number(r.MarginUsed) || 0, mrp = Number(r.BaseMRP);
    const sizes = ids(r.Sizes), normal = sizes.filter(s => !big.includes(s)), bigSel = sizes.filter(s => big.includes(s)), extra = Number(c.BigSizeExtra) || 0;
    const kv = (k, v) => '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>';
    d.form.innerHTML =
      '<div class="detail-top">' + statusPill(r.Status) + '<span class="muted">' + esc(r.ItemType) + ' · ' + esc(r.LineCount) + ' item lines</span></div>' +
      (r.Status === 'Rejected' && r.Remarks ? '<div class="form-error">' + esc(r.Remarks) + '</div>' : '') +
      '<dl class="kv">' + kv('Season', esc(name.season(r.SeasonID))) + kv('Category', esc(name.cat(r.CategoryID))) + kv('Supplier', esc(name.sup(r.SupplierID))) + kv('Supplier item code', esc(r.SupplierItemCode)) +
      (r.FabricTypeID ? kv('Fabric type', esc(name.fab(r.FabricTypeID))) : '') +
      kv('Fits', IM.chipsHtml('Fits', r.Fits, 20)) + kv('Sizes', IM.chipsHtml('Sizes', r.Sizes, 30)) + '</dl>' +
      '<div><h4 class="mini-title">Colours</h4><table class="grid mini"><thead><tr><th>Colour</th><th>Supplier colour no.</th></tr></thead><tbody>' + r.Colours.map(x => '<tr><td>' + esc(name.col(x.c)) + '</td><td>' + esc(x.n || '-') + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div><h4 class="mini-title">Price · margin ' + esc(m) + '%' + (r.MarginPct === '' ? ' (standard)' : '') + '</h4><table class="grid mini"><thead><tr><th>Sizes</th><th class="num">MRP</th><th class="num">WSP</th></tr></thead><tbody>' +
      (normal.length ? '<tr><td>' + esc(normal.map(name.size).join(', ')) + '</td><td class="num">' + money(mrp) + '</td><td class="num">' + money(wspFor(mrp, m)) + '</td></tr>' : '') +
      (bigSel.length ? '<tr><td>' + esc(bigSel.map(name.size).join(', ')) + '</td><td class="num">' + money(mrp + extra) + '</td><td class="num">' + money(wspFor(mrp + extra, m)) + '</td></tr>' : '') + '</tbody></table></div>' +
      '<div class="audit"><span>Created by ' + esc(r.CreatedBy) + ' on ' + esc(r.CreatedAt) + '</span>' + (r.UpdatedAt && r.UpdatedAt !== r.CreatedAt ? '<span>Last changed by ' + esc(r.UpdatedBy) + ' on ' + esc(r.UpdatedAt) + '</span>' : '') + (r.ApprovedAt ? '<span>' + esc(r.Status) + ' by ' + esc(r.ApprovedBy) + ' on ' + esc(r.ApprovedAt) + '</span>' : '') + '</div>';
    if (r.CanEdit) {
      d.foot.insertAdjacentHTML('afterbegin', '<a class="btn btn-primary" href="#/fg/' + esc(r.RequestID) + '">' + icon('edit') + 'Edit</a>');
      d.foot.querySelector('a').onclick = () => d.close();
    }
  }
})();
