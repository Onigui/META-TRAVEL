const CAPTURES_KEY = 'captures';
const MAX_CAPTURES = 100;

async function saveCaptureLocal(payload) {
  const { captures = [] } = await chrome.storage.local.get({ [CAPTURES_KEY]: [] });
  const entry = {
    ...payload,
    savedAt: new Date().toISOString(),
  };
  captures.unshift(entry);
  await chrome.storage.local.set({ [CAPTURES_KEY]: captures.slice(0, MAX_CAPTURES) });
  return entry;
}

async function saveCaptureRemote(payload) {
  const { apiUrl, useRemoteApi } = await chrome.storage.sync.get({
    apiUrl: '',
    useRemoteApi: false,
  });
  if (!useRemoteApi || !apiUrl) return null;

  const base = apiUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/capture`, {
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
  if (!res.ok) throw new Error('API remota indisponível');
  return res.json();
}

async function openPlanner(sender) {
  const windowId = sender?.tab?.windowId;
  if (windowId) {
    await chrome.sidePanel.open({ windowId });
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_CAPTURE') {
    (async () => {
      const local = await saveCaptureLocal(message.payload);
      try {
        await saveCaptureRemote(message.payload);
      } catch {
        /* modo local é suficiente */
      }
      sendResponse({ ok: true, capture: local });
    })();
    return true;
  }

  if (message.type === 'OPEN_PLANNER') {
    openPlanner(sender)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === 'OPEN_CAPTURES') {
    openPlanner(sender).then(() => {
      chrome.runtime.sendMessage({ type: 'FOCUS_CAPTURES' }).catch(() => {});
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});
