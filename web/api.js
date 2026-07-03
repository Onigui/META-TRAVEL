/** Adaptador de API — remoto (Node) ou local (GitHub Pages) */

export async function initTravelApi() {
  const forceLocal = new URLSearchParams(window.location.search).has('local');
  const isGitHubPages = window.location.hostname.includes('github.io');

  if (forceLocal || isGitHubPages) {
    const { localTravelApi } = await import('./lib/travelEngine.js');
    return localTravelApi;
  }

  return createRemoteApi('/api');
}

function createRemoteApi(base) {
  async function request(path, options = {}) {
    const res = await fetch(`${base}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  }

  return {
    mode: 'remote',
    getStatus: () => request('/status'),
    getDestinations: () => request('/destinations'),
    searchPlaces: (q) => request(`/places?q=${encodeURIComponent(q || '')}`),
    getPartners: () => request('/partners'),
    search: (params) => {
      const q = new URLSearchParams({
        destinationCity: params.destinationCity || '',
        destinationCountry: params.destinationCountry || '',
        destinationAirport: params.destinationAirport || '',
        originCity: params.originCity || '',
        originCountry: params.originCountry || '',
        originAirport: params.originAirport || '',
        passengers: params.passengers || 1,
        guests: params.guests || 2,
        nights: params.nights || 5,
        departureDate: params.departureDate || '',
        returnDate: params.returnDate || '',
      });
      return request(`/search?${q}`);
    },
    build: (selection) => request('/build', { method: 'POST', body: JSON.stringify(selection) }),
    createCheckout: (selection, meta = {}) =>
      request('/checkout', { method: 'POST', body: JSON.stringify({ ...selection, ...meta }) }),
    getCheckout: (id) => request(`/checkout/${id}`),
    completeCheckoutStep: (checkoutId, stepIndex) =>
      request(`/checkout/${checkoutId}/step/${stepIndex}/complete`, { method: 'POST' }),
  };
}
