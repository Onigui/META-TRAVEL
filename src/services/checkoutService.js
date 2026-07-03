const { buildTripSummary } = require('../../shared/tripEngineBridge');
const partnerStore = require('./partnerStore');
const checkoutStore = require('./checkoutStore');
const { buildCheckoutSteps, estimateCommission } = require('./affiliateTracker');

function createCheckoutFromSelection(selection, meta = {}) {
  const summary = buildTripSummary(selection, partnerStore.listPartners());
  if (!summary.components.length) {
    throw new Error('Nenhum componente selecionado para checkout.');
  }

  const checkoutId = `ck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const steps = buildCheckoutSteps(summary.components, checkoutId);
  const estimatedCommission = steps.reduce((sum, s) => sum + s.estimatedCommission, 0);

  const session = {
    id: checkoutId,
    status: 'pending',
    total: summary.total,
    subtotal: summary.subtotal,
    totalDiscount: summary.totalDiscount,
    currency: summary.currency,
    estimatedCommission,
    steps,
    clicks: [],
    components: summary.components,
    meta: {
      destinationId: meta.destinationId || null,
      origin: meta.origin || null,
      userAgent: meta.userAgent || null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };

  checkoutStore.createCheckout(session);

  return {
    checkoutId,
    status: session.status,
    total: session.total,
    estimatedCommission,
    stepCount: steps.length,
    steps: steps.map((s) => ({
      stepIndex: s.stepIndex,
      type: s.type,
      label: s.label,
      name: s.name,
      finalPrice: s.finalPrice,
      commissionRate: s.commissionRate,
      estimatedCommission: s.estimatedCommission,
      status: s.status,
      goUrl: `/api/go/${checkoutId}/${s.stepIndex}`,
    })),
    note: 'Reservas em ordem: voo → hotel → carro → all inclusive. Cada item abre em site separado com tracking de afiliado.',
  };
}

function getCheckoutSession(checkoutId) {
  const session = checkoutStore.getCheckout(checkoutId);
  if (!session) throw new Error('Checkout não encontrado.');

  return {
    checkoutId: session.id,
    status: session.status,
    total: session.total,
    estimatedCommission: session.estimatedCommission,
    steps: session.steps.map((s) => ({
      ...s,
      goUrl: `/api/go/${session.id}/${s.stepIndex}`,
    })),
    clicks: session.clicks || [],
    createdAt: session.createdAt,
    completedAt: session.completedAt,
  };
}

function resolveRedirect(checkoutId, stepIndex, meta = {}) {
  const session = checkoutStore.getCheckout(checkoutId);
  if (!session) throw new Error('Checkout não encontrado.');

  const step = session.steps[stepIndex];
  if (!step) throw new Error('Etapa de checkout inválida.');

  checkoutStore.recordClick(checkoutId, stepIndex, meta);

  return {
    redirectUrl: step.trackedUrl || step.originalUrl,
    step: {
      stepIndex,
      type: step.type,
      name: step.name,
    },
  };
}

function markStepComplete(checkoutId, stepIndex) {
  const updated = checkoutStore.completeStep(checkoutId, stepIndex);
  if (!updated) throw new Error('Checkout não encontrado.');
  return getCheckoutSession(checkoutId);
}

function listCheckoutSessions(limit = 50) {
  return checkoutStore.listCheckouts(limit).map((s) => ({
    id: s.id,
    status: s.status,
    total: s.total,
    estimatedCommission: s.estimatedCommission,
    stepCount: s.steps.length,
    clicksCount: (s.clicks || []).length,
    completedSteps: s.steps.filter((st) => st.status === 'completed').length,
    destinationId: s.meta?.destinationId,
    createdAt: s.createdAt,
    completedAt: s.completedAt,
  }));
}

module.exports = {
  createCheckoutFromSelection,
  getCheckoutSession,
  resolveRedirect,
  markStepComplete,
  listCheckoutSessions,
};
