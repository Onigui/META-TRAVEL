const { resolveTripPlaces, listPlaces } = require('../../shared/places.cjs');
const partnerStore = require('./partnerStore');
const { buildTripSummary, rankByPrice } = require('../../shared/tripEngineBridge');

const flightAdapter = require('../adapters/flightAdapter');
const hotelAdapter = require('../adapters/hotelAdapter');
const carAdapter = require('../adapters/carAdapter');
const allInclusiveAdapter = require('../adapters/allInclusiveAdapter');
const amadeus = require('../adapters/amadeusClient');
const booking = require('../adapters/bookingClient');
const rentalcars = require('../adapters/rentalcarsClient');

function resolveDataSource({ configured, hasResults, source }) {
  if (!configured) return 'estimate';
  if (hasResults && source) return source;
  if (configured && !hasResults) return `${source || 'api'}+estimate`;
  return 'estimate';
}

async function searchAllOptions(params) {
  const {
    passengers = 1,
    guests = 2,
    nights = 5,
    days = 5,
    departureDate,
    checkIn,
    returnDate,
  } = params;

  const { origin, destination } = resolveTripPlaces(params);
  const checkInDate = checkIn || departureDate || amadeus.defaultDepartureDate();
  const rentalDays = days || nights;

  const [flights, hotels, cars, allInclusive] = await Promise.all([
    flightAdapter.search({
      originPlace: origin,
      destinationPlace: destination,
      passengers,
      departureDate: checkInDate,
      returnDate,
    }),
    hotelAdapter.search({
      destinationPlace: destination,
      nights,
      guests,
      checkIn: checkInDate,
    }),
    carAdapter.search({
      destinationPlace: destination,
      days: rentalDays,
      pickUpDate: checkInDate,
      dropOffDate: amadeus.addDays(checkInDate, rentalDays),
    }),
    allInclusiveAdapter.search({ destinationPlace: destination, nights, guests }),
  ]);

  const flightSource = flights[0]?.source || 'estimate';
  const hotelSource = hotels.some((h) => h.source === 'booking')
    ? (hotels.some((h) => h.source === 'amadeus') ? 'amadeus+booking' : 'booking')
    : (hotels[0]?.source || 'estimate');
  const carSource = cars[0]?.source || 'estimate';

  return {
    destinationId: destination.id,
    destination: {
      city: destination.city,
      country: destination.country,
      airport: destination.airport,
    },
    origin: {
      city: origin.city,
      country: origin.country,
      airport: origin.airport,
    },
    passengers,
    guests,
    nights,
    checkIn: checkInDate,
    returnDate: returnDate || null,
    flights: rankByPrice(flights),
    hotels: rankByPrice(hotels),
    cars: rankByPrice(cars),
    allInclusive: rankByPrice(allInclusive),
    fetchedAt: new Date().toISOString(),
    mode: 'aggregated',
    dataSources: {
      flights: resolveDataSource({
        configured: amadeus.isConfigured(),
        hasResults: flightSource === 'amadeus',
        source: 'amadeus',
      }),
      hotels: resolveDataSource({
        configured: amadeus.isConfigured() || booking.isConfigured(),
        hasResults: hotelSource === 'amadeus' || hotelSource === 'booking' || hotelSource === 'amadeus+booking',
        source: hotelSource,
      }),
      cars: resolveDataSource({
        configured: rentalcars.isConfigured(),
        hasResults: carSource === 'rentalcars',
        source: 'rentalcars',
      }),
      allInclusive: 'estimate',
    },
    note: `Rota ${origin.city} (${origin.airport}) → ${destination.city} (${destination.airport}). Preços estimados com base na distância e região — configure .env para APIs reais.`,
  };
}

function buildTrip(selection) {
  const summary = buildTripSummary(selection, partnerStore.listPartners());
  const bookingLinks = summary.components
    .filter((c) => c.bookingUrl)
    .map((c) => ({ type: c.type, name: c.name, url: c.bookingUrl, finalPrice: c.finalPrice }));

  return {
    ...summary,
    bookingLinks,
    builtAt: new Date().toISOString(),
  };
}

function listPartnersInfo() {
  return {
    partners: partnerStore.listPartners(),
    howItWorks: [
      'Empresas cadastram descontos exclusivos na plataforma.',
      'Usuários montam a viagem livremente e recebem o desconto automaticamente.',
      'Sem pacote fechado — cada parceiro aparece apenas no seu segmento.',
    ],
    adminPanel: '/partners.html',
  };
}

function listDestinations() {
  return { destinations: listPlaces() };
}

function adminListPartners() {
  const fs = require('fs');
  const path = require('path');
  const file = path.join(__dirname, '../../data/partners.json');
  partnerStore.listPartners();
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = {
  searchAllOptions,
  buildTrip,
  listPartners: listPartnersInfo,
  listDestinations,
  adminListPartners,
  partnerStore,
};
