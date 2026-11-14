const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT_DIR = __dirname;

// Apply headers matching vercel.json
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'fullscreen=*, autoplay=*');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (
    req.path === '/' ||
    req.path === '/index.html' ||
    req.path === '/story.html' ||
    req.path.endsWith('.html')
  ) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  } else if (req.path.endsWith('.mp4')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else if (
    req.path.startsWith('/story_content/') ||
    req.path.startsWith('/html5/') ||
    req.path.startsWith('/mobile/')
  ) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

// Serve static files with cleanUrls support (.html extension fallback)
app.use(
  express.static(ROOT_DIR, {
    extensions: ['html'],
    index: ['index.html', 'story.html'],
  })
);

// Fallback to index.html for root or unrecognized navigation routes
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`STARLA BUDAYA server running at http://${HOST}:${PORT}`);
  });
}

module.exports = { app };
