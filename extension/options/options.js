const DEFAULT_API = 'http://localhost:3000/api';

chrome.storage.sync.get(
  { apiUrl: DEFAULT_API, useRemoteApi: false, useRemoteSearch: false },
  ({ apiUrl, useRemoteApi, useRemoteSearch }) => {
    document.getElementById('api-url').value = apiUrl;
    document.getElementById('use-remote').checked = useRemoteApi;
    document.getElementById('use-remote-search').checked = useRemoteSearch;
  }
);

document.getElementById('save').addEventListener('click', () => {
  const apiUrl = document.getElementById('api-url').value.trim() || DEFAULT_API;
  const useRemoteApi = document.getElementById('use-remote').checked;
  const useRemoteSearch = document.getElementById('use-remote-search').checked;
  chrome.storage.sync.set({ apiUrl, useRemoteApi, useRemoteSearch }, () => {
    document.getElementById('status').textContent =
      'Salvo! Recarregue o painel do planejador para aplicar.';
  });
});
