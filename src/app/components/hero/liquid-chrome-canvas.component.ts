import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { SoundService } from '../../services/sound.service';

export type ShaderMode = 'chrome' | 'xray' | 'wireframe';

@Component({
  selector: 'app-liquid-chrome-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #canvasHost
      class="canvas-host absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing select-none"
      (dblclick)="cycleShaderMode()"
      title="Click and drag to orbit 3D kinetic cyber-core. Double-click to cycle shaders."
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
export class LiquidChromeCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasHost') canvasHost!: ElementRef<HTMLDivElement>;

  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private soundService = inject(SoundService);

  // Reactive Public State for HUD Telemetry
  public activeMode = signal<ShaderMode>('chrome');
  public rpm = signal<number>(144);
  public fps = signal<number>(60);
  public isDragging = signal<boolean>(false);

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private pmremGenerator!: THREE.PMREMGenerator;
  private envMapRenderTarget: THREE.WebGLRenderTarget | null = null;
  private animFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Scene Meshes & Groups
  private mainSculptureGroup = new THREE.Group();
  private mobiusKnot!: THREE.Mesh;
  private innerCrystalCore!: THREE.Mesh;
  private innerGlowCore!: THREE.Mesh;
  private gimbalRing1!: THREE.Mesh;
  private gimbalRing2!: THREE.Mesh;
  private gimbalRing3!: THREE.Mesh;
  private sensorNodesGroup = new THREE.Group();
  private streamParticles!: THREE.Points;
  private perspectiveGrid!: THREE.GridHelper;

  // Materials Cache for Switching
  private materials = {
    chrome: new THREE.MeshPhysicalMaterial({
      color: 0x1f2638,
      emissive: 0x050810,
      roughness: 0.08,
      metalness: 0.96,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      sheen: 0.9,
      sheenColor: 0x84cc16,
    }),
    xray: new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.94,
      thickness: 1.5,
      ior: 1.52,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    }),
    wireframe: new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.9,
      wireframe: true,
      metalness: 0.2,
      roughness: 0.5,
    }),
  };

  // Mouse & Physics Engine
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private isPointerDown = false;
  private pointerStart = { x: 0, y: 0 };
  private dragRotation = { x: 0, y: 0 };
  private dragVelocity = { x: 0, y: 0 };
  private pulseEnergy = 0;

  // FPS & Telemetry Tracking
  private frameCount = 0;
  private lastFpsCalcTime = 0;
  private startTime = 0;
  private lastTime = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initThree();
      this.setupStudioEnvironment();
      this.buildArtDirectedWorld();
      this.setupEvents();
      this.animate();
    });
  }

  private initThree(): void {
    const container = this.canvasHost.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060608, 0.035);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    const isDesktop = width >= 1024;
    this.mainSculptureGroup.position.x = isDesktop ? 1.4 : 0;
    this.mainSculptureGroup.position.y = isDesktop ? 0.05 : 0.35;
    this.camera.position.set(0, 0, isDesktop ? 7.5 : 8.6);

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
    this.scene.add(this.mainSculptureGroup);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
  }

  /**
   * Generates dynamic HDR Studio Softbox lighting so metallic and glass
   * materials reflect brilliant, authentic studio lighting.
   */
  private setupStudioEnvironment(): void {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();

    // 1. Top Key Softbox (Pure Platinum White)
    const topLightGeo = new THREE.PlaneGeometry(10, 10);
    const topLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const topMesh = new THREE.Mesh(topLightGeo, topLightMat);
    topMesh.position.set(0, 8, 2);
    topMesh.rotation.x = Math.PI / 2;
    envScene.add(topMesh);

    // 2. Neon Lime Rim Softbox (Left)
    const limeLightGeo = new THREE.PlaneGeometry(8, 12);
    const limeLightMat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
    const limeMesh = new THREE.Mesh(limeLightGeo, limeLightMat);
    limeMesh.position.set(-8, 0, -2);
    limeMesh.rotation.y = Math.PI / 2;
    envScene.add(limeMesh);

    // 3. Electric Cyan Fill Softbox (Right)
    const cyanLightGeo = new THREE.PlaneGeometry(8, 12);
    const cyanLightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cyanMesh = new THREE.Mesh(cyanLightGeo, cyanLightMat);
    cyanMesh.position.set(8, 0, 2);
    cyanMesh.rotation.y = -Math.PI / 2;
    envScene.add(cyanMesh);

    // 4. Warm Platinum Front Grazing Light
    const frontLightGeo = new THREE.PlaneGeometry(14, 6);
    const frontLightMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const frontMesh = new THREE.Mesh(frontLightGeo, frontLightMat);
    frontMesh.position.set(0, -5, 8);
    frontMesh.rotation.x = -Math.PI / 3;
    envScene.add(frontMesh);

    this.envMapRenderTarget = this.pmremGenerator.fromScene(envScene, 0.04);
    this.scene.environment = this.envMapRenderTarget.texture;
  }

  private buildArtDirectedWorld(): void {
    // 1. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(5, 8, 6);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x84cc16, 3.8);
    rimLight.position.set(-6, -3, -4);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
    fillLight.position.set(-4, 5, 3);
    this.scene.add(fillLight);

    // 2. Silky Hyper-Smooth Titanium-Chrome Möbius Sculpture
    // 17,920 polygons for 100% edge-free curvature
    const knotGeo = new THREE.TorusKnotGeometry(1.5, 0.44, 320, 56, 2, 3);
    knotGeo.computeVertexNormals();

    this.mobiusKnot = new THREE.Mesh(knotGeo, this.materials.chrome);
    this.mainSculptureGroup.add(this.mobiusKnot);

    // 3. Central Pulsing Octahedron Crystal Core & Inner Glow
    const crystalGeo = new THREE.OctahedronGeometry(0.65, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.85,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.innerCrystalCore = new THREE.Mesh(crystalGeo, crystalMat);
    this.mainSculptureGroup.add(this.innerCrystalCore);

    const glowGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x84cc16,
      transparent: true,
      opacity: 0.38,
    });
    this.innerGlowCore = new THREE.Mesh(glowGeo, glowMat);
    this.mainSculptureGroup.add(this.innerGlowCore);

    // 4. Aerospace Gimbal Assemblies (Gen Cherry Hardware Aesthetic)
    // Gimbal Ring 1: Slotted Mechanical Ring (Inner)
    const ringGeo1 = new THREE.TorusGeometry(2.65, 0.022, 16, 120);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      emissive: 0x84cc16,
      emissiveIntensity: 0.7,
      metalness: 0.95,
      roughness: 0.1,
    });
    this.gimbalRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.gimbalRing1.rotation.x = Math.PI / 3.2;
    this.mainSculptureGroup.add(this.gimbalRing1);

    // Gimbal Ring 2: Equatorial Sensor Ring (Middle)
    const ringGeo2 = new THREE.TorusGeometry(3.05, 0.016, 16, 140);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0xffffff,
      emissiveIntensity: 0.3,
      metalness: 0.98,
      roughness: 0.08,
    });
    this.gimbalRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.gimbalRing2.rotation.y = -Math.PI / 3.8;
    this.mainSculptureGroup.add(this.gimbalRing2);

    // Gimbal Ring 3: Deep Outer Trajectory Ring
    const ringGeo3 = new THREE.TorusGeometry(3.45, 0.012, 16, 160);
    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.15,
    });
    this.gimbalRing3 = new THREE.Mesh(ringGeo3, ringMat3);
    this.gimbalRing3.rotation.z = Math.PI / 6;
    this.mainSculptureGroup.add(this.gimbalRing3);

    // 8 Telemetry Sensor Nodes orbiting Ring 2
    const nodeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x84cc16 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 3.05, Math.sin(angle) * 3.05, 0);
      this.sensorNodesGroup.add(node);
    }
    this.gimbalRing2.add(this.sensorNodesGroup);

    // 5. Coherent Harmonic Stardust Stream (Pure Monochrome Silver/Lime)
    const pCount = 1200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    const silverColor = new THREE.Color(0xf8fafc);
    const limeColor = new THREE.Color(0x84cc16);

    for (let i = 0; i < pCount; i++) {
      const u = Math.random();
      const radius = 2.2 + Math.pow(u, 1.4) * 4.2;
      const angle = i * 0.18;
      const height = (Math.random() - 0.5) * 3.6;

      pPositions[i * 3] = Math.cos(angle) * radius;
      pPositions[i * 3 + 1] = height;
      pPositions[i * 3 + 2] = Math.sin(angle) * radius;

      const clr = Math.random() > 0.25 ? silverColor : limeColor;
      pColors[i * 3] = clr.r;
      pColors[i * 3 + 1] = clr.g;
      pColors[i * 3 + 2] = clr.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.024,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.streamParticles = new THREE.Points(pGeo, pMat);
    this.mainSculptureGroup.add(this.streamParticles);

    // 6. Perspective Horizon Grid (/nk.studio architectural spatial floor)
    this.perspectiveGrid = new THREE.GridHelper(60, 40, 0x84cc16, 0x1e2436);
    this.perspectiveGrid.position.y = -2.8;
    this.perspectiveGrid.position.z = -3;
    (this.perspectiveGrid.material as THREE.Material).transparent = true;
    (this.perspectiveGrid.material as THREE.Material).opacity = 0.25;
    this.scene.add(this.perspectiveGrid);
  }

  public setShaderMode(mode: ShaderMode): void {
    this.activeMode.set(mode);
    if (this.mobiusKnot) {
      this.mobiusKnot.material = this.materials[mode];
    }
    this.soundService.playClickSnap();
  }

  public cycleShaderMode(): void {
    const modes: ShaderMode[] = ['chrome', 'xray', 'wireframe'];
    const curIndex = modes.indexOf(this.activeMode());
    const nextMode = modes[(curIndex + 1) % modes.length];
    this.setShaderMode(nextMode);
  }

  private setupEvents(): void {
    const el = this.canvasHost.nativeElement;

    el.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      this.mouse.targetX = nx;
      this.mouse.targetY = ny;

      if (this.isPointerDown) {
        const deltaX = (e.clientX - this.pointerStart.x) * 0.007;
        const deltaY = (e.clientY - this.pointerStart.y) * 0.007;
        this.dragVelocity.x = deltaX;
        this.dragVelocity.y = deltaY;
        this.dragRotation.y += deltaX;
        this.dragRotation.x += deltaY;
        this.pointerStart.x = e.clientX;
        this.pointerStart.y = e.clientY;

        const velocityMag = Math.abs(deltaX) + Math.abs(deltaY);
        this.soundService.playDeformWobble(velocityMag);
      }
    });

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      this.isDragging.set(true);
      this.pointerStart.x = e.clientX;
      this.pointerStart.y = e.clientY;
      this.pulseEnergy = 1.0;
      this.soundService.playClickSnap();
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.isDragging.set(false);
    });

    el.addEventListener('pointerleave', () => {
      this.mouse.targetX = 0;
      this.mouse.targetY = 0;
      this.isPointerDown = false;
      this.isDragging.set(false);
    });
  }

  private onResize(): void {
    if (!this.canvasHost || !this.renderer || !this.camera) return;
    const container = this.canvasHost.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const isDesktop = width >= 1024;
    this.mainSculptureGroup.position.x = isDesktop ? 1.4 : 0;
    this.mainSculptureGroup.position.y = isDesktop ? 0.05 : 0.35;
    this.camera.position.set(0, 0, isDesktop ? 7.5 : 8.6);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate = (currentTime = 0): void => {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (!this.startTime) {
      this.startTime = currentTime;
      this.lastTime = currentTime;
      this.lastFpsCalcTime = currentTime;
    }
    const delta = Math.min((currentTime - this.lastTime) * 0.001, 0.1);
    this.lastTime = currentTime;
    const t = (currentTime - this.startTime) * 0.001;

    // FPS Calculation (Updated every 500ms)
    this.frameCount++;
    if (currentTime - this.lastFpsCalcTime >= 500) {
      const calculatedFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsCalcTime));
      this.fps.set(Math.min(calculatedFps, 60));
      this.frameCount = 0;
      this.lastFpsCalcTime = currentTime;
    }

    // Camera Parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;

    this.camera.position.x = this.mouse.x * 0.8;
    this.camera.position.y = this.mouse.y * 0.5;
    this.camera.lookAt(0, 0, 0);

    // Momentum rotation decay with Sweet Tape tactile friction
    if (!this.isPointerDown) {
      this.dragRotation.y += this.dragVelocity.x;
      this.dragRotation.x += this.dragVelocity.y;
      this.dragVelocity.x *= 0.94;
      this.dragVelocity.y *= 0.94;
    }

    // Dynamic RPM calculation (Gen Cherry Hardware telemetry)
    const currentSpeed = Math.sqrt(this.dragVelocity.x * this.dragVelocity.x + this.dragVelocity.y * this.dragVelocity.y);
    const dynamicRpm = Math.round(144 + currentSpeed * 2400 + Math.sin(t) * 12);
    if (this.frameCount % 10 === 0) {
      this.rpm.set(dynamicRpm);
    }

    // 4D Möbius Knot Rotation
    if (this.mobiusKnot) {
      this.mobiusKnot.rotation.y = this.dragRotation.y + t * 0.22;
      this.mobiusKnot.rotation.x = this.dragRotation.x + Math.sin(t * 0.4) * 0.2;
      this.mobiusKnot.rotation.z = Math.cos(t * 0.3) * 0.12;
    }

    // Inner Crystal Rotation & Breathing
    if (this.innerCrystalCore) {
      this.innerCrystalCore.rotation.y -= delta * 0.95;
      this.innerCrystalCore.rotation.z += delta * 0.65;
      const scale = 1.0 + Math.sin(t * 2.8) * 0.06 + this.pulseEnergy * 0.25;
      this.innerCrystalCore.scale.set(scale, scale, scale);
    }
    if (this.innerGlowCore) {
      const gScale = 1.0 + Math.sin(t * 2.8) * 0.1 + this.pulseEnergy * 0.4;
      this.innerGlowCore.scale.set(gScale, gScale, gScale);
    }

    // Aerospace Gimbal Rings Rotations
    if (this.gimbalRing1) {
      this.gimbalRing1.rotation.z += delta * 0.24;
    }
    if (this.gimbalRing2) {
      this.gimbalRing2.rotation.z -= delta * 0.18;
    }
    if (this.gimbalRing3) {
      this.gimbalRing3.rotation.x += delta * 0.14;
    }

    // Particle Drift
    if (this.streamParticles) {
      this.streamParticles.rotation.y = t * 0.06;
      this.streamParticles.rotation.x = Math.sin(t * 0.2) * 0.04;
    }

    if (this.pulseEnergy > 0) {
      this.pulseEnergy = Math.max(0, this.pulseEnergy - delta * 2.0);
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
    if (this.envMapRenderTarget) {
      this.envMapRenderTarget.dispose();
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
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
