import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GridCell, Metrics, Status } from '../api/metrics';
import './TestGrid3D.css';

interface TestGrid3DProps {
  grid: Metrics['grid'];
  /** Called with the "row|column" key of the bar the visitor selects. */
  onSelect: (key: string) => void;
}

// Failed sits on top so red is never hidden under the other results.
const STACK: Status[] = ['passed', 'skipped', 'flaky', 'failed'];
const COLOURS: Record<Status, string> = { passed: '#3fb950', failed: '#ff6b6b', flaky: '#d29922', skipped: '#7d8590' };

const total = (cell: GridCell) => cell.passed + cell.failed + cell.flaky + cell.skipped;

function webglAvailable() {
  try {
    return !!document.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
}

/**
 * Every test file on every device as a 3D bar chart: height for the number of tests, colour for
 * their results. Drag to turn it, pinch or scroll to zoom, and select a bar to list its tests.
 * The page shows the same numbers as a table for screen readers and browsers without WebGL.
 */
function TestGrid3D({ grid, onSelect }: TestGrid3DProps) {
  const stage = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [supported] = useState(webglAvailable);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    const host = stage.current;
    if (!host || !supported) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const { rows, columns, cells } = grid;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 6;
    controls.maxDistance = 60;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.6;
    controls.addEventListener('start', () => (controls.autoRotate = false));

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(8, 20, 12);
    scene.add(sun);

    const S = 1.25;
    const W = 0.68;
    const GAP = 0.04;
    const width = (columns.length - 1) * S;
    const depth = (rows.length - 1) * S;
    const x0 = -width / 2;
    const z0 = -depth / 2;
    const most = Math.max(1, ...Object.values(cells).map(total));
    const height = (n: number) => 0.15 + 3.2 * Math.sqrt(n / most);

    const disposables: { dispose: () => void }[] = [];
    const floorGeometry = new THREE.PlaneGeometry(width + S * 1.4, depth + S * 1.4);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: '#2a323b' });
    disposables.push(floorGeometry, floorMaterial);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const materials = Object.fromEntries(
      STACK.map((s) => [s, new THREE.MeshStandardMaterial({ color: COLOURS[s], roughness: 0.55, metalness: 0.05 })]),
    ) as Record<Status, THREE.MeshStandardMaterial>;
    const emptyMaterial = new THREE.MeshBasicMaterial({ color: '#3a4652' });
    disposables.push(...Object.values(materials), emptyMaterial);

    const bars: THREE.Mesh[] = [];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        const key = `${r}|${c}`;
        const cell = cells[key];
        const x = x0 + c * S;
        const z = z0 + r * S;
        if (!cell) {
          const geometry = new THREE.BoxGeometry(W, 0.02, W);
          disposables.push(geometry);
          const tile = new THREE.Mesh(geometry, emptyMaterial);
          tile.position.set(x, 0.01, z);
          scene.add(tile);
          continue;
        }
        const h = height(total(cell));
        let y = 0;
        for (const status of STACK) {
          if (!cell[status]) continue;
          const segment = Math.max(h * (cell[status] / total(cell)), 0.08);
          const geometry = new THREE.BoxGeometry(W, Math.max(segment - GAP, 0.04), W);
          disposables.push(geometry);
          const mesh = new THREE.Mesh(geometry, materials[status]);
          mesh.position.set(x, y + segment / 2, z);
          mesh.userData.key = key;
          scene.add(mesh);
          bars.push(mesh);
          y += segment;
        }
      }
    }

    // Row and column names are HTML over the canvas, placed each frame.
    const labels: { el: HTMLDivElement; pos: THREE.Vector3; row: boolean }[] = [];
    const addLabel = (text: string, pos: THREE.Vector3, row: boolean) => {
      const el = document.createElement('div');
      el.className = `grid3d-label${row ? ' grid3d-label-row' : ''}`;
      el.textContent = text;
      el.setAttribute('aria-hidden', 'true');
      host.appendChild(el);
      labels.push({ el, pos, row });
    };
    rows.forEach(({ name }, r) => addLabel(name, new THREE.Vector3(x0 - S * 0.6, 0, z0 + r * S), true));
    columns.forEach(({ name }, c) => addLabel(name, new THREE.Vector3(x0 + c * S, 0, z0 + depth + S * 0.7), false));

    const span = Math.max(width, depth);
    camera.position.set(-span * 0.3, span * 0.82, depth / 2 + span * 0.7);
    controls.target.set(width * 0.08, 0.4, depth * 0.1);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const v = new THREE.Vector3();
    let frame = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      const { clientWidth: w, clientHeight: h } = host;
      for (const { el, pos, row } of labels) {
        v.copy(pos).project(camera);
        const visible = v.z < 1;
        el.style.display = visible ? '' : 'none';
        if (visible) {
          const at = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
          el.style.transform = row ? `${at} translate(-100%, -50%)` : `${at} rotate(-35deg) translate(-100%, -50%)`;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    tick();

    // Hover shows a tooltip; a click or tap that isn't a drag selects the bar.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hit = (event: PointerEvent): string | undefined => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(bars)[0]?.object.userData.key as string | undefined;
    };
    const onMove = (event: PointerEvent) => {
      const box = tip.current;
      if (!box) return;
      const key = event.buttons ? undefined : hit(event);
      if (!key) {
        box.hidden = true;
        return;
      }
      const [r = 0, c = 0] = key.split('|').map(Number);
      const cell = cells[key];
      if (!cell) return;
      box.textContent = '';
      const title = document.createElement('strong');
      title.textContent = `${rows[r]?.name} · ${columns[c]?.name}`;
      box.append(title, (['passed', 'failed', 'flaky', 'skipped'] as Status[]).filter((s) => cell[s]).map((s) => `${cell[s]} ${s}`).join(', '));
      const rect = host.getBoundingClientRect();
      box.hidden = false;
      box.style.left = `${Math.min(event.clientX - rect.left + 14, rect.width - 250)}px`;
      box.style.top = `${event.clientY - rect.top + 14}px`;
    };
    const onLeave = () => tip.current && (tip.current.hidden = true);
    let down: [number, number] | null = null;
    const onDown = (event: PointerEvent) => (down = [event.clientX, event.clientY]);
    const onUp = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6) return;
      const key = hit(event);
      if (key) select.current(key);
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      labels.forEach(({ el }) => el.remove());
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [grid, supported]);

  return (
    <div className="grid3d" ref={stage} data-testid="test-grid-3d">
      <div className="grid3d-legend" aria-hidden="true">
        {(['passed', 'flaky', 'failed', 'skipped'] as Status[]).map((s) => (
          <span key={s}>
            <i style={{ background: COLOURS[s] }} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        ))}
      </div>
      <div className="grid3d-hint" aria-hidden="true">
        {supported ? 'Drag to rotate · select a bar' : ''}
      </div>
      <div className="grid3d-tip" ref={tip} hidden />
      {!supported && <p className="grid3d-fallback">This browser can't draw 3D. The table below has the same numbers.</p>}
    </div>
  );
}

export default TestGrid3D;
