import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';
import { BentoGridItemComponent } from '../../shared/bento-grid/bento-grid-item.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, BentoGridItemComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Signal to hold your dynamic profile data for the email-copy card
  profile = signal<Profile | null>(null);

  ngOnInit(): void {
    // Only fetch data if we are in the browser.
    // This prevents the Render free-tier wake-up delay from crashing Angular SSR.
    if (isPlatformBrowser(this.platformId)) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) =>
        console.error('Error fetching profile for Bento Grid:', err),
    });
  }
}
