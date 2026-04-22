import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  experiences = signal<Experience[]>([]);
  educations = signal<Education[]>([]);

  ngOnInit(): void {
    this.loadExperiences();
    this.loadEducations();
  }

  loadExperiences(): void {
    this.portfolioService.getExperiences().subscribe({
      next: (data) => this.experiences.set(data),
      error: (err) => console.error('Error fetching experiences:', err),
    });
  }

  loadEducations(): void {
    this.portfolioService.getEducations().subscribe({
      next: (data) => this.educations.set(data),
      error: (err) => console.error('Error fetching educations:', err),
    });
  }
}
