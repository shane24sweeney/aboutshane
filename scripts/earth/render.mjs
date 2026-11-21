// Draws the Test Metrics tab's globe texture (frontend/src/assets/earth.jpg): a flat 2:1 world map
// from Natural Earth's public-domain land outlines, so it needs no credit. To redraw it:
//
//   curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
//   node scripts/earth/render.mjs ne_110m_land.geojson earth-512.jpg
//   sips -z 128 256 earth-512.jpg --out frontend/src/assets/earth.jpg
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const land = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 512, height: 256 } });
await p.setContent('<canvas id="c" width="512" height="256" style="display:block"></canvas>');
await p.evaluate((land) => {
  const c = document.getElementById('c'); const g = c.getContext('2d');
  const W = 512, H = 256;
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#1d4f8f'); sea.addColorStop(0.5, '#2f7fd0'); sea.addColorStop(1, '#1d4f8f');
  g.fillStyle = sea; g.fillRect(0, 0, W, H);
  const xy = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
  const landFill = g.createLinearGradient(0, 0, 0, H);
  landFill.addColorStop(0, '#e8eef2'); landFill.addColorStop(0.16, '#5f9a52'); landFill.addColorStop(0.38, '#79a84f');
  landFill.addColorStop(0.5, '#b5a160'); landFill.addColorStop(0.62, '#79a84f'); landFill.addColorStop(0.85, '#5f9a52'); landFill.addColorStop(1, '#f2f5f7');
  g.fillStyle = landFill; g.strokeStyle = 'rgba(20,40,20,0.35)'; g.lineWidth = 0.6;
  for (const f of land.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      g.beginPath();
      for (const ring of poly) ring.forEach((pt, i) => { const [x, y] = xy(pt); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.fill('evenodd'); g.stroke();
    }
  }
}, land);
await p.locator('#c').screenshot({ path: out, type: 'jpeg', quality: 82 });
await b.close();
