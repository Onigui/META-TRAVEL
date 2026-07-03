const DEFAULT_API = 'http://localhost:3000/api';

async function getApiUrl() {
  const { apiUrl } = await chrome.storage.sync.get({ apiUrl: DEFAULT_API });
  return apiUrl || DEFAULT_API;
}

async function saveCapture(payload) {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      site: payload.site,
      category: payload.category,
      title: payload.title,
      price: payload.price,
      url: payload.url,
      metadata: { siteName: payload.siteName, priceRaw: payload.priceRaw },
    }),
  });
  if (!res.ok) throw new Error('Falha ao salvar captura');
  return res.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_CAPTURE') {
    saveCapture(message.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === 'OPEN_PLANNER') {
    getApiUrl().then((apiUrl) => {
      const base = apiUrl.replace(/\/api\/?$/, '');
      chrome.tabs.create({ url: `${base}/` });
    });
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
