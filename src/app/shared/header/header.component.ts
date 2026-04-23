import {
  Component,
  OnInit,
  HostListener,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // State Signals
  isScrolled = false;
  isMenuOpen = false;
  profile = signal<Profile | null>(null);

  ngOnInit(): void {
    // Only fetch data if we are in the browser to avoid SSR timeouts
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfileData();
    }
  }

  /**
   * Listens for the window scroll event.
   * If the user scrolls past 50px, we trigger the "Pill Mode" animation.
   */
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 50;
    }
  }

  private loadProfileData(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Header profile fetch failed:', err),
    });
  }

  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
