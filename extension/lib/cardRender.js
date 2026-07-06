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
  if (item.source === 'amadeus') {
    return '<span class="source-badge source-badge--verified">Preço verificado (API)</span>';
  }
  if (item.source === 'estimate' || item.isEstimate) {
    return '<span class="source-badge source-badge--estimate">Estimativa — confirme na companhia</span>';
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
  const isEstimate = item.source === 'estimate' || item.isEstimate;
  const partnerNote =
    item.partnerId && !isEstimate
      ? '<span class="partner-badge">Desconto de parceiro disponível</span>'
      : item.partnerId && isEstimate
        ? '<span class="partner-badge partner-badge--muted">Desconto de parceiro no checkout (sobre valor final)</span>'
        : '';
  const visual = type === 'hotel' || type === 'allInclusive';
  const details = buildDetails(item, type);
  const amenities =
    type === 'hotel' || type === 'allInclusive' ? renderAmenities(item.details?.amenities) : '';
  const flightExtras = type === 'flight' ? renderFlightExtras(item) : '';
  const sourceBadge = type === 'flight' ? renderSourceBadge(item) : '';

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

export function renderDataDisclaimer(dataSources) {
  const flightsEstimate = dataSources?.flights === 'estimate' || dataSources?.flights === 'estimate-local';
  if (!flightsEstimate) return '';
  return `
    <div class="data-disclaimer" role="note">
      <strong>⚠ Preços de referência, não em tempo real</strong>
      <p>
        O site e a extensão funcionam em <strong>modo demonstração</strong>: não há login nas companhias aéreas
        (GOL, LATAM, Azul etc.) e os valores são <strong>estimados</strong> pela distância da rota.
        A disponibilidade real pode ser diferente — sempre confira no site oficial antes de comprar.
      </p>
      <p class="disclaimer-hint">
        Para preços verificados, configure as credenciais <code>AMADEUS_CLIENT_ID</code> e
        <code>AMADEUS_CLIENT_SECRET</code> no servidor da API.
      </p>
    </div>
  `;
}
