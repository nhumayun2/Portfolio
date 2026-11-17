import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-about-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #canvasHost
      class="canvas-host absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
    ></div>
  `,
  styles: [`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    }
    .canvas-host {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `],
})
export class AboutCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasHost') canvasHost!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private isVisible = true;

  // Root 3D Container
  private helixGroup = new THREE.Group();

  // Mesh References
  private strand1Mesh!: THREE.Mesh;
  private strand2Mesh!: THREE.Mesh;
  private rungsGroup = new THREE.Group();
  private haloRing1!: THREE.Mesh;
  private haloRing2!: THREE.Mesh;
  private particlePoints!: THREE.Points;

  // Mouse & Parallax
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildCyberHelix();
      this.setupObservers();
      this.animate();
    });
  }

  private initThree(): void {
    const container = this.canvasHost.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 8.5);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.helixGroup);

    // Position on desktop: elevated and flanking the right editorial text
    const isDesktop = width >= 1024;
    this.helixGroup.position.set(isDesktop ? 2.8 : 0, isDesktop ? 0.2 : -0.8, -0.5);
    this.helixGroup.scale.set(0.9, 0.9, 0.9);
  }

  /**
   * Builds the Unique 3D Cybernetic Double Helix ("The Code DNA")
   * Smooth, organic, edge-free curves with glowing laser logic-gate rungs.
   */
  private buildCyberHelix(): void {
    // 1. Art-Directed Lighting
    const ambient = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0x84cc16, 3.5);
    dirLight1.position.set(4, 5, 4);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 3.0);
    dirLight2.position.set(-5, -4, 3);
    this.scene.add(dirLight2);

    // 2. Generate Smooth Intertwined Dual Helices
    const turns = 3.2;
    const height = 5.2;
    const radius = 1.05;
    const steps = 140;

    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const angle = p * Math.PI * 2 * turns;
      const y = (p - 0.5) * height;

      // Strand 1 (Laser Lime Lead)
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      strand1Points.push(new THREE.Vector3(x1, y, z1));

      // Strand 2 (Electric Cyan Counterpart, offset by 180 deg)
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      strand2Points.push(new THREE.Vector3(x2, y, z2));
    }

    const curve1 = new THREE.CatmullRomCurve3(strand1Points);
    const curve2 = new THREE.CatmullRomCurve3(strand2Points);

    // High-resolution smooth tube geometries (160 tubular segments for 100% curve continuity)
    const tubeGeo1 = new THREE.TubeGeometry(curve1, 160, 0.055, 20, false);
    const tubeGeo2 = new THREE.TubeGeometry(curve2, 160, 0.055, 20, false);

    const matStrand1 = new THREE.MeshPhysicalMaterial({
      color: 0x84cc16,
      emissive: 0x4d7c0f,
      emissiveIntensity: 0.65,
      metalness: 0.9,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
    });

    const matStrand2 = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      metalness: 0.9,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 1.0,
    });

    this.strand1Mesh = new THREE.Mesh(tubeGeo1, matStrand1);
    this.strand2Mesh = new THREE.Mesh(tubeGeo2, matStrand2);
    this.helixGroup.add(this.strand1Mesh);
    this.helixGroup.add(this.strand2Mesh);

    // 3. Horizontal Logic Gate Connector Rungs (Base Pairs)
    this.helixGroup.add(this.rungsGroup);
    const rungCount = 28;
    const rungGeo = new THREE.CylinderGeometry(0.016, 0.016, 1, 12);
    const beadGeo = new THREE.SphereGeometry(0.045, 12, 12);

    const rungMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });

    const beadMatLime = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
    const beadMatCyan = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let r = 0; r < rungCount; r++) {
      const p = (r + 0.5) / rungCount;
      const pt1 = curve1.getPointAt(p);
      const pt2 = curve2.getPointAt(p);

      const mid = new THREE.Vector3().addVectors(pt1, pt2).multiplyScalar(0.5);
      const dist = pt1.distanceTo(pt2);

      const rungMesh = new THREE.Mesh(rungGeo, rungMat);
      rungMesh.position.copy(mid);
      rungMesh.scale.set(1, dist, 1);
      rungMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3().subVectors(pt2, pt1).normalize()
      );
      this.rungsGroup.add(rungMesh);

      // Junction beads
      const bead1 = new THREE.Mesh(beadGeo, beadMatLime);
      bead1.position.copy(pt1);
      this.rungsGroup.add(bead1);

      const bead2 = new THREE.Mesh(beadGeo, beadMatCyan);
      bead2.position.copy(pt2);
      this.rungsGroup.add(bead2);
    }

    // 4. Smooth Gyroscopic Coordinate Halo Rings
    const ringGeo1 = new THREE.TorusGeometry(2.1, 0.014, 16, 120);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.5,
      metalness: 0.95,
      roughness: 0.1,
      transparent: true,
      opacity: 0.65,
    });
    this.haloRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.haloRing1.rotation.x = Math.PI / 2.8;
    this.haloRing1.rotation.y = Math.PI / 6;
    this.helixGroup.add(this.haloRing1);

    const ringGeo2 = new THREE.TorusGeometry(2.45, 0.01, 16, 140);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.4,
      metalness: 0.95,
      roughness: 0.1,
      transparent: true,
      opacity: 0.5,
    });
    this.haloRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.haloRing2.rotation.x = -Math.PI / 3.4;
    this.haloRing2.rotation.z = Math.PI / 4;
    this.helixGroup.add(this.haloRing2);

    // 5. Ambient Quantum Sparks Field
    const pCount = 280;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    const clrLime = new THREE.Color(0x84cc16);
    const clrCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const rad = 1.2 + Math.random() * 2.2;
      const y = (Math.random() - 0.5) * 6.0;

      pPositions[i * 3] = Math.cos(theta) * rad;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = Math.sin(theta) * rad;

      const clr = Math.random() > 0.5 ? clrLime : clrCyan;
      pColors[i * 3] = clr.r;
      pColors[i * 3 + 1] = clr.g;
      pColors[i * 3 + 2] = clr.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.particlePoints = new THREE.Points(pGeo, pMat);
    this.helixGroup.add(this.particlePoints);
  }

  private setupObservers(): void {
    const el = this.canvasHost.nativeElement;

    // Window Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 600;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const isDesktop = w >= 1024;
      this.helixGroup.position.set(isDesktop ? 2.8 : 0, isDesktop ? 0.2 : -0.8, -0.5);
    });
    this.resizeObserver.observe(el);

    // Performance Intersection Observer (halting off-screen render loops)
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    this.intersectionObserver.observe(el);

    // Mouse movement parallax
    window.addEventListener('mousemove', (e: MouseEvent) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  private animate = (currentTime = 0): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (!this.isVisible) return;

    if (!this.startTime) {
      this.startTime = currentTime;
      this.lastTime = currentTime;
    }
    const delta = Math.min((currentTime - this.lastTime) * 0.001, 0.1);
    this.lastTime = currentTime;
    const t = (currentTime - this.startTime) * 0.001;

    // Smooth Mouse Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Organic Continuous Rotation & Undulation
    if (this.helixGroup) {
      this.helixGroup.rotation.y = t * 0.45;
      this.helixGroup.rotation.x = Math.sin(t * 0.6) * 0.15 + this.mouse.y * 0.3;
      this.helixGroup.rotation.z = Math.cos(t * 0.5) * 0.1 + this.mouse.x * 0.25;

      // Gentle vertical hover breathing
      this.helixGroup.position.y += (Math.sin(t * 1.5) * 0.08 - (this.helixGroup.position.y - 0.2)) * 0.05;
    }

    // Counter-Rotating Halo Rings
    if (this.haloRing1) {
      this.haloRing1.rotation.z += delta * 0.35;
    }
    if (this.haloRing2) {
      this.haloRing2.rotation.z -= delta * 0.25;
    }

    // Particle Swarm Orbit
    if (this.particlePoints) {
      this.particlePoints.rotation.y = -t * 0.15;
    }

    this.renderer.render(this.scene, this.camera);
  };

  ngOnDestroy(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
