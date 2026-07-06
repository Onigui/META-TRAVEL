/** Motor Meta Travel — vitrine com dados reais (capturas, API remota, links oficiais) */

import { listPlaces, resolveTripPlaces, searchPlaces } from './places.js';
import { capturesToSearchResults, mergeSearchResults } from './captureBridge.js';
import { getTravelRequirements } from './travelRequirements.js';
import { buildGoogleFlightsUrl, buildGoogleHotelsUrl, buildRentalcarsUrl } from './googleFlights.js';

export const DESTINATIONS = listPlaces();

export const PARTNERS = [
  { id: 'latam', name: 'LATAM', category: 'airline', discountPercent: 5, badge: 'Parceiro oficial' },
  { id: 'gol', name: 'GOL', category: 'airline', discountPercent: 4, badge: 'Parceiro oficial' },
  { id: 'booking', name: 'Booking.com', category: 'hotel', discountPercent: 8, badge: 'Desconto exclusivo' },
  { id: 'localiza', name: 'Localiza', category: 'car', discountPercent: 10, badge: 'Parceiro oficial' },
  { id: 'decameron', name: 'Decameron', category: 'allInclusive', discountPercent: 12, badge: 'Resort parceiro' },
];

const COMMISSION_RATES = { flight: 2, hotel: 5, car: 8, allInclusive: 6 };
const STEP_ORDER = ['flight', 'hotel', 'car', 'allInclusive'];
const STEP_LABELS = {
  flight: 'Reservar voo',
  hotel: 'Reservar hotel',
  car: 'Reservar carro',
  allInclusive: 'Reservar all inclusive',
};

function defaultDepartureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function rankByPrice(items) {
  return [...(items || [])].sort((a, b) => a.basePrice - b.basePrice);
}

function getPartner(id) {
  return PARTNERS.find((p) => p.id === id) || null;
}

function applyDiscount(price, partnerId) {
  const partner = getPartner(partnerId);
  if (!partner || !price) return { price, discount: 0, partner: null };
  const discount = Math.round(price * (partner.discountPercent / 100));
  return { price: price - discount, discount, partner };
}

function buildTripSummary(selection) {
  const { flight, hotel, car, allInclusive } = selection;
  const components = [];
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of [flight, hotel, car, allInclusive].filter(Boolean)) {
    const { price, discount, partner } = applyDiscount(item.basePrice, item.partnerId);
    subtotal += item.basePrice;
    totalDiscount += discount;
    components.push({
      type: item.type,
      provider: item.provider,
      name: item.name,
      basePrice: item.basePrice,
      finalPrice: price,
      discount,
      partner,
      bookingUrl: item.bookingUrl,
    });
  }

  return {
    components,
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
    currency: 'BRL',
    note: 'Cada item foi escolhido separadamente — sem pacote fechado.',
    bookingLinks: components.filter((c) => c.bookingUrl).map((c) => ({
      type: c.type,
      name: c.name,
      url: c.bookingUrl,
      finalPrice: c.finalPrice,
    })),
  };
}

function wrapUrl(originalUrl, { checkoutId, type, provider, stepIndex }) {
  try {
    const url = new URL(originalUrl);
    url.searchParams.set('utm_source', 'meta-travel');
    url.searchParams.set('utm_medium', 'checkout');
    url.searchParams.set('utm_campaign', `trip-${checkoutId}`);
    url.searchParams.set('ref', 'meta-travel');
    url.searchParams.set('mt_checkout', checkoutId);
    url.searchParams.set('mt_step', String(stepIndex));
    url.searchParams.set('mt_type', type);
    if (provider) url.searchParams.set('mt_provider', provider);
    return url.toString();
  } catch {
    return originalUrl;
  }
}

const checkoutSessions = new Map();

async function remoteSearch(base, params) {
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
  const res = await fetch(`${base.replace(/\/$/, '')}/search?${q}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API indisponível');
  return data;
}

function buildExternalLinks({ origin, destination, checkIn, nights, guests, passengers, returnDate }) {
  return {
    googleFlights: buildGoogleFlightsUrl({
      originAirport: origin.airport,
      destinationAirport: destination.airport,
      departureDate: checkIn,
      returnDate,
      passengers,
    }),
    googleHotels: buildGoogleHotelsUrl({
      city: destination.city,
      country: destination.country,
      checkIn,
      nights,
      guests,
    }),
    rentalcars: buildRentalcarsUrl({
      city: destination.city,
      airport: destination.airport,
      pickUpDate: checkIn,
      dropOffDate: addDays(checkIn, nights),
    }),
  };
}

function resolveSources(flights, hotels, cars, remote) {
  const src = (items) => {
    if (!items?.length) return 'none';
    const s = items[0]?.source;
    if (s === 'capture') return 'capture';
    if (s === 'amadeus' || s === 'booking' || s === 'rentalcars') return s;
    return remote ? 'api' : 'capture';
  };
  return {
    flights: src(flights),
    hotels: src(hotels),
    cars: src(cars),
    allInclusive: 'none',
  };
}

async function performSearch(params, { getCaptures, remoteApiBase } = {}) {
  const { origin, destination } = resolveTripPlaces(params);
  const checkIn = params.departureDate || params.checkIn || defaultDepartureDate();
  const nights = params.nights || 5;
  const guests = params.guests || 2;
  const passengers = params.passengers || 1;
  const travelRequirements = getTravelRequirements(destination.country);
  const externalLinks = buildExternalLinks({
    origin,
    destination,
    checkIn,
    nights,
    guests,
    passengers,
    returnDate: params.returnDate,
  });

  let remoteData = null;
  if (remoteApiBase) {
    try {
      remoteData = await remoteSearch(remoteApiBase, params);
    } catch {
      remoteData = null;
    }
  }

  const captures = getCaptures ? await getCaptures() : [];
  const fromCaptures = capturesToSearchResults(captures, {
    origin,
    destination,
    originAirport: origin.airport,
    destinationAirport: destination.airport,
  });

  const merged = mergeSearchResults(
    {
      flights: remoteData?.flights || [],
      hotels: remoteData?.hotels || [],
      cars: remoteData?.cars || [],
      allInclusive: remoteData?.allInclusive || [],
    },
    fromCaptures
  );

  const hasResults =
    merged.flights.length || merged.hotels.length || merged.cars.length || merged.allInclusive.length;

  const dataSources = resolveSources(merged.flights, merged.hotels, merged.cars, !!remoteData);

  return {
    destinationId: destination.id,
    destination: { city: destination.city, country: destination.country, airport: destination.airport },
    origin: { city: origin.city, country: origin.country, airport: origin.airport },
    passengers,
    guests,
    nights,
    checkIn,
    returnDate: params.returnDate || null,
    flights: rankByPrice(merged.flights),
    hotels: rankByPrice(merged.hotels),
    cars: rankByPrice(merged.cars),
    allInclusive: rankByPrice(merged.allInclusive),
    travelRequirements,
    externalLinks,
    dataSources,
    mode: remoteData ? 'api' : captures.length ? 'capture' : 'showcase',
    hasResults,
    note: hasResults
      ? `Rota ${origin.city} → ${destination.city}. Valores de fontes reais (API ou capturas do Google Voos / sites parceiros).`
      : `Rota ${origin.city} → ${destination.city}. Busque no Google Voos e use a extensão para importar preços reais, ou configure a API Meta Travel.`,
  };
}

function createCheckoutHandlers() {
  return {
    build(selection) {
      const summary = buildTripSummary(selection);
      return Promise.resolve({ ...summary, builtAt: new Date().toISOString() });
    },

    createCheckout(selection) {
      const summary = buildTripSummary(selection);
      const checkoutId = `ck-local-${Date.now()}`;
      const sorted = [...summary.components].sort(
        (a, b) => STEP_ORDER.indexOf(a.type) - STEP_ORDER.indexOf(b.type)
      );

      const steps = sorted.map((c, stepIndex) => ({
        stepIndex,
        type: c.type,
        label: STEP_LABELS[c.type],
        name: c.name,
        finalPrice: c.finalPrice,
        commissionRate: COMMISSION_RATES[c.type] || 0,
        estimatedCommission: Math.round(c.finalPrice * ((COMMISSION_RATES[c.type] || 0) / 100)),
        status: 'pending',
        trackedUrl: wrapUrl(c.bookingUrl, { checkoutId, type: c.type, provider: c.provider, stepIndex }),
        goUrl: wrapUrl(c.bookingUrl, { checkoutId, type: c.type, provider: c.provider, stepIndex }),
      }));

      const session = {
        checkoutId,
        status: 'pending',
        total: summary.total,
        estimatedCommission: steps.reduce((s, x) => s + x.estimatedCommission, 0),
        steps,
        stepCount: steps.length,
      };

      checkoutSessions.set(checkoutId, session);
      try {
        localStorage.setItem(`mt-checkout-${checkoutId}`, JSON.stringify(session));
      } catch { /* ignore */ }

      return Promise.resolve(session);
    },

    getCheckout(checkoutId) {
      let session = checkoutSessions.get(checkoutId);
      if (!session) {
        try {
          session = JSON.parse(localStorage.getItem(`mt-checkout-${checkoutId}`));
        } catch { /* ignore */ }
      }
      if (!session) return Promise.reject(new Error('Checkout não encontrado.'));
      return Promise.resolve(session);
    },

    completeCheckoutStep(checkoutId, stepIndex) {
      return this.getCheckout(checkoutId).then((session) => {
        const steps = [...session.steps];
        steps[stepIndex] = { ...steps[stepIndex], status: 'completed' };
        const updated = {
          ...session,
          steps,
          status: steps.every((s) => s.status === 'completed') ? 'completed' : 'in_progress',
        };
        checkoutSessions.set(checkoutId, updated);
        try {
          localStorage.setItem(`mt-checkout-${checkoutId}`, JSON.stringify(updated));
        } catch { /* ignore */ }
        return updated;
      });
    },
  };
}

export function createTravelApi({ getCaptures, remoteApiBase, mode = 'showcase' } = {}) {
  const checkout = createCheckoutHandlers();

  return {
    mode,

    getStatus() {
      return Promise.resolve({
        amadeus: remoteApiBase ? 'remote-api' : 'configure-api',
        booking: remoteApiBase ? 'remote-api' : 'configure-api',
        rentalcars: remoteApiBase ? 'remote-api' : 'configure-api',
        partners: PARTNERS.length,
        mode,
        remoteApiBase: remoteApiBase || null,
      });
    },

    getDestinations() {
      return Promise.resolve({ destinations: listPlaces() });
    },

    searchPlaces(query) {
      return Promise.resolve({ places: searchPlaces(query, 12) });
    },

    getPartners() {
      return Promise.resolve({ partners: PARTNERS });
    },

    getTravelRequirements(country) {
      return Promise.resolve(getTravelRequirements(country));
    },

    search(params) {
      return performSearch(params, { getCaptures, remoteApiBase });
    },

    ...checkout,
  };
}

/** API padrão no navegador (GitHub Pages) — sem capturas locais */
export const localTravelApi = createTravelApi({ mode: 'showcase' });

export { searchPlaces, resolveTripPlaces, listPlaces };
