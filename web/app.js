import { initTravelApi } from './api.js';
import { getSearchParamsFromForm } from './lib/searchFormHelpers.js';
import { initPlaceAutocompletes } from './lib/placeAutocomplete.js';
import { renderOptionCard, bindOptionCards } from './lib/cardRender.js';

const selection = {
  flight: null,
  hotel: null,
  car: null,
  allInclusive: null,
};

let travelApi = null;
let searchResults = null;
let lastBuiltTrip = null;
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

function getSearchMeta() {
  const params = getSearchParamsFromForm(document.getElementById('search-form'));
  return {
    destinationId: params.destinationCity,
    origin: params.originAirport,
    ...params,
  };
}

function renderOptionCardLocal(item, type) {
  return renderOptionCard(item, type, {
    selected: selection[type]?.id === item.id,
    formatCurrency,
  });
}

function updateAirportNote(inputId, noteId, place) {
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
    container.innerHTML = '<p>Nenhuma opção disponível para este destino.</p>';
    return;
  }
  container.innerHTML = items.map((item) => renderOptionCardLocal(item, type)).join('');

  bindOptionCards(container, items, type, {
    onToggle: (item, id) => {
      if (selection[type]?.id === id) {
        selection[type] = null;
      } else {
        selection[type] = item;
      }
      renderList(containerId, items, type);
      document.getElementById('summary').classList.remove('hidden');
      document.getElementById('checkout-btn').classList.add('hidden');
      renderSelectionPreview();
    },
  });
}

function renderSelectionPreview() {
  const parts = [selection.flight, selection.hotel, selection.car, selection.allInclusive].filter(Boolean);
  const content = document.getElementById('summary-content');

  if (!parts.length) {
    content.innerHTML = '<p>Selecione ao menos um item acima para montar sua viagem.</p>';
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
            ${c.partner ? `<div class="partner-badge">${c.partner.name}: -${c.partner.discountPercent}% (${formatCurrency(c.discount)})</div>` : ''}
          </div>
          <div style="text-align:right">
            <div>${formatCurrency(c.basePrice)}</div>
            <strong>${formatCurrency(c.finalPrice)}</strong>
          </div>
        </div>
      `
    )
    .join('');

  content.innerHTML = `
    ${componentsHtml}
    <div class="metrics">
      <div class="metric"><span>Subtotal</span><strong>${formatCurrency(result.subtotal)}</strong></div>
      <div class="metric"><span>Descontos parceiros</span><strong>- ${formatCurrency(result.totalDiscount)}</strong></div>
      <div class="metric highlight"><span>Total da viagem</span><strong>${formatCurrency(result.total)}</strong></div>
    </div>
    ${result.bookingLinks?.length ? `
      <div class="booking-links">
        <h3>Reservar cada item separadamente</h3>
        ${result.bookingLinks.map((l) => `
          <a href="${l.url}" target="_blank" rel="noreferrer" class="booking-link">
            ${TYPE_LABELS[l.type] || l.type}: ${l.name} — ${formatCurrency(l.finalPrice)}
          </a>
        `).join('')}
      </div>
    ` : ''}
    <p style="color:var(--muted);font-size:0.9rem">${result.note}</p>
  `;

  document.getElementById('checkout-btn').classList.remove('hidden');
}

function renderCheckoutModal() {
  if (!checkoutSession) return;

  const completed = checkoutSession.steps.filter((s) => s.status === 'completed').length;
  const total = checkoutSession.steps.length;

  document.getElementById('checkout-progress').innerHTML = `
    <strong>Progresso: ${completed}/${total} reservas</strong>
    · Total ${formatCurrency(checkoutSession.total)}
    · Comissão estimada ${formatCurrency(checkoutSession.estimatedCommission)}
  `;

  document.getElementById('checkout-steps').innerHTML = checkoutSession.steps
    .map((step, idx) => {
      const isActive = idx === currentCheckoutStep;
      const isDone = step.status === 'completed';
      return `
        <div class="checkout-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" data-step="${idx}">
          <div class="checkout-step-info">
            <strong>${step.label}: ${step.name}</strong>
            <span>${formatCurrency(step.finalPrice)} · comissão ~${formatCurrency(step.estimatedCommission)} (${step.commissionRate}%)</span>
            <span>Status: ${step.status === 'completed' ? 'Concluído ✓' : step.status === 'clicked' ? 'Link aberto' : 'Pendente'}</span>
          </div>
          <div class="checkout-step-actions">
            <button type="button" data-open="${idx}">Abrir</button>
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

function openCheckoutStep(stepIndex, { focus = true } = {}) {
  if (!checkoutSession) return;
  const step = checkoutSession.steps[stepIndex];
  if (!step) return;

  currentCheckoutStep = stepIndex;
  const url =
    travelApi.mode === 'local'
      ? step.trackedUrl || step.goUrl
      : `${window.location.origin}${step.goUrl}`;
  window.open(url, '_blank', 'noopener,noreferrer');

  if (focus) {
    renderCheckoutModal();
    document.getElementById('checkout-next').classList.remove('hidden');
  }
}

async function refreshCheckoutSession() {
  if (!checkoutSession?.checkoutId) return;
  checkoutSession = await travelApi.getCheckout(checkoutSession.checkoutId);
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
      setStatus(`Etapa ${stepIndex + 1} concluída. Abrindo próximo item...`);
    } else if (checkoutSession.status === 'completed') {
      setStatus('Todas as reservas foram concluídas!');
      hideCheckoutModal();
    } else {
      setStatus(`Etapa ${stepIndex + 1} marcada como concluída.`);
    }
  } catch (err) {
    setStatus(err.message, true);
  }
}

async function startUnifiedCheckout() {
  const parts = [selection.flight, selection.hotel, selection.car, selection.allInclusive].filter(Boolean);
  if (!parts.length) {
    setStatus('Monte a viagem antes de iniciar o checkout.', true);
    return;
  }

  setStatus('Criando sessão de checkout...');

  try {
    const meta = getSearchMeta();
    checkoutSession = await travelApi.createCheckout(selection, meta);
    currentCheckoutStep = 0;
    showCheckoutModal();
    setStatus(`Checkout criado — ${checkoutSession.stepCount || checkoutSession.steps?.length} reserva(s).`);
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
    currentCheckoutStep = i;
    openCheckoutStep(i, { focus: false });
    await new Promise((r) => setTimeout(r, 1200));
  }

  renderCheckoutModal();
  setStatus('Todos os links abertos em abas separadas. Conclua cada reserva e marque como concluído.');
}

async function loadPlacesAutocomplete() {
  const form = document.getElementById('search-form');
  initPlaceAutocompletes(form, {
    onSelect: (place, inputEl) => {
      if (inputEl?.id === 'origin-city') {
        updateAirportNote('origin-city', 'origin-airport-note', place);
      } else if (inputEl?.id === 'destination-city') {
        updateAirportNote('destination-city', 'destination-airport-note', place);
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
          <span>${p.badge} · ${p.discountPercent}% off em ${p.category}</span>
        </div>
      `
    )
    .join('');
}

async function loadApiStatus() {
  try {
    const data = await travelApi.getStatus();
    if (travelApi.mode === 'local') {
      document.getElementById('api-status').textContent = '🌐 Modo demo no navegador — funciona sem Node.js';
      return;
    }
    const parts = [
      data.amadeus === 'configured' ? 'Amadeus ✓' : 'Amadeus (demo)',
      data.booking === 'configured' ? 'Booking ✓' : 'Booking (demo)',
      data.rentalcars === 'configured' ? 'Rentalcars ✓' : 'Rentalcars (demo)',
    ];
    document.getElementById('api-status').textContent = `${parts.join(' · ')} · ${data.partners} parceiros`;
  } catch {
    document.getElementById('api-status').textContent = 'API offline — recarregue a página';
  }
}

function setDefaultDepartureDate() {
  const input = document.getElementById('departure-date');
  const d = new Date();
  d.setDate(d.getDate() + 30);
  input.value = d.toISOString().slice(0, 10);
  input.min = new Date().toISOString().slice(0, 10);
}

function setupPwa() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  let deferredPrompt;
  const installBtn = document.getElementById('install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add('hidden');
  });
}

function setupCheckoutUi() {
  document.getElementById('checkout-btn').addEventListener('click', startUnifiedCheckout);
  document.getElementById('checkout-close').addEventListener('click', hideCheckoutModal);
  document.getElementById('checkout-start').addEventListener('click', () => {
    const firstPending = checkoutSession?.steps.findIndex((s) => s.status !== 'completed') ?? 0;
    openCheckoutStep(firstPending >= 0 ? firstPending : 0);
  });
  document.getElementById('checkout-next').addEventListener('click', async () => {
    await completeCheckoutStep(currentCheckoutStep);
    await refreshCheckoutSession();
    renderCheckoutModal();
  });
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
  lastBuiltTrip = null;

  const params = getSearchParamsFromForm(e.target);
  if (!params.destinationCity) {
    setStatus('Informe o destino (cidade e país).', true);
    return;
  }

  setStatus('Buscando voos, hotéis, carros e resorts para sua rota...');

  try {
    const data = await travelApi.search(params);

    searchResults = data;
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('summary').classList.add('hidden');
    document.getElementById('checkout-btn').classList.add('hidden');

    document.getElementById('flight-source').textContent = data.dataSources?.flights || 'mock';
    document.getElementById('hotel-source').textContent = data.dataSources?.hotels || 'mock';
    document.getElementById('car-source').textContent = data.dataSources?.cars || 'mock';

    const sourcesEl = document.getElementById('sources');
    sourcesEl.textContent = `Fontes: voos=${data.dataSources?.flights}, hotéis=${data.dataSources?.hotels}, carros=${data.dataSources?.cars}`;
    sourcesEl.classList.remove('hidden');

    renderList('flights-list', data.flights, 'flight');
    renderList('hotels-list', data.hotels, 'hotel');
    renderList('cars-list', data.cars, 'car');
    renderList('allinclusive-list', data.allInclusive, 'allInclusive');

    setStatus(
      `${data.origin?.city || ''} → ${data.destination?.city || ''}: ${data.flights.length} voos · ${data.hotels.length} hotéis · ${data.cars.length} carros`
    );
  } catch (err) {
    setStatus(err.message, true);
  }
});

document.getElementById('build-btn').addEventListener('click', async () => {
  const parts = [selection.flight, selection.hotel, selection.car, selection.allInclusive].filter(Boolean);
  if (!parts.length) {
    setStatus('Selecione ao menos um componente.', true);
    return;
  }

  setStatus('Calculando total com descontos de parceiros...');

  try {
    const data = await travelApi.build(selection);
    lastBuiltTrip = data;
    renderSummary(data);
    setStatus('Viagem montada! Clique em "Reservar tudo" para checkout unificado com tracking.');
  } catch (err) {
    setStatus(err.message, true);
  }
});

async function boot() {
  travelApi = await initTravelApi();
  await loadPlacesAutocomplete();
  await loadPartners();
  await loadApiStatus();
  setDefaultDepartureDate();
  setupPwa();
  setupCheckoutUi();

  if (travelApi.mode === 'local') {
    const banner = document.getElementById('sources');
    banner.textContent = 'Digite cidade ou aeroporto pelo nome — preços estimados por distância e região.';
    banner.classList.remove('hidden');
  }
}

boot();
