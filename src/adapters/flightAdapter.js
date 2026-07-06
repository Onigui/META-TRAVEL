const amadeus = require('./amadeusClient');
const { generateFlights } = require('../../shared/mockPricing.cjs');

const ALLOW_MOCK = process.env.DEMO_MODE === '1';

module.exports = {
  source: 'flight-aggregator',
  async search({ originPlace, destinationPlace, passengers = 1, departureDate }) {
    const origin = originPlace;
    const destination = destinationPlace;
    const date = departureDate || amadeus.defaultDepartureDate();
    const flights = [];

    if (amadeus.isConfigured() && destination.airport !== 'XXX') {
      try {
        const offers = await amadeus.searchFlightOffers({
          origin: origin.airport.toUpperCase(),
          destination: destination.airport.toUpperCase(),
          passengers,
          departureDate: date,
        });
        if (offers.length) flights.push(...offers);
      } catch (err) {
        console.warn('[flightAdapter] Amadeus indisponível:', err.message);
      }
    }

    if (flights.length) return flights;
    if (ALLOW_MOCK) {
      return generateFlights({ origin, destination, passengers, departureDate: date });
    }
    return [];
  },
};
