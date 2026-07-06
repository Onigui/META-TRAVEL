import { getAirportName, getRegion, getAliases } from './placeMeta.js';

const PLACES = await fetch(new URL('./places.json', import.meta.url)).then((r) => r.json());

const COUNTRY_ALIASES = {
  brasil: 'Brasil', brazil: 'Brasil', usa: 'EUA', eua: 'EUA', us: 'EUA',
  uk: 'Reino Unido', england: 'Reino Unido', france: 'França', spain: 'Espanha',
  portugal: 'Portugal', italy: 'Itália', italia: 'Itália', germany: 'Alemanha',
  mexico: 'México', méxico: 'México', japan: 'Japão', japão: 'Japão',
  argentina: 'Argentina', chile: 'Chile', colombia: 'Colômbia', peru: 'Peru',
};

function slugify(city, country) {
  const norm = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `${norm(city)}-${norm(country)}`.slice(0, 48);
}

function normalizeText(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function enrichPlace(p) {
  const airportName = p.airportName || getAirportName(p.airport, p.city);
  const region = p.region ?? getRegion(p.city, p.country);
  const aliases = p.aliases || getAliases(p.airport);
  return {
    ...p,
    id: p.id || slugify(p.city, p.country),
    cityCode: p.cityCode || p.airport,
    airportName,
    region,
    aliases,
  };
}

export function findByIata(code) {
  const iata = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(iata)) return null;
  const p = PLACES.find((x) => x.airport === iata);
  return p ? enrichPlace({ ...p }) : null;
}

function scorePlace(place, tokens) {
  const city = normalizeText(place.city);
  const country = normalizeText(place.country);
  const airport = place.airport.toLowerCase();
  const airportName = normalizeText(place.airportName || '');
  const region = normalizeText(place.region || '');
  const aliasText = (place.aliases || []).map(normalizeText).join(' ');
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (city === t) score += 10;
    else if (city.startsWith(t)) score += 7;
    else if (city.includes(t)) score += 4;
    if (country === t) score += 8;
    else if (country.startsWith(t)) score += 5;
    else if (country.includes(t)) score += 3;
    if (airport === t) score += 6;
    if (airportName.includes(t)) score += 9;
    if (region === t) score += 5;
    if (aliasText.includes(t)) score += 11;
  }
  return score;
}

function parseQuery(query) {
  const raw = String(query || '').trim();
  if (!raw) return { tokens: [], city: '', country: '' };
  const parts = raw.split(/[,;|/]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      tokens: parts.flatMap((p) => normalizeText(p).split(/\s+/)),
      city: parts[0],
      country: COUNTRY_ALIASES[normalizeText(parts[parts.length - 1])] || parts[parts.length - 1],
    };
  }
  const tokens = normalizeText(raw).split(/\s+/).filter(Boolean);
  const last = tokens[tokens.length - 1];
  const country = COUNTRY_ALIASES[last];
  if (country && tokens.length > 1) {
    return { tokens, city: tokens.slice(0, -1).join(' '), country };
  }
  return { tokens, city: raw, country: '' };
}

export function resolvePlace(input = {}) {
  if (!input || typeof input === 'string') input = { query: input };
  const { query, city, country, airport, destinationId } = input;

  if (destinationId) {
    const byId = PLACES.find((p) => slugify(p.city, p.country) === destinationId);
    if (byId) return enrichPlace({ ...byId, id: destinationId });
  }

  const iata = airport || (query && /^[A-Za-z]{3}$/.test(query.trim()) ? query : null);
  if (iata) {
    const found = findByIata(iata);
    if (found) return found;
  }

  const parsed = parseQuery(query || (city && country ? `${city}, ${country}` : city || ''));
  const searchCity = city || parsed.city;
  const searchCountry = country || parsed.country;
  const tokens = [
    ...parsed.tokens,
    ...normalizeText(searchCity).split(/\s+/),
    ...normalizeText(searchCountry).split(/\s+/),
  ].filter(Boolean);

  let best = null;
  let bestScore = 0;
  for (const p of PLACES) {
    const s = scorePlace(p, tokens);
    if (searchCountry && normalizeText(p.country) !== normalizeText(searchCountry)) continue;
    if (s > bestScore) { bestScore = s; best = p; }
  }
  if (!best && searchCity) {
    for (const p of PLACES) {
      const s = scorePlace(p, tokens);
      if (s > bestScore) { bestScore = s; best = p; }
    }
  }
  if (best && bestScore >= 4) return enrichPlace({ ...best });

  if (searchCity) {
    const c = searchCity.trim();
    const co = (searchCountry || 'Internacional').trim();
    const code = iata && /^[A-Z]{3}$/.test(String(iata).toUpperCase()) ? String(iata).toUpperCase() : 'XXX';
    return enrichPlace({
      id: slugify(c, co), airport: code, city: c, country: co,
      lat: 0, lon: 0, priceIndex: 1.0, custom: true,
    });
  }
  return null;
}

export function resolveTripPlaces(params = {}) {
  const origin = resolvePlace({
    airport: params.originAirport || params.origin,
    city: params.originCity,
    country: params.originCountry,
    query: params.originQuery,
  }) || findByIata('GRU');

  const destination = resolvePlace({
    destinationId: params.destinationId,
    airport: params.destinationAirport,
    city: params.destinationCity,
    country: params.destinationCountry,
    query: params.destinationQuery || params.destination,
  });

  if (!destination) {
    throw new Error('Informe o destino: cidade ou nome do aeroporto (ex: Paris, Guarulhos).');
  }
  return { origin, destination };
}

export function searchPlaces(query, limit = 10) {
  const q = String(query || '').trim();
  if (!q) return PLACES.slice(0, limit).map(enrichPlace);
  const iata = findByIata(q);
  if (iata) return [iata];
  const { tokens } = parseQuery(q);
  return PLACES.map((p) => ({ place: enrichPlace({ ...p }), score: scorePlace(p, tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.place);
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 && !lon1) return 5000;
  if (!lat2 && !lon2) return 5000;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function listPlaces() {
  return PLACES.map(enrichPlace);
}

export { PLACES, enrichPlace };
