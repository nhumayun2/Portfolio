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
  selector: 'app-projects-canvas',
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
export class ProjectsCanvasComponent implements AfterViewInit, OnDestroy {
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

  // 3D Objects
  private stageGroup = new THREE.Group();
  private floatingCylinder!: THREE.Mesh;
  private wireframeCube!: THREE.Mesh;
  private laserPlane!: THREE.Mesh;
  private starfield!: THREE.Points;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildStageWorld();
      this.setupObservers();
      this.animate();
    });
  }

  private initThree(): void {
    const container = this.canvasHost.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 9);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.stageGroup);
  }

  private buildStageWorld(): void {
    const ambient = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambient);

    const light1 = new THREE.DirectionalLight(0x84cc16, 2.5);
    light1.position.set(5, 6, 4);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x38bdf8, 2.0);
    light2.position.set(-5, -4, 4);
    this.scene.add(light2);

    // 1. Holographic Pedestal Wireframe Cylinder
    const cylGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.4, 32, 2, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    this.floatingCylinder = new THREE.Mesh(cylGeo, cylMat);
    this.floatingCylinder.position.y = -2.6;
    this.stageGroup.add(this.floatingCylinder);

    // 2. Central Floating Hologram Wireframe Cube
    const cubeGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.7,
      wireframe: true,
      metalness: 0.9,
      roughness: 0.1,
    });
    this.wireframeCube = new THREE.Mesh(cubeGeo, cubeMat);
    this.wireframeCube.position.set(2.8, 0.5, -1.0);
    this.stageGroup.add(this.wireframeCube);

    // Inner glowing crystal inside cube
    const innerGeo = new THREE.OctahedronGeometry(0.8, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      wireframe: true,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    this.wireframeCube.add(innerMesh);

    // 3. Scanning Laser Grid Plane
    const planeGeo = new THREE.PlaneGeometry(16, 12, 16, 12);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    this.laserPlane = new THREE.Mesh(planeGeo, planeMat);
    this.laserPlane.rotation.x = -Math.PI / 2.6;
    this.laserPlane.position.y = -3.0;
    this.stageGroup.add(this.laserPlane);

    // 4. Stardust Particles
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.025,
      color: 0x84cc16,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    this.starfield = new THREE.Points(pGeo, pMat);
    this.stageGroup.add(this.starfield);
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
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
    this.resizeObserver.observe(el);

    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    this.intersectionObserver.observe(el);

    window.addEventListener('pointermove', (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mouse.targetX = nx;
      this.mouse.targetY = ny;
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

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    this.stageGroup.rotation.y = Math.sin(t * 0.18) * 0.1 + this.mouse.x * 0.25;

    if (this.wireframeCube) {
      this.wireframeCube.rotation.x += delta * 0.4;
      this.wireframeCube.rotation.y += delta * 0.6;
      this.wireframeCube.position.y = 0.5 + Math.sin(t * 1.5) * 0.2;
    }

    if (this.floatingCylinder) {
      this.floatingCylinder.rotation.y += delta * 0.2;
    }

    if (this.starfield) {
      this.starfield.rotation.y = t * 0.03;
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
