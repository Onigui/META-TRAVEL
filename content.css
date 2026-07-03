# Enviar código para META-TRAVEL

Repositório destino: **https://github.com/Onigui/META-TRAVEL**

> Repositório vazio **não usa "Importar"**. Você só precisa dar `git push` uma vez.

---

## Método 1 — Codespace no META-SHOPPER-IA (recomendado)

**Use o Codespace do repositório de origem**, não o do META-TRAVEL.

O Codespace do META-TRAVEL **não consegue** fazer `fetch` do META-SHOPPER-IA (erro 403 / *Write access not granted*), porque cada Codespace só herda permissão do repo onde foi criado.

### Passo 1 — Abrir Codespace no META-SHOPPER-IA

1. Abra https://github.com/Onigui/META-SHOPPER-IA
2. **Code** → aba **Codespaces** → **Create codespace on main**

### Passo 2 — Colar no terminal

```bash
git fetch origin cursor/meta-travel-standalone-0336
git checkout cursor/meta-travel-standalone-0336
git remote add destino https://github.com/Onigui/META-TRAVEL.git
git push -u destino HEAD:main
```

Se `dest/x already exists`, remova antes:

```bash
git remote remove destino
```

### Passo 3 — Ativar o site

1. No repo META-TRAVEL: **Settings** → **Pages** → Source: **GitHub Actions**
2. **Actions** → **Deploy GitHub Pages** → **Run workflow**
3. Em ~2 min: https://onigui.github.io/META-TRAVEL/

---

## Método 2 — Git no PC (casa ou notebook)

Se tiver Git instalado e acesso aos dois repositórios:

```bash
git clone -b cursor/meta-travel-standalone-0336 https://github.com/Onigui/META-SHOPPER-IA.git meta-travel
cd meta-travel
git remote remove origin
git remote add origin https://github.com/Onigui/META-TRAVEL.git
git push -u origin HEAD:main
```

---

## Método 3 — ZIP no navegador (se o fetch continuar falhando)

1. Logado como **Onigui**, baixe:
   https://github.com/Onigui/META-SHOPPER-IA/archive/refs/heads/cursor/meta-travel-standalone-0336.zip
2. Extraia no Codespace ou PC
3. Dentro da pasta extraída:

```bash
git init
git add .
git commit -m "Meta Travel standalone"
git branch -M main
git remote add origin https://github.com/Onigui/META-TRAVEL.git
git push -u origin main
```

---

## Método 4 — Importar repositório (alternativa)

https://github.com/new/import

1. Apague o META-TRAVEL vazio **ou** use outro nome
2. URL antiga: `https://github.com/Onigui/META-SHOPPER-IA`
3. Branch: `cursor/meta-travel-standalone-0336`
4. Nome: `META-TRAVEL`

*(Import traz histórico do Shopper também — os métodos 1 e 2 são mais limpos.)*

---

## Conferir se deu certo

Após o push, em https://github.com/Onigui/META-TRAVEL você deve ver:

- Pastas `src/`, `web/`, `extension/`, `shared/`
- `README.md` começando com "# Meta Travel"
- **Não** deve ter pastas do Meta Shopper (dealData, cuponomia, etc.)

---

## Problemas comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `403` / `Write access not granted` ao fetch do SHOPPER | Codespace criado no META-TRAVEL | Use **Método 1** (Codespace no SHOPPER) |
| `'origem-shopper/...' is not a commit` | Fetch falhou antes do checkout | Corrija o fetch (Método 1 ou 3) |
| `remote origem-shopper already exists` | Comando repetido | `git remote remove origem-shopper` |
| `Everything up-to-date` no push | Branch local ainda vazia | Confirme que o checkout trouxe os arquivos (`ls src web`) |
| `Repository not found` | Repo privado ou login errado | Confirme que está logado como **Onigui** |
| `failed to push` | Repo destino não vazio | `git pull origin main --rebase` antes do push |

---

## O que **não** fazer

- **Não** faça merge de `cursor/meta-travel-standalone-0336` na `main` do META-SHOPPER-IA — isso apagaria o Meta Shopper.
- **Não** use o Codespace do META-TRAVEL para buscar código do SHOPPER (403 garantido em repos privados).
