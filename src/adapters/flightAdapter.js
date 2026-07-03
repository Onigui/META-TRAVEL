const amadeus = require('./amadeusClient');
const { getDestination } = require('../../shared/tripDataBridge');

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

function mapMock(flights, { origin, destinationId, passengers, departureDate }) {
  return flights.map((f) => ({
    id: f.id,
    type: 'flight',
    provider: f.provider,
    name: `${f.airline} · ${origin} → ${destinationId}`,
    basePrice: f.basePrice * passengers,
    partnerId: ['latam', 'gol'].includes(f.provider) ? f.provider : null,
    details: {
      airline: f.airline,
      origin,
      stops: f.stops,
      duration: f.duration,
      departure: f.departure,
      departureDate: departureDate || amadeus.defaultDepartureDate(),
      passengers,
    },
    bookingUrl: `https://example.com/book/flight/${f.id}`,
    source: 'mock',
  }));
}

module.exports = {
  source: 'flight-aggregator',
  async search({ destinationId, origin = 'GRU', passengers = 1, departureDate }) {
    let destinationAirport = destinationId;
    try {
      destinationAirport = getDestination(destinationId).airport;
    } catch {
      // origin/destination já podem ser códigos IATA
    }

    const date = departureDate || amadeus.defaultDepartureDate();

    if (amadeus.isConfigured()) {
      try {
        const flights = await amadeus.searchFlightOffers({
          origin: origin.toUpperCase(),
          destination: destinationAirport.toUpperCase(),
          passengers,
          departureDate: date,
        });
        if (flights.length) {
          return flights;
        }
      } catch (err) {
        console.warn('[flightAdapter] Amadeus indisponível, usando mock:', err.message);
      }
    }

    const flights = MOCK_FLIGHTS[destinationId] || [];
    return mapMock(flights, { origin, destinationId, passengers, departureDate: date });
  },
};
