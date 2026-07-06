/** Requisitos de viagem com fontes oficiais — cidadão brasileiro */

const REQUIREMENTS = await fetch(new URL('./travelRequirements.json', import.meta.url)).then((r) => r.json());

const ALIASES = {
  usa: 'EUA', eua: 'EUA', 'estados unidos': 'EUA', us: 'EUA',
  uk: 'Reino Unido', england: 'Reino Unido', inglaterra: 'Reino Unido',
  mexico: 'México', méxico: 'México',
  japan: 'Japão', japão: 'Japão',
  uae: 'Emirados Árabes Unidos', dubai: 'Emirados Árabes Unidos',
  france: 'França', spain: 'Espanha', italy: 'Itália', italia: 'Itália',
  portugal: 'Portugal', colombia: 'Colômbia', brazil: 'Brasil', brasil: 'Brasil',
};

function normalizeCountry(name) {
  const key = String(name || '').trim();
  if (!key) return '';
  const lower = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return ALIASES[lower] || key;
}

export function getTravelRequirements(country) {
  const normalized = normalizeCountry(country);
  const entry = REQUIREMENTS[normalized];
  if (entry) return { ...entry, matched: true };
  return {
    country: normalized || country,
    citizenship: 'Brasil',
    documents: ['Consulte o Ministério das Relações Exteriores para este destino'],
    passportRequired: true,
    visa: 'check_official',
    summary: `Não temos ficha cadastrada para "${country}". Consulte sempre as fontes oficiais antes de viajar.`,
    steps: [
      'Verifique alertas e orientações no site do MRE (embaixadas e consulados).',
      'Confirme necessidade de passaporte e visto na representação diplomática do país de destino.',
    ],
    sources: [
      { title: 'Passaporte — Polícia Federal', url: 'https://www.gov.br/pf/pt-br/assuntos/passaporte' },
      { title: 'Embaixadas e consulados — MRE', url: 'https://www.gov.br/mre/pt-br/embaixada-consulado' },
      { title: 'Alertas de viagem — MRE', url: 'https://www.gov.br/mre/pt-br/consulado/alertas' },
    ],
    matched: false,
  };
}

export { REQUIREMENTS };
