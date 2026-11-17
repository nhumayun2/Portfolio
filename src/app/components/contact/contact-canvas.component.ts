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
  selector: 'app-contact-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #canvasHost
      class="canvas-host absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing select-none overflow-hidden"
      title="Click and drag to rotate the geospatial 3D transmission globe."
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
export class ContactCanvasComponent implements AfterViewInit, OnDestroy {
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

  // Globe Objects
  private globeGroup = new THREE.Group();
  private globeSphere!: THREE.Mesh;
  private beaconMarker!: THREE.Mesh;
  private pingWaveRing!: THREE.Mesh;
  private latLongRings: THREE.LineLoop[] = [];

  // Drag Physics
  private isPointerDown = false;
  private pointerStart = { x: 0, y: 0 };
  private dragRotation = { x: 0, y: 0 };
  private dragVelocity = { x: 0, y: 0 };

  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildGlobeWorld();
      this.setupEvents();
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
    this.camera.position.set(0, 0, 7.8);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.globeGroup);

    const isDesktop = width >= 1024;
    this.globeGroup.position.set(isDesktop ? 2.4 : 0, isDesktop ? 0.2 : -0.6, 0);
  }

  private buildGlobeWorld(): void {
    const ambient = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0x84cc16, 2.5);
    dirLight1.position.set(5, 5, 5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight2.position.set(-5, -4, 4);
    this.scene.add(dirLight2);

    // 1. Wireframe Globe Sphere
    const sphereGeo = new THREE.SphereGeometry(1.8, 36, 36);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      emissiveIntensity: 0.35,
      wireframe: true,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.45,
    });
    this.globeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    this.globeGroup.add(this.globeSphere);

    // 2. Latitude & Longitude Coordinate Loops
    for (let i = -60; i <= 60; i += 30) {
      const rad = (i * Math.PI) / 180;
      const r = Math.cos(rad) * 1.82;
      const y = Math.sin(rad) * 1.82;

      const ringGeo = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        pts.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
      }
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const ringMat = new THREE.LineBasicMaterial({
        color: 0x84cc16,
        transparent: true,
        opacity: 0.4,
      });
      const loop = new THREE.LineLoop(ringGeo, ringMat);
      this.latLongRings.push(loop);
      this.globeGroup.add(loop);
    }

    // 3. Pinned GPS Beacon at Dhaka Coordinates [23.8° N, 90.36° E]
    const lat = 23.8 * (Math.PI / 180);
    const lon = 90.36 * (Math.PI / 180);
    const radius = 1.85;

    const beaconX = radius * Math.cos(lat) * Math.sin(lon);
    const beaconY = radius * Math.sin(lat);
    const beaconZ = radius * Math.cos(lat) * Math.cos(lon);

    const bGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const bMat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
    this.beaconMarker = new THREE.Mesh(bGeo, bMat);
    this.beaconMarker.position.set(beaconX, beaconY, beaconZ);
    this.globeGroup.add(this.beaconMarker);

    // Expanding Sonar Ping Ring around Beacon
    const pGeo = new THREE.RingGeometry(0.12, 0.16, 32);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.pingWaveRing = new THREE.Mesh(pGeo, pMat);
    this.pingWaveRing.position.set(beaconX, beaconY, beaconZ);
    this.pingWaveRing.lookAt(0, 0, 0);
    this.globeGroup.add(this.pingWaveRing);

    // Initial globe tilt to bring Dhaka to face the viewer
    this.globeGroup.rotation.y = -lon + 0.3;
    this.globeGroup.rotation.x = -lat * 0.4;
  }

  private setupEvents(): void {
    const el = this.canvasHost.nativeElement;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      this.pointerStart.x = e.clientX;
      this.pointerStart.y = e.clientY;
    });

    el.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      const deltaX = (e.clientX - this.pointerStart.x) * 0.007;
      const deltaY = (e.clientY - this.pointerStart.y) * 0.007;

      this.dragVelocity.x = deltaX;
      this.dragVelocity.y = deltaY;
      this.dragRotation.y += deltaX;
      this.dragRotation.x += deltaY;

      this.pointerStart.x = e.clientX;
      this.pointerStart.y = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });
  }

  private setupObservers(): void {
    const el = this.canvasHost.nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      if (!this.canvasHost || !this.renderer || !this.camera) return;
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (width === 0 || height === 0) return;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      const isDesktop = width >= 1024;
      this.globeGroup.position.set(isDesktop ? 2.4 : 0, isDesktop ? 0.2 : -0.6, 0);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    this.resizeObserver.observe(el);

    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    this.intersectionObserver.observe(el);
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

    // Momentum friction decay
    if (!this.isPointerDown) {
      this.dragRotation.y += this.dragVelocity.x;
      this.dragRotation.x += this.dragVelocity.y;
      this.dragVelocity.x *= 0.94;
      this.dragVelocity.y *= 0.94;
    }

    // Auto-orbit + drag rotation
    this.globeGroup.rotation.y = this.dragRotation.y + t * 0.15;
    this.globeGroup.rotation.x = this.dragRotation.x + Math.sin(t * 0.3) * 0.05;

    // Sonar Ping animation
    if (this.pingWaveRing) {
      const pingScale = 1.0 + (t % 1.5) * 1.6;
      this.pingWaveRing.scale.set(pingScale, pingScale, pingScale);
      (this.pingWaveRing.material as THREE.Material).opacity = Math.max(0, 1.0 - (t % 1.5) / 1.5);
    }

    this.renderer.render(this.scene, this.camera);
  };

  ngOnDestroy(): void {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.intersectionObserver) this.intersectionObserver.disconnect();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
