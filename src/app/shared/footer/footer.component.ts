import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Signal to hold your dynamic profile data
  profile = signal<Profile | null>(null);

  // Automatically gets the current year for the copyright
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Error fetching profile for footer:', err),
    });
  }

  // Smooth scroll method for a "Back to Top" button
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
