const { listPlaces, resolvePlace } = require('./places.cjs');

const DESTINATIONS = listPlaces();

function getDestination(id) {
  return resolvePlace({ destinationId: id }) || resolvePlace({ query: id });
}

module.exports = { DESTINATIONS, getDestination, resolvePlace };
