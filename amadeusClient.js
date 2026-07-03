document.getElementById('open-planner').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'OPEN_PLANNER' });
});

document.getElementById('refresh').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_CAPTURE' });
  }
});
