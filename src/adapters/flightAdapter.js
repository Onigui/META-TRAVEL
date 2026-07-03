const amadeus = require('./amadeusClient');
const { generateFlights } = require('../../shared/mockPricing.cjs');

module.exports = {
  source: 'flight-aggregator',
  async search({ originPlace, destinationPlace, passengers = 1, departureDate }) {
    const origin = originPlace;
    const destination = destinationPlace;
    const date = departureDate || amadeus.defaultDepartureDate();

    if (amadeus.isConfigured() && destination.airport !== 'XXX') {
      try {
        const flights = await amadeus.searchFlightOffers({
          origin: origin.airport.toUpperCase(),
          destination: destination.airport.toUpperCase(),
          passengers,
          departureDate: date,
        });
        if (flights.length) return flights;
      } catch (err) {
        console.warn('[flightAdapter] Amadeus indisponível, usando estimativa:', err.message);
      }
    }

    return generateFlights({ origin, destination, passengers, departureDate: date });
  },
};
