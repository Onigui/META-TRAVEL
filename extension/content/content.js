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
    title: ['h1', '[role="heading"]'],
    price: [],
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

const SCAN_DEBOUNCE_MS = 2500;
const GOOGLE_POLL_MS = 5000;
const IS_GOOGLE_TRAVEL = /google\.com\/travel/i.test(window.location.href);

let scanScheduled = false;
let scanInProgress = false;
let lastFingerprint = '';
let currentData = null;
let pollIntervalId = null;
let mutationObserver = null;

function detectSite(url = window.location.href) {
  return SITE_PATTERNS.find((s) => s.pattern.test(url)) || null;
}

function queryText(selectors) {
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector);
      if (el?.textContent?.trim()) return el.textContent.trim();
    } catch {
      /* seletor inválido em alguns browsers */
    }
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

/** Google Voos: só aria-label com preço — evita querySelectorAll('[class*="price"]') que trava a página */
function extractGoogleTravelOffers() {
  const offers = [];
  const seen = new Set();
  const priceNodes = document.querySelectorAll('[aria-label*="R$"], [aria-label*="reais"]');

  const maxNodes = Math.min(priceNodes.length, 24);
  for (let i = 0; i < maxNodes; i++) {
    const node = priceNodes[i];
    const label = node.getAttribute('aria-label') || '';
    const price = parsePrice(label);
    if (price < 80 || price > 500000) continue;

    const card = node.closest('[role="listitem"], [role="option"], li') || node.parentElement?.parentElement;
    const cardText = (card?.getAttribute?.('aria-label') || card?.textContent || label)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    const key = `${price}-${cardText.slice(0, 36)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const stopsMatch = cardText.match(/(\d+)\s+parada|(\d+)\s+escala|direto|nonstop|sem escala/i);
    let stops = 0;
    if (/direto|nonstop|sem escala/i.test(cardText)) stops = 0;
    else if (stopsMatch) stops = Number(stopsMatch[1] || stopsMatch[2] || 1);

    const durationMatch = cardText.match(/(\d+)\s*h\s*(\d+)?/i);

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
  let price = 0;
  let priceRaw = '';

  if (site.id === 'google-travel') {
    const offers = extractGoogleTravelOffers();
    if (!offers.length) return null;
    return {
      site: site.id,
      siteName: site.name,
      category: site.category,
      title: offers[0].title || title,
      price: offers[0].price,
      priceRaw: String(offers[0].price),
      url: window.location.href,
      metadata: { offers },
    };
  }

  priceRaw = queryText(selectors.price);
  price = parsePrice(priceRaw);
  if (!price) return null;

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

function fingerprint(data) {
  if (!data) return '';
  const offerKey = (data.metadata?.offers || [])
    .map((o) => `${o.price}:${o.title?.slice(0, 20)}`)
    .join('|');
  return `${data.site}:${data.price}:${data.title?.slice(0, 50)}:${offerKey}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function ensureWidget() {
  let widget = document.getElementById('meta-travel-widget');
  if (widget) return widget;

  widget = document.createElement('div');
  widget.id = 'meta-travel-widget';
  widget.innerHTML = `
    <div class="mt-header">
      <strong>Meta Travel</strong>
      <button type="button" class="mt-close" aria-label="Fechar">×</button>
    </div>
    <p class="mt-site"></p>
    <p class="mt-title"></p>
    <div class="mt-row mt-highlight"><span>Preço detectado</span><strong class="mt-price"></strong></div>
    <p class="mt-meta hidden"></p>
    <button type="button" class="mt-save">Salvar no planejador</button>
    <button type="button" class="mt-open">Abrir planejador</button>
  `;

  widget.querySelector('.mt-close')?.addEventListener('click', () => widget.remove());

  widget.querySelector('.mt-save')?.addEventListener('click', () => {
    if (!currentData) return;
    chrome.runtime.sendMessage({ type: 'SAVE_CAPTURE', payload: currentData }, (response) => {
      const btn = widget.querySelector('.mt-save');
      if (btn && response?.ok) {
        const n = currentData.metadata?.offers?.length || 0;
        btn.textContent = n > 1 ? `Salvo ✓ (${n} opções)` : 'Salvo ✓';
        setTimeout(() => { btn.textContent = 'Salvar no planejador'; }, 2500);
      }
    });
  });

  widget.querySelector('.mt-open')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_PLANNER' });
  });

  document.body.appendChild(widget);
  return widget;
}

function updateWidget(data) {
  const widget = ensureWidget();
  const offerCount = data.metadata?.offers?.length || 0;

  widget.querySelector('.mt-site').textContent = `${data.siteName} · ${data.category}`;
  widget.querySelector('.mt-title').textContent = (data.title || '').slice(0, 80);
  widget.querySelector('.mt-price').textContent = formatCurrency(data.price);

  const meta = widget.querySelector('.mt-meta');
  if (offerCount > 1) {
    meta.textContent = `${offerCount} opções encontradas nesta página`;
    meta.classList.remove('hidden');
  } else {
    meta.textContent = '';
    meta.classList.add('hidden');
  }
}

function runScan() {
  if (scanInProgress) return;
  scanInProgress = true;

  try {
    const data = extractTravelData();
    if (!data?.price) return;

    const fp = fingerprint(data);
    if (fp === lastFingerprint) return;

    lastFingerprint = fp;
    currentData = data;
    updateWidget(data);
  } finally {
    scanInProgress = false;
  }
}

function scheduleScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  setTimeout(() => {
    scanScheduled = false;
    runScan();
  }, SCAN_DEBOUNCE_MS);
}

function startWatching() {
  if (IS_GOOGLE_TRAVEL) {
    // Google Voos muta o DOM o tempo todo — polling leve em vez de MutationObserver
    setTimeout(runScan, 1500);
    pollIntervalId = setInterval(runScan, GOOGLE_POLL_MS);
    return;
  }

  mutationObserver = new MutationObserver(scheduleScan);
  mutationObserver.observe(document.body, { childList: true, subtree: true });
  setTimeout(runScan, 800);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_TRAVEL') {
    sendResponse({ ok: true, data: extractTravelData() });
    return true;
  }
  if (message.type === 'REFRESH_CAPTURE') {
    runScan();
    sendResponse({ ok: true });
    return true;
  }
  return false;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startWatching, { once: true });
} else {
  startWatching();
}

window.addEventListener('pagehide', () => {
  if (pollIntervalId) clearInterval(pollIntervalId);
  mutationObserver?.disconnect();
});
