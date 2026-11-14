import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { app } = require('./server.js');

function request(server: http.Server, reqPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === 'string') {
      reject(new Error('Server not listening'));
      return;
    }
    http.get({ hostname: '127.0.0.1', port: addr.port, path: reqPath }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, headers: res.headers, body });
      });
    }).on('error', reject);
  });
}

function startServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

test('story.html and index.html are 100% identical (Hukum 10)', () => {
  const storyHtml = fs.readFileSync(path.join(process.cwd(), 'story.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.equal(storyHtml, indexHtml);
});

test('Tahap 1-3 & 10 Hukum Keras Anti-Regresi verified in story.html', () => {
  const storyHtml = fs.readFileSync(path.join(process.cwd(), 'story.html'), 'utf8');

  // Tahap 1: Amber rounded star SVG favicon without background
  assert.ok(storyHtml.includes("linearGradient id='amberStar'"));
  assert.ok(storyHtml.includes("stroke-linejoin='round'"));

  // Hukum 1: html, body display: block
  assert.ok(storyHtml.includes('display: block;'));

  // Tahap 2: Video visibility & Sinema (6VpxF5tzDfS.png / 5ZPukeMFffY) autoplay for video_5gKzK4lbTf6_22_56_1280x720.mp4
  assert.ok(storyHtml.includes('function isTargetVideo5gKz(el)'));
  assert.ok(storyHtml.includes('function isSlideVideoActuallyOpen(videoEl)'));
  assert.ok(storyHtml.includes('function isSinemaTriggerElement(el)'));
  assert.ok(storyHtml.includes('function triggerSinemaVideoAutoplay()'));
  assert.ok(storyHtml.includes('function hideTargetVideoPoster(videoEl)'));
  assert.ok(storyHtml.includes('5ZPukeMFffY'));
  assert.ok(storyHtml.includes('video_5gkzk4lbtf6_22_56_1280x720'));

  const videoStat = fs.statSync(path.join(process.cwd(), 'story_content', 'video_5gKzK4lbTf6_22_56_1280x720.mp4'));
  assert.equal(videoStat.size, 10367879);

  // Front stage blinking ACCESS button below fingerprint icon
  assert.ok(storyHtml.includes('id="starla-access-btn"'));
  assert.ok(storyHtml.includes('<span class="starla-access-label">ACCESS</span>'));
  assert.ok(storyHtml.includes('@keyframes starlaAccessBlink'));

  // Tahap 3: Capture-phase broken image listener & protected valid assets
  assert.ok(storyHtml.includes("window.addEventListener('error'"));
  assert.ok(storyHtml.includes('5gkganedbet.png'));
  assert.ok(storyHtml.includes('6cvvybugy8d_p_246_0_1299_405.png'));
  assert.ok(storyHtml.includes('6efvcxuloy5.png'));

  // Hukum 8 & 9: Murid terminology & canonical URL
  assert.ok(!/siswa|peserta didik/i.test(storyHtml));
  assert.ok(storyHtml.includes('https://faryzt.github.io/starla-360/'));
});

test('server serves index.html, story.html, and video_5gKzK4lbTf6_22_56_1280x720.mp4 cleanly', async () => {
  const server = await startServer();
  try {
    const res = await request(server, '/story.html');
    assert.equal(res.status, 200);
    assert.equal(res.headers['permissions-policy'], 'fullscreen=*, autoplay=*');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['cache-control'], 'no-cache, must-revalidate');
    assert.ok(res.body.includes('<title>STARLA BUDAYA</title>'));

    const addr = server.address();
    assert.ok(addr && typeof addr !== 'string');
    const videoStatus = await new Promise<number>((resolve, reject) => {
      http.get(
        {
          hostname: '127.0.0.1',
          port: addr.port,
          path: '/story_content/video_5gKzK4lbTf6_22_56_1280x720.mp4',
          headers: { Range: 'bytes=0-1023' },
        },
        (vRes) => {
          vRes.resume();
          resolve(vRes.statusCode || 0);
        }
      ).on('error', reject);
    });
    assert.ok(videoStatus === 200 || videoStatus === 206);
  } finally {
    server.close();
  }
});
