// Admin console: token auth + waitlist management + simple analytics
const KEY = 'ic_admin_token';
const $ = s => document.querySelector(s);

const loginBox = $('#loginBox');
const dash = $('#dash');
const msg = $('#adminMsg');
let entries = [];

function token() { return localStorage.getItem(KEY) || ''; }

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json' }
  });
  if (res.status === 401) { lock('Invalid or expired token.'); throw new Error('unauthorized'); }
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  return res.json();
}

function lock(err) {
  localStorage.removeItem(KEY);
  dash.hidden = true;
  loginBox.hidden = false;
  $('#loginErr').textContent = err || '';
}

function unlock() {
  loginBox.hidden = true;
  dash.hidden = false;
  loadAll();
}

function setMsg(t, isErr) {
  msg.textContent = t || '';
  msg.classList.toggle('err', !!isErr);
}

async function loadAll() {
  try {
    const [list, stats] = await Promise.all([
      api('/api/admin'),
      api('/api/admin?action=stats')
    ]);
    entries = list.entries;
    renderStats(stats);
    renderChart(stats.daily);
    renderDomains(stats.domains);
    renderTable();
    setMsg('');
  } catch (e) {
    if (e.message !== 'unauthorized') setMsg('Failed to load — check connection.', true);
  }
}

function renderStats(s) {
  $('#stTotal').textContent = s.total;
  $('#st7').textContent = s.last7;
  $('#st30').textContent = s.last30;
  $('#stDom').textContent = s.domains.length ? new Set(entries.map(e => e.email.split('@')[1])).size : 0;
}

function renderChart(daily) {
  const chart = $('#chart');
  chart.innerHTML = '';
  const max = Math.max(1, ...daily.map(d => d.count));
  for (const d of daily) {
    const bar = document.createElement('div');
    bar.className = 'bar' + (d.count === max && max > 1 ? ' hot' : '');
    bar.style.height = Math.max(2, (d.count / max) * 100) + '%';
    bar.title = `${d.date}: ${d.count}`;
    chart.appendChild(bar);
  }
  $('#chartStart').textContent = daily[0]?.date || '';
  $('#chartEnd').textContent = daily[daily.length - 1]?.date || '';
}

function renderDomains(domains) {
  const box = $('#domains');
  box.innerHTML = '';
  if (!domains.length) { box.innerHTML = '<p class="wl-empty" style="padding:0.5rem">No data yet.</p>'; return; }
  const max = domains[0].count;
  for (const d of domains) {
    const row = document.createElement('div');
    row.className = 'dom-row';
    row.innerHTML = `<span class="dom-name"></span><span class="dom-bar"><i style="width:${(d.count / max) * 100}%"></i></span><span class="dom-n">${d.count}</span>`;
    row.querySelector('.dom-name').textContent = d.domain;
    box.appendChild(row);
  }
}

function renderTable() {
  const q = $('#search').value.trim().toLowerCase();
  const rows = q ? entries.filter(e => e.email.includes(q)) : entries;
  const body = $('#wlBody');
  body.innerHTML = '';
  for (const e of rows) {
    const tr = document.createElement('tr');
    const tdE = document.createElement('td');
    tdE.textContent = e.email;
    const tdD = document.createElement('td');
    tdD.textContent = e.createdAt ? new Date(e.createdAt).toLocaleString() : '—';
    const tdA = document.createElement('td');
    const del = document.createElement('button');
    del.className = 'wl-del';
    del.textContent = 'remove';
    del.addEventListener('click', () => removeEntry(e.email));
    tdA.appendChild(del);
    tr.append(tdE, tdD, tdA);
    body.appendChild(tr);
  }
  $('#wlCount').textContent = `${rows.length} / ${entries.length}`;
  $('#wlEmpty').hidden = rows.length > 0;
}

async function removeEntry(email) {
  if (!confirm(`Remove ${email} from the waitlist?`)) return;
  try {
    await api('/api/admin', { method: 'DELETE', body: JSON.stringify({ email }) });
    entries = entries.filter(e => e.email !== email);
    renderTable();
    setMsg(`${email} removed.`);
  } catch {
    setMsg('Delete failed.', true);
  }
}

async function addEntry() {
  const input = $('#addEmail');
  const email = input.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg('Enter a valid email.', true); return; }
  try {
    const r = await api('/api/admin', { method: 'POST', body: JSON.stringify({ email }) });
    input.value = '';
    setMsg(r.added ? `${email} added.` : `${email} already on the list.`);
    loadAll();
  } catch {
    setMsg('Add failed.', true);
  }
}

function exportCsv() {
  const lines = ['email,joined', ...entries.map(e =>
    `${e.email},${e.createdAt ? new Date(e.createdAt).toISOString() : ''}`)];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `inheritchain-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  localStorage.setItem(KEY, $('#tokenInput').value.trim());
  $('#tokenInput').value = '';
  $('#loginErr').textContent = '';
  unlock();
});
$('#search').addEventListener('input', renderTable);
$('#addBtn').addEventListener('click', addEntry);
$('#addEmail').addEventListener('keydown', e => { if (e.key === 'Enter') addEntry(); });
$('#exportBtn').addEventListener('click', exportCsv);
$('#refreshBtn').addEventListener('click', loadAll);
$('#logoutBtn').addEventListener('click', () => lock(''));

if (token()) unlock();
