# Ativar site (GitHub Pages)

URL esperada: **https://onigui.github.io/META-TRAVEL/**

## Passo obrigatório (uma vez)

O workflow **não consegue** ativar o Pages sozinho — o token do GitHub Actions não tem permissão de administração.

1. Abra: https://github.com/Onigui/META-TRAVEL/settings/pages
2. Em **Build and deployment** → **Source**, escolha **GitHub Actions**
3. Salve (não é necessário escolher branch nem pasta)

## Deploy

Após ativar o Pages:

- **Automático:** push na branch `main`
- **Manual:** Actions → **Deploy GitHub Pages** → **Run workflow**

## Se o workflow falhar

| Erro | Solução |
|------|---------|
| `Get Pages site failed` / `Not Found` | Ative o Pages no passo acima |
| Build OK, deploy falha | Confirme que Source = **GitHub Actions** (não "Deploy from branch") |

Guia completo: [TESTAR_SEM_NODE.md](TESTAR_SEM_NODE.md)
