# Meta Travel

Planejador modular de viagens — escolha passagem, hotel, carro e all inclusive **separadamente**, de empresas diferentes, no mesmo lugar. Sem pacote fechado.

## Testar online (sem Node.js)

| Recurso | URL |
|---------|-----|
| **Planejador web** | https://onigui.github.io/META-TRAVEL/ |
| **Extensão Chrome** | [Releases](https://github.com/Onigui/META-TRAVEL/releases/latest) |
| **Guia sem instalação** | [docs/TESTAR_SEM_NODE.md](docs/TESTAR_SEM_NODE.md) |

## Desenvolvimento local (opcional)

```bash
git clone https://github.com/Onigui/META-TRAVEL.git
cd META-TRAVEL
npm install
npm start
# http://localhost:3000
```

## Funcionalidades

- Compara voos, hotéis, carros e all inclusive de **provedores diferentes**
- Descontos automáticos de **parceiros**
- **Checkout unificado** — reservar tudo na ordem certa com tracking de afiliado
- **Extensão Chrome** — captura preços em sites de viagem
- **PWA** — instalável no celular
- **GitHub Actions** — build e deploy sem Node.js no seu PC

## Estrutura

```
src/           # API e adapters (Amadeus, Booking, Rentalcars)
shared/        # Motor de viagem (browser + server)
web/           # Interface do planejador
extension/     # Extensão Chrome
scripts/       # Build GitHub Pages e extensão
docs/          # Documentação
```

## Configuração (.env)

```bash
cp .env.example .env
```

Veja `.env.example` para Amadeus, Booking, Rentalcars e token de admin.

## Licença

MIT
