/**
 * Rentalcars.com via RapidAPI (opcional) ou deep links de afiliado
 * Configure RENTALCARS_RAPIDAPI_KEY + RENTALCARS_RAPIDAPI_HOST
 * Ex.: car-rental-api.p.rapidapi.com
 */

const RENTALCARS_RAPIDAPI_KEY = process.env.RENTALCARS_RAPIDAPI_KEY || '';
const RENTALCARS_RAPIDAPI_HOST = process.env.RENTALCARS_RAPIDAPI_HOST || 'car-rental-api.p.rapidapi.com';
const RENTALCARS_AFFILIATE_ID = process.env.RENTALCARS_AFFILIATE_ID || 'meta-travel';

const PROVIDER_PARTNERS = {
  localiza: 'localiza',
  hertz: null,
  budget: null,
  enterprise: null,
  europcar: null,
  avis: null,
};

function isConfigured() {
  return Boolean(RENTALCARS_RAPIDAPI_KEY);
}

function buildDeepLink({ airport, city, pickUpDate, dropOffDate }) {
  const location = airport || city;
  const params = new URLSearchParams({
    affiliateCode: RENTALCARS_AFFILIATE_ID,
    preflang: 'pt',
    doLanding: 'false',
    pickupLocation: location,
    dropoffLocation: location,
  });
  if (pickUpDate) params.set('pickupDate', pickUpDate);
  if (dropOffDate) params.set('dropoffDate', dropOffDate);
  return `https://www.rentalcars.com/SearchResults.do?${params}`;
}

async function rapidFetch(path, params = {}) {
  const url = new URL(`https://${RENTALCARS_RAPIDAPI_HOST}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': RENTALCARS_RAPIDAPI_KEY,
      'X-RapidAPI-Host': RENTALCARS_RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Rentalcars API falhou: ${err}`);
  }

  return res.json();
}

function normalizeProvider(supplierName = '') {
  const lower = supplierName.toLowerCase();
  if (lower.includes('localiza')) return 'localiza';
  if (lower.includes('hertz')) return 'hertz';
  if (lower.includes('budget')) return 'budget';
  if (lower.includes('enterprise')) return 'enterprise';
  if (lower.includes('europcar')) return 'europcar';
  if (lower.includes('avis')) return 'avis';
  return lower.replace(/\s+/g, '-').slice(0, 20) || 'rental';
}

function mapCar(item, { days, pickUpDate, dropOffDate, airport, city }) {
  const pricePerDay = Number.parseFloat(item.price?.amount || item.daily_rate || item.price || 0);
  const provider = normalizeProvider(item.supplier?.name || item.company || item.vendor || '');
  const category = item.vehicle?.category || item.car_class || item.category || 'Padrão';
  const name = item.vehicle?.name || item.name || `${provider} · ${category}`;

  return {
    id: `rentalcars-${item.id || `${provider}-${category}`.replace(/\s+/g, '-')}`,
    type: 'car',
    provider,
    name,
    basePrice: Math.round(pricePerDay * days),
    partnerId: PROVIDER_PARTNERS[provider] || null,
    details: {
      category,
      days,
      pricePerDay: Math.round(pricePerDay),
      pickUpDate,
      dropOffDate,
      location: airport || city,
      transmission: item.vehicle?.transmission || null,
      seats: item.vehicle?.seats || null,
    },
    bookingUrl: item.url || buildDeepLink({ airport, city, pickUpDate, dropOffDate }),
    source: 'rentalcars',
  };
}

async function searchCars({ airport, city, days = 5, pickUpDate, dropOffDate }) {
  const data = await rapidFetch('/api/v1/cars/search', {
    pickup_location: airport || city,
    dropoff_location: airport || city,
    pickup_date: pickUpDate,
    dropoff_date: dropOffDate,
    currency: 'BRL',
    locale: 'pt-BR',
  });

  const cars = data.results || data.data || data.cars || [];
  return cars.slice(0, 10).map((item) =>
    mapCar(item, { days, pickUpDate, dropOffDate, airport, city })
  );
}

module.exports = {
  isConfigured,
  searchCars,
  buildDeepLink,
};
