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
  selector: 'app-skills-canvas',
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
export class SkillsCanvasComponent implements AfterViewInit, OnDestroy {
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

  // Polyhedral Nodes Group
  private constellationGroup = new THREE.Group();
  private polyNodes: THREE.Mesh[] = [];
  private laserLines!: THREE.LineSegments;
  private ambientDust!: THREE.Points;

  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.buildConstellation();
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
    this.camera.position.set(0, 0, 11);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(this.renderer.domElement);
    this.scene.add(this.constellationGroup);
  }

  private buildConstellation(): void {
    const ambient = new THREE.AmbientLight(0x0f172a, 2.0);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x84cc16, 2.5);
    keyLight.position.set(5, 5, 5);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    fillLight.position.set(-5, -5, 3);
    this.scene.add(fillLight);

    // 6 Polyhedral Geometry Geometries for 6 Skill Categories
    const geometries = [
      new THREE.OctahedronGeometry(0.7, 0),         // 1. Languages
      new THREE.DodecahedronGeometry(0.65, 0),       // 2. Web & Mobile
      new THREE.TorusGeometry(0.55, 0.2, 16, 32),    // 3. Database & ORM
      new THREE.IcosahedronGeometry(0.7, 0),         // 4. Unreal / 3D
      new THREE.BoxGeometry(0.8, 0.8, 0.8),          // 5. Tools & DevOps
      new THREE.TetrahedronGeometry(0.75, 0),        // 6. AI-Assisted Eng
    ];

    const positions = [
      new THREE.Vector3(-4.8, 2.2, -1.0),
      new THREE.Vector3(0.0, 3.2, 0.5),
      new THREE.Vector3(4.8, 2.0, -0.8),
      new THREE.Vector3(-4.5, -2.4, 0.6),
      new THREE.Vector3(0.0, -3.2, -0.5),
      new THREE.Vector3(4.5, -2.2, 0.8),
    ];

    const colors = [0x84cc16, 0x38bdf8, 0xa855f7, 0x84cc16, 0x38bdf8, 0xf59e0b];

    // Create Meshes
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 0.6,
        wireframe: true,
        metalness: 0.8,
        roughness: 0.2,
      });

      const mesh = new THREE.Mesh(geometries[i], mat);
      mesh.position.copy(positions[i]);
      this.polyNodes.push(mesh);
      this.constellationGroup.add(mesh);

      // Inner glowing core
      const coreGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({ color: colors[i] });
      const core = new THREE.Mesh(coreGeo, coreMat);
      mesh.add(core);
    }

    // Dynamic Laser Lines connecting adjacent nodes
    const lineIndices = [
      0, 1, 1, 2,
      0, 3, 1, 4, 2, 5,
      3, 4, 4, 5,
    ];
    const linePositions: number[] = [];
    for (let i = 0; i < lineIndices.length; i += 2) {
      const p1 = positions[lineIndices[i]];
      const p2 = positions[lineIndices[i + 1]];
      linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.28,
    });
    this.laserLines = new THREE.LineSegments(lineGeo, lineMat);
    this.constellationGroup.add(this.laserLines);

    // Ambient Dust Particles
    const dustCount = 240;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 14;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.025,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    this.ambientDust = new THREE.Points(dustGeo, dustMat);
    this.constellationGroup.add(this.ambientDust);
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

    this.constellationGroup.rotation.y = Math.sin(t * 0.2) * 0.12 + this.mouse.x * 0.3;
    this.constellationGroup.rotation.x = Math.cos(t * 0.18) * 0.08 + this.mouse.y * 0.2;

    this.polyNodes.forEach((node, idx) => {
      node.rotation.x += delta * (0.6 + idx * 0.1);
      node.rotation.y += delta * (0.8 + idx * 0.1);
      const s = 1.0 + Math.sin(t * 2.2 + idx) * 0.08;
      node.scale.set(s, s, s);
    });

    if (this.ambientDust) {
      this.ambientDust.rotation.y = t * 0.05;
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
