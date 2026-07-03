#!/usr/bin/env node
/**
 * Reorganiza arquivos soltos na raiz para a estrutura correta do Meta Travel.
 * Útil após upload manual ou ZIP com nomes trocados.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

/** Arquivos que devem permanecer na raiz */
const ROOT_ALLOW = new Set([
  'package.json',
  'package-lock.json',
  'README.md',
  'LICENSE',
  '.env.example',
  '.gitignore',
]);

/** Mapeamento: nome na raiz → caminho destino (conteúdo conhecido de uploads bagunçados) */
const CONTENT_MAP = {
  'partners.html': 'src/index.js',
  'partners.js': 'src/routes.js',
  'manifest (1).json': 'src/config.js',
  'tripService.js': 'src/adapters/amadeusClient.js',
  'api.js': 'src/adapters/bookingClient.js',
  'index.html': 'src/adapters/rentalcarsClient.js',
  'app.js': 'src/adapters/carAdapter.js',
  'partnerStore.js': 'src/adapters/allInclusiveAdapter.js',
  'icon192.png': 'src/adapters/flightAdapter.js',
  'icon512.png': 'src/adapters/hotelAdapter.js',
  'sw.js': 'src/services/affiliateTracker.js',
  'config.js': 'shared/tripData.cjs',
  'index.js': 'shared/tripDataBridge.js',
  'routes.js': 'shared/tripEngine.cjs',
  'affiliateTracker.js': 'shared/tripEngineBridge.js',
  'rentalcarsClient.js': 'shared/travelEngine.js',
  'carAdapter.js': 'scripts/build-pages.js',
  'flightAdapter.js': 'scripts/build-release.js',
  'travelEngine.js': 'extension/manifest.json',
  'allInclusiveAdapter.js': 'extension/popup/popup.html',
  'amadeusClient.js': 'extension/popup/popup.js',
  'icon48.png': 'extension/background/service-worker.js',
  'tripDataBridge.js': 'extension/options/options.html',
  'tripEngine.cjs': 'extension/options/options.js',
  'options.js': 'extension/content/content.js',
  'options.html': 'extension/content/content.css',
  'content.js': 'docs/TESTAR_SEM_NODE.md',
  'service-worker.js': 'docs/ATIVAR_SITE.md',
  'content.css': 'docs/MIGRAR_REPOSITORIO.md',
  'release.yml': '.github/workflows/build-preview.yml',
  'MIGRAR_REPOSITORIO.md': '.github/workflows/release.yml',
  'ATIVAR_SITE.md': '.github/workflows/pages.yml',
  download: '.gitignore',
  'env.example': '.env.example',
};

/** Pastas esperadas na estrutura organizada */
const EXPECTED_DIRS = [
  'src/adapters',
  'src/services',
  'web',
  'extension/popup',
  'extension/background',
  'extension/content',
  'extension/options',
  'extension/icons',
  'web/icons',
  'shared',
  'scripts',
  'docs',
  '.github/workflows',
];

function ensureDirs() {
  for (const dir of EXPECTED_DIRS) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
}

function moveFile(from, to) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  if (!fs.existsSync(src)) return false;
  if (path.resolve(src) === path.resolve(dest)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(src, dest);
  console.log(`  ${from} → ${to}`);
  return true;
}

function unwrapNestedFolder() {
  const nested = path.join(root, 'META-TRAVEL');
  if (!fs.existsSync(nested) || !fs.statSync(nested).isDirectory()) return;
  console.log('Desembrulhando pasta META-TRAVEL/ aninhada...');
  for (const entry of fs.readdirSync(nested)) {
    const from = path.join(nested, entry);
    const to = path.join(root, entry);
    if (fs.existsSync(to)) {
      if (fs.statSync(to).isDirectory()) {
        for (const sub of fs.readdirSync(from)) {
          moveFile(path.join('META-TRAVEL', entry, sub), path.join(entry, sub));
        }
        fs.rmdirSync(from);
      }
    } else {
      fs.renameSync(from, to);
      console.log(`  META-TRAVEL/${entry} → ${entry}`);
    }
  }
  try {
    fs.rmdirSync(nested);
  } catch {
    /* pasta não vazia */
  }
}

function unwrapTravelFolder() {
  const legacy = path.join(root, 'travel');
  if (!fs.existsSync(legacy) || !fs.statSync(legacy).isDirectory()) return;
  console.log('Desembrulhando pasta legada travel/...');
  for (const entry of fs.readdirSync(legacy)) {
    const from = path.join(legacy, entry);
    const to = path.join(root, entry);
    if (!fs.existsSync(to)) {
      fs.renameSync(from, to);
      console.log(`  travel/${entry} → ${entry}`);
    }
  }
  try {
    fs.rmdirSync(legacy);
  } catch {
    /* ignore */
  }
}

function organizeFlatRoot() {
  let moved = 0;
  for (const [from, to] of Object.entries(CONTENT_MAP)) {
    if (moveFile(from, to)) moved++;
  }

  const rootFiles = fs.readdirSync(root).filter((f) => {
    const full = path.join(root, f);
    return fs.statSync(full).isFile() && !ROOT_ALLOW.has(f) && !f.startsWith('.');
  });

  for (const file of rootFiles) {
    const ext = path.extname(file).toLowerCase();
    if (['.js', '.html', '.css', '.json', '.yml', '.md', '.png'].includes(ext)) {
      console.warn(`  ⚠ Arquivo solto não mapeado: ${file}`);
    }
  }

  return moved;
}

function isOrganized() {
  return (
    fs.existsSync(path.join(root, 'src/index.js')) &&
    fs.existsSync(path.join(root, 'web/index.html')) &&
    fs.existsSync(path.join(root, 'extension/manifest.json'))
  );
}

function main() {
  console.log('Meta Travel — organize-root\n');

  if (isOrganized()) {
    console.log('Estrutura já organizada (src/, web/, extension/). Nada a fazer.');
    return;
  }

  ensureDirs();
  unwrapNestedFolder();
  unwrapTravelFolder();
  const moved = organizeFlatRoot();

  if (isOrganized()) {
    console.log(`\n✓ Organização concluída (${moved} arquivo(s) movido(s)).`);
    console.log('Próximo: npm install && npm run build && npm start');
  } else {
    console.error('\n✗ Estrutura incompleta após organize.');
    console.error('  Restaure do histórico git ou sincronize da branch cursor/organize-meta-travel-0336.');
    process.exit(1);
  }
}

main();
