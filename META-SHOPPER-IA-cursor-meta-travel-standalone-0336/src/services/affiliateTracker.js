const TRAVEL_AFFILIATE_ID = process.env.TRAVEL_AFFILIATE_ID || 'meta-travel';
const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || '';
const RENTALCARS_AFFILIATE_ID = process.env.RENTALCARS_AFFILIATE_ID || 'meta-travel';

const COMMISSION_RATES = {
  flight: Number(process.env.FLIGHT_COMMISSION_PERCENT || 2),
  hotel: Number(process.env.HOTEL_COMMISSION_PERCENT || 5),
  car: Number(process.env.CAR_COMMISSION_PERCENT || 8),
  allInclusive: Number(process.env.ALLINCLUSIVE_COMMISSION_PERCENT || 6),
};

const STEP_ORDER = ['flight', 'hotel', 'car', 'allInclusive'];

const STEP_LABELS = {
  flight: 'Reservar voo',
  hotel: 'Reservar hotel',
  car: 'Reservar carro',
  allInclusive: 'Reservar all inclusive',
};

function wrapUrl(originalUrl, { checkoutId, type, provider, stepIndex }) {
  if (!originalUrl) return originalUrl;

  let url;
  try {
    url = new URL(originalUrl);
  } catch {
    return originalUrl;
  }

  url.searchParams.set('utm_source', 'meta-travel');
  url.searchParams.set('utm_medium', 'checkout');
  url.searchParams.set('utm_campaign', `trip-${checkoutId}`);
  url.searchParams.set('ref', TRAVEL_AFFILIATE_ID);

  if (type === 'hotel' && BOOKING_AFFILIATE_ID && url.hostname.includes('booking.com')) {
    url.searchParams.set('aid', BOOKING_AFFILIATE_ID);
  }

  if (type === 'car' && RENTALCARS_AFFILIATE_ID && url.hostname.includes('rentalcars.com')) {
    url.searchParams.set('affiliateCode', RENTALCARS_AFFILIATE_ID);
  }

  url.searchParams.set('mt_checkout', checkoutId);
  url.searchParams.set('mt_step', String(stepIndex));
  url.searchParams.set('mt_type', type);
  if (provider) url.searchParams.set('mt_provider', provider);

  return url.toString();
}

function estimateCommission(finalPrice, type) {
  const rate = COMMISSION_RATES[type] || 0;
  return Math.round(finalPrice * (rate / 100));
}

function sortComponents(components) {
  return [...components].sort(
    (a, b) => STEP_ORDER.indexOf(a.type) - STEP_ORDER.indexOf(b.type)
  );
}

function buildCheckoutSteps(components, checkoutId) {
  const sorted = sortComponents(components);

  return sorted.map((component, stepIndex) => {
    const trackedUrl = wrapUrl(component.bookingUrl, {
      checkoutId,
      type: component.type,
      provider: component.provider,
      stepIndex,
    });

    return {
      stepIndex,
      type: component.type,
      label: STEP_LABELS[component.type] || component.type,
      name: component.name,
      provider: component.provider,
      finalPrice: component.finalPrice,
      partner: component.partner,
      originalUrl: component.bookingUrl,
      trackedUrl,
      commissionRate: COMMISSION_RATES[component.type] || 0,
      estimatedCommission: estimateCommission(component.finalPrice, component.type),
      status: 'pending',
      clickedAt: null,
      completedAt: null,
    };
  });
}

module.exports = {
  STEP_ORDER,
  STEP_LABELS,
  COMMISSION_RATES,
  wrapUrl,
  estimateCommission,
  buildCheckoutSteps,
  TRAVEL_AFFILIATE_ID,
};
