const amadeus = require('./amadeusClient');
const booking = require('./bookingClient');
const { generateHotels } = require('../../shared/mockPricing.cjs');

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
  async search({ destinationPlace, nights = 5, guests = 2, checkIn }) {
    const dest = destinationPlace;
    const cityCode = dest.cityCode || dest.airport;
    const checkInDate = checkIn || amadeus.defaultDepartureDate();
    const checkOutDate = amadeus.addDays(checkInDate, nights);
    const results = [];

    if (amadeus.isConfigured() && dest.airport !== 'XXX') {
      try {
        const amadeusHotels = await amadeus.searchHotelOffers({
          cityCode,
          guests,
          nights,
          checkIn: checkInDate,
        });
        if (amadeusHotels.length) results.push(...amadeusHotels);
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
        if (bookingHotels.length) results.push(...bookingHotels);
      } catch (err) {
        console.warn('[hotelAdapter] Booking indisponível:', err.message);
      }
    }

    if (results.length) return dedupeHotels(results);

    if (process.env.DEMO_MODE === '1') {
      return generateHotels({
        destination: dest,
        nights,
        guests,
        checkIn: checkInDate,
      });
    }
    return [];
  },
};
