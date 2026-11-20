/* Item Master - ERP Export: approved designs as the ERP bulk upload files (FG and Fabric), in the client's column order. Uses window.IM. */
(function () {
  'use strict';
  const IM = window.IM, S = IM.S, $ = IM.$, esc = IM.esc, icon = IM.icon;
  const KINDS = [
    { k: 'FG', title: 'Finished goods', ico: 'filePlus', file: 'ERP FG upload', unit: 'item lines' },
    { k: 'Fabric', title: 'Fabric', ico: 'scroll', file: 'ERP Fabric upload', unit: 'colour lines' }];
  const num = n => Number(n || 0).toLocaleString('en-IN');

  IM.pages.erp = function () {
    IM.setTitle('ERP Export', 'ERP');
    if (S.user.Role !== 'Admin') { $('#content').innerHTML = '<div class="card empty">' + icon('lock') + '<p>Only an admin can export to the ERP.</p></div>'; return; }
    $('#content').innerHTML =
      '<div class="card card-pad ap-steps">' +
      '<div class="ap-step"><span class="ap-num">1</span><div><strong>Download</strong><small>Every approved design not exported yet goes into one file, in the ERP upload column order.</small></div></div>' +
      '<div class="ap-step"><span class="ap-num">2</span><div><strong>Upload to the ERP</strong><small>Use the ERP bulk upload. The designs are marked as exported, so the next file has only new ones.</small></div></div>' +
      '<div class="ap-step"><span class="ap-num">3</span><div><strong>Need it again?</strong><small>Every export is listed below and can be downloaded again at any time.</small></div></div>' +
      '</div>' +
      '<div class="erp-cards" id="erpCards"><div class="loading">' + icon('loader') + 'Loading...</div></div>' +
      '<div class="card"><div class="toolbar"><h3 class="section-title" style="margin:0">' + icon('database') + 'Past exports</h3></div><div id="erpHist"></div></div>';
    load();
  };

  async function load() {
    let r;
    try { r = await IM.api('/api/erp/summary'); }
    catch (e) { const c = $('#erpCards'); if (c) c.innerHTML = '<div class="card empty">' + icon('alert') + '<p>' + esc(e.message) + '</p></div>'; return; }
    const cards = $('#erpCards'); if (!cards) return;
    cards.innerHTML = KINDS.map(K => {
      const p = r.pending[K.k] || { designs: 0, lines: 0 };
      return '<div class="card card-pad erp-card"><div class="erp-card-head"><span class="tile-ico">' + icon(K.ico) + '</span><div><strong>' + K.title + '</strong><small>Ready to export</small></div></div>' +
        '<div class="erp-count"><div><b>' + num(p.designs) + '</b><span>designs</span></div><div><b>' + num(p.lines) + '</b><span>' + K.unit + '</span></div></div>' +
        '<button class="btn btn-primary btn-block" data-kind="' + K.k + '"' + (p.designs ? '' : ' disabled') + '>' + icon('download') + (p.designs ? 'Download ' + K.title.toLowerCase() + ' file' : 'Nothing new to export') + '</button></div>';
    }).join('');
    cards.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => confirmExport(b.dataset.kind, r.pending[b.dataset.kind]));
    const h = $('#erpHist');
    if (!r.batches.length) { h.innerHTML = '<div class="empty">' + icon('inbox') + '<p>No exports yet.</p></div>'; return; }
    h.innerHTML = '<div class="table-wrap"><table class="grid"><thead><tr><th>Exported at</th><th>Kind</th><th class="num">Designs</th><th class="num">Lines</th><th>By</th><th></th></tr></thead><tbody>' +
      r.batches.map(b => '<tr><td class="id-cell">' + esc(b.batch) + '</td><td>' + (b.kind === 'Fabric' ? 'Fabric' : 'Finished goods') + '</td><td class="num">' + num(b.designs) + '</td><td class="num">' + num(b.lines) + '</td><td>' + esc(b.by) + '</td>' +
        '<td class="num"><button class="btn btn-sm" data-again="' + esc(b.batch) + '" data-k="' + esc(b.kind) + '">' + icon('download') + 'Download again</button></td></tr>').join('') + '</tbody></table></div>';
    h.querySelectorAll('[data-again]').forEach(b => b.onclick = () => run(b.dataset.k, b.dataset.again, b));
  }

  function confirmExport(kind, p) {
    const K = KINDS.find(x => x.k === kind);
    IM.dialog('<h3>' + icon('download') + 'Export ' + esc(K.title.toLowerCase()) + '?</h3>' +
      '<p><strong>' + num(p.designs) + '</strong> approved design' + (p.designs === 1 ? '' : 's') + ' (' + num(p.lines) + ' ' + K.unit + ') will be downloaded in the ERP upload format and marked as exported.</p>' +
      '<p class="muted" style="font-size:13px">If the download fails, use "Download again" in Past exports. Nothing is lost.</p>' +
      '<div class="actions"><button class="btn" data-dclose>Cancel</button><button class="btn btn-primary" id="erpGo">' + icon('download') + 'Export</button></div>', (d, close) => {
      d.querySelector('#erpGo').onclick = async () => { const b = d.querySelector('#erpGo'); await run(kind, '', b); close(); };
    });
  }

  async function run(kind, batch, btn) {
    const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = icon('loader', 'spin-i') + 'Preparing...';
    try {
      const [X, r] = await Promise.all([IM.loadXlsx(), IM.api('/api/erp/export', { kind, batch })]);
      writeFile(X, r);
      if (!batch) load();
      if (r.warnings.length) IM.dialog('<h3>' + icon('alert') + 'Downloaded, with gaps to check</h3><p>' + num(r.rows.length) + ' lines from ' + num(r.designs) + ' designs. Some cells are blank:</p><ul class="erp-warn">' +
        r.warnings.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul><p class="muted" style="font-size:13px">Fit codes and HSN come from the masters: fill them there, then use "Download again". A missing CP or rate on an older design has to be typed into the Excel file.</p><div class="actions"><button class="btn btn-primary" data-dclose>OK</button></div>');
      else IM.toast('Downloaded ' + num(r.rows.length) + ' lines from ' + num(r.designs) + ' designs.');
    } catch (e) { IM.toast(e.message, true); }
    finally { if (document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = old; } }
  }

  // Plain sheet, header in row 1, one row per line: the shape the ERP bulk upload reads.
  function writeFile(X, r) {
    const ws = X.utils.aoa_to_sheet([r.header].concat(r.rows));
    ws['!cols'] = r.header.map((h, i) => ({ wch: Math.min(40, Math.max(h.length + 2, ...r.rows.slice(0, 200).map(x => String(x[i] === undefined ? '' : x[i]).length + 1))) }));
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, 'Sheet1');
    const K = KINDS.find(x => x.k === r.kind);
    X.writeFile(wb, K.file + ' ' + String(r.batch).replace(/:/g, '').replace(/\s+/g, ' ') + '.xlsx');
  }
})();
