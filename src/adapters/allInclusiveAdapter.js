const { generateAllInclusive } = require('../../shared/mockPricing.cjs');

module.exports = {
  source: 'all-inclusive-aggregator',
  async search({ destinationPlace, nights = 5, guests = 2 }) {
    return generateAllInclusive({ destination: destinationPlace, nights, guests });
  },
};
