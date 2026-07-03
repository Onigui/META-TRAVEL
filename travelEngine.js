{
  "manifest_version": 3,
  "name": "Meta Travel",
  "version": "1.0.0",
  "description": "Capture preços de voos, hotéis e pacotes enquanto navega — monte sua viagem sem pacote fechado.",
  "permissions": ["storage", "activeTab"],
  "host_permissions": [
    "https://*.latamairlines.com/*",
    "https://*.latam.com/*",
    "https://*.voegol.com.br/*",
    "https://*.gol.com.br/*",
    "https://*.voeazul.com.br/*",
    "https://*.booking.com/*",
    "https://*.decolar.com/*",
    "https://*.skyscanner.com.br/*",
    "https://*.google.com/travel/*",
    "http://localhost:3000/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "Meta Travel",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "options_page": "options/options.html",
  "content_scripts": [
    {
      "matches": [
        "https://*.latamairlines.com/*",
        "https://*.latam.com/*",
        "https://*.voegol.com.br/*",
        "https://*.gol.com.br/*",
        "https://*.voeazul.com.br/*",
        "https://*.booking.com/*",
        "https://*.decolar.com/*",
        "https://*.skyscanner.com.br/*",
        "https://*.google.com/travel/*"
      ],
      "js": ["content/content.js"],
      "css": ["content/content.css"],
      "run_at": "document_idle"
    }
  ]
}
