import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ==========================================
// REALISTIC 3D EARTH GLOBE
// - Rich, deep royal blue oceans (#0A2240) — ZERO white haze/glare/fog blowout!
// - Outer rim glow only (center of sphere stays 100% crystal clear)
// - Balanced lighting for vibrant, rich continents & oceans
// - Choreography: Hero (Right) -> Services (Left) -> HQ Tour (Left) -> Destinations (Center) -> Stats (Center STILL) -> Fades after Stats!
// ==========================================

const EARTH_TEXTURE = 'https://unpkg.com/three-globe@2.35.0/example/img/earth-blue-marble.jpg';
const EARTH_BUMP = 'https://unpkg.com/three-globe@2.35.0/example/img/earth-topology.png';

export interface OfficeLocation {
  city?: string;
  name?: string;
  lat?: number;
  lon?: number;
}

const locations = [
  { name: 'Panipat', lat: 29.39, lon: 76.97, color: 0x6366f1 },
  { name: 'Delhi', lat: 28.55, lon: 77.21, color: 0x10b981 },
  { name: 'Jaipur', lat: 26.91, lon: 75.79, color: 0xf97316 },
  { name: 'Bangalore', lat: 12.97, lon: 77.59, color: 0xeab308 },
  { name: 'Kolkata', lat: 22.57, lon: 88.36, color: 0x3b82f6 },
  { name: 'Nepal', lat: 28.3949, lon: 84.124, color: 0xec4899 },
  { name: 'Sri Lanka', lat: 7.8731, lon: 80.7718, color: 0x06b6d4 },
  { name: 'Bangladesh', lat: 23.685, lon: 90.3563, color: 0x10b981 },
];

interface EarthGlobeProps {
  activeOffice?: OfficeLocation | null;
}

export const EarthGlobe: React.FC<EarthGlobeProps> = ({ activeOffice }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number | null>(null);
  const scrollDataRef = useRef({ x: 1.30, y: 0, scale: 1.05, opacity: 1, phase: 'hero' });
  const currentOpacityRef = useRef(1);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const targetRotYRef = useRef((76.97 * Math.PI / 180) + Math.PI / 2);
  const targetRotXRef = useRef(-(29.39 * Math.PI / 180) * 0.7);
  const markersRef = useRef<Array<{ pin: THREE.Mesh; beacon: THREE.Mesh; name: string }>>([]);
  const glowRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Balanced Natural Lighting — prevents white color blowout
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.35);
    fillLight.position.set(-4, -1, -4);
    scene.add(fillLight);

    const textureLoader = new THREE.TextureLoader();

    // Earth Sphere Geometry — MeshStandardMaterial prevents specular glare
    const earthGeometry = new THREE.SphereGeometry(1.65, 64, 64);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.05,
      transparent: true,
      opacity: 1,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.position.set(1.30, 0, 0);
    earthMesh.scale.setScalar(1.05);
    earthMesh.rotation.y = (76.97 * Math.PI / 180) + Math.PI / 2;
    earthMesh.rotation.x = (29.39 * Math.PI / 180) * 0.65;
    scene.add(earthMesh);
    earthRef.current = earthMesh;

    // Load Earth textures
    textureLoader.load(EARTH_TEXTURE, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      earthMaterial.map = tex;
      earthMaterial.needsUpdate = true;
    });
    textureLoader.load(EARTH_BUMP, (tex) => {
      earthMaterial.bumpMap = tex;
      earthMaterial.bumpScale = 0.025;
      earthMaterial.needsUpdate = true;
    });

    // Pure Outer Rim Atmosphere Glow — 0% opacity over center face!
    const glowGeometry = new THREE.SphereGeometry(1.68, 64, 64);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float uOpacity;
        void main() {
          float viewDot = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          float rim = pow(1.0 - viewDot, 3.5);
          gl_FragColor = vec4(0.2, 0.5, 1.0, rim * 0.45 * uOpacity);
        }
      `,
      uniforms: {
        uOpacity: { value: 1.0 },
      },
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(earthMesh.position);
    scene.add(glowMesh);
    glowRef.current = glowMesh;

    // 3D Pins on Earth Surface
    const markers: Array<{ pin: THREE.Mesh; beacon: THREE.Mesh; name: string }> = [];
    locations.forEach((loc) => {
      const latRad = (loc.lat * Math.PI) / 180;
      const lonRad = (loc.lon * Math.PI) / 180;
      const r = 1.67;

      const x = r * Math.cos(latRad) * Math.cos(lonRad);
      const y = r * Math.sin(latRad);
      const z = -r * Math.cos(latRad) * Math.sin(lonRad);

      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: loc.color, transparent: true, opacity: 1 });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(x, y, z);
      earthMesh.add(pin);

      const beaconGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        transparent: true,
        opacity: 0.45,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pin.position);
      earthMesh.add(beacon);

      markers.push({ pin, beacon, name: loc.name });
    });
    markersRef.current = markers;

    const clock = new THREE.Clock();

    // Render loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const data = scrollDataRef.current;

      // Smooth Opacity Interpolation
      currentOpacityRef.current += (data.opacity - currentOpacityRef.current) * 0.12;

      if (earthRef.current) {
        earthRef.current.position.x += (data.x - earthRef.current.position.x) * 0.08;
        earthRef.current.position.y += (data.y - earthRef.current.position.y) * 0.08;

        const currentScale = earthRef.current.scale.x;
        const newScale = currentScale + (data.scale - currentScale) * 0.08;
        earthRef.current.scale.setScalar(newScale);

        // Opacity & Visibility
        const op = Math.max(0, Math.min(1, currentOpacityRef.current));
        earthMaterial.opacity = op;
        earthMesh.visible = op > 0.01;

        if (glowMaterial.uniforms.uOpacity) {
          glowMaterial.uniforms.uOpacity.value = op;
        }

        if (!isDraggingRef.current) {
          if (data.phase === 'hero' || data.phase === 'services' || data.phase === 'destinations' || data.phase === 'stats') {
            earthRef.current.rotation.y += 0.0025;
            earthRef.current.rotation.x += (-0.25 - earthRef.current.rotation.x) * 0.05;
          } else if (data.phase === 'hqtour' && targetRotYRef.current !== null) {
            const diffY = targetRotYRef.current - earthRef.current.rotation.y;
            const shortDiffY = Math.atan2(Math.sin(diffY), Math.cos(diffY));
            earthRef.current.rotation.y += shortDiffY * 0.07;

            const diffX = targetRotXRef.current - earthRef.current.rotation.x;
            earthRef.current.rotation.x += diffX * 0.07;
          }
        }

        markers.forEach((m) => {
          if (m.beacon.visible) {
            m.beacon.scale.setScalar(1 + Math.sin(elapsed * 4.0) * 0.35);
          }
        });
      }

      if (glowRef.current && earthRef.current) {
        glowRef.current.position.copy(earthRef.current.position);
        glowRef.current.scale.copy(earthRef.current.scale);
        glowRef.current.visible = earthMesh.visible;
      }

      renderer.render(scene, camera);
    };
    animate();

    // RAYCASTER POINTER DRAG
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      if (!earthMesh || !earthMesh.visible) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(earthMesh);

      if (intersects.length > 0) {
        isDraggingRef.current = true;
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (isDraggingRef.current && earthRef.current) {
        const dx = e.clientX - prevMouseRef.current.x;
        const dy = e.clientY - prevMouseRef.current.y;
        earthRef.current.rotation.y += dx * 0.006;
        earthRef.current.rotation.x += dy * 0.004;
        earthRef.current.rotation.x = Math.max(-0.8, Math.min(0.8, earthRef.current.rotation.x));
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
      } else if (earthMesh && earthMesh.visible) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earthMesh);
        if (intersects.length > 0) {
          document.body.style.cursor = 'grab';
        } else {
          if (document.body.style.cursor === 'grab' || document.body.style.cursor === 'grabbing') {
            document.body.style.cursor = 'default';
          }
        }
      }
    };

    const onPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Active office pin selection
  useEffect(() => {
    const currentName = activeOffice ? activeOffice.city || activeOffice.name : 'Panipat';

    markersRef.current.forEach((m) => {
      const isActive = m.name === currentName;
      m.pin.visible = isActive;
      m.beacon.visible = isActive;
    });

    const currentLoc = locations.find((l) => l.name === currentName) || locations[0];
    const lonRad = (currentLoc.lon * Math.PI) / 180;
    const latRad = (currentLoc.lat * Math.PI) / 180;

    targetRotYRef.current = lonRad + Math.PI / 2;
    targetRotXRef.current = latRad * 0.65;
  }, [activeOffice]);

  // Section Scroll Choreography
  useEffect(() => {
    const handleScroll = () => {
      const data = scrollDataRef.current;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isMobile = vw < 768;

      const servicesSec = document.getElementById('services-section');
      const hqSec = document.getElementById('hq-tour-section');
      const destSec = document.getElementById('destinations');
      const statsSec = document.getElementById('stats-section');

      // 1. Stats Section ("Numbers That Speak For Themselves") — LAST active section for Earth!
      if (statsSec) {
        const rect = statsSec.getBoundingClientRect();

        // After Stats section scrolls out towards top (leaving viewport up):
        if (rect.bottom < vh * 0.4) {
          const fade = Math.max(0, rect.bottom / (vh * 0.4));
          data.opacity = fade;
          data.x = 0;
          data.y = isMobile ? 0.2 : 0;
          data.scale = isMobile ? 0.48 : 0.72;
          data.phase = 'stats';
          return;
        }

        // Inside Stats section:
        if (rect.top <= vh * 0.85 && rect.bottom >= 0) {
          data.x = 0;
          data.y = isMobile ? 0.2 : 0;
          data.scale = isMobile ? 0.48 : 0.75;
          data.opacity = 1.0;
          data.phase = 'stats';
          return;
        }
      }

      // 2. Destinations Section
      if (destSec) {
        const rect = destSec.getBoundingClientRect();
        if (rect.top <= vh * 0.85 && rect.bottom >= 0) {
          data.x = 0;
          data.y = isMobile ? 0.3 : 0.1;
          data.scale = isMobile ? 0.45 : 0.70;
          data.opacity = 0.85;
          data.phase = 'destinations';
          return;
        }
      }

      // 3. Global Offices (HQ Tour) Section
      if (hqSec) {
        const rect = hqSec.getBoundingClientRect();
        if (rect.top <= vh * 0.85 && rect.bottom >= 0) {
          data.x = isMobile ? 0 : -1.8;
          data.y = isMobile ? 0.58 : -0.35;
          data.scale = isMobile ? 0.48 : 0.78;
          data.opacity = isMobile ? 0.35 : 1.0;
          data.phase = 'hqtour';
          return;
        }
      }

      // 4. Services Section
      if (servicesSec) {
        const rect = servicesSec.getBoundingClientRect();
        if (rect.top <= vh * 0.85 && rect.bottom >= 0) {
          data.x = isMobile ? 0 : -1.8;
          data.y = isMobile ? 0.4 : -0.4;
          data.scale = isMobile ? 0.45 : 0.70;
          data.opacity = isMobile ? 0.25 : 0.85;
          data.phase = 'services';
          return;
        }
      }

      // 5. Hero Section (Default top position)
      data.x = isMobile ? 0 : 1.30;
      data.y = isMobile ? 0.65 : 0;
      data.scale = isMobile ? 0.58 : 1.05;
      data.opacity = isMobile ? 0.85 : 1.0;
      data.phase = 'hero';
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-10 pointer-events-none"
      style={{ willChange: 'transform' }}
    />
  );
};

export default EarthGlobe;
