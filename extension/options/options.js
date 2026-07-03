const DEFAULT_API = 'http://localhost:3000/api';

chrome.storage.sync.get({ apiUrl: DEFAULT_API, useRemoteApi: false }, ({ apiUrl, useRemoteApi }) => {
  document.getElementById('api-url').value = apiUrl;
  document.getElementById('use-remote').checked = useRemoteApi;
});

document.getElementById('save').addEventListener('click', () => {
  const apiUrl = document.getElementById('api-url').value.trim() || DEFAULT_API;
  const useRemoteApi = document.getElementById('use-remote').checked;
  chrome.storage.sync.set({ apiUrl, useRemoteApi }, () => {
    document.getElementById('status').textContent = 'Salvo! O planejador continua funcionando localmente.';
  });
});
