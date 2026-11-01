// CommonJS wrapper so main-server can mount Tidy Up.
// package.json is "type": "module", so this file is .cjs — require() cannot
// load an ESM server.js. Same arrangement as the other Vite apps.

const path = require('path');
const fs = require('fs');

// Tidy Up's own install has no Express. Main already depends on it, and this
// file is only loaded by main-server, so use that copy.
const express = require(path.join(__dirname, '..', 'main', 'node_modules', 'express'));

const app = express();
const staticPath = path.join(__dirname, 'dist');

if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      }
    },
    redirect: false,
  }));

  app.use((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(404).send('Not found');
    }
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
      return res.status(404).send('Not found');
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  console.warn('⚠️  Tidy Up: dist/ not found. Run: npm run build');
  app.use((req, res) => {
    res
      .status(503)
      .type('text/plain')
      .send('Tidy Up is not built. Run npm run build in tidyup.');
  });
}

module.exports = app;
