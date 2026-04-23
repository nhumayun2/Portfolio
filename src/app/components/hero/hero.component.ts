import {
  Component,
  ElementRef,
  ViewChild,
  NgZone,
  signal,
  OnInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';
import gsap from 'gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Template References for GSAP Animations
  @ViewChild('welcomeBox') welcomeBox!: ElementRef;
  @ViewChild('heading') heading!: ElementRef;
  @ViewChild('paragraph') paragraph!: ElementRef;
  @ViewChild('button') button!: ElementRef;
  @ViewChild('heroImage') heroImage!: ElementRef;

  profile = signal<Profile | null>(null);

  ngOnInit(): void {
    // THE FIX: Only fetch data if we are in the browser.
    // This prevents SSR timeouts while waiting for the free Render backend to wake up.
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);

        // We use setTimeout(..., 0) to wait for Angular to update the DOM
        // to show our elements before we tell GSAP to animate them.
        setTimeout(() => {
          this.animateContent();
        }, 0);
      },
      error: (err) => console.error('Error fetching profile:', err),
    });
  }

  private animateContent(): void {
    // Double check we are in the browser before using GSAP
    if (!isPlatformBrowser(this.platformId)) return;

    // Create a GSAP timeline for sequential animations
    const tl = gsap.timeline();

    // 1. Slide down from Top (Welcome Box)
    if (this.welcomeBox) {
      tl.from(this.welcomeBox.nativeElement, {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    }

    // 2. Slide in from Left (Text & Button staggered)
    const leftElements = [];
    if (this.heading) leftElements.push(this.heading.nativeElement);
    if (this.paragraph) leftElements.push(this.paragraph.nativeElement);
    if (this.button) leftElements.push(this.button.nativeElement);

    if (leftElements.length > 0) {
      tl.from(
        leftElements,
        {
          x: -100,
          opacity: 0,
          duration: 0.5,
          stagger: 0.2, // 0.2 second delay between each element appearing
          ease: 'power3.out',
        },
        '-=0.2', // Overlap this animation slightly with the previous one
      );
    }

    // 3. Slide in from Right (Hero Image)
    if (this.heroImage) {
      tl.from(
        this.heroImage.nativeElement,
        {
          x: 100,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
        },
        '-=0.6',
      );
    }
  }
}
