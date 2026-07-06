/** Renderização visual de cards de opções (web + extensão) */

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAmenities(amenities = []) {
  if (!amenities.length) return '';
  return `
    <div class="amenities">
      ${amenities
        .slice(0, 5)
        .map((a) => `<span class="amenity-tag">${escapeHtml(a)}</span>`)
        .join('')}
    </div>
  `;
}

function renderMedia(item, type) {
  const images = item.details?.images || (item.details?.image ? [item.details.image] : []);
  if (!images.length) return '';

  const main = images[0];
  const thumbs = images.slice(1, 4);

  return `
    <div class="option-card-media">
      <img class="option-card-cover" src="${escapeHtml(main)}" alt="${escapeHtml(item.name)}" loading="lazy" />
      ${
        thumbs.length
          ? `<div class="option-card-thumbs">${thumbs
              .map((url) => `<img src="${escapeHtml(url)}" alt="" loading="lazy" />`)
              .join('')}</div>`
          : ''
      }
    </div>
  `;
}

function renderSourceBadge(item) {
  if (item.source === 'capture') {
    return '<span class="source-badge source-badge--verified">Preço real capturado</span>';
  }
  if (item.source === 'amadeus' || item.source === 'booking' || item.source === 'rentalcars') {
    return '<span class="source-badge source-badge--verified">Preço verificado (API)</span>';
  }
  return '';
}

function renderFlightSegments(d) {
  if (!d.segments?.length) return '';
  return `
    <ul class="flight-segments">
      ${d.segments
        .map(
          (s) => `
            <li>
              <strong>${escapeHtml(s.from)} → ${escapeHtml(s.to)}</strong>
              <span>${escapeHtml(s.fromName)} → ${escapeHtml(s.toName)}</span>
              <span>${escapeHtml(s.duration)}${s.flightNumber ? ` · ${escapeHtml(s.flightNumber)}` : ''}</span>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

function renderLayovers(d) {
  if (!d.layovers?.length) return '';
  return `
    <div class="flight-layovers">
      <strong>Escala(s):</strong>
      ${d.layovers
        .map(
          (l) => `
            <div class="layover-item">
              ${escapeHtml(l.airportName)} — espera ~${escapeHtml(l.duration)}
              <span class="layover-note">${escapeHtml(l.note || '')}</span>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderBaggage(d) {
  const b = d.baggage;
  if (!b) return '';
  const checked =
    b.checkedBags > 0
      ? `${b.checkedBags}× despachada(s) até ${b.checkedWeightKg} kg`
      : `Despachada não incluída — +R$ ${b.extraCheckedBagPrice} (até ${b.extraBagWeightKg || 23} kg)`;
  return `
    <div class="flight-baggage">
      <strong>Bagagem (${escapeHtml(d.fareBrand || 'tarifa')}):</strong>
      <ul>
        <li>Item pessoal incluído</li>
        <li>Mão: até ${b.carryOnKg} kg</li>
        <li>${escapeHtml(checked)}</li>
      </ul>
    </div>
  `;
}

function renderIncludedLists(d) {
  const inc = d.included || [];
  const not = d.notIncluded || [];
  if (!inc.length && !not.length) return '';
  return `
    <div class="flight-includes">
      ${
        inc.length
          ? `<div><strong>Incluído:</strong> ${inc.map((x) => escapeHtml(x)).join(' · ')}</div>`
          : ''
      }
      ${
        not.length
          ? `<div class="not-included"><strong>Não incluído:</strong> ${not.map((x) => escapeHtml(x)).join(' · ')}</div>`
          : ''
      }
    </div>
  `;
}

function renderFlightExtras(item) {
  const d = item.details || {};
  const note = d.availabilityNote
    ? `<p class="estimate-note">${escapeHtml(d.availabilityNote)}</p>`
    : '';

  return `
    <div class="flight-details">
      <div class="flight-meta">
        <span>${escapeHtml(d.departure || '')} · ${escapeHtml(d.departureDate || '')}</span>
        <span>${escapeHtml(d.cabin || 'Econômica')} · Tarifa ${escapeHtml(d.fareBrand || '')}</span>
        <span>${escapeHtml(d.layoverSummary || (d.stops === 0 ? 'Direto' : `${d.stops} escala(s)`))}</span>
      </div>
      ${renderFlightSegments(d)}
      ${renderLayovers(d)}
      ${renderBaggage(d)}
      ${renderIncludedLists(d)}
      ${note}
      <a class="verify-link" href="${escapeHtml(item.bookingUrl)}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">
        Verificar disponibilidade no site da ${escapeHtml(d.airline || 'companhia')} →
      </a>
    </div>
  `;
}

function buildDetails(item, type) {
  if (type === 'flight') {
    const d = item.details;
    const stops = d.stops === 0 ? 'Direto' : `${d.stops} escala(s)`;
    return `${d.airline} · ${stops} · ${d.duration || ''} · ${d.fareBrand || ''}`;
  }
  if (type === 'hotel') {
    const d = item.details;
    const stars = d.stars ? `${d.stars}★` : '';
    return `${d.zone || ''} · ${d.nights} noites · ${stars}`.replace(/^ · | · $/g, '');
  }
  if (type === 'car') {
    return `${item.details.category} · ${item.details.days} dias`;
  }
  if (type === 'allInclusive') {
    return `${item.details.meals || ''} · ${item.details.activities || ''}`;
  }
  return '';
}

export function renderOptionCard(item, type, { selected = false, formatCurrency }) {
  const partnerNote = item.partnerId
    ? '<span class="partner-badge">Desconto de parceiro disponível</span>'
    : '';
  const visual = type === 'hotel' || type === 'allInclusive' || type === 'car';
  const details = buildDetails(item, type);
  const amenities =
    type === 'hotel' || type === 'allInclusive' || type === 'car'
      ? renderAmenities(item.details?.amenities)
      : '';
  const flightExtras = type === 'flight' ? renderFlightExtras(item) : '';
  const sourceBadge = type === 'flight' || type === 'car' ? renderSourceBadge(item) : renderSourceBadge(item);

  return `
    <article class="option-card ${visual ? 'option-card--visual' : ''} ${type === 'flight' ? 'option-card--flight' : ''} ${selected ? 'selected' : ''}" data-type="${type}" data-id="${escapeHtml(item.id)}">
      ${visual ? renderMedia(item, type) : ''}
      <div class="option-card-body">
        ${sourceBadge}
        <h4>${escapeHtml(item.name)}</h4>
        <p class="option-summary">${escapeHtml(details)}</p>
        ${amenities}
        ${flightExtras}
        <p class="price">${formatCurrency(item.basePrice)}</p>
        ${partnerNote}
      </div>
    </article>
  `;
}

export function renderTravelRequirementsPanel(req) {
  if (!req) return '';
  const docs = (req.documents || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('');
  const steps = (req.steps || []).map((s) => `<li>${escapeHtml(s)}</li>`).join('');
  const sources = (req.sources || [])
    .map((s) => `<a href="${escapeHtml(s.url)}" target="_blank" rel="noreferrer">${escapeHtml(s.title)}</a>`)
    .join(' · ');

  const visaLabel = {
    none: 'Sem visto',
    none_short_stay: 'Sem visto (estadia curta)',
    required: 'Visto necessário',
    eta: 'Autorização eletrônica (ETA)',
    on_arrival: 'Visto na chegada',
    check_official: 'Consulte fonte oficial',
  }[req.visa] || req.visaType || '';

  return `
    <section class="travel-requirements panel">
      <h2>Documentos e visto — ${escapeHtml(req.country)}</h2>
      <p class="req-summary">${escapeHtml(req.summary || '')}</p>
      <div class="req-grid">
        <div>
          <strong>Documentos</strong>
          <ul>${docs}</ul>
        </div>
        <div>
          <strong>Imigração</strong>
          <p>${escapeHtml(visaLabel)}</p>
          ${req.passportRequired ? '<p>Passaporte obrigatório</p>' : '<p>Passaporte pode não ser obrigatório (verifique)</p>'}
        </div>
      </div>
      ${steps ? `<div><strong>Passo a passo</strong><ol>${steps}</ol></div>` : ''}
      <p class="req-sources"><strong>Fontes oficiais:</strong> ${sources}</p>
    </section>
  `;
}

export function renderSearchActions({ externalLinks, hasResults }) {
  if (!externalLinks) return '';
  return `
    <section class="search-actions panel">
      <h2>Buscar preços reais</h2>
      ${
        hasResults
          ? '<p>Resultados abaixo vêm de APIs ou capturas salvas. Você também pode abrir:</p>'
          : '<p>Nenhum preço importado ainda. Abra o Google Voos (ou configure a API) e use a extensão para salvar:</p>'
      }
      <div class="action-links">
        <a class="action-btn" href="${escapeHtml(externalLinks.googleFlights)}" target="_blank" rel="noreferrer">Google Voos</a>
        <a class="action-btn" href="${escapeHtml(externalLinks.googleHotels)}" target="_blank" rel="noreferrer">Google Hotéis</a>
        <a class="action-btn" href="${escapeHtml(externalLinks.rentalcars)}" target="_blank" rel="noreferrer">Aluguel de carros</a>
      </div>
    </section>
  `;
}

export function bindOptionCards(container, items, type, { onToggle }) {
  container.querySelectorAll('.option-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a.verify-link')) return;
      const id = card.dataset.id;
      const item = items.find((i) => i.id === id);
      onToggle?.(item, id);
    });
  });
}

export function renderDataDisclaimer() {
  return '';
}
