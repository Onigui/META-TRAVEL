const API_BASE = '/api';
const IS_STATIC = window.location.hostname.includes('github.io');

function showStaticNotice() {
  const msg = 'Painel admin requer servidor Node.js. No GitHub Pages use apenas o planejador em index.html.';
  setStatus(msg, true);
  document.getElementById('partners-admin').innerHTML = `<p>${msg}</p>`;
  document.getElementById('captures-list').innerHTML = `<p>${msg}</p>`;
  document.getElementById('checkouts-list').innerHTML = `<p>${msg}</p>`;
}

function getToken() {
  return document.getElementById('admin-token').value.trim() || 'meta-travel-dev';
}

function setStatus(msg, isError = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.classList.toggle('error', isError);
  el.classList.remove('hidden');
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getToken(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

async function loadPartners() {
  try {
    const data = await adminFetch('/admin/partners');
    document.getElementById('partners-admin').innerHTML = data.partners
      .map(
        (p) => `
          <div class="partner-card">
            <strong>${p.name}</strong>
            <span>${p.id} · ${p.category} · ${p.discountPercent}% off</span>
            <span>${p.badge || ''} ${p.active === false ? '(inativo)' : ''}</span>
            <button type="button" data-delete="${p.id}" style="margin-top:8px;width:100%">Remover</button>
          </div>
        `
      )
      .join('');

    document.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm(`Remover parceiro ${btn.dataset.delete}?`)) return;
        await adminFetch(`/admin/partners/${btn.dataset.delete}`, { method: 'DELETE' });
        loadPartners();
        setStatus('Parceiro removido.');
      });
    });
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function loadCaptures() {
  try {
    const data = await adminFetch('/captures?limit=10');
    document.getElementById('captures-list').innerHTML =
      data.captures
        .map(
          (c) => `
            <div class="list-item">
              <strong>${c.site} · ${c.category}</strong>
              <div>${c.title?.slice(0, 60) || '—'} · R$ ${c.price} · ${new Date(c.capturedAt).toLocaleString('pt-BR')}</div>
            </div>
          `
        )
        .join('') || '<div class="list-item">Nenhuma captura ainda. Use a extensão Chrome.</div>';
  } catch {
    document.getElementById('captures-list').innerHTML =
      '<div class="list-item">Informe o token de admin para ver capturas.</div>';
  }
}

document.getElementById('partner-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await adminFetch('/admin/partners', {
      method: 'POST',
      body: JSON.stringify({
        id: document.getElementById('p-id').value.trim().toLowerCase(),
        name: document.getElementById('p-name').value.trim(),
        category: document.getElementById('p-category').value,
        discountPercent: Number(document.getElementById('p-discount').value),
        badge: document.getElementById('p-badge').value.trim() || 'Parceiro',
        active: true,
      }),
    });
    e.target.reset();
    loadPartners();
    setStatus('Parceiro salvo com sucesso.');
  } catch (err) {
    setStatus(err.message, true);
  }
});

async function loadCheckouts() {
  try {
    const data = await adminFetch('/admin/checkouts?limit=15');
    document.getElementById('checkouts-list').innerHTML =
      data.checkouts
        .map(
          (c) => `
            <div class="list-item">
              <strong>${c.id} · ${c.status}</strong>
              <div>
                Total ${c.total} · Comissão est. ${c.estimatedCommission} ·
                ${c.completedSteps}/${c.stepCount} etapas · ${c.clicksCount} cliques
                · ${new Date(c.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>
          `
        )
        .join('') || '<div class="list-item">Nenhum checkout registrado ainda.</div>';
  } catch {
    document.getElementById('checkouts-list').innerHTML =
      '<div class="list-item">Informe o token de admin para ver checkouts.</div>';
  }
}

document.getElementById('admin-token').addEventListener('change', () => {
  loadPartners();
  loadCaptures();
  loadCheckouts();
});

loadPartners();
loadCaptures();
loadCheckouts();

if (IS_STATIC) showStaticNotice();
