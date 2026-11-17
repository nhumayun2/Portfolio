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
  selector: 'app-experience-canvas',
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
export class ExperienceCanvasComponent implements AfterViewInit, OnDestroy {
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

  // Scene Objects
  private ribbonGroup = new THREE.Group();
  private ribbonMesh!: THREE.Mesh;
  private nodes: THREE.Mesh[] = [];
  private particleGrid!: THREE.Points;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildTimelineWorld();
      this.setupObservers();
      this.animate();
    });
  }

  private initThree(): void {
    const container = this.canvasHost.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 10);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.ribbonGroup);

    const isDesktop = width >= 1024;
    this.ribbonGroup.position.set(isDesktop ? -1.5 : 0, 0, 0);
  }

  private buildTimelineWorld(): void {
    const ambient = new THREE.AmbientLight(0x0f172a, 1.8);
    this.scene.add(ambient);

    const light1 = new THREE.DirectionalLight(0x84cc16, 2.8);
    light1.position.set(6, 6, 5);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0x38bdf8, 2.2);
    light2.position.set(-6, -4, 4);
    this.scene.add(light2);

    // 1. Kinetic Spline Career Ribbon
    const curvePoints = [
      new THREE.Vector3(-4.5, 4.0, -1.0),
      new THREE.Vector3(-1.8, 2.2, 0.8),
      new THREE.Vector3(1.2, 0.5, -0.6),
      new THREE.Vector3(-1.0, -1.8, 0.5),
      new THREE.Vector3(3.8, -3.5, -1.2),
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.045, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.65,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: true,
    });
    this.ribbonMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.ribbonGroup.add(this.ribbonMesh);

    // 2. Career Milestone Spheres with Glowing Rings
    const nodeColors = [0x84cc16, 0x38bdf8, 0xa855f7, 0xf59e0b];
    curvePoints.slice(0, 4).forEach((pt, i) => {
      const nodeGeo = new THREE.SphereGeometry(0.24, 24, 24);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: nodeColors[i],
        emissive: nodeColors[i],
        emissiveIntensity: 0.9,
        metalness: 0.9,
        roughness: 0.1,
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pt);
      this.nodes.push(nodeMesh);
      this.ribbonGroup.add(nodeMesh);

      // Orbital Halo Ring around each node
      const haloGeo = new THREE.TorusGeometry(0.45, 0.015, 16, 60);
      const haloMat = new THREE.MeshBasicMaterial({
        color: nodeColors[i],
        transparent: true,
        opacity: 0.7,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / (2 + i);
      halo.position.copy(pt);
      this.ribbonGroup.add(halo);
    });

    // 3. Flowing Dust Particles
    const pCount = 280;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x84cc16,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.particleGrid = new THREE.Points(pGeo, pMat);
    this.ribbonGroup.add(this.particleGrid);
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
      this.ribbonGroup.position.set(isDesktop ? -1.5 : 0, 0, 0);
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

    this.ribbonGroup.rotation.y = Math.sin(t * 0.25) * 0.15 + this.mouse.x * 0.3;
    this.ribbonGroup.rotation.x = Math.cos(t * 0.2) * 0.1 + this.mouse.y * 0.2;

    this.nodes.forEach((node, idx) => {
      const s = 1.0 + Math.sin(t * 2.5 + idx) * 0.15;
      node.scale.set(s, s, s);
    });

    if (this.particleGrid) {
      this.particleGrid.rotation.y = t * 0.04;
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
