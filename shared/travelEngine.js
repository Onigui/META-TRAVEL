/** Motor Meta Travel 100% no navegador — GitHub Pages, sem Node.js */

export const DESTINATIONS = [
  { id: 'cancun-mx', city: 'Cancún', country: 'México', airport: 'CUN', cityCode: 'CUN' },
  { id: 'miami-us', city: 'Miami', country: 'EUA', airport: 'MIA', cityCode: 'MIA' },
  { id: 'lisboa-pt', city: 'Lisboa', country: 'Portugal', airport: 'LIS', cityCode: 'LIS' },
  { id: 'bali-id', city: 'Bali', country: 'Indonésia', airport: 'DPS', cityCode: 'DPS' },
];

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

const MOCK_FLIGHTS = {
  'cancun-mx': [
    { id: 'fl-latam-1', provider: 'latam', airline: 'LATAM', basePrice: 2890, stops: 0, duration: '9h20', departure: '08:15' },
    { id: 'fl-gol-1', provider: 'gol', airline: 'GOL', basePrice: 2450, stops: 1, duration: '13h05', departure: '06:40' },
    { id: 'fl-azul-1', provider: 'azul', airline: 'Azul', basePrice: 2680, stops: 1, duration: '11h30', departure: '14:20' },
    { id: 'fl-avianca-1', provider: 'avianca', airline: 'Avianca', basePrice: 2310, stops: 1, duration: '12h45', departure: '22:10' },
  ],
  'miami-us': [
    { id: 'fl-latam-mia', provider: 'latam', airline: 'LATAM', basePrice: 1890, stops: 0, duration: '8h50', departure: '23:55' },
    { id: 'fl-gol-mia', provider: 'gol', airline: 'GOL', basePrice: 1720, stops: 1, duration: '11h20', departure: '07:30' },
    { id: 'fl-american-mia', provider: 'american', airline: 'American Airlines', basePrice: 2100, stops: 0, duration: '8h40', departure: '10:15' },
  ],
  'lisboa-pt': [
    { id: 'fl-tap-lis', provider: 'tap', airline: 'TAP Air Portugal', basePrice: 3200, stops: 0, duration: '10h15', departure: '18:45' },
    { id: 'fl-latam-lis', provider: 'latam', airline: 'LATAM', basePrice: 3450, stops: 1, duration: '14h30', departure: '21:00' },
  ],
  'bali-id': [
    { id: 'fl-singapore-bali', provider: 'singapore', airline: 'Singapore Airlines', basePrice: 4890, stops: 1, duration: '22h10', departure: '01:20' },
    { id: 'fl-qatar-bali', provider: 'qatar', airline: 'Qatar Airways', basePrice: 4520, stops: 1, duration: '20h45', departure: '03:50' },
  ],
};

const MOCK_HOTELS = {
  'cancun-mx': [
    { id: 'ht-riu', provider: 'booking', name: 'Hotel Riu Cancún', stars: 4, basePrice: 890, zone: 'Zona Hotelera' },
    { id: 'ht-hyatt', provider: 'hyatt', name: 'Hyatt Ziva Cancún', stars: 5, basePrice: 1450, zone: 'Punta Cancún' },
    { id: 'ht-ibis', provider: 'accor', name: 'Ibis Cancún Centro', stars: 3, basePrice: 420, zone: 'Centro' },
  ],
  'miami-us': [
    { id: 'ht-fontainebleau', provider: 'booking', name: 'Fontainebleau Miami Beach', stars: 5, basePrice: 1680, zone: 'Miami Beach' },
    { id: 'ht-hilton', provider: 'hilton', name: 'Hilton Downtown', stars: 4, basePrice: 920, zone: 'Downtown' },
  ],
  'lisboa-pt': [
    { id: 'ht-altis', provider: 'booking', name: 'Altis Belém Hotel & Spa', stars: 5, basePrice: 780, zone: 'Belém' },
    { id: 'ht-eurostars', provider: 'eurostars', name: 'Eurostars Lisboa Parque', stars: 4, basePrice: 520, zone: 'Parque' },
  ],
  'bali-id': [
    { id: 'ht-ayana', provider: 'booking', name: 'Ayana Resort Bali', stars: 5, basePrice: 1120, zone: 'Jimbaran' },
  ],
};

const MOCK_CARS = {
  'cancun-mx': [
    { id: 'car-localiza-econ', provider: 'localiza', name: 'Localiza · Econômico', category: 'Econômico', basePrice: 280 },
    { id: 'car-hertz-suv', provider: 'hertz', name: 'Hertz · SUV', category: 'SUV', basePrice: 520 },
  ],
  'miami-us': [
    { id: 'car-enterprise-mid', provider: 'enterprise', name: 'Enterprise · Intermediário', category: 'Intermediário', basePrice: 380 },
    { id: 'car-localiza-mia', provider: 'localiza', name: 'Localiza · Econômico', category: 'Econômico', basePrice: 310 },
  ],
  'lisboa-pt': [{ id: 'car-europcar', provider: 'europcar', name: 'Europcar · Compacto', category: 'Compacto', basePrice: 290 }],
  'bali-id': [{ id: 'car-scooter', provider: 'local', name: 'Scooter local', category: 'Scooter', basePrice: 90 }],
};

const MOCK_RESORTS = {
  'cancun-mx': [
    { id: 'ai-decameron', provider: 'decameron', name: 'Decameron All Inclusive Cancún', basePrice: 4200, meals: 'Todas refeições + bebidas', activities: 'Esportes aquáticos' },
    { id: 'ai-riu-palace', provider: 'riu', name: 'Riu Palace', basePrice: 5100, meals: 'Gourmet all inclusive', activities: 'Spa parcial' },
  ],
  'bali-id': [
    { id: 'ai-club-med', provider: 'clubmed', name: 'Club Med Bali', basePrice: 6800, meals: 'All inclusive premium', activities: 'Surf incluído' },
  ],
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

function searchFlights(destinationId, { origin = 'GRU', passengers = 1, departureDate }) {
  const date = departureDate || defaultDepartureDate();
  return (MOCK_FLIGHTS[destinationId] || []).map((f) => ({
    id: f.id,
    type: 'flight',
    provider: f.provider,
    name: `${f.airline} · ${origin} → ${destinationId}`,
    basePrice: f.basePrice * passengers,
    partnerId: ['latam', 'gol'].includes(f.provider) ? f.provider : null,
    details: { airline: f.airline, origin, stops: f.stops, duration: f.duration, departure: f.departure, departureDate: date, passengers },
    bookingUrl: `https://www.google.com/travel/flights?q=Flights+${origin}+on+${date}`,
    source: 'demo',
  }));
}

function searchHotels(destinationId, { nights = 5, guests = 2, checkIn }) {
  const checkInDate = checkIn || defaultDepartureDate();
  return (MOCK_HOTELS[destinationId] || []).map((h) => ({
    id: h.id,
    type: 'hotel',
    provider: h.provider,
    name: h.name,
    basePrice: h.basePrice * nights,
    partnerId: h.provider === 'booking' ? 'booking' : null,
    details: { stars: h.stars, zone: h.zone, nights, guests, checkIn: checkInDate, pricePerNight: h.basePrice },
    bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name)}&checkin=${checkInDate}`,
    source: 'demo',
  }));
}

function searchCars(destinationId, { days = 5, pickUpDate }) {
  const pickUp = pickUpDate || defaultDepartureDate();
  const dropOff = addDays(pickUp, days);
  const dest = DESTINATIONS.find((d) => d.id === destinationId);
  return (MOCK_CARS[destinationId] || []).map((c) => ({
    id: c.id,
    type: 'car',
    provider: c.provider,
    name: c.name,
    basePrice: c.basePrice * days,
    partnerId: c.provider === 'localiza' ? 'localiza' : null,
    details: { category: c.category, days, pricePerDay: c.basePrice, pickUpDate: pickUp, dropOffDate: dropOff },
    bookingUrl: `https://www.rentalcars.com/SearchResults.do?affiliateCode=meta-travel&pickupLocation=${dest?.airport || ''}`,
    source: 'demo',
  }));
}

function searchAllInclusive(destinationId, { nights = 5, guests = 2 }) {
  return (MOCK_RESORTS[destinationId] || []).map((r) => ({
    id: r.id,
    type: 'allInclusive',
    provider: r.provider,
    name: r.name,
    basePrice: r.basePrice * Math.ceil(guests / 2),
    partnerId: r.provider === 'decameron' ? 'decameron' : null,
    details: { nights, guests, meals: r.meals, activities: r.activities },
    bookingUrl: `https://www.decameron.com/es/hoteles`,
    source: 'demo',
  }));
}

const checkoutSessions = new Map();

export const localTravelApi = {
  mode: 'local',

  getStatus() {
    return Promise.resolve({
      amadeus: 'demo-local',
      booking: 'demo-local',
      rentalcars: 'demo-local',
      partners: PARTNERS.length,
      mode: 'local',
    });
  },

  getDestinations() {
    return Promise.resolve({ destinations: DESTINATIONS });
  },

  getPartners() {
    return Promise.resolve({ partners: PARTNERS });
  },

  search(params) {
    const checkIn = params.departureDate || params.checkIn || defaultDepartureDate();
    const nights = params.nights || 5;
    const flights = searchFlights(params.destinationId, params);
    const hotels = searchHotels(params.destinationId, { nights, guests: params.guests, checkIn });
    const cars = searchCars(params.destinationId, { days: nights, pickUpDate: checkIn });
    const allInclusive = searchAllInclusive(params.destinationId, { nights, guests: params.guests });

    return Promise.resolve({
      destinationId: params.destinationId,
      origin: params.origin || 'GRU',
      passengers: params.passengers || 1,
      guests: params.guests || 2,
      nights,
      checkIn,
      flights: rankByPrice(flights),
      hotels: rankByPrice(hotels),
      cars: rankByPrice(cars),
      allInclusive: rankByPrice(allInclusive),
      dataSources: { flights: 'demo', hotels: 'demo', cars: 'demo', allInclusive: 'demo' },
      mode: 'local',
      note: 'Versão demo no navegador — dados ilustrativos. Funciona sem Node.js.',
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
