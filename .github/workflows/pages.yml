name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: node scripts/build-pages.js
      - uses: actions/upload-artifact@v4
        with:
          name: site-github-pages
          path: dist/pages
          retention-days: 14
      - uses: actions/upload-artifact@v4
        with:
          name: chrome-extension
          path: dist/meta-travel-extension-*.zip
          retention-days: 14

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: node scripts/build-pages.js
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/pages
      - id: deployment
        uses: actions/deploy-pages@v4
