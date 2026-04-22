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
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  private portfolioService = inject(PortfolioService);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('blob2') blob2!: ElementRef<HTMLElement>;
  @ViewChild('blob3') blob3!: ElementRef<HTMLElement>;
  @ViewChild('blobRing') blobRing!: ElementRef<HTMLElement>;

  profile = signal<Profile | null>(null);

  private mouseMoveHandler!: (e: MouseEvent) => void;
  private rafId = 0;

  // Exact same depths used in your Hero section for that smooth, subtle movement
  private readonly DEPTHS = [0.032, 0.012, 0.022];

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
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.setupParallax();
      });
    }
  }

  private setupParallax(): void {
    let targetX = 0,
      targetY = 0;
    let currentX = 0,
      currentY = 0;

    const blobs = [
      this.blob2?.nativeElement,
      this.blob3?.nativeElement,
      this.blobRing?.nativeElement,
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

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('mousemove', this.mouseMoveHandler);
    }
  }
}
