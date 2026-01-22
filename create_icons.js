// Simple icon generator using node-canvas or html-to-image
// Run with: node create_icons.js
// Or use create_icons.html in a browser

const fs = require('fs');
const path = require('path');

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// For now, create simple SVG icons that can be converted to PNG
// You can use an online converter or ImageMagick

const svg16 = `<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad16" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a9eff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6c5ce7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="16" height="16" fill="url(#grad16)"/>
  <text x="8" y="12" font-size="10" fill="white" text-anchor="middle">📄</text>
</svg>`;

const svg48 = `<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad48" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a9eff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6c5ce7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="4" fill="url(#grad48)"/>
  <text x="24" y="32" font-size="28" fill="white" text-anchor="middle">📄</text>
  <path d="M 12 24 L 18 30 L 36 14" stroke="#00b894" stroke-width="2" fill="none"/>
</svg>`;

const svg128 = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad128" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4a9eff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6c5ce7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="8" fill="url(#grad128)"/>
  <text x="64" y="88" font-size="72" fill="white" text-anchor="middle">📄</text>
  <path d="M 32 64 L 48 80 L 96 32" stroke="#00b894" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Write SVG files (can be converted to PNG using online tools or ImageMagick)
fs.writeFileSync(path.join(iconsDir, 'icon16.svg'), svg16);
fs.writeFileSync(path.join(iconsDir, 'icon48.svg'), svg48);
fs.writeFileSync(path.join(iconsDir, 'icon128.svg'), svg128);

console.log('SVG icons created!');
console.log('To convert to PNG, you can:');
console.log('1. Use online converter (https://cloudconvert.com/svg-to-png)');
console.log('2. Use ImageMagick: convert icon16.svg icon16.png');
console.log('3. Open create_icons.html in browser and download PNGs');

