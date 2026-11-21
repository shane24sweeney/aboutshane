// Crops each Apple Fitness screenshot in ./source to just its medal, centred on a transparent
// 480x480 square, and writes it to frontend/src/assets/medals/<name>.webp. The medal is the first
// block of non-black rows from the top; the caption Apple prints under it (name, date, stats) is
// left out, because the About page sets that as text. Run with `npm run fitness-medals`.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const SIZE = 480;
const source = new URL('./source/', import.meta.url);
const output = new URL('../../frontend/src/assets/medals/', import.meta.url);
mkdirSync(output, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');

for (const file of readdirSync(source).filter((name) => /\.(png|webp)$/.test(name)).sort()) {
  const type = file.endsWith('.webp') ? 'image/webp' : 'image/png';
  const dataUrl = `data:${type};base64,${readFileSync(new URL(file, source)).toString('base64')}`;
  const webp = await page.evaluate(
    async ({ dataUrl, SIZE }) => {
      const image = new Image();
      image.src = dataUrl;
      await image.decode();
      const { naturalWidth: w, naturalHeight: h } = image;
      const scan = document.createElement('canvas');
      scan.width = w;
      scan.height = h;
      const scanContext = scan.getContext('2d');
      scanContext.drawImage(image, 0, 0);
      const { data } = scanContext.getImageData(0, 0, w, h);
      // A pixel is part of the medal if it is visibly brighter than the black background.
      const lit = (x, y) => {
        const i = (y * w + x) * 4;
        return Math.max(data[i], data[i + 1], data[i + 2]) > 40;
      };
      const rowLit = (y) => {
        let count = 0;
        for (let x = 0; x < w; x += 1) if (lit(x, y)) count += 1;
        return count > 2;
      };
      // The medal: the first run of lit rows, ending at the first gap of 4+ dark rows (the space
      // above the caption).
      let top = 0;
      while (top < h && !rowLit(top)) top += 1;
      let bottom = top;
      for (let gap = 0, y = top; y < h; y += 1) {
        if (rowLit(y)) {
          bottom = y;
          gap = 0;
        } else if ((gap += 1) >= 4) break;
      }
      let left = w;
      let right = 0;
      for (let y = top; y <= bottom; y += 1)
        for (let x = 0; x < w; x += 1)
          if (lit(x, y)) {
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
      // Square around the medal with a little room, on transparent, so every medal sits the same.
      const side = Math.max(right - left, bottom - top) * 1.08;
      const cx = (left + right) / 2;
      const cy = (top + bottom) / 2;
      const out = document.createElement('canvas');
      out.width = SIZE;
      out.height = SIZE;
      const context = out.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, cx - side / 2, cy - side / 2, side, side, 0, 0, SIZE, SIZE);
      // Make the black screenshot background transparent, fading the edges so nothing looks cut out.
      const pixels = context.getImageData(0, 0, SIZE, SIZE);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const brightness = Math.max(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
        if (brightness < 28) pixels.data[i + 3] = Math.round((brightness / 28) * 255);
      }
      context.putImageData(pixels, 0, 0);
      return out.toDataURL('image/webp', 0.9);
    },
    { dataUrl, SIZE },
  );
  const name = file.replace(/\.(png|webp)$/, '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
  writeFileSync(new URL(`${name}.webp`, output), Buffer.from(webp.split(',')[1], 'base64'));
  console.log(`${file} -> ${name}.webp`);
}
await browser.close();
