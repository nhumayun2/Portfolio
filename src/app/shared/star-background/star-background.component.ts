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
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-star-background',
  standalone: true,
  template: `
    <canvas
      #canvas
      class="fixed top-0 left-0 w-full h-full z-[5] pointer-events-none bg-transparent"
    >
    </canvas>
  `,
  styles: [],
})
export class StarBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private group!: THREE.Group;
  private points!: THREE.Points;
  private clock!: THREE.Clock;
  private animationFrameId: number = 0;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.initThreeJs();
      });
    }
  }

  private initThreeJs(): void {
    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // Crucial for showing the video behind the stars
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0); // Ensure canvas background is 100% transparent

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.z = 1;

    const pointsCount = 5000;
    const positions = new Float32Array(pointsCount * 3);
    const radius = 1.2;

    for (let i = 0; i < pointsCount; i++) {
      let x, y, z, distance;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        distance = x * x + y * y + z * z;
      } while (distance > 1.0);

      positions[i * 3] = x * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = z * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.002,
      transparent: true,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.group = new THREE.Group();
    this.group.add(this.points);
    this.group.rotation.set(0, 0, Math.PI / 4);
    this.scene.add(this.group);

    this.clock = new THREE.Clock();
    window.addEventListener('resize', this.onWindowResize);
    this.animate();
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    if (this.group && this.clock) {
      const delta = this.clock.getDelta();
      this.group.rotation.x -= delta / 10;
      this.group.rotation.y -= delta / 15;
    }
    this.renderer.render(this.scene, this.camera);
  };

  private onWindowResize = (): void => {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onWindowResize);
      cancelAnimationFrame(this.animationFrameId);
      if (this.points) {
        this.points.geometry.dispose();
        (this.points.material as THREE.Material).dispose();
      }
      if (this.renderer) this.renderer.dispose();
    }
  }
}
