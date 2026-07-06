const SITE_PATTERNS = [
  { id: 'latam', pattern: /latamairlines\.com|latam\.com/i, name: 'LATAM', category: 'flight' },
  { id: 'gol', pattern: /voegol\.com\.br|gol\.com\.br/i, name: 'GOL', category: 'flight' },
  { id: 'azul', pattern: /voeazul\.com\.br/i, name: 'Azul', category: 'flight' },
  { id: 'booking', pattern: /booking\.com/i, name: 'Booking.com', category: 'hotel' },
  { id: 'decolar', pattern: /decolar\.com/i, name: 'Decolar', category: 'package' },
  { id: 'skyscanner', pattern: /skyscanner\.com/i, name: 'Skyscanner', category: 'flight' },
  { id: 'google-travel', pattern: /google\.com\/travel/i, name: 'Google Travel', category: 'flight' },
  { id: 'rentalcars', pattern: /rentalcars\.com/i, name: 'Rentalcars', category: 'car' },
  { id: 'localiza', pattern: /localiza\.com/i, name: 'Localiza', category: 'car' },
];

const EXTRACTORS = {
  latam: {
    title: ['h1', '[data-testid="flight-summary"]', '.flight-info-header'],
    price: ['[data-testid="price"]', '.amount', '.price', '[class*="Price"]'],
  },
  gol: {
    title: ['h1', '.flight-title', '[class*="trip-summary"]'],
    price: ['[class*="price"]', '.total-price', '[data-testid="total-price"]'],
  },
  azul: {
    title: ['h1', '.flight-summary', '[class*="header-title"]'],
    price: ['[class*="price"]', '.fare-price', '[class*="total"]'],
  },
  booking: {
    title: ['h2[data-testid="title"]', 'h1', '.hp__hotel-name'],
    price: ['[data-testid="price-and-discounted-price"]', '.bui-price-display__value', '[class*="price"]'],
  },
  decolar: {
    title: ['h1', '.package-title', '[class*="title"]'],
    price: ['[class*="price"]', '.amount', '[data-testid="price"]'],
  },
  skyscanner: {
    title: ['h1', '[class*="route"]', '[class*="Breadcrumbs"]'],
    price: ['[class*="price"]', '[data-testid="price"]'],
  },
  'google-travel': {
    title: ['h1', '[class*="route"]', '[role="heading"]'],
    price: ['[class*="price"]', '[data-amount]', '[class*="Amount"]'],
  },
  rentalcars: {
    title: ['h1', '[class*="vehicle"]', '.car-name'],
    price: ['[class*="price"]', '.total-price'],
  },
  localiza: {
    title: ['h1', '[class*="vehicle"]'],
    price: ['[class*="price"]', '.valor'],
  },
};

function detectSite(url = window.location.href) {
  return SITE_PATTERNS.find((s) => s.pattern.test(url)) || null;
}

function queryText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) return el.textContent.trim();
  }
  return '';
}

function parsePrice(raw) {
  if (!raw) return 0;
  const cleaned = raw
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

function extractGoogleTravelOffers() {
  const offers = [];
  const seen = new Set();
  const priceNodes = document.querySelectorAll('[aria-label*="R$"], [aria-label*="BRL"], [class*="price"], [data-gs]');

  for (const node of priceNodes) {
    const label = node.getAttribute?.('aria-label') || node.textContent || '';
    const price = parsePrice(label);
    if (price < 80 || price > 500000) continue;

    const card = node.closest('[role="listitem"], [data-id], li, div[class*="result"]') || node.parentElement;
    const cardText = card?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) || label;
    const key = `${price}-${cardText.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const stopsMatch = cardText.match(/(\d+)\s+parada|(\d+)\s+escala|direto|nonstop/i);
    let stops = 0;
    if (/direto|nonstop/i.test(cardText)) stops = 0;
    else if (stopsMatch) stops = Number(stopsMatch[1] || stopsMatch[2] || 1);

    const durationMatch = cardText.match(/(\d+)\s*h\s*(\d+)?\s*m?/i);

    offers.push({
      title: cardText.slice(0, 120),
      price,
      stops,
      duration: durationMatch ? `${durationMatch[1]}h${durationMatch[2] || '00'}` : '',
      airline: 'Google Travel',
      url: window.location.href,
    });
    if (offers.length >= 12) break;
  }

  return offers;
}

function extractTravelData() {
  const site = detectSite();
  if (!site) return null;

  const selectors = EXTRACTORS[site.id];
  if (!selectors) return null;

  const title = queryText(selectors.title) || document.title;
  const priceRaw = queryText(selectors.price);
  const price = parsePrice(priceRaw);

  const data = {
    site: site.id,
    siteName: site.name,
    category: site.category,
    title,
    price,
    priceRaw,
    url: window.location.href,
    metadata: {},
  };

  if (site.id === 'google-travel') {
    const offers = extractGoogleTravelOffers();
    if (offers.length) {
      data.metadata.offers = offers;
      data.price = offers[0].price;
      data.title = offers[0].title || title;
    }
  }

  if (site.id === 'booking') {
    const img = document.querySelector('img[src*="bstatic"], .hotel_image, [data-testid="gallery"] img');
    if (img?.src) {
      data.metadata.image = img.src;
      data.metadata.images = [img.src];
    }
  }

  if (site.id === 'rentalcars' || site.id === 'localiza') {
    const img = document.querySelector('img[src*="car"], img[alt*="car"], .vehicle-image img');
    if (img?.src) {
      data.metadata.image = img.src;
      data.metadata.images = [img.src];
    }
  }

  return data;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function saveCapture(data) {
  chrome.runtime.sendMessage({ type: 'SAVE_CAPTURE', payload: data }, (response) => {
    const btn = document.querySelector('#meta-travel-widget .mt-save');
    if (btn && response?.ok) {
      btn.textContent = data.metadata?.offers?.length
        ? `Salvo ✓ (${data.metadata.offers.length} opções)`
        : 'Salvo ✓';
      setTimeout(() => { btn.textContent = 'Salvar no planejador'; }, 2500);
    }
  });
}

function renderWidget(data) {
  let widget = document.getElementById('meta-travel-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'meta-travel-widget';
    document.body.appendChild(widget);
  }

  const offerCount = data.metadata?.offers?.length || 0;

  widget.innerHTML = `
    <div class="mt-header">
      <strong>Meta Travel</strong>
      <button type="button" class="mt-close" aria-label="Fechar">×</button>
    </div>
    <p class="mt-site">${data.siteName} · ${data.category}</p>
    <p class="mt-title">${data.title.slice(0, 80)}</p>
    <div class="mt-row mt-highlight"><span>Preço detectado</span><strong>${formatCurrency(data.price)}</strong></div>
    ${offerCount > 1 ? `<p class="mt-meta">${offerCount} opções encontradas nesta página</p>` : ''}
    <button type="button" class="mt-save">Salvar no planejador</button>
    <button type="button" class="mt-open">Abrir planejador</button>
  `;

  widget.querySelector('.mt-close')?.addEventListener('click', () => widget.remove());

  widget.querySelector('.mt-save')?.addEventListener('click', () => saveCapture(data));

  widget.querySelector('.mt-open')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_PLANNER' });
  });
}

async function analyzePage() {
  const data = extractTravelData();
  if (!data || !data.price) return;
  renderWidget(data);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_TRAVEL') {
    sendResponse({ ok: true, data: extractTravelData() });
    return true;
  }
  if (message.type === 'REFRESH_CAPTURE') {
    analyzePage();
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', analyzePage);
} else {
  analyzePage();
}

const observer = new MutationObserver(() => {
  const data = extractTravelData();
  if (data?.price) analyzePage();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
