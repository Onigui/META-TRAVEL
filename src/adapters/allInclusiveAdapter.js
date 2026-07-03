/** Adapter de resorts all-inclusive — opcional, separado de hotéis comuns */

const MOCK_RESORTS = {
  'cancun-mx': [
    {
      id: 'ai-decameron',
      provider: 'decameron',
      name: 'Decameron All Inclusive Cancún',
      basePrice: 4200,
      meals: 'Todas refeições + bebidas',
      activities: 'Esportes aquáticos incluídos',
    },
    {
      id: 'ai-riu-palace',
      provider: 'riu',
      name: 'Riu Palace Paradise Island',
      basePrice: 5100,
      meals: 'Gourmet all inclusive',
      activities: 'Spa parcial incluído',
    },
  ],
  'bali-id': [
    {
      id: 'ai-club-med',
      provider: 'clubmed',
      name: 'Club Med Bali',
      basePrice: 6800,
      meals: 'All inclusive premium',
      activities: 'Aulas de surf incluídas',
    },
  ],
};

module.exports = {
  source: 'all-inclusive-aggregator',
  async search({ destinationId, nights = 5, guests = 2 }) {
    const resorts = MOCK_RESORTS[destinationId] || [];
    return resorts.map((r) => ({
      id: r.id,
      type: 'allInclusive',
      provider: r.provider,
      name: r.name,
      basePrice: r.basePrice * Math.ceil(guests / 2),
      partnerId: r.provider === 'decameron' ? 'decameron' : null,
      details: {
        nights,
        guests,
        meals: r.meals,
        activities: r.activities,
        pricePerNight: Math.round(r.basePrice / nights),
      },
      bookingUrl: `https://example.com/book/resort/${r.id}`,
      source: this.source,
    }));
  },
};
