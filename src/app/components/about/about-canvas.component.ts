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

  // Meshes
  private prismGroup = new THREE.Group();
  private outerPrism!: THREE.Mesh;
  private innerCrystal!: THREE.Mesh;
  private orbitalRing1!: THREE.Mesh;
  private orbitalRing2!: THREE.Mesh;
  private dataPoints!: THREE.Points;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildPrismWorld();
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
    this.camera.position.set(0, 0, 7.5);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.prismGroup);

    // Position the prism group to flank the right side on desktop
    const isDesktop = width >= 1024;
    this.prismGroup.position.set(isDesktop ? 2.5 : 0, isDesktop ? 0.2 : -0.5, 0);
  }

  private buildPrismWorld(): void {
    // Lighting
    const ambient = new THREE.AmbientLight(0x0f172a, 1.5);
    this.scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0x84cc16, 2.5);
    dirLight1.position.set(5, 5, 4);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    dirLight2.position.set(-5, -3, 3);
    this.scene.add(dirLight2);

    // 1. Outer Holographic Glass Icosahedron Prism
    const prismGeo = new THREE.IcosahedronGeometry(1.6, 0);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.85,
      thickness: 1.2,
      transparent: true,
      opacity: 0.65,
      wireframe: false,
    });
    this.outerPrism = new THREE.Mesh(prismGeo, prismMat);
    this.prismGroup.add(this.outerPrism);

    // Wireframe Cage for the Prism
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const wireMesh = new THREE.Mesh(prismGeo, wireMat);
    wireMesh.scale.set(1.02, 1.02, 1.02);
    this.prismGroup.add(wireMesh);

    // 2. Inner Glowing Octahedron Core
    const innerGeo = new THREE.OctahedronGeometry(0.75, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.9,
      wireframe: true,
      metalness: 0.8,
      roughness: 0.2,
    });
    this.innerCrystal = new THREE.Mesh(innerGeo, innerMat);
    this.prismGroup.add(this.innerCrystal);

    // 3. Orbital Holographic Coordinate Rings
    const ringGeo1 = new THREE.TorusGeometry(2.4, 0.015, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.5,
    });
    this.orbitalRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.orbitalRing1.rotation.x = Math.PI / 3;
    this.prismGroup.add(this.orbitalRing1);

    const ringGeo2 = new THREE.TorusGeometry(2.7, 0.01, 16, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    this.orbitalRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.orbitalRing2.rotation.y = -Math.PI / 4;
    this.prismGroup.add(this.orbitalRing2);

    // 4. Ambient Data Particles
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const radius = 1.8 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      pos[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.025,
      color: 0x84cc16,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    this.dataPoints = new THREE.Points(pGeo, pMat);
    this.prismGroup.add(this.dataPoints);
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
      this.prismGroup.position.set(isDesktop ? 2.5 : 0, isDesktop ? 0.2 : -0.5, 0);
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    this.resizeObserver.observe(el);

    // Pause when scrolled off-screen to preserve 60 FPS
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    this.intersectionObserver.observe(el);

    // Mouse listener
    window.addEventListener('pointermove', (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mouse.targetX = nx;
      this.mouse.targetY = ny;
    });
  }

  private animate = (currentTime = 0): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    if (!this.isVisible) return; // Save CPU/GPU when out of view

    if (!this.startTime) {
      this.startTime = currentTime;
      this.lastTime = currentTime;
    }
    const delta = Math.min((currentTime - this.lastTime) * 0.001, 0.1);
    this.lastTime = currentTime;
    const t = (currentTime - this.startTime) * 0.001;

    // Mouse Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.prismGroup.rotation.y = t * 0.25 + this.mouse.x * 0.4;
    this.prismGroup.rotation.x = Math.sin(t * 0.3) * 0.15 + this.mouse.y * 0.25;

    if (this.innerCrystal) {
      this.innerCrystal.rotation.y -= delta * 0.8;
      this.innerCrystal.rotation.z += delta * 0.5;
      const scale = 1.0 + Math.sin(t * 3.0) * 0.08;
      this.innerCrystal.scale.set(scale, scale, scale);
    }

    if (this.orbitalRing1) this.orbitalRing1.rotation.z += delta * 0.3;
    if (this.orbitalRing2) this.orbitalRing2.rotation.z -= delta * 0.22;
    if (this.dataPoints) this.dataPoints.rotation.y = -t * 0.1;

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
