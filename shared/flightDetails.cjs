/** Detalhes de voo: escalas, tarifas, bagagem — usado em estimativas e enriquecimento Amadeus */

const { getAirportName } = require('./placeMeta.cjs');

const AIRLINE_FARES = {
  gol: [
    {
      brand: 'Light',
      mult: 0.88,
      cabin: 'Econômica',
      baggage: { carryOnKg: 10, checkedBags: 0, checkedWeightKg: 0, extraCheckedBagPrice: 320 },
      included: ['Item pessoal', 'Bagagem de mão até 10 kg'],
      notIncluded: ['Bagagem despachada', 'Marcação antecipada de assento', 'Alteração gratuita'],
    },
    {
      brand: 'Plus',
      mult: 1.0,
      cabin: 'Econômica',
      baggage: { carryOnKg: 12, checkedBags: 1, checkedWeightKg: 23, extraCheckedBagPrice: 280 },
      included: ['Item pessoal', 'Bagagem de mão 12 kg', '1 bagagem despachada 23 kg', 'Marcação de assento padrão'],
      notIncluded: ['Alteração gratuita', '2ª bagagem despachada'],
    },
    {
      brand: 'Max',
      mult: 1.18,
      cabin: 'Econômica',
      baggage: { carryOnKg: 12, checkedBags: 2, checkedWeightKg: 23, extraCheckedBagPrice: 250 },
      included: ['Item pessoal', 'Bagagem de mão 12 kg', '2 bagagens despachadas 23 kg cada', 'Marcação de assento', 'Alteração de data (taxas podem aplicar)'],
      notIncluded: [],
    },
  ],
  latam: [
    {
      brand: 'Light',
      mult: 0.9,
      cabin: 'Econômica',
      baggage: { carryOnKg: 10, checkedBags: 0, checkedWeightKg: 0, extraCheckedBagPrice: 350 },
      included: ['Item pessoal', 'Bagagem de mão até 10 kg'],
      notIncluded: ['Bagagem despachada', 'Seleção de assento'],
    },
    {
      brand: 'Plus',
      mult: 1.0,
      cabin: 'Econômica',
      baggage: { carryOnKg: 12, checkedBags: 1, checkedWeightKg: 23, extraCheckedBagPrice: 300 },
      included: ['Item pessoal', 'Bagagem de mão 12 kg', '1 bagagem despachada 23 kg'],
      notIncluded: ['2ª bagagem despachada'],
    },
    {
      brand: 'Top',
      mult: 1.22,
      cabin: 'Econômica Premium',
      baggage: { carryOnKg: 16, checkedBags: 2, checkedWeightKg: 23, extraCheckedBagPrice: 280 },
      included: ['Item pessoal', 'Bagagem de mão 16 kg', '2 bagagens 23 kg', 'Assento preferencial', 'Prioridade de embarque'],
      notIncluded: [],
    },
  ],
  azul: [
    {
      brand: 'Azul',
      mult: 0.95,
      cabin: 'Econômica',
      baggage: { carryOnKg: 10, checkedBags: 0, checkedWeightKg: 0, extraCheckedBagPrice: 300 },
      included: ['Item pessoal', 'Bagagem de mão 10 kg'],
      notIncluded: ['Bagagem despachada'],
    },
    {
      brand: 'Mais Azul',
      mult: 1.08,
      cabin: 'Econômica',
      baggage: { carryOnKg: 10, checkedBags: 1, checkedWeightKg: 23, extraCheckedBagPrice: 270 },
      included: ['Item pessoal', 'Bagagem de mão 10 kg', '1 bagagem despachada 23 kg'],
      notIncluded: [],
    },
  ],
  default: [
    {
      brand: 'Basic',
      mult: 0.92,
      cabin: 'Econômica',
      baggage: { carryOnKg: 8, checkedBags: 0, checkedWeightKg: 0, extraCheckedBagPrice: 450 },
      included: ['Item pessoal'],
      notIncluded: ['Bagagem de mão grande', 'Bagagem despachada'],
    },
    {
      brand: 'Standard',
      mult: 1.0,
      cabin: 'Econômica',
      baggage: { carryOnKg: 10, checkedBags: 1, checkedWeightKg: 23, extraCheckedBagPrice: 400 },
      included: ['Item pessoal', 'Bagagem de mão 10 kg', '1 bagagem despachada 23 kg'],
      notIncluded: ['2ª bagagem'],
    },
    {
      brand: 'Flex',
      mult: 1.15,
      cabin: 'Econômica',
      baggage: { carryOnKg: 12, checkedBags: 2, checkedWeightKg: 23, extraCheckedBagPrice: 380 },
      included: ['Item pessoal', 'Bagagem de mão 12 kg', '2 bagagens 23 kg', 'Alteração flexível'],
      notIncluded: [],
    },
  ],
};

const DOMESTIC_HUBS = ['BSB', 'GRU', 'GIG', 'CNF', 'SSA', 'REC', 'FOR', 'POA', 'CWB', 'CGH'];
const INTL_HUBS = ['GRU', 'GIG', 'LIS', 'MIA', 'PTY', 'BOG', 'MAD', 'CDG', 'DXB', 'DOH', 'FRA', 'JFK', 'EWR'];

const AIRLINE_BOOKING = {
  gol: (o, d, date) =>
    `https://www.voegol.com.br/pt/voos?origin=${o}&destination=${d}&departureDate=${date}`,
  latam: (o, d, date) =>
    `https://www.latamairlines.com/br/pt/oferta-voos?origin=${o}&destination=${d}&outbound=${date}`,
  azul: (o, d, date) =>
    `https://www.voeazul.com.br/br/pt/home#/selecao-voo?origem=${o}&destino=${d}&data=${date}`,
};

const CARRIER_CODES = { gol: 'G3', latam: 'LA', azul: 'AD', tap: 'TP', american: 'AA', emirates: 'EK', qatar: 'QR', avianca: 'AV' };

function airportLabel(code, city) {
  const name = getAirportName(code, city || code);
  return { code, city: city || code, name };
}

function pickLayoverAirports(origin, destination, stops) {
  if (!stops) return [];
  const exclude = new Set([origin.airport, destination.airport]);
  const intl = origin.country !== destination.country;
  const pool = (intl ? INTL_HUBS : DOMESTIC_HUBS).filter((h) => !exclude.has(h));
  return pool.slice(0, stops);
}

function buildRouteSegments(origin, destination, layoverCodes, durationMins) {
  const points = [origin.airport, ...layoverCodes, destination.airport];
  const legCount = points.length - 1;
  const legMins = Math.floor(durationMins / legCount);

  const segments = [];
  for (let i = 0; i < legCount; i++) {
    const from = points[i];
    const to = points[i + 1];
    segments.push({
      from,
      to,
      fromName: getAirportName(from, from),
      toName: getAirportName(to, to),
      duration: formatDuration(legMins),
      flightNumber: `${CARRIER_CODES.gol || 'XX'} ${1000 + i * 111}`,
    });
  }
  return segments;
}

function buildLayovers(layoverCodes) {
  return layoverCodes.map((code, i) => ({
    airport: code,
    airportName: getAirportName(code, code),
    city: code,
    duration: `${1 + (i % 2)}h${i % 2 ? '15' : '30'}`,
    note: 'Conexão — confirme terminal e tempo mínimo no site da companhia',
  }));
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function getFareProfile(airlineId, tierIndex) {
  const fares = AIRLINE_FARES[airlineId] || AIRLINE_FARES.default;
  return fares[Math.min(tierIndex, fares.length - 1)];
}

function buildBaggageBlock(baggage) {
  const lines = [];
  lines.push(`Item pessoal incluído`);
  lines.push(`Bagagem de mão: até ${baggage.carryOnKg} kg`);
  if (baggage.checkedBags > 0) {
    lines.push(`${baggage.checkedBags} bagagem(ns) despachada(s) de até ${baggage.checkedWeightKg} kg`);
  } else {
    lines.push(`Bagagem despachada não incluída — a partir de R$ ${baggage.extraCheckedBagPrice} (até ${baggage.extraBagWeightKg || 23} kg)`);
  }
  return lines;
}

function getBookingUrl(airlineId, origin, destination, date) {
  const fn = AIRLINE_BOOKING[airlineId];
  if (fn) return fn(origin, destination, date);
  return `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${destination}+on+${date}`;
}

function enrichFlightDetails(flight) {
  const d = flight.details || {};
  if (d.segments?.length) return flight;

  const stops = d.stops || 0;
  const layoverCodes = pickLayoverAirports(
    { airport: d.origin, country: '' },
    { airport: d.destination, country: '' },
    stops
  );
  const layovers = buildLayovers(layoverCodes);

  return {
    ...flight,
    details: {
      ...d,
      layovers,
      layoverSummary:
        stops === 0
          ? 'Voo direto'
          : layovers.map((l) => `${l.airportName} (${l.duration})`).join(' · '),
      segments: d.segments || buildRouteSegments(
        { airport: d.origin },
        { airport: d.destination },
        layoverCodes,
        parseDurationMins(d.duration)
      ),
    },
  };
}

function parseDurationMins(duration) {
  const m = String(duration || '').match(/(\d+)h(\d+)?/);
  if (!m) return 180;
  return Number(m[1]) * 60 + Number(m[2] || 0);
}

module.exports = {
  AIRLINE_FARES,
  pickLayoverAirports,
  buildRouteSegments,
  buildLayovers,
  getFareProfile,
  buildBaggageBlock,
  getBookingUrl,
  enrichFlightDetails,
  formatDuration,
  CARRIER_CODES,
};
