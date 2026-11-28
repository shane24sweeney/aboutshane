import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VisitorStats } from '../api/visitors';
import { type Atom, atomsFor, BOND, CLUSTERS, NUCLEUS, number } from './molecule';

/** Pages, countries and speed always; sources and devices once the export has them. */
const shownClusters = (atoms: ReturnType<typeof atomsFor>) => CLUSTERS.filter((c, i) => i < 3 || atoms[c.key].length > 0);
import './VisitorMolecule3D.css';

interface VisitorMolecule3DProps {
  stats: VisitorStats;
}

function webglAvailable() {
  try {
    return !!document.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
}

/** Points spread evenly over a sphere (a Fibonacci lattice). */
function spread(count: number): THREE.Vector3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    return new THREE.Vector3(Math.cos(golden * i) * r, y, Math.sin(golden * i) * r);
  });
}

/**
 * The site's visitors as a rotating 3D molecule: the site is the nucleus, bonded to three clusters
 * (most viewed pages, visitors' countries, and speed), each atom sized by its numbers. Drag to
 * turn it, pinch or scroll to zoom, hover or tap an atom for its numbers. The page lists the same
 * numbers below for screen readers and browsers without WebGL.
 */
function VisitorMolecule3D({ stats }: VisitorMolecule3DProps) {
  const stage = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [supported] = useState(webglAvailable);
  const atoms = atomsFor(stats);

  useEffect(() => {
    const host = stage.current;
    if (!host || !supported) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const clusters = atomsFor(stats);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.8, 11);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 18;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 1.4;
    controls.addEventListener('start', () => (controls.autoRotate = false));

    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(5, 8, 7);
    scene.add(key);

    const disposables: { dispose: () => void }[] = [];
    const sphere = new THREE.SphereGeometry(1, 32, 24);
    const bondGeometry = new THREE.CylinderGeometry(0.035, 0.035, 1, 10);
    const bondMaterial = new THREE.MeshStandardMaterial({ color: BOND, roughness: 0.6 });
    disposables.push(sphere, bondGeometry, bondMaterial);
    const material = (colour: string, glow = 0.35) => {
      const m = new THREE.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: glow, roughness: 0.35, metalness: 0.1 });
      disposables.push(m);
      return m;
    };

    const molecule = new THREE.Group();
    scene.add(molecule);
    const atomsHit: THREE.Mesh[] = [];
    const addAtom = (pos: THREE.Vector3, radius: number, mat: THREE.Material, info: Atom) => {
      const mesh = new THREE.Mesh(sphere, mat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(radius);
      mesh.userData = info;
      molecule.add(mesh);
      atomsHit.push(mesh);
      return mesh;
    };
    const bond = (a: THREE.Vector3, b: THREE.Vector3) => {
      const mesh = new THREE.Mesh(bondGeometry, bondMaterial);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.scale.set(1, a.distanceTo(b), 1);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      molecule.add(mesh);
    };

    const centre = new THREE.Vector3();
    addAtom(centre, 0.58, material(NUCLEUS, 0.25), {
      name: 'selenium-automation.com',
      detail: `${number(stats.totals.users)} visitors · ${number(stats.totals.pageViews)} page views`,
      size: 1,
    });

    // The clusters sit evenly around the nucleus, each a little higher than the last so all show.
    const labels: { el: HTMLDivElement; atom: THREE.Mesh }[] = [];
    const shown = shownClusters(clusters);
    const rise = shown.length > 3 ? 0.85 : 0.6;
    shown.forEach((cluster, c) => {
      const angle = (c / shown.length) * Math.PI * 2 + Math.PI / 2;
      const hubPos = new THREE.Vector3(Math.cos(angle) * 3, (c - (shown.length - 1) / 2) * rise, Math.sin(angle) * 3);
      const mat = material(cluster.colour);
      const items = clusters[cluster.key];
      const hub = addAtom(hubPos, 0.42, mat, { name: cluster.label, detail: `${items.length} shown`, size: 1 });
      bond(centre, hubPos);
      const out = hubPos.clone().normalize();
      // Atoms on the far side of their hub, never back toward the nucleus.
      const points = spread(items.length * 3 + 4)
        .filter((p) => p.dot(out) > 0.2)
        .slice(0, items.length);
      items.forEach((item, i) => {
        const dir = points[i] ?? out;
        const radius = 0.14 + 0.26 * item.size;
        const pos = hubPos.clone().add(dir.clone().multiplyScalar(1.15 + radius));
        addAtom(pos, radius, mat, item);
        bond(hubPos, pos);
      });
      const el = document.createElement('div');
      el.className = 'molecule3d-label';
      el.textContent = cluster.label;
      el.style.color = cluster.colour;
      el.setAttribute('aria-hidden', 'true');
      host.appendChild(el);
      labels.push({ el, atom: hub });
    });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Far enough back for the molecule (about 10 units across, and taller with five clusters) to
      // fit the width as well as the height.
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfWidth = halfHeight * camera.aspect;
      if (!fitted) camera.position.setLength(Math.max((shown.length > 3 ? 4.7 : 4) / halfHeight, 5.2 / halfWidth));
      fitted = w > 0;
    };
    let fitted = false;
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const v = new THREE.Vector3();
    let frame = 0;
    // Draw only while the molecule is on screen, to spare the visitor's battery.
    let onScreen = true;
    const visibility = new IntersectionObserver((entries) => {
      const wasOnScreen = onScreen;
      onScreen = entries.some((entry) => entry.isIntersecting);
      if (onScreen && !wasOnScreen) tick();
    });
    visibility.observe(host);
    const tick = () => {
      if (!onScreen) return;
      controls.update();
      renderer.render(scene, camera);
      const { clientWidth: w, clientHeight: h } = host;
      for (const { el, atom } of labels) {
        atom.getWorldPosition(v).project(camera);
        el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h - 26}px) translateX(-50%)`;
      }
      frame = requestAnimationFrame(tick);
    };
    tick();

    // Hover shows an atom's numbers; on a touch screen, a tap (not a drag) does.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hit = (event: PointerEvent): Atom | undefined => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(atomsHit)[0]?.object.userData as Atom | undefined;
    };
    const show = (event: PointerEvent, atom: Atom | undefined) => {
      const box = tip.current;
      if (!box) return;
      if (!atom) {
        box.hidden = true;
        return;
      }
      box.textContent = '';
      const name = document.createElement('strong');
      name.textContent = atom.name;
      box.append(name, atom.detail);
      const rect = host.getBoundingClientRect();
      box.hidden = false;
      box.style.left = `${Math.min(event.clientX - rect.left + 14, rect.width - 220)}px`;
      box.style.top = `${event.clientY - rect.top + 14}px`;
    };
    const onMove = (event: PointerEvent) => show(event, event.buttons ? undefined : hit(event));
    const onLeave = () => tip.current && (tip.current.hidden = true);
    let down: [number, number] | null = null;
    const onDown = (event: PointerEvent) => (down = [event.clientX, event.clientY]);
    const onUp = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || !down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6) return;
      show(event, hit(event));
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
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
  }, [stats, supported]);

  const shown = shownClusters(atoms);
  const parts = [
    `${atoms.pages.length} pages`,
    `${atoms.countries.length} countries`,
    `${atoms.speed.length} speed measures`,
    ...(atoms.sources.length ? [`${atoms.sources.length} sources`] : []),
    ...(atoms.devices.length ? [`${atoms.devices.length} devices and browsers`] : []),
  ];
  const counts = `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return (
    <div className="molecule3d" ref={stage} data-testid="visitor-molecule" role="img" aria-label={`The site as a molecule: ${counts}, listed below.`}>
      <div className="molecule3d-legend" aria-hidden="true">
        {shown.map((c) => (
          <span key={c.key}>
            <i style={{ background: c.colour }} />
            {c.label}
          </span>
        ))}
      </div>
      <div className="molecule3d-hint" aria-hidden="true">
        {supported ? 'Drag to turn · hover or tap an atom' : ''}
      </div>
      <div className="molecule3d-tip" ref={tip} hidden />
      {!supported && <p className="molecule3d-fallback">This browser can't draw 3D. The lists below have the same numbers.</p>}
    </div>
  );
}

export default VisitorMolecule3D;
