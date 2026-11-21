// Charts for the daily test report: donuts per suite, the 3D test grid page, and a PNG of the
// donuts for the email (email apps don't draw SVG, so it's sent as an inline image).

const escape = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Status colours. The dashboard uses its CSS variables so dark mode follows; the PNG uses fixed light values.
export const dashboardColours = { passed: 'var(--good)', failed: 'var(--bad)', flaky: 'var(--warn)', skipped: 'var(--skip)', ring: 'var(--line)' };
export const lightColours = { passed: '#1a7f37', failed: '#cf222e', flaky: '#bf8700', skipped: '#8c8c91', ring: '#e5e5ea' };
const statusNames = { passed: 'Passed', failed: 'Failed', flaky: 'Flaky', skipped: 'Skipped' };

// One donut: a ring per status, 2px gaps between slices. A non-zero slice is drawn at least 4px
// long so a single failure among hundreds stays visible; the legend gives the exact counts.
export function donut({ counts, colours, size = 132, stroke = 16, centre, sub, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const parts = Object.entries(counts).filter(([, n]) => n > 0);
  const total = parts.reduce((sum, [, n]) => sum + n, 0);
  const gap = parts.length > 1 ? 2 : 0;
  const minimum = 4 + gap;
  let lengths = parts.map(([, n]) => Math.max((n / total) * c, minimum));
  const excess = lengths.reduce((a, b) => a + b, 0) - c;
  const largest = lengths.indexOf(Math.max(...lengths));
  lengths = lengths.map((len, i) => (i === largest ? len - excess : len));
  let offset = 0;
  const arcs = parts
    .map(([status, n], i) => {
      const arc = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colours[status]}" stroke-width="${stroke}"
        stroke-dasharray="${Math.max(lengths[i] - gap, 0.5)} ${c}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${size / 2} ${size / 2})">
        <title>${statusNames[status]}: ${n} of ${total}</title></circle>`;
      offset += lengths[i];
      return arc;
    })
    .join('');
  const ring = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${colours.ring}" stroke-width="${stroke}"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escape(label)}">
    ${ring}${arcs}
    <text x="50%" y="${size / 2 - 2}" text-anchor="middle" class="donut-centre" style="font:600 24px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;fill:currentColor;">${escape(centre)}</text>
    <text x="50%" y="${size / 2 + 17}" text-anchor="middle" style="font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;fill:currentColor;opacity:.65;">${escape(sub)}</text>
  </svg>`;
}

// What one donut shows: a name, a line under it, and the count for each status.
export function summary(name, blurb, counts, unit = 'tests') {
  if (!counts) return { name, blurb, counts: null };
  const kept = Object.fromEntries(Object.entries(counts).filter(([k]) => k in statusNames));
  return { name, blurb, counts: kept, total: Object.values(kept).reduce((a, b) => a + b, 0), unit };
}

const passRate = (s) => {
  const ran = s.total - (s.counts.skipped ?? 0);
  if (!ran) return '–';
  const rate = ((s.counts.passed + (s.counts.flaky ?? 0)) / ran) * 100;
  return `${rate === 100 ? 100 : rate.toFixed(1)}%`;
};

function figure(summary, colours, legendStyle) {
  if (!summary.counts) {
    return `<figure class="donut-figure"><svg width="132" height="132" viewBox="0 0 132 132" role="img" aria-label="${summary.name}: no results">
      <circle cx="66" cy="66" r="58" fill="none" stroke="${colours.ring}" stroke-width="16"/>
      <text x="50%" y="70" text-anchor="middle" style="font:13px -apple-system,sans-serif;fill:currentColor;opacity:.65;">No results</text></svg>
      <figcaption><strong>${summary.name}</strong><span>The job didn't finish</span></figcaption></figure>`;
  }
  const label = `${summary.name}: ${Object.entries(summary.counts).map(([k, n]) => `${n} ${k}`).join(', ')}`;
  const legend = Object.entries(summary.counts)
    .map(([status, n]) => `<li${legendStyle ? ` style="${legendStyle.item}"` : ''}><i style="background:${colours[status]};${legendStyle?.swatch ?? ''}"></i>${statusNames[status]} <b>${n}</b></li>`)
    .join('');
  return `<figure class="donut-figure">
    ${donut({ counts: summary.counts, colours, centre: passRate(summary), sub: 'passed', label })}
    <figcaption><strong>${summary.name}</strong><span>${summary.total} ${summary.unit} · ${summary.blurb}</span></figcaption>
    <ul class="legend">${legend}</ul></figure>`;
}

// A row of donuts for the dashboard.
export const donutRow = (summaries) => `<div class="donuts">${summaries.map((s) => figure(s, dashboardColours)).join('')}</div>`;

export const overviewStyles = `
.donuts { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:24px; margin-top:16px; }
.donut-figure { margin:0; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px; }
.donut-figure svg { color:var(--text); }
.donut-figure figcaption strong { display:block; font-size:15px; }
.donut-figure figcaption span { color:var(--muted); font-size:13px; }
.legend { list-style:none; margin:0; padding:0; display:flex; flex-wrap:wrap; justify-content:center; gap:4px 12px; font-size:13px; color:var(--muted); }
.legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
.legend b { color:var(--text); font-weight:600; font-variant-numeric:tabular-nums; }`;

// The PNG for the email: the dashboard's donuts on white, three across.
export async function renderEmailChart(summaries, file) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return false;
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#fff; color:#1d1d1f; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    ${overviewStyles.replace(/var\(--muted\)/g, '#6e6e73').replace(/var\(--text\)/g, '#1d1d1f')}
    .donuts { display:grid; grid-template-columns:repeat(3, 1fr); gap:20px 8px; padding:16px 8px; margin:0; width:584px; box-sizing:border-box; }
    .donut-figure figcaption span { display:none; }
  </style></head><body><div class="donuts">${summaries.map((s) => figure(s, lightColours)).join('')}</div></body></html>`;
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 584, height: 600 }, deviceScaleFactor: 2 });
    await page.setContent(html);
    await page.locator('.donuts').screenshot({ path: file });
    return true;
  } catch (error) {
    console.warn(`Email chart skipped: ${error.message.split('\n')[0]}`);
    return false;
  } finally {
    await browser?.close();
  }
}

// ---- 3D test grid ----------------------------------------------------------------------------

// One bar per test file and device: height for the number of tests, stacked by status.
// Plain HTML table underneath with the same numbers, for screen readers and no-WebGL browsers.
export function gridPage({ rows, columns, cells, headline, day }) {
  const data = JSON.stringify({ rows, columns, cells }).replace(/</g, '\\u003c');
  const tableRows = rows
    .map((row, r) => `<tr><th scope="row">${escape(row.name)}</th>${columns
      .map((_, c) => {
        const cell = cells[`${r}|${c}`];
        if (!cell) return '<td class="empty">–</td>';
        const total = cell.passed + cell.failed + cell.flaky + cell.skipped;
        return `<td class="${cell.failed ? 'bad' : ''}"><a href="${escape(cell.link)}">${cell.passed}/${total}</a>${cell.failed ? ` <b>${cell.failed} failed</b>` : ''}</td>`;
      })
      .join('')}</tr>`)
    .join('');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Test Grid 3D</title>
<meta name="description" content="Every Playwright test file on every device, and the JMeter load test, as a 3D chart">
<style>
:root { --bg:#f5f5f7; --card:#fff; --text:#1d1d1f; --muted:#6e6e73; --line:#e5e5ea; --floor:#ececf0; --good:#1a7f37; --bad:#cf222e; --warn:#bf8700; --skip:#8c8c91; --accent:#0066cc; color-scheme:light; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#000; --card:#1c1c1e; --text:#f5f5f7; --muted:#a1a1a6; --line:#38383a; --floor:#2c2c2e; --good:#3fb950; --bad:#ff7b72; --warn:#d29922; --skip:#6e6e73; --accent:#2997ff; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#000; --card:#1c1c1e; --text:#f5f5f7; --muted:#a1a1a6; --line:#38383a; --floor:#2c2c2e; --good:#3fb950; --bad:#ff7b72; --warn:#d29922; --skip:#6e6e73; --accent:#2997ff; color-scheme:dark; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif; }
main { max-width:1200px; margin:0 auto; padding:32px 16px 64px; }
a { color:var(--accent); }
h1 { margin:8px 0 0; font-size:clamp(24px, 4vw, 34px); letter-spacing:-0.02em; line-height:1.15; }
.lede { color:var(--muted); margin:4px 0 20px; }
.stage { position:relative; background:var(--card); border-radius:18px; overflow:hidden; height:min(72vh, 680px); min-height:380px; touch-action:none; }
.stage canvas { display:block; width:100%; height:100%; cursor:grab; }
.stage canvas:active { cursor:grabbing; }
.label { position:absolute; left:0; top:0; font-size:11px; color:var(--muted); white-space:nowrap; pointer-events:none; transform:translate(-50%, -50%); }
.label.row { transform:translate(-100%, -50%); }
.legend { position:absolute; left:16px; top:14px; display:flex; flex-wrap:wrap; gap:4px 14px; font-size:13px; color:var(--muted); pointer-events:none; }
.legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
.hint { position:absolute; right:16px; bottom:12px; font-size:12px; color:var(--muted); pointer-events:none; }
.tip { position:absolute; pointer-events:none; background:var(--card); color:var(--text); border:1px solid var(--line); border-radius:10px; padding:8px 10px; font-size:13px; box-shadow:0 4px 16px rgba(0,0,0,.12); display:none; max-width:240px; }
.tip b { display:block; }
.panel { margin-top:16px; background:var(--card); border-radius:18px; padding:20px 24px; }
.panel h2 { margin:0; font-size:19px; }
.panel ul { list-style:none; margin:10px 0 0; padding:0; max-height:320px; overflow:auto; }
.panel li { padding:6px 0; border-bottom:1px solid var(--line); font-size:14px; display:flex; gap:8px; }
.panel li span { flex:none; width:18px; text-align:center; font-weight:700; }
.s-passed { color:var(--good); } .s-failed { color:var(--bad); } .s-flaky { color:var(--warn); } .s-skipped { color:var(--muted); }
.muted { color:var(--muted); font-size:14px; }
details { margin-top:16px; background:var(--card); border-radius:18px; padding:16px 24px; }
summary { cursor:pointer; font-weight:600; }
.scroll { overflow-x:auto; margin-top:12px; }
table { border-collapse:collapse; font-size:13px; width:100%; }
th, td { padding:6px 8px; border-bottom:1px solid var(--line); text-align:right; white-space:nowrap; }
th[scope="row"] { text-align:left; } thead th { color:var(--muted); font-weight:500; }
td.bad b { color:var(--bad); } td.empty { color:var(--muted); }
.fallback { position:absolute; inset:0; display:none; place-items:center; padding:24px; text-align:center; color:var(--muted); }
</style></head>
<body><main>
  <a href="./">← Back to the daily report</a>
  <h1>Every test, every device</h1>
  <p class="lede">${escape(headline)} · ${escape(day)}. Each bar is one test file on one device: its height is the number of tests, its colours their results. Drag to turn it, pinch or scroll to zoom, and select a bar to list its tests.</p>
  <div class="stage" id="stage">
    <div class="legend"><span><i style="background:var(--good)"></i>Passed</span><span><i style="background:var(--warn)"></i>Flaky</span><span><i style="background:var(--bad)"></i>Failed</span><span><i style="background:var(--skip)"></i>Skipped</span></div>
    <div class="hint">Drag to rotate</div>
    <div class="tip" id="tip"></div>
    <div class="fallback" id="fallback">This browser can't draw 3D. The same numbers are in the table below.</div>
  </div>
  <section class="panel" id="panel" aria-live="polite"><h2>Select a bar</h2><p class="muted">Its tests and their results will show here, with a link to the full report.</p></section>
  <details><summary>Table view</summary><div class="scroll"><table>
    <thead><tr><th scope="col" style="text-align:left">Test file</th>${columns.map((c) => `<th scope="col">${escape(c.name)}</th>`).join('')}</tr></thead>
    <tbody>${tableRows}</tbody></table></div></details>
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script>
(() => {
  const { rows, columns, cells } = ${data};
  const stage = document.getElementById('stage');
  const tip = document.getElementById('tip');
  const panel = document.getElementById('panel');
  if (!window.THREE || !THREE.OrbitControls || !(() => { try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; } })()) {
    document.getElementById('fallback').style.display = 'grid';
    document.querySelector('details').open = true;
    return;
  }
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const order = ['passed', 'skipped', 'flaky', 'failed']; // failed on top, so red is never hidden

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = 6;
  controls.maxDistance = 60;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.55);
  sun.position.set(8, 20, 12);
  scene.add(sun);

  const S = 1.25, W = 0.68, GAP = 0.04;
  const width = (columns.length - 1) * S, depth = (rows.length - 1) * S;
  const x0 = -width / 2, z0 = -depth / 2;
  const totals = Object.values(cells).map((c) => c.passed + c.failed + c.flaky + c.skipped);
  const max = Math.max(1, ...totals);
  const height = (n) => 0.15 + 3.2 * Math.sqrt(n / max);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width + S * 1.4, depth + S * 1.4), new THREE.MeshBasicMaterial({ color: css('--floor') }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const materials = {};
  const material = (status) => (materials[status] ??= new THREE.MeshStandardMaterial({ color: css('--' + { passed: 'good', failed: 'bad', flaky: 'warn', skipped: 'skip' }[status]), roughness: 0.55, metalness: 0.05 }));
  const emptyMaterial = new THREE.MeshBasicMaterial({ color: css('--line') });
  const bars = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const key = r + '|' + c;
      const cell = cells[key];
      const x = x0 + c * S, z = z0 + r * S;
      if (!cell) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(W, 0.02, W), emptyMaterial);
        tile.position.set(x, 0.01, z);
        scene.add(tile);
        continue;
      }
      const total = cell.passed + cell.failed + cell.flaky + cell.skipped;
      const h = height(total);
      let y = 0;
      for (const status of order) {
        if (!cell[status]) continue;
        const segment = Math.max(h * (cell[status] / total), 0.08);
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, Math.max(segment - GAP, 0.04), W), material(status));
        mesh.position.set(x, y + segment / 2, z);
        mesh.userData.key = key;
        scene.add(mesh);
        bars.push(mesh);
        y += segment;
      }
    }
  }

  // Row and column labels are HTML, placed over the canvas each frame.
  const labels = [];
  const addLabel = (text, pos, cls) => {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.textContent = text;
    stage.appendChild(el);
    labels.push({ el, pos });
  };
  rows.forEach((row, r) => addLabel(row.name, new THREE.Vector3(x0 - S * 0.6, 0, z0 + r * S), 'row'));
  columns.forEach((col, c) => addLabel(col.name, new THREE.Vector3(x0 + c * S, 0, z0 + depth + S * 0.7), 'col'));

  // Start from the front left, high enough to see every row, close enough to fill the stage.
  const span = Math.max(width, depth);
  camera.position.set(-span * 0.3, span * 0.82, depth / 2 + span * 0.7);
  controls.target.set(width * 0.08, 0.4, depth * 0.1);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = stage;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  const v = new THREE.Vector3();
  const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    const { clientWidth: w, clientHeight: h } = stage;
    for (const { el, pos } of labels) {
      v.copy(pos).project(camera);
      const visible = v.z < 1;
      el.style.display = visible ? '' : 'none';
      // Column labels slant so neighbours don't overlap.
      if (visible) el.style.transform = 'translate(' + ((v.x + 1) / 2 * w) + 'px,' + ((1 - v.y) / 2 * h) + 'px) ' + (el.classList.contains('row') ? 'translate(-100%,-50%)' : 'rotate(-35deg) translate(-100%,-50%)');
    }
    requestAnimationFrame(tick);
  };
  labels.forEach(({ el }) => { el.style.left = '0'; el.style.top = '0'; });
  tick();

  // Hover shows a tooltip; a click (not a drag) lists the bar's tests.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hit = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(bars)[0]?.object.userData.key;
  };
  const describe = (key) => {
    const [r, c] = key.split('|').map(Number);
    const cell = cells[key];
    const parts = ['passed', 'failed', 'flaky', 'skipped'].filter((s) => cell[s]).map((s) => cell[s] + ' ' + s);
    return { title: rows[r].name + ' · ' + columns[c].name, parts, cell };
  };
  renderer.domElement.addEventListener('pointermove', (event) => {
    const key = event.buttons ? null : hit(event);
    if (!key) { tip.style.display = 'none'; return; }
    const { title, parts } = describe(key);
    tip.innerHTML = '';
    const b = document.createElement('b'); b.textContent = title; tip.appendChild(b);
    tip.appendChild(document.createTextNode(parts.join(', ')));
    const rect = stage.getBoundingClientRect();
    tip.style.display = 'block';
    tip.style.left = Math.min(event.clientX - rect.left + 14, rect.width - 250) + 'px';
    tip.style.top = (event.clientY - rect.top + 14) + 'px';
  });
  renderer.domElement.addEventListener('pointerleave', () => { tip.style.display = 'none'; });
  let down;
  renderer.domElement.addEventListener('pointerdown', (event) => { down = [event.clientX, event.clientY]; });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6) return;
    const key = hit(event);
    if (!key) return;
    const { title, parts, cell } = describe(key);
    const icons = { passed: '✓', failed: '✕', flaky: '!', skipped: '–' };
    const sorted = [...cell.tests].sort((a, b) => ['failed', 'flaky', 'skipped', 'passed'].indexOf(a.s) - ['failed', 'flaky', 'skipped', 'passed'].indexOf(b.s));
    panel.innerHTML = '';
    const h2 = document.createElement('h2'); h2.textContent = title; panel.appendChild(h2);
    const p = document.createElement('p'); p.className = 'muted';
    p.textContent = parts.join(', ') + ' · ';
    const a = document.createElement('a'); a.href = cell.link; a.textContent = 'Open in the full report →'; p.appendChild(a);
    panel.appendChild(p);
    const ul = document.createElement('ul');
    for (const test of sorted) {
      const li = document.createElement('li');
      const icon = document.createElement('span'); icon.className = 's-' + test.s; icon.textContent = icons[test.s]; icon.setAttribute('aria-label', test.s);
      li.appendChild(icon); li.appendChild(document.createTextNode(test.t));
      ul.appendChild(li);
    }
    panel.appendChild(ul);
    panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
})();
</script>
</body></html>`;
}
