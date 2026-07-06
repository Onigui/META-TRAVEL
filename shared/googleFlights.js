/** URLs de busca no Google Voos — mesma fonte que o usuário já usa para conferir */

export function buildGoogleFlightsUrl({
  originAirport,
  destinationAirport,
  departureDate,
  returnDate,
  passengers = 1,
}) {
  const o = String(originAirport || '').toUpperCase();
  const d = String(destinationAirport || '').toUpperCase();
  const date = departureDate || '';
  const ret = returnDate || '';
  const pax = Math.max(1, Number(passengers) || 1);

  const q = ret
    ? `Flights from ${o} to ${d} on ${date} through ${ret} for ${pax} adults`
    : `Flights from ${o} to ${d} on ${date} for ${pax} adults`;

  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

export function buildGoogleHotelsUrl({ city, country, checkIn, nights = 5, guests = 2 }) {
  const q = `hotels in ${city}, ${country}`;
  const params = new URLSearchParams({ q });
  if (checkIn) params.set('checkin', checkIn);
  if (checkIn && nights) {
    const out = new Date(`${checkIn}T12:00:00`);
    out.setDate(out.getDate() + nights);
    params.set('checkout', out.toISOString().slice(0, 10));
  }
  if (guests) params.set('guests', String(guests));
  return `https://www.google.com/travel/hotels?${params}`;
}

export function buildRentalcarsUrl({ city, airport, pickUpDate, dropOffDate }) {
  const loc = airport || city;
  const params = new URLSearchParams({
    affiliateCode: 'meta-travel',
    preflang: 'pt',
    doLanding: 'false',
    pickupLocation: loc,
    dropoffLocation: loc,
  });
  if (pickUpDate) params.set('pickupDate', pickUpDate);
  if (dropOffDate) params.set('dropoffDate', dropOffDate);
  return `https://www.rentalcars.com/SearchResults.do?${params}`;
}
