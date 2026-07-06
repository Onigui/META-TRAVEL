/**
 * Booking.com via RapidAPI (opcional)
 * Configure BOOKING_RAPIDAPI_KEY e BOOKING_RAPIDAPI_HOST
 * Ex.: booking-com15.p.rapidapi.com — https://rapidapi.com/apidojo/api/booking-com15
 */

const BOOKING_RAPIDAPI_KEY = process.env.BOOKING_RAPIDAPI_KEY || '';
const BOOKING_RAPIDAPI_HOST = process.env.BOOKING_RAPIDAPI_HOST || 'booking-com15.p.rapidapi.com';
const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || '';

function isConfigured() {
  return Boolean(BOOKING_RAPIDAPI_KEY);
}

async function rapidFetch(path, params = {}) {
  const url = new URL(`https://${BOOKING_RAPIDAPI_HOST}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': BOOKING_RAPIDAPI_KEY,
      'X-RapidAPI-Host': BOOKING_RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Booking API falhou: ${err}`);
  }

  return res.json();
}

async function resolveDestId(cityName, bookingDestId) {
  if (bookingDestId) return bookingDestId;
  const data = await rapidFetch('/api/v1/hotels/locations', { name: cityName, locale: 'pt-br' });
  const match = data.data?.[0] || data.result?.[0];
  return match?.dest_id || match?.destId || null;
}

function buildBookingUrl(hotelName, city, checkIn, checkOut) {
  const base = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${hotelName} ${city}`)}`;
  const dates = checkIn && checkOut ? `&checkin=${checkIn}&checkout=${checkOut}` : '';
  const affiliate = BOOKING_AFFILIATE_ID ? `&aid=${BOOKING_AFFILIATE_ID}` : '';
  return `${base}${dates}${affiliate}`;
}

function mapHotel(item, { nights, guests, checkIn, checkOut, city }) {
  const pricePerNight = Number.parseFloat(item.priceBreakdown?.grossPrice?.value || item.min_total_price || item.price || 0);
  const total = pricePerNight * (item.composite_price_breakdown ? 1 : nights);

  return {
    id: `booking-${item.hotel_id || item.id}`,
    type: 'hotel',
    provider: 'booking',
    name: item.hotel_name || item.name || 'Hotel Booking.com',
    basePrice: Math.round(total || pricePerNight * nights),
    partnerId: 'booking',
    details: {
      stars: item.reviewScore ? Math.min(5, Math.round(item.reviewScore / 2)) : item.class || null,
      zone: item.district || item.city_trans || city,
      nights,
      guests,
      checkIn,
      checkOut,
      pricePerNight: Math.round(pricePerNight || total / nights),
      reviewScore: item.reviewScore || null,
      image: item.main_photo_url || item.max_photo_url || item.photoMain || null,
      images: item.main_photo_url ? [item.main_photo_url] : [],
      amenities: item.hotel_facilities?.slice?.(0, 5) || ['Wi-Fi', 'Recepção 24h'],
    },
    bookingUrl: item.url || buildBookingUrl(item.hotel_name || item.name, city, checkIn, checkOut),
    source: 'booking',
  };
}

async function searchHotels({ cityName, bookingDestId, guests = 2, nights = 5, checkIn, checkOut }) {
  const destId = await resolveDestId(cityName, bookingDestId);
  if (!destId) return [];

  const data = await rapidFetch('/api/v1/hotels/searchHotels', {
    dest_id: destId,
    search_type: 'city',
    arrival_date: checkIn,
    departure_date: checkOut,
    adults: guests,
    room_qty: 1,
    units: 'metric',
    temperature_unit: 'c',
    languagecode: 'pt-br',
    currency_code: 'BRL',
    page_number: 0,
  });

  const hotels = data.result || data.data?.hotels || data.hotels || [];
  return hotels.slice(0, 10).map((item) =>
    mapHotel(item, { nights, guests, checkIn, checkOut, city: cityName })
  );
}

module.exports = {
  isConfigured,
  searchHotels,
};
