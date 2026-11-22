import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import earth from '../assets/earth-detailed.jpg';
import centres from '../content/country-centres.json';
import './VisitorGlobe3D.css';

interface Country {
  code: string;
  name: string;
  users: number;
}

interface VisitorGlobe3DProps {
  countries: Country[];
  selected: string | null;
  onSelect: (code: string) => void;
}

const US = '#f5c86b';
const ABROAD = '#79d2c0';
// Natural Earth's label point for each country: [latitude, longitude, name].
const CENTRES = centres as unknown as Record<string, [number, number, string]>;

/** A point on the globe's surface (radius r) for a latitude and longitude, matching the texture. */
function onGlobe(lat: number, lng: number, r: number) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function webglAvailable() {
  try {
    return !!document.createElement('canvas').getContext('webgl');
  } catch {
    return false;
  }
}

/**
 * The Earth with a bar rising from each country visitors came from: taller for more visitors, gold
 * for the US and teal abroad. Drag to turn it, pinch or scroll to zoom, select a bar for its
 * numbers. The page lists the same countries in a table for screen readers and no-WebGL browsers.
 */
function VisitorGlobe3D({ countries, selected, onSelect }: VisitorGlobe3DProps) {
  const stage = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const [supported] = useState(webglAvailable);
  const select = useRef(onSelect);
  select.current = onSelect;
  const highlight = useRef<(code: string | null) => void>(() => {});

  useEffect(() => {
    const host = stage.current;
    if (!host || !supported) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.55, 3.1);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 1.7;
    controls.maxDistance = 5;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.5;
    controls.addEventListener('start', () => (controls.autoRotate = false));

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-3, 2, 4);
    scene.add(sun);

    const disposables: { dispose: () => void }[] = [];
    const globe = new THREE.Group();
    // Start with the Americas facing the viewer.
    globe.rotation.y = THREE.MathUtils.degToRad(-75);
    scene.add(globe);

    const texture = new THREE.TextureLoader().load(earth);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 48);
    const sphereMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0 });
    globe.add(new THREE.Mesh(sphereGeometry, sphereMaterial));
    disposables.push(texture, sphereGeometry, sphereMaterial);

    // A faint glow around the planet.
    const haloGeometry = new THREE.SphereGeometry(1.06, 48, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({ color: '#7fc8ff', transparent: true, opacity: 0.12, side: THREE.BackSide });
    scene.add(new THREE.Mesh(haloGeometry, haloMaterial));
    disposables.push(haloGeometry, haloMaterial);

    const most = Math.max(1, ...countries.map((c) => c.users));
    const bars = new Map<string, THREE.Mesh>();
    const up = new THREE.Vector3(0, 1, 0);
    for (const country of countries) {
      const centre = CENTRES[country.code];
      if (!centre) continue;
      const height = 0.04 + 0.42 * Math.sqrt(country.users / most);
      const geometry = new THREE.CylinderGeometry(0.018, 0.018, height, 12);
      geometry.translate(0, height / 2, 0);
      const material = new THREE.MeshStandardMaterial({ color: country.code === 'US' ? US : ABROAD, emissive: country.code === 'US' ? US : ABROAD, emissiveIntensity: 0.25 });
      const bar = new THREE.Mesh(geometry, material);
      const surface = onGlobe(centre[0], centre[1], 1);
      bar.position.copy(surface);
      bar.quaternion.setFromUnitVectors(up, surface.clone().normalize());
      bar.userData = { code: country.code };
      globe.add(bar);
      bars.set(country.code, bar);
      disposables.push(geometry, material);
    }

    highlight.current = (code) => {
      for (const [barCode, bar] of bars) {
        const material = bar.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = barCode === code ? 0.9 : 0.25;
        bar.scale.set(barCode === code ? 1.6 : 1, 1, barCode === code ? 1.6 : 1);
      }
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hit = (event: PointerEvent): string | undefined => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects([...bars.values()])[0]?.object.userData.code as string | undefined;
    };
    const byCode = new Map(countries.map((c) => [c.code, c]));
    const onMove = (event: PointerEvent) => {
      const box = tip.current;
      if (!box) return;
      const code = event.buttons ? undefined : hit(event);
      const country = code ? byCode.get(code) : undefined;
      if (!country) {
        box.hidden = true;
        return;
      }
      box.textContent = '';
      const name = document.createElement('strong');
      name.textContent = country.name;
      box.append(name, `${country.users.toLocaleString('en-US')} ${country.users === 1 ? 'visitor' : 'visitors'}`);
      const rect = host.getBoundingClientRect();
      box.hidden = false;
      box.style.left = `${Math.min(event.clientX - rect.left + 14, rect.width - 200)}px`;
      box.style.top = `${event.clientY - rect.top + 14}px`;
    };
    const onLeave = () => tip.current && (tip.current.hidden = true);
    let down: [number, number] | null = null;
    const onDown = (event: PointerEvent) => (down = [event.clientX, event.clientY]);
    const onUp = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6) return;
      const code = hit(event);
      if (code) select.current(code);
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
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
      highlight.current = () => {};
    };
  }, [countries, supported]);

  useEffect(() => highlight.current(selected), [selected]);

  return (
    <div className="visitor-globe" ref={stage} data-testid="visitor-globe">
      <div className="visitor-globe-legend" aria-hidden="true">
        <span>
          <i style={{ background: US }} />
          United States
        </span>
        <span>
          <i style={{ background: ABROAD }} />
          Abroad
        </span>
      </div>
      <div className="visitor-globe-hint" aria-hidden="true">
        {supported ? 'Drag to turn · select a bar' : ''}
      </div>
      <div className="visitor-globe-tip" ref={tip} hidden />
      {!supported && <p className="visitor-globe-fallback">This browser can't draw 3D. The list beside it has the same numbers.</p>}
    </div>
  );
}

export default VisitorGlobe3D;
