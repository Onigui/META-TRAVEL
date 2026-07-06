/** Converte capturas da extensão (Google Voos, GOL, Booking…) em itens de busca */

function slugId(prefix, str) {
  return `${prefix}-${String(str || '').replace(/\W+/g, '-').slice(0, 40)}-${Date.now()}`;
}

function mapCaptureToFlight(cap, index) {
  const meta = cap.metadata || {};
  const offers = meta.offers || [cap];
  const offer = offers[index] || cap;

  return {
    id: slugId('cap-fl', offer.title || cap.title),
    type: 'flight',
    provider: cap.site || 'capture',
    name: offer.title || cap.title || `${cap.siteName} — voo capturado`,
    basePrice: Number(offer.price || cap.price) || 0,
    partnerId: ['latam', 'gol'].includes(cap.site) ? cap.site : null,
    details: {
      airline: offer.airline || cap.siteName || cap.site,
      origin: offer.origin || meta.origin || '',
      destination: offer.destination || meta.destination || '',
      stops: offer.stops ?? meta.stops ?? 0,
      duration: offer.duration || meta.duration || '',
      departure: offer.departure || '',
      departureDate: offer.date || meta.date || '',
      layoverSummary: offer.layoverSummary || meta.layoverSummary || '',
      segments: offer.segments || meta.segments || [],
      baggage: offer.baggage || meta.baggage || null,
      included: offer.included || [],
      notIncluded: offer.notIncluded || [],
      fareBrand: offer.fareBrand || '',
      availability: 'verified',
      availabilityNote: `Preço capturado em ${cap.siteName || cap.site} em ${new Date(cap.savedAt || Date.now()).toLocaleString('pt-BR')}.`,
    },
    bookingUrl: offer.url || cap.url,
    source: 'capture',
    isEstimate: false,
    capturedAt: cap.savedAt,
  };
}

function mapCaptureToHotel(cap) {
  return {
    id: slugId('cap-ht', cap.title),
    type: 'hotel',
    provider: cap.site || 'booking',
    name: cap.title || 'Hotel capturado',
    basePrice: Number(cap.price) || 0,
    partnerId: cap.site === 'booking' ? 'booking' : null,
    details: {
      zone: cap.metadata?.zone || '',
      nights: cap.metadata?.nights || 1,
      guests: cap.metadata?.guests || 2,
      image: cap.metadata?.image || null,
      images: cap.metadata?.images || [],
      amenities: cap.metadata?.amenities || [],
      availability: 'verified',
      availabilityNote: `Capturado em ${cap.siteName} em ${new Date(cap.savedAt || Date.now()).toLocaleString('pt-BR')}.`,
    },
    bookingUrl: cap.url,
    source: 'capture',
    isEstimate: false,
    capturedAt: cap.savedAt,
  };
}

function mapCaptureToCar(cap) {
  const meta = cap.metadata || {};
  return {
    id: slugId('cap-car', cap.title),
    type: 'car',
    provider: meta.provider || cap.site || 'rental',
    name: cap.title || 'Carro capturado',
    basePrice: Number(cap.price) || 0,
    partnerId: meta.provider === 'localiza' ? 'localiza' : null,
    details: {
      category: meta.category || 'Veículo',
      days: meta.days || 1,
      image: meta.image || null,
      images: meta.images || [],
      amenities: meta.amenities || ['Ar-condicionado', 'Quilometragem conforme locadora'],
      transmission: meta.transmission || null,
      availability: 'verified',
      availabilityNote: `Capturado em ${cap.siteName} em ${new Date(cap.savedAt || Date.now()).toLocaleString('pt-BR')}.`,
    },
    bookingUrl: cap.url,
    source: 'capture',
    isEstimate: false,
    capturedAt: cap.savedAt,
  };
}

function matchesRoute(text, origin, destination) {
  const t = String(text || '').toLowerCase();
  const o = String(origin || '').toLowerCase();
  const d = String(destination || '').toLowerCase();
  if (!o && !d) return true;
  return (!o || t.includes(o)) && (!d || t.includes(d));
}

export function capturesToSearchResults(captures = [], { origin, destination, originAirport, destinationAirport } = {}) {
  const flights = [];
  const hotels = [];
  const cars = [];

  for (const cap of captures) {
    const text = `${cap.title} ${cap.url} ${JSON.stringify(cap.metadata || {})}`;
    const routeMatch =
      matchesRoute(text, originAirport, destinationAirport) ||
      matchesRoute(text, origin?.city, destination?.city);

    if (cap.category === 'flight' && routeMatch) {
      const meta = cap.metadata || {};
      if (meta.offers?.length) {
        meta.offers.forEach((_, i) => flights.push(mapCaptureToFlight(cap, i)));
      } else {
        flights.push(mapCaptureToFlight(cap, 0));
      }
    } else if (cap.category === 'hotel') {
      hotels.push(mapCaptureToHotel(cap));
    } else if (cap.category === 'car') {
      cars.push(mapCaptureToCar(cap));
    }
  }

  return { flights, hotels, cars };
}

export function mergeSearchResults(primary, secondary) {
  const dedupe = (items) => {
    const seen = new Set();
    return items.filter((i) => {
      const key = `${i.type}-${i.name}-${i.basePrice}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    flights: dedupe([...(primary.flights || []), ...(secondary.flights || [])]),
    hotels: dedupe([...(primary.hotels || []), ...(secondary.hotels || [])]),
    cars: dedupe([...(primary.cars || []), ...(secondary.cars || [])]),
    allInclusive: dedupe([...(primary.allInclusive || []), ...(secondary.allInclusive || [])]),
  };
}
