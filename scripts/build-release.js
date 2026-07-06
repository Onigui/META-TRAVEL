#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;
const extensionDir = path.join(root, 'extension');
const distDir = path.join(root, 'dist');
const zipName = `meta-travel-extension-v${version}.zip`;
const zipPath = path.join(distDir, zipName);
const sharedDir = path.join(root, 'shared');

function copyLib(targetLib) {
  fs.mkdirSync(targetLib, { recursive: true });
  for (const file of [
    'travelEngine.js', 'places.js', 'places.json', 'mockPricing.js',
    'searchFormHelpers.js', 'placeMeta.js', 'placeAutocomplete.js', 'cardRender.js',
    'flightDetails.js', 'captureBridge.js', 'googleFlights.js', 'travelRequirements.js', 'travelRequirements.json',
  ]) {
    fs.copyFileSync(path.join(sharedDir, file), path.join(targetLib, file));
  }
}

copyLib(path.join(extensionDir, 'lib'));

fs.mkdirSync(distDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

execSync(`cd "${extensionDir}" && zip -r "${zipPath}" . -x "*.DS_Store"`, { stdio: 'inherit' });

console.log(`Extensão Meta Travel pronta: ${zipPath}`);
