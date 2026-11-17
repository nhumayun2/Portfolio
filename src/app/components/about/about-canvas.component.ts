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
  private vortexGroup = new THREE.Group();

  // Astrophysical Kerr Wormhole & Gravitational Well Meshes
  private funnelMesh!: THREE.Mesh;
  private funnelWireframe!: THREE.Mesh;
  private throatGlowMesh!: THREE.Mesh;
  private outerErgosphereRing!: THREE.Mesh;
  private photonOrbitRing!: THREE.Mesh;
  private vortexTexture!: THREE.CanvasTexture;

  // Frame-Dragging Geodesic Streamlines
  private streamlinesGroup = new THREE.Group();
  private pulseBeads: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; offset: number; speed: number }[] = [];

  // Mouse Parallax & Timing
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildAstrophysicalVortex();
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
    this.camera.position.set(0, 0, 9.2);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.vortexGroup);

    // Position flanking the right editorial text on desktop
    const isDesktop = width >= 1024;
    this.vortexGroup.position.set(isDesktop ? 2.5 : 0, isDesktop ? 0.05 : -0.7, -0.2);
    this.vortexGroup.scale.set(0.92, 0.92, 0.92);
  }

  /**
   * Generates a high-resolution, procedural relativistic spiral vortex texture.
   * Features glowing logarithmic spiral plasma arms that swirl into the throat.
   */
  private createRelativisticVortexTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    // Dark transparent base
    ctx.clearRect(0, 0, size, size);

    // 1. Radial Energy Gradient (Core throat intense white, mid-lime, outer cyan)
    const baseGrad = ctx.createRadialGradient(cx, cy, size * 0.08, cx, cy, size * 0.48);
    baseGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');     // White-hot throat
    baseGrad.addColorStop(0.15, 'rgba(132, 204, 22, 0.95)');    // Laser Lime
    baseGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.75)');    // Electric Cyan
    baseGrad.addColorStop(0.65, 'rgba(2, 132, 199, 0.35)');     // Relativistic Blue
    baseGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');             // Edge fade

    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. High-speed Logarithmic Spiral Accretion Arms
    const armCount = 6;
    for (let arm = 0; arm < armCount; arm++) {
      const baseAngle = (arm / armCount) * Math.PI * 2;
      ctx.beginPath();

      for (let r = size * 0.08; r < size * 0.48; r += 2) {
        // Logarithmic spiral formula: theta = theta0 + b * ln(r)
        const angle = baseAngle + Math.log(r / (size * 0.08)) * 3.2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        if (r === size * 0.08) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = arm % 2 === 0 ? 'rgba(132, 204, 22, 0.85)' : 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Secondary finer energetic filaments
    for (let f = 0; f < 36; f++) {
      const startAngle = Math.random() * Math.PI * 2;
      ctx.beginPath();
      for (let r = size * 0.12; r < size * 0.45; r += 4) {
        const angle = startAngle + Math.log(r / (size * 0.12)) * 3.8;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (r === size * 0.12) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(132, 204, 22, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    this.vortexTexture = new THREE.CanvasTexture(canvas);
    this.vortexTexture.wrapS = THREE.RepeatWrapping;
    this.vortexTexture.wrapT = THREE.RepeatWrapping;
    return this.vortexTexture;
  }

  /**
   * Constructs the authentic Astrophysical Wormhole / Kerr Gravitational Funnel
   * Uses real relativistic physics:
   * 1. Flamm's Paraboloid geometry (true embedding of curved spacetime)
   * 2. Glowing accretion vortex surface with spinning plasma arms
   * 3. Lense-Thirring Frame-Dragging geodesic streamlines
   * 4. Throat Cherenkov radiation core
   */
  private buildAstrophysicalVortex(): void {
    // 1. Lighting
    const ambient = new THREE.AmbientLight(0x060810, 2.0);
    this.scene.add(ambient);

    const lightLime = new THREE.DirectionalLight(0x84cc16, 3.5);
    lightLime.position.set(5, 5, 4);
    this.scene.add(lightLime);

    const lightCyan = new THREE.DirectionalLight(0x38bdf8, 3.0);
    lightCyan.position.set(-5, -4, 3);
    this.scene.add(lightCyan);

    // 2. Continuous 3D Gravitational Funnel Geometry (Flamm's Paraboloid Well)
    const radialRings = 36;
    const angularSegs = 64;
    const rThroat = 0.55;
    const rOuter = 3.6;

    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= radialRings; i++) {
      const p = i / radialRings;
      // Exponential radial spread for dense detail near the throat
      const r = rThroat + Math.pow(p, 1.4) * (rOuter - rThroat);
      // Relativistic well: sharp gravitational descent into deep Z
      const z = -3.2 * (1.0 / (Math.pow(r / rThroat, 0.95)) - 1.0 / Math.pow(rOuter / rThroat, 0.95));

      for (let j = 0; j <= angularSegs; j++) {
        const u = j / angularSegs;
        const theta = u * Math.PI * 2;

        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;

        vertices.push(x, y, z);
        uvs.push(u, p);
      }
    }

    // Build triangle faces
    for (let i = 0; i < radialRings; i++) {
      for (let j = 0; j < angularSegs; j++) {
        const a = i * (angularSegs + 1) + j;
        const b = a + (angularSegs + 1);
        const c = a + 1;
        const d = b + 1;

        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }

    const funnelGeo = new THREE.BufferGeometry();
    funnelGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    funnelGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    funnelGeo.setIndex(indices);
    funnelGeo.computeVertexNormals();

    const vortexTex = this.createRelativisticVortexTexture();

    // Luminous Accretion Plasma Surface
    const funnelMat = new THREE.MeshBasicMaterial({
      map: vortexTex,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.funnelMesh = new THREE.Mesh(funnelGeo, funnelMat);
    this.funnelMesh.rotation.x = Math.PI / 2.8;
    this.vortexGroup.add(this.funnelMesh);

    // Subtle Spacetime Coordinate Wireframe Overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
    });
    this.funnelWireframe = new THREE.Mesh(funnelGeo, wireMat);
    this.funnelWireframe.rotation.x = Math.PI / 2.8;
    this.funnelWireframe.scale.set(1.002, 1.002, 1.002);
    this.vortexGroup.add(this.funnelWireframe);

    // 3. Wormhole Throat Exit / Singularity Ring
    // A radiant white-hot ring located at the deepest constriction of the throat
    const throatGeo = new THREE.TorusGeometry(0.58, 0.045, 16, 80);
    const throatMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.throatGlowMesh = new THREE.Mesh(throatGeo, throatMat);
    this.throatGlowMesh.rotation.x = Math.PI / 2.8;
    // Positioned deep at the throat vertex
    this.throatGlowMesh.position.set(0, 0, -2.6);
    this.vortexGroup.add(this.throatGlowMesh);

    // 4. Outer Relativistic Ergosphere Ring
    const outerRingGeo = new THREE.TorusGeometry(3.62, 0.018, 16, 160);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.7,
      metalness: 0.95,
      roughness: 0.1,
    });
    this.outerErgosphereRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.outerErgosphereRing.rotation.x = Math.PI / 2.8;
    this.vortexGroup.add(this.outerErgosphereRing);

    // 5. High-Energy Photon Orbit Ring
    const photonRingGeo = new THREE.TorusGeometry(1.4, 0.024, 16, 120);
    const photonRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.photonOrbitRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    this.photonOrbitRing.rotation.x = Math.PI / 2.8;
    this.photonOrbitRing.position.set(0, 0, -0.6);
    this.vortexGroup.add(this.photonOrbitRing);

    // 6. Frame-Dragging Geodesic Streamlines with Infalling Energy Pulses
    this.vortexGroup.add(this.streamlinesGroup);
    this.streamlinesGroup.rotation.x = Math.PI / 2.8;

    const streamCount = 8;
    const beadGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let s = 0; s < streamCount; s++) {
      const baseTheta = (s / streamCount) * Math.PI * 2;
      const curvePoints: THREE.Vector3[] = [];

      // Create a smooth spiral trajectory curving from rOuter down into rThroat
      const steps = 36;
      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const r = rOuter - f * (rOuter - rThroat);
        const theta = baseTheta + Math.log((rOuter - rThroat * 0.8) / (r - rThroat * 0.5 + 0.1)) * 2.8;
        const z = -3.2 * (1.0 / Math.pow(r / rThroat, 0.95) - 1.0 / Math.pow(rOuter / rThroat, 0.95));

        curvePoints.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.012, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: s % 2 === 0 ? 0x84cc16 : 0x38bdf8,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.streamlinesGroup.add(tubeMesh);

      // Infalling energy pulse bead
      const bead = new THREE.Mesh(beadGeo, beadMat);
      this.streamlinesGroup.add(bead);
      this.pulseBeads.push({
        mesh: bead,
        curve: curve,
        offset: Math.random(),
        speed: 0.25 + Math.random() * 0.2,
      });
    }
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
      this.vortexGroup.position.set(isDesktop ? 2.5 : 0, isDesktop ? 0.05 : -0.7, -0.2);
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
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Continuous Relativistic Plasma Rotation (Rotating Hole with Bright Color)
    if (this.vortexTexture) {
      // Texture offset rotation creates high-speed swirling motion into the hole
      this.vortexTexture.offset.x = (t * 0.12) % 1;
    }

    if (this.funnelMesh) {
      this.funnelMesh.rotation.z += delta * 0.45;
    }
    if (this.funnelWireframe) {
      this.funnelWireframe.rotation.z += delta * 0.45;
    }

    // Throat Cherenkov Pulse
    if (this.throatGlowMesh) {
      const pulse = 1.0 + Math.sin(t * 3.5) * 0.08;
      this.throatGlowMesh.scale.set(pulse, pulse, pulse);
    }

    // High-Energy Photon Orbit Rotation
    if (this.photonOrbitRing) {
      this.photonOrbitRing.rotation.z -= delta * 0.65;
    }

    // Outer Ergosphere Rotation
    if (this.outerErgosphereRing) {
      this.outerErgosphereRing.rotation.z += delta * 0.2;
    }

    // Rotate Streamlines & Animate Infalling Energy Pulses
    if (this.streamlinesGroup) {
      this.streamlinesGroup.rotation.z += delta * 0.35;
    }

    for (const item of this.pulseBeads) {
      item.offset = (item.offset + delta * item.speed) % 1;
      const pt = item.curve.getPointAt(item.offset);
      item.mesh.position.copy(pt);
      // Particle accelerates and shrinks as it nears the throat
      const s = 1.2 * (1 - item.offset * 0.5);
      item.mesh.scale.set(s, s, s);
    }

    // Dynamic 3D Parallax Tilt (Natural Gravitational Depth)
    if (this.vortexGroup) {
      this.vortexGroup.rotation.y = this.mouse.x * 0.32;
      this.vortexGroup.rotation.x = this.mouse.y * 0.24;
      // Gentle floating hover
      this.vortexGroup.position.y = (window.innerWidth >= 1024 ? 0.05 : -0.7) + Math.sin(t * 1.5) * 0.05;
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
    if (this.vortexTexture) {
      this.vortexTexture.dispose();
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
