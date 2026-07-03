const rentalcars = require('./rentalcarsClient');
const amadeus = require('./amadeusClient');
const { getDestination } = require('../../shared/tripDataBridge');

const MOCK_CARS = {
  'cancun-mx': [
    { id: 'car-localiza-econ', provider: 'localiza', name: 'Localiza · Econômico', category: 'Econômico', basePrice: 280 },
    { id: 'car-hertz-suv', provider: 'hertz', name: 'Hertz · SUV', category: 'SUV', basePrice: 520 },
    { id: 'car-budget-compact', provider: 'budget', name: 'Budget · Compacto', category: 'Compacto', basePrice: 240 },
  ],
  'miami-us': [
    { id: 'car-enterprise-mid', provider: 'enterprise', name: 'Enterprise · Intermediário', category: 'Intermediário', basePrice: 380 },
    { id: 'car-localiza-mia', provider: 'localiza', name: 'Localiza · Econômico', category: 'Econômico', basePrice: 310 },
  ],
  'lisboa-pt': [
    { id: 'car-europcar', provider: 'europcar', name: 'Europcar · Compacto', category: 'Compacto', basePrice: 290 },
  ],
  'bali-id': [
    { id: 'car-scooter', provider: 'local', name: 'Aluguel de scooter (parceiro local)', category: 'Scooter', basePrice: 90 },
    { id: 'car-driver', provider: 'local', name: 'Motorista privado (dia inteiro)', category: 'Com motorista', basePrice: 350 },
  ],
};

function mapMock(cars, { days, pickUpDate, dropOffDate, airport, city }) {
  return cars.map((c) => ({
    id: c.id,
    type: 'car',
    provider: c.provider,
    name: c.name,
    basePrice: c.basePrice * days,
    partnerId: c.provider === 'localiza' ? 'localiza' : null,
    details: {
      category: c.category,
      days,
      pricePerDay: c.basePrice,
      pickUpDate,
      dropOffDate,
      location: airport || city,
    },
    bookingUrl: rentalcars.buildDeepLink({ airport, city, pickUpDate, dropOffDate }),
    source: 'mock',
  }));
}

module.exports = {
  source: 'car-rental-aggregator',
  async search({ destinationId, days = 5, pickUpDate, dropOffDate }) {
    const dest = getDestination(destinationId);
    const airport = dest.airport;
    const pickUp = pickUpDate || amadeus.defaultDepartureDate();
    const dropOff = dropOffDate || amadeus.addDays(pickUp, days);

    if (rentalcars.isConfigured()) {
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

    const mock = MOCK_CARS[destinationId] || [];
    return mapMock(mock, {
      days,
      pickUpDate: pickUp,
      dropOffDate: dropOff,
      airport,
      city: dest.city,
    });
  },
};
