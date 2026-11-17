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

  // Astrophysical Kerr Vortex Components
  private singularityVoid!: THREE.Mesh;
  private photonEdgeRing!: THREE.Mesh;
  private accretionDiskMesh!: THREE.Mesh;
  private vortexTexture!: THREE.CanvasTexture;

  // Relativistic Geodesic Streamlines
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
      this.buildAstrophysicalKerrVortex();
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
    this.camera.position.set(0, 0, 9.5);

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
    this.scene.add(this.vortexGroup);

    // Position strictly flanking the right side so it never collides with text
    const isDesktop = width >= 1024;
    this.vortexGroup.position.set(isDesktop ? 3.3 : 0, isDesktop ? 0.35 : -0.7, -0.6);
    this.vortexGroup.scale.set(0.78, 0.78, 0.78);
  }

  /**
   * Generates a high-res radial spiral accretion texture with glowing relativistic plasma arms
   */
  private createVortexTexture(): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // 1. Smooth radial glow gradient
    const baseGrad = ctx.createRadialGradient(cx, cy, size * 0.14, cx, cy, size * 0.48);
    baseGrad.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
    baseGrad.addColorStop(0.12, 'rgba(255, 255, 255, 1.0)');    // White-hot photon edge
    baseGrad.addColorStop(0.25, 'rgba(132, 204, 22, 0.85)');    // Laser Lime
    baseGrad.addColorStop(0.50, 'rgba(56, 189, 248, 0.65)');    // Electric Cyan
    baseGrad.addColorStop(0.80, 'rgba(14, 165, 233, 0.2)');     // Outer halo
    baseGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Swirling Logarithmic Spiral Arms
    const arms = 6;
    for (let a = 0; a < arms; a++) {
      const baseAngle = (a / arms) * Math.PI * 2;
      ctx.beginPath();

      for (let r = size * 0.14; r < size * 0.48; r += 2) {
        const theta = baseAngle + Math.log(r / (size * 0.14)) * 3.4;
        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;

        if (r === size * 0.14) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.strokeStyle = a % 2 === 0 ? 'rgba(132, 204, 22, 0.75)' : 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // Secondary fine glowing filaments
    for (let f = 0; f < 30; f++) {
      const startAngle = Math.random() * Math.PI * 2;
      ctx.beginPath();
      for (let r = size * 0.16; r < size * 0.46; r += 3) {
        const angle = startAngle + Math.log(r / (size * 0.16)) * 4.0;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (r === size * 0.16) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(132, 204, 22, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    this.vortexTexture = new THREE.CanvasTexture(canvas);
    this.vortexTexture.wrapS = THREE.RepeatWrapping;
    this.vortexTexture.wrapT = THREE.RepeatWrapping;
    return this.vortexTexture;
  }

  /**
   * Constructs the clean, authentic Astrophysical Rotating Kerr Black Hole & Vortex
   * No hula-hoop circles. No fake mountain cones. Just a pure, elegant rotating accretion whirlpool!
   */
  private buildAstrophysicalKerrVortex(): void {
    // 1. Lighting
    const ambient = new THREE.AmbientLight(0x060810, 2.0);
    this.scene.add(ambient);

    const lightLime = new THREE.DirectionalLight(0x84cc16, 3.2);
    lightLime.position.set(5, 5, 4);
    this.scene.add(lightLime);

    const lightCyan = new THREE.DirectionalLight(0x38bdf8, 2.8);
    lightCyan.position.set(-5, -4, 3);
    this.scene.add(lightCyan);

    // 2. The Rotating Accretion Disk (Luminous Spiral Plasma Plane)
    const tex = this.createVortexTexture();
    const diskGeo = new THREE.PlaneGeometry(6.4, 6.4);
    const diskMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.accretionDiskMesh = new THREE.Mesh(diskGeo, diskMat);
    // Tilted at a graceful 3D perspective angle
    this.accretionDiskMesh.rotation.x = Math.PI / 2.6;
    this.vortexGroup.add(this.accretionDiskMesh);

    // 3. Central Event Horizon Singularity (Pure Deep Black Hole Void)
    const voidGeo = new THREE.CircleGeometry(0.85, 64);
    const voidMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
    });
    this.singularityVoid = new THREE.Mesh(voidGeo, voidMat);
    this.singularityVoid.rotation.x = Math.PI / 2.6;
    // Sits slightly elevated in front of the disk to create the true event horizon silhouette
    this.singularityVoid.position.set(0, 0.02, 0);
    this.vortexGroup.add(this.singularityVoid);

    // 4. White-Hot Photon Edge Ring (Razor-sharp boundary where light is trapped)
    const photonGeo = new THREE.TorusGeometry(0.88, 0.022, 16, 120);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.photonEdgeRing = new THREE.Mesh(photonGeo, photonMat);
    this.photonEdgeRing.rotation.x = Math.PI / 2.6;
    this.photonEdgeRing.position.set(0, 0.03, 0);
    this.vortexGroup.add(this.photonEdgeRing);

    // 5. Relativistic Infalling Geodesic Streamlines
    this.vortexGroup.add(this.streamlinesGroup);
    this.streamlinesGroup.rotation.x = Math.PI / 2.6;

    const streamCount = 8;
    const beadGeo = new THREE.SphereGeometry(0.035, 12, 12);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let s = 0; s < streamCount; s++) {
      const baseTheta = (s / streamCount) * Math.PI * 2;
      const curvePoints: THREE.Vector3[] = [];

      const rStart = 3.1;
      const rEnd = 0.92;
      const steps = 30;

      for (let k = 0; k <= steps; k++) {
        const f = k / steps;
        const r = rStart - f * (rStart - rEnd);
        const theta = baseTheta + Math.log(rStart / r) * 3.2;

        curvePoints.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0.015));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.01, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: s % 2 === 0 ? 0x84cc16 : 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.streamlinesGroup.add(tubeMesh);

      // Infalling photon bead
      const bead = new THREE.Mesh(beadGeo, beadMat);
      this.streamlinesGroup.add(bead);
      this.pulseBeads.push({
        mesh: bead,
        curve: curve,
        offset: Math.random(),
        speed: 0.35 + Math.random() * 0.25,
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
      this.vortexGroup.position.set(isDesktop ? 3.3 : 0, isDesktop ? 0.35 : -0.7, -0.6);
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

    // Smooth Mouse Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Smooth Relativistic Accretion Spin (The Rotating Hole with Bright Color)
    if (this.accretionDiskMesh) {
      this.accretionDiskMesh.rotation.z += delta * 0.45;
    }

    // Photon Edge Pulse
    if (this.photonEdgeRing) {
      const pulse = 1.0 + Math.sin(t * 3.0) * 0.04;
      this.photonEdgeRing.scale.set(pulse, pulse, pulse);
    }

    // Rotate Streamlines & Animate Infalling Energy Pulses
    if (this.streamlinesGroup) {
      this.streamlinesGroup.rotation.z += delta * 0.35;
    }

    for (const item of this.pulseBeads) {
      item.offset = (item.offset + delta * item.speed) % 1;
      const pt = item.curve.getPointAt(item.offset);
      item.mesh.position.copy(pt);
      // Particle accelerates and shrinks as it reaches the event horizon
      const s = 1.1 * (1 - item.offset * 0.45);
      item.mesh.scale.set(s, s, s);
    }

    // Overall 3D Parallax Tilt (Natural Spatial Depth)
    if (this.vortexGroup) {
      this.vortexGroup.rotation.y = this.mouse.x * 0.25;
      this.vortexGroup.rotation.x = this.mouse.y * 0.18;
      // Gentle floating hover
      this.vortexGroup.position.y = (window.innerWidth >= 1024 ? 0.35 : -0.7) + Math.sin(t * 1.5) * 0.04;
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
