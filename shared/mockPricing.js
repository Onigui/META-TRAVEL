import { haversineKm } from './places.js';

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

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function estimateFlightBase(origin, destination) {
  const km = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const distFactor = Math.max(800, km * 0.42);
  const intl = origin.country !== destination.country ? 1.15 : 1;
  const idx = (destination.priceIndex || 1) * intl;
  return distFactor * idx;
}

export function generateFlights({ origin, destination, passengers = 1, departureDate }) {
  const base = estimateFlightBase(origin, destination);
  const route = `${origin.airport} → ${destination.airport}`;
  const km = haversineKm(origin.lat, origin.lon, destination.lat, destination.lon);
  const longHaul = km > 6000;

  return AIRLINES.slice(0, longHaul ? 6 : 4).map((al, i) => {
    const stops = i === 0 && km > 3500 ? 0 : i < 2 ? 0 : i < 4 ? 1 : 2;
    const mult = 1 - i * 0.06 + stops * 0.12;
    const price = jitter(base * mult) * passengers;
    const mins = Math.round((km / 800) * 60 + stops * 120 + 90);

    return {
      id: `fl-${destination.id}-${al.id}-${i}`,
      type: 'flight',
      provider: al.id,
      name: `${al.name} · ${origin.city} → ${destination.city}`,
      basePrice: price,
      partnerId: al.partner,
      details: {
        airline: al.name,
        origin: origin.airport,
        destination: destination.airport,
        route,
        stops,
        duration: formatDuration(mins),
        departure: `${6 + i * 2}:${i % 2 ? '30' : '15'}`,
        departureDate,
        passengers,
      },
      bookingUrl: `https://www.google.com/travel/flights?q=Flights+from+${origin.airport}+to+${destination.airport}+on+${departureDate}`,
      source: 'estimate',
    };
  });
}

export function generateHotels({ destination, nights = 5, guests = 2, checkIn }) {
  const idx = destination.priceIndex || 1;
  const tiers = [
    { suffix: 'Centro Econômico', stars: 3, mult: 0.55, zone: 'Centro' },
    { suffix: 'Comfort', stars: 4, mult: 0.85, zone: 'Zona turística' },
    { suffix: 'Premium', stars: 4, mult: 1.1, zone: 'Região nobre' },
    { suffix: 'Luxury Collection', stars: 5, mult: 1.55, zone: 'Premium' },
  ];

  return tiers.map((t, i) => {
    const perNight = jitter(320 * idx * t.mult, 0.1);
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
      },
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${destination.city}, ${destination.country}`)}&checkin=${checkIn}`,
      source: 'estimate',
    };
  });
}

export function generateCars({ destination, days = 5, pickUpDate, dropOffDate }) {
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

export function generateAllInclusive({ destination, nights = 5, guests = 2 }) {
  if (!destination.resort && destination.priceIndex < 1.05) return [];

  const idx = destination.priceIndex || 1;
  const resorts = [
    { name: 'Resort All Inclusive', meals: 'Todas refeições + bebidas', mult: 1.0 },
    { name: 'Grand Resort Premium', meals: 'Gourmet all inclusive', mult: 1.35 },
  ];

  return resorts.map((r, i) => {
    const perNight = jitter(680 * idx * r.mult, 0.1);
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
      },
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`all inclusive ${destination.city}`)}`,
      source: 'estimate',
    };
  });
}
