const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const PARTNERS_FILE = path.join(DATA_DIR, 'partners.json');
const CAPTURES_FILE = path.join(DATA_DIR, 'captures.json');

const DEFAULT_PARTNERS = [
  { id: 'latam', name: 'LATAM', category: 'airline', discountPercent: 5, badge: 'Parceiro oficial', active: true },
  { id: 'gol', name: 'GOL', category: 'airline', discountPercent: 4, badge: 'Parceiro oficial', active: true },
  { id: 'booking', name: 'Booking.com', category: 'hotel', discountPercent: 8, badge: 'Desconto exclusivo', active: true },
  { id: 'localiza', name: 'Localiza', category: 'car', discountPercent: 10, badge: 'Parceiro oficial', active: true },
  { id: 'decameron', name: 'Decameron', category: 'allInclusive', discountPercent: 12, badge: 'Resort parceiro', active: true },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson(file, fallback) {
  ensureDataDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function listPartners() {
  return readJson(PARTNERS_FILE, DEFAULT_PARTNERS).filter((p) => p.active !== false);
}

function getPartner(id) {
  return listPartners().find((p) => p.id === id) || null;
}

function savePartner(partner) {
  const all = readJson(PARTNERS_FILE, DEFAULT_PARTNERS);
  const idx = all.findIndex((p) => p.id === partner.id);
  const entry = {
    ...partner,
    active: partner.active !== false,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) all[idx] = { ...all[idx], ...entry };
  else all.push({ ...entry, createdAt: new Date().toISOString() });
  writeJson(PARTNERS_FILE, all);
  return entry;
}

function deletePartner(id) {
  const all = readJson(PARTNERS_FILE, DEFAULT_PARTNERS);
  const filtered = all.filter((p) => p.id !== id);
  writeJson(PARTNERS_FILE, filtered);
  return { deleted: id };
}

function addCapture(capture) {
  const captures = readJson(CAPTURES_FILE, []);
  const entry = {
    id: `cap-${Date.now()}`,
    ...capture,
    capturedAt: new Date().toISOString(),
  };
  captures.unshift(entry);
  writeJson(CAPTURES_FILE, captures.slice(0, 500));
  return entry;
}

function listCaptures(limit = 50) {
  return readJson(CAPTURES_FILE, []).slice(0, limit);
}

module.exports = {
  listPartners,
  getPartner,
  savePartner,
  deletePartner,
  addCapture,
  listCaptures,
};
