function applyPartnerDiscount(price, partnerId, partners = []) {
  const partner = partners.find((p) => p.id === partnerId) || null;
  if (!partner || !price) return { price, discount: 0, partner: null };
  const discount = Math.round(price * (partner.discountPercent / 100));
  return { price: price - discount, discount, partner };
}

function buildTripSummary(selection, partners = []) {
  const { flight, hotel, car, allInclusive } = selection;
  const components = [];
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of [flight, hotel, car, allInclusive].filter(Boolean)) {
    const base = item.basePrice;
    const { price, discount, partner } = applyPartnerDiscount(base, item.partnerId, partners);
    subtotal += base;
    totalDiscount += discount;
    components.push({
      type: item.type,
      provider: item.provider,
      name: item.name,
      basePrice: base,
      finalPrice: price,
      discount,
      partner,
      details: item.details || {},
      bookingUrl: item.bookingUrl,
    });
  }

  return {
    components,
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount,
    currency: 'BRL',
    isModular: true,
    note: 'Cada item foi escolhido separadamente — sem pacote fechado.',
  };
}

function rankByPrice(items) {
  return [...items].sort((a, b) => a.basePrice - b.basePrice);
}

module.exports = { buildTripSummary, rankByPrice, applyPartnerDiscount };
