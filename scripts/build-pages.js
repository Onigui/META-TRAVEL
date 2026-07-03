#!/usr/bin/env node
/** Build do site estático para GitHub Pages */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const pagesDir = path.join(root, 'dist', 'pages');
const sharedDir = path.join(root, 'shared');

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyLib(targetLib) {
  fs.mkdirSync(targetLib, { recursive: true });
  for (const file of ['travelEngine.js', 'places.js', 'places.json', 'mockPricing.js', 'searchFormHelpers.js']) {
    fs.copyFileSync(path.join(sharedDir, file), path.join(targetLib, file));
  }
}

rm(pagesDir);
copyDir(path.join(root, 'web'), pagesDir);
copyLib(path.join(pagesDir, 'lib'));

// Evita processamento Jekyll no GitHub Pages
fs.writeFileSync(path.join(pagesDir, '.nojekyll'), '');

execSync('node scripts/build-release.js', { cwd: root, stdio: 'inherit' });

console.log(`Site GitHub Pages pronto: ${pagesDir}`);
