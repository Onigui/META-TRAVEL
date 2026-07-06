/** Nomes amigáveis de aeroportos e regiões — o usuário busca pela cidade, não pelo código IATA */

const AIRPORT_NAMES = {
  GRU: 'Aeroporto Internacional de Guarulhos',
  CGH: 'Aeroporto de Congonhas',
  VCP: 'Aeroporto de Viracopos (Campinas)',
  GIG: 'Aeroporto Internacional do Galeão',
  SDU: 'Aeroporto Santos Dumont',
  BSB: 'Aeroporto Internacional de Brasília',
  CNF: 'Aeroporto Internacional de Confins (Belo Horizonte)',
  PLU: 'Aeroporto da Pampulha',
  POA: 'Aeroporto Salgado Filho (Porto Alegre)',
  CWB: 'Aeroporto Afonso Pena (Curitiba)',
  SSA: 'Aeroporto Deputado Luís Eduardo Magalhães (Salvador)',
  REC: 'Aeroporto Guararapes (Recife)',
  FOR: 'Aeroporto Pinto Martins (Fortaleza)',
  MAO: 'Aeroporto Eduardo Gomes (Manaus)',
  FLN: 'Aeroporto Hercílio Luz (Florianópolis)',
  NAT: 'Aeroporto São Gonçalo do Amarante (Natal)',
  BEL: 'Aeroporto Val-de-Cans (Belém)',
  CGB: 'Aeroporto Marechal Rondon (Cuiabá)',
  GYN: 'Aeroporto Santa Genoveva (Goiânia)',
  VIX: 'Aeroporto Eurico de Aguiar Salles (Vitória)',
  MCZ: 'Aeroporto Zumbi dos Palmares (Maceió)',
  AJU: 'Aeroporto Santa Maria (Aracaju)',
  THE: 'Aeroporto Senador Petrônio Portella (Teresina)',
  SLZ: 'Aeroporto Marechal Cunha Machado (São Luís)',
  JPA: 'Aeroporto Castro Pinto (João Pessoa)',
  CGR: 'Aeroporto Internacional de Campo Grande',
  PVH: 'Aeroporto Jorge Teixeira (Porto Velho)',
  RBR: 'Aeroporto Plácido de Castro (Rio Branco)',
  BVB: 'Aeroporto Atlas Brasil Cantanhede (Boa Vista)',
  MCP: 'Aeroporto Internacional de Macapá',
  IGU: 'Aeroporto Cataratas (Foz do Iguaçu)',
  LDB: 'Aeroporto José Américo de Almeida (Londrina)',
  MGF: 'Aeroporto Regional de Maringá',
  RAO: 'Aeroporto Leite Lopes (Ribeirão Preto)',
  SJP: 'Aeroporto Prof. Eribelto Manoel Reino (São José do Rio Preto)',
  UDI: 'Aeroporto Ten. Cel. Aviador César Bombonato (Uberlândia)',
  MIA: 'Aeroporto Internacional de Miami',
  JFK: 'Aeroporto Internacional JFK (Nova York)',
  EWR: 'Aeroporto Newark Liberty',
  LAX: 'Aeroporto Internacional de Los Angeles',
  MCO: 'Aeroporto Internacional de Orlando',
  LAS: 'Aeroporto Internacional Harry Reid (Las Vegas)',
  CDG: 'Aeroporto Charles de Gaulle (Paris)',
  ORY: 'Aeroporto de Orly (Paris)',
  LHR: 'Aeroporto Heathrow (Londres)',
  LIS: 'Aeroporto Humberto Delgado (Lisboa)',
  MAD: 'Aeroporto Adolfo Suárez Madrid-Barajas',
  FCO: 'Aeroporto Fiumicino (Roma)',
  DXB: 'Aeroporto Internacional de Dubai',
  NRT: 'Aeroporto Narita (Tóquio)',
  HND: 'Aeroporto Haneda (Tóquio)',
  DPS: 'Aeroporto Ngurah Rai (Bali)',
  CUN: 'Aeroporto Internacional de Cancún',
  EZE: 'Aeroporto Internacional Ezeiza (Buenos Aires)',
  SCL: 'Aeroporto Arturo Merino Benítez (Santiago)',
  BOG: 'Aeroporto El Dorado (Bogotá)',
  LIM: 'Aeroporto Jorge Chávez (Lima)',
};

const BR_STATE = {
  'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Brasília': 'DF', 'Belo Horizonte': 'MG',
  'Porto Alegre': 'RS', 'Curitiba': 'PR', 'Salvador': 'BA', 'Recife': 'PE',
  'Fortaleza': 'CE', 'Manaus': 'AM', 'Florianópolis': 'SC', 'Natal': 'RN',
  'Belém': 'PA', 'Cuiabá': 'MT', 'Goiânia': 'GO', 'Vitória': 'ES',
  'Campinas': 'SP', 'Ribeirão Preto': 'SP', 'Londrina': 'PR', 'Maringá': 'PR',
  'Foz do Iguaçu': 'PR', 'São José do Rio Preto': 'SP', 'Uberlândia': 'MG',
  'Maceió': 'AL', 'Aracaju': 'SE', 'Teresina': 'PI', 'São Luís': 'MA',
  'João Pessoa': 'PB', 'Campo Grande': 'MS', 'Porto Velho': 'RO', 'Rio Branco': 'AC',
  'Boa Vista': 'RR', 'Macapá': 'AP',
};

/** Termos que as pessoas digitam na internet (sem saber o código IATA) */
const PLACE_ALIASES = {
  GRU: ['guarulhos', 'aeroporto de guarulhos', 'sp guarulhos', 'sao paulo guarulhos'],
  CGH: ['congonhas', 'aeroporto de congonhas', 'sao paulo congonhas'],
  VCP: ['viracopos', 'campinas', 'aeroporto de campinas'],
  GIG: ['galeao', 'galeão', 'rio galeao', 'aeroporto do galeao'],
  SDU: ['santos dumont', 'rio santos dumont', 'aeroporto santos dumont'],
  CNF: ['confins', 'tancredo neves', 'belo horizonte confins', 'bh confins'],
  POA: ['salgado filho', 'porto alegre aeroporto'],
  CWB: ['afonso pena', 'curitiba aeroporto'],
  SSA: ['salvador aeroporto', 'aeroporto de salvador'],
  REC: ['guararapes', 'recife aeroporto'],
  FOR: ['pinto martins', 'fortaleza aeroporto'],
  BSB: ['brasilia aeroporto', 'aeroporto de brasilia'],
  FLN: ['herculio luz', 'florianopolis aeroporto', 'floripa aeroporto'],
  RAO: ['ribeirao preto', 'ribeirão preto', 'leite lopes'],
  CDG: ['charles de gaulle', 'paris charles de gaulle', 'aeroporto de paris'],
  MIA: ['miami aeroporto', 'aeroporto de miami'],
};

function getAirportName(airport, city) {
  return AIRPORT_NAMES[airport] || `Aeroporto ${city} (${airport})`;
}

function getRegion(city, country) {
  if (country !== 'Brasil') return null;
  return BR_STATE[city] || null;
}

function getAliases(airport) {
  return PLACE_ALIASES[airport] || [];
}

module.exports = { AIRPORT_NAMES, BR_STATE, PLACE_ALIASES, getAirportName, getRegion, getAliases };
