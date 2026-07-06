/** Adaptador de API — remoto (Node), vitrine (capturas + links) ou híbrido */

export async function initTravelApi() {
  const forceLocal = new URLSearchParams(window.location.search).has('local');
  let config = {};

  try {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (res.ok) config = await res.json();
  } catch { /* sem config */ }

  const apiBase = config.apiBase || (!forceLocal && !window.location.hostname.includes('github.io') ? '/api' : null);

  if (apiBase && !forceLocal) {
    try {
      const remote = createRemoteApi(apiBase);
      await remote.getStatus();
      return remote;
    } catch {
      /* fallback vitrine */
    }
  }

  const { createTravelApi } = await import('./lib/travelEngine.js');
  return createTravelApi({
    mode: 'showcase',
    remoteApiBase: config.apiBase || null,
  });
}

function createRemoteApi(base) {
  async function request(path, options = {}) {
    const res = await fetch(`${base.replace(/\/$/, '')}${path}`, {
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
    getTravelRequirements: (country) =>
      request(`/travel-requirements?country=${encodeURIComponent(country || '')}`),
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
