const DEFAULT_API = 'http://localhost:3000/api';

chrome.storage.sync.get({ apiUrl: DEFAULT_API }, ({ apiUrl }) => {
  document.getElementById('api-url').value = apiUrl;
});

document.getElementById('save').addEventListener('click', () => {
  const apiUrl = document.getElementById('api-url').value.trim() || DEFAULT_API;
  chrome.storage.sync.set({ apiUrl }, () => {
    document.getElementById('status').textContent = 'Salvo!';
  });
});
