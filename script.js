const $ = (id) => document.getElementById(id);
let mode = 'invoice',
  logoData = '',
  signatureData = '',
  stampEnabled = true;
let items = [{ desc: 'Professional service', qty: 1, rate: 0, tax: 0 }];

function init() {
  const today = new Date(),
    next = new Date(today);
  next.setDate(next.getDate() + 30);

  $('issueDate').value = iso(today);
  $('dueDate').value = iso(next);

  [
    'businessName',
    'docNo',
    'businessEmail',
    'businessPhone',
    'businessAddress',
    'customerName',
    'customerEmail',
    'customerAddress',
    'reference',
    'issueDate',
    'dueDate',
    'currency',
    'discount',
    'shipping',
    'terms',
    'notes',
    'legal',
    'preparedBy',
    'approvedBy'
  ].forEach((id) => $(id).addEventListener('input', render));

  renderItems();
  render();
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function money(n) {
  let c = $('currency').value;
  return (c === 'AED' || c === 'UGX' || c === 'KES' ? c + ' ' : c) + (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

function switchMode(m) {
  mode = m;
  document.querySelectorAll('.nav-btn[data-mode],.mode-tab[data-mode]').forEach((b) => {
    b.classList.toggle('active', b.dataset.mode === m);
  });

  const titles = {
    invoice: 'Invoice Studio',
    quote: 'Quotation Studio',
    proforma: 'Proforma Invoice Studio'
  };

  $('pageTitle').textContent = titles[m];
  $('statType').textContent = m === 'quote' ? 'Quotation' : m === 'proforma' ? 'Proforma Invoice' : 'Invoice';
  $('docNo').value = (m === 'quote' ? 'QUO-' : m === 'proforma' ? 'PRO-' : 'INV-') + Date.now().toString().slice(-5);
  $('dueLabel').textContent = m === 'quote' ? 'Valid until' : m === 'proforma' ? 'Expiry date' : 'Due date';
  render();
}

function addItem() {
  items.push({ desc: 'New item', qty: 1, rate: 0, tax: 0 });
  renderItems();
  render();
}

function removeItem(i) {
  if (items.length > 1) {
    items.splice(i, 1);
    renderItems();
    render();
  }
}

function renderItems() {
  $('itemsBody').innerHTML = items.map((x, i) => `
    <tr>
      <td><input value="${esc(x.desc)}" oninput="items[${i}].desc=this.value;render()"></td>
      <td><input type="number" min="0" step=".01" value="${x.qty}" oninput="items[${i}].qty=+this.value;render()"></td>
      <td><input type="number" min="0" step=".01" value="${x.rate}" oninput="items[${i}].rate=+this.value;render()"></td>
      <td><input type="number" min="0" step=".01" value="${x.tax}" oninput="items[${i}].tax=+this.value;render()"></td>
      <td class="money">${money(x.qty * x.rate * (1 + x.tax / 100))}</td>
      <td><button class="btn small danger" onclick="removeItem(${i})">×</button></td>
    </tr>
  `).join('');
  $('statItems').textContent = items.length;
}

function totals() {
  let subtotal = items.reduce((a, x) => a + x.qty * x.rate, 0);
  let tax = items.reduce((a, x) => a + x.qty * x.rate * x.tax / 100, 0);
  let discount = subtotal * (Number($('discount').value) || 0) / 100;
  let shipping = Number($('shipping').value) || 0;

  return {
    subtotal,
    tax,
    discount,
    shipping,
    total: subtotal + tax - discount + shipping
  };
}

function render() {
  renderItems();
  const t = totals();
  $('statTotal').textContent = money(t.total);

  const type = mode === 'quote' ? 'QUOTATION' : mode === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE';
  const itemsHtml = items.map((x) => `
    <tr>
      <td>${esc(x.desc)}</td>
      <td>${x.qty}</td>
      <td class="r">${money(x.rate)}</td>
      <td class="r">${x.tax}%</td>
      <td class="r">${money(x.qty * x.rate * (1 + x.tax / 100))}</td>
    </tr>
  `).join('');

  $('paper').innerHTML = `
    <div class="doc-top">
      <div class="biz">
        <div class="logo-box">${logoData ? `<img src="${logoData}">` : 'LOGO'}</div>
        <div>
          <h2>${esc($('businessName').value)}</h2>
          <p>${esc($('businessAddress').value)}</p>
          <p>${esc($('businessEmail').value)} · ${esc($('businessPhone').value)}</p>
        </div>
      </div>
      <div class="doc-meta">
        <h1>${type}</h1>
        <p><b>No:</b> ${esc($('docNo').value)}</p>
        <p><b>Date:</b> ${esc($('issueDate').value)}</p>
        <p><b>${esc($('dueLabel').textContent)}:</b> ${esc($('dueDate').value)}</p>
        ${$('reference').value ? `<p><b>Ref:</b> ${esc($('reference').value)}</p>` : ''}
      </div>
    </div>
    <div class="client-row">
      <div class="client-box">
        <small>Bill / Prepared for</small>
        <strong>${esc($('customerName').value)}</strong>
        <p>${esc($('customerAddress').value)}</p>
        <p>${esc($('customerEmail').value)}</p>
      </div>
      <div class="client-box">
        <small>Payment terms</small>
        <strong>${esc($('terms').value)}</strong>
        <p>Currency: ${esc($('currency').value)}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th class="r">Rate</th>
          <th class="r">Tax</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="paper-bottom">
      <div class="notes">
        <b>Notes</b><br>${esc($('notes').value)}<br><br>
        <b>Terms &amp; Conditions</b><br>${esc($('legal').value)}
      </div>
      <div class="paper-total">
        <div><span>Subtotal</span><b>${money(t.subtotal)}</b></div>
        <div><span>Tax</span><b>${money(t.tax)}</b></div>
        <div><span>Discount</span><b>− ${money(t.discount)}</b></div>
        <div><span>Shipping</span><b>${money(t.shipping)}</b></div>
        <div class="grand"><span>Total</span><b>${money(t.total)}</b></div>
      </div>
    </div>
    <div class="signatures">
      <div class="sig">${signatureData ? `<img src="${signatureData}" style="height:60px;max-width:210px;object-fit:contain">` : ''}<div><b>${esc($('preparedBy').value)}</b><br><small>Prepared / Issued by</small></div></div>
      <div class="sig"><div style="height:60px"></div><div><b>${esc($('approvedBy').value)}</b><br><small>Authorized approval</small></div></div>
    </div>
    <div class="stamp ${stampEnabled ? '' : 'hidden'}">DIGITALLY<br>APPROVED<br>✓</div>
  `;
}

function printDoc() {
  render();
  window.print();
}

function newDocument() {
  if (confirm('Start a new document? Unsaved changes will remain only in the current screen.')) {
    items = [{ desc: 'Professional service', qty: 1, rate: 0, tax: 0 }];
    logoData = '';
    signatureData = '';
    switchMode(mode);
    renderItems();
    render();
  }
}

function duplicateDoc() {
  const old = $('docNo').value;
  $('docNo').value = old + '-COPY';
  render();
  toast('Document duplicated');
}

function saveDraft() {
  const data = {
    mode,
    logoData,
    signatureData,
    stampEnabled,
    items,
    fields: Object.fromEntries([
      'businessName',
      'docNo',
      'businessEmail',
      'businessPhone',
      'businessAddress',
      'customerName',
      'customerEmail',
      'customerAddress',
      'reference',
      'issueDate',
      'dueDate',
      'currency',
      'discount',
      'shipping',
      'terms',
      'notes',
      'legal',
      'preparedBy',
      'approvedBy'
    ].map((id) => [id, $(id).value]))
  };

  localStorage.setItem('ledgerproDraft', JSON.stringify(data));
  toast('Draft saved to this browser');
}

function openSaved() {
  const raw = localStorage.getItem('ledgerproDraft');
  if (!raw) {
    toast('No saved draft found');
    return;
  }

  const d = JSON.parse(raw);
  mode = d.mode || 'invoice';
  logoData = d.logoData || '';
  signatureData = d.signatureData || '';
  stampEnabled = d.stampEnabled !== false;
  items = d.items || items;

  Object.entries(d.fields || {}).forEach(([id, v]) => {
    if ($(id)) $(id).value = v;
  });

  switchMode(mode);
  renderItems();
  render();
  toast('Draft restored');
}

function loadLogo(e) {
  const f = e.target.files[0];
  if (!f) return;

  const r = new FileReader();
  r.onload = () => {
    logoData = r.result;
    render();
  };
  r.readAsDataURL(f);
}

function openSignature() {
  $('modalBody').innerHTML = `
    <div class="modal-head">
      <h3>Signature &amp; Digital Stamp</h3>
      <button class="btn" onclick="closeModal()">Close</button>
    </div>
    <p style="color:#6b7280">Draw a signature below. It is stored only in this browser and embedded into the document preview.</p>
    <canvas class="signature-pad" id="sigCanvas" width="900" height="300"></canvas>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn danger" onclick="clearSig()">Clear</button>
      <button class="btn primary" onclick="useSig()">Use signature</button>
      <label class="btn"><input type="checkbox" id="stampToggle" ${stampEnabled ? 'checked' : ''}> Digital stamp</label>
    </div>
  `;

  $('modal').classList.add('open');
  setupCanvas();
}

function setupCanvas() {
  const c = $('sigCanvas'),
    ctx = c.getContext('2d');
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  let drawing = false;

  const pos = (e) => {
    const r = c.getBoundingClientRect(),
      p = e.touches ? e.touches[0] : e;
    return {
      x: (p.clientX - r.left) * c.width / r.width,
      y: (p.clientY - r.top) * c.height / r.height
    };
  };

  const start = (e) => {
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  };

  const move = (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  };

  const end = () => {
    drawing = false;
  };

  c.onmousedown = start;
  c.onmousemove = move;
  c.onmouseup = end;
  c.onmouseleave = end;
  c.ontouchstart = start;
  c.ontouchmove = move;
  c.ontouchend = end;
}

function clearSig() {
  const c = $('sigCanvas');
  c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

function useSig() {
  signatureData = $('sigCanvas').toDataURL('image/png');
  stampEnabled = $('stampToggle').checked;
  closeModal();
  render();
  toast('Signature and stamp updated');
}

function openSettings() {
  $('modalBody').innerHTML = `
    <div class="modal-head">
      <h3>Document Settings</h3>
      <button class="btn" onclick="closeModal()">Close</button>
    </div>
    <div class="grid" style="margin-top:18px">
      <div class="field">
        <label>Default currency</label>
        <select id="setCurrency">
          <option>$</option>
          <option>AED</option>
          <option>€</option>
          <option>£</option>
          <option>UGX</option>
          <option>KES</option>
        </select>
      </div>
      <div class="field">
        <label>Default tax</label>
        <input id="setTax" type="number" value="0">
      </div>
    </div>
    <div style="margin-top:18px">
      <button class="btn primary" onclick="applySettings()">Apply settings</button>
    </div>
  `;

  $('modal').classList.add('open');
  $('setCurrency').value = $('currency').value;
}

function applySettings() {
  $('currency').value = $('setCurrency').value;
  items.forEach((x) => x.tax = Number($('setTax').value) || x.tax);
  closeModal();
  render();
  toast('Settings applied');
}

function closeModal() {
  $('modal').classList.remove('open');
}

function downloadHTML() {
  const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'LedgerPro-document.html';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('HTML copy downloaded');
}

function toast(s) {
  const t = $('toast');
  t.textContent = s;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

$('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});

init();
