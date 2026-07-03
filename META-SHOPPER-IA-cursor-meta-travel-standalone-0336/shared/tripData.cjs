const DESTINATIONS = [
  { id: 'cancun-mx', city: 'Cancún', country: 'México', airport: 'CUN', cityCode: 'CUN', bookingDestId: '-1653169' },
  { id: 'miami-us', city: 'Miami', country: 'EUA', airport: 'MIA', cityCode: 'MIA', bookingDestId: '-1456928' },
  { id: 'lisboa-pt', city: 'Lisboa', country: 'Portugal', airport: 'LIS', cityCode: 'LIS', bookingDestId: '-2167973' },
  { id: 'bali-id', city: 'Bali', country: 'Indonésia', airport: 'DPS', cityCode: 'DPS', bookingDestId: '-2672237' },
];

function getDestination(id) {
  const dest = DESTINATIONS.find((d) => d.id === id);
  if (!dest) throw new Error('Destino não encontrado.');
  return dest;
}

module.exports = { DESTINATIONS, getDestination };
