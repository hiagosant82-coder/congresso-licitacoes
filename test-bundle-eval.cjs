const fs = require('fs');
const path = require('path');

// Mock basic browser globals to allow the script to execute without crashing on simple window/document lookups
global.window = {
  fbq: () => {},
  location: { href: 'http://localhost/' },
  addEventListener: () => {},
  navigator: { userAgent: 'Node' }
};
global.document = {
  createElement: () => ({ async: true }),
  getElementsByTagName: () => [{ parentNode: { insertBefore: () => {} } }],
  referrer: '',
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => id === 'root' ? {
    appendChild: () => {},
    removeChild: () => {},
    insertBefore: () => {},
    ownerDocument: global.document,
    style: {},
    childNodes: [],
    nodeType: 1,
    addEventListener: () => {},
  } : null,
  head: { appendChild: () => {}, insertBefore: () => {} },
  body: { appendChild: () => {} },
};
global.navigator = global.window.navigator;
global.MutationObserver = class {
  observe() {}
  disconnect() {}
};
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const assetsDir = path.join(__dirname, 'dist', 'assets');
const jsFile = fs.readdirSync(assetsDir).find(f => f.endsWith('.js') && !f.endsWith('.map'));
if (!jsFile) {
  console.error('No built JS file found in dist/assets!');
  process.exit(1);
}
const bundlePath = path.join(assetsDir, jsFile);

try {
  console.log('Evaluating production JS bundle...');
  const bundleCode = fs.readFileSync(bundlePath, 'utf8');
  
  // Evaluate the bundle code in an IIFE to isolate scope
  (() => {
    eval(bundleCode);
  })();
  console.log('✅ Bundle evaluated successfully without syntax or module crashes!');
} catch (err) {
  console.error('❌ Bundle evaluation failed!');
  console.error(err);
}
