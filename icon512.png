const amadeus = require('./amadeusClient');
const booking = require('./bookingClient');
const { getDestination } = require('../../shared/tripDataBridge');

const MOCK_HOTELS = {
  'cancun-mx': [
    { id: 'ht-riu', provider: 'booking', name: 'Hotel Riu Cancún', stars: 4, basePrice: 890, zone: 'Zona Hotelera' },
    { id: 'ht-hyatt', provider: 'hyatt', name: 'Hyatt Ziva Cancún', stars: 5, basePrice: 1450, zone: 'Punta Cancún' },
    { id: 'ht-ibis', provider: 'accor', name: 'Ibis Cancún Centro', stars: 3, basePrice: 420, zone: 'Centro' },
    { id: 'ht-airbnb', provider: 'airbnb', name: 'Apartamento Zona Hotelera', stars: null, basePrice: 580, zone: 'Zona Hotelera' },
  ],
  'miami-us': [
    { id: 'ht-fontainebleau', provider: 'booking', name: 'Fontainebleau Miami Beach', stars: 5, basePrice: 1680, zone: 'Miami Beach' },
    { id: 'ht-hilton', provider: 'hilton', name: 'Hilton Downtown', stars: 4, basePrice: 920, zone: 'Downtown' },
    { id: 'ht-hostel', provider: 'hostelworld', name: 'Freehand Miami', stars: 3, basePrice: 310, zone: 'Mid-Beach' },
  ],
  'lisboa-pt': [
    { id: 'ht-altis', provider: 'booking', name: 'Altis Belém Hotel & Spa', stars: 5, basePrice: 780, zone: 'Belém' },
    { id: 'ht-eurostars', provider: 'eurostars', name: 'Eurostars Lisboa Parque', stars: 4, basePrice: 520, zone: 'Parque' },
  ],
  'bali-id': [
    { id: 'ht-ayana', provider: 'booking', name: 'Ayana Resort Bali', stars: 5, basePrice: 1120, zone: 'Jimbaran' },
    { id: 'ht-ubud', provider: 'airbnb', name: 'Villa Ubud com piscina', stars: null, basePrice: 650, zone: 'Ubud' },
  ],
};

function mapMock(hotels, { nights, guests, checkIn }) {
  return hotels.map((h) => ({
    id: h.id,
    type: 'hotel',
    provider: h.provider,
    name: h.name,
    basePrice: h.basePrice * nights,
    partnerId: h.provider === 'booking' ? 'booking' : null,
    details: {
      stars: h.stars,
      zone: h.zone,
      nights,
      guests,
      checkIn,
      pricePerNight: h.basePrice,
    },
    bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.name)}`,
    source: 'mock',
  }));
}

function dedupeHotels(hotels) {
  const seen = new Set();
  return hotels.filter((h) => {
    const key = h.name.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = {
  source: 'hotel-aggregator',
  async search({ destinationId, nights = 5, guests = 2, checkIn }) {
    const dest = getDestination(destinationId);
    const cityCode = dest.cityCode || dest.airport;
    const checkInDate = checkIn || amadeus.defaultDepartureDate();
    const checkOutDate = amadeus.addDays(checkInDate, nights);
    const results = [];
    const sources = [];

    if (amadeus.isConfigured()) {
      try {
        const amadeusHotels = await amadeus.searchHotelOffers({
          cityCode,
          guests,
          nights,
          checkIn: checkInDate,
        });
        if (amadeusHotels.length) {
          results.push(...amadeusHotels);
          sources.push('amadeus');
        }
      } catch (err) {
        console.warn('[hotelAdapter] Amadeus indisponível:', err.message);
      }
    }

    if (booking.isConfigured()) {
      try {
        const bookingHotels = await booking.searchHotels({
          cityName: dest.city,
          bookingDestId: dest.bookingDestId,
          guests,
          nights,
          checkIn: checkInDate,
          checkOut: checkOutDate,
        });
        if (bookingHotels.length) {
          results.push(...bookingHotels);
          sources.push('booking');
        }
      } catch (err) {
        console.warn('[hotelAdapter] Booking indisponível:', err.message);
      }
    }

    if (results.length) {
      return dedupeHotels(results).map((h) => ({ ...h, sourcesUsed: sources }));
    }

    const mock = MOCK_HOTELS[destinationId] || [];
    return mapMock(mock, { nights, guests, checkIn: checkInDate });
  },
};
