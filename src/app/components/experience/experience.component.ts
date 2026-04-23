import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PortfolioService, Experience } from '../../services/portfolio';
import { ExperienceCardComponent } from '../../shared/experience-card/experience-card.component';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, ExperienceCardComponent],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css',
})
export class ExperienceComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Signal to store work history from your database
  experiences = signal<Experience[]>([]);

  ngOnInit(): void {
    // Standard SSR safety check for your Render backend
    if (isPlatformBrowser(this.platformId)) {
      this.loadExperiences();
    }
  }

  private loadExperiences(): void {
    this.portfolioService.getExperiences().subscribe({
      next: (data) => {
        // Sort experiences by date (newest first)
        const sorted = data.sort(
          (a, b) =>
            new Date(b.startDate || '').getTime() -
            new Date(a.startDate || '').getTime(),
        );
        this.experiences.set(sorted);
      },
      error: (err) => console.error('Error fetching experiences:', err),
    });
  }

  /**
   * Helper to format dates from the backend into a readable string
   * e.g., "Jan 2024 - Present"
   */
  formatDateRange(exp: Experience): string {
    const start = exp.startDate
      ? new Date(exp.startDate).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : 'Start';

    const end = exp.isCurrentRole
      ? 'Present'
      : exp.endDate
        ? new Date(exp.endDate).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })
        : 'End';

    return `${start} — ${end}`;
  }
}
