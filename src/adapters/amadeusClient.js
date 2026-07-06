const { getAirportName } = require('../../shared/placeMeta.cjs');
const { getBookingUrl } = require('../../shared/flightDetails.cjs');
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID || '';
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET || '';

let tokenCache = { token: null, expiresAt: 0 };

const CARRIER_PARTNERS = {
  LA: 'latam',
  JJ: 'latam',
  G3: 'gol',
  AD: 'azul',
  TP: 'tap',
  AA: 'american',
};

const CARRIER_NAMES = {
  LA: 'LATAM',
  JJ: 'LATAM',
  G3: 'GOL',
  AD: 'Azul',
  AV: 'Avianca',
  TP: 'TAP Air Portugal',
  AA: 'American Airlines',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
};

function isConfigured() {
  return Boolean(AMADEUS_CLIENT_ID && AMADEUS_CLIENT_SECRET);
}

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET,
  });

  const res = await fetch(`${AMADEUS_API_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Amadeus auth falhou: ${err}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return tokenCache.token;
}

function formatDuration(isoDuration) {
  if (!isoDuration) return '—';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const h = match[1] || '0';
  const m = match[2] || '0';
  return `${h}h${m.padStart(2, '0')}`;
}

function defaultDepartureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function mapFlightOffer(offer, { origin, destination, passengers, departureDate }) {
  const itinerary = offer.itineraries?.[0];
  const segs = itinerary?.segments || [];
  const segment = segs[0];
  const lastSegment = segs[segs.length - 1];
  const carrier = segment?.carrierCode || 'XX';
  const airline = CARRIER_NAMES[carrier] || carrier;
  const provider = (CARRIER_PARTNERS[carrier] || carrier).toLowerCase();
  const stops = Math.max(0, segs.length - 1);
  const price = Number.parseFloat(offer.price?.total || offer.price?.grandTotal || 0);
  const fareDetail = offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0];
  const cabin = fareDetail?.cabin || 'ECONOMY';
  const includedBags = fareDetail?.includedCheckedBags?.quantity ?? null;

  const segments = segs.map((s) => ({
    from: s.departure?.iataCode,
    to: s.arrival?.iataCode,
    fromName: getAirportName(s.departure?.iataCode, s.departure?.iataCode),
    toName: getAirportName(s.arrival?.iataCode, s.arrival?.iataCode),
    duration: formatDuration(s.duration),
    flightNumber: `${s.carrierCode || ''} ${s.number || ''}`.trim(),
    departure: s.departure?.at?.slice(11, 16),
    arrival: s.arrival?.at?.slice(11, 16),
  }));

  const layovers = [];
  for (let i = 0; i < segs.length - 1; i++) {
    const arr = segs[i].arrival?.at;
    const dep = segs[i + 1].departure?.at;
    let wait = '—';
    if (arr && dep) {
      const mins = Math.round((new Date(dep) - new Date(arr)) / 60000);
      wait = formatDuration(`PT${Math.floor(mins / 60)}H${mins % 60}M`);
    }
    const code = segs[i].arrival?.iataCode;
    layovers.push({
      airport: code,
      airportName: getAirportName(code, code),
      city: code,
      duration: wait,
      note: 'Conexão verificada via API',
    });
  }

  const baggage = {
    carryOnKg: 10,
    checkedBags: includedBags ?? (stops > 0 ? 1 : 0),
    checkedWeightKg: 23,
    extraCheckedBagPrice: 350,
    extraBagWeightKg: 23,
  };

  return {
    id: `amadeus-${offer.id}`,
    type: 'flight',
    provider,
    name: `${airline} · ${origin} → ${destination}`,
    basePrice: Math.round(price * passengers),
    partnerId: CARRIER_PARTNERS[carrier] || null,
    details: {
      airline,
      origin,
      destination,
      stops,
      duration: formatDuration(itinerary?.duration),
      departure: segment?.departure?.at?.slice(11, 16) || '—',
      arrival: lastSegment?.arrival?.at?.slice(11, 16) || '—',
      departureDate: segment?.departure?.at?.slice(0, 10) || departureDate,
      passengers,
      carrierCode: carrier,
      cabin,
      fareBrand: offer.pricingOptions?.fareType?.[0] || cabin,
      segments,
      layovers,
      layoverSummary:
        stops === 0
          ? 'Voo direto'
          : layovers.map((l) => `${l.airportName} (${l.duration})`).join(' · '),
      baggage,
      included: [
        'Item pessoal',
        `Bagagem de mão (confira limite na companhia)`,
        ...(baggage.checkedBags > 0 ? [`${baggage.checkedBags} bagagem(ns) despachada(s)`] : []),
      ],
      notIncluded: baggage.checkedBags > 0 ? [] : ['Bagagem despachada — consulte tarifa na companhia'],
      availability: 'verified',
      availabilityNote: 'Preço e rota consultados via API Amadeus. Confirme bagagem e regras no site da companhia antes de comprar.',
    },
    bookingUrl: getBookingUrl(provider, origin, destination, departureDate),
    source: 'amadeus',
    isEstimate: false,
  };
}

async function searchFlightOffers({ origin, destination, passengers = 1, departureDate }) {
  const token = await getAccessToken();
  const date = departureDate || defaultDepartureDate();

  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: String(passengers),
    currencyCode: 'BRL',
    max: '10',
  });

  const res = await fetch(`${AMADEUS_API_URL}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Amadeus flight search falhou: ${err}`);
  }

  const data = await res.json();
  return (data.data || []).map((offer) =>
    mapFlightOffer(offer, { origin, destination, passengers, departureDate: date })
  );
}

function mapHotelOffer(entry, { nights, guests, checkIn, checkOut }) {
  const hotel = entry.hotel || {};
  const bestOffer = entry.offers?.[0];
  const price = Number.parseFloat(bestOffer?.price?.total || 0);
  const pricePerNight = nights > 0 ? Math.round(price / nights) : price;

  return {
    id: `amadeus-hotel-${entry.hotel?.hotelId || bestOffer?.id || Math.random().toString(36).slice(2)}`,
    type: 'hotel',
    provider: 'amadeus',
    name: hotel.name || 'Hotel',
    basePrice: Math.round(price),
    partnerId: null,
    details: {
      stars: hotel.rating ? Math.round(hotel.rating) : null,
      zone: hotel.cityCode || hotel.address?.cityName || '—',
      nights,
      guests,
      checkIn,
      checkOut,
      pricePerNight,
      hotelId: hotel.hotelId,
      chain: hotel.chainCode || null,
    },
    bookingUrl: bestOffer?.self
      || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name || '')}`,
    source: 'amadeus',
  };
}

async function searchHotelOffers({ cityCode, guests = 2, nights = 5, checkIn }) {
  const token = await getAccessToken();
  const checkInDate = checkIn || defaultDepartureDate();
  const checkOutDate = addDays(checkInDate, nights);

  const listRes = await fetch(
    `${AMADEUS_API_URL}/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=30&radiusUnit=KM&hotelSource=ALL`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Amadeus hotel list falhou: ${err}`);
  }

  const listData = await listRes.json();
  const hotelIds = (listData.data || []).slice(0, 12).map((h) => h.hotelId).filter(Boolean);
  if (!hotelIds.length) return [];

  const params = new URLSearchParams({
    adults: String(guests),
    checkInDate,
    checkOutDate,
    currencyCode: 'BRL',
    roomQuantity: '1',
  });
  hotelIds.forEach((id) => params.append('hotelIds', id));

  const offersRes = await fetch(`${AMADEUS_API_URL}/v3/shopping/hotel-offers?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!offersRes.ok) {
    const err = await offersRes.text();
    throw new Error(`Amadeus hotel offers falhou: ${err}`);
  }

  const offersData = await offersRes.json();
  return (offersData.data || [])
    .filter((entry) => entry.offers?.length)
    .map((entry) => mapHotelOffer(entry, { nights, guests, checkIn: checkInDate, checkOut: checkOutDate }));
}

module.exports = {
  isConfigured,
  searchFlightOffers,
  searchHotelOffers,
  defaultDepartureDate,
  addDays,
};
