// Runs after `vite build`. Writes frontend/build/<page>/index.html for every route, so a request
// for /resume gets a page of its own instead of the shared index.html:
//
// - its <noscript> holds the page's full text, built from content/*.json, for anything that reads
//   the HTML without running JavaScript (resume parsers, recruiter tools, plain crawlers). Browsers
//   with JavaScript ignore <noscript>, so visitors see the app exactly as before.
// - its canonical link and og:url point at the page itself.
//
// CloudFront (SpaRoutingFunction in infra/template.yaml) and the local preview server
// (frontend/vite.config.ts) map /<page> to /<page>/index.html. Run on its own with
// `node scripts/prerender.mjs` after a build.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const build = new URL('frontend/build/', root);
const SITE = 'https://selenium-automation.com';

/** The routes the app serves; keep in step with App.tsx and the routing rules above. */
export const PAGES = ['home', 'about', 'contact', 'resume', 'testimonials', 'education', 'charity'];

const content = (name) => JSON.parse(readFileSync(new URL(`content/${name}.json`, root), 'utf8'));

const escape = (text) =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
/** **double asterisks** mark bold phrases, as in the app. */
const rich = (text) => escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const list = (items) => `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

const profile = content('profile');
const intro = `<p><strong>${escape(profile.name)}</strong>, ${escape(profile.headline)}. ${escape(profile.meta)}.</p>`;

const bodies = {
  home: () =>
    [
      `<h1>${escape(profile.name)}</h1>`,
      `<p>${escape(profile.headline)} · ${escape(profile.meta)}</p>`,
      `<h2>${escape(profile.summaryTitle)}</h2>`,
      ...profile.summary.map((paragraph) => `<p>${rich(paragraph)}</p>`),
      `<h2>${escape(profile.strengthsTitle)}</h2>`,
      list(profile.strengths.map(escape)),
      `<h2>${escape(profile.highlightsTitle)}</h2>`,
      `<p>${escape(profile.frameworks)}</p>`,
      list(profile.highlights.map(({ label, text }) => `<strong>${escape(label)}:</strong> ${escape(text)}`)),
    ].join(''),

  about: () => {
    const { essay, signature } = content('about');
    return `<h1>About Shane</h1><p>${escape(essay)}</p><p>${escape(signature)}</p>`;
  },

  contact: () =>
    `<h1>Send me a message.</h1>${intro}<p>The contact form needs JavaScript. You can also reach me on ` +
    `<a href="https://linkedin.com/in/shane-sweeney-37a934135">LinkedIn</a>.</p>`,

  resume: () => {
    const entries = content('resume');
    const roles = entries.filter((entry) => !entry.earlier);
    const earlier = entries.filter((entry) => entry.earlier);
    return [
      `<h1>Professional Experience</h1>`,
      intro,
      ...roles.map((entry) =>
        [
          `<h2>${escape(entry.role)} - ${escape(entry.company)}${entry.contractVia ? ` (Contract via ${escape(entry.contractVia)})` : ''}</h2>`,
          entry.dates ? `<p>${escape(entry.dates)}</p>` : '',
          entry.meta ? `<p>${escape(entry.meta)}</p>` : '',
          entry.summary ? `<p>${escape(entry.summary)}</p>` : '',
          entry.highlights.length ? list(entry.highlights.map(escape)) : '',
        ].join(''),
      ),
      earlier.length
        ? `<p><strong>Earlier experience:</strong> ${earlier
            .map(({ role, company, meta }) => escape(meta ? `${role}, ${company} – ${meta}` : `${role}, ${company}`))
            .join(' • ')}</p>`
        : '',
    ].join('');
  },

  testimonials: () =>
    `<h1>Testimonials</h1>` +
    content('testimonials')
      .map(({ name, title, recommendation }) => `<blockquote><p>${escape(recommendation)}</p><p>${escape(name)}, ${escape(title)}</p></blockquote>`)
      .join(''),

  education: () =>
    `<h1>Education</h1>${list(content('education').map(({ degree, school }) => `${escape(degree)}, ${escape(school)}`))}`,

  charity: () =>
    `<h1>Charity Work</h1>${list(
      content('charity').map(({ title, link }) =>
        link ? `${escape(title)} (<a href="${escape(link.href)}">${escape(link.label)}</a>)` : escape(title),
      ),
    )}`,
};

const template = readFileSync(new URL('index.html', build), 'utf8');
const noscript = /<noscript>[\s\S]*?<\/noscript>/;
if (!noscript.test(template)) throw new Error('frontend/build/index.html has no <noscript> to fill');

for (const page of PAGES) {
  const url = `${SITE}/${page}`;
  const html = template
    .replace('<link rel="canonical" href="https://selenium-automation.com/home" />', `<link rel="canonical" href="${url}" />`)
    .replace('<meta property="og:url" content="https://selenium-automation.com/home" />', `<meta property="og:url" content="${url}" />`)
    .replace(noscript, `<noscript>${bodies[page]()}<p>Turn on JavaScript for the full site.</p></noscript>`);
  mkdirSync(new URL(`${page}/`, build), { recursive: true });
  writeFileSync(new URL(`${page}/index.html`, build), html);
}
console.log(`Pre-rendered ${PAGES.length} pages into frontend/build/<page>/index.html`);
