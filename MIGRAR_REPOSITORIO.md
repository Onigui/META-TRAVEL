name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: node scripts/build-release.js
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/meta-travel-extension-*.zip
          generate_release_notes: true
