import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Profile } from '../../services/portfolio';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Signal to store your profile data (social links, email)
  profile = signal<Profile | null>(null);

  ngOnInit(): void {
    // Only fetch if in browser to prevent SSR timeouts
    if (isPlatformBrowser(this.platformId)) {
      this.loadContactInfo();
    }
  }

  private loadContactInfo(): void {
    this.portfolioService.getProfile().subscribe({
      next: (data) => this.profile.set(data),
      error: (err) => console.error('Error fetching contact info:', err),
    });
  }

  /**
   * Returns a list of social links for the template
   */
  get socials() {
    const data = this.profile();
    if (!data) return [];

    return [
      { icon: 'fab fa-github', url: data.gitHubUrl, name: 'GitHub' },
      { icon: 'fab fa-linkedin', url: data.linkedInUrl, name: 'LinkedIn' },
      { icon: 'fas fa-code', url: data.leetCodeUrl, name: 'LeetCode' },
    ].filter((s) => s.url); // Only show links that exist in the DB
  }
}
