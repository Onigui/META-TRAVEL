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

function buildDetails(item, type) {
  if (type === 'flight') {
    const d = item.details;
    return `${d.airline} · ${d.stops === 0 ? 'Direto' : `${d.stops} escala(s)`} · ${d.duration || ''}`;
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
  const visual = type === 'hotel' || type === 'allInclusive';
  const details = buildDetails(item, type);
  const amenities =
    type === 'hotel' || type === 'allInclusive' ? renderAmenities(item.details?.amenities) : '';

  return `
    <article class="option-card ${visual ? 'option-card--visual' : ''} ${selected ? 'selected' : ''}" data-type="${type}" data-id="${escapeHtml(item.id)}">
      ${visual ? renderMedia(item, type) : ''}
      <div class="option-card-body">
        <h4>${escapeHtml(item.name)}</h4>
        <p>${escapeHtml(details)}</p>
        ${amenities}
        <p class="price">${formatCurrency(item.basePrice)}</p>
        ${partnerNote}
      </div>
    </article>
  `;
}

export function bindOptionCards(container, items, type, { onToggle }) {
  container.querySelectorAll('.option-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const item = items.find((i) => i.id === id);
      onToggle?.(item, id);
    });
  });
}
