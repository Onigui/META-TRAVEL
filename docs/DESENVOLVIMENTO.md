# Desenvolvimento — Meta Travel

Guia para trabalhar no repositório **Onigui/META-TRAVEL**.

## Estrutura

```
src/              # API Express (index.js, routes.js, adapters/, services/)
web/              # PWA planejador (index.html, app.js, api.js, styles.css)
extension/        # Extensão Chrome MV3
shared/           # travelEngine.js (browser) + tripData.cjs (server)
scripts/          # build-pages.js, build-release.js, generate-icons.js, organize-root.js
docs/
.github/workflows/
```

Na raiz: apenas `package.json`, `README.md`, `LICENSE`, `.env.example`, `.gitignore`.

## Primeiro setup

```bash
git clone https://github.com/Onigui/META-TRAVEL.git
cd META-TRAVEL
npm install
cp .env.example .env   # opcional — APIs reais
npm start              # http://localhost:3000
```

Se a raiz estiver com arquivos soltos (upload manual):

```bash
npm run organize
npm install
npm run build
npm start
```

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm start` | API + web em `localhost:3000` |
| `npm run dev` | API com `--watch` |
| `npm run build:pages` | Site estático em `dist/pages` (GitHub Pages) |
| `npm run build:release` | ZIP da extensão em `dist/` |
| `npm run icons` | Sincroniza ícones PWA e extensão |
| `npm run organize` | Reorganiza raiz flat → pastas corretas |
| `npm run build` | `icons` + `build:pages` |

## Endpoints úteis

- `GET /health` — saúde da API
- `GET /api/status` — status dos adapters (Amadeus, Booking, Rentalcars)
- `GET /api/search?destination=cancun-mx` — busca modular
- `POST /api/checkout` — checkout unificado com tracking de afiliado

## GitHub Pages

**Ativação manual (obrigatória, uma vez):**

1. https://github.com/Onigui/META-TRAVEL/settings/pages
2. **Build and deployment** → **Source** → **GitHub Actions**
3. Push na `main` ou rode **Deploy GitHub Pages** manualmente

URL: https://onigui.github.io/META-TRAVEL/

> O `GITHUB_TOKEN` do workflow não pode ativar o Pages automaticamente. Sem esse passo, o deploy falha com `Get Pages site failed`.

## Variáveis de ambiente

Veja `.env.example`. Sem credenciais, os adapters usam **mock** (dados ilustrativos).

## Extensão Chrome

```bash
npm run build:release
# Carregue dist/meta-travel-extension-v*.zip em chrome://extensions (modo desenvolvedor)
```

Ou use a pasta `extension/` diretamente em "Carregar sem compactação".

## Próximos passos de produto

- APIs reais via `.env` (Amadeus, Booking, Rentalcars)
- Painel admin de parceiros (`web/partners.html`) com auth
- Melhorar UX do checkout unificado
- Testes do fluxo voo → hotel → carro → all inclusive

## Repositório

**Não** desenvolver no META-SHOPPER-IA. Todo o código Meta Travel fica aqui.
