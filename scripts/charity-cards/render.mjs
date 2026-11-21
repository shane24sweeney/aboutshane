// Renders the charity page's cards to frontend/src/assets/charity/<key>.jpg: each charity's logo in
// white on its brand colours, with the event and the part Shane played. Run with
// `npm run charity-cards` after editing the cards below. Logos are in ./logos (sources in README.md).
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 800;
const logoFile = (file) => new URL(`./logos/${file}`, import.meta.url);
/** Logos are embedded as data URLs: the card is rendered from a data: page, which can't load files. */
const logo = (file) => {
  const type = file.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  return `data:${type};base64,${readFileSync(logoFile(file)).toString('base64')}`;
};

/** One card per entry in content/charity.json, keyed by its `image`. */
const cards = [
  {
    key: 'PolarPlunge',
    logo: logo('special-olympics.svg'),
    colors: ['#0b3d91', '#1e88e5', '#7fd3ff'],
    event: 'Polar Plunge',
    detail: 'Special Olympics Georgia',
    role: 'Fundraiser & plunger',
  },
  {
    key: 'DogDays',
    logo: logo('dog-days-rescue-white.png'),
    colors: ['#7a0a16', '#c8102e', '#ef4b55'],
    event: 'Website Support',
    detail: 'Dog Days Rescue · Atlanta',
    role: 'Charity website',
  },
  {
    key: 'SusanKomen',
    logo: logo('susan-g-komen.svg'),
    colors: ['#8e1e5b', '#d0268a', '#f37fb8'],
    event: 'Race for the Cure',
    detail: 'Susan G. Komen',
    role: 'Fundraiser & runner',
  },
  {
    key: 'Dalton',
    icon: readFileSync(logoFile('runner.svg'), 'utf8'),
    colors: ['#14425f', '#2f6b8f', '#7cb342'],
    event: 'Carpet Capital 10 Miler',
    detail: 'Dalton, GA · Carpet Capital Running Club',
    role: 'Yearly charity race',
  },
  {
    key: 'Habitat',
    logo: logo('habitat-for-humanity.svg'),
    colors: ['#003f7d', '#0a6cc2', '#43b02a'],
    event: 'Hogpen Hill Climb 18K',
    detail: 'Habitat for Humanity · Helen, GA',
    role: 'Yearly charity race',
  },
];

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function html({ logo: src, icon, colors: [deep, main, light], event, detail, role }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden;
    font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif; color: #fff;
    background:
      radial-gradient(circle at 85% 12%, ${light}66 0, transparent 42%),
      radial-gradient(circle at 8% 92%, ${deep} 0, transparent 55%),
      linear-gradient(135deg, ${deep} 0%, ${main} 58%, ${light} 140%);
    display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
  }
  /* Fine diagonal texture so the colour field doesn't look flat. */
  body::before {
    content: ''; position: absolute; inset: 0; opacity: 0.07;
    background: repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 22px);
  }
  .logo { position: relative; height: ${icon ? 230 : 210}px; max-width: 760px; object-fit: contain;
    filter: ${icon ? 'none' : 'brightness(0) invert(1)'} drop-shadow(0 10px 24px rgba(0,0,0,.25)); }
  .rule { position: relative; width: 96px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.85); margin: 54px 0 34px; }
  .event { position: relative; font-size: 66px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.05;
    text-shadow: 0 4px 18px rgba(0,0,0,.25); }
  .detail { position: relative; margin-top: 16px; font-size: 30px; font-weight: 500; opacity: .92; }
  .role { position: relative; margin-top: 30px; padding: 10px 26px; border: 2px solid rgba(255,255,255,.7);
    border-radius: 999px; font-size: 22px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
</style></head><body>
  <img class="logo" src="${src}" alt="">
  <div class="rule"></div>
  <div class="event">${escape(event)}</div>
  <div class="detail">${escape(detail)}</div>
  <div class="role">${escape(role)}</div>
</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
for (const card of cards) {
  let markup = html(card);
  if (card.icon) {
    // Inline the icon so it takes the white text colour.
    const svg = card.icon
      .replace(/height="1em" width="1em"/, 'height="230" width="200"')
      .replace('<svg ', '<svg class="logo" style="color:#fff" ');
    markup = markup.replace(/<img class="logo"[^>]*>/, svg);
  }
  await page.goto(`data:text/html,${encodeURIComponent(markup)}`);
  await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())));
  const output = new URL(`../../frontend/src/assets/charity/${card.key}.jpg`, import.meta.url);
  await page.screenshot({ path: output.pathname, type: 'jpeg', quality: 88 });
  console.log(`Wrote ${output.pathname}`);
}
await browser.close();
