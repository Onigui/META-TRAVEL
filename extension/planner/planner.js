import { localTravelApi } from '../lib/travelEngine.js';
import { getSearchParamsFromForm } from '../lib/searchFormHelpers.js';
import { initPlaceAutocompletes } from '../lib/placeAutocomplete.js';
import { renderOptionCard, bindOptionCards, renderDataDisclaimer } from '../lib/cardRender.js';

const travelApi = localTravelApi;

const selection = {
  flight: null,
  hotel: null,
  car: null,
  allInclusive: null,
};

let searchResults = null;
let checkoutSession = null;
let currentCheckoutStep = 0;

const TYPE_LABELS = {
  flight: 'Voo',
  hotel: 'Hotel',
  car: 'Carro',
  allInclusive: 'All inclusive',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function setStatus(message, isError = false) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.classList.remove('hidden');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
  document.getElementById(`panel-${tabId}`).classList.remove('hidden');
  if (tabId === 'captures') renderCaptures();
}

function renderOptionCardLocal(item, type) {
  return renderOptionCard(item, type, {
    selected: selection[type]?.id === item.id,
    formatCurrency,
  });
}

function updateAirportNote(noteId, place) {
  const note = document.getElementById(noteId);
  if (!note) return;
  if (place?.airportName) {
    note.textContent = place.airportName;
    note.classList.remove('hidden');
  } else {
    note.textContent = '';
    note.classList.add('hidden');
  }
}

function renderList(containerId, items, type) {
  const container = document.getElementById(containerId);
  if (!items?.length) {
    container.innerHTML = '<p class="muted small">Nenhuma opção para este destino.</p>';
    return;
  }
  container.innerHTML = items.map((item) => renderOptionCardLocal(item, type)).join('');

  bindOptionCards(container, items, type, {
    onToggle: (item, id) => {
      selection[type] = selection[type]?.id === id ? null : item;
      renderList(containerId, items, type);
      document.getElementById('summary').classList.remove('hidden');
      document.getElementById('checkout-btn').classList.add('hidden');
      renderSelectionPreview();
      saveSelection();
    },
  });
}

function renderSelectionPreview() {
  const parts = [selection.flight, selection.hotel, selection.car, selection.allInclusive].filter(Boolean);
  const content = document.getElementById('summary-content');

  if (!parts.length) {
    content.innerHTML = '<p class="muted small">Selecione itens acima para montar sua viagem.</p>';
    return;
  }

  content.innerHTML = parts
    .map(
      (item) => `
        <div class="component-row">
          <span>${item.name}</span>
          <strong>${formatCurrency(item.basePrice)}</strong>
        </div>
      `
    )
    .join('');
}

function renderSummary(result) {
  const content = document.getElementById('summary-content');
  const componentsHtml = result.components
    .map(
      (c) => `
        <div class="component-row">
          <div>
            <strong>${c.name}</strong>
            ${c.partner ? `<div class="partner-badge">${c.partner.name}: -${formatCurrency(c.discount)}</div>` : ''}
          </div>
          <strong>${formatCurrency(c.finalPrice)}</strong>
        </div>
      `
    )
    .join('');

  content.innerHTML = `
    ${componentsHtml}
    <div class="metrics">
      <div class="metric"><span>Subtotal</span><strong>${formatCurrency(result.subtotal)}</strong></div>
      <div class="metric"><span>Descontos</span><strong>- ${formatCurrency(result.totalDiscount)}</strong></div>
      <div class="metric highlight"><span>Total</span><strong>${formatCurrency(result.total)}</strong></div>
    </div>
    ${result.bookingLinks?.length ? `
      <div class="booking-links">
        ${result.bookingLinks.map((l) => `
          <a href="#" class="booking-link" data-url="${l.url}">${TYPE_LABELS[l.type]}: ${l.name}</a>
        `).join('')}
      </div>
    ` : ''}
    <p class="muted small">${result.note}</p>
  `;

  content.querySelectorAll('.booking-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl(link.dataset.url);
    });
  });

  document.getElementById('checkout-btn').classList.remove('hidden');
}

function openExternalUrl(url) {
  if (!url) return;
  chrome.tabs.create({ url, active: true });
}

function renderCheckoutModal() {
  if (!checkoutSession) return;

  const completed = checkoutSession.steps.filter((s) => s.status === 'completed').length;
  const total = checkoutSession.steps.length;

  document.getElementById('checkout-progress').innerHTML = `
    <strong>${completed}/${total} reservas</strong>
    · Total ${formatCurrency(checkoutSession.total)}
  `;

  document.getElementById('checkout-steps').innerHTML = checkoutSession.steps
    .map((step, idx) => {
      const isActive = idx === currentCheckoutStep;
      const isDone = step.status === 'completed';
      return `
        <div class="checkout-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}">
          <strong>${step.label}: ${step.name}</strong>
          <div class="muted small">${formatCurrency(step.finalPrice)} · ${step.status === 'completed' ? 'Concluído ✓' : 'Pendente'}</div>
          <div class="checkout-step-actions">
            <button type="button" data-open="${idx}">Abrir site</button>
            ${!isDone ? `<button type="button" data-complete="${idx}">Concluí</button>` : ''}
          </div>
        </div>
      `;
    })
    .join('');

  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => openCheckoutStep(Number(btn.dataset.open)));
  });

  document.querySelectorAll('[data-complete]').forEach((btn) => {
    btn.addEventListener('click', () => completeCheckoutStep(Number(btn.dataset.complete)));
  });

  const allDone = checkoutSession.steps.every((s) => s.status === 'completed');
  document.getElementById('checkout-next').classList.toggle('hidden', allDone);
  document.getElementById('checkout-start').classList.toggle('hidden', allDone);
}

function showCheckoutModal() {
  document.getElementById('checkout-modal').classList.remove('hidden');
  renderCheckoutModal();
}

function hideCheckoutModal() {
  document.getElementById('checkout-modal').classList.add('hidden');
}

function openCheckoutStep(stepIndex) {
  if (!checkoutSession) return;
  const step = checkoutSession.steps[stepIndex];
  if (!step) return;
  currentCheckoutStep = stepIndex;
  openExternalUrl(step.trackedUrl || step.goUrl);
  renderCheckoutModal();
}

async function completeCheckoutStep(stepIndex, { autoNext = true } = {}) {
  if (!checkoutSession) return;
  try {
    checkoutSession = await travelApi.completeCheckoutStep(checkoutSession.checkoutId, stepIndex);
    renderCheckoutModal();

    const nextPending = checkoutSession.steps.findIndex((s) => s.status !== 'completed');
    if (autoNext && nextPending >= 0) {
      currentCheckoutStep = nextPending;
      openCheckoutStep(nextPending);
      setStatus(`Etapa concluída. Abrindo próximo item...`);
    } else if (checkoutSession.status === 'completed') {
      setStatus('Todas as reservas concluídas!');
      hideCheckoutModal();
    }
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function startUnifiedCheckout() {
  const parts = [selection.flight, selection.hotel, selection.car, selection.allInclusive].filter(Boolean);
  if (!parts.length) {
    setStatus('Monte a viagem antes do checkout.', true);
    return;
  }

  try {
    checkoutSession = await travelApi.createCheckout(selection);
    currentCheckoutStep = 0;
    showCheckoutModal();
    setStatus(`Checkout criado — ${checkoutSession.stepCount} reserva(s).`);
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function openAllStepsInSequence() {
  if (!checkoutSession) {
    await startUnifiedCheckout();
    if (!checkoutSession) return;
  }

  for (let i = 0; i < checkoutSession.steps.length; i++) {
    if (checkoutSession.steps[i].status === 'completed') continue;
    openCheckoutStep(i);
    await new Promise((r) => setTimeout(r, 800));
  }
  setStatus('Links abertos em abas. Marque cada reserva como concluída.');
}

async function loadPlacesAutocomplete() {
  const form = document.getElementById('search-form');
  initPlaceAutocompletes(form, {
    onSelect: (place, inputEl) => {
      if (inputEl?.id === 'origin-city') {
        updateAirportNote('origin-airport-note', place);
      } else if (inputEl?.id === 'destination-city') {
        updateAirportNote('destination-airport-note', place);
      }
    },
  });
}

async function loadPartners() {
  const data = await travelApi.getPartners();
  document.getElementById('partners-list').innerHTML = data.partners
    .map(
      (p) => `
        <div class="partner-card">
          <strong>${p.name}</strong>
          <span>${p.badge} · ${p.discountPercent}% em ${p.category}</span>
        </div>
      `
    )
    .join('');
}

async function loadApiStatus() {
  const data = await travelApi.getStatus();
  document.getElementById('api-status').textContent =
    `Modo extensão · ${data.partners} parceiros · sem site necessário`;
}

async function renderCaptures() {
  const { captures = [] } = await chrome.storage.local.get({ captures: [] });
  const badge = document.getElementById('captures-badge');
  const list = document.getElementById('captures-list');

  if (captures.length) {
    badge.textContent = String(captures.length);
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  if (!captures.length) {
    list.innerHTML = '<p class="muted small">Navegue em LATAM, GOL, Booking etc. e clique em <strong>Salvar no planejador</strong> no widget.</p>';
    return;
  }

  list.innerHTML = captures
    .map(
      (c, i) => `
        <div class="capture-card">
          <span class="meta">${c.siteName || c.site} · ${new Date(c.savedAt).toLocaleString('pt-BR')}</span>
          <strong>${(c.title || '').slice(0, 60)}</strong>
          <div class="price">${formatCurrency(c.price)}</div>
          <button type="button" class="btn-ghost" data-open-capture="${i}">Abrir página</button>
        </div>
      `
    )
    .join('');

  list.querySelectorAll('[data-open-capture]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cap = captures[Number(btn.dataset.openCapture)];
      if (cap?.url) openExternalUrl(cap.url);
    });
  });
}

async function saveSelection() {
  await chrome.storage.local.set({ tripSelection: selection });
}

async function restoreSelection() {
  const { tripSelection } = await chrome.storage.local.get('tripSelection');
  if (!tripSelection) return;
  Object.assign(selection, tripSelection);
  if ([selection.flight, selection.hotel, selection.car, selection.allInclusive].some(Boolean)) {
    document.getElementById('summary').classList.remove('hidden');
    renderSelectionPreview();
  }
}

function setDefaultDepartureDate() {
  const input = document.getElementById('departure-date');
  const d = new Date();
  d.setDate(d.getDate() + 30);
  input.value = d.toISOString().slice(0, 10);
  input.min = new Date().toISOString().slice(0, 10);
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function setupCheckoutUi() {
  document.getElementById('checkout-btn').addEventListener('click', startUnifiedCheckout);
  document.getElementById('checkout-close').addEventListener('click', hideCheckoutModal);
  document.getElementById('checkout-start').addEventListener('click', () => {
    const first = checkoutSession?.steps.findIndex((s) => s.status !== 'completed') ?? 0;
    openCheckoutStep(first >= 0 ? first : 0);
  });
  document.getElementById('checkout-next').addEventListener('click', () => completeCheckoutStep(currentCheckoutStep));
  document.getElementById('checkout-open-all').addEventListener('click', openAllStepsInSequence);
  document.getElementById('checkout-modal').addEventListener('click', (e) => {
    if (e.target.id === 'checkout-modal') hideCheckoutModal();
  });
}

document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  selection.flight = null;
  selection.hotel = null;
  selection.car = null;
  selection.allInclusive = null;
  checkoutSession = null;

  const params = getSearchParamsFromForm(e.target);
  if (!params.destinationCity) {
    setStatus('Informe o destino.', true);
    return;
  }

  setStatus('Buscando opções...');

  try {
    const data = await travelApi.search(params);

    searchResults = data;
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('summary').classList.add('hidden');
    document.getElementById('checkout-btn').classList.add('hidden');

    const disclaimerEl = document.getElementById('data-disclaimer');
    if (disclaimerEl) {
      const isEstimate = data.dataDisclaimer === 'estimate' || data.mode === 'local';
      disclaimerEl.innerHTML = isEstimate ? renderDataDisclaimer(data.dataSources) : '';
      disclaimerEl.classList.toggle('hidden', !isEstimate);
    }

    renderList('flights-list', data.flights, 'flight');
    renderList('hotels-list', data.hotels, 'hotel');
    renderList('cars-list', data.cars, 'car');
    renderList('allinclusive-list', data.allInclusive, 'allInclusive');

    setStatus(`${data.origin?.city} → ${data.destination?.city}: ${data.flights.length} voos · ${data.hotels.length} hotéis`);
    switchTab('plan');
  } catch (err) {
    setStatus(err.message, true);
  }
});

document.getElementById('build-btn').addEventListener('click', async () => {
  const parts = [selection.flight, selection.hotel, selection.car, selection.allInclusive].filter(Boolean);
  if (!parts.length) {
    setStatus('Selecione ao menos um item.', true);
    return;
  }

  setStatus('Calculando descontos...');
  try {
    const data = await travelApi.build(selection);
    renderSummary(data);
    setStatus('Viagem montada! Use "Reservar tudo" para checkout.');
  } catch (err) {
    setStatus(err.message, true);
  }
});

document.getElementById('clear-captures').addEventListener('click', async () => {
  await chrome.storage.local.set({ captures: [] });
  renderCaptures();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.captures) {
    renderCaptures();
    const badge = document.getElementById('captures-badge');
    const count = changes.captures.newValue?.length || 0;
    if (count) {
      badge.textContent = String(count);
      badge.classList.remove('hidden');
    }
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'FOCUS_CAPTURES') switchTab('captures');
});

async function boot() {
  setupTabs();
  setupCheckoutUi();
  setDefaultDepartureDate();
  await loadPlacesAutocomplete();
  await loadPartners();
  await loadApiStatus();
  await restoreSelection();
  await renderCaptures();
}

boot();
