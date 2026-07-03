const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const CHECKOUTS_FILE = path.join(DATA_DIR, 'checkouts.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCheckouts() {
  ensureDataDir();
  if (!fs.existsSync(CHECKOUTS_FILE)) {
    fs.writeFileSync(CHECKOUTS_FILE, '[]');
    return [];
  }
  return JSON.parse(fs.readFileSync(CHECKOUTS_FILE, 'utf8'));
}

function writeCheckouts(data) {
  ensureDataDir();
  fs.writeFileSync(CHECKOUTS_FILE, JSON.stringify(data, null, 2));
}

function createCheckout(session) {
  const checkouts = readCheckouts();
  checkouts.unshift(session);
  writeCheckouts(checkouts.slice(0, 200));
  return session;
}

function getCheckout(id) {
  return readCheckouts().find((c) => c.id === id) || null;
}

function updateCheckout(id, updater) {
  const checkouts = readCheckouts();
  const idx = checkouts.findIndex((c) => c.id === id);
  if (idx < 0) return null;

  const updated = typeof updater === 'function' ? updater(checkouts[idx]) : { ...checkouts[idx], ...updater };
  updated.updatedAt = new Date().toISOString();
  checkouts[idx] = updated;
  writeCheckouts(checkouts);
  return updated;
}

function listCheckouts(limit = 50) {
  return readCheckouts().slice(0, limit);
}

function recordClick(checkoutId, stepIndex, meta = {}) {
  return updateCheckout(checkoutId, (checkout) => {
    const steps = [...checkout.steps];
    const step = steps[stepIndex];
    if (!step) return checkout;

    steps[stepIndex] = {
      ...step,
      status: step.status === 'completed' ? 'completed' : 'clicked',
      clickedAt: step.clickedAt || new Date().toISOString(),
    };

    const clicks = [...(checkout.clicks || []), { stepIndex, type: step.type, at: new Date().toISOString(), ...meta }];

    return {
      ...checkout,
      steps,
      clicks,
      status: checkout.status === 'completed' ? 'completed' : 'in_progress',
    };
  });
}

function completeStep(checkoutId, stepIndex) {
  return updateCheckout(checkoutId, (checkout) => {
    const steps = [...checkout.steps];
    const step = steps[stepIndex];
    if (!step) return checkout;

    steps[stepIndex] = {
      ...step,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    const allDone = steps.every((s) => s.status === 'completed');

    return {
      ...checkout,
      steps,
      status: allDone ? 'completed' : 'in_progress',
      completedAt: allDone ? new Date().toISOString() : checkout.completedAt,
    };
  });
}

module.exports = {
  createCheckout,
  getCheckout,
  updateCheckout,
  listCheckouts,
  recordClick,
  completeStep,
};
