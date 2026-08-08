const fs = require('fs');
const path = require('path');
const cssPath = path.join(__dirname, '..', 'css', 'style.css');
const lines = fs.readFileSync(cssPath, 'utf8').split('\n');
console.log(lines.slice(350, 420).map((l, i) => `${i + 351}: ${l}`).join('\n'));
