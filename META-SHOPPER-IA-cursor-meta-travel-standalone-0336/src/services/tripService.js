const { DESTINATIONS } = require('../../shared/tripData.cjs');
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
  if (!configured) return 'mock';
  if (hasResults && source) return source;
  if (configured && !hasResults) return `${source || 'api'}+fallback-mock`;
  return 'mock';
}

async function searchAllOptions(params) {
  const {
    destinationId,
    origin = 'GRU',
    passengers = 1,
    guests = 2,
    nights = 5,
    days = 5,
    departureDate,
    checkIn,
  } = params;

  const checkInDate = checkIn || departureDate || amadeus.defaultDepartureDate();
  const rentalDays = days || nights;

  const [flights, hotels, cars, allInclusive] = await Promise.all([
    flightAdapter.search({ destinationId, origin, passengers, departureDate: checkInDate }),
    hotelAdapter.search({ destinationId, nights, guests, checkIn: checkInDate }),
    carAdapter.search({
      destinationId,
      days: rentalDays,
      pickUpDate: checkInDate,
      dropOffDate: amadeus.addDays(checkInDate, rentalDays),
    }),
    allInclusiveAdapter.search({ destinationId, nights, guests }),
  ]);

  const flightSource = flights[0]?.source || 'mock';
  const hotelSource = hotels.some((h) => h.source === 'booking')
    ? (hotels.some((h) => h.source === 'amadeus') ? 'amadeus+booking' : 'booking')
    : (hotels[0]?.source || 'mock');
  const carSource = cars[0]?.source || 'mock';

  return {
    destinationId,
    origin,
    passengers,
    guests,
    nights,
    checkIn: checkInDate,
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
      allInclusive: 'mock',
    },
    note: 'Resultados de múltiplos provedores — escolha cada item separadamente.',
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
  return { destinations: DESTINATIONS };
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
