import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  PortfolioService,
  Experience,
  Education,
} from '../../services/portfolio';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css',
})
export class ExperienceComponent implements OnInit {
  private portfolioService = inject(PortfolioService);
  private platformId = inject(PLATFORM_ID);

  // Signals to store both datasets
  experiences = signal<Experience[]>([]);
  educations = signal<Education[]>([]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadJourneyData();
    }
  }

  private loadJourneyData(): void {
    // 1. Fetch Work Experience
    this.portfolioService.getExperiences().subscribe({
      next: (data) => {
        const sorted = data.sort(
          (a, b) =>
            new Date(b.startDate || '').getTime() -
            new Date(a.startDate || '').getTime(),
        );
        this.experiences.set(sorted);
      },
      error: (err) => console.error('Error fetching experiences:', err),
    });

    // 2. Fetch Education History
    this.portfolioService.getEducations().subscribe({
      next: (data) => {
        // Sort educations by end year (newest first)
        const sorted = data.sort((a, b) => {
          const yearA = a.endYear ? parseInt(a.endYear) : 9999; // 9999 puts "current" at top
          const yearB = b.endYear ? parseInt(b.endYear) : 9999;
          return yearB - yearA;
        });
        this.educations.set(sorted);
      },
      error: (err) => console.error('Error fetching educations:', err),
    });
  }

  // Format Dates for Experience
  formatExpDate(exp: Experience): string {
    const start = exp.startDate
      ? new Date(exp.startDate).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : '';
    const end = exp.isCurrentRole
      ? 'Present'
      : exp.endDate
        ? new Date(exp.endDate).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })
        : '';

    return start && end ? `${start} - ${end}` : start || end;
  }
}
