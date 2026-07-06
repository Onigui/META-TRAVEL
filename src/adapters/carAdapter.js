const rentalcars = require('./rentalcarsClient');
const amadeus = require('./amadeusClient');
const { generateCars } = require('../../shared/mockPricing.cjs');

module.exports = {
  source: 'car-rental-aggregator',
  async search({ destinationPlace, days = 5, pickUpDate, dropOffDate }) {
    const dest = destinationPlace;
    const airport = dest.airport;
    const pickUp = pickUpDate || amadeus.defaultDepartureDate();
    const dropOff = dropOffDate || amadeus.addDays(pickUp, days);

    if (rentalcars.isConfigured() && dest.airport !== 'XXX') {
      try {
        const cars = await rentalcars.searchCars({
          airport,
          city: dest.city,
          days,
          pickUpDate: pickUp,
          dropOffDate: dropOff,
        });
        if (cars.length) return cars;
      } catch (err) {
        console.warn('[carAdapter] Rentalcars API indisponível:', err.message);
      }
    }

    if (process.env.DEMO_MODE === '1') {
      return generateCars({
        destination: dest,
        days,
        pickUpDate: pickUp,
        dropOffDate: dropOff,
      });
    }
    return [];
  },
};
