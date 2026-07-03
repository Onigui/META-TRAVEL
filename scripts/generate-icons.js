#!/usr/bin/env node
/** Garante ícones PWA (web/icons/) e extensão (extension/icons/) a partir dos existentes */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function copyIfMissing(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ Origem ausente: ${src}`);
    return false;
  }
  if (fs.existsSync(dest)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  ${path.relative(root, dest)}`);
  return true;
}

function main() {
  console.log('Meta Travel — generate-icons\n');

  const web192 = path.join(root, 'web/icons/icon192.png');
  const web512 = path.join(root, 'web/icons/icon512.png');
  const ext48 = path.join(root, 'extension/icons/icon48.png');
  const ext16 = path.join(root, 'extension/icons/icon16.png');
  const ext128 = path.join(root, 'extension/icons/icon128.png');

  let copied = 0;
  if (copyIfMissing(web192, ext16)) copied++;
  if (copyIfMissing(web192, ext48)) copied++;
  if (copyIfMissing(web512, ext128)) copied++;

  copyIfMissing(ext48, web192);
  copyIfMissing(ext128, web512);

  if (fs.existsSync(web192) && fs.existsSync(web512) && fs.existsSync(ext16) && fs.existsSync(ext48) && fs.existsSync(ext128)) {
    console.log(`\n✓ Ícones OK (${copied} copiado(s)).`);
  } else {
    console.error('\n✗ Ícones incompletos. Verifique web/icons/ e extension/icons/.');
    process.exit(1);
  }
}

main();
