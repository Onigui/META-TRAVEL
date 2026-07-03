/** Motor Meta Travel 100% no navegador — GitHub Pages e extensão */

import { listPlaces, resolveTripPlaces, searchPlaces } from './places.js';
import {
  generateFlights,
  generateHotels,
  generateCars,
  generateAllInclusive,
} from './mockPricing.js';

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
  return [...items].sort((a, b) => a.basePrice - b.basePrice);
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

export const localTravelApi = {
  mode: 'local',

  getStatus() {
    return Promise.resolve({
      amadeus: 'estimate-local',
      booking: 'estimate-local',
      rentalcars: 'estimate-local',
      partners: PARTNERS.length,
      mode: 'local',
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

  search(params) {
    const { origin, destination } = resolveTripPlaces(params);
    const checkIn = params.departureDate || params.checkIn || defaultDepartureDate();
    const nights = params.nights || 5;
    const guests = params.guests || 2;
    const passengers = params.passengers || 1;

    const flights = generateFlights({
      origin,
      destination,
      passengers,
      departureDate: checkIn,
    });
    const hotels = generateHotels({ destination, nights, guests, checkIn });
    const cars = generateCars({
      destination,
      days: nights,
      pickUpDate: checkIn,
      dropOffDate: addDays(checkIn, nights),
    });
    const allInclusive = generateAllInclusive({ destination, nights, guests });

    return Promise.resolve({
      destinationId: destination.id,
      destination: { city: destination.city, country: destination.country, airport: destination.airport },
      origin: { city: origin.city, country: origin.country, airport: origin.airport },
      passengers,
      guests,
      nights,
      checkIn,
      returnDate: params.returnDate || null,
      flights: rankByPrice(flights),
      hotels: rankByPrice(hotels),
      cars: rankByPrice(cars),
      allInclusive: rankByPrice(allInclusive),
      dataSources: { flights: 'estimate', hotels: 'estimate', cars: 'estimate', allInclusive: 'estimate' },
      mode: 'local',
      note: `Rota ${origin.city} (${origin.airport}) → ${destination.city} (${destination.airport}). Preços estimados pela distância e região.`,
    });
  },

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

export { searchPlaces, resolveTripPlaces, listPlaces };
