const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'dist', 'assets');
const jsFile = fs.readdirSync(assetsDir).find(f => f.endsWith('.js') && !f.endsWith('.map'));
const bundlePath = path.join(assetsDir, jsFile);

const code = fs.readFileSync(bundlePath, 'utf8');
const lines = code.split('\n');

// Find lines containing require_isUnsafeProperty
lines.forEach((line, index) => {
  if (line.includes('require_isUnsafeProperty')) {
    console.log(`LINE ${index + 1}:`);
    console.log(line);
    console.log('---');
  }
});
