const { DESTINATIONS, getDestination } = require('./tripData.cjs');

function getPartner(id) {
  try {
    return require('../src/services/partnerStore').getPartner(id);
  } catch {
    return null;
  }
}

function listPartners() {
  try {
    return require('../src/services/partnerStore').listPartners();
  } catch {
    return [];
  }
}

module.exports = {
  DESTINATIONS,
  getDestination,
  getPartner,
  listPartners,
  get PARTNERS() {
    return listPartners();
  },
};
