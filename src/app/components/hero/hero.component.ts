import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  signal,
  OnInit,
  inject,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private ngZone = inject(NgZone);
  // Inject the Platform ID to check if we are in a browser or on the server
  private platformId = inject(PLATFORM_ID);

  @ViewChild('heroSection') heroSection!: ElementRef<HTMLElement>;
  @ViewChild('blobScene') blobScene!: ElementRef<HTMLElement>;
  @ViewChild('blob1') blob1!: ElementRef<HTMLElement>;
  @ViewChild('blob2') blob2!: ElementRef<HTMLElement>;
  @ViewChild('blob3') blob3!: ElementRef<HTMLElement>;
  @ViewChild('blobRing1') blobRing1!: ElementRef<HTMLElement>;
  @ViewChild('blobRing2') blobRing2!: ElementRef<HTMLElement>;

  profile = signal<Profile | null>(null);

  private mouseMoveHandler!: (e: MouseEvent) => void;
  private scrollHandler!: () => void;
  private rafId = 0;

  private readonly DEPTHS = [0.018, 0.032, 0.012, 0.022, 0.008];

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Error fetching profile:', err),
    });
  }

  ngAfterViewInit(): void {
    // ONLY run this if we are in the browser.
    // This prevents the "window is not defined" error on the server.
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.setupParallax();
        this.setupScrollParallax();
      });
    }
  }

  private setupParallax(): void {
    let targetX = 0,
      targetY = 0;
    let currentX = 0,
      currentY = 0;

    const blobs = [
      this.blob1?.nativeElement,
      this.blob2?.nativeElement,
      this.blob3?.nativeElement,
      this.blobRing1?.nativeElement,
      this.blobRing2?.nativeElement,
    ].filter((el) => !!el);

    this.mouseMoveHandler = (e: MouseEvent) => {
      const { innerWidth: W, innerHeight: H } = window;
      targetX = e.clientX - W / 2;
      targetY = e.clientY - H / 2;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      blobs.forEach((el, i) => {
        const dx = currentX * this.DEPTHS[i];
        const dy = currentY * this.DEPTHS[i];
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      this.rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', this.mouseMoveHandler, {
      passive: true,
    });
    this.rafId = requestAnimationFrame(animate);
  }

  private setupScrollParallax(): void {
    if (!this.blobScene) return;
    const scene = this.blobScene.nativeElement;

    this.scrollHandler = () => {
      const scrollY = window.scrollY;
      scene.style.transform = `translateY(${scrollY * 0.25}px)`;
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    // Again, only clean up if we are in the browser
    if (isPlatformBrowser(this.platformId)) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      window.removeEventListener('scroll', this.scrollHandler);
    }
  }
}
