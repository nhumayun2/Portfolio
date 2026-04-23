import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  PLATFORM_ID,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-globe',
  standalone: true,
  template: `
    <div
      #container
      class="w-full h-full min-h-[350px] flex items-center justify-center relative cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <div #canvasContainer class="w-full h-full absolute inset-0"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: any;
  private globe!: any;
  private frameId: number = 0;

  private readonly GLOBE_CONFIG = {
    globeColor: '#062056',
    showAtmosphere: true,
    atmosphereColor: '#3a228a',
    atmosphereAltitude: 0.15,
    polygonColor: 'rgba(255,255,255,0.7)',
  };

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.initScene();
      });
    }
  }

  private async initScene() {
    const { default: ThreeGlobe } = await import('three-globe');
    const { OrbitControls } =
      await import('three/examples/jsm/controls/OrbitControls.js');

    const width = this.canvasContainer.nativeElement.clientWidth;
    const height = this.canvasContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    this.camera.position.set(0, 0, 300);

    // Light Setup
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dLight.position.set(-200, 500, 200);
    this.scene.add(dLight);

    this.globe = new ThreeGlobe();
    const g = this.globe as any;

    const globeMaterial = this.globe.globeMaterial() as any;
    globeMaterial.color = new THREE.Color(this.GLOBE_CONFIG.globeColor);
    globeMaterial.emissive = new THREE.Color(0x110033);
    globeMaterial.emissiveIntensity = 0.2;

    g.showAtmosphere(this.GLOBE_CONFIG.showAtmosphere)
      .atmosphereColor(this.GLOBE_CONFIG.atmosphereColor)
      .atmosphereAltitude(this.GLOBE_CONFIG.atmosphereAltitude)
      .hexPolygonColor(() => this.GLOBE_CONFIG.polygonColor);

    // FIXED: Strategic real-world coordinates (London, NYC, Dhaka, Tokyo, Sydney, etc.)
    // This ensures arcs always land on landmasses.
    const arcsData = [
      { startLat: 23.81, startLng: 90.41, endLat: 40.71, endLng: -74.0 }, // Dhaka to NYC
      { startLat: 23.81, startLng: 90.41, endLat: 51.5, endLng: -0.12 }, // Dhaka to London
      { startLat: 51.5, startLng: -0.12, endLat: 35.67, endLng: 139.65 }, // London to Tokyo
      { startLat: 40.71, startLng: -74.0, endLat: -33.86, endLng: 151.2 }, // NYC to Sydney
      { startLat: 48.85, startLng: 2.35, endLat: -23.55, endLng: -46.63 }, // Paris to Sao Paulo
      { startLat: 35.67, startLng: 139.65, endLat: 23.81, endLng: 90.41 }, // Tokyo to Dhaka
    ];

    // UPDATED: Arc styling to be pure white and animated
    g.arcsData(arcsData)
      .arcColor(() => '#ffffff') // Pure White
      .arcDashLength(0.4)
      .arcDashGap(4)
      .arcDashAnimateTime(1500)
      .arcStroke(0.5);

    // LOAD LOCAL DATA
    try {
      const res = await fetch('/globe.json'); // Uses your local file
      const countries = await res.json();
      g.hexPolygonsData(countries.features);
      g.hexPolygonResolution(3);
      g.hexPolygonMargin(0.7);
    } catch (e) {
      console.error('Local globe.json not found, check your public folder', e);
    }

    this.scene.add(this.globe);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.8;

    this.animate();
    window.addEventListener('resize', this.onResize);
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    if (this.controls) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    const width = this.canvasContainer.nativeElement.clientWidth;
    const height = this.canvasContainer.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onResize);
      cancelAnimationFrame(this.frameId);
      this.renderer?.dispose();
    }
  }
}
