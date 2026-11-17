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
  private blackHoleGroup = new THREE.Group();

  // Black Hole & Wormhole Components
  private eventHorizonMesh!: THREE.Mesh;
  private photonSphereMesh!: THREE.Mesh;
  private lensingRingVertical!: THREE.Mesh;
  private accretionRingInner!: THREE.Mesh;
  private accretionRingMid!: THREE.Mesh;
  private accretionRingOuter!: THREE.Mesh;
  private wormholeThroatGroup = new THREE.Group();
  private accretionParticles!: THREE.Points;
  private jetParticles!: THREE.Points;

  // Particle Physics Data for Relativistic Keplarian Swirl
  private particleCount = 850;
  private particleRadii!: Float32Array;
  private particleAngles!: Float32Array;
  private particleSpeeds!: Float32Array;
  private particleYOffsets!: Float32Array;

  // Mouse & Parallax
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildBlackHoleWormhole();
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
    this.camera.position.set(0, 0, 8.2);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.blackHoleGroup);

    // Flank the right side on desktop, aligned with the editorial bio
    const isDesktop = width >= 1024;
    this.blackHoleGroup.position.set(isDesktop ? 2.7 : 0, isDesktop ? 0.1 : -0.7, -0.6);
    this.blackHoleGroup.scale.set(1.0, 1.0, 1.0);
  }

  /**
   * Constructs an Authentic 3D Relativistic Black Hole & Wormhole System
   * Features:
   * 1. The Event Horizon (Pitch-black light-absorbing singularity)
   * 2. Luminous Accretion Disk with Keplerian orbital speeds
   * 3. Einstein Gravitational Lensing Rings (Gargantua curved light arc)
   * 4. Wormhole Conical Funnel Throat extending into deep space
   * 5. Relativistic Polar Jet particle streams
   */
  private buildBlackHoleWormhole(): void {
    // 1. Art-Directed Ambient & Rim Lighting
    const ambient = new THREE.AmbientLight(0x060810, 2.0);
    this.scene.add(ambient);

    const keyLime = new THREE.DirectionalLight(0x84cc16, 3.8);
    keyLime.position.set(5, 4, 3);
    this.scene.add(keyLime);

    const fillCyan = new THREE.DirectionalLight(0x38bdf8, 3.2);
    fillCyan.position.set(-5, -4, 3);
    this.scene.add(fillCyan);

    // 2. The Event Horizon (The Pitch Black Singularity)
    // 100% light-absorbing center with zero light escape
    const horizonGeo = new THREE.SphereGeometry(0.96, 64, 64);
    const horizonMat = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      emissive: 0x000000,
      roughness: 0.05,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
    });
    this.eventHorizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    this.blackHoleGroup.add(this.eventHorizonMesh);

    // 3. Photon Sphere Halo (The Edge of Light)
    const photonGeo = new THREE.SphereGeometry(1.04, 48, 48);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.22,
      wireframe: true,
    });
    this.photonSphereMesh = new THREE.Mesh(photonGeo, photonMat);
    this.blackHoleGroup.add(this.photonSphereMesh);

    // 4. Einstein Gravitational Lensing Ring (Vertical Arc Wrapping Over Singularity)
    const lensingGeo = new THREE.TorusGeometry(1.36, 0.022, 16, 140);
    const lensingMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.75,
    });
    this.lensingRingVertical = new THREE.Mesh(lensingGeo, lensingMat);
    this.lensingRingVertical.rotation.y = Math.PI / 2;
    this.lensingRingVertical.rotation.z = Math.PI / 8;
    this.blackHoleGroup.add(this.lensingRingVertical);

    // 5. Equatorial Relativistic Accretion Disk Rings
    // Inner Super-Heated Accretion Band (Laser Lime)
    const ringGeo1 = new THREE.TorusGeometry(1.68, 0.038, 16, 160);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.8,
      metalness: 0.95,
      roughness: 0.1,
    });
    this.accretionRingInner = new THREE.Mesh(ringGeo1, ringMat1);
    this.accretionRingInner.rotation.x = Math.PI / 2.5;
    this.blackHoleGroup.add(this.accretionRingInner);

    // Middle Accretion Transition Band (Electric Cyan)
    const ringGeo2 = new THREE.TorusGeometry(2.18, 0.024, 16, 180);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
      metalness: 0.95,
      roughness: 0.12,
    });
    this.accretionRingMid = new THREE.Mesh(ringGeo2, ringMat2);
    this.accretionRingMid.rotation.x = Math.PI / 2.5;
    this.blackHoleGroup.add(this.accretionRingMid);

    // Outer Ergosphere Orbit Ring (Platinum Silver)
    const ringGeo3 = new THREE.TorusGeometry(2.72, 0.014, 16, 200);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.45,
    });
    this.accretionRingOuter = new THREE.Mesh(ringGeo3, ringMat3);
    this.accretionRingOuter.rotation.x = Math.PI / 2.5;
    this.blackHoleGroup.add(this.accretionRingOuter);

    // 6. Wormhole Throat Funnel (Hyperspace Gateway extending into depth)
    this.blackHoleGroup.add(this.wormholeThroatGroup);
    const funnelRingCount = 14;
    for (let f = 0; f < funnelRingCount; f++) {
      const p = f / funnelRingCount;
      const fRadius = 1.05 + Math.pow(p, 1.8) * 1.8;
      const fZ = -Math.pow(p, 1.3) * 3.5;
      const fGeo = new THREE.TorusGeometry(fRadius, 0.008, 12, 100);
      const fMat = new THREE.MeshBasicMaterial({
        color: f % 2 === 0 ? 0x84cc16 : 0x38bdf8,
        transparent: true,
        opacity: Math.max(0.08, 0.45 * (1 - p * 0.7)),
      });
      const fMesh = new THREE.Mesh(fGeo, fMat);
      fMesh.position.set(0, 0, fZ);
      fMesh.rotation.x = Math.PI / 2.5;
      this.wormholeThroatGroup.add(fMesh);
    }

    // 7. Relativistic Accretion Particle Swirl (Keplerian Vortex)
    this.particleRadii = new Float32Array(this.particleCount);
    this.particleAngles = new Float32Array(this.particleCount);
    this.particleSpeeds = new Float32Array(this.particleCount);
    this.particleYOffsets = new Float32Array(this.particleCount);

    const pPositions = new Float32Array(this.particleCount * 3);
    const pColors = new Float32Array(this.particleCount * 3);

    const clrLime = new THREE.Color(0x84cc16);
    const clrCyan = new THREE.Color(0x38bdf8);
    const clrWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < this.particleCount; i++) {
      // Accretion disk radial distribution from 1.05 to 3.2
      const u = Math.random();
      const r = 1.05 + Math.pow(u, 1.6) * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 0.18 * (r * 0.5);

      this.particleRadii[i] = r;
      this.particleAngles[i] = angle;
      // Keplerian orbital speed: v ~ 1 / sqrt(r)
      this.particleSpeeds[i] = (1.8 / Math.sqrt(r)) * (0.85 + Math.random() * 0.3);
      this.particleYOffsets[i] = yOffset;

      const pPos = this.calcAccretionPos(r, angle, yOffset);
      pPositions[i * 3] = pPos.x;
      pPositions[i * 3 + 1] = pPos.y;
      pPositions[i * 3 + 2] = pPos.z;

      // Color gradation: white hot near event horizon, transitioning to lime and cyan
      let clr = clrLime;
      if (r < 1.35) {
        clr = clrWhite;
      } else if (r > 2.2) {
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
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.accretionParticles = new THREE.Points(pGeo, pMat);
    this.blackHoleGroup.add(this.accretionParticles);

    // 8. Relativistic Polar Jet Conduit (Wormhole Energy Beams)
    const jetCount = 140;
    const jetGeo = new THREE.BufferGeometry();
    const jetPos = new Float32Array(jetCount * 3);
    const jetCol = new Float32Array(jetCount * 3);
    for (let j = 0; j < jetCount; j++) {
      const sign = j % 2 === 0 ? 1 : -1;
      const dist = 1.0 + Math.random() * 3.5;
      const spread = (dist * 0.08) * (Math.random() - 0.5);
      jetPos[j * 3] = spread;
      jetPos[j * 3 + 1] = sign * dist;
      jetPos[j * 3 + 2] = spread;

      jetCol[j * 3] = 0.52;
      jetCol[j * 3 + 1] = 0.8;
      jetCol[j * 3 + 2] = 0.08;
    }
    jetGeo.setAttribute('position', new THREE.BufferAttribute(jetPos, 3));
    jetGeo.setAttribute('color', new THREE.BufferAttribute(jetCol, 3));
    const jetMat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    this.jetParticles = new THREE.Points(jetGeo, jetMat);
    this.jetParticles.rotation.x = Math.PI / 2.5 - Math.PI / 2;
    this.blackHoleGroup.add(this.jetParticles);
  }

  /**
   * Calculates 3D cartesian coordinates on the tilted accretion plane
   */
  private calcAccretionPos(radius: number, angle: number, yOffset: number): THREE.Vector3 {
    // Unrotated flat disk
    const localX = Math.cos(angle) * radius;
    const localZ = Math.sin(angle) * radius;
    const localY = yOffset;

    // Apply tilt matrix (rotation about X by ~Math.PI / 2.5)
    const tilt = Math.PI / 2.5;
    const tiltedY = localY * Math.cos(tilt) - localZ * Math.sin(tilt);
    const tiltedZ = localY * Math.sin(tilt) + localZ * Math.cos(tilt);

    return new THREE.Vector3(localX, tiltedY, tiltedZ);
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
      this.blackHoleGroup.position.set(isDesktop ? 2.7 : 0, isDesktop ? 0.1 : -0.7, -0.6);
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
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    // Relativistic Accretion Ring Spins
    if (this.accretionRingInner) {
      this.accretionRingInner.rotation.z += delta * 0.65;
    }
    if (this.accretionRingMid) {
      this.accretionRingMid.rotation.z += delta * 0.38;
    }
    if (this.accretionRingOuter) {
      this.accretionRingOuter.rotation.z += delta * 0.22;
    }

    // Einstein Lensing Ring Precession
    if (this.lensingRingVertical) {
      this.lensingRingVertical.rotation.z = Math.PI / 8 + Math.sin(t * 0.8) * 0.08;
    }

    // Wormhole Funnel Vortex Rotation
    if (this.wormholeThroatGroup) {
      this.wormholeThroatGroup.rotation.z -= delta * 0.35;
    }

    // Swirling Accretion Particles with Keplerian Speeds
    if (this.accretionParticles) {
      const posAttr = this.accretionParticles.geometry.attributes['position'] as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < this.particleCount; i++) {
        // Increment angle by speed
        this.particleAngles[i] += this.particleSpeeds[i] * delta * 0.85;

        // Subtle inward gravitational pull & respawn at outer boundary
        this.particleRadii[i] -= delta * 0.035;
        if (this.particleRadii[i] < 1.05) {
          this.particleRadii[i] = 3.25;
          this.particleSpeeds[i] = (1.8 / Math.sqrt(3.25)) * (0.85 + Math.random() * 0.3);
        }

        const p = this.calcAccretionPos(this.particleRadii[i], this.particleAngles[i], this.particleYOffsets[i]);
        posArray[i * 3] = p.x;
        posArray[i * 3 + 1] = p.y;
        posArray[i * 3 + 2] = p.z;
      }
      posAttr.needsUpdate = true;
    }

    // Relativistic Polar Jet Pulsing
    if (this.jetParticles) {
      this.jetParticles.rotation.y += delta * 0.45;
    }

    // Overall Parallax & Gyroscopic Swivel
    if (this.blackHoleGroup) {
      this.blackHoleGroup.rotation.y = this.mouse.x * 0.35;
      this.blackHoleGroup.rotation.x = this.mouse.y * 0.25;
      // Gentle gravitational breathing
      this.blackHoleGroup.position.y = (window.innerWidth >= 1024 ? 0.1 : -0.7) + Math.sin(t * 1.2) * 0.06;
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
