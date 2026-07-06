const { haversineKm } = require('./places.cjs');
const {
  pickLayoverAirports,
  buildRouteSegments,
  buildLayovers,
  getFareProfile,
  getBookingUrl,
  CARRIER_CODES,
} = require('./flightDetails.cjs');

const AIRLINES = [
  { id: 'latam', name: 'LATAM', partner: 'latam' },
  { id: 'gol', name: 'GOL', partner: 'gol' },
  { id: 'azul', name: 'Azul', partner: null },
  { id: 'tap', name: 'TAP Air Portugal', partner: null },
  { id: 'american', name: 'American Airlines', partner: null },
  { id: 'emirates', name: 'Emirates', partner: null },
  { id: 'qatar', name: 'Qatar Airways', partner: null },
  { id: 'avianca', name: 'Avianca', partner: null },
];

function jitter(base, pct = 0.08) {
  const v = base * (1 + (Math.random() - 0.5) * 2 * pct);
  return Math.round(v / 10) * 10;
}

function estimateFlightBase(origin, destination) {
  const km = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const distFactor = Math.max(800, km * 0.42);
  const intl = origin.country !== destination.country ? 1.15 : 1;
  const idx = (destination.priceIndex || 1) * intl;
  return distFactor * idx;
}

function formatDurationMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function generateFlights({ origin, destination, passengers = 1, departureDate }) {
  const base = estimateFlightBase(origin, destination);
  const route = `${origin.airport} → ${destination.airport}`;
  const km = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const longHaul = km > 6000;
  const intl = origin.country !== destination.country;

  return AIRLINES.slice(0, longHaul ? 6 : 4).map((al, i) => {
    const stops = i === 0 && km > 3500 ? 0 : i < 2 ? 0 : i < 4 ? 1 : 2;
    const fare = getFareProfile(al.id, i % 3);
    const mult = (1 - i * 0.06 + stops * 0.12) * fare.mult;
    const price = jitter(base * mult) * passengers;
    const mins = Math.round((km / 800) * 60 + stops * 120 + 90);
    const duration = formatDurationMinutes(mins);
    const layoverCodes = pickLayoverAirports(origin, destination, stops);
    const layovers = buildLayovers(layoverCodes);
    const carrierCode = CARRIER_CODES[al.id] || 'XX';
    const segments = buildRouteSegments(origin, destination, layoverCodes, mins, carrierCode);

    return {
      id: `fl-${destination.id}-${al.id}-${i}`,
      type: 'flight',
      provider: al.id,
      name: `${al.name} · ${fare.brand} · ${origin.city} → ${destination.city}`,
      basePrice: price,
      partnerId: al.partner,
      details: {
        airline: al.name,
        origin: origin.airport,
        destination: destination.airport,
        originCountry: origin.country,
        destinationCountry: destination.country,
        route,
        stops,
        duration,
        departure: `${6 + i * 2}:${i % 2 ? '30' : '15'}`,
        departureDate,
        passengers,
        fareBrand: fare.brand,
        cabin: fare.cabin,
        intl,
        layovers,
        layoverSummary:
          stops === 0
            ? 'Voo direto'
            : layovers.map((l) => `${l.airportName} (${l.duration})`).join(' · '),
        segments: segments.map((s, si) => ({
          ...s,
          flightNumber: `${carrierCode} ${1200 + i * 10 + si}`,
        })),
        baggage: fare.baggage,
        included: fare.included,
        notIncluded: fare.notIncluded,
        availability: 'estimate',
        availabilityNote:
          'Preço e disponibilidade estimados. Não há consulta em tempo real à companhia — confirme no site oficial antes de comprar.',
      },
      bookingUrl: getBookingUrl(al.id, origin.airport, destination.airport, departureDate),
      source: 'estimate',
      isEstimate: true,
    };
  });
}

const HOTEL_VISUALS = [
  {
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=640&h=400&fit=crop',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=320&h=200&fit=crop',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=320&h=200&fit=crop',
    ],
    amenities: ['Wi-Fi', 'Ar-condicionado', 'Café da manhã', 'Recepção 24h'],
  },
  {
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop',
      'https://images.unsplash.com/photo-1618773928121-c1edbc3b3fc3?w=320&h=200&fit=crop',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=320&h=200&fit=crop',
    ],
    amenities: ['Wi-Fi', 'Piscina', 'Academia', 'Café da manhã'],
  },
  {
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=640&h=400&fit=crop',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=320&h=200&fit=crop',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=320&h=200&fit=crop',
    ],
    amenities: ['Piscina', 'Spa', 'Restaurante', 'Estacionamento', 'Wi-Fi'],
  },
  {
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=640&h=400&fit=crop',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=320&h=200&fit=crop',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=320&h=200&fit=crop',
    ],
    amenities: ['Piscina infinity', 'Spa', 'Concierge', 'Restaurante gourmet', 'Vista panorâmica'],
  },
];

const RESORT_VISUALS = [
  {
    images: [
      'https://images.unsplash.com/photo-1571008887538-b36bb30f457d?w=640&h=400&fit=crop',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=320&h=200&fit=crop',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=320&h=200&fit=crop',
    ],
    amenities: ['All inclusive', 'Praia privativa', 'Piscinas', 'Esportes aquáticos'],
  },
  {
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=640&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=320&h=200&fit=crop',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=320&h=200&fit=crop',
    ],
    amenities: ['Gourmet all inclusive', 'Spa', 'Kids club', 'Shows noturnos', 'Piscina com bar'],
  },
];

function generateHotels({ destination, nights = 5, guests = 2, checkIn }) {
  const idx = destination.priceIndex || 1;
  const tiers = [
    { suffix: 'Centro Econômico', stars: 3, mult: 0.55, zone: 'Centro' },
    { suffix: 'Comfort', stars: 4, mult: 0.85, zone: 'Zona turística' },
    { suffix: 'Premium', stars: 4, mult: 1.1, zone: 'Região nobre' },
    { suffix: 'Luxury Collection', stars: 5, mult: 1.55, zone: 'Premium' },
  ];

  return tiers.map((t, i) => {
    const perNight = jitter(320 * idx * t.mult, 0.1);
    const visual = HOTEL_VISUALS[i] || HOTEL_VISUALS[0];
    return {
      id: `ht-${destination.id}-${i}`,
      type: 'hotel',
      provider: i === 0 ? 'booking' : ['accor', 'hilton', 'hyatt', 'marriott'][i % 4],
      name: `Hotel ${destination.city} ${t.suffix}`,
      basePrice: perNight * nights,
      partnerId: i === 0 ? 'booking' : null,
      details: {
        stars: t.stars,
        zone: t.zone,
        nights,
        guests,
        checkIn,
        pricePerNight: perNight,
        city: destination.city,
        country: destination.country,
        image: visual.images[0],
        images: visual.images,
        amenities: visual.amenities,
      },
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${destination.city}, ${destination.country}`)}&checkin=${checkIn}`,
      source: 'estimate',
    };
  });
}

function generateCars({ destination, days = 5, pickUpDate, dropOffDate }) {
  const idx = destination.priceIndex || 1;
  const types = [
    { name: 'Econômico', provider: 'localiza', cat: 'Econômico', mult: 0.7, partner: 'localiza' },
    { name: 'Intermediário', provider: 'enterprise', cat: 'Intermediário', mult: 1.0, partner: null },
    { name: 'SUV', provider: 'hertz', cat: 'SUV', mult: 1.35, partner: null },
  ];

  return types.map((t, i) => {
    const perDay = jitter(180 * idx * t.mult, 0.1);
    return {
      id: `car-${destination.id}-${i}`,
      type: 'car',
      provider: t.provider,
      name: `${t.provider.charAt(0).toUpperCase() + t.provider.slice(1)} · ${t.name}`,
      basePrice: perDay * days,
      partnerId: t.partner,
      details: {
        category: t.cat,
        days,
        pricePerDay: perDay,
        pickUpDate,
        dropOffDate,
        location: destination.airport !== 'XXX' ? destination.airport : destination.city,
      },
      bookingUrl: `https://www.rentalcars.com/SearchResults.do?affiliateCode=meta-travel&pickupLocation=${encodeURIComponent(destination.city)}`,
      source: 'estimate',
    };
  });
}

function generateAllInclusive({ destination, nights = 5, guests = 2 }) {
  if (!destination.resort && destination.priceIndex < 1.05) return [];

  const idx = destination.priceIndex || 1;
  const resorts = [
    { name: 'Resort All Inclusive', meals: 'Todas refeições + bebidas', mult: 1.0 },
    { name: 'Grand Resort Premium', meals: 'Gourmet all inclusive', mult: 1.35 },
  ];

  return resorts.map((r, i) => {
    const perNight = jitter(680 * idx * r.mult, 0.1);
    const visual = RESORT_VISUALS[i] || RESORT_VISUALS[0];
    return {
      id: `ai-${destination.id}-${i}`,
      type: 'allInclusive',
      provider: i === 0 ? 'decameron' : 'riu',
      name: `${r.name} · ${destination.city}`,
      basePrice: perNight * Math.ceil(guests / 2) * Math.max(3, Math.round(nights * 0.85)),
      partnerId: i === 0 ? 'decameron' : null,
      details: {
        nights,
        guests,
        meals: r.meals,
        activities: 'Atividades aquáticas incluídas',
        city: destination.city,
        image: visual.images[0],
        images: visual.images,
        amenities: visual.amenities,
      },
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`all inclusive ${destination.city}`)}`,
      source: 'estimate',
    };
  });
}

module.exports = {
  generateFlights,
  generateHotels,
  generateCars,
  generateAllInclusive,
};
