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

rm(pagesDir);
copyDir(path.join(root, 'web'), pagesDir);
fs.mkdirSync(path.join(pagesDir, 'lib'), { recursive: true });
fs.copyFileSync(
  path.join(sharedDir, 'travelEngine.js'),
  path.join(pagesDir, 'lib/travelEngine.js')
);

execSync('node scripts/build-release.js', { cwd: root, stdio: 'inherit' });

console.log(`Site GitHub Pages pronto: ${pagesDir}`);
