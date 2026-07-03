const express = require('express');
const {
  searchAllOptions,
  buildTrip,
  listPartners,
  listDestinations,
  adminListPartners,
  partnerStore,
} = require('./services/tripService');
const checkoutService = require('./services/checkoutService');

const router = express.Router();
const ADMIN_TOKEN = process.env.TRAVEL_ADMIN_TOKEN || 'meta-travel-dev';

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Token de administrador inválido.' });
  }
  next();
}

router.get('/destinations', (_req, res) => {
  res.json(listDestinations());
});

router.get('/partners', (_req, res) => {
  res.json(listPartners());
});

router.get('/status', (_req, res) => {
  const amadeus = require('../adapters/amadeusClient');
  const booking = require('../adapters/bookingClient');
  const rentalcars = require('../adapters/rentalcarsClient');
  res.json({
    amadeus: amadeus.isConfigured() ? 'configured' : 'mock-fallback',
    booking: booking.isConfigured() ? 'configured' : 'mock-fallback',
    rentalcars: rentalcars.isConfigured() ? 'configured' : 'mock-fallback',
    partners: partnerStore.listPartners().length,
    captures: partnerStore.listCaptures(5).length,
  });
});

router.get('/search', async (req, res) => {
  try {
    const { destination, origin, passengers, guests, nights, days, departureDate, checkIn } = req.query;
    if (!destination) {
      return res.status(400).json({ error: 'Informe destination (ex: cancun-mx).' });
    }

    const result = await searchAllOptions({
      destinationId: destination,
      origin: origin || 'GRU',
      passengers: Number(passengers) || 1,
      guests: Number(guests) || 2,
      nights: Number(nights) || 5,
      days: Number(days) || Number(nights) || 5,
      departureDate,
      checkIn,
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/build', (req, res) => {
  try {
    const { flight, hotel, car, allInclusive } = req.body || {};
    if (!flight && !hotel && !car && !allInclusive) {
      return res.status(400).json({ error: 'Selecione ao menos um componente da viagem.' });
    }

    const result = buildTrip({ flight, hotel, car, allInclusive });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/checkout', (req, res) => {
  try {
    const { flight, hotel, car, allInclusive, destinationId, origin } = req.body || {};
    if (!flight && !hotel && !car && !allInclusive) {
      return res.status(400).json({ error: 'Selecione ao menos um componente da viagem.' });
    }

    const result = checkoutService.createCheckoutFromSelection(
      { flight, hotel, car, allInclusive },
      {
        destinationId,
        origin,
        userAgent: req.headers['user-agent'],
      }
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/checkout/:id', (req, res) => {
  try {
    const result = checkoutService.getCheckoutSession(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get('/go/:checkoutId/:stepIndex', (req, res) => {
  try {
    const stepIndex = Number(req.params.stepIndex);
    const { redirectUrl } = checkoutService.resolveRedirect(req.params.checkoutId, stepIndex, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer || '',
    });
    res.redirect(302, redirectUrl);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post('/checkout/:id/step/:stepIndex/complete', (req, res) => {
  try {
    const result = checkoutService.markStepComplete(req.params.id, Number(req.params.stepIndex));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/admin/checkouts', requireAdmin, (req, res) => {
  res.json({ checkouts: checkoutService.listCheckoutSessions(Number(req.query.limit) || 50) });
});

router.post('/capture', (req, res) => {
  try {
    const { site, category, title, price, currency, url, metadata } = req.body || {};
    if (!site || !price) {
      return res.status(400).json({ error: 'Informe site e price.' });
    }

    const entry = partnerStore.addCapture({
      site,
      category: category || 'unknown',
      title: title || '',
      price: Number(price),
      currency: currency || 'BRL',
      url: url || '',
      metadata: metadata || {},
    });

    res.status(201).json({ ok: true, capture: entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/captures', requireAdmin, (req, res) => {
  res.json({ captures: partnerStore.listCaptures(Number(req.query.limit) || 50) });
});

router.get('/admin/partners', requireAdmin, (_req, res) => {
  res.json({ partners: adminListPartners() });
});

router.post('/admin/partners', requireAdmin, (req, res) => {
  try {
    const { id, name, category, discountPercent, badge, active } = req.body || {};
    if (!id || !name || !category || discountPercent == null) {
      return res.status(400).json({ error: 'Informe id, name, category e discountPercent.' });
    }
    const partner = partnerStore.savePartner({ id, name, category, discountPercent, badge, active });
    res.status(201).json({ partner });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/admin/partners/:id', requireAdmin, (req, res) => {
  res.json(partnerStore.deletePartner(req.params.id));
});

module.exports = router;
