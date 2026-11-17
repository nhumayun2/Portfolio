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

  // Root Black Hole & Wormhole System
  private cosmicGroup = new THREE.Group();

  // 1. Black Hole Singularity & Lensing Elements (Interstellar Gargantua Style)
  private blackHoleShadow!: THREE.Mesh;
  private innerPhotonRing!: THREE.Mesh;
  private topLensingHalo!: THREE.Mesh;
  private bottomLensingHalo!: THREE.Mesh;
  private horizontalDiskMesh!: THREE.Mesh;

  // 2. 3D Spacetime Funnel / Wormhole Grid (Einstein-Rosen Bridge)
  private wormholeFunnelGrid!: THREE.LineSegments;

  // 3. Relativistic Accretion Particle Streams
  private accretionParticles!: THREE.Points;
  private particleCount = 1100;
  private particleRadii!: Float32Array;
  private particleAngles!: Float32Array;
  private particleSpeeds!: Float32Array;
  private particleYOffsets!: Float32Array;

  // Mouse Parallax & Animation Timing
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildBlackHoleAndWormhole();
      this.setupObservers();
      this.animate();
    });
  }

  private initThree(): void {
    const container = this.canvasHost.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 8.5);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.cosmicGroup);

    // Position flanking the editorial bio on desktop
    const isDesktop = width >= 1024;
    this.cosmicGroup.position.set(isDesktop ? 2.6 : 0, isDesktop ? 0.1 : -0.7, -0.4);
    this.cosmicGroup.scale.set(0.95, 0.95, 0.95);
  }

  /**
   * Generates a procedural radial accretion texture for the disk
   */
  private createAccretionTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    const grad = ctx.createRadialGradient(cx, cy, size * 0.15, cx, cy, size * 0.5);
    grad.addColorStop(0.0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.12, 'rgba(255,255,255,1.0)');     // White-hot photon edge
    grad.addColorStop(0.22, 'rgba(132,204,22,0.95)');     // Intense Laser Lime
    grad.addColorStop(0.42, 'rgba(56,189,248,0.75)');     // Relativistic Electric Cyan
    grad.addColorStop(0.70, 'rgba(14,165,233,0.35)');     // Deep Cyan halo
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Add high-speed relativistic streak noise
    for (let r = 0; r < 240; r++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = size * (0.16 + Math.random() * 0.32);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255,255,255,0.45)' : 'rgba(132,204,22,0.55)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /**
   * Builds the Authentic Interstellar Black Hole + Curved Spacetime Wormhole Grid
   */
  private buildBlackHoleAndWormhole(): void {
    // 1. Scene Lighting
    const ambient = new THREE.AmbientLight(0x060810, 2.0);
    this.scene.add(ambient);

    const dirLightLime = new THREE.DirectionalLight(0x84cc16, 3.5);
    dirLightLime.position.set(5, 5, 4);
    this.scene.add(dirLightLime);

    const dirLightCyan = new THREE.DirectionalLight(0x38bdf8, 3.0);
    dirLightCyan.position.set(-5, -4, 3);
    this.scene.add(dirLightCyan);

    // 2. 3D Curved Spacetime Funnel / Wormhole Grid (Image 5 style)
    // A radial wireframe mesh bending downward into the black hole singularity
    const radialRings = 22;
    const angularSegs = 48;
    const maxRadius = 4.2;
    const minRadius = 1.15;

    const gridLines: number[] = [];

    // Generate concentric grid rings bending into Z
    for (let i = 0; i <= radialRings; i++) {
      const p = i / radialRings;
      const r = minRadius + p * (maxRadius - minRadius);
      // Spacetime curvature function: steep gravitational dip near minRadius
      const z = -2.8 * Math.pow(1 - p, 1.6);

      for (let j = 0; j < angularSegs; j++) {
        const a1 = (j / angularSegs) * Math.PI * 2;
        const a2 = ((j + 1) / angularSegs) * Math.PI * 2;

        gridLines.push(
          Math.cos(a1) * r, Math.sin(a1) * r, z,
          Math.cos(a2) * r, Math.sin(a2) * r, z
        );
      }
    }

    // Generate radial longitudinal spokes extending inward to the throat
    for (let j = 0; j < angularSegs; j += 2) {
      const a = (j / angularSegs) * Math.PI * 2;
      for (let i = 0; i < radialRings; i++) {
        const p1 = i / radialRings;
        const p2 = (i + 1) / radialRings;
        const r1 = minRadius + p1 * (maxRadius - minRadius);
        const r2 = minRadius + p2 * (maxRadius - minRadius);
        const z1 = -2.8 * Math.pow(1 - p1, 1.6);
        const z2 = -2.8 * Math.pow(1 - p2, 1.6);

        gridLines.push(
          Math.cos(a) * r1, Math.sin(a) * r1, z1,
          Math.cos(a) * r2, Math.sin(a) * r2, z2
        );
      }
    }

    const funnelGeo = new THREE.BufferGeometry();
    funnelGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridLines, 3));
    const funnelMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.wormholeFunnelGrid = new THREE.LineSegments(funnelGeo, funnelMat);
    this.wormholeFunnelGrid.rotation.x = Math.PI / 2.7;
    this.cosmicGroup.add(this.wormholeFunnelGrid);

    // 3. The Gargantua Accretion Disk (Horizontal Plane)
    const diskTexture = this.createAccretionTexture();
    const diskGeo = new THREE.PlaneGeometry(7.2, 7.2);
    const diskMat = new THREE.MeshBasicMaterial({
      map: diskTexture,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.horizontalDiskMesh = new THREE.Mesh(diskGeo, diskMat);
    this.horizontalDiskMesh.rotation.x = Math.PI / 2.7;
    this.cosmicGroup.add(this.horizontalDiskMesh);

    // 4. Gravitational Lensing Arcs (The Iconic Interstellar Gargantua Light Bending)
    // Light from behind the black hole is gravitationally bent into an upright vertical halo
    const lensRadius = 1.35;
    const lensTube = 0.045;
    const haloGeo = new THREE.TorusGeometry(lensRadius, lensTube, 20, 180);

    const haloMatTop = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    this.topLensingHalo = new THREE.Mesh(haloGeo, haloMatTop);
    // Tilted slightly backward behind the black hole to mirror general relativity lensing
    this.topLensingHalo.position.set(0, 0, -0.15);
    this.cosmicGroup.add(this.topLensingHalo);

    const haloMatBottom = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.bottomLensingHalo = new THREE.Mesh(haloGeo, haloMatBottom);
    this.bottomLensingHalo.scale.set(1.12, 1.12, 1.12);
    this.bottomLensingHalo.position.set(0, 0, -0.22);
    this.cosmicGroup.add(this.bottomLensingHalo);

    // 5. The Event Horizon Shadow (Pure Opaque Pitch-Black Void)
    // Must be 100% black silhouette with ZERO lighting or wireframe (blocks light behind it!)
    const shadowGeo = new THREE.SphereGeometry(1.18, 64, 64);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    this.blackHoleShadow = new THREE.Mesh(shadowGeo, shadowMat);
    // Positioned slightly in front of the lensing halo to occlude it properly
    this.blackHoleShadow.position.set(0, 0, 0.02);
    this.cosmicGroup.add(this.blackHoleShadow);

    // 6. White-Hot Photon Ring (Razor Edge at Event Horizon Boundary)
    const photonGeo = new THREE.TorusGeometry(1.2, 0.016, 16, 180);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.innerPhotonRing = new THREE.Mesh(photonGeo, photonMat);
    this.innerPhotonRing.position.set(0, 0, 0.05);
    this.cosmicGroup.add(this.innerPhotonRing);

    // 7. Swirling Relativistic Accretion Matter Particles (Keplerian Swirl)
    this.particleRadii = new Float32Array(this.particleCount);
    this.particleAngles = new Float32Array(this.particleCount);
    this.particleSpeeds = new Float32Array(this.particleCount);
    this.particleYOffsets = new Float32Array(this.particleCount);

    const pPositions = new Float32Array(this.particleCount * 3);
    const pColors = new Float32Array(this.particleCount * 3);

    const clrWhite = new THREE.Color(0xffffff);
    const clrLime = new THREE.Color(0x84cc16);
    const clrCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < this.particleCount; i++) {
      const u = Math.random();
      const r = 1.25 + Math.pow(u, 1.7) * 2.6;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 0.12 * (r * 0.6);

      this.particleRadii[i] = r;
      this.particleAngles[i] = angle;
      // Keplerian velocity v ~ 1 / sqrt(r)
      this.particleSpeeds[i] = (2.2 / Math.sqrt(r)) * (0.8 + Math.random() * 0.4);
      this.particleYOffsets[i] = yOffset;

      const pPos = this.calcDiskPosition(r, angle, yOffset);
      pPositions[i * 3] = pPos.x;
      pPositions[i * 3 + 1] = pPos.y;
      pPositions[i * 3 + 2] = pPos.z;

      // Color based on temperature / radius
      let clr = clrLime;
      if (r < 1.55) {
        clr = clrWhite;
      } else if (r > 2.4) {
        clr = clrCyan;
      }
      pColors[i * 3] = clr.r;
      pColors[i * 3 + 1] = clr.g;
      pColors[i * 3 + 2] = clr.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.034,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.accretionParticles = new THREE.Points(pGeo, pMat);
    this.cosmicGroup.add(this.accretionParticles);
  }

  /**
   * Helper to calculate 3D coordinates on the tilted accretion disk plane
   */
  private calcDiskPosition(radius: number, angle: number, yOffset: number): THREE.Vector3 {
    const lx = Math.cos(angle) * radius;
    const lz = Math.sin(angle) * radius;
    const ly = yOffset;

    const tilt = Math.PI / 2.7;
    const ty = ly * Math.cos(tilt) - lz * Math.sin(tilt);
    const tz = ly * Math.sin(tilt) + lz * Math.cos(tilt);

    return new THREE.Vector3(lx, ty, tz);
  }

  private setupObservers(): void {
    const el = this.canvasHost.nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.renderer || !this.camera) return;
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 600;

      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const isDesktop = w >= 1024;
      this.cosmicGroup.position.set(isDesktop ? 2.6 : 0, isDesktop ? 0.1 : -0.7, -0.4);
    });
    this.resizeObserver.observe(el);

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    this.intersectionObserver.observe(el);

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

    // Smooth Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    // Rotate Horizontal Accretion Disk
    if (this.horizontalDiskMesh) {
      this.horizontalDiskMesh.rotation.z += delta * 0.45;
    }

    // Rotate Spacetime Wormhole Grid Funnel
    if (this.wormholeFunnelGrid) {
      this.wormholeFunnelGrid.rotation.z += delta * 0.15;
    }

    // Dynamic Pulsing of Gravitational Lensing Halo
    if (this.topLensingHalo) {
      const haloScale = 1.0 + Math.sin(t * 2.2) * 0.025;
      this.topLensingHalo.scale.set(haloScale, haloScale, haloScale);
    }
    if (this.bottomLensingHalo) {
      const bScale = 1.12 + Math.cos(t * 1.8) * 0.03;
      this.bottomLensingHalo.scale.set(bScale, bScale, bScale);
    }

    // Swirling Accretion Particles with Keplerian Velocity
    if (this.accretionParticles) {
      const posAttr = this.accretionParticles.geometry.attributes['position'] as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < this.particleCount; i++) {
        this.particleAngles[i] += this.particleSpeeds[i] * delta * 0.9;

        // Inward gravitational pull towards the event horizon
        this.particleRadii[i] -= delta * 0.055;
        if (this.particleRadii[i] < 1.25) {
          this.particleRadii[i] = 3.8;
          this.particleSpeeds[i] = (2.2 / Math.sqrt(3.8)) * (0.8 + Math.random() * 0.4);
        }

        const p = this.calcDiskPosition(this.particleRadii[i], this.particleAngles[i], this.particleYOffsets[i]);
        posArray[i * 3] = p.x;
        posArray[i * 3 + 1] = p.y;
        posArray[i * 3 + 2] = p.z;
      }
      posAttr.needsUpdate = true;
    }

    // Overall Cosmic Group 3D Parallax Tilt (Responsive to mouse)
    if (this.cosmicGroup) {
      this.cosmicGroup.rotation.y = this.mouse.x * 0.28;
      this.cosmicGroup.rotation.x = this.mouse.y * 0.22;
      this.cosmicGroup.position.y = (window.innerWidth >= 1024 ? 0.1 : -0.7) + Math.sin(t * 1.4) * 0.04;
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
