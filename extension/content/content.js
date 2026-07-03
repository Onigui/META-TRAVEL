const SITE_PATTERNS = [
  { id: 'latam', pattern: /latamairlines\.com|latam\.com/i, name: 'LATAM', category: 'flight' },
  { id: 'gol', pattern: /voegol\.com\.br|gol\.com\.br/i, name: 'GOL', category: 'flight' },
  { id: 'azul', pattern: /voeazul\.com\.br/i, name: 'Azul', category: 'flight' },
  { id: 'booking', pattern: /booking\.com/i, name: 'Booking.com', category: 'hotel' },
  { id: 'decolar', pattern: /decolar\.com/i, name: 'Decolar', category: 'package' },
  { id: 'skyscanner', pattern: /skyscanner\.com/i, name: 'Skyscanner', category: 'flight' },
  { id: 'google-travel', pattern: /google\.com\/travel/i, name: 'Google Travel', category: 'flight' },
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

function extractTravelData() {
  const site = detectSite();
  if (!site) return null;

  const selectors = EXTRACTORS[site.id];
  if (!selectors) return null;

  const title = queryText(selectors.title) || document.title;
  const priceRaw = queryText(selectors.price);
  const price = parsePrice(priceRaw);

  return {
    site: site.id,
    siteName: site.name,
    category: site.category,
    title,
    price,
    priceRaw,
    url: window.location.href,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function renderWidget(data) {
  let widget = document.getElementById('meta-travel-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'meta-travel-widget';
    document.body.appendChild(widget);
  }

  widget.innerHTML = `
    <div class="mt-header">
      <strong>Meta Travel</strong>
      <button type="button" class="mt-close" aria-label="Fechar">×</button>
    </div>
    <p class="mt-site">${data.siteName} · ${data.category}</p>
    <p class="mt-title">${data.title.slice(0, 80)}</p>
    <div class="mt-row mt-highlight"><span>Preço detectado</span><strong>${formatCurrency(data.price)}</strong></div>
    <button type="button" class="mt-save">Salvar no planejador</button>
    <button type="button" class="mt-open">Abrir Meta Travel</button>
  `;

  widget.querySelector('.mt-close')?.addEventListener('click', () => widget.remove());

  widget.querySelector('.mt-save')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'SAVE_CAPTURE', payload: data }, (response) => {
      if (response?.ok) {
        widget.querySelector('.mt-save').textContent = 'Salvo ✓';
      }
    });
  });

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
